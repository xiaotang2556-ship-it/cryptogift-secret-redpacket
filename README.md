# 🎁 CryptoGift - Secret Red Packet

> Built with FHEVM v0.9

A privacy-preserving red packet challenge where users guess a secret number. All guesses and the answer are encrypted using Fully Homomorphic Encryption (FHE).

## 🌟 Features

- 🔒 **Fully Private**: All guesses are encrypted on-chain
- 🎯 **Fair Play**: The secret number is encrypted and never revealed
- ⚡ **Instant Feedback**: Know if you're right or wrong without exposing your guess
- 🔄 **Unlimited Tries**: Keep guessing with no penalties

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- pnpm
- MetaMask or compatible Web3 wallet

### Installation
```bash
pnpm install
```

### Run Locally
```bash
# Start frontend
pnpm dev

# Compile contracts
pnpm hardhat:compile

# Deploy contracts
pnpm hardhat:deploy --network sepolia
```

## 🏗️ Architecture

- **FHEVM Version**: v0.9
- **Smart Contract**: SecretRedPacket.sol (deployed on Sepolia)
- **Frontend**: Next.js 15 + Tailwind CSS + RainbowKit
- **SDK**: Zama Relayer SDK 0.3.0-5

## 🔒 How It Works

1. The contract stores an encrypted secret number (e.g., 888)
2. Users submit encrypted guesses
3. Contract compares them using FHE operations (never decrypting)
4. Users decrypt their personal result: ✅ Correct or ❌ Wrong
5. The secret number remains encrypted forever

## 🎮 User Flow

1. Connect wallet
2. Enter a number (0-9999)
3. Submit encrypted guess
4. View result (encrypted comparison)
5. Try again unlimited times

## 📸 Demo

[Live Demo](https://your-vercel-url.vercel.app)

## 🛣️ Tech Stack

- **Smart Contract**: Solidity + FHEVM
- **Frontend**: Next.js 15, React 19, TypeScript
- **Styling**: Tailwind CSS
- **Web3**: RainbowKit, Wagmi, ethers.js
- **Encryption**: Zama Relayer SDK

## 📄 License

MIT

