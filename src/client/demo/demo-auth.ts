// Browser-local stand-in for the Archie identity module, used only by the demo build
// (vite.config.demo.ts). Accounts and the session live in localStorage; passwords are not
// hashed and nothing is verified server-side, so this is for demos only.
import type { Session, User } from '@archie/js-sdk';

export interface DemoRole {
  readonly id: string;
  readonly label: string;
  readonly blurb: string;
}

/** The app's three roles (ids from `role-nav.ts`), with where each one lands after sign-in. */
export const DEMO_ROLES: readonly DemoRole[] = [
  {
    id: '66f9b39f-1b6a-4241-8983-963d1158d0e6',
    label: 'Owner / General Manager',
    blurb: 'Restaurant owner view: overview, deals, settings, team. Lands on Overview.',
  },
  {
    id: 'b77bd2b8-7a5e-4453-a037-47c144aae8ee',
    label: 'Partnership Coordinator',
    blurb: 'Runs group partnerships and bookings. Lands on Overview.',
  },
  {
    id: '30e7aab9-09cc-4e04-a748-9bbe383665ad',
    label: 'Internal Marketing / Sales',
    blurb: 'FullTable team member working outreach tasks. Lands on My Tasks.',
  },
];

interface DemoAccount {
  user: User;
  password: string;
}

type Listener = (event: 'SIGNED_IN' | 'SIGNED_OUT', session: Session | null) => void;

const ACCOUNTS_KEY = 'fulltable-ai.demo.accounts';
const SESSION_KEY = 'fulltable-ai.demo.session';
const DAY_MS = 24 * 60 * 60 * 1000;

function read<T>(key: string, fallback: T): T {
  try {
    const raw = window.localStorage.getItem(key);
    return raw === null ? fallback : (JSON.parse(raw) as T);
  } catch {
    return fallback;
  }
}

function write(key: string, value: unknown): void {
  try {
    if (value === null) window.localStorage.removeItem(key);
    else window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // storage blocked: the session still lasts for this page
  }
}

function demoError(code: string, message: string): Error {
  return Object.assign(new Error(message), { code, name: 'ArchieError' });
}

const normalize = (email: string): string => email.trim().toLowerCase();

function makeSession(user: User): Session {
  return { accessToken: `demo.${user.id}`, user, expiresAt: Date.now() + 7 * DAY_MS };
}

export function createDemoAuth() {
  let session: Session | null = read<Session | null>(SESSION_KEY, null);
  if (session !== null && session.expiresAt < Date.now()) session = null;
  const listeners = new Set<Listener>();

  const accounts = (): Record<string, DemoAccount> => read(ACCOUNTS_KEY, {});

  function setSession(next: Session | null): void {
    session = next;
    write(SESSION_KEY, next);
    for (const l of [...listeners]) l(next === null ? 'SIGNED_OUT' : 'SIGNED_IN', next);
  }

  function register(params: {
    email: string;
    password: string;
    firstName?: string;
    lastName?: string;
    roleId?: string;
  }): User {
    const email = normalize(params.email);
    if (email === '' || params.password === '') throw demoError('VALIDATION', 'Email and password are required');
    const all = accounts();
    if (all[email] !== undefined) throw demoError('USER_EXISTS', 'An account with this email already exists');
    const roleId = params.roleId ?? DEMO_ROLES[0]!.id;
    const user: User = {
      id: `demo-${Math.random().toString(36).slice(2, 10)}`,
      email,
      firstName: params.firstName,
      lastName: params.lastName,
      roles: [roleId],
    };
    write(ACCOUNTS_KEY, { ...all, [email]: { user, password: params.password } });
    return user;
  }

  return {
    /** Demo-only: create the account (if new) and open its session in one step. */
    registerAndSignIn(params: Parameters<typeof register>[0]): Session {
      const s = makeSession(register(params));
      setSession(s);
      return s;
    },
    /** Demo-only: open a session as a throwaway user of `roleId`, no account needed. */
    signInAsRole(roleId: string): Session {
      const role = DEMO_ROLES.find((r) => r.id === roleId) ?? DEMO_ROLES[0]!;
      const s = makeSession({
        id: `demo-guest-${role.id.slice(0, 8)}`,
        email: 'guest@demo.fulltable.ai',
        firstName: 'Demo',
        lastName: role.label,
        roles: [role.id],
      });
      setSession(s);
      return s;
    },
    getSession: (): Session | null => session,
    getUser: (): User | null => session?.user ?? null,
    getAccessToken: (): string | null => session?.accessToken ?? null,
    onAuthStateChange(cb: Listener): () => void {
      listeners.add(cb);
      return () => listeners.delete(cb);
    },
    waitForInit: async (): Promise<void> => undefined,
    async signUp(params: Parameters<typeof register>[0]) {
      const user = register(params);
      setSession(makeSession(user));
      return { userId: user.id, message: 'Demo account created' };
    },
    async signIn(params: { email: string; password: string }) {
      const account = accounts()[normalize(params.email)];
      if (account === undefined || account.password !== params.password) {
        throw demoError('INVALID_CREDENTIALS', 'Invalid email or password');
      }
      const s = makeSession(account.user);
      setSession(s);
      return { session: s };
    },
    async exchangeCode(): Promise<{ session: Session }> {
      throw demoError('UNSUPPORTED', 'Not available in demo mode');
    },
    async signOut(): Promise<void> {
      setSession(null);
    },
    async signOutEverywhere() {
      setSession(null);
      return { revoked: true };
    },
    async listSessions() {
      return session === null
        ? []
        : [{ id: session.accessToken, device: 'This browser (demo)', createdAt: new Date().toISOString(), current: true }];
    },
    async revokeSession(): Promise<void> {
      setSession(null);
    },
    async me(): Promise<User> {
      if (session === null) throw demoError('UNAUTHENTICATED', 'Not signed in');
      return session.user;
    },
    async confirmSignUp(): Promise<{ session: Session }> {
      if (session === null) throw demoError('UNAUTHENTICATED', 'Not signed in');
      return { session };
    },
    async recoverPassword() {
      return { message: 'Demo mode: no email is sent. Create a new demo account instead.' };
    },
    async resetPassword() {
      return { message: 'Demo mode: passwords cannot be reset.' };
    },
    async refreshSession(): Promise<{ session: Session }> {
      if (session === null) throw demoError('UNAUTHENTICATED', 'Not signed in');
      return { session };
    },
    async getJWKS() {
      return { keys: [] };
    },
  };
}

export type DemoAuth = ReturnType<typeof createDemoAuth>;
