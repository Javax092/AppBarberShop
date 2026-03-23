import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useLocation, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { z } from "zod";

import { BotaoVoltar } from "../../components/layout/BotaoVoltar.tsx";
import { useAuth } from "../../hooks/useAuth.tsx";
import { HARDCODED_ADMIN_EMAIL, HARDCODED_ADMIN_PASSWORD } from "../../lib/auth.ts";
import { formatSupabaseError } from "../../lib/supabase.ts";

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6)
});

type LoginValues = z.infer<typeof loginSchema>;

export function AdminLoginPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { login } = useAuth();
  const helperMessage = (location.state as { message?: string } | null)?.message;
  const {
    register,
    handleSubmit,
    formState: { isSubmitting, errors }
  } = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: HARDCODED_ADMIN_EMAIL,
      password: HARDCODED_ADMIN_PASSWORD
    }
  });

  return (
    <div className="min-h-screen py-10 text-white">
      <main className="mx-auto max-w-2xl px-4">
        <BotaoVoltar to="/" />
        <section className="hero-panel mt-6 p-8">
          <p className="text-xs font-semibold uppercase tracking-[0.35em] text-[#c9a96e]">Painel administrativo</p>
          <h1 className="mt-4 font-display text-6xl">Admin Login</h1>
          <p className="mt-3 text-sm text-white/70">Acesso restrito para gestão de catálogo, promoções, barbeiros e agendamentos.</p>
          {helperMessage ? (
            <div className="mt-5 rounded-[22px] border border-amber-400/20 bg-amber-400/10 px-4 py-3 text-sm text-amber-100">
              {helperMessage}
            </div>
          ) : null}
          <form
            className="mt-8 grid gap-5"
            onSubmit={handleSubmit(async (values) => {
              try {
                await login(values.email, values.password, "admin");
                toast.success("Login realizado.");
                navigate("/admin");
              } catch (error) {
                toast.error(formatSupabaseError(error));
              }
            })}
          >
            <div>
              <label className="label text-white">Email</label>
              <input className="field" {...register("email")} />
              {errors.email ? <p className="mt-1 text-xs text-[#d09c9c]">{errors.email.message}</p> : null}
            </div>
            <div>
              <label className="label text-white">Senha</label>
              <input className="field" type="password" {...register("password")} />
              {errors.password ? <p className="mt-1 text-xs text-[#d09c9c]">{errors.password.message}</p> : null}
            </div>
            <button className="btn-primary" disabled={isSubmitting} type="submit">
              {isSubmitting ? "Entrando..." : "Entrar no admin"}
            </button>
          </form>
        </section>
      </main>
    </div>
  );
}
