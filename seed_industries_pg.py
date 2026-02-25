#!/usr/bin/env python3
"""
Connect directly to Supabase PostgreSQL and execute migrations
"""
import os
import subprocess
import tempfile

# Supabase connection details
HOST = "blhrazwlfzrclwaluqak.postgres.supabase.co"
PORT = "5432"
DATABASE = "postgres"
USER = "postgres"

# For now, use environment variable or ask
PASSWORD = os.environ.get('POSTGRES_PASSWORD', '')

if not PASSWORD:
    print("❌ POSTGRES_PASSWORD environment variable not set")
    print("\nYou need to:")
    print("1. Go to Supabase Dashboard → Settings → Database")
    print("2. Copy your database password")
    print("3. Run: $env:POSTGRES_PASSWORD='your_password'; python seed_industries_pg.py")
    exit(1)

# Read migration files
print("📋 Reading migration files...")
with open('supabase/migrations/017_add_industry_and_roles.sql', 'r') as f:
    migration_017 = f.read()

with open('supabase/migrations/018_seed_industries_and_boards.sql', 'r') as f:
    migration_018 = f.read()

# Combine migrations
full_sql = migration_017 + "\n" + migration_018

# Write to temp file
with tempfile.NamedTemporaryFile(mode='w', suffix='.sql', delete=False) as f:
    f.write(full_sql)
    temp_file = f.name

try:
    print("🔄 Executing migrations...")
    
    # Build psql command
    cmd = [
        'psql',
        f'-h', HOST,
        f'-p', PORT,
        f'-U', USER,
        f'-d', DATABASE,
        f'-f', temp_file
    ]
    
    # Set password via environment variable
    env = os.environ.copy()
    env['PGPASSWORD'] = PASSWORD
    
    # Execute
    result = subprocess.run(cmd, env=env, capture_output=True, text=True, timeout=120)
    
    print(result.stdout)
    if result.stderr:
        print("⚠️  Warnings/Errors:")
        print(result.stderr)
    
    if result.returncode == 0:
        print("\n✅ Migrations executed successfully!")
    else:
        print(f"\n❌ Error (exit code: {result.returncode})")
        
finally:
    # Clean up temp file
    if os.path.exists(temp_file):
        os.remove(temp_file)
