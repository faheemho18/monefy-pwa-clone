# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is the **Monefy PWA Clone** - a zero-cost Progressive Web App clone of the popular Monefy expense tracker, designed for 2-user households with offline-first functionality.

**Current Status**: Phase 0 (Foundation & Setup) complete, ready for Phase 1 development.

## Common Development Commands

### Development
```bash
npm run dev                    # Start development server
npm run build                  # Build for production (runs tsc && vite build)
npm run preview               # Preview production build
npm run lint                  # Run ESLint with TypeScript support
```

### Testing
```bash
npm run test                  # Run tests with Vitest
npm run test:ui              # Run tests with Vitest UI
npm run test:coverage        # Run tests with coverage report
```

### Firebase Operations
```bash
npm run firebase:emulators    # Start Firebase emulators for local development
npm run firebase:deploy       # Build and deploy to Firebase hosting
npm run firebase:rules        # Deploy Firestore security rules only
npm run firebase:indexes      # Deploy Firestore indexes only
```

## Project Architecture

### Technology Stack
- **Frontend**: React 18 + TypeScript + Vite
- **Styling**: Tailwind CSS v4 with utility-first approach
- **Backend**: Firebase (Firestore + Authentication)
- **PWA**: vite-plugin-pwa with Workbox service worker
- **State Management**: Zustand for client state
- **Testing**: Vitest + React Testing Library + jsdom
- **Icons**: Custom SVG components with vite-plugin-svgr

### Key Architectural Patterns

#### Service Layer Architecture
- `src/services/firestoreService.ts`: Central Firestore operations class with static methods
- `src/services/authService.ts`: Authentication service utilities
- Services follow a static class pattern for easy mocking and testing

#### Type-First Development
- `src/types/index.ts`: All TypeScript interfaces defined here
- Core entities: User, Household, Category, Transaction, AppState
- Firestore timestamps converted to Date objects in service layer

#### PWA-First Design
- Configured for offline-first with IndexedDB fallback
- Service worker handles caching strategies via Workbox
- Manifest configured for 2-user household expense tracking use case

#### Multi-User Household Model
- Each User belongs to one Household (2-user max)
- Transactions are scoped to Household level
- Real-time sync via Firestore listeners
- Invitation system for adding second household member

### Directory Structure
```
src/
├── components/           # React components (atomic design)
│   ├── PWAUpdatePrompt.tsx
│   └── icons/           # SVG icon components
├── services/            # Firebase and external API services
├── hooks/               # Custom React hooks
├── types/               # TypeScript type definitions
├── utils/               # Pure utility functions
├── assets/              # Static assets organized by category
│   ├── icons/           # 28 SVG files (categories, navigation, ui)
│   ├── branding/        # Logo and favicon assets
│   └── pwa/             # PWA manifest icons
└── lib/                 # Configuration and setup
    └── firebase.ts      # Firebase SDK configuration
```

### Path Aliases (configured in vite.config.ts)
- `@/*` → `src/*`
- `@/components/*` → `src/components/*` 
- `@/services/*` → `src/services/*`
- `@/hooks/*` → `src/hooks/*`
- `@/types/*` → `src/types/*`
- `@/utils/*` → `src/utils/*`
- `@/assets/*` → `src/assets/*`

## Development Guidelines

### Firebase Setup
- Uses environment variables for configuration (see .env template)
- Emulators run on localhost:8080 (Firestore) and localhost:9099 (Auth)
- Production Firebase project uses security rules in `firestore.rules`

### Testing Configuration
- Vitest configured with jsdom environment in `vite.config.ts`
- Test setup file: `src/test/setup.ts`
- Global test configuration enabled for React Testing Library

### PWA Configuration
- Auto-update registration with user prompts
- Caching strategies for fonts, images, and static assets
- Offline fallbacks configured in workbox settings
- Manifest supports app shortcuts for quick expense/income entry

### Code Quality
- ESLint configured for TypeScript with React-specific rules
- Strict TypeScript configuration with path mapping
- Tailwind CSS with custom configuration for the design system

## Asset Management

The project includes 28 carefully optimized SVG assets organized by category:
- **Category icons**: food, transport, entertainment, bills, healthcare, shopping, education, travel
- **Navigation icons**: home, settings, stats, transactions  
- **UI icons**: add, close, delete, edit, filter, search
- **PWA assets**: app icons, splash screens, favicons

SVG files are imported as React components using `import IconName from './path/to/icon.svg?react'`

## Development Phases

Current development follows a structured 5-phase approach:
- **Phase 0**: Foundation & Setup ✅ (Complete)
- **Phase 1**: Core MVP Functionality (Next)
- **Phase 2**: PWA & Offline Capabilities  
- **Phase 3**: Multi-User & Data Sync
- **Phase 4**: Data Visualization & Polish
- **Phase 5**: Testing & Production

Refer to `documents/DEVELOPMENT_TODOS.md` for detailed task breakdown and progress tracking.

## Key Implementation Notes

### Offline-First Strategy
- Firestore offline persistence enabled by default
- IndexedDB used for robust local storage
- Sync queue manages pending operations
- Conflict resolution using last-write-wins strategy

### Multi-User Synchronization
- Real-time listeners for household transaction updates
- Optimistic UI updates with rollback on failure
- User isolation through Firestore security rules
- Household invitation system with temporary codes

### Performance Optimizations
- Code splitting configured for vendor and Firebase bundles
- Manual chunks in Rollup config for optimal loading
- SVG assets optimized and tree-shakeable
- Service worker caching strategies for static assets