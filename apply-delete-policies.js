#!/usr/bin/env node
/**
 * Apply missing DELETE RLS policies to Supabase
 * Run with: node apply-delete-policies.js
 */

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceKey) {
  console.error('❌ Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceKey);

const policies = [
  {
    name: "Users can delete their own projects",
    table: "hub_projects",
    operation: "DELETE",
    sql: `CREATE POLICY "Users can delete their own projects" ON hub_projects FOR DELETE USING (auth.uid() = creator_id);`
  },
  {
    name: "Users can delete their own discussions",
    table: "hub_discussions",
    operation: "DELETE",
    sql: `CREATE POLICY "Users can delete their own discussions" ON hub_discussions FOR DELETE USING (auth.uid() = creator_id);`
  },
  {
    name: "Users can delete their own comments",
    table: "hub_discussion_comments",
    operation: "DELETE",
    sql: `CREATE POLICY "Users can delete their own comments" ON hub_discussion_comments FOR DELETE USING (auth.uid() = author_id);`
  },
  {
    name: "Project owners can delete members",
    table: "hub_project_members",
    operation: "DELETE",
    sql: `CREATE POLICY "Project owners can delete members" ON hub_project_members FOR DELETE USING (
      EXISTS (SELECT 1 FROM hub_projects WHERE id = project_id AND creator_id = auth.uid())
    );`
  }
];

async function applyPolicies() {
  console.log('📋 Applying DELETE RLS policies to Supabase...\n');
  
  for (const policy of policies) {
    try {
      console.log(`📌 Applying: ${policy.name}`);
      console.log(`   Table: ${policy.table}, Operation: ${policy.operation}`);
      
      // Execute SQL through Supabase
      const { error } = await supabase.rpc('exec_sql', { sql: policy.sql });
      
      if (error) {
        // Check if operation is not supported via RPC - that's ok, might just be already applied
        if (error.message?.includes('does not exist') || error.message?.includes('already exists')) {
          console.log(`   ⚠️  Policy may already exist or syntax issue (safe to continue)`);
        } else {
          console.error(`   ❌ Error: ${error.message}`);
        }
      } else {
        console.log(`   ✅ Success`);
      }
    } catch (err) {
      console.error(`   ❌ Failed: ${err.message}`);
    }
    console.log();
  }
  
  console.log('✅ Policy application attempt completed');
  console.log('\n📝 Note: If RPC method is not available, apply policies manually via Supabase SQL editor:');
  policies.forEach(p => {
    console.log(`\n${p.sql}`);
  });
}

applyPolicies().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
