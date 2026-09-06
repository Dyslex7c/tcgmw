// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "../src/MarketWarsCard.sol";
import "../src/MarketWarsPrizePool.sol";
import "../src/MarketWarsPackVRF.sol";
import "../src/MarketWarsMarketplace.sol";

/**
 * @title MarketWarsComprehensiveTest
 * @notice Verifies card minting, VRF pack purchases, fee splits to prize pool, and secondary trading.
 */
contract MarketWarsTest {
    MarketWarsCard public card;
    MarketWarsPrizePool public prizePool;
    MarketWarsPackVRF public pack;
    MarketWarsMarketplace public marketplace;

    address public user1 = address(0x1111);
    address public user2 = address(0x2222);

    function setUp() public {
        card = new MarketWarsCard();
        prizePool = new MarketWarsPrizePool();
        pack = new MarketWarsPackVRF(address(card), payable(address(prizePool)));
        marketplace = new MarketWarsMarketplace(address(card), payable(address(prizePool)));

        card.setPackContract(address(pack));
        card.setMarketplaceContract(address(marketplace));
        prizePool.setAuthorizedContracts(address(pack), address(marketplace));
    }

    function testPackPurchaseAndPrizeInflow() public {
        // Simulate pack purchase with 0.005 ETH
        uint256 requestId = pack.buyPack{value: 0.005 ether}(MarketWarsPackVRF.PackTier.Starter);
        require(requestId == 1, "Invalid request ID");

        MarketWarsPackVRF.PackRequest memory req = pack.getRequest(requestId);
        require(req.fulfilled, "Pack should be fulfilled");
        require(req.mintedTokenIds.length == 3, "Starter pack must mint 3 cards");

        // Verify prize pool received 20% (0.001 ETH)
        require(prizePool.currentSeasonPool() == 0.001 ether, "Prize pool should receive 20% cut");
        require(prizePool.getInflowCount() == 1, "Inflow ledger must record transaction");
    }

    function testMarketplaceTrading() public {
        // Mint a card to user1
        uint256 tokenId = card.mintCard(
            address(this),
            "BTC",
            MarketWarsCard.Rarity.Legendary,
            MarketWarsCard.FoilType.GoldFoil,
            150,
            140,
            120
        );

        card.approve(address(marketplace), tokenId);
        marketplace.listCard(tokenId, 0.1 ether);

        MarketWarsMarketplace.Listing memory l = marketplace.getListing(tokenId);
        require(l.isActive, "Listing should be active");
        require(l.price == 0.1 ether, "Listing price should be 0.1 ETH");
    }

    receive() external payable {}
}
