# User Avatar & Sign-Out Design

## Overview

Add a fixed user avatar button in the top-right corner of the app. Clicking it opens a dropdown with a sign-out option. The avatar shows the user's Clerk profile image, or a fallback with initials on an amber background.

## Placement

- **Fixed top-right**: `position: fixed; top: 1rem; right: 1rem`
- Renders in `src/app/layout.tsx` inside `ClerkProvider` so it's present across all pages
- `z-index` ensures it sits above page content

## Component: `src/components/user-avatar-menu.tsx`

A single client component (`"use client"`) with four states:

### 1. Loading State
While Clerk resolves auth state, show a pulsing gray circle skeleton matching the avatar size.

### 2. Signed-Out State
Hidden — unauthenticated users see no avatar.

### 3. Signed-In State
Circular avatar button:
- **With image**: Clerk `user.imageUrl` rendered as `<img>` in a circle
- **Without image (fallback)**: First letter of `user.username` (uppercase) on `amber-500` background, white text, `font-semibold`
- Sizes: `36px` on mobile (`< 640px`), `40px` on desktop
- Cursor: `pointer`, hover: subtle opacity/scale transition

### 4. Dropdown Menu
Appears on avatar click:
- Positioned below the avatar (flips above if insufficient space)
- Contains a single **Sign Out** button
- Uses Clerk's `useAuth` hook → `signOut({ redirectUrl: '/sign-in' })`
- No confirmation dialog
- Clicking outside the menu closes it

## Responsive Behavior

- `sm:` breakpoint adjusts avatar size (36px → 40px)
- Dropdown menu auto-flips vertically based on viewport space
- Tighter `p-1` padding on very small screens

## No New Dependencies

- Clerk `useAuth` + `useUser` hooks (already installed)
- Tailwind CSS (already in use)
- No additional packages needed

## Implementation Plan

1. Create `src/components/user-avatar-menu.tsx` — full client component with all states
2. Edit `src/app/layout.tsx` — import and render `<UserAvatarMenu />` inside `ClerkProvider`
