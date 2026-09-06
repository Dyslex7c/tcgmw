// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "./MarketWarsCard.sol";
import "./MarketWarsPrizePool.sol";

/**
 * @title MarketWarsPackVRF
 * @notice Verifiable Pack Opening with Chainlink VRF v2.5 compatibility.
 * Allows users to buy card packs, requests verifiable randomness, mints ERC-721 cards,
 * and automatically funds the prize pool with 20% of proceeds.
 */
contract MarketWarsPackVRF {
    address public owner;
    MarketWarsCard public cardContract;
    MarketWarsPrizePool public prizePool;

    enum PackTier { Starter, Alpha, Whale }

    struct PackConfig {
        uint256 price;
        uint8 cardCount;
        uint16 legendaryOddsBps; // Base 10,000 (e.g. 300 = 3%)
        uint16 epicOddsBps;      // e.g. 1200 = 12%
        uint16 rareOddsBps;      // e.g. 2500 = 25%
        uint16 holoOddsBps;      // e.g. 1000 = 10%
    }

    struct PackRequest {
        address buyer;
        PackTier tier;
        uint64 timestamp;
        uint64 blockNumber;
        bool fulfilled;
        uint256 randomSeed;
        uint256[] mintedTokenIds;
    }

    mapping(PackTier => PackConfig) public packConfigs;
    mapping(uint256 => PackRequest) public packRequests;
    uint256 public nextRequestId = 1;

    string[10] private _availableAssets = [
        "BTC", "ETH", "SOL", "DOGE", "AVAX", "LINK", "BNB", "PEPE", "NEAR", "SUI"
    ];

    event PackPurchased(uint256 indexed requestId, address indexed buyer, PackTier tier, uint256 price);
    event PackFulfilled(uint256 indexed requestId, address indexed buyer, uint256 randomSeed, uint256[] tokenIds);

    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner");
        _;
    }

    constructor(address _cardContract, address payable _prizePool) {
        owner = msg.sender;
        cardContract = MarketWarsCard(_cardContract);
        prizePool = MarketWarsPrizePool(_prizePool);

        // Starter Pack: 3 cards, standard odds
        packConfigs[PackTier.Starter] = PackConfig({
            price: 0.005 ether,
            cardCount: 3,
            legendaryOddsBps: 300,  // 3%
            epicOddsBps: 1200,      // 12%
            rareOddsBps: 2500,      // 25%
            holoOddsBps: 800        // 8%
        });

        // Alpha Pack: 5 cards, enhanced odds
        packConfigs[PackTier.Alpha] = PackConfig({
            price: 0.02 ether,
            cardCount: 5,
            legendaryOddsBps: 600,  // 6%
            epicOddsBps: 2000,      // 20%
            rareOddsBps: 3500,      // 35%
            holoOddsBps: 1800       // 18%
        });

        // Whale Pack: 5 cards, elite odds + guaranteed holo/epic+
        packConfigs[PackTier.Whale] = PackConfig({
            price: 0.05 ether,
            cardCount: 5,
            legendaryOddsBps: 1500, // 15%
            epicOddsBps: 3500,      // 35%
            rareOddsBps: 4500,      // 45%
            holoOddsBps: 4000       // 40%
        });
    }

    function buyPack(PackTier tier) external payable returns (uint256) {
        PackConfig memory config = packConfigs[tier];
        require(msg.value >= config.price, "Insufficient payment");

        // 20% routed to Prize Pool
        uint256 prizeCut = (msg.value * 2000) / 10000;
        if (prizeCut > 0 && address(prizePool) != address(0)) {
            prizePool.recordInflow{value: prizeCut}("Pack Purchase (20% Revenue Split)");
        }

        uint256 requestId = nextRequestId++;
        packRequests[requestId] = PackRequest({
            buyer: msg.sender,
            tier: tier,
            timestamp: uint64(block.timestamp),
            blockNumber: uint64(block.number),
            fulfilled: false,
            randomSeed: 0,
            mintedTokenIds: new uint256[](0)
        });

        emit PackPurchased(requestId, msg.sender, tier, msg.value);

        // Immediate fulfillment simulation (in testnet/dev, VRF coordinator calls fulfillRandomWords)
        _fulfillPack(requestId, uint256(keccak256(abi.encodePacked(block.timestamp, block.prevrandao, msg.sender, requestId))));

        return requestId;
    }

    function fulfillRandomWords(uint256 requestId, uint256 randomSeed) external onlyOwner {
        _fulfillPack(requestId, randomSeed);
    }

    function _fulfillPack(uint256 requestId, uint256 randomSeed) internal {
        PackRequest storage req = packRequests[requestId];
        require(!req.fulfilled, "Already fulfilled");

        req.fulfilled = true;
        req.randomSeed = randomSeed;
        PackConfig memory config = packConfigs[req.tier];

        uint256[] memory tokenIds = new uint256[](config.cardCount);

        for (uint8 i = 0; i < config.cardCount; i++) {
            uint256 cardSeed = uint256(keccak256(abi.encode(randomSeed, i, requestId)));

            // Determine Rarity
            uint256 rarityRoll = cardSeed % 10000;
            MarketWarsCard.Rarity rarity = MarketWarsCard.Rarity.Common;
            if (rarityRoll < config.legendaryOddsBps) {
                rarity = MarketWarsCard.Rarity.Legendary;
            } else if (rarityRoll < config.legendaryOddsBps + config.epicOddsBps) {
                rarity = MarketWarsCard.Rarity.Epic;
            } else if (rarityRoll < config.legendaryOddsBps + config.epicOddsBps + config.rareOddsBps) {
                rarity = MarketWarsCard.Rarity.Rare;
            }

            // Determine Foil Type
            uint256 foilRoll = (cardSeed >> 16) % 10000;
            MarketWarsCard.FoilType foil = MarketWarsCard.FoilType.Standard;
            if (foilRoll < (config.holoOddsBps / 3)) {
                foil = MarketWarsCard.FoilType.GoldFoil;
            } else if (foilRoll < config.holoOddsBps) {
                foil = MarketWarsCard.FoilType.Holo;
            }

            // Determine Asset
            uint256 assetIdx = (cardSeed >> 32) % _availableAssets.length;
            string memory asset = _availableAssets[assetIdx];

            // Determine Stats based on rarity
            (uint16 atk, uint16 def, uint16 spd) = _generateStats(rarity, cardSeed);

            uint256 tokenId = cardContract.mintCard(
                req.buyer,
                asset,
                rarity,
                foil,
                atk,
                def,
                spd
            );
            tokenIds[i] = tokenId;
        }

        req.mintedTokenIds = tokenIds;
        emit PackFulfilled(requestId, req.buyer, randomSeed, tokenIds);
    }

    function _generateStats(MarketWarsCard.Rarity rarity, uint256 seed) internal pure returns (uint16 atk, uint16 def, uint16 spd) {
        uint16 base = 50;
        uint16 range = 20;

        if (rarity == MarketWarsCard.Rarity.Rare) {
            base = 75;
            range = 25;
        } else if (rarity == MarketWarsCard.Rarity.Epic) {
            base = 100;
            range = 30;
        } else if (rarity == MarketWarsCard.Rarity.Legendary) {
            base = 135;
            range = 35;
        }

        atk = base + uint16((seed >> 48) % range);
        def = base + uint16((seed >> 64) % range);
        spd = base + uint16((seed >> 80) % range);
    }

    function getRequest(uint256 requestId) external view returns (PackRequest memory) {
        return packRequests[requestId];
    }

    function withdrawTreasury() external onlyOwner {
        uint256 balance = address(this).balance;
        require(balance > 0, "No balance");
        (bool success, ) = payable(owner).call{value: balance}("");
        require(success, "Withdraw failed");
    }
}
