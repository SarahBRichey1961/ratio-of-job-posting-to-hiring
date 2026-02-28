-- Clear all test project data from production
-- This removes user-created projects and related comments while preserving job boards and other reference data

-- Clear project members (foreign key constraint)
DELETE FROM hub_project_members;

-- Clear project comments
DELETE FROM hub_discussion_comments WHERE discussion_id IN (
  SELECT id FROM hub_discussions WHERE project_id IS NOT NULL
);

-- Clear discussions related to projects
DELETE FROM hub_discussions WHERE project_id IS NOT NULL;

-- Clear all projects
DELETE FROM hub_projects;

-- Verify deletion
SELECT COUNT(*) as remaining_projects FROM hub_projects;
SELECT COUNT(*) as remaining_discussions FROM hub_discussions;

-- Confirm data is cleared
-- All counts should return 0
