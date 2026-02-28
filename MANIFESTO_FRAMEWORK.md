# Build Your Manifesto Framework

## Overview
The **Build Your Manifesto** feature enables job seekers to create a compelling personal statement that goes beyond a traditional resume. It's a powerful way to showcase authenticity, values, and vision to potential employers.

## User Journey

### Stage 1: Intro
Users land on the manifesto builder and see:
- **Dictionary Definition**: "A public declaration of motives and intentions; a statement of principles and aims."
- **Why It Matters**: 3 key benefits
  - Employers see the real you
  - Memorable & shareable (one URL)
  - You take a stand on your values
- **How It Works**: 4-step process
- CTA: "Start Building Your Manifesto (5 minutes)"

### Stage 2: Questions  
Users answer 7 strategic questions (~5 minutes):
1. **Professional Identity** - What are you professionally?
2. **Passions** - What energizes you at work?
3. **Key Accomplishment** - What achievement are you proud of?
4. **Team Environment** - What brings out your best work?
5. **Non-Negotiables** - What won't you compromise on?
6. **Next Phase** - Why are you making this career move?
7. **5-Year Vision** - What do you want to be known for?

**Design Notes:**
- Text areas for open-ended answers
- Placeholder text provides examples (not directives)
- Short helper text under each question
- Progress is saved in local state (not persisted until generation)
- Validation: all questions required before generating

### Stage 3: Preview & Edit
After generation (powered by GPT-4):
- **Display manifesto** (300-400 words)
- **Edit capability** - Users can refine wording directly
- **Options**: 
  - Back to questions (regenerate if needed)
  - Publish manifesto

**Quality Notes:**
- GPT-4 prompt focuses on: authenticity, specificity, memorability
- Manifesto is written in first person
- Balances passion with professionalism
- Includes details from their answers
- Ends with clear vision statement

### Stage 4: Complete  
After publishing:
- **Success message** with celebratory tone
- **Shareable URL**: `https://takethereins.ai/manifesto/{username}`
- **Copy URL button**
- **Social sharing**:
  - Twitter (pre-populated message)
  - Generic share (email, messaging)
  - View manifesto button
- **Next steps guidance**:
  - Add to job applications
  - Share on LinkedIn
  - Email signature
  - Keep updated
- **Navigation**: Back to Hub or Explore Community

---

## Technical Architecture

### Database Schema

```sql
-- Added to hub_members table
ALTER TABLE hub_members
ADD COLUMN manifesto TEXT;

CREATE INDEX idx_hub_members_username_manifesto 
ON hub_members(username) 
WHERE manifesto IS NOT NULL;
```

### Pages

**`/hub/members/new.tsx`** - Manifesto Builder
- 4-stage flow: intro → questions → preview → complete
- Form state management in React hooks
- API calls to generate and publish

**`/manifesto/[username].tsx`** - Public Manifesto Profile
- Read-only display of published manifesto
- Shows user avatar, bio, manifesto content
- Social sharing options
- CTA to build own manifesto
- No authentication required (fully public)

### API Endpoints

**`POST /api/hub/manifesto/generate`**
- **Input**: userId, answers object (all 7 questions)
- **Process**: 
  - Build GPT-4 prompt with all answers
  - Call OpenAI API
  - Return manifesto text (~300-400 words)
- **Output**: { manifesto, url, preview }
- **Error handling**: Missing OPENAI_API_KEY, API failures

**`POST /api/hub/manifesto/publish`**
- **Input**: userId, content (manifesto text)
- **Process**:
  - Update hub_members.manifesto
  - Update hub_members.updated_at
  - Fetch username for URL generation
  - Return manifesto URL
- **Output**: { success: true, url, published_at }
- **RLS**: Users can only publish their own manifesto

**`GET /api/hub/manifesto/[username]`**
- **Input**: username (from URL)
- **Process**: 
  - Query hub_members by username
  - Filter: WHERE manifesto IS NOT NULL
  - Return profile + manifesto
- **Output**: { username, bio, avatar_url, manifesto, updated_at }
- **RLS**: Returns user data if manifesto is published
- **Error**: 404 if not found or no manifesto

**`GET /api/auth/user`**
- **Input**: None (uses session)
- **Process**:
  - Get session from Supabase
  - Fetch user profile from hub_members
  - Return merged user data
- **Output**: { user: { id, email, username, bio, manifesto, ... } }
- **Authentication**: Required (session must exist)

---

## GPT-4 Generation Prompt

```
You are a ghostwriter creating a compelling personal manifesto for a professional. 

Based on the following answers, write an authentic, powerful manifesto (300-400 words) that captures their essence, values, and vision. The manifesto should:
- Be written in first person
- Sound personal and authentic, not corporate
- Balance passion with professionalism
- Include specific details from their answers
- Be memorable and quotable
- End with a clear statement of their vision

[Answers provided]

Write the manifesto now. Make it powerful, personal, and true.
```

**Model**: GPT-4
**Temperature**: 0.7 (balanced creativity + coherence)
**Max Tokens**: 800
**System Prompt**: "You are an expert ghostwriter who creates compelling personal manifestos for professionals. Your writing is authentic, powerful, and memorable."

---

## Integration Points

### Landing Page (`/hub/index.tsx`)
- CTA Button: "Build Your Manifesto" → `/hub/members/new`
- Updated from `/hub/members` to `/hub/members/new`

### Hub Discussions
- Users can reference their manifesto in discussion posts
- Share manifesto URL as part of their profile

### Job Applications Context
- Manifesto provides deeper context than resume
- Employers can see "who you are" not just "what you did"

---

## UX/Copy Highlights

### Dictionary Definition
Focus on authenticity and intent, not corporate speak.

### Why Section (3 Benefits)
1. ✓ Employers See the Real You
2. ✓ Memorable & Shareable  
3. ✓ You Take a Stand

### Question Copy
- Non-directive placeholders (examples, not rules)
- Helper text explains what each question reveals
- Balanced tone: professional + personal

### Success Message
- Celebratory ("Your Manifesto is Live!")
- Clear next steps (apply, LinkedIn, email)
- Sharing emphasis (multiple channels)

---

## Roadmap Features

### Phase 2 (Future)
- [ ] Manifesto versioning (track iterations)
- [ ] Analytics: views, shares, downloads
- [ ] Version comparison (before/after)
- [ ] Download as PDF
- [ ] Custom domain for manifestos
- [ ] Manifesto templates (industry-specific)
- [ ] Peer review (community feedback)

### Phase 3 (Future)  
- [ ] Manifesto-focused job matching
- [ ] Employer can see manifesto matches
- [ ] Manifesto usage stats (how many jobs you applied to with link)
- [ ] Public manifesto library / gallery
- [ ] Trending manifestos

---

## Testing Checklist

- [ ] Stage 1: All copy displays correctly
- [ ] Stage 2: All 7 questions render with placeholders
- [ ] Stage 2: Form validation (can't proceed without answers)
- [ ] Stage 2: API call to generate endpoint works
- [ ] Stage 3: Manifesto displays with proper formatting
- [ ] Stage 3: Edit textarea is functional
- [ ] Stage 3: Back button regenerates from questions
- [ ] Stage 3: Publish API call works
- [ ] Stage 4: Success page shows correct URL
- [ ] Stage 4: Copy to clipboard works
- [ ] Stage 4: Social share buttons open correctly
- [ ] Public page: `/manifesto/{username}` renders manifesto
- [ ] Public page: No authentication required
- [ ] RLS: Only manifesto owner can update their manifesto
- [ ] RLS: Anyone can view published manifestos

---

## Copy & Brand Voice

**Tone**: Personal, empowering, authentic, actionable
**Values**: No gatekeeping, be yourself, take a stand, own your story

**Example Phrases**:
- "Speak in your own way about you"
- "Give mind bending examples of who you are"
- "Take control of your career pathway"
- "Your story. Your rules. Your URL."

---

## Environment Variables

**Required for Generation**:
```
OPENAI_API_KEY=sk-...
```

**Recommended to add**:
```
NEXT_PUBLIC_MANIFESTO_DOMAIN=https://takethereins.ai/manifesto
```

---

## Success Metrics

1. **Creation**: # of users who build a manifesto
2. **Publishing**: # of manifestos published (% of created)
3. **Sharing**: # of shares (Twitter, email, etc.)
4. **Reuse**: # of times manifesto URL appears in job applications (future tracking)
5. **Engagement**: Views on public manifesto pages

---

## Common Questions

**Q: Can manifestos be private?**
A: Currently no—all published manifestos are public. Future: private versions for personal use.

**Q: Can I delete a manifesto?**
A: Currently no. Future: soft delete with recovery window.

**Q: How long does generation take?**
A: ~2-5 seconds depending on OpenAI API load.

**Q: Can I regenerate?**
A: Yes—go back to questions and generate again. This overwrites the manifesto.

**Q: What if I don't like the generated version?**
A: You can edit directly in Stage 3, or go back and adjust your answers.

**Q: Is there a character limit?**
A: No hard limit enforced, but GPT-4 prompt targets 300-400 words for readability.

