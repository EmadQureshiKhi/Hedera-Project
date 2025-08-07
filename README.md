# GreenTrace - Verifiable Carbon Management Platform

A comprehensive blockchain-powered platform for tracking, calculating, and verifying greenhouse gas emissions with immutable certificates and carbon offset marketplace on Hedera Hashgraph.

## 🌱 Sustainability Features

- **GHG Emissions Calculator**: Comprehensive tool for calculating Scope 1 and Scope 2 emissions with 200+ fuel types
- **Blockchain Certificates**: Verifiable emissions certificates minted as NFTs on Hedera with immutable audit trails
- **SEMA Tool**: Complete Stakeholder Engagement and Materiality Assessment for GRI-compliant sustainability reporting
- **Carbon Credit Marketplace**: Trade verified carbon offset credits with Hedera Token Service (HTS)
- **MetaMask Integration**: Client-side transaction confirmation for carbon credit retirement operations
- **Immutable Audit Trail**: All emissions data and transactions logged to Hedera Consensus Service (HCS)
- **Real-time Token Balance**: Live CO2e credit balance tracking via Hedera Mirror Node API

## 🔗 Hedera Integration

This platform leverages Hedera Hashgraph's sustainable blockchain technology with the following components:

### Core Infrastructure
- **Treasury Account**: `0.0.6362296` - Manages CO2e token supply and marketplace operations
- **CO2e Token**: `0.0.6503424` - Fungible token representing carbon offset credits
- **NFT Collection**: `0.0.6493589` - Non-fungible tokens for emissions certificates
- **HCS Topic**: `0.0.6493588` - Consensus service for immutable audit logging

### Smart Contracts
- **Carbon Retirement Log**: `0x7De9dc37043E5601ceF6a306B7C77b956d4DF703`
  - Handles carbon credit retirement intent logging
  - Emits `RetirementLogged` events for backend processing
  - Requires MetaMask confirmation for user transactions

### Blockchain Features
- **Hedera Token Service (HTS)**: CO2e credits and emissions certificate NFTs
- **Hedera Consensus Service (HCS)**: Immutable emissions data and transaction logging
- **Energy Efficient**: Hedera's proof-of-stake consensus uses minimal energy
- **Carbon Negative**: Hedera network is carbon negative, aligning with sustainability goals

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ 
- npm or yarn
- Hedera testnet account (for blockchain features)
- MetaMask wallet (for transaction confirmation)

### Installation

1. Clone the repository
```bash
git clone [YOUR_GITHUB_LINK_HERE]
cd greentrace-platform
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
- Google OAuth credentials (optional)

### Hedera Setup

1. Create a Hedera testnet account at [portal.hedera.com](https://portal.hedera.com)
2. Fund your account with testnet HBAR
3. Add your account ID and private key to `.env.local`
4. The platform uses pre-configured tokens and topics (see Hedera Integration section)

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

This service monitors the Hedera network for `RetirementLogged` events from the smart contract and processes:
- Token burns from user accounts
- HCS audit trail logging
- Certificate offset status updates

## 🏗️ Architecture

### Frontend
- **Next.js 14** with App Router and TypeScript
- **React 18** with modern hooks and context
- **Tailwind CSS** for responsive design
- **Radix UI** components for accessibility
- **Recharts** for data visualization
- **Framer Motion** for smooth animations

### Backend
- **Supabase** for database, authentication, and real-time features
- **Fastify** API server for additional endpoints
- **Hedera SDK** for native blockchain integration
- **ethers.js** for EVM smart contract interactions

### Blockchain
- **Hedera Hashgraph** for certificates, tokens, and consensus
- **Smart Contracts** for carbon retirement logging
- **IPFS** for metadata storage (mock implementation)
- **HashScan** for transaction verification and exploration

## 📊 Features

### GHG Calculator
- Comprehensive Scope 1 & 2 emissions calculation
- 200+ fuel types including fugitive gases
- Custom fuel types and equipment management
- Excel export functionality with multiple sheets
- Real-time data persistence per user
- Advanced emission factors database with regional adjustments

### Certificate Generation
- Blockchain-verified emissions certificates
- NFT minting on Hedera Token Service
- Immutable data logging to Hedera Consensus Service
- IPFS metadata storage with CID generation
- PDF export and sharing capabilities
- HashScan integration for verification

### SEMA Tool (Stakeholder Engagement & Materiality Assessment)
- Complete stakeholder engagement workflow
- Statistical sample size calculations
- Dual materiality assessment (external + internal)
- GRI framework compliance and disclosure mapping
- Risk assessment matrix visualization
- Automated reporting with Excel/PDF export

### Carbon Credit Marketplace
- Verified carbon offset project listings
- **MetaMask-Confirmed Transactions**: Users must approve retirement transactions in MetaMask
- Real-time token balance tracking via Hedera Mirror Node
- Hedera Token Service integration for credit transfers
- Transaction history with blockchain verification
- Offset tracking and certificate linking

### Backend Event Listener
- Monitors `RetirementLogged` events from smart contract
- Processes token burns automatically
- Updates certificate offset status
- Logs retirement audit trail to HCS
- Handles transaction status updates

## 🌍 Sustainability Impact

This platform contributes to environmental sustainability by:

1. **Transparency**: Immutable emissions tracking on carbon-negative Hedera
2. **Verification**: Blockchain-backed certificates prevent fraud and double-counting
3. **Efficiency**: Streamlined GHG calculations and automated reporting
4. **Compliance**: GRI-aligned sustainability reporting with materiality assessment
5. **User Control**: MetaMask confirmation ensures users control their carbon retirement decisions
6. **Carbon Negative**: Built on Hedera's carbon-negative network with minimal energy consumption

## 🔧 Configuration

### Hedera Network Configuration

The platform supports all Hedera networks:

- **Testnet**: For development and testing (default)
- **Previewnet**: For pre-production testing
- **Mainnet**: For production deployment

Set `NEXT_PUBLIC_HEDERA_NETWORK` in your environment variables.

### Required Environment Variables

```bash
# Hedera Configuration
NEXT_PUBLIC_HEDERA_ACCOUNT_ID=0.0.6362296
NEXT_PUBLIC_HEDERA_PRIVATE_KEY=your_private_key_here
NEXT_PUBLIC_HEDERA_NETWORK=testnet
NEXT_PUBLIC_HEDERA_NFT_TOKEN_ID=0.0.6493589
NEXT_PUBLIC_HEDERA_HCS_TOPIC_ID=0.0.6493588
NEXT_PUBLIC_HEDERA_EVM_PRIVATE_KEY=your_evm_private_key_here

# Carbon Credit Configuration
CARBON_RETIREMENT_LOG_EVM_ADDRESS=0x7De9dc37043E5601ceF6a306B7C77b956d4DF703
HCS_TOPIC_ID=0.0.6503501
CO2E_TOKEN_ID=0.0.6503424
CO2E_TOKEN_EVM_ADDRESS=0x0000000000000000000000000000000006503424

# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Google OAuth (optional)
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret

# WalletConnect (optional)
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your_walletconnect_project_id
```

## 📝 Hackathon Submission

This project is built for the **Hedera Hello Future: Origins** hackathon in the **Sustainability** track.

### Key Features for Judging

1. **Novel Blockchain Integration**: 
   - Uses Hedera's unique consensus service for emissions logging
   - Implements both native Hedera services (HTS/HCS) and EVM smart contracts
   - MetaMask integration for user-controlled transactions

2. **Real-world Utility**: 
   - Solves actual carbon tracking and verification problems
   - GRI-compliant sustainability reporting
   - Complete stakeholder engagement workflow

3. **Sustainability Focus**: 
   - Built on carbon-negative Hedera network
   - Comprehensive GHG calculation with 200+ fuel types
   - Transparent carbon offset marketplace

4. **Technical Excellence**: 
   - Modern architecture with TypeScript, Next.js, and Hedera SDK
   - Real-time data synchronization
   - Advanced UI/UX with responsive design

5. **Comprehensive Solution**: 
   - End-to-end emissions management platform
   - Multi-wallet support (MetaMask, Phantom, WalletConnect)
   - Complete audit trail with immutable verification

### On-chain Proof

- **Treasury Account**: [0.0.6362296](https://hashscan.io/testnet/account/0.0.6362296)
- **CO2e Token**: [0.0.6503424](https://hashscan.io/testnet/token/0.0.6503424)
- **NFT Collection**: [0.0.6493589](https://hashscan.io/testnet/token/0.0.6493589)
- **HCS Topic**: [0.0.6493588](https://hashscan.io/testnet/topic/0.0.6493588)
- **Smart Contract**: [0x7De9dc37043E5601ceF6a306B7C77b956d4DF703](https://hashscan.io/testnet/contract/0x7De9dc37043E5601ceF6a306B7C77b956d4DF703)

### Project Links

- **GitHub Repository**: [YOUR_GITHUB_LINK_HERE]
- **Demo Video**: [YOUR_YOUTUBE_DEMO_LINK_HERE]
- **Documentation**: [YOUR_GOOGLE_DRIVE_LINK_HERE]

## 🛠️ Development

### Project Structure

```
src/
├── app/                 # Next.js app router pages
├── components/          # React components
│   ├── ghg/            # GHG calculator components
│   ├── sema/           # SEMA tool components
│   ├── upload/         # File upload and processing
│   ├── certificates/   # Certificate management
│   ├── marketplace/    # Carbon credit marketplace
│   ├── dashboard/      # Analytics dashboard
│   ├── auth/           # Authentication components
│   └── ui/             # Reusable UI components
├── lib/                # Utility libraries
│   ├── hedera.ts       # Hedera SDK integration
│   ├── supabase.ts     # Database client and types
│   ├── auth.ts         # Authentication service
│   ├── api-client.ts   # API client with Hedera integration
│   └── emissions-calculator.ts # Enhanced emissions logic
├── hooks/              # React hooks for data fetching
├── types/              # TypeScript type definitions
├── data/               # Static data and emission factors
├── contexts/           # React context providers
└── utils/              # Utility functions
```

### Key Technologies

- **Hedera SDK**: Native blockchain integration for HTS, HCS, and account management
- **ethers.js**: EVM smart contract interactions and MetaMask integration
- **Supabase**: PostgreSQL database with real-time subscriptions and RLS
- **React Query**: Efficient data fetching and caching
- **Framer Motion**: Smooth animations and micro-interactions
- **Recharts**: Interactive data visualization
- **Papa Parse**: CSV processing for emissions data
- **XLSX**: Excel export with multiple sheets
- **Crypto-JS**: Data hashing for integrity verification


**User Flow with MetaMask:**
1. User initiates carbon credit retirement
2. MetaMask prompts for transaction confirmation
3. Smart contract logs retirement intent
4. Backend listener processes the event
5. Tokens are burned and HCS audit trail is created

## 🔄 Backend Event Listener

The backend listener service (`src/backend-listener/index.ts`) provides crucial automation:

### Functionality
- **Event Monitoring**: Polls Hedera Mirror Node for `RetirementLogged` events
- **Token Burning**: Automatically burns CO2e tokens from treasury supply
- **HCS Logging**: Creates immutable audit trail on Hedera Consensus Service
- **Database Updates**: Updates transaction status and certificate offset amounts
- **Error Handling**: Comprehensive error handling and transaction rollback

### Process Flow
1. User confirms retirement transaction in MetaMask
2. Smart contract emits `RetirementLogged` event
3. Backend listener detects the event via Mirror Node API
4. Listener burns the specified amount of CO2e tokens
5. Retirement details logged to HCS for audit trail
6. Database updated with transaction completion status

## 📊 Advanced Features

### Enhanced GHG Calculator
- **200+ Fuel Types**: Comprehensive database including fugitive gases
- **Custom Fuel Management**: Add organization-specific emission factors
- **Equipment Tracking**: Detailed source categorization
- **Real-time Persistence**: Auto-save across browser sessions
- **Excel Export**: Multi-sheet reports with calculations and custom data
- **Regional Factors**: Location-based emission factor adjustments

### SEMA Tool Capabilities
- **Stakeholder Scoring**: Multi-dimensional influence and dependency assessment
- **Sample Size Calculator**: Statistical calculations for engagement planning
- **Materiality Matrix**: Visual representation of topic importance
- **GRI Mapping**: Automatic disclosure standard alignment
- **Risk Assessment**: Internal impact evaluation with severity × likelihood
- **Report Generation**: Excel, PDF, and JSON export formats

### Marketplace Features
- **Real-time Pricing**: Dynamic carbon credit pricing
- **Project Verification**: Verified offset project listings
- **Token Integration**: Native Hedera Token Service for transfers
- **Transaction History**: Complete audit trail with HashScan links
- **Balance Tracking**: Live CO2e credit balance via Mirror Node API

## 🔐 Security & Authentication

### Multi-Wallet Support
- **MetaMask**: Ethereum-compatible wallet with transaction confirmation
- **Phantom**: Solana wallet integration
- **WalletConnect**: QR code-based wallet connection
- **Email/Google**: Traditional authentication with optional wallet linking

### Row Level Security (RLS)
- **Wallet-based Access**: Users can only access their own data
- **Auth Session Support**: Compatible with both wallet and email authentication
- **Secure Registration**: Protected user creation with validation

### Transaction Security
- **Client-side Signing**: MetaMask confirmation for retirement transactions
- **Server-side Operations**: Secure token burns and HCS logging
- **Immutable Audit**: All operations logged to Hedera Consensus Service

## 🌍 Environmental Impact

### Carbon Footprint Reduction
- **Accurate Tracking**: Precise emissions calculation with industry-standard factors
- **Verified Offsets**: Blockchain-verified carbon credit retirement
- **Transparency**: Public audit trail on carbon-negative blockchain
- **Efficiency**: Automated processes reduce administrative overhead

### Sustainability Reporting
- **GRI Compliance**: Aligned with Global Reporting Initiative standards
- **Stakeholder Engagement**: Systematic materiality assessment
- **Data Integrity**: Immutable record keeping for ESG reporting
- **Continuous Monitoring**: Real-time emissions and offset tracking

## 📄 License

MIT License - see LICENSE file for details.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📞 Support & Resources

### Project Links
- **GitHub Repository**: [YOUR_GITHUB_LINK_HERE]
- **Demo Video**: [YOUR_YOUTUBE_DEMO_LINK_HERE]
- **Documentation**: [YOUR_GOOGLE_DRIVE_LINK_HERE]

### Hedera Resources
- **Hedera Documentation**: [docs.hedera.com](https://docs.hedera.com)
- **HashScan Explorer**: [hashscan.io](https://hashscan.io)
- **Hedera Portal**: [portal.hedera.com](https://portal.hedera.com)

### Support Channels
- Create an issue on GitHub for bug reports
- Check documentation for implementation guides
- Contact the development team for enterprise inquiries

---

**Built with ❤️ for a sustainable future on Hedera**