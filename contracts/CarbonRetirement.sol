// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

// Minimal IHederaTokenService interface for burnToken and associateToken
// The HTS precompile is at 0x167
interface IHederaTokenService {
    function burnToken(address token, uint64 amount) external returns (int256);
    function associateToken(address account, address token) external returns (int256);
}

contract CarbonRetirement is Ownable {
    using SafeERC20 for IERC20;

    // Hedera Token Service precompile address
    IHederaTokenService private constant HTS = IHederaTokenService(0x0000000000000000000000000000000000000167);

    // Event to log successful retirements
    event CarbonCreditsRetired(
        address indexed retierer,
        address indexed tokenAddress,
        uint256 amount,
        string ghgCertificateId // Keep this for off-chain linking
    );

    constructor() Ownable(msg.sender) {}

    // Function to retire fungible carbon credits
    // This function assumes the caller (msg.sender) has approved this contract
    // to spend 'amount' of 'tokenAddress' tokens.
    function retireFungibleCredits(
        address tokenAddress, // EVM address of the HTS fungible token
        uint256 amount,
        string memory ghgCertificateId
    ) public {
        // Ensure amount fits uint64 for the HTS precompile
        require(amount <= type(uint64).max, "Amount exceeds uint64 max for HTS burn");

        // 1. Transfer tokens from the sender to this contract
        // This requires msg.sender to have approved this contract beforehand.
        IERC20(tokenAddress).safeTransferFrom(msg.sender, address(this), amount);

        // 2. Burn the tokens from this contract's balance using HTS precompile
        int256 burnResult = HTS.burnToken(tokenAddress, uint64(amount));
        require(burnResult == 0, "Token burn failed via HTS precompile");

        // Emit event for off-chain listeners (e.g., your backend)
        emit CarbonCreditsRetired(msg.sender, tokenAddress, amount, ghgCertificateId);
    }

    // Optional: Function to associate a token with this contract
    // This is typically called once for each token this contract needs to interact with.
    function associateTokenWithContract(address tokenAddress) public onlyOwner {
        int256 response = HTS.associateToken(address(this), tokenAddress);
        require(response == 0, "Contract token association failed");
    }
}
