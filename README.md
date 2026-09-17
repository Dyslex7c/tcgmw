# ⚔️ AVOX

> **Web3 Trading Card Game (TCG) Powered by Live Crypto Market Volatility & Verifiable Smart Contracts**  
> Deployed on **Robinhood Chain Testnet** (`chainId: 46630`)

---

## ⚡ Overview

**AVOX** is an on-chain competitive TCG where cards represent real cryptocurrency assets and their in-battle stats update live from real-time price feeds. Cards gain massive buffs during rallies and suffer debuffs during market dumps. Packs are opened using verifiable on-chain randomness, and all cards are tradeable ERC-721 NFTs.

- 📈 **Live Volatility Scaling**: Real-time Binance / Pyth price feeds dynamically modify card ATK, DEF, and SPD mid-match.
- ❄️ **Pokémon-Style Elemental Combat**: Fast 3v3 blitz battles featuring **Freeze** (turn-skipping Cold Storage), **Burn** (damage-over-time), **Shock** (action fizzle & speed reduction), and **Poison** (escalating toxic damage).
- 🎲 **Verifiable Pack Openings**: Chainlink VRF v2.5-compatible randomness commitment and proof inspection.
- 🛒 **Non-Custodial Secondary Marketplace**: Buy, sell, and trade minted card NFTs with an automated 2.5% protocol fee routed to the prize pool.
- 🏆 **Community Prize Pool**: Transparent on-chain treasury automatically funded by 20% of all booster pack purchases and 2.5% of marketplace volume.
- 👛 **Reown AppKit Web3 Integration**: Seamless wallet connection supporting MetaMask, Coinbase Wallet, WalletConnect, and Rabby with native Robinhood network switching.
- 🔊 **Native Web Audio Engine**: 100% procedurally synthesized elemental sound effects directly through the Web Audio API.

---

## 📜 Full Documentation

For the comprehensive technical specification, mathematical formulas, smart contract ABIs, and architecture deep dive, see:

👉 **[DOCUMENTATION.md](./DOCUMENTATION.md)**

---

## 🔗 Smart Contract Deployments (Robinhood Chain Testnet)

All 4 contracts are verified on **Robinhood Chain Testnet** (Chain ID: `46630`):

| Contract | Address | Explorer Link |
| :--- | :--- | :--- |
| **AvoxCard** (ERC-721) | `0x209139a7c49a2ea834daf5ff496008ea02b2fbba` | [Robinhood Explorer](https://explorer.testnet.chain.robinhood.com/address/0x209139a7c49a2ea834daf5ff496008ea02b2fbba) |
| **AvoxPackVRF** | `0x1dc2656a699c1bf6d827c555c994f5fd89e1ff75` | [Robinhood Explorer](https://explorer.testnet.chain.robinhood.com/address/0x1dc2656a699c1bf6d827c555c994f5fd89e1ff75) |
| **AvoxMarketplace** | `0xb20655cb8160350ece1897a86ebbf832b4c26851` | [Robinhood Explorer](https://explorer.testnet.chain.robinhood.com/address/0xb20655cb8160350ece1897a86ebbf832b4c26851) |
| **AvoxPrizePool** | `0xdb2db0f2bd83cfb8d5f1db480caf661978624f56` | [Robinhood Explorer](https://explorer.testnet.chain.robinhood.com/address/0xdb2db0f2bd83cfb8d5f1db480caf661978624f56) |

---

## 🛠️ Quickstart

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment
Create `.env.local`:
```env
NEXT_PUBLIC_REOWN_PROJECT_ID=912198beeaebbbd8ecf6655c63be1884
NEXT_PUBLIC_DEFAULT_CHAIN_ID=46630
NEXT_PUBLIC_CARD_CONTRACT=0x209139a7c49a2ea834daf5ff496008ea02b2fbba
NEXT_PUBLIC_PRIZEPOOL_CONTRACT=0xdb2db0f2bd83cfb8d5f1db480caf661978624f56
NEXT_PUBLIC_PACK_CONTRACT=0x1dc2656a699c1bf6d827c555c994f5fd89e1ff75
NEXT_PUBLIC_MARKETPLACE_CONTRACT=0xb20655cb8160350ece1897a86ebbf832b4c26851
```

### 3. Run Development Server
```bash
npx next dev --webpack
```
Open [http://localhost:3000](http://localhost:3000).

### 4. Run Test Suite & Type Check
```bash
# Type check
npx tsc --noEmit

# Run core engine verification suite (12 tests)
npm test
```

---

## 🎮 Game Routes

- **`/`**: Home landing page & live market ticker marquee
- **`/battle`**: 3v3 Arena Coliseum with elemental moves & live volatility modifiers
- **`/packs`**: Booster pack cryptographic opening stage with VRF verification
- **`/marketplace`**: Secondary P2P trading market with on-chain escrow
- **`/prizepool`**: Real-time treasury inflows, countdown timer & payouts
- **`/profile`**: Deck builder, collection showcase & stats

---

*Built with Next.js 16, Viem, Reown AppKit, and Solidity on Robinhood Chain Testnet.*
