// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";

contract CarbonRetirementLog is Ownable {
    event RetirementLogged(
        address indexed retiree,
        address indexed tokenAddress,
        uint256 amount,
        string ghgCertificateId,
        uint256 timestamp
    );

    constructor() Ownable(msg.sender) {}

    /**
     * @notice Emits a log for a carbon credit retirement.
     *         Backend SDK should verify and process actual burn + HCS submission.
     */
    function logRetirementIntent(
        address tokenAddress,
        uint256 amount,
        string memory ghgCertificateId
    ) external {
        require(amount > 0, "Amount must be greater than zero");
        require(bytes(ghgCertificateId).length > 0, "Certificate ID required");

        emit RetirementLogged(
            msg.sender,
            tokenAddress,
            amount,
            ghgCertificateId,
            block.timestamp
        );
    }
}
