import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';

// STUB: maps integration is blocked on Barak.
// When the provider is chosen (Govmap / OSM / Waze / custom), dev swaps the
// implementation here. Wizard steps don't change.

export interface PlaceSuggestion {
  description: string;
  placeId: string;
}

export interface RouteResult {
  primary: { roadNumber: string; distanceKm: number | null; durationMinutes: number | null; polyline: string };
  backup:  { roadNumber: string; distanceKm: number | null; durationMinutes: number | null; polyline: string } | null;
}

@Injectable({ providedIn: 'root' })
export class MapsService {
  autocomplete(_query: string): Observable<PlaceSuggestion[]> {
    return of([]);
  }

  calculateRoutes(_origin: string, _destination: string): Observable<RouteResult | null> {
    return of(null);
  }

  buildNavigationUrl(_origin: string, _destination: string, _polyline?: string): string {
    return '';
  }
}
