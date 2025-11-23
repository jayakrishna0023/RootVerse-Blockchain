# UNAVU.IO — Seafood Supply Chain Technical Blueprint

This document outlines the technical architecture for the UNAVU.IO Seafood Traceability Platform, utilizing Supabase for data management and VeChain Thor for immutable blockchain verification.

## 1. System Architecture

### Core Components
1.  **Frontend**: React + Vite + Tailwind CSS (User Interface for Fishers, Distributors, Admins)
2.  **Backend**: Python FastAPI (API Layer)
3.  **Database**: Supabase PostgreSQL (Relational Data)
4.  **Blockchain**: VeChain Thor TestNet (Immutable Proof)
5.  **Storage**: Supabase Storage (Images, QR Codes)

### Data Flow
1.  **Trip Creation**: Fisher starts a trip -> Stored in Supabase (`trips`).
2.  **Catch Logging**: Fisher logs a catch -> Stored in Supabase (`fish_entries`) -> Hash anchored to VeChain.
3.  **QR Generation**: System generates a QR code linked to the Catch ID and Blockchain Hash.
4.  **Verification**: Consumers scan QR -> API fetches data from Supabase + Verifies against VeChain.

## 2. Database Schema (Supabase)

The system uses a relational model centered around `Trips` and `Fish Entries`.

*   **`users`**: Authentication and Role Management (`fisher`, `distributor`, `admin`).
*   **`vessels`**: Boat registry and details.
*   **`trips`**: Fishing expeditions with start/end times and locations.
*   **`fish_entries`**: Individual catch records (Species, Weight, Location). **(Blockchain Anchored)**
*   **`fish_quality_entries`**: Quality control logs.
*   **`cold_chain_logs`**: Temperature and transport logs.

## 3. Blockchain Integration (VeChain)

We use a **Data Anchoring** approach to minimize costs while ensuring integrity.

*   **What is stored on-chain?**
    *   `batch_id` / `qr_code` (Unique Identifier)
    *   `data_hash` (SHA256 hash of the critical data: Species, Weight, Location, Time)
    *   `timestamp`
*   **Verification Process**:
    1.  Fetch record from Database.
    2.  Re-calculate SHA256 hash of the data.
    3.  Fetch transaction from VeChain using the stored `tx_hash`.
    4.  Compare calculated hash with the hash stored on-chain.

## 4. Setup Instructions

### Prerequisites
*   Python 3.9+
*   Supabase Account
*   VeChain Wallet (TestNet)

### Step 1: Database Setup
Run the contents of `full_schema.sql` in your Supabase SQL Editor to create the required tables.

### Step 2: Environment Variables
Ensure your `.env` file contains:
```env
SUPABASE_URL=your_supabase_url
SUPABASE_KEY=your_supabase_anon_key
SUPABASE_SERVICE_KEY=your_supabase_service_key
VECHAIN_PRIVATE_KEY=your_wallet_private_key
VECHAIN_NODE_URL=https://sync-testnet.vechain.org
```

### Step 3: Fund Wallet
Visit [VeChain Faucet](https://faucet.vecha.in) and fund your wallet address.

### Step 4: Run Backend
```bash
uvicorn main:app --reload --port 8005
```

### Step 5: API Documentation
Access the Swagger UI at `http://localhost:8005/docs` to test endpoints.