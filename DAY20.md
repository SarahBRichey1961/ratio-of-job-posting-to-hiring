# Day 20: Add Authentication & Authorization

**Date:** February 18, 2026  
**Status:** ✅ COMPLETE  
**Lines Added:** 892 lines  
**Files Created:** 4 (AuthContext, Login, Signup, ProtectedRoute)  
**Files Modified:** 3 (\_app.tsx, DashboardLayout, index.tsx)  
**Database Migrations:** 1 (`010_user_authentication.sql`)

## Overview

Day 20 implements complete authentication and authorization for the dashboard using Supabase Auth. Users can sign up with email/password, sign in, and access protected dashboard routes. Admin and viewer roles are supported for future feature gating.

## Architecture

### Authentication Flow

```
Public Pages (Login, Signup, Home)
    ↓
User authenticates at /login or /signup
    ↓
Supabase Auth.signInWithPassword() / signUp()
    ↓
Auth context listens to auth state changes
    ↓
User profile fetched/created in user_profiles table
    ↓
Protected routes check isAuthenticated before rendering
    ↓
ProtectedRoute component redirects unauthenticated users to /login
    ↓
Dashboard layout shows user email, role, and logout option
```

## Authentication Components

### 1. AuthContext (`src/context/AuthContext.tsx` - 137 lines)

Provides authentication state and methods throughout the app via React Context.

**Exports:**
- `AuthProvider`: Wrapper component for app
- `useAuth()`: Hook to access auth state
- `supabase`: Supabase client instance

**Hook Return Value:**
```typescript
{
  user: User | null              // Current authenticated user
  profile: UserProfile | null    // User's profile with role
  isLoading: boolean             // Loading state during auth check
  isAuthenticated: boolean       // True if user is logged in
  isAdmin: boolean              // True if role is 'admin'
  signUp: (email, password) => Promise<void>
  signIn: (email, password) => Promise<void>
  signOut: () => Promise<void>
}
```

**Features:**
- Auto-creates user profile on signup (default role: viewer)
- Listens to Supabase auth state changes globally
- Checks for existing profile on login
- Handles errors gracefully

### 2. Login Page (`src/pages/login.tsx` - 128 lines)

Email/password login form with real-time validation and error handling.

**Features:**
- Email and password inputs
- Real-time loading state
- Error message display
- Link to signup page
- Auto-redirects to dashboard if already logged in
- Dark theme matching dashboard

**Form Validation:**
- Email: Required, valid format
- Password: Required

**Error Handling:**
- Displays Supabase error messages
- User-friendly fallback messages

### 3. Signup Page (`src/pages/signup.tsx` - 150 lines)

User registration form with password strength requirements.

**Features:**
- Email, password, and confirm password inputs
- Password strength validation (min 8 characters)
- Password confirmation validation
- Redirects on success to login page with message
- Link back to login

**Validation Rules:**
- Email: Required, valid format
- Password: Min 8 characters
- Confirm Password: Must match password

### 4. ProtectedRoute Component (`src/components/ProtectedRoute.tsx` - 61 lines)

Wraps dashboard pages to enforce authentication and role-based access.

**Props:**
```typescript
{
  children: React.ReactNode
  requiredRole?: 'admin' | 'viewer'  // Optional role requirement
}
```

**Behavior:**
- Shows loading spinner during auth check
- Redirects to /login if not authenticated
- Redirects to /dashboard if lacking required role
- Returns null while redirecting

**Usage:**
```tsx
<ProtectedRoute>
  <DashboardLayout>
    {/* Page content */}
  </DashboardLayout>
</ProtectedRoute>
```

## Database Schema

### Supabase Migration: `010_user_authentication.sql`

Creates `user_profiles` table with RLS policies:

```sql
CREATE TABLE user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id)
  email TEXT NOT NULL UNIQUE
  role TEXT NOT NULL DEFAULT 'viewer' CHECK (role IN ('admin', 'viewer'))
  created_at TIMESTAMP DEFAULT NOW()
  updated_at TIMESTAMP DEFAULT NOW()
)
```

**Row Level Security (RLS) Policies:**
1. **Users can view their own profile:**
   - SELECT allowed where auth.uid() = id

2. **Users can update their own profile:**
   - UPDATE allowed where auth.uid() = id

3. **Admins can view all profiles:**
   - SELECT allowed for users with role = 'admin'

**Indexes:**
- `idx_user_profiles_email`: Faster email lookups
- `idx_user_profiles_role`: Faster role filtering

## Integration Points

### 1. App Wrapper (`src/pages/_app.tsx`)

Updated to wrap entire app with AuthProvider:

```tsx
<AuthProvider>
  <Component {...pageProps} />
</AuthProvider>
```

This enables all pages to access the `useAuth()` hook.

### 2. Dashboard Layout (`src/components/DashboardLayout.tsx`)

Added user menu with logout functionality:

```tsx
// New imports
import { useAuth } from '@/context/AuthContext'

// In header:
- User avatar with initial letter
- Dropdown menu showing:
  - User email
  - User role (Admin/Viewer)
  - Sign Out button
```

**Logout Flow:**
```typescript
const handleLogout = async () => {
  await signOut()           // Clear auth state
  router.push('/login')     // Redirect to login
}
```

### 3. Dashboard Home Page (`src/pages/dashboard/index.tsx`)

Wrapped with ProtectedRoute:

```tsx
export default function DashboardHome() {
  return (
    <ProtectedRoute>
      <DashboardLayout>
        {/* Dashboard content */}
      </DashboardLayout>
    </ProtectedRoute>
  )
}
```

### 4. Home/Index Page (`src/pages/index.tsx`)

Updated to show sign-in buttons and auto-redirect:

```tsx
// Auto-redirect authenticated users to dashboard
useEffect(() => {
  if (!isLoading && isAuthenticated) {
    router.push('/dashboard')
  }
}, [isAuthenticated, isLoading, router])

// Show sign-in button for unauthenticated users
{!isLoading && !isAuthenticated && (
  <div className="mb-8">
    <a href="/login">Sign In to Dashboard →</a>
  </div>
)}
```

## User Flow Examples

### First-Time User (Signup)

1. User visits home page → sees "Create Account" link
2. Clicks link → taken to `/signup`
3. Enters email, password (8+ chars), confirms password
4. Submits form → `signUp(email, password)` called
5. User profile created in `user_profiles` table (role = 'viewer')
6. Redirected to `/login` with success message
7. User signs in → redirected to `/dashboard`

### Returning User (Login)

1. User visits home page
2. Clicks "Sign In to Dashboard"
3. Enters email and password
4. SignIn succeeds → auth state updated
5. `useAuth()` hook detects logged-in state
6. Auto-redirected to `/dashboard`
7. Dashboard loads with ProtectedRoute → renders page

### Logout

1. User in dashboard clicks user avatar menu
2. Clicks "Sign Out" button
3. `signOut()` called → clears Supabase auth session
4. Auth context sets user = null
5. Auto-redirected to `/login`

### Invalid Access (Not Authenticated)

1. User tries to navigate to `/dashboard/profile` directly
2. ProtectedRoute checks `isAuthenticated` → false
3. Shows loading spinner briefly
4. Auto-redirects to `/login`
5. User sees login form

### Future: Admin-Only Routes

When implemented, admin-only pages will use:

```tsx
<ProtectedRoute requiredRole="admin">
  <AdminPage />
</ProtectedRoute>
```

## Security Features

**Supabase Auth Security:**
- Password hashing with bcrypt
- Secure JWT sessions
- HTTPS only (production)
- Email verification ready (not yet configured)

**Client-Side Security:**
- Auth state validated per route
- Protected routes prevent access before redirect
- Logout clears auth session and redirects
- User profiles use RLS for data access control

**Future Enhancements:**
- Email verification on signup
- Password reset flow
- Multi-factor authentication (MFA)
- Refresh token rotation
- Session timeout policies

## Configuration Required

**Before production deployment, set Supabase environment variables:**

```bash
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

These must be available in `.env.local` for auth to work.

## Testing Checklist

- [x] Login page loads and accepts input
- [x] Signup page validates passwords
- [x] Creating account creates user profile
- [x] Logging in sets auth state
- [x] Protected routes redirect unauthenticated users
- [x] Logout clears auth and redirects
- [x] Auth context accessible via useAuth() hook
- [x] User email displays in dashboard header
- [x] User role displays in dashboard header
- [x] Home page redirects authenticated users to dashboard
- [x] Mobile login/signup forms are responsive
- [x] Error messages display on failed auth
- [x] Loading states show on form submission

## Files Modified

**Created:**
- `src/context/AuthContext.tsx` (137 lines) — Auth state & hooks
- `src/pages/login.tsx` (128 lines) — Login form
- `src/pages/signup.tsx` (150 lines) — Signup form
- `src/components/ProtectedRoute.tsx` (61 lines) — Route protection
- `supabase/migrations/010_user_authentication.sql` (39 lines) — User profiles table

**Modified:**
- `src/pages/_app.tsx` — Added AuthProvider
- `src/components/DashboardLayout.tsx` — Added user menu + logout
- `src/pages/index.tsx` — Added auth check + sign-in buttons

**Total Lines Added:** 892 lines

## Next Steps (Day 21)

**Polish UI & Responsive Design:**
- Mobile optimization for dashboard
- Font and typography improvements
- Color refinement in dark theme
- Accessibility enhancements (ARIA labels)
- Animation polish (page transitions, button feedback)

**Then Week 4:**
- Day 22–24: Surveys & integration
- Day 25–26: Reports & exports
- Day 27–30: Onboarding, QA, launch

## Summary

Day 20 establishes a complete authentication system with:

1. **User Registration** — Signup with email/password, auto-profile creation
2. **User Login** — Secure Supabase authentication
3. **Session Management** — Auth context tracks logged-in state globally
4. **Route Protection** — ProtectedRoute prevents unauthorized access
5. **Role-Based Access** — Foundation for admin/viewer features
6. **User Menu** — Dashboard header shows email, role, logout button
7. **Database** — user_profiles table with RLS for data security
8. **Navigation** — Auto-redirect authenticated users to dashboard

The authentication system is production-ready and follows security best practices with Supabase as the auth backend.
