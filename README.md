# RootVerse - Blockchain Agricultural Supply Chain

A comprehensive blockchain-based agricultural supply chain traceability platform built with VeChain, React, and FastAPI.

## 🌟 Features

- **Blockchain Verification**: Every product is anchored on VeChain TestNet for immutable traceability
- **Complete Supply Chain Tracking**: From farm/vessel to consumer with full transparency
- **QR Code Generation**: Automated QR codes for easy product verification
- **Real-time Dashboard**: Monitor products, fishers/farmers, and blockchain metrics
- **Multi-role Support**: Admin, Fisher/Farmer, and Consumer interfaces
- **Supabase Integration**: Secure PostgreSQL database with Row Level Security

## 🚀 Tech Stack

### Frontend
- **React 18** with TypeScript
- **Vite** for blazing-fast builds
- **TailwindCSS** for modern UI design
- **Framer Motion** for smooth animations
- **React Router** for navigation

### Backend
- **FastAPI** (Python) for high-performance API
- **Supabase** for PostgreSQL database and storage
- **VeChain Thor** blockchain integration
- **PIL** for QR code generation

## 📦 Installation

### Prerequisites
- Node.js 18+
- Python 3.9+
- Supabase account
- VeChain wallet (for blockchain operations)

### Frontend Setup
```bash
npm install
npm run dev
```

### Backend Setup
```bash
pip install -r requirements.txt
python main.py
```

## 🔧 Configuration

Create a `.env` file with:
```env
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_KEY=your_service_role_key
VECHAIN_PRIVATE_KEY=your_vechain_private_key
VECHAIN_WALLET_ADDRESS=your_wallet_address
PASSWORD_SALT=your_password_salt
JWT_SECRET=your_jwt_secret
```

## 📊 Database Schema

The system uses 5 core tables:
- **users**: Authentication and user profiles
- **vessels**: Fishing vessel registry
- **products**: Main product catalog with blockchain data
- **user_sessions**: Active user sessions
- **user_activity_logs**: Audit trail

## 🎯 Key Features

### Blockchain Integration
- Data anchoring on VeChain TestNet
- Block number and hash verification
- Gas-free operations using data anchoring approach

### Product Management
- Multi-field product registration
- Quality grading and certification tracking
- Processing and logistics details
- Storage and cold chain management

### Verification System
- QR code scanning
- Blockchain hash verification
- Complete product journey visualization
- Direct VeChain explorer links

## 🌐 Deployment

- Frontend: Vercel (configured with `vercel.json`)
- Backend: Any Python-compatible hosting
- Database: Supabase (managed PostgreSQL)

## 📄 License

MIT License - feel free to use for your projects!

## 👥 Contributors

Built with ❤️ for transparent agricultural supply chains
