// Network: Robinhood Chain Mainnet (Chain ID: 4663)

export const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";

export const CONTRACT_CONFIG = {
  chainId: 4663,
  chainName: "Robinhood Chain",
  rpcUrl: "https://rpc.mainnet.chain.robinhood.com",
  explorerUrl: "https://robinhoodchain.blockscout.com",
  cardContract: "0x209139a7c49a2ea834daf5ff496008ea02b2fbba" as `0x${string}`,
  prizePoolContract: "0xdb2db0f2bd83cfb8d5f1db480caf661978624f56" as `0x${string}`,
  packContract: "0x1dc2656a699c1bf6d827c555c994f5fd89e1ff75" as `0x${string}`,
  marketplaceContract: "0xb20655cb8160350ece1897a86ebbf832b4c26851" as `0x${string}`,
  // AVOX Protocol Token Contract Address on Robinhood Chain Mainnet
  avoxTokenContract: "0xa8c46e442109a0a930a1a2aef7240b46d78f471f" as `0x${string}` | string
};

/**
 * Global single-variable export for AVOX Token Address.
 * Update CONTRACT_CONFIG.avoxTokenContract above to automatically sync across the app.
 */
export const AVOX_TOKEN_ADDRESS: string = CONTRACT_CONFIG.avoxTokenContract;

/**
 * Returns true if AVOX token address has been deployed/configured and is not the zero address.
 */
export const isAvoxTokenConfigured: boolean =
  Boolean(AVOX_TOKEN_ADDRESS) &&
  AVOX_TOKEN_ADDRESS.toLowerCase() !== ZERO_ADDRESS.toLowerCase();

export const CONTRACT_ADDRESSES = {
  ...CONTRACT_CONFIG
};

export function getExplorerTxUrl(txHash: string): string {
  return `${CONTRACT_CONFIG.explorerUrl}/tx/${txHash}`;
}

export function getExplorerAddressUrl(address: string): string {
  return `${CONTRACT_CONFIG.explorerUrl}/address/${address}`;
}
