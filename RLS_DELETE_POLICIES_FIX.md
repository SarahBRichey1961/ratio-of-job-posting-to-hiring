# CRITICAL FIX: Apply Missing DELETE RLS Policies

## The Root Cause
Row-Level Security (RLS) is enabled on `hub_projects` and `hub_discussions`, but **DELETE policies are missing**. This means all DELETE operations are blocked by RLS, even from authenticated users.

## What's happening:
1. User clicks delete ✅
2. API receives request and verifies ownership ✅
3. API calls `authenticatedSupabase.delete()` ✅
4. **RLS policy blocks the delete because no DELETE policy exists** ❌
5. Delete returns 0 rows deleted (silently fails)
6. API returns 200 success (because no error was thrown)
7. User thinks it deleted but row still exists ❌

## The Solution: Add DELETE RLS Policies

You need to apply these SQL statements to your Supabase database.

### Option 1: Via Supabase Dashboard (Recommended)

1. Go to: https://app.supabase.com/project/eikhrkharihagaorqqcf/sql/new
2. Copy and paste ALL of the following SQL:

```sql
-- Add DELETE policy for hub_projects
CREATE POLICY "Users can delete their own projects" ON hub_projects FOR DELETE USING (auth.uid() = creator_id);

-- Add DELETE policy for hub_discussions
CREATE POLICY "Users can delete their own discussions" ON hub_discussions FOR DELETE USING (auth.uid() = creator_id);

-- Add DELETE policy for hub_discussion_comments
CREATE POLICY "Users can delete their own comments" ON hub_discussion_comments FOR DELETE USING (auth.uid() = author_id);

-- Add DELETE policy for hub_project_members
CREATE POLICY "Project owners can delete members" ON hub_project_members FOR DELETE USING (
  EXISTS (SELECT 1 FROM hub_projects WHERE id = project_id AND creator_id = auth.uid())
);
```

3. Click "Run" or press `Ctrl+Enter`
4. You should see "✓ Success" messages for each CREATE POLICY statement

### Option 2: Via psql (if you have psql installed)

```bash
# First, get your database password from Supabase dashboard
# Then run:
psql -h eikhrkharihagaorqqcf.supabase.co -U postgres -d postgres < rls_delete_policies.sql
```

### Option 3: Via Node.js Script (Manual - requires service key)

If you have SUPABASE_SERVICE_ROLE_KEY:
```bash
node apply-delete-policies.js
```

## Verification

After applying the policies, test the deletion:

1. In your app, try deleting a project
2. Watch the server logs for the detailed logging output
3. You should see:
   - ✅ User ID matches creator ID
   - ✅ Delete response shows 1 row affected
   - ✅ Project is removed from UI

## API Changes Made

Two API endpoints now include detailed logging:

1. **`/api/hub/projects/[id].ts`** - DELETE endpoint
   - Logs user authentication details
   - Logs delete response and row count
   - Detects if RLS is blocking and returns helpful error

2. **`/api/hub/discussions/[id].ts`** - DELETE endpoint  
   - Logs all delete operations
   - Verifies both comments and discussion are deleted
   - Returns error if RLS policies block deletion

## Next Steps

1. **Apply the RLS policies** (required)
2. Commit and push code changes
3. Test deletion functionality
4. Check server logs to verify the policies are working

The new logging will help us identify any remaining issues!
