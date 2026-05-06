# Dashboard POC — Angular 20 + Ionic 7

Military dispatch dashboard proof-of-concept. Demonstrates the architecture, patterns, and component structure for migrating the dispatch-system from Next.js/React to Angular.

**What this proves:**
1. Angular 20 standalone components with Ionic 7 work for RTL Hebrew UI
2. RxJS BehaviorSubject + Angular signals is a clean state management pattern
3. Expandable mission cards with per-truck stage tracking works in Angular
4. The component decomposition scales to the full 11-screen system

## Quick Start

```bash
cd poc/
npm install
ng serve
# Open http://localhost:4200
```

Requirements: Node 18+, Angular CLI 20 (`npm i -g @angular/cli@20`)

## Tech Stack

| Layer | Choice | Why |
|-------|--------|-----|
| Framework | Angular 20 (standalone components) | Developer preference. No NgModules. |
| UI | Ionic 7.2.1 | Mobile-first, RTL support, Material Design |
| State | RxJS BehaviorSubject → Angular signals via `toSignal()` | Reactive + template-friendly |
| Styling | SCSS (component-scoped) | Variables, nesting, isolation |
| Types | TypeScript 5.8 strict mode | Full type safety |
| Data | Mock service (swappable to WebSocket) | Abstracted via `DataService` interface |

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
    ├── app.routes.ts                # Lazy routes (dashboard only in POC)
    ├── models/
    │   └── mission.model.ts         # All TypeScript interfaces + helper functions
    ├── mock/
    │   └── mock-data.ts             # 8 realistic missions with all edge cases
    ├── services/
    │   ├── data-service.interface.ts # Abstract DataService (swap mock ↔ socket)
    │   ├── mission.service.ts       # Mock implementation of DataService
    │   ├── resource.service.ts      # Truck/people totals
    │   ├── auth.service.ts          # Stub (hardcoded user)
    │   └── team.service.ts          # Stub (hardcoded team)
    └── pages/
        └── dashboard/
            ├── dashboard.page.ts    # Page controller (signals, event handlers)
            ├── dashboard.page.html  # Page template
            ├── dashboard.page.scss  # Page styles
            └── components/
                ├── summary-bar/     # KPI cards (active, scheduled, trucks, crew)
                ├── draft-banner/    # Unsaved drafts notification bar
                ├── mission-list/    # Date-grouped mission list with sorting
                ├── mission-card/    # Expandable card with stages, crew, actions
                ├── completion-modal/# Success modal with stats grid
                └── confetti/        # 50-particle celebration animation
```

## Architecture Patterns

### 1. State Management: BehaviorSubject → Signals

Services expose RxJS observables. Pages convert them to signals using `toSignal()`. Components use `input()` signals.

```
Service (BehaviorSubject)  →  Page (toSignal)  →  Component (input signals)
```

**In the service:**
```typescript
// mission.service.ts
@Injectable({ providedIn: 'root' })
export class MissionService extends DataService {
  private missionsSubject = new BehaviorSubject<Mission[]>([]);
  missions$: Observable<Mission[]> = this.missionsSubject.asObservable();

  // Mutate state by calling .next() with new array
  async changeMissionStatus(id: string, status: MissionStatus): Promise<void> {
    const updated = this.missionsSubject.value.map(m =>
      m.id === id ? { ...m, status } : m
    );
    this.missionsSubject.next(updated);
  }
}
```

**In the page:**
```typescript
// dashboard.page.ts
export class DashboardPage {
  private missionService = inject(MissionService);

  // Convert observable → signal (auto-subscribes, auto-unsubscribes)
  private missions = toSignal(this.missionService.missions$, { initialValue: [] });

  // Derived signals — recompute only when source changes
  drafts = computed(() => this.missions().filter(m => m.status === 'draft'));
  nonDrafts = computed(() => this.missions().filter(m => m.status !== 'draft'));

  // Local UI state as writable signals
  expandedMissionId = signal<string | null>(null);
}
```

**In the component:**
```typescript
// summary-bar.component.ts
export class SummaryBarComponent {
  // Required input (parent must provide)
  missions = input.required<Mission[]>();

  // Computed from input signals
  activeMissions = computed(() =>
    this.missions().filter(m => m.status === 'active')
  );
}
```

**Why this pattern:**
- `toSignal()` eliminates manual subscribe/unsubscribe
- `computed()` gives you derived state that only recalculates when inputs change
- No need for Redux/NgRx — BehaviorSubject handles the store, signals handle the view

### 2. DataService Abstraction (Mock → WebSocket Swap)

The `DataService` abstract class defines the contract. Right now `MissionService` implements it with mocked data. When the WebSocket server is ready, create a `SocketMissionService` that implements the same interface.

```typescript
// data-service.interface.ts
export abstract class DataService {
  abstract missions$: Observable<Mission[]>;
  abstract resourceTotals$: Observable<ResourceTotals>;
  abstract loading$: Observable<boolean>;
  abstract loadMissions(): void;
  abstract changeMissionStatus(id: string, status: MissionStatus): Promise<void>;
  abstract deleteDraft(id: string): Promise<void>;
}
```

**To swap in WebSocket:**
1. Create `socket-mission.service.ts` that extends `DataService`
2. Inside, open WebSocket connection, listen for events, push to BehaviorSubjects
3. Change the provider in `main.ts` or use environment-based DI
4. Zero changes needed in any component or page

### 3. Component Communication

**Parent → Child:** `input()` signals
```typescript
// Child declares
missions = input.required<Mission[]>();

// Parent binds in template
<app-summary-bar [missions]="nonDrafts()" />
```

**Child → Parent:** `output()` emitters
```typescript
// Child declares
toggleExpand = output<string>();

// Child emits
this.toggleExpand.emit(missionId);

// Parent handles
<app-mission-list (toggleExpand)="toggleExpand($event)" />
```

### 4. Standalone Components (No NgModules)

Every component uses `standalone: true` and imports its dependencies directly:

```typescript
@Component({
  selector: 'app-mission-card',
  standalone: true,
  imports: [NgClass, IonButton, IonSpinner],  // import what you use
  templateUrl: './mission-card.component.html',
  styleUrl: './mission-card.component.scss',
})
```

No `SharedModule`, no `declarations` arrays. Each component is self-contained.

### 5. RTL Support

Three layers:
1. `index.html`: `<html lang="he" dir="rtl">`
2. `app.component.ts`: `<ion-app dir="rtl">`
3. SCSS: uses `margin-inline-start` / `padding-inline-end` (not `margin-left`/`margin-right`)

For LTR elements within RTL (like progress dots or phone numbers), use `dir="ltr"` on the element:
```html
<div class="progress-dots" dir="ltr">
<span class="contact-phone" dir="ltr">{{ phone }}</span>
```

### 6. Template Control Flow (Angular 20)

Uses the new `@if` / `@for` syntax (not `*ngIf` / `*ngFor`):

```html
@if (isLoading()) {
  <ion-spinner />
} @else {
  <div class="content">...</div>
}

@for (mission of group.missions; track mission.id) {
  <app-mission-card [mission]="mission" />
}
```

### 7. Expandable Card Animation (CSS Grid Trick)

The mission card expand/collapse uses CSS `grid-template-rows` for smooth height animation without JavaScript:

```scss
.expandable {
  display: grid;
  grid-template-rows: 0fr;
  transition: grid-template-rows 0.3s ease;

  &.open {
    grid-template-rows: 1fr;
  }
}

.expandable-inner {
  overflow: hidden;
}
```

## Data Model

All types are in `models/mission.model.ts`. Key interfaces:

```
Mission
├── mission_stages: MissionStage[]
│   ├── routes: MissionRoute[]
│   └── truck_stage_progress?: TruckStageProgress[]  ← per-truck tracking
├── mission_personnel: MissionPersonnel[]
│   ├── people: MissionPerson | null
│   └── trucks: MissionTruck | null
├── stop_points?: StopPoint[]
└── custom_risks?: { id, title, content }[]
```

**Helper functions** (exported from same file):
- `getTruckCount(mission)` — unique trucks in mission
- `getCrewCount(mission)` — total personnel count
- `groupByTruck(personnel)` — groups personnel by truck for display
- `sortedStages(stages)` — stages sorted by stage_order
- `formatDateHeader(dateStr)` — returns "היום", "מחר", or DD/MM
- `formatTimeRange(dep, arr)` — "07:00 – 08:30"
- `calcTotalDuration(mission)` — total mission time from first departure to last arrival

**Status enums:**
- Mission: `draft | scheduled | active | completed | cancelled`
- Stage: `pending | departed | completed`

**Hebrew label maps** (STATUS_LABELS, ACTION_LABELS, STAGE_STATUS_LABELS) — use these for display, never hardcode Hebrew in components.

## Mock Data

`mock/mock-data.ts` contains 8 missions covering all edge cases:

| # | Name | Status | Stages | Personnel | Tests |
|---|------|--------|--------|-----------|-------|
| 1 | הובלת ציוד לבסיס צפוני | active | 3 (mixed progress) | 4 (2 trucks) | Truck stage tracking, progress dots |
| 2 | פינוי מחסן דרומי | scheduled | 1 | 1 | Simple scheduled |
| 3 | העברת דלק לבסיס מזרחי | scheduled | 2 | 2 | Multi-stage scheduled |
| 4 | שינוע חלפים למוסך | draft | 0 | 0 | Empty draft |
| 5 | אספקה שבועית — בסיס 7 | completed | 1 | 1 | Past completed |
| 6 | פינוי פסולת — אזור תעשייה | completed | 1 | 1 | Older completed |
| 7 | תרגיל חירום — בוטל | cancelled | 0 | 0 | Cancelled state |
| 8 | שינוע ציוד לתרגיל גדול | scheduled | 1 | 3 | Future date, risks |

Dates are dynamically computed (today, tomorrow, past, future) so the data always looks fresh.

## Design Tokens

All in `styles/_variables.scss`:

**Colors:** `$primary: #2D5F3F` (military green), status colors per badge
**Spacing:** `$space-1` through `$space-8` (4px–32px)
**Card:** `$card-radius: 16px`, `$card-border`, `$card-shadow`
**Font:** Assistant (Google Fonts, loaded in index.html)

## Extending This POC

### Adding a New Page (e.g., Trucks CRUD)

1. Create `src/app/pages/trucks/trucks.page.ts` (standalone component)
2. Add route to `app.routes.ts`:
   ```typescript
   { path: 'trucks', loadComponent: () => import('./pages/trucks/trucks.page').then(m => m.TrucksPage) }
   ```
3. Create a `TruckService` extending a similar abstract pattern
4. Use the same signal pattern: `toSignal()` in page, `input()` in child components

### Replacing Mock Data with WebSocket

```typescript
// socket-mission.service.ts
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
      if (msg.type === 'mission:updated') {
        // Patch single mission in the array
        const current = this.missionsSubject.value;
        const updated = current.map(m =>
          m.id === msg.payload.id ? msg.payload : m
        );
        this.missionsSubject.next(updated);
      }
    };
  }

  async changeMissionStatus(id: string, status: MissionStatus): Promise<void> {
    this.ws.send(JSON.stringify({
      type: 'mission:changeStatus',
      payload: { id, status }
    }));
  }

  // ... implement remaining abstract methods
}
```

Then swap the provider:
```typescript
// main.ts — change from mock to socket
import { DataService } from './app/services/data-service.interface';
import { SocketMissionService } from './app/services/socket-mission.service';

bootstrapApplication(AppComponent, {
  providers: [
    { provide: DataService, useClass: SocketMissionService },
    provideRouter(routes),
    provideIonicAngular({ mode: 'md' }),
  ],
});
```

### Adding Navigation

Add Ionic tab bar or side menu in `app.component.ts`:
```typescript
template: `
  <ion-app dir="rtl">
    <ion-menu side="end" contentId="main-content">
      <ion-header>
        <ion-toolbar><ion-title>תפריט</ion-title></ion-toolbar>
      </ion-header>
      <ion-content>
        <ion-list>
          <ion-item routerLink="/">לוח בקרה</ion-item>
          <ion-item routerLink="/trucks">משאיות</ion-item>
          <ion-item routerLink="/people">כוח אדם</ion-item>
        </ion-list>
      </ion-content>
    </ion-menu>
    <ion-router-outlet id="main-content"></ion-router-outlet>
  </ion-app>
`
```

Note: `side="end"` for RTL means the menu opens from the right (correct for Hebrew).

## Key Decisions for Next Developer

1. **No socket.io** — developer chose raw TypeScript WebSocket (see `context/dev-answers.md` Q5)
2. **RxJS + signals** — not NgRx. Keep state in services, not in a global store
3. **Per-step FormGroups** — when building the wizard, each step has its own FormGroup (not one giant form). Steps 3-4 use FormArray for dynamic truck/stage rows
4. **Error handling** — server emits dedicated error events (`{event}:error`), not callback acknowledgements
5. **No offline queue** — on reconnection, server sends full state snapshot. No local queue for driver view
6. **Ionic Material Design mode** — set globally via `provideIonicAngular({ mode: 'md' })`, not iOS mode
