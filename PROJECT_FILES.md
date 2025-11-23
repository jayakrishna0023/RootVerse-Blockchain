# Unavu.io Project Structure

## 🎯 Essential Files Only

### Core Backend (Python)
- `main.py` - FastAPI backend server
- `auth_service.py` - User authentication & sessions
- `supabase_service.py` - Database operations
- `vechain_service.py` - Blockchain integration
- `requirements.txt` - Python dependencies

### Core Frontend (React + TypeScript)
- `src/main.tsx` - App entry point
- `src/App.tsx` - Main routing
- `src/index.css` - Global styles

### Key Pages
- `LoginPage.tsx` - User login
- `SignupPage.tsx` - User registration
- `LandingPage.tsx` - Public homepage
- `HomePage.tsx` - User dashboard
- `DataEntryPage.tsx` - Product/vessel registration
- `AdminPanelPage.tsx` - Admin dashboard
- `ProductVerifyPage.tsx` - QR code verification
- `ConsumerDashboard.tsx` - Public marketplace
- `VeChainBlockVerifyPage.tsx` - Blockchain explorer

### Database
- `CLEAN_DATABASE_SETUP.sql` - Complete database schema
- `delete_all_data.py` - Data cleanup script

### Configuration
- `.env` - Environment variables (DATABASE, VECHAIN, AUTH)
- `package.json` - Node.js dependencies
- `vite.config.ts` - Vite build config
- `tailwind.config.js` - Tailwind CSS config
- `tsconfig.json` - TypeScript config

### Documentation
- `TECHNICAL_DOCUMENTATION.md` - System architecture
- `PROJECT_FILES.md` - This file

## 🗑️ Removed Files
- Old migration SQL files (10+ files)
- Duplicate pages (FisherCatches, FisherBlog, etc.)
- Test data files
- Outdated documentation

## 📊 Current Structure
```
Unavu.io_block/
├── Backend (4 Python files)
├── Frontend (12 essential pages)
├── Database (2 SQL files)
├── Config (6 files)
└── Documentation (2 files)
```

**Total: ~25 essential files** (down from 40+)
