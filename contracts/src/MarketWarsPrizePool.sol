// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/**
 * @title MarketWarsPrizePool
 * @notice Transparent prize pool funded automatically by a percentage of all pack sales
 * and secondary marketplace trading fees.
 */
contract MarketWarsPrizePool {
    address public owner;
    address public packContract;
    address public marketplaceContract;

    struct InflowRecord {
        uint256 amount;
        uint64 timestamp;
        uint64 blockNumber;
        string source; // e.g. "Pack Purchase", "Marketplace Fee"
        address contributor;
    }

    uint256 public currentSeason = 1;
    uint256 public seasonEndTime;
    uint256 public totalHistoricalInflows;
    uint256 public currentSeasonPool;

    InflowRecord[] public inflowHistory;

    event InflowReceived(address indexed contributor, uint256 amount, string source, uint256 season);
    event SeasonRolled(uint256 oldSeason, uint256 newSeason, uint256 distributedAmount);
    event PrizeDistributed(uint256 indexed season, address indexed winner, uint256 rank, uint256 amount);

    modifier onlyAuthorized() {
        require(msg.sender == packContract || msg.sender == marketplaceContract || msg.sender == owner, "Not authorized");
        _;
    }

    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner");
        _;
    }

    constructor() {
        owner = msg.sender;
        seasonEndTime = block.timestamp + 30 days;
    }

    function setAuthorizedContracts(address _packContract, address _marketplaceContract) external onlyOwner {
        packContract = _packContract;
        marketplaceContract = _marketplaceContract;
    }

    receive() external payable {
        _recordInflow(msg.sender, msg.value, "Direct Donation");
    }

    function recordInflow(string calldata source) external payable onlyAuthorized {
        _recordInflow(msg.sender, msg.value, source);
    }

    function _recordInflow(address contributor, uint256 amount, string memory source) internal {
        require(amount > 0, "Zero amount");
        totalHistoricalInflows += amount;
        currentSeasonPool += amount;

        inflowHistory.push(InflowRecord({
            amount: amount,
            timestamp: uint64(block.timestamp),
            blockNumber: uint64(block.number),
            source: source,
            contributor: contributor
        }));

        emit InflowReceived(contributor, amount, source, currentSeason);
    }

    function getInflowCount() external view returns (uint256) {
        return inflowHistory.length;
    }

    function getRecentInflows(uint256 limit) external view returns (InflowRecord[] memory) {
        uint256 total = inflowHistory.length;
        if (total == 0) return new InflowRecord[](0);

        uint256 count = limit > total ? total : limit;
        InflowRecord[] memory recent = new InflowRecord[](count);

        for (uint256 i = 0; i < count; i++) {
            recent[i] = inflowHistory[total - 1 - i];
        }
        return recent;
    }

    function distributeSeasonPrizes(address[] calldata winners, uint256[] calldata percentagesBps) external onlyOwner {
        require(winners.length == percentagesBps.length, "Mismatched arrays");
        uint256 poolToDistribute = currentSeasonPool;
        uint256 totalDistributed = 0;

        for (uint256 i = 0; i < winners.length; i++) {
            uint256 payout = (poolToDistribute * percentagesBps[i]) / 10000;
            if (payout > 0 && winners[i] != address(0)) {
                totalDistributed += payout;
                (bool success, ) = payable(winners[i]).call{value: payout}("");
                require(success, "Payout failed");
                emit PrizeDistributed(currentSeason, winners[i], i + 1, payout);
            }
        }

        currentSeasonPool -= totalDistributed;
        uint256 previousSeason = currentSeason;
        currentSeason++;
        seasonEndTime = block.timestamp + 30 days;

        emit SeasonRolled(previousSeason, currentSeason, totalDistributed);
    }
}
