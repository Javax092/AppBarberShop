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
  const [authError, setAuthError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  async function hydrateProfile(nextSession: SessionState["session"]) {
    if (!nextSession) {
      setProfile(null);
      setAuthError(null);
      return;
    }

    try {
      const nextProfile = await getProfileForSession(nextSession);
      setProfile(nextProfile);
      setAuthError(null);
    } catch (error) {
      setProfile(null);
      setAuthError(error instanceof Error ? error.message : "Nao foi possivel validar seu perfil de acesso.");
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
          setAuthError(null);
        } else {
          await hydrateProfile(nextSession);
        }
      } catch {
        setSession(null);
        setProfile(getStoredAppUserSession());
        setAuthError(null);
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
      authError,
      isAdmin: profile?.role === "admin",
      isBarbeiro: profile?.role === "barber",
      login: async (email, password, role) => {
        const { session: nextSession, profile: nextProfile } = await signInWithRole(email, password, role);
        setSession(nextSession);
        setProfile(nextProfile);
        setAuthError(null);
      },
      logout: async () => {
        await signOut();
        setSession(null);
        setProfile(null);
        setAuthError(null);
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
    [authError, loading, profile, session]
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
