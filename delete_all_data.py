"""
DELETE ALL DATABASE DATA & STORAGE - Complete Clean Slate Script
Run this before CLEAN_DATABASE_SETUP.sql to ensure a fresh start
"""
import os
from dotenv import load_dotenv
from supabase import create_client, Client

# Load environment variables
load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY") or os.getenv("SUPABASE_KEY")

if not SUPABASE_URL or not SUPABASE_KEY:
    print("❌ ERROR: SUPABASE_URL or SUPABASE_KEY not found in .env file")
    exit(1)

print("🔗 Connecting to Supabase...")
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

# Tables to delete in order (respecting foreign key dependencies)
# Only including tables that actually exist in your database
TABLES_TO_DROP = [
    "user_sessions",
    "user_activity_logs",
    "products",
    "vessels",
    "users"
]

# Storage buckets to clean
STORAGE_BUCKETS = [
    "qr-codes",
    "vessel-media",
    "catch-media",
    "fisher-stories",
    "product-images",
    "vessel-documents",
    "owner-proofs"
]

print("\n" + "="*60)
print("⚠️  WARNING: This will DELETE ALL data from these tables:")
print("="*60)
for table in TABLES_TO_DROP:
    print(f"  - {table}")
print("="*60)

response = input("\nAre you sure you want to continue? Type 'DELETE ALL' to confirm: ")

if response != "DELETE ALL":
    print("❌ Aborted. No changes made.")
    exit(0)

print("\n🗑️  Starting deletion process...\n")

deleted_count = 0
failed_tables = []

for table in TABLES_TO_DROP:
    try:
        print(f"Deleting from {table}...", end=" ")
        
        # Get all rows first to count them
        all_rows = supabase.table(table).select("*").execute()
        row_count = len(all_rows.data) if all_rows.data else 0
        
        if row_count > 0:
            # Delete all rows (different approach for products table with integer ID)
            if table == "products":
                # For products table with SERIAL id, delete by id > 0
                result = supabase.table(table).delete().gt('id', 0).execute()
            else:
                # For UUID id tables
                result = supabase.table(table).delete().neq('id', '00000000-0000-0000-0000-000000000000').execute()
            print(f"✅ Deleted {row_count} rows")
        else:
            print(f"✅ Already empty")
        
        deleted_count += 1
        
    except Exception as e:
        error_msg = str(e)
        if "does not exist" in error_msg or "relation" in error_msg or "PGRST205" in error_msg:
            print(f"⚠️  Table doesn't exist (skipping)")
        else:
            print(f"❌ Error: {error_msg}")
            failed_tables.append(table)

print("\n" + "="*60)
print(f"✅ Table deletion complete!")
print(f"   Tables processed: {deleted_count}/{len(TABLES_TO_DROP)}")
if failed_tables:
    print(f"   Failed tables: {', '.join(failed_tables)}")
print("="*60)

# Clean storage buckets
print("\n🗑️  Cleaning storage buckets...")
storage_cleaned = 0
for bucket in STORAGE_BUCKETS:
    try:
        print(f"Cleaning bucket '{bucket}'...", end=" ")
        # List all files in bucket
        files = supabase.storage.from_(bucket).list()
        if files and len(files) > 0:
            # Delete all files
            file_paths = [f['name'] for f in files]
            supabase.storage.from_(bucket).remove(file_paths)
            print(f"✅ Cleaned {len(file_paths)} files")
        else:
            print("✅ Empty")
        storage_cleaned += 1
    except Exception as e:
        error_msg = str(e)
        if "not found" in error_msg or "does not exist" in error_msg:
            print(f"⚠️  Bucket doesn't exist")
        else:
            print(f"⚠️  {error_msg}")

print("\n" + "="*60)
print("✅ COMPLETE CLEANUP FINISHED!")
print(f"   Tables: {deleted_count}/{len(TABLES_TO_DROP)}")
print(f"   Storage: {storage_cleaned}/{len(STORAGE_BUCKETS)}")
print("="*60)

print("\n📋 Next steps:")
print("1. Run CLEAN_DATABASE_SETUP.sql in Supabase SQL Editor")
print("2. This will create fresh optimized tables")
print("3. Restart backend: python main.py")
print("4. Start frontend: npm run dev")
print("\n🎉 Ready for fresh start!")
