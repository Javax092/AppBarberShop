import { useEffect, useState, type FormEvent } from "react";
import { AdminUpload } from "../components/AdminUpload";
import { GaleriaPublica } from "../components/GaleriaPublica";
import { ADMIN_REDIRECT_PATH } from "../lib/supabase.ts";
import { useAdmin } from "../hooks/useAdmin";

export function AdminPage() {
  const { isAdmin, session, isLoading, error, login, logout } = useAdmin();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [formError, setFormError] = useState("");

  useEffect(() => {
    if (!isLoading && session && !isAdmin) {
      window.location.replace(ADMIN_REDIRECT_PATH);
    }
  }, [isAdmin, isLoading, session]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError("");

    try {
      await login({ email, password });
      setPassword("");
    } catch (loginError) {
      setFormError(loginError instanceof Error ? loginError.message : "Falha ao autenticar.");
    }
  }

  if (isLoading) {
    return <p>Validando acesso administrativo...</p>;
  }

  if (session && !isAdmin) {
    return <p>Redirecionando...</p>;
  }

  if (!session) {
    return (
      <section>
        <h1>Login do admin</h1>
        <form onSubmit={handleSubmit}>
          <label htmlFor="admin-email">Email</label>
          <input
            id="admin-email"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            autoComplete="email"
            required
          />

          <label htmlFor="admin-password">Senha</label>
          <input
            id="admin-password"
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            autoComplete="current-password"
            required
          />

          <button type="submit">Entrar</button>
        </form>

        {error ? <p role="alert">{error}</p> : null}
        {formError ? <p role="alert">{formError}</p> : null}
      </section>
    );
  }

  return (
    <section>
      <header>
        <h1>Painel administrativo</h1>
        <p>Upload liberado apenas para admin autenticado.</p>
        <button type="button" onClick={() => void logout()}>
          Sair
        </button>
      </header>

      <AdminUpload isAdmin={isAdmin} />
      <GaleriaPublica />
      {error ? <p role="alert">{error}</p> : null}
    </section>
  );
}
