import { useEffect, useState } from "react";
import { getAdminSessionState, loginAdmin, logoutAdmin, subscribeAdminAuthChanges, type AdminCredentials } from "../lib/admin";
import type { AdminSessionState } from "../lib/supabase.ts";

interface UseAdminResult extends AdminSessionState {
  isLoading: boolean;
  error: string;
  login: (credentials: AdminCredentials) => Promise<void>;
  logout: () => Promise<void>;
}

const initialState: AdminSessionState = {
  session: null,
  profile: null,
  isAdmin: false
};

export function useAdmin(): UseAdminResult {
  const [state, setState] = useState<AdminSessionState>(initialState);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;

    void (async () => {
      try {
        const nextState = await getAdminSessionState();

        if (mounted) {
          setState(nextState);
        }
      } catch (loadError) {
        if (mounted) {
          setError(loadError instanceof Error ? loadError.message : "Falha ao carregar a sessao administrativa.");
        }
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    })();

    const unsubscribe = subscribeAdminAuthChanges((_event, nextState) => {
      if (!mounted) {
        return;
      }

      setState(nextState);
      setError("");
      setIsLoading(false);
    });

    return () => {
      mounted = false;
      unsubscribe();
    };
  }, []);

  async function login(credentials: AdminCredentials): Promise<void> {
    setIsLoading(true);
    setError("");

    try {
      const nextState = await loginAdmin(credentials);
      setState(nextState);
    } catch (loginError) {
      setError(loginError instanceof Error ? loginError.message : "Falha ao autenticar o admin.");
      throw loginError;
    } finally {
      setIsLoading(false);
    }
  }

  async function logout(): Promise<void> {
    setIsLoading(true);
    setError("");

    try {
      await logoutAdmin();
      setState(initialState);
    } catch (logoutError) {
      setError(logoutError instanceof Error ? logoutError.message : "Falha ao encerrar a sessao.");
      throw logoutError;
    } finally {
      setIsLoading(false);
    }
  }

  return {
    ...state,
    isLoading,
    error,
    login,
    logout
  };
}
