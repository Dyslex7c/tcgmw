// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "./MarketWarsCard.sol";
import "./MarketWarsPrizePool.sol";

/**
 * @title MarketWarsMarketplace
 * @notice Secondary NFT marketplace for MarketWars trading cards.
 * 2.5% of every card sale routes automatically to the MarketWars Prize Pool.
 */
contract MarketWarsMarketplace {
    address public owner;
    MarketWarsCard public cardContract;
    MarketWarsPrizePool public prizePool;

    uint256 public feeBps = 250; // 2.5% marketplace protocol fee

    struct Listing {
        uint256 tokenId;
        address seller;
        uint256 price;
        uint64 listedAt;
        bool isActive;
    }

    // Token ID => Listing
    mapping(uint256 => Listing) public listings;
    uint256[] public activeListingIds;

    event ItemListed(uint256 indexed tokenId, address indexed seller, uint256 price, uint64 timestamp);
    event ItemSold(uint256 indexed tokenId, address indexed seller, address indexed buyer, uint256 price, uint256 fee);
    event ListingCancelled(uint256 indexed tokenId, address indexed seller);

    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner");
        _;
    }

    constructor(address _cardContract, address payable _prizePool) {
        owner = msg.sender;
        cardContract = MarketWarsCard(_cardContract);
        prizePool = MarketWarsPrizePool(_prizePool);
    }

    function listCard(uint256 tokenId, uint256 price) external {
        require(price > 0, "Price must be > 0");
        require(cardContract.ownerOf(tokenId) == msg.sender, "Not card owner");
        require(
            cardContract.isApprovedForAll(msg.sender, address(this)) ||
            cardContract.getApproved(tokenId) == address(this),
            "Marketplace not approved"
        );

        listings[tokenId] = Listing({
            tokenId: tokenId,
            seller: msg.sender,
            price: price,
            listedAt: uint64(block.timestamp),
            isActive: true
        });

        activeListingIds.push(tokenId);
        emit ItemListed(tokenId, msg.sender, price, uint64(block.timestamp));
    }

    function buyCard(uint256 tokenId) external payable {
        Listing storage listing = listings[tokenId];
        require(listing.isActive, "Listing not active");
        require(msg.value >= listing.price, "Insufficient payment");
        require(cardContract.ownerOf(tokenId) == listing.seller, "Seller no longer owns card");

        listing.isActive = false;
        address seller = listing.seller;
        uint256 price = listing.price;

        uint256 fee = (price * feeBps) / 10000;
        uint256 sellerProceeds = price - fee;

        // Route fee to prize pool
        if (fee > 0 && address(prizePool) != address(0)) {
            prizePool.recordInflow{value: fee}("Marketplace Trade Fee (2.5%)");
        }

        // Send proceeds to seller
        (bool successSeller, ) = payable(seller).call{value: sellerProceeds}("");
        require(successSeller, "Seller transfer failed");

        // Refund any overpayment
        if (msg.value > price) {
            (bool refundSuccess, ) = payable(msg.sender).call{value: msg.value - price}("");
            require(refundSuccess, "Refund failed");
        }

        // Transfer NFT to buyer
        cardContract.transferFrom(seller, msg.sender, tokenId);

        emit ItemSold(tokenId, seller, msg.sender, price, fee);
    }

    function cancelListing(uint256 tokenId) external {
        Listing storage listing = listings[tokenId];
        require(listing.isActive, "Listing not active");
        require(listing.seller == msg.sender || msg.sender == owner, "Not authorized");

        listing.isActive = false;
        emit ListingCancelled(tokenId, listing.seller);
    }

    function getListing(uint256 tokenId) external view returns (Listing memory) {
        return listings[tokenId];
    }
}
