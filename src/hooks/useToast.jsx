import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { Toast } from "../components/Toast";

const ToastContext = createContext({
  showToast: () => {},
  clearToast: () => {}
});

// ALTERACAO: provider centraliza feedback visual e substitui alerts em todo o app.
export function ToastProvider({ children }) {
  const [toast, setToast] = useState(null);

  const clearToast = useCallback(() => {
    setToast(null);
  }, []);

  const showToast = useCallback(({ type = "info", title, message }) => {
    setToast({
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      type,
      title,
      message
    });
  }, []);

  useEffect(() => {
    if (!toast) {
      return undefined;
    }

    const timeoutId = window.setTimeout(() => {
      setToast((current) => (current?.id === toast.id ? null : current));
    }, 3000);

    return () => window.clearTimeout(timeoutId);
  }, [toast]);

  const value = useMemo(
    () => ({
      showToast,
      clearToast
    }),
    [clearToast, showToast]
  );

  return (
    <ToastContext.Provider value={value}>
      {children}
      <Toast toast={toast} />
    </ToastContext.Provider>
  );
}

export function useToast() {
  return useContext(ToastContext);
}
