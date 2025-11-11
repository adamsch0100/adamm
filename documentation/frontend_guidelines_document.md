# Frontend Guideline Document for PostPulse.io

This document lays out how the frontend of PostPulse.io is built, the guiding design principles, key technologies, and patterns. It’s written in everyday language so everyone—from new team members to stakeholders—can understand how our web app is organized and why.

## 1. Frontend Architecture

### 1.1 Overview
- **Framework**: Next.js (App Router) is our base. It gives us file-based routing, server-side rendering, and API routes out of the box.  
- **Hosting**: We deploy to Railway for simple continuous delivery.  
- **Styling**: Tailwind CSS combined with CSS Modules for custom tweaks.  
- **Data fetching & caching**: React Query (TanStack Query) to fetch from Next.js API routes and Supabase.  
- **Auth**: `@supabase/auth-helpers-nextjs` for server-side auth checks and client hooks.

### 1.2 Scalability, Maintainability, Performance
- **Server-side rendering + static generation**: We pick per-page rendering modes (SSG, SSR) based on data freshness needs.  
- **API Routes & Edge Functions**: Keep heavy business logic in Supabase Edge Functions or Next.js API routes so UI stays fast.  
- **Modular code**: Components live in `/components`, pages in `/app`, helper code in `/lib`. Adding features means adding independent modules.  
- **Code splitting**: Next.js automatically splits code by route. We add dynamic imports for large widgets like the content editor.

## 2. Design Principles

### 2.1 Key Principles
1. **Usability**: Simple, guided flows (e.g., campaign wizard). Buttons and inputs have clear labels and inline help.  
2. **Accessibility**: We follow WCAG 2.1 AA: proper color contrast, focus outlines, ARIA labels on custom controls.  
3. **Responsiveness**: Mobile-first design. Layouts adjust from narrow phones to wide desktops.  
4. **Consistency**: Reusable components, unified styling, and a shared color palette.

### 2.2 Applying the Principles
- **Forms & Wizards**: Step indicators, clear next/previous buttons, in-step validation.  
- **Buttons & Links**: Follow a size and spacing system. Hover/focus states for keyboard and mouse users.  
- **Navigation**: Sticky header with platform toggles, mobile menu drawer for quick access.

## 3. Styling and Theming

### 3.1 Styling Approach
- **Tailwind CSS**: Utility-first classes for most layouts and spacing.  
- **CSS Modules**: For component-specific styles that need more control or nesting.  
- **Global Styles**: Base typography, resets, and Tailwind config live in `styles/globals.css`.

### 3.2 Theming
- Single light theme approach for launch. We use CSS variables in `:root` for easy color swaps later.  
- Theme variables defined in Tailwind config under `theme.extend.colors`.

### 3.3 Visual Style
- **Overall Style**: Modern flat design with subtle shadows (soft glassmorphism touches on cards).  
- **Color Palette**:
  • Primary: #4F46E5 (indigo-600)  
  • Secondary: #10B981 (green-500)  
  • Accent: #F59E0B (amber-500)  
  • Background: #F3F4F6 (gray-100)  
  • Surface cards: #FFFFFF (white) with 8px border radius and 4px shadow.  
  • Text primary: #111827 (gray-900), secondary: #6B7280 (gray-500).
- **Font**: Inter (system fallback). Headlines use `Inter-Bold`, body uses `Inter-Regular`.

## 4. Component Structure

### 4.1 Folder Organization
- `/app` – Route folders and page files (`page.tsx`, `layout.tsx`).  
- `/components` – Reusable UI pieces (Button, Modal, NavBar, CampaignForm, AccountCard).  
- `/ui` – Design-system primitives (Typography, Colors, Icons).  
- `/lib` – Helpers (supabase client, n8n utils, React Query fetchers).

### 4.2 Component Best Practices
- **Single Responsibility**: Each component has one job (e.g., `ContentTrigger` only triggers AI/n8n).  
- **Props over Context**: We pass data & callbacks via props when feasible, falling back to Context for deeply nested state.  
- **Folder collocation**: If a component has CSS, tests, and sub-components, we keep them together in its folder.

## 5. State Management

### 5.1 Approach
- **React Query** for server state: All Supabase reads/writes go through custom React Query hooks (e.g., `useCampaigns`, `useAccounts`). Provides caching, background refetch, and pagination.  
- **React Context** for UI state: Drawer open/close, theme toggles, wizard step manager.

### 5.2 Data Flow
1. On page load, React Query hook fetches data from our Next.js API route.  
2. Component reads from the hook’s `data`, `isLoading`, `error` states.  
3. Mutations use `useMutation` to post or update data, followed by `queryClient.invalidateQueries` to refresh.

## 6. Routing and Navigation

### 6.1 Routing with Next.js App Router
- Files under `/app`: 
  • `/app/layout.tsx` – Common layout (header, footer).  
  • `/app/page.tsx` – Public landing or redirect to login.  
  • `/app/dashboard/page.tsx` – Main dashboard (auth protected).  
  • `/app/accounts/page.tsx` – Account management.  
  • `/app/campaigns/[id]/page.tsx` – Single campaign view.  
  • `/app/create-campaign/page.tsx` – Wizard for campaign creation.

### 6.2 Navigation Structure
- **Header**: Logo + platform toggles (TikTok, IG, X, YouTube, Reddit) + user menu.  
- **Sidebar (desktop) / Drawer (mobile)**: Links: Dashboard, Create Campaign, Accounts, Analytics, Settings.

## 7. Performance Optimization

### 7.1 Strategies
1. **Lazy Loading**: Dynamically import heavy components (e.g., rich-text editors, media previews).  
2. **Image Optimization**: Use `next/image` for campaign media thumbnails.  
3. **Code Splitting**: Built-in by Next.js; additional split for rarely used pages.  
4. **Caching**: React Query caches data.  
5. **Asset Minification**: Tailwind CSS purges unused styles in production, JS is tree-shaken.

### 7.2 Benefits
- Faster initial loads, smoother interactions, lower bandwidth costs, and better SEO/social previews because pages can be statically generated.

## 8. Testing and Quality Assurance

### 8.1 Unit & Integration Tests
- **Jest** + **React Testing Library**: Test components and hooks under `/__tests__`.  
- Example: Test that `CampaignForm` properly updates local state and invokes the content-generate API.

### 8.2 End-to-End Tests
- **Cypress**: Simulate flows: login, create campaign wizard, account warming, auto­post trigger, analytics view.  
- We run E2E tests on our staging Railway deployment via GitHub Actions.

### 8.3 Linting & Formatting
- **ESLint** with Next.js plugin, **Prettier** for code style.  
- **Tailwind CSS IntelliSense** for class autocompletion.

## 9. Conclusion and Summary

With Next.js, Tailwind CSS, React Query, and Supabase auth, our frontend is built for speed, scalability, and clarity. We follow solid design principles—usability, accessibility, responsiveness—so users can easily automate their social media workflows. A component-based structure combined with strict testing and performance optimizations ensures we can grow PostPulse.io smoothly and keep the UI rock-solid as we add more features.

---

This guideline should give everyone a clear map of how the frontend is organized, why we made each choice, and how to maintain or extend the codebase in the future.