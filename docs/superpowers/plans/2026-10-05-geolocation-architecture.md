# Geolocation & Dynamic Permission Architecture Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement a scalable, maintainable location service architecture using `expo-location` with permission handling, fallback to manual city selection, reactive user context, and automatic real-time distance recalculation for activities.

**Architecture:** Layered cleanly into:
1. `src/services/locationService.ts`: Core adapter wrapping `expo-location` and reverse geocoding with graceful error/permission management.
2. `src/context/LocationContext.tsx`: React Context managing global location state (`coords`, `cityName`, `permissionStatus`, `isLocating`, `requestLocation()`, `setManualCity()`).
3. `src/hooks/useUserLocation.ts`: Ergonomic consumer hook with fallback coordinate defaults (Tunis/Sousse/Sfax).
4. UI Integration: City switcher / GPS indicator banner on `HomeScreenTab.tsx` and dynamic distance computation on activity listings.

**Tech Stack:** `expo-location`, React Native (Expo 57), TypeScript.

---

### Task 1: Dependency Setup & Core Location Service

**Files:**
- Modify: `c:/Users/abdoy/.gemini/antigravity-ide/scratch/AT/activitytn/package.json`
- Create: `c:/Users/abdoy/.gemini/antigravity-ide/scratch/AT/activitytn/src/services/locationService.ts`

**Interfaces:**
- Produces:
  ```typescript
  export type PermissionState = 'undetermined' | 'granted' | 'denied';

  export interface UserCoordinates {
    latitude: number;
    longitude: number;
  }

  export interface LocationResult {
    coords: UserCoordinates;
    city?: string;
  }

  export function checkLocationPermission(): Promise<PermissionState>;
  export function requestLocationPermission(): Promise<PermissionState>;
  export function getCurrentUserCoordinates(): Promise<LocationResult | null>;
  export function getCityFromCoordinates(coords: UserCoordinates): Promise<string | null>;
  ```

- [ ] **Step 1: Install `expo-location` in `package.json`**
Add `"expo-location": "~57.0.1"` or compatible version to dependencies.

- [ ] **Step 2: Implement `src/services/locationService.ts`**
Handle platform differences, graceful permission rejections, timeout handling, and reverse geocoding.

---

### Task 2: Reactive Location Context & Hook

**Files:**
- Create: `c:/Users/abdoy/.gemini/antigravity-ide/scratch/AT/activitytn/src/context/LocationContext.tsx`
- Create: `c:/Users/abdoy/.gemini/antigravity-ide/scratch/AT/activitytn/src/hooks/useUserLocation.ts`
- Modify: `c:/Users/abdoy/.gemini/antigravity-ide/scratch/AT/activitytn/App.tsx` (wrap with provider)

**Interfaces:**
- Produces:
  ```typescript
  export interface LocationContextValue {
    coordinates: UserCoordinates | null;
    cityName: string;
    permissionStatus: PermissionState;
    isLocating: boolean;
    error: string | null;
    requestLocation: () => Promise<void>;
    selectManualCity: (cityName: string, coords: UserCoordinates) => void;
  }
  ```

- [ ] **Step 1: Implement `LocationContext.tsx`** with stateful coordinates, persistent default fallback, and safe loading state.
- [ ] **Step 2: Implement `useUserLocation.ts`** custom hook.
- [ ] **Step 3: Wrap root application in `App.tsx` with `<LocationProvider>`.**

---

### Task 3: UI Integration (Location Banner & Real-time Distance)

**Files:**
- Modify: `c:/Users/abdoy/.gemini/antigravity-ide/scratch/AT/activitytn/src/screens/HomeScreenTab.tsx`
- Modify: `c:/Users/abdoy/.gemini/antigravity-ide/scratch/AT/activitytn/src/components/home/ActivityCard.tsx` (or `ActivityCard.tsx`)

- [ ] **Step 1: Add Location Selector / GPS status pill in `HomeScreenTab.tsx` header.**
Shows current city + GPS icon with tap action to re-locate or select city manually.
- [ ] **Step 2: Recalculate real-time `distanceKm` using `calculateDistanceKm()`** from `googleMapsService.ts` based on user GPS coordinates.

---

### Task 4: Verification & Quality Check

- [ ] **Step 1: Run typecheck `npm run typecheck` in `activitytn`.**
- [ ] **Step 2: Verify zero compiler or bundle errors.**
