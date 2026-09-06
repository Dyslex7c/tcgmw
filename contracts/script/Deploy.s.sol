// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "../src/MarketWarsCard.sol";
import "../src/MarketWarsPrizePool.sol";
import "../src/MarketWarsPackVRF.sol";
import "../src/MarketWarsMarketplace.sol";

contract DeployMarketWars {
    function run() external {
        // Deployment routine
        MarketWarsCard card = new MarketWarsCard();
        MarketWarsPrizePool prizePool = new MarketWarsPrizePool();
        MarketWarsPackVRF pack = new MarketWarsPackVRF(address(card), payable(address(prizePool)));
        MarketWarsMarketplace marketplace = new MarketWarsMarketplace(address(card), payable(address(prizePool)));

        // Permissions wiring
        card.setPackContract(address(pack));
        card.setMarketplaceContract(address(marketplace));
        prizePool.setAuthorizedContracts(address(pack), address(marketplace));
    }
}
