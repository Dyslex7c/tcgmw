export const AvoxCardABI = [
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
  },
  {
    "type": "function",
    "name": "isApprovedForAll",
    "inputs": [
      { "name": "tokenOwner", "type": "address" },
      { "name": "operator", "type": "address" }
    ],
    "outputs": [{ "name": "", "type": "bool" }],
    "stateMutability": "view"
  },
  {
    "type": "event",
    "name": "Transfer",
    "inputs": [
      { "name": "from", "type": "address", "indexed": true },
      { "name": "to", "type": "address", "indexed": true },
      { "name": "tokenId", "type": "uint256", "indexed": true }
    ]
  },
  {
    "type": "event",
    "name": "Approval",
    "inputs": [
      { "name": "owner", "type": "address", "indexed": true },
      { "name": "approved", "type": "address", "indexed": true },
      { "name": "tokenId", "type": "uint256", "indexed": true }
    ]
  },
  {
    "type": "event",
    "name": "ApprovalForAll",
    "inputs": [
      { "name": "owner", "type": "address", "indexed": true },
      { "name": "operator", "type": "address", "indexed": true },
      { "name": "approved", "type": "bool", "indexed": false }
    ]
  },
  {
    "type": "event",
    "name": "CardMinted",
    "inputs": [
      { "name": "tokenId", "type": "uint256", "indexed": true },
      { "name": "to", "type": "address", "indexed": true },
      { "name": "assetSymbol", "type": "string", "indexed": false },
      { "name": "rarity", "type": "uint8", "indexed": false },
      { "name": "foilType", "type": "uint8", "indexed": false }
    ]
  }
] as const;

export const AvoxPackVRFABI = [
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
          { "name": "fulfilled", "type": "bool" },
          { "name": "randomSeed", "type": "uint256" },
          { "name": "mintedTokenIds", "type": "uint256[]" }
        ]
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "event",
    "name": "PackPurchased",
    "inputs": [
      { "name": "requestId", "type": "uint256", "indexed": true },
      { "name": "buyer", "type": "address", "indexed": true },
      { "name": "tier", "type": "uint8", "indexed": false },
      { "name": "price", "type": "uint256", "indexed": false }
    ]
  },
  {
    "type": "event",
    "name": "PackFulfilled",
    "inputs": [
      { "name": "requestId", "type": "uint256", "indexed": true },
      { "name": "buyer", "type": "address", "indexed": true },
      { "name": "randomSeed", "type": "uint256", "indexed": false },
      { "name": "tokenIds", "type": "uint256[]", "indexed": false }
    ]
  }
] as const;

export const AvoxMarketplaceABI = [
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
  },
  {
    "type": "event",
    "name": "ItemListed",
    "inputs": [
      { "name": "tokenId", "type": "uint256", "indexed": true },
      { "name": "seller", "type": "address", "indexed": true },
      { "name": "price", "type": "uint256", "indexed": false },
      { "name": "timestamp", "type": "uint64", "indexed": false }
    ]
  },
  {
    "type": "event",
    "name": "ItemSold",
    "inputs": [
      { "name": "tokenId", "type": "uint256", "indexed": true },
      { "name": "seller", "type": "address", "indexed": true },
      { "name": "buyer", "type": "address", "indexed": true },
      { "name": "price", "type": "uint256", "indexed": false },
      { "name": "fee", "type": "uint256", "indexed": false }
    ]
  },
  {
    "type": "event",
    "name": "ListingCancelled",
    "inputs": [
      { "name": "tokenId", "type": "uint256", "indexed": true },
      { "name": "seller", "type": "address", "indexed": true }
    ]
  }
] as const;

export const AvoxPrizePoolABI = [
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
  },
  {
    "type": "event",
    "name": "InflowReceived",
    "inputs": [
      { "name": "contributor", "type": "address", "indexed": true },
      { "name": "amount", "type": "uint256", "indexed": false },
      { "name": "source", "type": "string", "indexed": false },
      { "name": "season", "type": "uint256", "indexed": false }
    ]
  },
  {
    "type": "event",
    "name": "SeasonRolled",
    "inputs": [
      { "name": "oldSeason", "type": "uint256", "indexed": false },
      { "name": "newSeason", "type": "uint256", "indexed": false },
      { "name": "distributedAmount", "type": "uint256", "indexed": false }
    ]
  },
  {
    "type": "event",
    "name": "PrizeDistributed",
    "inputs": [
      { "name": "season", "type": "uint256", "indexed": true },
      { "name": "winner", "type": "address", "indexed": true },
      { "name": "rank", "type": "uint256", "indexed": false },
      { "name": "amount", "type": "uint256", "indexed": false }
    ]
  }
] as const;

// Backward-compatible aliases
export const MarketWarsCardABI = AvoxCardABI;
export const MarketWarsPackVRFABI = AvoxPackVRFABI;
export const MarketWarsMarketplaceABI = AvoxMarketplaceABI;
export const MarketWarsPrizePoolABI = AvoxPrizePoolABI;

