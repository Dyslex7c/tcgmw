/**
 * Official blockchain logos referenced directly from TrustWallet's open-source assets repository:
 * https://github.com/trustwallet/assets/tree/master/blockchains
 */
const TRUSTWALLET_BASE = "https://raw.githubusercontent.com/trustwallet/assets/master/blockchains";

export const CHAIN_RAW_LOGOS: Record<string, string> = {
  // Primary EVM Chains
  ROBINHOOD: "https://raw.githubusercontent.com/homarr-labs/dashboard-icons/main/svg/robinhood.svg",
  HOOD: "https://raw.githubusercontent.com/homarr-labs/dashboard-icons/main/svg/robinhood.svg",
  ETH: `${TRUSTWALLET_BASE}/ethereum/info/logo.png`,
  ETHEREUM: `${TRUSTWALLET_BASE}/ethereum/info/logo.png`,
  ARBITRUM: `${TRUSTWALLET_BASE}/arbitrum/info/logo.png`,
  ARB: `${TRUSTWALLET_BASE}/arbitrum/info/logo.png`,
  OPTIMISM: `${TRUSTWALLET_BASE}/optimism/info/logo.png`,
  OP: `${TRUSTWALLET_BASE}/optimism/info/logo.png`,
  BASE: `${TRUSTWALLET_BASE}/base/info/logo.png`,
  AVAX: `${TRUSTWALLET_BASE}/avalanchec/info/logo.png`,
  AVALANCHE: `${TRUSTWALLET_BASE}/avalanchec/info/logo.png`,
  POLYGON: `${TRUSTWALLET_BASE}/polygon/info/logo.png`,
  MATIC: `${TRUSTWALLET_BASE}/polygon/info/logo.png`,
  BNB: `${TRUSTWALLET_BASE}/smartchain/info/logo.png`,
  BSC: `${TRUSTWALLET_BASE}/smartchain/info/logo.png`,
  ZKSYNC: `${TRUSTWALLET_BASE}/zksync/info/logo.png`,
  ZK: `${TRUSTWALLET_BASE}/zksync/info/logo.png`,
  MONAD: `${TRUSTWALLET_BASE}/monad/info/logo.png`,
  COSMOS: `${TRUSTWALLET_BASE}/cosmos/info/logo.png`,
  ATOM: `${TRUSTWALLET_BASE}/cosmos/info/logo.png`,
  APECHAIN: `${TRUSTWALLET_BASE}/ethereum/assets/0x4d224452801ACEd8B2F0aebE155379bb5D594381/logo.png`,
  APE: `${TRUSTWALLET_BASE}/ethereum/assets/0x4d224452801ACEd8B2F0aebE155379bb5D594381/logo.png`,
  GNOSIS: `${TRUSTWALLET_BASE}/xdai/info/logo.png`,
  XDAI: `${TRUSTWALLET_BASE}/xdai/info/logo.png`,
  GNO: `${TRUSTWALLET_BASE}/xdai/info/logo.png`,
  LINEA: `${TRUSTWALLET_BASE}/linea/info/logo.png`,
  WORLDCHAIN: "https://raw.githubusercontent.com/worldcoin/developer-docs/main/images/docs/worldchain-meta.png",
  WORLD: "https://raw.githubusercontent.com/worldcoin/developer-docs/main/images/docs/worldchain-meta.png",
  WLD: "https://raw.githubusercontent.com/worldcoin/developer-docs/main/images/docs/worldchain-meta.png",
  HEDERA: `${TRUSTWALLET_BASE}/hedera/info/logo.png`,
  HBAR: `${TRUSTWALLET_BASE}/hedera/info/logo.png`,

  // Additional chains in TrustWallet assets
  BTC: `${TRUSTWALLET_BASE}/bitcoin/info/logo.png`,
  SOL: `${TRUSTWALLET_BASE}/solana/info/logo.png`,
  DOGE: `${TRUSTWALLET_BASE}/doge/info/logo.png`,
  LINK: `${TRUSTWALLET_BASE}/ethereum/assets/0x514910771AF9Ca656af840dff83E8264EcF986CA/logo.png`,
  PEPE: `${TRUSTWALLET_BASE}/ethereum/assets/0x6982508145454Ce325dDbE47a25d4ec3d2311933/logo.png`,
  NEAR: `${TRUSTWALLET_BASE}/near/info/logo.png`,
  SUI: `${TRUSTWALLET_BASE}/sui/info/logo.png`,
  CARDANO: `${TRUSTWALLET_BASE}/cardano/info/logo.png`,
  POLKADOT: `${TRUSTWALLET_BASE}/polkadot/info/logo.png`,
  APTOS: `${TRUSTWALLET_BASE}/aptos/info/logo.png`,
  TRON: `${TRUSTWALLET_BASE}/tron/info/logo.png`,
  TON: `${TRUSTWALLET_BASE}/ton/info/logo.png`,
  RIPPLE: `${TRUSTWALLET_BASE}/ripple/info/logo.png`,
  FANTOM: `${TRUSTWALLET_BASE}/fantom/info/logo.png`
};

export function getChainLogoUrl(symbol: string): string {
  const upper = (symbol || "").toUpperCase();
  if (CHAIN_RAW_LOGOS[upper]) {
    return CHAIN_RAW_LOGOS[upper];
  }
  return `${TRUSTWALLET_BASE}/${symbol.toLowerCase()}/info/logo.png`;
}
