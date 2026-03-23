import { createContext, useContext, useEffect, useMemo, useState } from "react";

import type { PropsWithChildren } from "react";

import {
  finishPasswordRecovery,
  getProfileForSession,
  getSession,
  getStoredAppUserSession,
  onAuthStateChange,
  preparePasswordRecoverySession,
  sendPasswordReset,
  signInWithRole,
  signOut
} from "../lib/auth.ts";
import type { AuthProfile, PerfilAcesso, SessionState } from "../types/index.ts";

interface AuthContextValue extends SessionState {
  login: (email: string, password: string, role: PerfilAcesso) => Promise<void>;
  logout: () => Promise<void>;
  recoverPassword: (email: string) => Promise<void>;
  prepareRecovery: () => Promise<boolean>;
  finishRecovery: (password: string) => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: PropsWithChildren) {
  const [session, setSession] = useState<SessionState["session"]>(null);
  const [profile, setProfile] = useState<AuthProfile | null>(null);
  const [loading, setLoading] = useState(true);

  async function hydrateProfile(nextSession: SessionState["session"]) {
    if (!nextSession) {
      setProfile(null);
      return;
    }

    try {
      const nextProfile = await getProfileForSession(nextSession);
      setProfile(nextProfile);
    } catch {
      setProfile(null);
    }
  }

  useEffect(() => {
    async function bootstrap() {
      try {
        const nextSession = await getSession();
        const fallbackProfile = !nextSession ? getStoredAppUserSession() : null;

        setSession(nextSession);

        if (fallbackProfile) {
          setProfile(fallbackProfile);
        } else {
          await hydrateProfile(nextSession);
        }
      } catch {
        setSession(null);
        setProfile(getStoredAppUserSession());
      } finally {
        setLoading(false);
      }
    }

    void bootstrap();

    const {
      data: { subscription }
    } = onAuthStateChange(async (nextSession) => {
      setSession(nextSession);
      if (nextSession) {
        await hydrateProfile(nextSession);
      } else {
        setProfile(getStoredAppUserSession());
      }
      setLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      session,
      profile,
      loading,
      isAdmin: profile?.role === "admin",
      isBarbeiro: profile?.role === "barber",
      login: async (email, password, role) => {
        const { session: nextSession, profile: nextProfile } = await signInWithRole(email, password, role);
        setSession(nextSession);
        setProfile(nextProfile);
      },
      logout: async () => {
        await signOut();
        setSession(null);
        setProfile(null);
      },
      recoverPassword: async (email) => {
        await sendPasswordReset(email);
      },
      prepareRecovery: async () => preparePasswordRecoverySession(),
      finishRecovery: async (password) => {
        await finishPasswordRecovery(password);
      },
      refreshProfile: async () => {
        if (!session) {
          return;
        }

        await hydrateProfile(session);
      }
    }),
    [loading, profile, session]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth deve ser usado dentro de AuthProvider.");
  }

  return context;
}
