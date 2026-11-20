import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { AppState, Platform, useColorScheme } from 'react-native';
import { createNavigationContainerRef } from '@react-navigation/native';
import { Database, clone, seedDb } from './model';
import {
  Key,
  themeStorage,
  loadDemo,
  saveDemo,
  saveVault,
  hasVault,
  openVault,
  createVault,
  restoreBackup,
  readUnlockedVault,
} from './vault';
export const tabs = ['Accueil', 'Prestations', 'Clients', 'Documents', 'Réglages'] as const;
export type Tab = (typeof tabs)[number];
export const navRef = createNavigationContainerRef<Record<Tab, undefined>>();
export type Panel = {
  kind:
    | 'wizard'
    | 'booking'
    | 'client'
    | 'document'
    | 'search'
    | 'auth'
    | 'activity'
    | 'profile'
    | 'clauses'
    | 'sequence'
    | 'data'
    | 'payment'
    | 'email'
    | 'confirm'
    | 'period'
    | 'appearance'
    | 'calendar';
  id?: string;
  data?: any;
};
const dark = {
  bg: '#101113',
  side: '#0c0d0f',
  card: '#191a1d',
  card2: '#202124',
  input: '#141517',
  edge: '#2d2d30',
  text: '#f5f3ef',
  muted: '#a5a5ab',
  faint: '#818187',
  gold: '#d1b482',
  goldSoft: '#26231e',
  good: '#92b7a3',
  goodBg: '#1c2b25',
  danger: '#e5a49e',
  rail: '#1b1b1e',
  hover: '#28282b',
  light: false,
};
const light = {
  bg: '#F7F7F7',
  side: '#FFFFFF',
  card: '#FFFFFF',
  card2: '#FFFFFF',
  input: '#FFFFFF',
  edge: '#E4E4E7',
  text: '#1D1D1D',
  muted: '#5B5B5B',
  faint: '#8B8B8B',
  gold: '#F6821F',
  goldSoft: '#FFF3E6',
  good: '#0F7B3D',
  goodBg: '#E9F6EE',
  danger: '#C4342B',
  rail: '#F2F2F2',
  hover: '#F2F2F2',
  light: true,
};
export type Colors = typeof dark;
type Studio = {
  db: Database;
  c: Colors;
  theme: string;
  setTheme: (v: string) => void;
  mode: 'demo' | 'private';
  exists: boolean;
  panels: Panel[];
  open: (p: Panel) => void;
  close: () => void;
  replace: (p: Panel) => void;
  clear: () => void;
  go: (t: Tab) => void;
  commit: (f: (d: Database) => void) => Promise<void>;
  notify: (v: string) => void;
  toast: string;
  authenticate: (p: string, create: boolean, backup?: string, activation?: string) => Promise<void>;
  lock: () => void;
  refreshExists: () => Promise<void>;
  year: string;
  setYear: (v: string) => void;
  busy: boolean;
  refresh: () => Promise<void>;
};
const Ctx = createContext<Studio>(null as any);
export const useStudio = () => useContext(Ctx);
export function StudioProvider({ children }: { children: React.ReactNode }) {
  const [db, setDb] = useState<Database>(() => loadDemo() || seedDb());
  const current = useRef(db);
  const epoch = useRef(0);
  const key = useRef<Key | null>(null);
  const [mode, setMode] = useState<'demo' | 'private'>('demo');
  const [exists, setExists] = useState(false);
  const [panels, setPanels] = useState<Panel[]>([]);
  const [theme, themeSet] = useState('clair');
  const scheme = useColorScheme();
  const [toast, setToast] = useState('');
  const timer = useRef<any>(null);
  const serial = useRef(Promise.resolve());
  const [busy, setBusy] = useState(false);
  const [year, setYear] = useState(String(new Date().getFullYear()));
  const notify = (v: string) => {
    setToast(v);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setToast(''), 4200);
  };
  const refreshExists = async () => {
    setExists(await hasVault());
  };
  useEffect(() => {
    themeStorage
      .read()
      .then((v) => v && themeSet(v))
      .catch(() => {});
    refreshExists()
      .then(async () => {
        if (await hasVault()) setPanels([{ kind: 'auth' }]);
      })
      .catch(() => notify('Stockage local indisponible.'));
    return () => clearTimeout(timer.current);
  }, []);
  const go = (t: Tab) => {
    setPanels([]);
    if (navRef.isReady()) navRef.navigate(t);
  };
  const lock = () => {
    epoch.current++;
    key.current?.bytes.fill(0);
    key.current = null;
    const next = loadDemo() || seedDb();
    current.current = next;
    setDb(next);
    setMode('demo');
    go('Accueil');
    setPanels([{ kind: 'auth' }]);
  };
  useEffect(() => {
    if (mode !== 'private' || Platform.OS !== 'web') return;
    let timer: any;
    const touch = () => {
      clearTimeout(timer);
      timer = setTimeout(lock, 15 * 60 * 1000);
    };
    touch();
    window.addEventListener('pointerdown', touch);
    window.addEventListener('keydown', touch);
    return () => {
      clearTimeout(timer);
      window.removeEventListener('pointerdown', touch);
      window.removeEventListener('keydown', touch);
    };
  }, [mode]);
  useEffect(() => {
    if (mode !== 'private' || Platform.OS === 'web') return;
    const subscription = AppState.addEventListener('change', (v) => {
      if (v === 'background') lock();
    });
    return () => subscription.remove();
  }, [mode]);
  const commit = async (f: (d: Database) => void) => {
    const session = epoch.current;
    const task = serial.current
      .catch(() => {})
      .then(async () => {
        if (epoch.current !== session) throw new Error('La session a été verrouillée.');
        setBusy(true);
        const k = key.current ? { bytes: key.current.bytes.slice(), salt: key.current.salt } : null;
        try {
          const old = current.current;
          const next = clone(old);
          f(next);
          next.revision = old.revision + 1;
          if (k) await saveVault(next, k, old.revision);
          else saveDemo(next);
          if (epoch.current === session) {
            current.current = next;
            setDb(next);
          }
        } finally {
          k?.bytes.fill(0);
          setBusy(false);
        }
      });
    serial.current = task;
    return task;
  };
  const refresh = async () => {
    const session = epoch.current;
    await serial.current.catch(() => {});
    const fresh = key.current ? await readUnlockedVault(key.current) : loadDemo();
    if (fresh && epoch.current === session) {
      current.current = fresh;
      setDb(fresh);
    }
  };
  const authenticate = async (p: string, create: boolean, backup?: string, activation = '') => {
    const result = backup
      ? await restoreBackup(backup, p)
      : create
        ? await createVault(p, activation)
        : await openVault(p);
    epoch.current++;
    key.current?.bytes.fill(0);
    key.current = result.key;
    current.current = result.db;
    setDb(result.db);
    setMode('private');
    setExists(true);
    go('Accueil');
    notify(create ? 'Votre coffre privé est prêt.' : 'Espace privé déverrouillé.');
  };
  const c = theme === 'clair' || (theme === 'systeme' && scheme === 'light') ? light : dark;
  return (
    <Ctx.Provider
      value={{
        db,
        c,
        theme,
        setTheme: (v) => {
          themeSet(v);
          themeStorage.write(v).catch(() => notify('Préférence non enregistrée.'));
        },
        mode,
        exists,
        panels,
        open: (p) => setPanels((a) => [...a, p]),
        close: () => setPanels((a) => a.slice(0, -1)),
        replace: (p) => setPanels((a) => [...a.slice(0, -1), p]),
        clear: () => setPanels([]),
        go,
        commit,
        notify,
        toast,
        authenticate,
        lock,
        refreshExists,
        year,
        setYear,
        busy,
        refresh,
      }}
    >
      {children}
    </Ctx.Provider>
  );
}
