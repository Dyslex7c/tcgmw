export const MarketWarsCardABI = [
  {
    "type": "function",
    "name": "mintCard",
    "inputs": [
      { "name": "to", "type": "address" },
      { "name": "assetSymbol", "type": "string" },
      { "name": "rarity", "type": "uint8" },
      { "name": "foilType", "type": "uint8" },
      { "name": "baseAtk", "type": "uint16" },
      { "name": "baseDef", "type": "uint16" },
      { "name": "baseSpd", "type": "uint16" }
    ],
    "outputs": [{ "name": "", "type": "uint256" }],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "getCard",
    "inputs": [{ "name": "tokenId", "type": "uint256" }],
    "outputs": [
      {
        "name": "",
        "type": "tuple",
        "components": [
          { "name": "assetSymbol", "type": "string" },
          { "name": "rarity", "type": "uint8" },
          { "name": "foilType", "type": "uint8" },
          { "name": "baseAtk", "type": "uint16" },
          { "name": "baseDef", "type": "uint16" },
          { "name": "baseSpd", "type": "uint16" },
          { "name": "mintedAt", "type": "uint64" }
        ]
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "ownerOf",
    "inputs": [{ "name": "tokenId", "type": "uint256" }],
    "outputs": [{ "name": "", "type": "address" }],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "balanceOf",
    "inputs": [{ "name": "account", "type": "address" }],
    "outputs": [{ "name": "", "type": "uint256" }],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "approve",
    "inputs": [
      { "name": "to", "type": "address" },
      { "name": "tokenId", "type": "uint256" }
    ],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "totalSupply",
    "inputs": [],
    "outputs": [{ "name": "", "type": "uint256" }],
    "stateMutability": "view"
  }
] as const;

export const MarketWarsPackVRFABI = [
  {
    "type": "function",
    "name": "buyPack",
    "inputs": [{ "name": "tier", "type": "uint8" }],
    "outputs": [{ "name": "", "type": "uint256" }],
    "stateMutability": "payable"
  },
  {
    "type": "function",
    "name": "getRequest",
    "inputs": [{ "name": "requestId", "type": "uint256" }],
    "outputs": [
      {
        "name": "",
        "type": "tuple",
        "components": [
          { "name": "buyer", "type": "address" },
          { "name": "tier", "type": "uint8" },
          { "name": "timestamp", "type": "uint64" },
          { "name": "blockNumber", "type": "uint64" },
          { "name": "fulfilled", "bool": true },
          { "name": "randomSeed", "type": "uint256" },
          { "name": "mintedTokenIds", "type": "uint256[]" }
        ]
      }
    ],
    "stateMutability": "view"
  }
] as const;

export const MarketWarsMarketplaceABI = [
  {
    "type": "function",
    "name": "listCard",
    "inputs": [
      { "name": "tokenId", "type": "uint256" },
      { "name": "price", "type": "uint256" }
    ],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "buyCard",
    "inputs": [{ "name": "tokenId", "type": "uint256" }],
    "outputs": [],
    "stateMutability": "payable"
  },
  {
    "type": "function",
    "name": "cancelListing",
    "inputs": [{ "name": "tokenId", "type": "uint256" }],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "getListing",
    "inputs": [{ "name": "tokenId", "type": "uint256" }],
    "outputs": [
      {
        "name": "",
        "type": "tuple",
        "components": [
          { "name": "tokenId", "type": "uint256" },
          { "name": "seller", "type": "address" },
          { "name": "price", "type": "uint256" },
          { "name": "listedAt", "type": "uint64" },
          { "name": "isActive", "type": "bool" }
        ]
      }
    ],
    "stateMutability": "view"
  }
] as const;

export const MarketWarsPrizePoolABI = [
  {
    "type": "function",
    "name": "currentSeasonPool",
    "inputs": [],
    "outputs": [{ "name": "", "type": "uint256" }],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "currentSeason",
    "inputs": [],
    "outputs": [{ "name": "", "type": "uint256" }],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "seasonEndTime",
    "inputs": [],
    "outputs": [{ "name": "", "type": "uint256" }],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "getRecentInflows",
    "inputs": [{ "name": "limit", "type": "uint256" }],
    "outputs": [
      {
        "name": "",
        "type": "tuple[]",
        "components": [
          { "name": "amount", "type": "uint256" },
          { "name": "timestamp", "type": "uint64" },
          { "name": "blockNumber", "type": "uint64" },
          { "name": "source", "type": "string" },
          { "name": "contributor", "type": "address" }
        ]
      }
    ],
    "stateMutability": "view"
  }
] as const;
