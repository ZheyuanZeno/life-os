# Life OS

A calm, bilingual, local-first personal growth system. Life OS connects goals, projects and tasks while keeping reflection and planning lightweight.

## Run locally

Requirements: Node.js 20 or newer.

```bash
npm install
npm run dev
```

Open the local URL printed by Vite. Demo data is created once on first launch and can be safely removed or restored from Settings.

## Current features

- Chinese and English interface with a persistent one-click language switch
- Dashboard with today's focus, upcoming deadlines, active goals and recent achievements
- Goal, project and task management with deadlines and direct completion
- Metric definitions and plain data records, including safe single-entry deletion
- Month and Week Calendar views for tasks, deadlines and milestones
- Achievement timeline with filters
- Independent journal and thought records that can be reopened and edited
- Creation time, latest edit time and complete edit-time history for journals and thoughts
- Free-form Task Notes scratchpad with automatic local saving
- Quick Capture for tasks, thoughts, achievements and milestones
- Tagged, removable demo data and JSON export
- Responsive desktop and mobile navigation

Life OS intentionally contains no statistical charts, Weekly Review, cloud sync, accounts, analytics or external integrations.

## Data and privacy

All records are stored in the browser's IndexedDB database named `life-os-v1`. Database version 2 migrates existing journals and thoughts without deleting user data, allows multiple journal entries on the same date, and initializes edit histories.

There is no backend. Date-only values use local calendar dates; audit and edit timestamps use UTC ISO strings. Removing demo data filters by the stable `demoSetId` marker and never infers demo records from titles.

## Quality commands

```bash
npm run typecheck
npm run lint
npm test -- --pool=forks --maxWorkers=1
npm run test:e2e
npm run build
```

The automated suite covers schema migration, record editing, edit-history retention, metric deletion, language switching, Task Notes persistence, the primary growth loop and a narrow viewport.

## Structure

```text
src/
  components/   shared shell, UI primitives and Quick Capture
  db/           Dexie schema, migrations, repositories and demo seed
  lib/          date and calculation services
  pages/        route-level product features
  store/        ephemeral UI state only
  test/         test environment setup
e2e/            Playwright acceptance journeys
```
