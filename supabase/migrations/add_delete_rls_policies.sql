-- Add missing DELETE RLS policies for hub_projects
CREATE POLICY "Users can delete their own projects" ON hub_projects FOR DELETE USING (auth.uid() = creator_id);

-- Add missing DELETE RLS policies for hub_discussions
CREATE POLICY "Users can delete their own discussions" ON hub_discussions FOR DELETE USING (auth.uid() = creator_id);

-- Add missing DELETE RLS policies for hub_discussion_comments
CREATE POLICY "Users can delete their own comments" ON hub_discussion_comments FOR DELETE USING (auth.uid() = author_id);

-- Add missing DELETE RLS policies for hub_project_members
CREATE POLICY "Project owners can delete members" ON hub_project_members FOR DELETE USING (
  EXISTS (SELECT 1 FROM hub_projects WHERE id = project_id AND creator_id = auth.uid())
);
