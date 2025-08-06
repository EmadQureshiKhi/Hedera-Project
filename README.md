# Omnichain GHG Platform & API

A comprehensive platform for tracking, calculating, and verifying greenhouse gas emissions with blockchain-powered certificates on Hedera Hashgraph.

## 🌱 Sustainability Features

- **GHG Emissions Calculator**: Comprehensive tool for calculating Scope 1 and Scope 2 emissions
- **Blockchain Certificates**: Verifiable emissions certificates minted as NFTs on Hedera
- **SEMA Tool**: Stakeholder Engagement and Materiality Assessment for sustainability reporting
- **Carbon Credit Marketplace**: Trade verified carbon offset credits
- **Immutable Audit Trail**: All emissions data logged to Hedera Consensus Service

## 🔗 Hedera Integration

This platform leverages Hedera Hashgraph's sustainable blockchain technology:

- **Hedera Token Service (HTS)**: Emissions certificates as NFTs
- **Hedera Consensus Service (HCS)**: Immutable emissions data logging
- **Energy Efficient**: Hedera's proof-of-stake consensus uses minimal energy
- **Carbon Negative**: Hedera network is carbon negative

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ 
- npm or yarn
- Hedera testnet account (for blockchain features)

### Installation

1. Clone the repository
```bash
git clone <your-repo-url>
cd omnichain-ghg-platform
```

2. Install dependencies
```bash
npm install
```

3. Set up environment variables
```bash
cp .env.example .env.local
```

Edit `.env.local` with your configuration:
- Supabase credentials
- Hedera account ID and private key (testnet)
- Network configuration

### Hedera Setup

1. Create a Hedera testnet account at [portal.hedera.com](https://portal.hedera.com)
2. Fund your account with testnet HBAR
3. Add your account ID and private key to `.env.local`
4. (Optional) Create NFT token and HCS topic for certificates

### Development

```bash
npm run dev
```

Visit `http://localhost:3000` to access the platform.

### Backend Event Listener

To process carbon credit retirement events, run the backend listener service:

```bash
npm run listener
```

This service monitors the Hedera network for `RetirementLogged` events from the smart contract and processes token burns and HCS logging.

## 🏗️ Architecture

### Frontend
- **Next.js 14** with App Router
- **React 18** with TypeScript
- **Tailwind CSS** for styling
- **Radix UI** components
- **Recharts** for data visualization

### Backend
- **Supabase** for database and authentication
- **Fastify** API server
- **Hedera SDK** for blockchain integration

### Blockchain
- **Hedera Hashgraph** for certificates and consensus
- **IPFS** for metadata storage (conceptual)
- **HashScan** for transaction verification

## 📊 Features

### GHG Calculator
- Scope 1 & 2 emissions calculation
- Custom fuel types and equipment
- Excel export functionality
- Data persistence per user
- Comprehensive emission factors database

### Certificate Generation
- Blockchain-verified certificates
- NFT minting on Hedera
- Immutable data logging
- PDF export and sharing
- HashScan integration

### SEMA Tool
- Stakeholder engagement management
- Materiality assessment
- Sample size calculations
- GRI framework compliance
- Automated reporting

### Marketplace
- Carbon credit trading
- Verified project listings
- Offset tracking
- Transaction history

## 🌍 Sustainability Impact

This platform contributes to environmental sustainability by:

1. **Transparency**: Immutable emissions tracking on Hedera
2. **Verification**: Blockchain-backed certificates prevent fraud
3. **Efficiency**: Streamlined GHG calculations and reporting
4. **Compliance**: GRI-aligned sustainability reporting
5. **Carbon Negative**: Built on Hedera's carbon-negative network

## 🔧 Configuration

### Hedera Network Configuration

The platform supports all Hedera networks:

- **Testnet**: For development and testing
- **Previewnet**: For pre-production testing
- **Mainnet**: For production deployment

Set `NEXT_PUBLIC_HEDERA_NETWORK` in your environment variables.

### Token and Topic Setup

For full functionality, you'll need:

1. **NFT Token**: Create once using `createNFTToken()` function
2. **HCS Topic**: Create once using `createHederaTopic()` function
3. **Update Environment**: Add token ID and topic ID to `.env.local`

## 📝 Hackathon Submission

This project is built for the **Hedera Hello Future: Origins** hackathon in the **Sustainability** track.

### Key Features for Judging

1. **Novel Blockchain Integration**: Uses Hedera's unique consensus service for emissions logging
2. **Real-world Utility**: Solves actual carbon tracking and verification problems
3. **Sustainability Focus**: Built on carbon-negative Hedera network
4. **Comprehensive Solution**: End-to-end emissions management platform
5. **Technical Excellence**: Modern architecture with TypeScript, Next.js, and Hedera SDK

### On-chain Proof

- **Account ID**: [Your Hedera Account ID]
- **HashScan Profile**: [Link to your HashScan account]
- **Sample Transactions**: [Links to certificate NFT mints and HCS messages]

## 🛠️ Development

### Project Structure

```
src/
├── app/                 # Next.js app router pages
├── components/          # React components
│   ├── ghg/            # GHG calculator components
│   ├── sema/           # SEMA tool components
│   ├── upload/         # File upload and processing
│   └── ui/             # Reusable UI components
├── lib/                # Utility libraries
│   ├── hedera.ts       # Hedera integration
│   ├── supabase.ts     # Database client
│   └── emissions-calculator.ts # Emissions logic
├── hooks/              # React hooks
├── types/              # TypeScript types
└── data/               # Static data and constants
```

### Key Technologies

- **Hedera SDK**: Blockchain integration
- **Supabase**: Database and auth
- **React Query**: Data fetching
- **Framer Motion**: Animations
- **Recharts**: Data visualization
- **Papa Parse**: CSV processing
- **XLSX**: Excel export

## 📄 License

MIT License - see LICENSE file for details.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📞 Support

For questions or support:
- Create an issue on GitHub
- Contact the development team
- Check Hedera documentation at [docs.hedera.com](https://docs.hedera.com)