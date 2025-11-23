"""
ROOT VERSE Authentication Service
Handles user authentication, registration, and session management
"""

import os
import secrets
import hashlib
import uuid
from datetime import datetime, timedelta
from typing import Dict, Optional, Tuple
from supabase import Client
import logging

logger = logging.getLogger(__name__)

class AuthService:
    def __init__(self, supabase_client: Client):
        self.supabase = supabase_client
        self.token_expiry_days = 7
    
    def _hash_password(self, password: str) -> str:
        """Hash password using SHA-256"""
        salt = os.getenv("PASSWORD_SALT", "rootverse_secure_salt_2025")
        return hashlib.sha256(f"{password}{salt}".encode()).hexdigest()
    
    def _generate_token(self) -> str:
        """Generate secure session token"""
        return secrets.token_urlsafe(32)
    
    async def register_user(
        self, 
        email: str, 
        password: str, 
        full_name: str,
        role: str, # Role is now mandatory and must be fisher, distributor, or admin
        phone: Optional[str] = None,
        location: Optional[str] = None
    ) -> Dict:
        """Register a new user (Fisher, Distributor, or Admin)"""
        try:
            # Validate role
            allowed_roles = ["fisher", "distributor", "admin"]
            if role not in allowed_roles:
                raise Exception(f"Invalid role. Must be one of: {', '.join(allowed_roles)}")

            # Check if user already exists
            existing = self.supabase.table('users').select("*").eq('email', email).execute()
            if existing.data:
                raise Exception("User with this email already exists")
            
            # Hash password
            password_hash = self._hash_password(password)
            
            # Create user
            user_data = {
                "email": email,
                "password_hash": password_hash,
                "full_name": full_name,
                "role": role,
                "phone": phone,
                "location": location,
                "is_verified": False,
                "is_active": True
            }
            
            result = self.supabase.table('users').insert(user_data).execute()
            
            if not result.data:
                raise Exception("Failed to create user")
            
            user = result.data[0]
            
            # Create session
            token = self._generate_token()
            expires_at = datetime.utcnow() + timedelta(days=self.token_expiry_days)
            
            session_data = {
                "user_id": user["id"],
                "token": token,
                "expires_at": expires_at.isoformat()
            }
            
            self.supabase.table('user_sessions').insert(session_data).execute()
            
            # Log activity
            self._log_activity(user["id"], "user_registered", f"New user registered: {email}")
            
            logger.info(f"User registered successfully: {email}")
            
            return {
                "success": True,
                "user": {
                    "id": user["id"],
                    "email": user["email"],
                    "full_name": user["full_name"],
                    "role": user["role"]
                },
                "token": token,
                "expires_at": expires_at.isoformat()
            }
            
        except Exception as e:
            logger.error(f"Registration error: {e}")
            raise e
    
    async def login(self, email: str, password: str, ip_address: Optional[str] = None) -> Dict:
        """Authenticate user and create session"""
        try:
            # Find user
            result = self.supabase.table('users').select("*").eq('email', email).execute()
            
            if not result.data:
                raise Exception("Invalid email or password")
            
            user = result.data[0]
            
            # Check if user is active
            if not user.get("is_active"):
                raise Exception("Account is deactivated")
            
            # Verify password
            password_hash = self._hash_password(password)
            if user["password_hash"] != password_hash:
                raise Exception("Invalid email or password")
            
            # Create new session
            token = self._generate_token()
            expires_at = datetime.utcnow() + timedelta(days=self.token_expiry_days)
            
            session_data = {
                "user_id": user["id"],
                "token": token,
                "expires_at": expires_at.isoformat(),
                "ip_address": ip_address
            }
            
            self.supabase.table('user_sessions').insert(session_data).execute()
            
            self.supabase.table('users').update({
            }).eq('id', user["id"]).execute()
            
            # Log activity
            self._log_activity(user["id"], "user_login", f"User logged in: {email}")
            
            logger.info(f"User logged in successfully: {email}")
            
            return {
                "success": True,
                "user": {
                    "id": user["id"],
                    "email": user["email"],
                    "full_name": user["full_name"],
                    "role": user["role"],
                    "phone": user.get("phone"),
                    "location": user.get("location"),
                    "profile_image_url": user.get("profile_image_url"),
                    "is_verified": user.get("is_verified"),
                    "created_at": user.get("created_at")
                },
                "token": token,
                "expires_at": expires_at.isoformat()
            }
            
        except Exception as e:
            logger.error(f"Login error: {e}")
            raise e
    
    async def verify_token(self, token: str) -> Optional[Dict]:
        """Verify session token and return user data"""
        try:
            # Find session
            result = self.supabase.table('user_sessions').select("*").eq('token', token).execute()
            
            if not result.data:
                return None
            
            session = result.data[0]
            
            # Check if expired
            expires_at = datetime.fromisoformat(session["expires_at"].replace('Z', '+00:00'))
            if datetime.utcnow().replace(tzinfo=expires_at.tzinfo) > expires_at:
                # Delete expired session
                self.supabase.table('user_sessions').delete().eq('token', token).execute()
                return None
            
            # Get user
            user_result = self.supabase.table('users').select("*").eq('id', session["user_id"]).execute()
            
            if not user_result.data:
                return None
            
            user = user_result.data[0]
            
            if not user.get("is_active"):
                return None
            
            return {
                "user": {
                    "id": user["id"],
                    "email": user["email"],
                    "full_name": user["full_name"],
                    "role": user["role"],
                    "phone": user.get("phone"),
                    "location": user.get("location"),
                    "profile_image_url": user.get("profile_image_url"),
                    "is_verified": user.get("is_verified")
                }
            }
            
        except Exception as e:
            logger.error(f"Token verification error: {e}")
            return None
    
    async def logout(self, token: str) -> bool:
        """Logout user by deleting session"""
        try:
            result = self.supabase.table('user_sessions').delete().eq('token', token).execute()
            return True
        except Exception as e:
            logger.error(f"Logout error: {e}")
            return False
    
    async def create_fisher_profile(
        self,
        user_id: str,
        full_name: str,
        vessel_name: str,
        home_port: str,
        community_name: Optional[str] = None,
        vessel_capacity_tonnes: Optional[float] = None,
        sustainability_certified: bool = False,
        specialization: Optional[list] = None
    ) -> Dict:
        """Create fisher profile"""
        try:
            profile_data = {
                "user_id": user_id,
                "full_name": full_name,
                "vessel_name": vessel_name,
                "home_port": home_port,
                "community_name": community_name,
                "vessel_capacity_tonnes": vessel_capacity_tonnes,
                "sustainability_certified": sustainability_certified,
                "specialization": specialization or []
            }
            
            logger.info(f"Fisher profile creation skipped (table removed): {user_id}")
            return {"message": "Profile stored in users table"}
                
        except Exception as e:
            logger.error(f"Create fisher profile error: {e}")
            raise e
    
    def _log_activity(self, user_id: str, activity_type: str, description: str):
        """Log user activity"""
        try:
            activity_data = {
                "user_id": user_id,
                "activity_type": activity_type,
                "activity_description": description
            }
            self.supabase.table('user_activity_logs').insert(activity_data).execute()
        except Exception as e:
            logger.warning(f"Failed to log activity: {e}")

# Global auth service instance
auth_service: Optional[AuthService] = None

def init_auth_service(supabase_client: Client) -> AuthService:
    """Initialize global auth service"""
    global auth_service
    auth_service = AuthService(supabase_client)
    return auth_service

def get_auth_service() -> AuthService:
    """Get global auth service instance"""
    global auth_service
    if auth_service is None:
        raise Exception("Auth service not initialized")
    return auth_service
