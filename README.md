# Dispatch System — Angular Migration

Angular rewrite of the military dispatch system. Each screen is built with mock data, ready for WebSocket integration. This repo is the source of truth for all Angular components — the developer integrates these into the target system.

## Quick Start

```bash
npm install
ng serve
# Open http://localhost:4200
```

**Requirements:** Node 18+, Angular CLI 20 (`npm i -g @angular/cli@20`)

**Test credentials (mock):**

| Email | Password | Role | Teams |
|-------|----------|------|-------|
| radi@dispatch.local | 1234 | member | צוות הובלות |
| commander@dispatch.local | 1234 | commander | צוות הובלות, צוות חירום |
| admin@dispatch.local | 1234 | admin | צוות הובלות, צוות חירום |

## Tech Stack

| Layer | Choice |
|-------|--------|
| Framework | Angular 20 (standalone components, no NgModules) |
| UI | Ionic 7.2.1 (Material Design mode) |
| State | RxJS BehaviorSubject → Angular signals via `toSignal()` |
| Styling | SCSS (component-scoped), design tokens in `_variables.scss` |
| Types | TypeScript 5.8 strict mode |
| Data | Mock services (swappable to WebSocket — see section below) |

## Screens

| # | Screen | Route | Status | Description |
|---|--------|-------|--------|-------------|
| 1 | Login | `/login` | Done | Email/password auth, session persistence, route guards |
| 2 | Dashboard | `/` | Done | Mission list, status transitions, summary KPIs, draft management |
| 3 | Trucks | `/trucks` | Planned | CRUD table with inline edit, status badges |
| 4 | People | `/people` | Planned | Same CRUD pattern as trucks |
| 5 | Mission Wizard | `/wizard` | Planned | 6-step form (details → trucks → crew → route → review → send) |
| 6 | Driver View | `/driver/:token` | Planned | Mobile view with swipe navigation, stage advancement |
| 7 | Commander | `/commander` | Planned | Multi-team overview with drill-down |
| 8 | Team Management | `/team` | Planned | Create team, manage members, invite |
| 9 | Admin Panel | `/admin/secret` | Planned | Cross-team admin operations |
| 10 | Admin Reports | `/admin/reports` | Planned | Per-team KPI dashboard |
| 11 | Safety Exam | `/safety-exam` | Planned | Public form, no auth required |

## Project Structure

```
src/
├── main.ts                          # Bootstrap (provideRouter, provideIonicAngular)
├── index.html                       # RTL root, Hebrew font (Assistant)
├── styles.scss                      # Ionic imports + theme overrides
├── styles/
│   ├── _variables.scss              # Colors, spacing, typography tokens
│   └── _animations.scss             # Shared keyframe animations
└── app/
    ├── app.component.ts             # Shell: <ion-app dir="rtl">
    ├── app.routes.ts                # Lazy routes with auth guards
    ├── guards/
    │   └── auth.guard.ts            # authGuard + loginGuard (functional guards)
    ├── models/
    │   ├── mission.model.ts         # Mission interfaces + helper functions + Hebrew labels
    │   └── user.model.ts            # User, Team, TeamRole interfaces
    ├── mock/
    │   ├── mock-data.ts             # 8 missions with all edge cases
    │   └── mock-auth.ts             # 3 test users with team memberships
    ├── services/
    │   ├── data-service.interface.ts # Abstract DataService (swap mock ↔ socket)
    │   ├── mission.service.ts       # Mock mission CRUD
    │   ├── resource.service.ts      # Truck/people totals
    │   ├── auth.service.ts          # Mock auth with session persistence
    │   └── team.service.ts          # Active team selection (localStorage)
    └── pages/
        ├── login/
        │   ├── login.page.ts        # Reactive form, auth flow, error handling
        │   ├── login.page.html
        │   └── login.page.scss
        └── dashboard/
            ├── dashboard.page.ts    # Signals, event handlers, computed state
            ├── dashboard.page.html
            ├── dashboard.page.scss
            └── components/
                ├── summary-bar/     # KPI cards (active, scheduled, trucks, crew)
                ├── draft-banner/    # Draft missions notification bar
                ├── mission-list/    # Date-grouped mission list with sorting
                ├── mission-card/    # Expandable card with stages, crew, actions
                ├── completion-modal/# Success modal with stats grid
                └── confetti/        # Celebration animation
```

## Architecture Patterns

Every screen follows the same pattern. Read this section once — it applies to all pages.

### 1. Data Flow (unidirectional)

```
Mock Data → BehaviorSubject (Service) → Observable → toSignal() (Page) → computed() → input() (Component)
```

**Service** — owns the data, exposes observables:
```typescript
@Injectable({ providedIn: 'root' })
export class MissionService extends DataService {
  private missionsSubject = new BehaviorSubject<Mission[]>([]);
  missions$ = this.missionsSubject.asObservable();

  async changeMissionStatus(id: string, status: MissionStatus): Promise<void> {
    const updated = this.missionsSubject.value.map(m =>
      m.id === id ? { ...m, status } : m
    );
    this.missionsSubject.next(updated);
  }
}
```

**Page** — converts observables to signals, derives computed state:
```typescript
export class DashboardPage {
  private missionService = inject(MissionService);
  private missions = toSignal(this.missionService.missions$, { initialValue: [] });

  drafts = computed(() => this.missions().filter(m => m.status === 'draft'));
  nonDrafts = computed(() => this.missions().filter(m => m.status !== 'draft'));
  expandedMissionId = signal<string | null>(null);  // local UI state
}
```

**Component** — receives data via `input()`, emits events via `output()`:
```typescript
export class SummaryBarComponent {
  missions = input.required<Mission[]>();
  activeMissions = computed(() => this.missions().filter(m => m.status === 'active'));
}
```

Components never call services directly. Pages handle all service interaction.

### 2. DataService Abstraction (Mock → WebSocket)

`DataService` is an abstract class. `MissionService` implements it with mock data. To switch to WebSocket:

1. Create `socket-mission.service.ts` extending `DataService`
2. Open WebSocket, listen for events, push to BehaviorSubjects
3. Swap the provider in `main.ts`
4. Zero changes in any component or page

```typescript
// Example WebSocket implementation
@Injectable({ providedIn: 'root' })
export class SocketMissionService extends DataService {
  private ws: WebSocket;
  private missionsSubject = new BehaviorSubject<Mission[]>([]);
  missions$ = this.missionsSubject.asObservable();

  constructor() {
    super();
    this.ws = new WebSocket('ws://your-server/ws');
    this.ws.onmessage = (event) => {
      const msg = JSON.parse(event.data);
      if (msg.type === 'missions:list') {
        this.missionsSubject.next(msg.payload);
      }
    };
  }
}
```

### 3. Auth Flow

**Login:** Reactive form → `AuthService.signIn()` → stores user in BehaviorSubject + localStorage → redirects to `/`.

**Session restore:** On app load, AuthService checks localStorage for stored user ID. If valid, auto-logs in (no login screen flash).

**Guards:**
- `authGuard` — on protected pages, waits for loading to complete, redirects to `/login` if no user
- `loginGuard` — on `/login`, redirects to `/` if already logged in

**Logout:** Clears BehaviorSubjects + localStorage, user lands on `/login`.

**Team selection:** `TeamService` tracks which team is active. Persisted in localStorage under `dispatch_selected_team`. Auto-validates against available teams on login.

### 4. Standalone Components (No NgModules)

Every component uses `standalone: true` and imports its dependencies directly:

```typescript
@Component({
  selector: 'app-mission-card',
  standalone: true,
  imports: [NgClass, IonButton, IonSpinner],
  templateUrl: './mission-card.component.html',
  styleUrl: './mission-card.component.scss',
})
```

### 5. Template Control Flow (Angular 20)

Uses `@if` / `@for` syntax, not `*ngIf` / `*ngFor`:

```html
@if (isLoading()) {
  <ion-spinner />
} @else {
  @for (mission of missions(); track mission.id) {
    <app-mission-card [mission]="mission" />
  }
}
```

### 6. RTL Support

Three layers:
1. `index.html`: `<html lang="he" dir="rtl">`
2. `app.component.ts`: `<ion-app dir="rtl">`
3. SCSS: `margin-inline-start` / `padding-inline-end` (never `margin-left`/`margin-right`)

For LTR elements within RTL (email fields, phone numbers, progress dots):
```html
<ion-input dir="ltr" type="email" />
```

### 7. Expandable Card Animation

CSS Grid trick for smooth height animation without JavaScript:

```scss
.expandable {
  display: grid;
  grid-template-rows: 0fr;
  transition: grid-template-rows 0.3s ease;
  &.open { grid-template-rows: 1fr; }
}
.expandable-inner { overflow: hidden; }
```

## Data Models

All mission types in `models/mission.model.ts`:

```
Mission
├── mission_stages: MissionStage[]
│   ├── routes: MissionRoute[]
│   └── truck_stage_progress?: TruckStageProgress[]
├── mission_personnel: MissionPersonnel[]
│   ├── people: MissionPerson | null
│   └── trucks: MissionTruck | null
├── stop_points?: StopPoint[]
└── custom_risks?: { id, title, content }[]
```

User/team types in `models/user.model.ts`:

```
User { id, email }
Team { id, name, role }
TeamRole = 'admin' | 'member' | 'commander' | 'viewer'
```

**Helper functions** (exported from `mission.model.ts`):
- `getTruckCount(mission)` / `getCrewCount(mission)` — resource counts
- `groupByTruck(personnel)` — groups personnel by truck for display
- `sortedStages(stages)` — stages sorted by stage_order
- `formatDateHeader(dateStr)` — returns "היום", "מחר", or DD/MM
- `formatTimeRange(dep, arr)` — "07:00 – 08:30"
- `calcTotalDuration(mission)` — total mission time

**Hebrew label maps:** `STATUS_LABELS`, `ACTION_LABELS`, `STAGE_STATUS_LABELS` — always use these for display, never hardcode Hebrew in components.

**Status values:**
- Mission: `draft | scheduled | active | completed | cancelled`
- Stage: `pending | departed | completed`

## Design Tokens

All in `styles/_variables.scss`:

| Token | Value | Usage |
|-------|-------|-------|
| `$primary` | `#2D5F3F` | Military green, toolbar, buttons |
| `$danger` | `#EF4444` | Error states, cancelled status |
| `$card-radius` | `16px` | All card borders |
| `$space-1` to `$space-8` | `4px` to `32px` | All margins/padding/gap |
| `$font-family` | `'Assistant', 'Heebo', sans-serif` | Hebrew-first font stack |
| `$gray-50` to `$gray-900` | Gray scale | Text, backgrounds, borders |

Per-status colors: `$status-{draft|active|scheduled|completed|cancelled}-bg` and `-text`.

## Mock Data

**Auth** (`mock/mock-auth.ts`): 3 users covering member, commander (multi-team), and admin roles. All passwords: `1234`.

**Missions** (`mock/mock-data.ts`): 8 missions covering every status and edge case. Dates are dynamically computed (today, tomorrow, past, future) so data always looks fresh.

## How to Add a New Screen

1. Create `src/app/pages/{name}/{name}.page.ts` + `.html` + `.scss`

2. Add route to `app.routes.ts`:
   ```typescript
   {
     path: 'screen-name',
     loadComponent: () => import('./pages/screen-name/screen-name.page').then(m => m.ScreenNamePage),
     canActivate: [authGuard],
   }
   ```

3. If the screen has its own data, create a service (`{name}.service.ts`) with BehaviorSubject state and mock data

4. In the page: inject services, `toSignal()`, `computed()`, `signal()` for UI state

5. Create child components under `pages/{name}/components/` — data in via `input()`, events out via `output()`

6. SCSS: start every file with `@use 'styles/variables' as *`, use `$space-*` for spacing, `$gray-*` for colors

## Key Technical Decisions

1. **Raw WebSocket** — not socket.io. When swapping mock → real, use native `WebSocket` API
2. **RxJS + signals** — not NgRx. State lives in services, not a global store
3. **Per-step FormGroups** — for the wizard, each step gets its own `FormGroup`
4. **Error handling** — server will emit dedicated error events (`{event}:error`)
5. **No offline queue** — on reconnection, server sends full state snapshot
6. **Ionic Material Design** — set globally via `provideIonicAngular({ mode: 'md' })`
