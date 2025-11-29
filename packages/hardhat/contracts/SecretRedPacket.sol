// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {FHE, euint32, externalEuint32, ebool} from "@fhevm/solidity/lib/FHE.sol";
import {ZamaEthereumConfig} from "@fhevm/solidity/config/ZamaConfig.sol";

/**
 * @title SecretRedPacket
 * @notice A demo contract for encrypted number guessing game (red packet theme)
 * @dev Users guess an encrypted secret number, and get encrypted result (correct/wrong)
 */
contract SecretRedPacket is ZamaEthereumConfig {
    // State variables
    euint32 private secretNumber;  // The encrypted secret answer
    
    mapping(address => euint32) public userResults;  // Encrypted results: 1=correct, 0=wrong
    mapping(address => bool) public hasGuessed;      // Track if user has guessed
    mapping(address => uint256) public lastGuessTime; // Track last guess timestamp
    
    // Events
    event GuessSubmitted(address indexed user, uint256 timestamp);
    event ResultReady(address indexed user);
    
    /**
     * @notice Constructor sets the secret number (encrypted)
     * @dev For demo: secret number is 888
     */
    constructor() {
        // Set secret number to 888 (you can change this)
        secretNumber = FHE.asEuint32(uint32(888));
        FHE.allowThis(secretNumber);  // Contract needs access to compare
    }
    
    /**
     * @notice Submit an encrypted guess
     * @param encryptedGuess The encrypted number from user (0-9999)
     * @param proof Zero-knowledge proof for the encrypted input
     */
    function submitGuess(
        externalEuint32 encryptedGuess,
        bytes calldata proof
    ) external {
        // Convert external encrypted input to internal format
        euint32 guess = FHE.fromExternal(encryptedGuess, proof);
        
        // Compare: is the guess equal to secret number?
        ebool isCorrect = FHE.eq(guess, secretNumber);
        
        // Convert boolean to number: true -> 1, false -> 0
        euint32 one = FHE.asEuint32(uint32(1));
        euint32 zero = FHE.asEuint32(uint32(0));
        euint32 result = FHE.select(isCorrect, one, zero);
        
        // Store encrypted result
        userResults[msg.sender] = result;
        hasGuessed[msg.sender] = true;
        lastGuessTime[msg.sender] = block.timestamp;
        
        // Grant permissions (CRITICAL for FHEVM v0.9)
        FHE.allowThis(result);         // Contract can return handle
        FHE.allow(result, msg.sender); // User can decrypt
        
        emit GuessSubmitted(msg.sender, block.timestamp);
        emit ResultReady(msg.sender);
    }
    
    /**
     * @notice Get encrypted result handle for decryption
     * @return bytes32 The encrypted handle to be decrypted on client side
     */
    function getMyResult() external view returns (bytes32) {
        require(hasGuessed[msg.sender], "You haven't guessed yet");
        return FHE.toBytes32(userResults[msg.sender]);
    }
    
    /**
     * @notice Check if user has made a guess
     * @param user The address to check
     * @return bool True if user has guessed
     */
    function hasUserGuessed(address user) external view returns (bool) {
        return hasGuessed[user];
    }
    
    /**
     * @notice Get user's last guess timestamp
     * @param user The address to check
     * @return uint256 The timestamp of last guess
     */
    function getUserLastGuessTime(address user) external view returns (uint256) {
        return lastGuessTime[user];
    }
}

