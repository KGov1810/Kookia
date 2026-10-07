// Préparation commune à tous les tests : Firebase simulé, base vide.
import { vi } from 'vitest';

vi.mock('firebase/app', () => import('./mocks/firebase-app.js'));
vi.mock('firebase/auth', () => import('./mocks/firebase-auth.js'));
vi.mock('firebase/firestore', () => import('./mocks/firebase-firestore.js'));

delete globalThis.__db;
delete globalThis.__auth;
globalThis.__authError = null;
globalThis.__denyHistory = false;
globalThis.__denyStats = false;
