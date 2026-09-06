// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/**
 * @title MarketWarsCard
 * @notice ERC-721 NFT for MarketWars Trading Card Game.
 * Base stats are immutably minted on-chain, while live battle stats scale
 * with real-time crypto price movements.
 */
contract MarketWarsCard {
    string public name = "MarketWars Card";
    string public symbol = "MWCARD";

    enum Rarity { Common, Rare, Epic, Legendary }
    enum FoilType { Standard, Holo, GoldFoil }

    struct CardMetadata {
        string assetSymbol; // e.g. "BTC", "ETH", "SOL"
        Rarity rarity;
        FoilType foilType;
        uint16 baseAtk;
        uint16 baseDef;
        uint16 baseSpd;
        uint64 mintedAt;
    }

    uint256 private _nextTokenId = 1;
    address public owner;
    address public packContract;
    address public marketplaceContract;

    // Token ID => Owner
    mapping(uint256 => address) private _owners;
    // Owner => Balance
    mapping(address => uint256) private _balances;
    // Token ID => Approved operator
    mapping(uint256 => address) private _tokenApprovals;
    // Owner => Operator => Approved
    mapping(address => mapping(address => bool)) private _operatorApprovals;
    // Token ID => Card Metadata
    mapping(uint256 => CardMetadata) private _cards;

    event Transfer(address indexed from, address indexed to, uint256 indexed tokenId);
    event Approval(address indexed owner, address indexed approved, uint256 indexed tokenId);
    event ApprovalForAll(address indexed owner, address indexed operator, bool approved);
    event CardMinted(uint256 indexed tokenId, address indexed to, string assetSymbol, Rarity rarity, FoilType foilType);

    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner");
        _;
    }

    modifier onlyMinter() {
        require(msg.sender == packContract || msg.sender == owner, "Not authorized minter");
        _;
    }

    constructor() {
        owner = msg.sender;
    }

    function setPackContract(address _packContract) external onlyOwner {
        packContract = _packContract;
    }

    function setMarketplaceContract(address _marketplaceContract) external onlyOwner {
        marketplaceContract = _marketplaceContract;
    }

    function mintCard(
        address to,
        string calldata assetSymbol,
        Rarity rarity,
        FoilType foilType,
        uint16 baseAtk,
        uint16 baseDef,
        uint16 baseSpd
    ) external onlyMinter returns (uint256) {
        uint256 tokenId = _nextTokenId++;
        _owners[tokenId] = to;
        _balances[to] += 1;

        _cards[tokenId] = CardMetadata({
            assetSymbol: assetSymbol,
            rarity: rarity,
            foilType: foilType,
            baseAtk: baseAtk,
            baseDef: baseDef,
            baseSpd: baseSpd,
            mintedAt: uint64(block.timestamp)
        });

        emit Transfer(address(0), to, tokenId);
        emit CardMinted(tokenId, to, assetSymbol, rarity, foilType);

        return tokenId;
    }

    function getCard(uint256 tokenId) external view returns (CardMetadata memory) {
        require(_owners[tokenId] != address(0), "Card does not exist");
        return _cards[tokenId];
    }

    function totalSupply() external view returns (uint256) {
        return _nextTokenId - 1;
    }

    function ownerOf(uint256 tokenId) public view returns (address) {
        address tokenOwner = _owners[tokenId];
        require(tokenOwner != address(0), "Nonexistent token");
        return tokenOwner;
    }

    function balanceOf(address account) external view returns (uint256) {
        require(account != address(0), "Zero address query");
        return _balances[account];
    }

    function approve(address to, uint256 tokenId) external {
        address tokenOwner = ownerOf(tokenId);
        require(msg.sender == tokenOwner || isApprovedForAll(tokenOwner, msg.sender), "Not authorized to approve");
        _tokenApprovals[tokenId] = to;
        emit Approval(tokenOwner, to, tokenId);
    }

    function getApproved(uint256 tokenId) public view returns (address) {
        require(_owners[tokenId] != address(0), "Token does not exist");
        return _tokenApprovals[tokenId];
    }

    function setApprovalForAll(address operator, bool approved) external {
        require(operator != msg.sender, "Approve to caller");
        _operatorApprovals[msg.sender][operator] = approved;
        emit ApprovalForAll(msg.sender, operator, approved);
    }

    function isApprovedForAll(address tokenOwner, address operator) public view returns (bool) {
        if (operator == marketplaceContract) return true;
        return _operatorApprovals[tokenOwner][operator];
    }

    function transferFrom(address from, address to, uint256 tokenId) public {
        require(_isApprovedOrOwner(msg.sender, tokenId), "Not approved or owner");
        require(ownerOf(tokenId) == from, "From is not token owner");
        require(to != address(0), "Transfer to zero address");

        delete _tokenApprovals[tokenId];
        _balances[from] -= 1;
        _balances[to] += 1;
        _owners[tokenId] = to;

        emit Transfer(from, to, tokenId);
    }

    function _isApprovedOrOwner(address spender, uint256 tokenId) internal view returns (bool) {
        address tokenOwner = ownerOf(tokenId);
        return (spender == tokenOwner || isApprovedForAll(tokenOwner, spender) || getApproved(tokenId) == spender);
    }
}
