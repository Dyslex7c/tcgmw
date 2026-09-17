import fs from "fs";
import path from "path";
import {
  createPublicClient,
  createWalletClient,
  http,
  formatEther,
  Address,
  Hex
} from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { sepolia, baseSepolia, arbitrumSepolia, hardhat } from "viem/chains";

function loadEnv() {
  const envPath = path.resolve(__dirname, ".env");
  const env: Record<string, string> = {};
  if (fs.existsSync(envPath)) {
    const lines = fs.readFileSync(envPath, "utf-8").split("\n");
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const idx = trimmed.indexOf("=");
      if (idx !== -1) {
        const key = trimmed.slice(0, idx).trim();
        const val = trimmed.slice(idx + 1).trim();
        env[key] = val;
      }
    }
  }
  return env;
}

function loadArtifact(contractName: string) {
  const artifactPath = path.resolve(
    __dirname,
    "out",
    contractName + ".sol",
    contractName + ".json"
  );
  if (!fs.existsSync(artifactPath)) {
    throw new Error(
      "Artifact not found for " + contractName + " at " + artifactPath + ". Run forge build first."
    );
  }
  const raw = JSON.parse(fs.readFileSync(artifactPath, "utf-8"));
  return {
    abi: raw.abi,
    bytecode: (raw.bytecode.object.startsWith("0x")
      ? raw.bytecode.object
      : "0x" + raw.bytecode.object) as Hex
  };
}

async function deployContract(
  walletClient: any,
  publicClient: any,
  account: any,
  name: string,
  abi: any,
  bytecode: Hex,
  args: any[] = [],
  explorerBaseUrl: string,
  chain?: any
): Promise<Address> {
  console.log("\n⏳ Deploying " + name + "...");
  const hash = await (walletClient as any).deployContract({
    abi,
    bytecode,
    args,
    account,
    chain
  });
  console.log("   🚀 Transaction broadcast: " + hash);
  console.log("   🔗 Explorer: " + explorerBaseUrl + "/tx/" + hash);
  const receipt = await publicClient.waitForTransactionReceipt({ hash });
  if (!receipt.contractAddress) {
    throw new Error("Failed to deploy " + name + ": No contract address in receipt.");
  }
  console.log("   ✅ " + name + " deployed at: " + receipt.contractAddress);
  console.log("   ⛽ Gas used: " + receipt.gasUsed.toString() + " | Block #" + receipt.blockNumber);
  return receipt.contractAddress;
}

export async function main() {
  console.log("==================================================");
  console.log("          AVOX Smart Contract Deployer            ");
  console.log("==================================================");

  const env = loadEnv();
  const rawKey = env.PRIVATE_KEY || process.env.PRIVATE_KEY;
  const isTargetLocal = process.argv.includes("--local");
  const isBase = process.argv.includes("--base");
  const isArbitrum = process.argv.includes("--arbitrum");

  let privateKey: Hex;
  if (isTargetLocal) {
    privateKey = "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80";
  } else if (rawKey) {
    const cleanKey = rawKey.startsWith("0x") ? rawKey : "0x" + rawKey;
    if (cleanKey.length === 66) {
      privateKey = cleanKey as Hex;
    } else {
      throw new Error("Invalid PRIVATE_KEY length (" + cleanKey.length + " chars). Expected 64 hex chars or 66 chars with 0x prefix.");
    }
  } else {
    console.error("\n❌ Error: Valid deployer PRIVATE_KEY not found in contracts/.env");
    process.exit(1);
  }

  const account = privateKeyToAccount(privateKey);
  console.log("👤 Deployer Account: " + account.address);

  // Auto-detect chain or use specified flags
  let targetChain: any = sepolia;
  let rpcUrl = env.SEPOLIA_RPC || "https://ethereum-sepolia-rpc.publicnode.com";
  let explorer = "https://sepolia.etherscan.io";

  if (isTargetLocal) {
    targetChain = { ...hardhat, id: 31337 } as any;
    rpcUrl = "http://127.0.0.1:8545";
    explorer = "http://localhost:8545";
  } else if (isBase) {
    targetChain = baseSepolia;
    rpcUrl = env.BASE_SEPOLIA_RPC || "https://sepolia.base.org";
    explorer = "https://sepolia.basescan.org";
  } else if (isArbitrum) {
    targetChain = arbitrumSepolia;
    rpcUrl = env.ARBITRUM_SEPOLIA_RPC || "https://sepolia-rollup.arbitrum.io/rpc";
    explorer = "https://sepolia.arbiscan.io";
  } else {
    // Check balance on Sepolia first, then Base Sepolia
    const testSepolia = createPublicClient({ chain: sepolia, transport: http(rpcUrl) });
    const balSepolia = await testSepolia.getBalance({ address: account.address });
    if (balSepolia > BigInt(0)) {
      targetChain = sepolia;
      explorer = "https://sepolia.etherscan.io";
    } else {
      const testBase = createPublicClient({ chain: baseSepolia, transport: http(env.BASE_SEPOLIA_RPC || "https://sepolia.base.org") });
      const balBase = await testBase.getBalance({ address: account.address });
      if (balBase > BigInt(0)) {
        targetChain = baseSepolia;
        rpcUrl = env.BASE_SEPOLIA_RPC || "https://sepolia.base.org";
        explorer = "https://sepolia.basescan.org";
      }
    }
  }

  console.log("🌐 Target Network: " + targetChain.name + " (Chain ID: " + targetChain.id + ")");
  console.log("📡 RPC Endpoint:  " + rpcUrl);
  console.log("🔍 Block Explorer: " + explorer);

  const publicClient = createPublicClient({
    chain: targetChain,
    transport: http(rpcUrl)
  });

  const walletClient = createWalletClient({
    account,
    chain: targetChain,
    transport: http(rpcUrl)
  });

  const balance = await publicClient.getBalance({ address: account.address });
  console.log("💰 Deployer Balance: " + formatEther(balance) + " ETH");

  if (balance === BigInt(0)) {
    console.error("\n❌ Deployer account " + account.address + " has 0 ETH on " + targetChain.name + ".");
    console.error("   Please fund this address with testnet ETH and retry.");
    process.exit(1);
  }

  console.log("\n📦 Loading compiled contract artifacts...");
  const cardArtifact = loadArtifact("MarketWarsCard");
  const prizePoolArtifact = loadArtifact("MarketWarsPrizePool");
  const packArtifact = loadArtifact("MarketWarsPackVRF");
  const marketplaceArtifact = loadArtifact("MarketWarsMarketplace");

  // Step 1: Deploy Card
  const cardAddress = await deployContract(
    walletClient,
    publicClient,
    account,
    "MarketWarsCard",
    cardArtifact.abi,
    cardArtifact.bytecode,
    [],
    explorer,
    targetChain
  );

  // Step 2: Deploy Prize Pool
  const prizePoolAddress = await deployContract(
    walletClient,
    publicClient,
    account,
    "MarketWarsPrizePool",
    prizePoolArtifact.abi,
    prizePoolArtifact.bytecode,
    [],
    explorer,
    targetChain
  );

  // Step 3: Deploy Pack VRF
  const packAddress = await deployContract(
    walletClient,
    publicClient,
    account,
    "MarketWarsPackVRF",
    packArtifact.abi,
    packArtifact.bytecode,
    [cardAddress, prizePoolAddress],
    explorer,
    targetChain
  );

  // Step 4: Deploy Marketplace
  const marketplaceAddress = await deployContract(
    walletClient,
    publicClient,
    account,
    "MarketWarsMarketplace",
    marketplaceArtifact.abi,
    marketplaceArtifact.bytecode,
    [cardAddress, prizePoolAddress],
    explorer,
    targetChain
  );

  // Step 5: Wire permissions
  console.log("\n🔗 Wiring smart contract permissions...");

  console.log("   -> card.setPackContract(" + packAddress + ")...");
  const tx1 = await (walletClient as any).writeContract({
    address: cardAddress,
    abi: cardArtifact.abi,
    functionName: "setPackContract",
    args: [packAddress],
    account,
    chain: targetChain
  });
  console.log("      TX: " + explorer + "/tx/" + tx1);
  await publicClient.waitForTransactionReceipt({ hash: tx1 });

  console.log("   -> card.setMarketplaceContract(" + marketplaceAddress + ")...");
  const tx2 = await (walletClient as any).writeContract({
    address: cardAddress,
    abi: cardArtifact.abi,
    functionName: "setMarketplaceContract",
    args: [marketplaceAddress],
    account,
    chain: targetChain
  });
  console.log("      TX: " + explorer + "/tx/" + tx2);
  await publicClient.waitForTransactionReceipt({ hash: tx2 });

  console.log("   -> prizePool.setAuthorizedContracts(" + packAddress + ", " + marketplaceAddress + ")...");
  const tx3 = await (walletClient as any).writeContract({
    address: prizePoolAddress,
    abi: prizePoolArtifact.abi,
    functionName: "setAuthorizedContracts",
    args: [packAddress, marketplaceAddress],
    account,
    chain: targetChain
  });
  console.log("      TX: " + explorer + "/tx/" + tx3);
  await publicClient.waitForTransactionReceipt({ hash: tx3 });

  console.log("\n🎉 SUCCESS! All 4 contracts deployed and wired on " + targetChain.name + "!");
  console.log("==================================================");
  console.log("MarketWarsCard:        " + cardAddress);
  console.log("MarketWarsPrizePool:   " + prizePoolAddress);
  console.log("MarketWarsPackVRF:     " + packAddress);
  console.log("MarketWarsMarketplace: " + marketplaceAddress);
  console.log("==================================================");

  // Update contracts/.env
  const envFilePath = path.resolve(__dirname, ".env");
  let envFileContent = fs.existsSync(envFilePath) ? fs.readFileSync(envFilePath, "utf-8") : "";
  const replaceOrAppend = (content: string, key: string, val: string) => {
    const regex = new RegExp("^" + key + "=.*$", "m");
    if (regex.test(content)) {
      return content.replace(regex, key + "=" + val);
    }
    return content + "\n" + key + "=" + val;
  };

  envFileContent = replaceOrAppend(envFileContent, "NEXT_PUBLIC_CARD_CONTRACT", cardAddress);
  envFileContent = replaceOrAppend(envFileContent, "NEXT_PUBLIC_PRIZEPOOL_CONTRACT", prizePoolAddress);
  envFileContent = replaceOrAppend(envFileContent, "NEXT_PUBLIC_PACK_CONTRACT", packAddress);
  envFileContent = replaceOrAppend(envFileContent, "NEXT_PUBLIC_MARKETPLACE_CONTRACT", marketplaceAddress);
  envFileContent = replaceOrAppend(envFileContent, "NEXT_PUBLIC_DEFAULT_CHAIN_ID", targetChain.id.toString());
  fs.writeFileSync(envFilePath, envFileContent.trim() + "\n", "utf-8");
  console.log("💾 Updated contracts/.env with deployed addresses.");

  // Update .env.local in root
  const rootEnvPath = path.resolve(__dirname, "..", ".env.local");
  let rootEnv = fs.existsSync(rootEnvPath) ? fs.readFileSync(rootEnvPath, "utf-8") : "";
  rootEnv = replaceOrAppend(rootEnv, "NEXT_PUBLIC_CARD_CONTRACT", cardAddress);
  rootEnv = replaceOrAppend(rootEnv, "NEXT_PUBLIC_PRIZEPOOL_CONTRACT", prizePoolAddress);
  rootEnv = replaceOrAppend(rootEnv, "NEXT_PUBLIC_PACK_CONTRACT", packAddress);
  rootEnv = replaceOrAppend(rootEnv, "NEXT_PUBLIC_MARKETPLACE_CONTRACT", marketplaceAddress);
  rootEnv = replaceOrAppend(rootEnv, "NEXT_PUBLIC_DEFAULT_CHAIN_ID", targetChain.id.toString());
  fs.writeFileSync(rootEnvPath, rootEnv.trim() + "\n", "utf-8");
  console.log("💾 Updated .env.local with frontend environment variables.");

  // Update src/lib/constants/contracts.ts
  const contractsTsPath = path.resolve(__dirname, "..", "src", "lib", "constants", "contracts.ts");
  const tsContent = "// Automatically generated by contracts/deploy.ts\n" +
    "export const CONTRACT_CONFIG = {\n" +
    "  chainId: " + targetChain.id + ",\n" +
    "  chainName: \"" + targetChain.name + "\",\n" +
    "  rpcUrl: \"" + rpcUrl + "\",\n" +
    "  explorerUrl: \"" + explorer + "\",\n" +
    "  cardContract: \"" + cardAddress + "\" as const,\n" +
    "  prizePoolContract: \"" + prizePoolAddress + "\" as const,\n" +
    "  packContract: \"" + packAddress + "\" as const,\n" +
    "  marketplaceContract: \"" + marketplaceAddress + "\" as const\n" +
    "};\n";
  fs.writeFileSync(contractsTsPath, tsContent, "utf-8");
  console.log("💾 Updated src/lib/constants/contracts.ts");
}

if (require.main === module) {
  main().catch((err) => {
    console.error("\n❌ Deployment failed:", err);
    process.exit(1);
  });
}
