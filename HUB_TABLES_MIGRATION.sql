-- Create Hub Tables for AI Learning Community

-- Hub Users (extends auth.users)
CREATE TABLE IF NOT EXISTS hub_members (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username VARCHAR(50) UNIQUE NOT NULL,
  bio TEXT,
  avatar_url VARCHAR(255),
  skills TEXT[] DEFAULT ARRAY[]::TEXT[],
  expertise_areas TEXT[] DEFAULT ARRAY[]::TEXT[],
  joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Hub Projects (AI solution building projects) - THIS HAS learning_goals AND technologies_used
CREATE TABLE IF NOT EXISTS hub_projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  problem_statement TEXT,
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'completed', 'on_hold', 'archived')),
  category VARCHAR(50),
  difficulty_level VARCHAR(20) DEFAULT 'beginner' CHECK (difficulty_level IN ('beginner', 'intermediate', 'advanced')),
  creator_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  start_date TIMESTAMP,
  target_completion_date TIMESTAMP,
  repository_url VARCHAR(255),
  learning_goals TEXT[] DEFAULT ARRAY[]::TEXT[],
  technologies_used TEXT[] DEFAULT ARRAY[]::TEXT[]
);

-- Project Members (users working on projects)
CREATE TABLE IF NOT EXISTS hub_project_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES hub_projects(id) ON DELETE CASCADE,
  member_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role VARCHAR(50) DEFAULT 'contributor' CHECK (role IN ('owner', 'lead', 'contributor', 'mentor')),
  joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(project_id, member_id)
);

-- Hub Discussions (community discussions about problems and solutions)
CREATE TABLE IF NOT EXISTS hub_discussions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  category VARCHAR(50),
  type VARCHAR(20) DEFAULT 'question' CHECK (type IN ('question', 'issue', 'idea', 'solution', 'resource')),
  creator_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  project_id UUID REFERENCES hub_projects(id) ON DELETE SET NULL,
  status VARCHAR(20) DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'resolved', 'closed')),
  tags TEXT[] DEFAULT ARRAY[]::TEXT[],
  ai_related BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  views INT DEFAULT 0,
  upvotes INT DEFAULT 0
);

-- Discussion Comments
CREATE TABLE IF NOT EXISTS hub_discussion_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  discussion_id UUID NOT NULL REFERENCES hub_discussions(id) ON DELETE CASCADE,
  author_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  is_solution BOOLEAN DEFAULT false,
  upvotes INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Learning Resources
CREATE TABLE IF NOT EXISTS hub_learning_resources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(255) NOT NULL,
  description TEXT,
  resource_type VARCHAR(50),
  url VARCHAR(255),
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  category VARCHAR(50),
  difficulty_level VARCHAR(20),
  duration_minutes INT,
  tags TEXT[] DEFAULT ARRAY[]::TEXT[],
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- User Progress/Achievements
CREATE TABLE IF NOT EXISTS hub_user_achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  achievement_type VARCHAR(100),
  title VARCHAR(255),
  description TEXT,
  earned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  metadata JSONB
);

-- Job Opportunities for Hub Members
CREATE TABLE IF NOT EXISTS hub_opportunities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(255) NOT NULL,
  description TEXT,
  company_name VARCHAR(255),
  opportunity_type VARCHAR(50) CHECK (opportunity_type IN ('job', 'freelance', 'internship', 'collaboration', 'mentorship')),
  skills_required TEXT[],
  posted_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  expires_at TIMESTAMP,
  is_ai_focused BOOLEAN DEFAULT true,
  status VARCHAR(20) DEFAULT 'open' CHECK (status IN ('open', 'closed', 'filled'))
);

-- Opportunity Applications
CREATE TABLE IF NOT EXISTS hub_opportunity_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  opportunity_id UUID NOT NULL REFERENCES hub_opportunities(id) ON DELETE CASCADE,
  applicant_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  cover_letter TEXT,
  portfolio_url VARCHAR(255),
  applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected', 'withdrawn')),
  UNIQUE(opportunity_id, applicant_id)
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_hub_members_username ON hub_members(username);
CREATE INDEX IF NOT EXISTS idx_hub_projects_creator_id ON hub_projects(creator_id);
CREATE INDEX IF NOT EXISTS idx_hub_projects_status ON hub_projects(status);
CREATE INDEX IF NOT EXISTS idx_hub_project_members_project_id ON hub_project_members(project_id);
CREATE INDEX IF NOT EXISTS idx_hub_project_members_member_id ON hub_project_members(member_id);
CREATE INDEX IF NOT EXISTS idx_hub_discussions_creator_id ON hub_discussions(creator_id);
CREATE INDEX IF NOT EXISTS idx_hub_discussions_project_id ON hub_discussions(project_id);
CREATE INDEX IF NOT EXISTS idx_hub_discussions_type ON hub_discussions(type);
CREATE INDEX IF NOT EXISTS idx_hub_discussion_comments_discussion_id ON hub_discussion_comments(discussion_id);
CREATE INDEX IF NOT EXISTS idx_hub_learning_resources_category ON hub_learning_resources(category);
CREATE INDEX IF NOT EXISTS idx_hub_opportunities_status ON hub_opportunities(status);
CREATE INDEX IF NOT EXISTS idx_hub_opportunity_applications_applicant_id ON hub_opportunity_applications(applicant_id);

-- Enable Row Level Security
ALTER TABLE hub_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE hub_projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE hub_project_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE hub_discussions ENABLE ROW LEVEL SECURITY;
ALTER TABLE hub_discussion_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE hub_learning_resources ENABLE ROW LEVEL SECURITY;
ALTER TABLE hub_user_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE hub_opportunities ENABLE ROW LEVEL SECURITY;
ALTER TABLE hub_opportunity_applications ENABLE ROW LEVEL SECURITY;

-- RLS Policies for hub_members
DROP POLICY IF EXISTS "Users can view all hub members" ON hub_members;
DROP POLICY IF EXISTS "Users can update their own profile" ON hub_members;
CREATE POLICY "Users can view all hub members" ON hub_members FOR SELECT USING (true);
CREATE POLICY "Users can update their own profile" ON hub_members FOR UPDATE USING (auth.uid() = id);

-- RLS Policies for hub_projects
DROP POLICY IF EXISTS "Anyone can view public projects" ON hub_projects;
DROP POLICY IF EXISTS "Users can create projects" ON hub_projects;
DROP POLICY IF EXISTS "Project members can update their own projects" ON hub_projects;
CREATE POLICY "Anyone can view public projects" ON hub_projects FOR SELECT USING (true);
CREATE POLICY "Users can create projects" ON hub_projects FOR INSERT WITH CHECK (auth.uid() = creator_id);
CREATE POLICY "Project members can update their own projects" ON hub_projects FOR UPDATE USING (auth.uid() = creator_id OR EXISTS (SELECT 1 FROM hub_project_members WHERE project_id = hub_projects.id AND member_id = auth.uid()));

-- RLS Policies for hub_project_members
DROP POLICY IF EXISTS "Anyone can view project members" ON hub_project_members;
DROP POLICY IF EXISTS "Project owners can add members" ON hub_project_members;
CREATE POLICY "Anyone can view project members" ON hub_project_members FOR SELECT USING (true);
CREATE POLICY "Project owners can add members" ON hub_project_members FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM hub_projects WHERE id = project_id AND creator_id = auth.uid())
);

-- RLS Policies for hub_discussions
DROP POLICY IF EXISTS "Anyone can view discussions" ON hub_discussions;
DROP POLICY IF EXISTS "Users can create discussions" ON hub_discussions;
DROP POLICY IF EXISTS "Users can update their own discussions" ON hub_discussions;
CREATE POLICY "Anyone can view discussions" ON hub_discussions FOR SELECT USING (true);
CREATE POLICY "Users can create discussions" ON hub_discussions FOR INSERT WITH CHECK (auth.uid() = creator_id);
CREATE POLICY "Users can update their own discussions" ON hub_discussions FOR UPDATE USING (auth.uid() = creator_id);

-- RLS Policies for hub_discussion_comments
DROP POLICY IF EXISTS "Anyone can view comments" ON hub_discussion_comments;
DROP POLICY IF EXISTS "Users can insert comments" ON hub_discussion_comments;
DROP POLICY IF EXISTS "Users can update their own comments" ON hub_discussion_comments;
CREATE POLICY "Anyone can view comments" ON hub_discussion_comments FOR SELECT USING (true);
CREATE POLICY "Users can insert comments" ON hub_discussion_comments FOR INSERT WITH CHECK (auth.uid() = author_id);
CREATE POLICY "Users can update their own comments" ON hub_discussion_comments FOR UPDATE USING (auth.uid() = author_id);

-- RLS Policies for hub_learning_resources
DROP POLICY IF EXISTS "Anyone can view learning resources" ON hub_learning_resources;
DROP POLICY IF EXISTS "Users can create learning resources" ON hub_learning_resources;
CREATE POLICY "Anyone can view learning resources" ON hub_learning_resources FOR SELECT USING (true);
CREATE POLICY "Users can create learning resources" ON hub_learning_resources FOR INSERT WITH CHECK (auth.uid() = created_by);

-- RLS Policies for hub_user_achievements
DROP POLICY IF EXISTS "Users can view their own achievements" ON hub_user_achievements;
DROP POLICY IF EXISTS "System can create achievements" ON hub_user_achievements;
CREATE POLICY "Users can view their own achievements" ON hub_user_achievements FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "System can create achievements" ON hub_user_achievements FOR INSERT WITH CHECK (user_id IS NOT NULL);

-- RLS Policies for hub_opportunities
DROP POLICY IF EXISTS "Anyone can view opportunities" ON hub_opportunities;
DROP POLICY IF EXISTS "Users can create opportunities" ON hub_opportunities;
CREATE POLICY "Anyone can view opportunities" ON hub_opportunities FOR SELECT USING (true);
CREATE POLICY "Users can create opportunities" ON hub_opportunities FOR INSERT WITH CHECK (auth.uid() = posted_by);

-- RLS Policies for hub_opportunity_applications
DROP POLICY IF EXISTS "Users can view their own applications" ON hub_opportunity_applications;
DROP POLICY IF EXISTS "Users can apply to opportunities" ON hub_opportunity_applications;
CREATE POLICY "Users can view their own applications" ON hub_opportunity_applications FOR SELECT USING (auth.uid() = applicant_id OR (SELECT posted_by FROM hub_opportunities WHERE id = opportunity_id) = auth.uid());
CREATE POLICY "Users can apply to opportunities" ON hub_opportunity_applications FOR INSERT WITH CHECK (auth.uid() = applicant_id);
