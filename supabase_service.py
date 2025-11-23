"""
Supabase Service for ROOT VERSE
Handles database operations and file storage
"""

import os
import io
import asyncio
from typing import Dict, List, Optional, Any
from datetime import datetime
from supabase import create_client, Client
from storage3.utils import StorageException
import hashlib
import json
import logging
import uuid

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class SupabaseService:
    # PRODUCT_FIELD_MAP removed - using direct column names now

    # Only fields that exist in CLEAN_DATABASE_SETUP.sql products table
    PRODUCT_TABLE_FIELDS = {
        "batch_id", "fisher_id", "farmer_id", "vessel_id",
        "product_name", "product_type", "weight", "price", "quality_grade",
        "fisher_name", "farmer_name", "vessel_name",
        "catch_location", "catch_date", "fishing_method",
        "processing_facility", "processing_date", "expiry_date",
        "blockchain_hash", "block_number", "vechain_block_id", "gas_used",
        "qr_code_url", "qr_content", "qr_signature",
        "catch_zone", "water_depth_m", "water_temperature_c",
        "storage_temperature", "packaging_type", "cold_chain_required",
        "sustainability_cert", "vessel_image_url",
        "created_at", "updated_at"
    }

    def __init__(self, supabase_url: str, supabase_key: str):
        """Initialize Supabase client"""
        self.supabase_url = supabase_url
        self.supabase_key = supabase_key
        self.supabase: Client = create_client(supabase_url, supabase_key)
        self.qr_bucket = "qr-codes"
        self.blog_media_bucket = "fisher-story-media"
        self.vessel_media_bucket = "vessel-media"
        
        # Initialize storage bucket for QR codes
        self._init_storage()
    
    def _init_storage(self):
        """Initialize storage buckets"""
        # List of required buckets
        required_buckets = [self.qr_bucket, self.blog_media_bucket, self.vessel_media_bucket]
        
        try:
            # Try to list existing buckets
            buckets_response = self.supabase.storage.list_buckets()
            existing_buckets = [bucket.name for bucket in buckets_response]
        except Exception as e:
            logger.warning(f"Could not list buckets (permissions?): {e}")
            existing_buckets = []

        for bucket in required_buckets:
            if bucket not in existing_buckets:
                try:
                    self.supabase.storage.create_bucket(bucket, options={"public": True})
                    logger.info(f"Created storage bucket: {bucket}")
                except Exception as e:
                    # Suppress 403/400 errors which are common if bucket exists but we can't see it/create it
                    if "403" in str(e) or "400" in str(e) or "row-level security" in str(e):
                        logger.info(f"Bucket '{bucket}' access restricted or already exists. Skipping creation.")
                    else:
                        logger.warning(f"Failed to create bucket {bucket}: {e}")
            else:
                logger.info(f"Storage bucket exists: {bucket}")
    
    # === Database Operations ===
    
    # --- Fish Entries (Products) ---
    async def create_fish_entry(self, entry_data: Dict) -> Dict:
        """Create a new fish entry (block) in Supabase"""
        try:
            result = self.supabase.table('fish_entries').insert(entry_data).execute()
            
            if result.data:
                logger.info(f"Fish entry created: {entry_data.get('qr_code')}")
                return result.data[0]
            else:
                raise Exception("Failed to create fish entry")
                
        except Exception as e:
            logger.error(f"Error creating fish entry: {e}")
            raise e
    
    async def get_fish_entry(self, qr_code: str) -> Optional[Dict]:
        """Get fish entry by QR code (batch_id)"""
        try:
            result = self.supabase.table('fish_entries').select("*").eq('batch_id', qr_code).execute()
            
            if result.data:
                return result.data[0]
            return None
            
        except Exception as e:
            logger.error(f"Error getting fish entry: {e}")
            return None
    
    async def get_fish_entries(self, limit: int = 100, offset: int = 0) -> List[Dict]:
        """Get all fish entries with pagination"""
        try:
            result = self.supabase.table('fish_entries').select("*").range(offset, offset + limit - 1).execute()
            return result.data or []
            
        except Exception as e:
            logger.error(f"Error getting fish entries: {e}")
            return []

    # --- Products (Legacy Hill Produce) ---
    def _normalize_product_payload(self, raw_data: Dict) -> Dict:
        # No normalization needed - using direct fields
        normalized = {}
        for key, value in raw_data.items():
            if key in self.PRODUCT_TABLE_FIELDS:
                normalized[key] = value
        return normalized

    async def create_product(self, product_data: Dict) -> Dict:
        """Create a new product entry in products table"""
        try:
            payload = self._normalize_product_payload(product_data)
            
            # Map legacy agricultural fields to seafood fields if missing
            if 'fisher_name' not in payload and 'farmer_name' in payload:
                payload['fisher_name'] = payload['farmer_name']
                
            if 'fisher_id' not in payload and 'farmer_id' in payload:
                payload['fisher_id'] = payload['farmer_id']
                
            if 'vessel_name' not in payload and 'farm_name' in payload:
                payload['vessel_name'] = payload['farm_name']
                
            if 'catch_location' not in payload and 'harvest_location' in payload:
                payload['catch_location'] = payload['harvest_location']
                
            if 'catch_date' not in payload and 'harvest_date' in payload:
                payload['catch_date'] = payload['harvest_date']
                
            if 'fishing_method' not in payload and 'harvesting_method' in payload:
                payload['fishing_method'] = payload['harvesting_method']
                
            if 'sustainability_cert' not in payload and 'organic_cert' in payload:
                payload['sustainability_cert'] = payload['organic_cert']
            
            # Ensure vessel_id is present if provided in product_data
            if 'vessel_id' in product_data and product_data['vessel_id']:
                payload['vessel_id'] = product_data['vessel_id']
                
            payload.setdefault('batch_id', f"PROD-{datetime.utcnow().strftime('%Y%m%d')}-{str(uuid.uuid4())[:8].upper()}")
            payload.setdefault('created_at', datetime.utcnow().isoformat())
            payload.setdefault('updated_at', datetime.utcnow().isoformat())
            
            try:
                # Try insert with current payload
                result = self.supabase.table('products').insert(payload).execute()
                if result.data:
                    return result.data[0]
            except Exception as e:
                logger.error(f"Insert failed: {e}")
                raise e

            raise Exception("Failed to create product")
        except Exception as e:
            logger.error(f"Error creating product: {e}")
            raise e

    async def get_products(self, limit: int = 200, offset: int = 0, fisher_id: Optional[str] = None) -> List[Dict]:
        """List products for admin dashboards, optionally filtered by fisher"""
        try:
            # Try with fisher_id first (new schema)
            query = self.supabase.table('products').select('*, vessels(vessel_image_url, vessel_documents_url, owner_id_proof_url)')
            
            if fisher_id:
                query = query.eq('fisher_id', fisher_id)
                
            query = query.order('created_at', desc=True).range(offset, offset + limit - 1)
            result = query.execute()
            
            return self._process_product_results(result.data)
            
        except Exception as e:
            # Fallback to farmer_id (old schema) if error looks like column missing
            if fisher_id and ("column" in str(e).lower() or "does not exist" in str(e).lower() or "400" in str(e)):
                logger.warning(f"Failed to query with fisher_id, trying farmer_id: {e}")
                try:
                    query = self.supabase.table('products').select('*, vessels(vessel_image_url, vessel_documents_url, owner_id_proof_url)')
                    query = query.eq('farmer_id', fisher_id) # Use fisher_id value for farmer_id column
                    query = query.order('created_at', desc=True).range(offset, offset + limit - 1)
                    result = query.execute()
                    return self._process_product_results(result.data)
                except Exception as e2:
                    logger.error(f"Error listing products (fallback failed): {e2}")
                    return []
            
            logger.error(f"Error listing products: {e}")
            return []

    def _process_product_results(self, data: List[Dict]) -> List[Dict]:
        """Helper to process product results and flatten vessel details"""
        products = []
        for p in (data or []):
            vessel = p.pop('vessels', None)
            if vessel:
                if isinstance(vessel, list) and len(vessel) > 0:
                    vessel = vessel[0]
                
                if isinstance(vessel, dict):
                    p['vessel_image_url'] = vessel.get('vessel_image_url')
                    p['vessel_documents_url'] = vessel.get('vessel_documents_url')
                    p['owner_id_proof_url'] = vessel.get('owner_id_proof_url')
            
            # Normalize fields for frontend if using old schema
            if 'farmer_id' in p and 'fisher_id' not in p:
                p['fisher_id'] = p['farmer_id']
            if 'farmer_name' in p and 'fisher_name' not in p:
                p['fisher_name'] = p['farmer_name']
            if 'farm_name' in p and 'vessel_name' not in p:
                p['vessel_name'] = p['farm_name']
                
            products.append(p)
        return products

    async def get_product(self, batch_id: str) -> Optional[Dict]:
        """Fetch single product by batch id"""
        try:
            # First try to get the product without the join to avoid errors if relationship is missing
            result = self.supabase.table('products').select('*').eq('batch_id', batch_id).limit(1).execute()
            
            if not result.data:
                return None
                
            p = result.data[0]
            
            # Try to fetch vessel details separately if vessel_id exists
            vessel_id = p.get('vessel_id')
            # Ensure vessel_id is a valid non-empty string before querying to avoid UUID syntax errors
            if vessel_id and isinstance(vessel_id, str) and len(vessel_id.strip()) > 0 and vessel_id != 'null':
                try:
                    vessel_result = self.supabase.table('vessels').select('vessel_image_url, vessel_documents_url, owner_id_proof_url').eq('id', vessel_id).limit(1).execute()
                    if vessel_result.data:
                        vessel = vessel_result.data[0]
                        p['vessel_image_url'] = vessel.get('vessel_image_url')
                        p['vessel_documents_url'] = vessel.get('vessel_documents_url')
                        p['owner_id_proof_url'] = vessel.get('owner_id_proof_url')
                except Exception as ve:
                    logger.warning(f"Could not fetch vessel details for product {batch_id}: {ve}")
                    
            return p
        except Exception as e:
            logger.error(f"Error getting product {batch_id}: {e}")
            return None

    # --- Trips ---
    async def create_trip(self, trip_data: Dict) -> Dict:
        """Create a new trip"""
        try:
            result = self.supabase.table('trips').insert(trip_data).execute()
            if result.data:
                return result.data[0]
            raise Exception("Failed to create trip")
        except Exception as e:
            logger.error(f"Error creating trip: {e}")
            raise e

    async def get_trip(self, trip_code: str) -> Optional[Dict]:
        """Get trip by trip code"""
        try:
            result = self.supabase.table('trips').select("*").eq('trip_code', trip_code).execute()
            if result.data:
                return result.data[0]
            return None
        except Exception as e:
            logger.error(f"Error getting trip: {e}")
            return None

    # --- Vessels ---
    async def create_vessel(self, vessel_data: Dict) -> Dict:
        """Register a new vessel"""
        try:
            # Map 'type' to 'vessel_type' to match database schema
            if 'type' in vessel_data:
                vessel_data['vessel_type'] = vessel_data.pop('type')
                
            result = self.supabase.table('vessels').insert(vessel_data).execute()
            if result.data:
                return result.data[0]
            raise Exception("Failed to register vessel")
        except Exception as e:
            logger.error(f"Error registering vessel: {e}")
            raise e

    async def get_vessel(self, vessel_id: str) -> Optional[Dict]:
        """Get vessel details"""
        try:
            result = self.supabase.table('vessels').select("*").eq('id', vessel_id).execute()
            if result.data:
                return result.data[0]
            return None
        except Exception as e:
            logger.error(f"Error getting vessel: {e}")
            return None

    async def get_vessels(self, limit: int = 100, owner_id: Optional[str] = None) -> List[Dict]:
        """Get list of registered vessels, optionally filtered by owner"""
        try:
            query = self.supabase.table('vessels').select("*").order('created_at', desc=True).limit(limit)
            
            if owner_id:
                query = query.eq('owner_id', owner_id)
                
            result = query.execute()
            return result.data or []
        except Exception as e:
            logger.error(f"Error getting vessels: {e}")
            return []

    # --- Quality & Cold Chain ---
    async def create_quality_entry(self, quality_data: Dict) -> Dict:
        """Log a quality check"""
        try:
            result = self.supabase.table('fish_quality_entries').insert(quality_data).execute()
            if result.data:
                return result.data[0]
            raise Exception("Failed to create quality entry")
        except Exception as e:
            logger.error(f"Error creating quality entry: {e}")
            raise e

    async def create_cold_chain_log(self, log_data: Dict) -> Dict:
        """Log cold chain data"""
        try:
            result = self.supabase.table('cold_chain_logs').insert(log_data).execute()
            if result.data:
                return result.data[0]
            raise Exception("Failed to create cold chain log")
        except Exception as e:
            logger.error(f"Error creating cold chain log: {e}")
            raise e
    
    # === Statistics ===
    
    async def get_system_stats(self) -> Dict:
        """Get system statistics"""
        try:
            # Get counts
            trips_count = self.supabase.table('trips').select("id", count="exact").execute().count or 0
            entries_count = self.supabase.table('fish_entries').select("id", count="exact").execute().count or 0
            vessels_count = self.supabase.table('vessels').select("id", count="exact").execute().count or 0
            
            return {
                "total_trips": trips_count,
                "total_fish_entries": entries_count,
                "total_vessels": vessels_count,
                "blockchain_network": "VeChain TestNet",
                "system_status": "operational",
                "database": "Supabase PostgreSQL",
                "storage": "Supabase Storage"
            }
            
        except Exception as e:
            logger.error(f"Error getting system stats: {e}")
            return {
                "error": str(e)
            }
    
    # === Health Check ===
    
    async def health_check(self) -> Dict:
        """Check Supabase connection health"""
        try:
            # Test database connection
            result = self.supabase.table('fish_entries').select("id").limit(1).execute()
            
            # Test storage connection
            buckets = self.supabase.storage.list_buckets()
            
            return {
                "status": "healthy",
                "database": "connected",
                "storage": "connected",
                "buckets": len(buckets),
                "timestamp": datetime.utcnow().isoformat()
            }
        except Exception as e:
            return {
                "status": "unhealthy",
                "database": "error",
                "storage": "error",
                "error": str(e),
                "timestamp": datetime.utcnow().isoformat()
            }

    # === Fisher Management ===

    async def get_fisher_profile(self, fisher_id: str) -> Optional[Dict]:
        """Get fisher profile information."""
        try:
            result = self.supabase.table('fisher_profiles').select('*').eq('fisher_id', fisher_id).execute()
            if result.data:
                return result.data[0]
            return None
        except Exception as e:
            logger.error(f"Error fetching fisher profile {fisher_id}: {e}")
            return None

    async def create_fisher_profile(self, profile_data: Dict) -> Dict:
        """Create a new fisher profile."""
        try:
            profile_data = {**profile_data, 'created_at': datetime.utcnow().isoformat(), 'updated_at': datetime.utcnow().isoformat()}
            result = self.supabase.table('fisher_profiles').insert(profile_data).execute()
            if result.data:
                return result.data[0]
            raise Exception('Failed to create fisher profile')
        except Exception as e:
            logger.error(f"Error creating fisher profile: {e}")
            raise e

    # === Catches Management ===

    async def get_fisher_catches(self, fisher_id: str, limit: int = 50) -> List[Dict]:
        """Get catches (fish entries) for a specific fisher."""
        try:
            # Updated to use fish_entries table
            result = self.supabase.table('fish_entries').select('*').eq('created_by', fisher_id).order('created_at', desc=True).limit(limit).execute()
            return result.data or []
        except Exception as e:
            logger.error(f"Error fetching catches for {fisher_id}: {e}")
            return []

    async def create_catch_record(self, catch_data: Dict) -> Dict:
        """Create a new catch record (fish entry)."""
        try:
            # Updated to use fish_entries table
            catch_data = {**catch_data, 'created_at': datetime.utcnow().isoformat()}
            result = self.supabase.table('fish_entries').insert(catch_data).execute()
            if result.data:
                return result.data[0]
            raise Exception('Failed to create catch record')
        except Exception as e:
            logger.error(f"Error creating catch record: {e}")
            raise e

    # === Fisher History Persistence ===

    async def get_fisher_history(self, fisher_id: str) -> Optional[Dict]:
        """Fetch extended fisher history (biography, vessel, catches, gear, sea_logs, timeline)."""
        try:
            result = self.supabase.table('fisher_history').select('*').eq('fisher_id', fisher_id).execute()
            if result.data:
                return result.data[0]
            return None
        except Exception as e:
            logger.error(f"Error fetching fisher history {fisher_id}: {e}")
            return None

    async def upsert_fisher_history(self, fisher_id: str, history: Dict) -> Dict:
        """Insert or update fisher history. Accepts raw dict with JSON-friendly fields."""
        try:
            payload = {"fisher_id": fisher_id, **history, "updated_at": datetime.utcnow().isoformat()}
            # Check existing
            existing = self.supabase.table('fisher_history').select('fisher_id').eq('fisher_id', fisher_id).execute()
            if existing.data:
                result = self.supabase.table('fisher_history').update(payload).eq('fisher_id', fisher_id).execute()
            else:
                result = self.supabase.table('fisher_history').insert(payload).execute()
            if result.data:
                return result.data[0]
            raise Exception('Failed to upsert fisher history')
        except Exception as e:
            logger.error(f"Error upserting fisher history {fisher_id}: {e}")
            raise e

    async def append_fisher_timeline_event(self, fisher_id: str, event: Dict) -> Dict:
        """Append a single timeline event to existing history, creating record if missing."""
        try:
            current = await self.get_fisher_history(fisher_id)
            if not current:
                current_timeline = [event]
                history = {"timeline": current_timeline}
                return await self.upsert_fisher_history(fisher_id, history)
            timeline = current.get('timeline') or []
            timeline.append(event)
            updated = {k: v for k, v in current.items() if k != 'timeline'}
            updated['timeline'] = timeline
            return await self.upsert_fisher_history(fisher_id, updated)
        except Exception as e:
            logger.error(f"Error appending timeline event for {fisher_id}: {e}")
            raise e

    # === Fisher Stories ===

    async def get_fisher_stories(self, fisher_id: str, public_only: bool = False) -> List[Dict]:
        """List stories for a fisher. If public_only=True, only return public posts."""
        try:
            query = self.supabase.table('fisher_stories').select('*').eq('fisher_id', fisher_id)
            if public_only:
                query = query.eq('is_public', True)
            result = query.order('created_at', desc=True).execute()
            return result.data or []
        except Exception as e:
            logger.error(f"Error fetching stories for {fisher_id}: {e}")
            return []

    async def list_public_stories(self, limit: int = 50) -> List[Dict]:
        """List latest public stories across all fishers."""
        try:
            result = self.supabase.table('fisher_stories').select('*').eq('is_public', True).order('created_at', desc=True).limit(limit).execute()
            return result.data or []
        except Exception as e:
            logger.error(f"Error listing public stories: {e}")
            return []

    async def create_fisher_story(self, post: Dict) -> Dict:
        """Create a new story."""
        try:
            post = {**post, 'created_at': datetime.utcnow().isoformat(), 'updated_at': datetime.utcnow().isoformat()}
            result = self.supabase.table('fisher_stories').insert(post).execute()
            if result.data:
                return result.data[0]
            raise Exception('Failed to create story')
        except Exception as e:
            logger.error(f"Error creating story: {e}")
            raise e

    async def update_fisher_story(self, fisher_id: str, post_id: str, updates: Dict) -> Dict:
        """Update an existing story belonging to fisher_id."""
        try:
            updates = {**updates, 'updated_at': datetime.utcnow().isoformat()}
            result = self.supabase.table('fisher_stories').update(updates).eq('id', post_id).eq('fisher_id', fisher_id).execute()
            if result.data:
                return result.data[0]
            raise Exception('Failed to update story')
        except Exception as e:
            logger.error(f"Error updating story {post_id}: {e}")
            raise e

    async def delete_fisher_story(self, fisher_id: str, post_id: str) -> bool:
        """Delete a story by id for a given fisher."""
        try:
            self.supabase.table('fisher_stories').delete().eq('id', post_id).eq('fisher_id', fisher_id).execute()
            return True
        except Exception as e:
            logger.error(f"Error deleting story {post_id}: {e}")
            return False

    async def upload_qr_code(self, batch_id: str, image_data: io.BytesIO, metadata: Dict) -> str:
        """
        Upload QR code with time-based folder structure:
        Path: YYYY/MM/DD/{batch_id}.png
        """
        try:
            now = datetime.utcnow()
            # Structure: Year/Month/Day/BatchID.png
            path = f"{now.year}/{now.month:02d}/{now.day:02d}/{batch_id}.png"
            
            # Ensure we are at the start of the stream
            image_data.seek(0)
            
            self.supabase.storage.from_(self.qr_bucket).upload(
                path, 
                image_data.getvalue(), 
                {"content-type": "image/png", "upsert": "true"}
            )
            
            return self.supabase.storage.from_(self.qr_bucket).get_public_url(path)
        except Exception as e:
            logger.error(f"Error uploading QR code: {e}")
            # Return a fallback or re-raise depending on strictness. 
            # For now, return None or empty string to indicate failure, but type hint says str.
            # Let's return empty string and handle upstream.
            return ""

    async def upload_catch_media(self, vessel_name: str, batch_id: str, file_bytes: bytes, filename: str, content_type: str = 'image/jpeg') -> Optional[str]:
        """
        Upload catch media organized by Vessel Name.
        Path: {vessel_name}/{batch_id}/{filename}
        """
        try:
            # Sanitize vessel name (replace spaces/special chars with underscore)
            safe_vessel_name = "".join(c if c.isalnum() else "_" for c in vessel_name)
            
            # Structure: VesselName/BatchID/Filename
            path = f"{safe_vessel_name}/{batch_id}/{filename}"
            
            self.supabase.storage.from_(self.blog_media_bucket).upload(
                path, 
                file_bytes, 
                {"content-type": content_type, "upsert": "true"}
            )
            
            return self.supabase.storage.from_(self.blog_media_bucket).get_public_url(path)
        except Exception as e:
            logger.error(f"Error uploading catch media: {e}")
            return None

    async def upload_story_media(self, fisher_id: str, file_bytes: bytes, filename: str, content_type: str = 'image/jpeg') -> Optional[str]:
        """
        Legacy upload for stories (kept for compatibility, but redirects to catch media structure if possible)
        """
        # For backward compatibility, we just use a generic folder if no vessel info is passed
        return await self.upload_catch_media("General_Uploads", fisher_id, file_bytes, filename, content_type)

    async def upload_vessel_media(self, file_bytes: bytes, filename: str, content_type: str = 'image/jpeg', vessel_name: str = "Unknown_Vessel") -> Optional[str]:
        """
        Upload vessel documents/images organized by Vessel Name.
        Path: {vessel_name}/documents/{filename}
        """
        try:
            safe_vessel_name = "".join(c if c.isalnum() else "_" for c in vessel_name)
            
            # Structure: VesselName/documents/Filename
            path = f"{safe_vessel_name}/documents/{filename}"
            
            self.supabase.storage.from_(self.vessel_media_bucket).upload(path, file_bytes, {"content-type": content_type, "upsert": "true"})
            url = self.supabase.storage.from_(self.vessel_media_bucket).get_public_url(path)
            return url
        except StorageException as e:
            logger.error(f"Storage error uploading vessel media: {e}")
            return None
        except Exception as e:
            logger.error(f"Error uploading vessel media: {e}")
            return None

    # === Batch Operations ===

    async def create_batch(self, batch_data: Dict) -> Dict:
        """Create a new batch in Supabase"""
        try:
            batch_data = {**batch_data, 'created_at': datetime.utcnow().isoformat(), 'updated_at': datetime.utcnow().isoformat()}
            result = self.supabase.table('batches').insert(batch_data).execute()
            
            if result.data:
                logger.info(f"Batch created: {batch_data.get('batch_id')}")
                return result.data[0]
            else:
                raise Exception("Failed to create batch")
                
        except Exception as e:
            logger.error(f"Error creating batch: {e}")
            raise e

    async def get_batch(self, batch_id: str) -> Optional[Dict]:
        """Get batch details by batch ID"""
        try:
            result = self.supabase.table('batches').select("*").eq('batch_id', batch_id).execute()
            
            if result.data:
                return result.data[0]
            return None
            
        except Exception as e:
            logger.error(f"Error getting batch: {e}")
            return None

    async def get_recent_blockchain_transactions(self, limit: int = 10) -> List[Dict]:
        """Get recent blockchain transactions from fish entries"""
        try:
            # Query fish_entries with on_chain_tx_hash
            result = self.supabase.table('fish_entries')\
                .select("*")\
                .neq('on_chain_tx_hash', 'null')\
                .order('created_at', desc=True)\
                .limit(limit)\
                .execute()
            
            return result.data or []
        except Exception as e:
            logger.error(f"Error getting blockchain transactions: {e}")
            return []
# Global Supabase service instance
supabase_service: Optional[SupabaseService] = None

def get_supabase_service() -> SupabaseService:
    """Get global Supabase service instance"""
    global supabase_service
    if supabase_service is None:
        raise Exception("Supabase service not initialized")
    return supabase_service

def init_supabase_service(url: str, key: str) -> SupabaseService:
    """Initialize global Supabase service"""
    global supabase_service
    supabase_service = SupabaseService(url, key)
    return supabase_service