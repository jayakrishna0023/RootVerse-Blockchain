"""
🌱 ROOT VERSE - VeChain Blockchain Backend with Supabase
Real blockchain integration with VeChain TestNet for Agricultural Supply Chain
Database: Supabase PostgreSQL | Storage: Supabase Storage
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, StreamingResponse, RedirectResponse
from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from datetime import datetime, timedelta
import hashlib
import uuid
import asyncio
import json
import qrcode
import qrcode.image.svg
from PIL import Image, ImageDraw, ImageFont
import io
import base64
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Import services
from vechain_service import vechain_service, register_product_on_blockchain, verify_product_on_blockchain, get_network_status, check_wallet_funding
from supabase_service import SupabaseService, init_supabase_service, get_supabase_service
from auth_service import AuthService, init_auth_service, get_auth_service
# from catches_api_endpoints import catches_router # Deprecated in favor of fish-entries
from fastapi import Body
from fastapi import UploadFile, File, Form
import urllib.request
import urllib.error
import ssl
import os
import logging

# Configure logging
logger = logging.getLogger(__name__)
logging.basicConfig(level=logging.INFO)

# Helper function for datetime parsing
def parse_datetime_flexible(date_string: str) -> datetime:
    """Parse datetime string with multiple format support"""
    if not date_string:
        return datetime.utcnow()
    
    # Remove timezone info that might cause issues
    date_string = date_string.replace('Z', '+00:00')
    
    # Try different parsing methods
    try:
        # Try ISO format first
        return datetime.fromisoformat(date_string)
    except ValueError:
        try:
            # Try with microseconds truncated
            if '.' in date_string:
                # Truncate microseconds to 6 digits max
                parts = date_string.split('.')
                if len(parts) == 2:
                    microseconds = parts[1][:6]  # Take only first 6 digits
                    if '+' in microseconds:
                        tz_part = '+' + microseconds.split('+')[1]
                        microseconds = microseconds.split('+')[0]
                    elif '-' in microseconds:
                        tz_part = '-' + microseconds.split('-')[1]
                        microseconds = microseconds.split('-')[0]
                    else:
                        tz_part = ''
                    
                    date_string = f"{parts[0]}.{microseconds}{tz_part}"
                    return datetime.fromisoformat(date_string)
        except ValueError:
            pass
        
        try:
            # Try simple date format
            return datetime.strptime(date_string.split('T')[0], '%Y-%m-%d')
        except ValueError:
            pass
        
        try:
            # Try with time but no timezone
            return datetime.strptime(date_string.split('+')[0].split('Z')[0], '%Y-%m-%dT%H:%M:%S')
        except ValueError:
            pass
    
    # Fallback to current time
    print(f"Warning: Could not parse date '{date_string}', using current time")
    return datetime.utcnow()

# Initialize Supabase
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_KEY") or os.getenv("SUPABASE_KEY")

if not SUPABASE_URL or not SUPABASE_KEY:
    raise Exception("SUPABASE_URL and SUPABASE_KEY (or SUPABASE_SERVICE_KEY) must be set in environment variables")

# Initialize Supabase service
supabase_service = init_supabase_service(SUPABASE_URL, SUPABASE_KEY)

# Initialize Auth service
auth_service = init_auth_service(supabase_service.supabase)

# Pydantic Models - Authentication
class UserRegister(BaseModel):
    email: str
    password: str
    full_name: str
    role: str # fisher, admin, distributor
    phone: Optional[str] = None
    location: Optional[str] = None

class UserLogin(BaseModel):
    email: str
    password: str

class FisherProfileCreate(BaseModel):
    vessel_name: str
    home_port: str
    community_name: Optional[str] = None
    vessel_capacity_tonnes: Optional[float] = None
    sustainability_certified: bool = False
    specialization: Optional[List[str]] = None

# Pydantic Models - Fish Entries (formerly Products)
class FishEntryCreate(BaseModel):
    species_name: str
    species_code: Optional[str] = None
    location: Optional[str] = None
    caught_date: Optional[str] = None
    weight_kg: Optional[float] = None
    trip_code: str
    vessel_name: Optional[str] = None
    batch_id: Optional[str] = None

class FishEntryResponse(BaseModel):
    fish_entry_id: str
    qr_code: str
    species_name: str
    location: Optional[str] = None
    caught_date: Optional[datetime] = None
    weight_kg: Optional[float] = None
    trip_id: Optional[str] = None
    vessel_id: Optional[str] = None
    log_timestamp: datetime
    on_chain_tx_hash: Optional[str] = None

class TripCreate(BaseModel):
    fishing_method: str
    departure_port: str
    trip_start_utc: str
    expected_return_utc: str
    crew_count: int
    fuel_liters: float
    ice_kg: float
    food_budget_inr: float

class TripResponse(BaseModel):
    trip_id: str
    trip_code: str
    status: str
    trip_start_utc: Optional[datetime] = None
    created_at: datetime

class SystemStats(BaseModel):
    total_trips: int
    total_fish_entries: int
    total_vessels: int
    blockchain_network: str
    system_status: str
    database: str = "Supabase PostgreSQL"
    storage: str = "Supabase Storage"

class ProductCreate(BaseModel):
    product_name: str
    product_type: str
    weight: float
    price: float
    catch_location: Optional[str] = None
    catch_date: Optional[str] = None
    fishing_method: Optional[str] = None
    vessel_name: Optional[str] = None
    vessel_id: Optional[str] = None
    fisher_name: Optional[str] = None
    fisher_id: Optional[str] = None
    processing_facility: Optional[str] = None
    processing_date: Optional[str] = None
    expiry_date: Optional[str] = None
    quality_grade: Optional[str] = None
    sustainability_cert: Optional[str] = None
    home_port_latitude: Optional[float] = None
    home_port_longitude: Optional[float] = None
    moisture_content: Optional[float] = None
    ph_level: Optional[float] = None
    nutritional_data: Optional[Dict[str, Any]] = None
    pesticide_test_result: Optional[str] = None
    pesticide_test_date: Optional[str] = None
    heavy_metals_test: Optional[str] = None
    lab_test_report_url: Optional[str] = None
    microbial_test: Optional[str] = None
    storage_conditions: Optional[str] = None
    packaging_type: Optional[str] = None
    packaging_date: Optional[str] = None
    shelf_life_days: Optional[int] = None
    storage_temperature: Optional[str] = None
    cold_chain_required: Optional[bool] = None
    traceability_code: Optional[str] = None
    food_safety_cert: Optional[str] = None
    export_license: Optional[str] = None
    fssai_license: Optional[str] = None
    sustainability_score: Optional[float] = None
    carbon_footprint_kg: Optional[float] = None
    water_usage_liters: Optional[float] = None
    biodiversity_impact_score: Optional[float] = None
    renewable_energy_used: Optional[float] = None
    waste_recycled_pct: Optional[float] = None
    fair_trade_certified: Optional[bool] = None
    fair_price_premium_pct: Optional[float] = None
    workers_employed: Optional[int] = None
    women_workers_pct: Optional[float] = None
    social_impact_score: Optional[float] = None
    community_investment_inr: Optional[float] = None
    batch_id: Optional[str] = None
    catch_zone: Optional[str] = None
    water_depth_m: Optional[float] = None
    water_temperature_c: Optional[float] = None
    storage_temperature_c: Optional[float] = None
    fuel_usage_liters: Optional[float] = None
    bycatch_ratio: Optional[float] = None
    histamine_test_result: Optional[str] = None
    histamine_test_date: Optional[str] = None

    class Config:
        extra = "allow"

class VesselCreate(BaseModel):
    name: str
    registration_number: str
    type: Optional[str] = None
    owner_id: Optional[str] = None
    owner_name: Optional[str] = None
    owner_contact: Optional[str] = None
    owner_email: Optional[str] = None
    owner_address: Optional[str] = None
    fishing_license_number: Optional[str] = None
    crew_capacity: Optional[int] = None
    storage_capacity_kg: Optional[float] = None
    engine_power_hp: Optional[float] = None
    fuel_type: Optional[str] = None
    home_port: Optional[str] = None
    flag_state: Optional[str] = "India"
    length_m: Optional[float] = None
    tonnage_gt: Optional[float] = None
    imo_number: Optional[str] = None
    call_sign: Optional[str] = None
    owner_id_proof_url: Optional[str] = None
    vessel_documents_url: Optional[str] = None
    vessel_image_url: Optional[str] = None

# VeChain blockchain integration
async def register_fish_entry_blockchain(entry_data: dict):
    """Register fish entry on VeChain blockchain - REAL implementation ONLY"""
    qr_code = entry_data.get('qr_code', 'UNKNOWN')
    logger.info(f"🚀 Starting blockchain registration for fish entry: {qr_code}")
    
    try:
        # Check VeChain service connection first
        if not vechain_service.connected:
            network_status = get_network_status()
            logger.warning(f"⚠️ VeChain not connected: {network_status}")
        
        # Check wallet funding
        wallet_status = check_wallet_funding()
        logger.info(f"💰 Wallet status: {wallet_status}")
        
        if not wallet_status.get('funded', False):
            logger.warning(f"⚠️ Wallet {vechain_service.wallet_address} may need funding")
            if 'funding_info' in wallet_status:
                logger.warning(f"💡 {wallet_status['funding_info'].get('message')}")
        
        # Use VeChain service for real blockchain transaction
        logger.info(f"🔗 Calling VeChain service for {qr_code}...")
        # We reuse the product registration method but pass fish entry data
        # Ideally we should have a specific method in vechain_service, but for now we map fields
        blockchain_data = {
            "batch_id": qr_code, # Mapping qr_code to batch_id for compatibility
            "product_name": entry_data.get("species_name"),
            "product_type": "Seafood",
            "harvest_location": entry_data.get("location"),
            "weight": entry_data.get("weight_kg")
        }
        blockchain_result = register_product_on_blockchain(blockchain_data)
        
        # Validate blockchain result
        if not blockchain_result:
            raise Exception("No result from blockchain service")
        
        logger.info(f"📦 Blockchain result: {blockchain_result}")
        
        # Check if this is a real blockchain transaction
        if blockchain_result.get("simulation", True):
            raise Exception(f"Blockchain returned simulation data - not a real transaction")
            
        if blockchain_result.get("ERROR"):
            raise Exception(f"Blockchain error: {blockchain_result.get('WARNING', 'Unknown blockchain error')}")
        
        # Validate required fields
        required_fields = ['blockchain_hash', 'block_number', 'status']
        missing_fields = [field for field in required_fields if not blockchain_result.get(field)]
        if missing_fields:
            raise Exception(f"Missing blockchain data: {missing_fields}")
        
        result = {
            "transaction_hash": blockchain_result["blockchain_hash"],
            "block_number": blockchain_result["block_number"],
            "vechain_block_id": blockchain_result.get("vechain_block_id", ""),
            "gas_used": blockchain_result.get("gas_used", 0),
            "status": "confirmed",
            "network": "VeChain TestNet",
            "explorer_url": blockchain_result.get("explorer_url", ""),
            "simulation": False,  # Always false for real transactions
            "confirmation": blockchain_result.get("confirmation", "BLOCKCHAIN_VERIFIED"),
            "wallet_address": vechain_service.wallet_address
        }
        
        logger.info(f"✅ Blockchain registration successful for {qr_code}: {result['transaction_hash'][:16]}...")
        return result
        
    except Exception as e:
        # NO FALLBACK - Fail properly with clear error and guidance
        error_msg = str(e)
        logger.error(f"❌ CRITICAL: Blockchain registration failed for {qr_code}: {error_msg}")
        
        # Provide helpful error messages based on error type
        if "funding" in error_msg.lower() or "balance" in error_msg.lower():
            helpful_msg = f"💡 Solution: Fund wallet {vechain_service.wallet_address} with VET/VTHO tokens from VeChain TestNet faucet"
        elif "connection" in error_msg.lower() or "network" in error_msg.lower():
            helpful_msg = "💡 Solution: Check VeChain TestNet connectivity and node URL"
        elif "private key" in error_msg.lower():
            helpful_msg = "💡 Solution: Check VECHAIN_PRIVATE_KEY in .env file - must be valid 64-char hex"
        else:
            helpful_msg = "💡 Solution: Check VeChain configuration, wallet funding, and network connectivity"
        
        raise Exception(f"BLOCKCHAIN_REGISTRATION_FAILED: {error_msg} | {helpful_msg}")

# QR Code Generation and Storage
async def generate_and_store_fish_qr(qr_code: str, entry_data: dict) -> tuple[str, str, str]:
    """Generate a permanent QR code and store in Supabase Storage"""
    
    # Create permanent signature based on qr_code and blockchain_hash (won't change)
    permanent_signature = hashlib.sha256(
        f"{qr_code}{entry_data.get('blockchain_hash', '')}{entry_data.get('vechain_block_id', '')}".encode()
    ).hexdigest()[:16]
    
    # Create permanent QR content URL (consistent every time)
    qr_verification_url = f"http://localhost:8002/verify/{qr_code}?hash={entry_data.get('blockchain_hash', '')}&signature={permanent_signature}"
    
    # Generate QR image
    qr_image_buffer, _ = generate_fish_qr_image(qr_code, {
        **entry_data,
        'qr_content': qr_verification_url,
        'qr_signature': permanent_signature
    })
    
    # Upload to Supabase Storage
    # Using the new upload_qr_code method which handles the path structure internally
    storage_url = await supabase_service.upload_qr_code(
        qr_code, 
        qr_image_buffer,
        {
            "qr_content": qr_verification_url,
            "qr_signature": permanent_signature,
            "species_name": entry_data.get("species_name"),
            "vessel_name": entry_data.get("vessel_name")
        }
    )
    
    return qr_verification_url, permanent_signature, storage_url

def generate_fish_qr_image(qr_code: str, entry_data: dict) -> tuple[io.BytesIO, str]:
    """Generate a unique QR code image with embedded fish entry data"""
    
    # Use stored signature if available, otherwise generate new one
    stored_signature = entry_data.get('qr_signature')
    if stored_signature:
        unique_signature = stored_signature
        qr_text = entry_data.get('qr_content', f"http://localhost:8002/verify/{qr_code}")
    else:
        # Fallback
        unique_signature = hashlib.sha256(
            f"{qr_code}{entry_data.get('blockchain_hash', '')}".encode()
        ).hexdigest()[:16]
        qr_text = f"http://localhost:8002/verify/{qr_code}?hash={entry_data.get('blockchain_hash', '')}&signature={unique_signature}"
    
    # Generate QR code
    qr = qrcode.QRCode(
        version=1,
        error_correction=qrcode.constants.ERROR_CORRECT_L,
        box_size=10,
        border=4,
    )
    qr.add_data(qr_text)
    qr.make(fit=True)
    
    # Create QR code image
    qr_img = qr.make_image(fill_color="black", back_color="white")
    
    # Create a larger image with product info
    img_width, img_height = 400, 500
    final_img = Image.new('RGB', (img_width, img_height), 'white')
    
    # Resize QR code and paste it
    qr_img = qr_img.resize((300, 300))
    final_img.paste(qr_img, (50, 50))
    
    # Add text information
    draw = ImageDraw.Draw(final_img)
    
    try:
        # Try to use a nicer font
        font_title = ImageFont.truetype("arial.ttf", 16)
        font_text = ImageFont.truetype("arial.ttf", 12)
    except:
        # Fallback to default font
        font_title = ImageFont.load_default()
        font_text = ImageFont.load_default()
    
    # Add title
    draw.text((50, 20), "ROOT VERSE - Product Verification", fill="black", font=font_title)
    
    # Add product info below QR code
    y_pos = 370
    draw.text((50, y_pos), f"ID: {qr_code}", fill="black", font=font_text)
    draw.text((50, y_pos + 20), f"Species: {entry_data.get('species_name', 'N/A')[:25]}", fill="black", font=font_text)
    draw.text((50, y_pos + 40), f"Vessel: {entry_data.get('vessel_name', 'N/A')[:25]}", fill="black", font=font_text)
    draw.text((50, y_pos + 60), f"Signature: {unique_signature}", fill="gray", font=font_text)
    
    # Save to BytesIO
    img_buffer = io.BytesIO()
    final_img.save(img_buffer, format='PNG')
    img_buffer.seek(0)
    
    return img_buffer, unique_signature

# FastAPI app
app = FastAPI(
    title="🌱 ROOT VERSE - Agricultural Blockchain Backend",
    description="Blockchain-based agricultural supply chain traceability with Supabase",
    version="2.0.0"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Dependency to get Supabase service
async def get_supabase():
    return get_supabase_service()

@app.get("/health/blockchain")
async def blockchain_health():
    """Check VeChain blockchain service health and configuration"""
    try:
        # Get comprehensive blockchain status
        network_status = get_network_status()
        wallet_funding = check_wallet_funding()
        
        return {
            "status": "healthy" if network_status.get('status') == 'connected' else "unhealthy",
            "vechain": {
                "connected": vechain_service.connected,
                "network": network_status,
                "node_url": vechain_service.node_url,
                "explorer_url": vechain_service.explorer_url,
                "chain_tag": vechain_service.chain_tag
            },
            "wallet": {
                "address": wallet_funding.get('wallet_address', 'Unknown'),
                "balance_vet": wallet_funding.get('vet_balance', 0),
                "energy_vtho": wallet_funding.get('vtho_balance', 0),
                "funded": wallet_funding.get('funded', False),
                "setup_required": not wallet_funding.get('funded', False),
                "faucet_url": wallet_funding.get('funding_info', {}).get('faucet_url', 'https://faucet.vecha.in')
            },
            "timestamp": datetime.utcnow().isoformat(),
            "recommendations": [
                "Fund wallet with VET/VTHO tokens" if not wallet_funding.get('funded') else "Wallet funded ✅",
                "Check network connectivity" if not vechain_service.connected else "Network connected ✅",
                "Verify VECHAIN_PRIVATE_KEY in .env" if 'error' in wallet_funding else "Private key valid ✅"
            ]
        }
    except Exception as e:
        return {
            "status": "error",
            "error": str(e),
            "timestamp": datetime.utcnow().isoformat(),
            "solution": "Check VeChain configuration in .env file"
        }

# API Routes

# Include modular routers
# app.include_router(catches_router)

# ==================== Authentication Endpoints ====================

@app.post("/api/auth/register")
async def register_user(user_data: UserRegister):
    """Register a new user"""
    try:
        result = await auth_service.register_user(
            email=user_data.email,
            password=user_data.password,
            full_name=user_data.full_name,
            role=user_data.role,
            phone=user_data.phone,
            location=user_data.location
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.post("/api/auth/login")
async def login_user(credentials: UserLogin):
    """Login user and create session"""
    try:
        result = await auth_service.login(
            email=credentials.email,
            password=credentials.password
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=401, detail=str(e))

@app.post("/api/auth/logout")
async def logout_user(token: str):
    """Logout user and delete session"""
    try:
        success = await auth_service.logout(token)
        return {"success": success, "message": "Logged out successfully"}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.get("/api/auth/verify")
async def verify_token(token: str):
    """Verify session token"""
    try:
        user_data = await auth_service.verify_token(token)
        if not user_data:
            raise HTTPException(status_code=401, detail="Invalid or expired token")
        return user_data
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.post("/api/auth/fisher-profile")
async def create_fisher_profile(token: str, profile_data: FisherProfileCreate):
    """Create fisher profile (requires authentication)"""
    try:
        # Verify token first
        user_data = await auth_service.verify_token(token)
        if not user_data:
            raise HTTPException(status_code=401, detail="Unauthorized")
        
        user_id = user_data["user"]["id"]
        full_name = user_data["user"]["full_name"]
        
        # Create fisher profile
        profile = await auth_service.create_fisher_profile(
            user_id=user_id,
            full_name=full_name,
            vessel_name=profile_data.vessel_name,
            home_port=profile_data.home_port,
            community_name=profile_data.community_name,
            vessel_capacity_tonnes=profile_data.vessel_capacity_tonnes,
            sustainability_certified=profile_data.sustainability_certified,
            specialization=profile_data.specialization
        )
        
        return {"success": True, "profile": profile}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.get("/api/users/profile")
async def get_user_profile(token: str):
    """Get user profile by token"""
    try:
        user_data = await auth_service.verify_token(token)
        if not user_data:
            raise HTTPException(status_code=401, detail="Unauthorized")
        return user_data
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

# ==================== Trip & Fish Entry Endpoints ====================

# --- Products (legacy dashboards) ---

@app.get("/api/products")
async def list_products(skip: int = 0, limit: int = 200, fisher_id: Optional[str] = None):
    """Return stored products for dashboards and galleries"""
    try:
        limit = max(1, min(limit, 500))
        skip = max(0, skip)
        products = await supabase_service.get_products(limit=limit, offset=skip, fisher_id=fisher_id)
        return products
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch products: {str(e)}")


@app.get("/api/products/{batch_id}")
async def get_product(batch_id: str):
    """Get a single product by batch ID"""
    try:
        product = await supabase_service.get_product(batch_id)
        if not product:
            raise HTTPException(status_code=404, detail="Product not found")
        return product
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch product: {str(e)}")


@app.post("/api/products")
async def create_product(product: ProductCreate):
    """Create a new product entry from the admin data-entry form"""
    try:
        payload = product.dict(exclude_unset=True)
        
        # Generate a batch ID if not present (needed for blockchain and QR)
        if not payload.get('batch_id'):
            payload['batch_id'] = f"PROD-{datetime.utcnow().strftime('%Y%m%d')}-{str(uuid.uuid4())[:8].upper()}"
        
        logger.info(f"🆔 Product Batch ID: {payload['batch_id']}")
        logger.info(f"📦 Product Type: {payload.get('product_type')}")
        
        # --- Blockchain Integration ---
        # Register ALL products on VeChain (not just seafood)
        try:
            logger.info(f"🔗 Calling VeChain registration for: {payload['batch_id']}")
            
            blockchain_data = {
                "batch_id": payload['batch_id'],
                "product_name": payload.get('product_name'),
                "product_type": payload.get('product_type', 'Product'),
                "harvest_location": payload.get('catch_location') or payload.get('harvest_location', 'Unknown'),
                "weight": payload.get('weight', 0)
            }
            
            logger.info(f"📡 Blockchain data: {blockchain_data}")
            blockchain_result = register_product_on_blockchain(blockchain_data)
            logger.info(f"📥 Blockchain result: {blockchain_result}")
            
            if blockchain_result and not blockchain_result.get("ERROR"):
                # Add blockchain data to payload
                payload['blockchain_hash'] = blockchain_result.get('blockchain_hash')
                payload['block_number'] = blockchain_result.get('block_number')
                payload['vechain_block_id'] = blockchain_result.get('vechain_block_id')
                payload['gas_used'] = blockchain_result.get('gas_used', 0)
                logger.info(f"✅ Blockchain hash: {payload['blockchain_hash']}")
                logger.info(f"🔢 Block number: {payload['block_number']}")
                logger.info(f"🆔 VeChain Block ID: {payload['vechain_block_id']}")
            else:
                logger.warning(f"⚠️ Blockchain returned error: {blockchain_result}")
                
        except Exception as bc_error:
            logger.error(f"❌ Blockchain error: {bc_error}", exc_info=True)
                # We continue to save to DB even if blockchain fails, to not lose data
        
        # --- Auto-link Trip ---
        if not payload.get('trip_id') and payload.get('fisher_id'):
             try:
                 # Find latest active trip for this fisher
                 trip_res = await supabase_service.supabase.table('trips')\
                     .select('id')\
                     .eq('captain_id', payload['fisher_id'])\
                     .eq('status', 'active')\
                     .order('created_at', desc=True)\
                     .limit(1)\
                     .execute()
                 if trip_res.data:
                     payload['trip_id'] = trip_res.data[0]['id']
                     logger.info(f"🔗 Auto-linked trip {payload['trip_id']} to product")
             except Exception as e:
                 logger.warning(f"Could not auto-link trip: {e}")

        # --- QR Code Generation ---
        try:
            # Prepare data for QR generation
            qr_data = {
                "blockchain_hash": payload.get('blockchain_hash', ''),
                "vechain_block_id": payload.get('vechain_block_id', ''),
                "species_name": payload.get('product_name'),
                "vessel_name": payload.get('vessel_name') or "Unknown Vessel"
            }
            
            # Generate and upload QR
            qr_content, qr_signature, qr_storage_url = await generate_and_store_fish_qr(payload['batch_id'], qr_data)
            
            payload['qr_code_url'] = qr_storage_url
            payload['qr_content'] = qr_content
            payload['qr_signature'] = qr_signature
            logger.info(f"📱 QR Code generated: {qr_storage_url}")
            
        except Exception as qr_error:
            logger.error(f"❌ QR Generation failed: {qr_error}")

        # Save to Supabase
        # Ensure vessel_id is passed correctly
        if not payload.get('vessel_id'):
             logger.warning(f"⚠️ Creating product without vessel_id: {payload.get('batch_id')}")
             
        created = await supabase_service.create_product(payload)
        return created
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to create product: {str(e)}")

@app.post("/api/products/{batch_id}/media")
async def upload_product_media(batch_id: str, file: UploadFile = File(...), vessel_name: Optional[str] = Form(None)):
    """Upload media for a product (catch)"""
    try:
        bytes_data = await file.read()
        # Use vessel name if provided, otherwise default
        v_name = vessel_name or "General_Uploads"
        
        url = await supabase_service.upload_catch_media(
            v_name, 
            batch_id, 
            bytes_data, 
            file.filename, 
            file.content_type or 'application/octet-stream'
        )
        
        if not url:
            raise HTTPException(status_code=500, detail="Upload failed")
            
        return {"url": url}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to upload media: {e}")

@app.get("/api/vessels")
async def list_vessels(owner_id: Optional[str] = None):
    """List all registered vessels, optionally filtered by owner"""
    try:
        vessels = await supabase_service.get_vessels(owner_id=owner_id)
        return vessels
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch vessels: {str(e)}")

@app.post("/api/vessels")
async def create_vessel(vessel: VesselCreate):
    """Register a new vessel"""
    try:
        payload = vessel.dict(exclude_unset=True)
        created = await supabase_service.create_vessel(payload)
        return created
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to register vessel: {str(e)}")

@app.get("/health")
async def health_check():
    """Health check with Supabase status"""
    supabase_health = await supabase_service.health_check()
    
    return {
        "status": "healthy",
        "service": "ROOT VERSE Blockchain Backend",
        "version": "3.0.0",
        "database": supabase_health,
        "features": [
            "VeChain Integration",
            "Blockchain Storage",
            "Seafood Traceability",
            "QR Generation",
            "Supabase Database",
            "Supabase Storage"
        ]
    }

# --- Trips ---

@app.post("/api/trips", response_model=TripResponse)
async def create_trip(trip: TripCreate, token: str):
    """Create a new fishing trip (Fisher only)"""
    try:
        # Verify token and role
        user_data = await auth_service.verify_token(token)
        if not user_data or user_data["user"]["role"] != "fisher":
            raise HTTPException(status_code=401, detail="Unauthorized: Only fishers can create trips")
        
        fisher_id = user_data["user"]["id"]
        
        # Fetch fisher's vessel (assuming 1 vessel per fisher for now)
        # In a real app, fisher might select from a list if they have multiple
        vessel_result = await supabase_service.supabase.table('vessels').select("id").eq("owner_id", fisher_id).limit(1).execute()
        vessel_id = vessel_result.data[0]["id"] if vessel_result.data else None
        
        if not vessel_id:
            # Auto-create a default vessel if none exists (for demo purposes)
            # In production, force vessel registration first
            vessel_data = {
                "owner_id": fisher_id,
                "name": f"{user_data['user']['full_name']}'s Vessel",
                "registration_number": f"REG-{str(uuid.uuid4())[:8].upper()}",
                "is_active": True
            }
            new_vessel = await supabase_service.create_vessel(vessel_data)
            vessel_id = new_vessel["id"]

        # Generate trip code
        trip_code = f"TRIP-{datetime.now().strftime('%Y%m%d')}-{str(uuid.uuid4())[:6].upper()}"
        
        trip_data = {
            "trip_code": trip_code,
            "captain_id": fisher_id, # Schema uses captain_id
            "vessel_id": vessel_id,
            "departure_port": trip.departure_port,
            "departure_date": trip.trip_start_utc, # Schema uses departure_date
            "expected_return_date": trip.expected_return_utc,
            "fishing_method": trip.fishing_method,
            "crew_count": trip.crew_count,
            "fuel_liters": trip.fuel_liters,
            "ice_kg": trip.ice_kg,
            "food_budget": trip.food_budget_inr, # Schema uses food_budget
            "status": "active"
        }
        
        created_trip = await supabase_service.create_trip(trip_data)
        
        return TripResponse(
            trip_id=created_trip["id"], # Schema uses id
            trip_code=created_trip["trip_code"],
            status=created_trip["status"],
            trip_start_utc=parse_datetime_flexible(created_trip["departure_date"]),
            created_at=parse_datetime_flexible(created_trip["created_at"])
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to create trip: {str(e)}")

@app.get("/api/trips", response_model=List[TripResponse])
async def get_trips(token: str, skip: int = 0, limit: int = 50):
    """Get trips (Fisher sees own, Admin sees all)"""
    try:
        user_data = await auth_service.verify_token(token)
        if not user_data:
            raise HTTPException(status_code=401, detail="Unauthorized")
        
        query = supabase_service.supabase.table('trips').select("*").range(skip, skip + limit - 1)
        
        # Filter for fishers
        if user_data["user"]["role"] == "fisher":
            query = query.eq("captain_id", user_data["user"]["id"])
            
        trips = await query.execute()
        
        response_trips = []
        for trip in trips.data:
            response_trips.append(TripResponse(
                trip_id=trip["id"],
                trip_code=trip["trip_code"],
                status=trip["status"],
                trip_start_utc=parse_datetime_flexible(trip["departure_date"]),
                created_at=parse_datetime_flexible(trip["created_at"])
            ))
        
        return response_trips
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch trips: {str(e)}")

# --- Fish Entries ---

@app.post("/api/fish-entries", response_model=FishEntryResponse)
async def create_fish_entry(entry: FishEntryCreate, token: str):
    """Log a fish catch (Fisher only)"""
    try:
        # Verify token and role
        user_data = await auth_service.verify_token(token)
        if not user_data or user_data["user"]["role"] != "fisher":
            raise HTTPException(status_code=401, detail="Unauthorized: Only fishers can log catches")
        
        # Resolve trip_id from trip_code
        trip_result = await supabase_service.supabase.table('trips').select("id, vessel_id").eq("trip_code", entry.trip_code).execute()
        if not trip_result.data:
            raise HTTPException(status_code=404, detail="Trip code not found")
        
        trip_id = trip_result.data[0]["id"]
        # vessel_id = trip_result.data[0]["vessel_id"] # Not needed in fish_entries if linked via trip, but good for QR
        
        # Generate QR code ID (Batch ID)
        batch_id = f"FISH-{datetime.now().strftime('%Y%m%d')}-{str(uuid.uuid4())[:8].upper()}"
        
        # Register on blockchain
        blockchain_data = {
            "qr_code": batch_id,
            "species_name": entry.species_name,
            "location": entry.location,
            "weight_kg": entry.weight_kg
        }
        
        blockchain_result = await register_fish_entry_blockchain(blockchain_data)
        
        # Create entry data for Supabase
        db_entry_data = {
            "batch_id": batch_id, # Schema uses batch_id
            "trip_id": trip_id,
            "species_code": entry.species_code or "UNK", # Schema uses species_code
            # "species_name": entry.species_name, # Schema might not have species_name if normalized, but let's assume we keep it or join
            "weight_kg": entry.weight_kg,
            "catch_location": entry.location, # Schema uses catch_location
            "catch_time": entry.caught_date or datetime.utcnow().isoformat(), # Schema uses catch_time
            "created_by": user_data["user"]["id"],
            "on_chain_tx_hash": blockchain_result["transaction_hash"],
            "blockchain_hash": blockchain_result["transaction_hash"], # Add this field for consistency
            "data_hash": blockchain_result.get("data_hash", ""), # Assuming service returns this
            "qr_code_url": f"http://localhost:8002/verify/{batch_id}" # Placeholder
        }
        
        # Save to Supabase
        created_entry = await supabase_service.create_fish_entry(db_entry_data)
        
        # Generate and store QR code
        qr_entry_data = {
            "blockchain_hash": blockchain_result["transaction_hash"],
            "vechain_block_id": blockchain_result.get("vechain_block_id", ""),
            "species_name": entry.species_name,
            "vessel_name": entry.vessel_name or "Unknown Vessel"
        }
        qr_content, qr_signature, qr_storage_url = await generate_and_store_fish_qr(batch_id, qr_entry_data)
        
        # Update entry with QR info
        await supabase_service.supabase.table('fish_entries').update({
            "qr_code_url": qr_storage_url,
            "qr_data": qr_content
        }).eq("id", created_entry["id"]).execute()
        
        return FishEntryResponse(
            fish_entry_id=created_entry["id"],
            qr_code=created_entry["batch_id"],
            species_name=entry.species_name, # Returned from input as DB might use code
            location=created_entry["catch_location"],
            caught_date=parse_datetime_flexible(created_entry["catch_time"]),
            weight_kg=created_entry["weight_kg"],
            trip_id=created_entry["trip_id"],
            log_timestamp=parse_datetime_flexible(created_entry["created_at"]),
            on_chain_tx_hash=created_entry["on_chain_tx_hash"]
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to create fish entry: {str(e)}")

@app.get("/api/fish-entries/{qr_code}", response_model=FishEntryResponse)
async def get_fish_entry(qr_code: str):
    """Get fish entry details by QR code"""
    try:
        entry = await supabase_service.get_fish_entry(qr_code)
        if not entry:
            raise HTTPException(status_code=404, detail="Fish entry not found")
        
        return FishEntryResponse(
            fish_entry_id=entry["fish_entry_id"],
            qr_code=entry["qr_code"],
            species_name=entry["species_name"],
            location=entry["location"],
            caught_date=parse_datetime_flexible(entry["caught_date"]) if entry.get("caught_date") else None,
            weight_kg=entry["weight_kg"],
            trip_id=entry.get("trip_id"),
            log_timestamp=parse_datetime_flexible(entry["log_timestamp"]),
            on_chain_tx_hash=entry["on_chain_tx_hash"]
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch fish entry: {str(e)}")

@app.get("/api/qr/{qr_code}")
async def get_qr_code_metadata(qr_code: str):
    """Get QR code metadata and URLs"""
    try:
        entry = await supabase_service.get_fish_entry(qr_code)
        if not entry:
            raise HTTPException(status_code=404, detail="Fish entry not found")
        
        storage_url = await supabase_service.get_qr_code_url(qr_code)
        
        return {
            "qr_code": qr_code,
            "verification_url": f"http://localhost:8002/verify/{qr_code}",
            "qr_image_url": storage_url,
            "data": {
                "species": entry["species_name"],
                "weight": entry["weight_kg"],
                "location": entry["location"],
                "tx_hash": entry["on_chain_tx_hash"]
            }
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get QR metadata: {str(e)}")

@app.get("/api/qr/{qr_code}/image")
async def get_qr_image(qr_code: str):
    """Get QR code image"""
    try:
        storage_url = await supabase_service.get_qr_code_url(qr_code)
        if storage_url:
            return RedirectResponse(url=storage_url)
        
        # Fallback generate
        entry = await supabase_service.get_fish_entry(qr_code)
        if not entry:
            raise HTTPException(status_code=404, detail="Entry not found")
            
        img_buffer, signature = generate_fish_qr_image(qr_code, {
            "species_name": entry["species_name"],
            "blockchain_hash": entry["on_chain_tx_hash"]
        })
        
        return StreamingResponse(
            io.BytesIO(img_buffer.read()),
            media_type="image/png",
            headers={"Content-Disposition": f"inline; filename=ROOTVERSE_QR_{qr_code}.png"}
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get QR image: {str(e)}")

@app.get("/api/stats", response_model=SystemStats)
async def get_system_stats():
    """Get system statistics"""
    try:
        stats = await supabase_service.get_system_stats()
        return SystemStats(**stats)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch stats: {str(e)}")

# Verification endpoints
@app.get("/verify/{qr_code}")
async def verify_fish_entry(qr_code: str):
    """Public verification endpoint"""
    # 1. Try finding in products table first (for PROD- IDs)
    try:
        product = await supabase_service.get_product(qr_code)
    except Exception as e:
        logger.error(f"Error fetching product {qr_code}: {e}")
        product = None
    
    if product:
        # Map product fields (agricultural schema) to seafood schema
        return {
            "verified": True,
            "verification_status": "verified",
            "status": "AUTHENTIC",
            "product": {
                "batch_id": product.get("batch_id"),
                "product_name": product.get("product_name"),
                "product_type": product.get("product_type"),
                # Prioritize fisher terminology
                "fisher_name": product.get("fisher_name"),
                "vessel_name": product.get("vessel_name"),
                "catch_location": product.get("catch_location"),
                "catch_date": product.get("catch_date"),
                "fishing_method": product.get("fishing_method"),
                "quality_grade": product.get("quality_grade"),
                "sustainability_cert": product.get("sustainability_cert"),
                "description": product.get("description"),
                "registration_date": product.get("created_at"),
                "fisher_id": product.get("fisher_id"),
                "weight": product.get("weight"),
                "price": product.get("price"),
            },
            "blockchain": {
                "network": "VeChain TestNet",
                "transaction_hash": product.get("blockchain_hash"),
                "block_number": product.get("block_number"),
                "vechain_block_id": product.get("vechain_block_id"),
                "explorer_url": f"https://explore-testnet.vechain.org/transactions/{product.get('blockchain_hash')}" if product.get('blockchain_hash') else None
            },
            "qr_code": {
                "image_url": product.get("qr_code_url"),
                "signature": product.get("qr_signature")
            }
        }

    # 2. Fallback to fish_entries (legacy or specific fisher app entries)
    try:
        entry = await supabase_service.get_fish_entry(qr_code)
    except Exception as e:
        logger.error(f"Error fetching fish entry {qr_code}: {e}")
        entry = None

    if not entry:
        raise HTTPException(status_code=404, detail="Product not found")
        
    return {
        "verified": True,
        "verification_status": "verified",
        "status": "AUTHENTIC",
        "product": {
                "batch_id": entry.get("batch_id") or entry.get("qr_code"),
                "product_name": entry.get("species_name"),
                "weight_kg": entry.get("weight_kg"),
                "harvest_location": entry.get("location") or entry.get("catch_location"),
                "harvest_date": entry.get("caught_date") or entry.get("catch_time"),
                "fisher_name": "Registered Fisher",
                "vessel_name": entry.get("vessel_name") or "Registered Vessel"
        },
        "blockchain": {
            "network": "VeChain TestNet",
            "transaction_hash": entry.get("on_chain_tx_hash"),
            "explorer_url": f"https://explore-testnet.vechain.org/transactions/{entry.get('on_chain_tx_hash')}"
        }
    }

@app.get("/verify")
async def get_verification_info():
    """Get verification system information"""
    return {
        "service": "ROOT VERSE Product Verification",
        "description": "Blockchain-based seafood traceability",
        "usage": "Access /verify/{qr_code} to verify a catch",
        "blockchain_network": "VeChain TestNet"
    }

# ==================== Fisher Profiles & Reviews (lightweight) ====================

class FisherProfilePublic(BaseModel):
    fisher_id: str
    full_name: str
    bio: Optional[str] = None
    years_experience: Optional[int] = None
    certifications: Optional[List[str]] = None
    home_port_latitude: Optional[float] = None
    home_port_longitude: Optional[float] = None
    vessel_capacity_tons: Optional[int] = None
    average_rating: Optional[float] = None
    total_reviews: Optional[int] = None

class FisherReviewCreate(BaseModel):
    fisher_id: str
    product_batch_id: Optional[str] = None
    rating: int
    title: Optional[str] = None
    review_text: str

class FisherReview(FisherReviewCreate):
    id: str
    reviewer_role: Optional[str] = None
    created_at: datetime

class FisherHistoryPayload(BaseModel):
    biography: Optional[str] = None
    region: Optional[str] = None
    since: Optional[int] = None
    vessel: Optional[Dict[str, Any]] = None
    previous_catches: Optional[List[Dict[str, Any]]] = None
    gear_used: Optional[List[Dict[str, Any]]] = None
    weather_logs: Optional[List[Dict[str, Any]]] = None
    timeline: Optional[List[Dict[str, Any]]] = None

class StoryPostBase(BaseModel):
    title: Optional[str] = None
    content: Optional[str] = None
    is_public: Optional[bool] = True
    species_name: Optional[str] = None
    catch_weight_kg: Optional[float] = None
    catch_date: Optional[str] = None
    fishing_zone_id: Optional[str] = None
    fishing_coordinates: Optional[str] = None
    water_depth_m: Optional[int] = None
    water_temperature: Optional[str] = None
    weather_conditions: Optional[str] = None
    processing_method: Optional[str] = None
    processing_facility: Optional[str] = None
    processing_date: Optional[str] = None
    processing_duration_days: Optional[int] = None
    storage_location: Optional[str] = None
    storage_conditions: Optional[str] = None
    storage_temperature: Optional[str] = None
    storage_duration_days: Optional[int] = None
    quality_grade: Optional[str] = None
    freshness_index: Optional[float] = None
    quality_notes: Optional[str] = None
    photos_urls: Optional[List[str]] = None
    tags: Optional[List[str]] = None

class StoryPostCreate(StoryPostBase):
    pass

class StoryPostUpdate(StoryPostBase):
    pass

# In-memory store (placeholder until Supabase tables are added)
FISHER_PROFILES: Dict[str, Dict[str, Any]] = {}
FISHER_REVIEWS: List[Dict[str, Any]] = []

@app.get("/api/fishers/{fisher_id}", response_model=FisherProfilePublic)
async def get_fisher_profile_public(fisher_id: str):
    """Return a public fisher profile. Placeholder backed by memory for now."""
    # Try in-memory first
    profile = FISHER_PROFILES.get(fisher_id)
    if profile:
        # augment review stats
        reviews = [r for r in FISHER_REVIEWS if r.get("fisher_id") == fisher_id]
        avg = round(sum(r["rating"] for r in reviews) / len(reviews), 1) if reviews else 0.0
        return FisherProfilePublic(
            average_rating=avg or None,
            total_reviews=len(reviews) or None,
            **profile
        )

    # Derive minimal profile from id when not available
    name_slug = fisher_id.split(":")[-1]
    name_parts = name_slug.replace("-", " ").title()
    derived = {
        "fisher_id": fisher_id,
        "full_name": name_parts or "Fisher",
        "bio": "Sustainable coastal fisher practicing responsible fishing methods.",
        "years_experience": 8,
        "certifications": ["Sustainable Fishing"],
        "home_port_latitude": 10.7905,
        "home_port_longitude": 79.8448,
        "vessel_capacity_tons": 5,
    }
    FISHER_PROFILES[fisher_id] = derived
    return FisherProfilePublic(**derived)

@app.get("/api/fishers/{fisher_id}/reviews", response_model=List[FisherReview])
async def get_fisher_reviews(fisher_id: str):
    """List reviews for a fisher (public)."""
    reviews = [r for r in FISHER_REVIEWS if r.get("fisher_id") == fisher_id]
    # Most recent first
    return sorted(reviews, key=lambda r: r["created_at"], reverse=True)

@app.post("/api/reviews", response_model=FisherReview)
async def create_fisher_review(review: FisherReviewCreate):
    """Create a review entry (no auth for now - placeholder)."""
    new_review = {
        **review.dict(),
        "id": str(uuid.uuid4()),
        "reviewer_role": "consumer",
        "created_at": datetime.utcnow()
    }
    FISHER_REVIEWS.append(new_review)
    return FisherReview(**new_review)

# ==================== Fisher History Persistence Endpoints ====================

@app.get("/api/fishers/{fisher_id}/history")
async def get_fisher_history(fisher_id: str):
    """Fetch extended fisher history from persistence (fallback none)."""
    history = await supabase_service.get_fisher_history(fisher_id)
    if not history:
        return {"fisher_id": fisher_id, "history": None}
    return {"fisher_id": fisher_id, "history": history}

@app.put("/api/fishers/{fisher_id}/history")
async def upsert_fisher_history(fisher_id: str, payload: FisherHistoryPayload):
    """Create or update full fisher history record."""
    try:
        history_dict = {k: v for k, v in payload.dict().items() if v is not None}
        result = await supabase_service.upsert_fisher_history(fisher_id, history_dict)
        return {"success": True, "history": result}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to upsert history: {e}")

@app.post("/api/fishers/{fisher_id}/history/timeline")
async def append_fisher_timeline_event(fisher_id: str, event: Dict[str, Any] = Body(...)):
    """Append a single timeline event (expects date,event,details)."""
    required = {"date", "event"}
    if not required.issubset(event.keys()):
        raise HTTPException(status_code=400, detail="Timeline event must include date and event fields")
    try:
        result = await supabase_service.append_fisher_timeline_event(fisher_id, event)
        return {"success": True, "history": result}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to append timeline event: {e}")

# ==================== Fisher Stories Endpoints ====================

@app.get("/api/fishers/{fisher_id}/stories")
async def get_fisher_stories(fisher_id: str, public_only: bool = False):
    try:
        posts = await supabase_service.get_fisher_stories(fisher_id, public_only)
        return posts
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch stories: {e}")

# Alias for /data -> /stories to support FisherDataAPI
@app.get("/api/fishers/{fisher_id}/data")
async def get_fisher_data(fisher_id: str, public_only: bool = False):
    return await get_fisher_stories(fisher_id, public_only)

@app.get("/api/stories/public")
async def list_public_stories(limit: int = 50):
    try:
        posts = await supabase_service.list_public_stories(limit)
        return posts
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to list public stories: {e}")

@app.post("/api/fishers/{fisher_id}/stories")
async def create_story(fisher_id: str, post: StoryPostCreate):
    try:
        payload = post.dict()
        # parse dates
        if payload.get('catch_date'):
            try:
                payload['catch_date'] = parse_datetime_flexible(payload['catch_date']).isoformat()
            except Exception:
                payload.pop('catch_date', None)
        if payload.get('processing_date'):
            try:
                payload['processing_date'] = parse_datetime_flexible(payload['processing_date']).isoformat()
            except Exception:
                payload.pop('processing_date', None)
        payload['fisher_id'] = fisher_id
        created = await supabase_service.create_fisher_story(payload)
        return created
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to create story: {e}")

# Alias for /data -> /stories
@app.post("/api/fishers/{fisher_id}/data")
async def create_fisher_data(fisher_id: str, post: StoryPostCreate):
    return await create_story(fisher_id, post)

@app.put("/api/fishers/{fisher_id}/stories/{post_id}")
async def update_story(fisher_id: str, post_id: str, updates: StoryPostUpdate):
    try:
        payload = {k: v for k, v in updates.dict().items() if v is not None}
        if payload.get('catch_date'):
            try:
                payload['catch_date'] = parse_datetime_flexible(payload['catch_date']).isoformat()
            except Exception:
                payload.pop('catch_date', None)
        if payload.get('processing_date'):
            try:
                payload['processing_date'] = parse_datetime_flexible(payload['processing_date']).isoformat()
            except Exception:
                payload.pop('processing_date', None)
        updated = await supabase_service.update_fisher_story(fisher_id, post_id, payload)
        return updated
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to update story: {e}")

# Alias for /data -> /stories
@app.put("/api/fishers/{fisher_id}/data/{post_id}")
async def update_fisher_data(fisher_id: str, post_id: str, updates: StoryPostUpdate):
    return await update_story(fisher_id, post_id, updates)

@app.delete("/api/fishers/{fisher_id}/stories/{post_id}")
async def delete_story(fisher_id: str, post_id: str):
    try:
        ok = await supabase_service.delete_fisher_story(fisher_id, post_id)
        return {"success": ok}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to delete story: {e}")

# Alias for /data -> /stories
@app.delete("/api/fishers/{fisher_id}/data/{post_id}")
async def delete_fisher_data(fisher_id: str, post_id: str):
    return await delete_story(fisher_id, post_id)

@app.get("/api/fishers/{fisher_id}/data/{post_id}")
async def get_fisher_data_by_id(fisher_id: str, post_id: str):
    # We don't have a direct get_story_by_id in main.py yet, but we can implement it or use list and filter
    # For now, let's implement a simple fetch via supabase service if available, or reuse list
    # Actually, let's add a get_story endpoint
    try:
        # This assumes supabase_service has get_fisher_story or we can fetch all and filter
        # Better to add a specific endpoint for single story if needed.
        # For now, let's just return the story from the list (inefficient but works for small lists)
        stories = await supabase_service.get_fisher_stories(fisher_id, public_only=False)
        for story in stories:
            if story['id'] == post_id:
                return story
        raise HTTPException(status_code=404, detail="Story not found")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch story: {e}")

# Basic media upload via multipart/form-data (optional)
@app.post("/api/fishers/{fisher_id}/stories/{post_id}/media")
async def upload_story_media(fisher_id: str, post_id: str, file: UploadFile = File(...)):
    try:
        bytes_data = await file.read()
        url = await supabase_service.upload_story_media(fisher_id, bytes_data, file.filename, file.content_type or 'application/octet-stream')
        if not url:
            raise HTTPException(status_code=500, detail="Upload failed")
        # Return URL; client decides to set as cover or add to gallery
        return {"url": url}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to upload media: {e}")

# ==================== API for Vessel Document Uploads ====================

@app.post("/api/vessels/upload")
async def upload_vessel_document(file: UploadFile = File(...), vessel_name: Optional[str] = Form(None)):
    """Upload vessel document or image"""
    try:
        bytes_data = await file.read()
        v_name = vessel_name or "Unknown_Vessel"
        url = await supabase_service.upload_vessel_media(bytes_data, file.filename, file.content_type or 'application/octet-stream', vessel_name=v_name)
        if not url:
            raise HTTPException(status_code=500, detail="Upload failed")
        return {"url": url}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Upload error details: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to upload document: {str(e)}")

# ==================== AI: Parse Story Text to Structured Data ====================

def _groq_chat_completion(prompt: str, model: str) -> str:
    """Call Groq Chat Completions API using urllib to avoid extra deps."""
    api_key = os.getenv("GROQ_API_KEY")
    if not api_key:
        raise RuntimeError("GROQ_API_KEY not set in environment")

    url = "https://api.groq.com/openai/v1/chat/completions"
    headers = {
        "Content-Type": "application/json",
        "Authorization": f"Bearer {api_key}",
    }
    body = json.dumps({
        "model": model,
        "messages": [
            {"role": "system", "content": "You are a data extraction assistant for fisher catch stories. Return strict JSON only."},
            {"role": "user", "content": prompt}
        ],
        "temperature": 0.2,
    }).encode("utf-8")

    req = urllib.request.Request(url, data=body, headers=headers, method="POST")
    # Create SSL context
    ctx = ssl.create_default_context()
    try:
        with urllib.request.urlopen(req, context=ctx, timeout=30) as resp:
            resp_data = resp.read().decode("utf-8")
            data = json.loads(resp_data)
            content = data.get("choices", [{}])[0].get("message", {}).get("content", "")
            return content
    except urllib.error.HTTPError as e:
        raise RuntimeError(f"Groq API error: {e.read().decode('utf-8', 'ignore')}")
    except Exception as e:
        raise RuntimeError(str(e))

@app.post("/api/ai/story/parse")
async def ai_parse_story(text: Dict[str, str]):
    """Extract structured story data from free text using Groq LLM. Expects { text }.
    Returns a JSON object matching StoryPost fields including vessel_details, fishing_events, processing_steps.
    """
    try:
        raw = text.get("text", "") if isinstance(text, dict) else ""
        if not raw:
            raise HTTPException(status_code=400, detail="Missing text")
        model = os.getenv("GROQ_MODEL", "llama-3.1-70b-versatile")
        instruction = (
            "Extract fields as JSON with keys: title, content, species_name, catch_weight_kg, catch_date, "
            "fishing_zone_id, fishing_coordinates, water_depth_m, water_temperature, weather_conditions, "
            "processing_method, processing_facility, processing_date, processing_duration_days, storage_location, "
            "storage_conditions, storage_temperature, storage_duration_days, quality_grade, freshness_index, quality_notes, tags, "
            "vessel_details (object: vessel_name, captain_name, crew_size, gear_type), "
            "fishing_events (array of {date, location, depth, catch_amount, notes}), "
            "processing_steps (array of {step, date, details, duration_hours}). "
            "Missing values should be null. Return ONLY JSON."
        )
        content = _groq_chat_completion(f"{instruction}\n\nText:\n{raw}", model)
        # Try parse JSON
        parsed = None
        try:
            parsed = json.loads(content)
        except Exception:
            # Try to locate JSON substring
            start = content.find('{')
            end = content.rfind('}')
            if start != -1 and end != -1 and end > start:
                parsed = json.loads(content[start:end+1])
        if not parsed:
            raise HTTPException(status_code=500, detail="AI did not return JSON")
        return {"data": parsed}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"AI parse failed: {e}")

# ==================== Blockchain Stats Endpoint ====================

class BlockchainStats(BaseModel):
    blockHeight: int
    totalTransactions: int
    networkHashRate: str
    activeNodes: int
    avgBlockTime: str
    latestBlock: str
    recentTransactions: List[Dict[str, Any]]

@app.get("/api/blockchain/search")
async def search_blockchain(q: str):
    """Search blockchain by hash, block, or product ID"""
    try:
        # 1. Search by Product ID (Batch ID)
        product = await supabase_service.get_product(q)
        if product:
            return {"type": "product", "id": product.get("batch_id"), "data": product}
            
        entry = await supabase_service.get_fish_entry(q)
        if entry:
            return {"type": "product", "id": entry.get("batch_id") or entry.get("qr_code"), "data": entry}

        # 2. Search by Transaction Hash
        # Check fish_entries
        res = supabase_service.supabase.table('fish_entries').select("*").eq('on_chain_tx_hash', q).execute()
        if res.data:
            return {"type": "transaction", "id": q, "data": res.data[0], "productId": res.data[0].get("batch_id")}
            
        # Check products
        res = supabase_service.supabase.table('products').select("*").eq('blockchain_hash', q).execute()
        if res.data:
            return {"type": "transaction", "id": q, "data": res.data[0], "productId": res.data[0].get("batch_id")}

        # 3. Search by Block Number (if numeric)
        if q.isdigit():
             return {"type": "block", "id": q}

        return {"type": "unknown", "id": q}
        
    except Exception as e:
        logger.error(f"Search error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/blockchain/stats", response_model=BlockchainStats)
async def get_blockchain_stats():
    """Get real-time blockchain statistics and recent transactions"""
    try:
        # Get network status from VeChain service
        network_status = get_network_status()
        
        # Get recent transactions from Supabase
        recent_txs = await supabase_service.get_recent_blockchain_transactions(limit=10)
        
        # Format transactions for frontend
        formatted_txs = []
        for tx in recent_txs:
            formatted_txs.append({
                "hash": tx.get("on_chain_tx_hash") or tx.get("blockchain_hash") or "0x...",
                "blockNumber": tx.get("block_number") or 0,
                "timestamp": tx.get("created_at"),
                "type": "Catch Registration",
                "status": "success",
                "productId": tx.get("batch_id"),
                "fisher": tx.get("vessel_name") or "Unknown Vessel" # Ideally fetch fisher name
            })
            
        # Calculate or mock other stats if not available from simple API
        # In a real app, we'd cache these or fetch from a more detailed explorer API
        
        return BlockchainStats(
            blockHeight=network_status.get("latest_block", 0),
            totalTransactions=network_status.get("latest_block", 0) * 15 + 2450000, # Mock estimation based on block height
            networkHashRate="2.5 TH/s", # Mock
            activeNodes=101, # Mock
            avgBlockTime="10s",
            latestBlock=network_status.get("block_id", "0x..."),
            recentTransactions=formatted_txs
        )
        
    except Exception as e:
        logger.error(f"Error fetching blockchain stats: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# Run the server
if __name__ == "__main__":
    import uvicorn
    
    print("🚀 Starting ROOT VERSE VeChain Blockchain Backend with Supabase...")
    print("🔗 VeChain TestNet: Enabled")
    
    # Get VeChain service status
    try:
        network_status = get_network_status()
        if network_status.get('status') == 'connected':
            print(f"💰 Wallet: {network_status.get('wallet_address', 'Unknown')}")
            print(f"📍 Current Block: {network_status.get('latest_block', 'Unknown')}")
        else:
            print("❌ VeChain service not connected")
    except Exception as e:
        print(f"⚠️ VeChain status check failed: {e}")
    
    print("🔗 Blockchain Storage: Real VeChain Integration")
    print("🗄️ Database: Supabase PostgreSQL")
    print("📦 Storage: Supabase Storage")
    print("🌐 Server: http://localhost:8005")
    print("📚 Docs: http://localhost:8005/docs")
    print("🔍 Explorer: https://explore-testnet.vechain.org")
    
    try:
        uvicorn.run(
            app,
            host="127.0.0.1",
            port=8005,
            log_level="info"
        )
    except KeyboardInterrupt:
        print("\n🛑 Server stopped by user")
    except Exception as e:
        print(f"❌ Server error: {e}")