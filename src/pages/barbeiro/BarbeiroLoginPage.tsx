import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useLocation, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { z } from "zod";

import { BotaoVoltar } from "../../components/layout/BotaoVoltar.tsx";
import { Navbar } from "../../components/layout/Navbar.tsx";
import { useAuth } from "../../hooks/useAuth.tsx";
import { formatSupabaseError } from "../../lib/supabase.ts";

const loginSchema = z.object({
  email: z.string().email("Informe um email válido."),
  password: z.string().min(6, "Informe a senha.")
});

type LoginValues = z.infer<typeof loginSchema>;

export function BarbeiroLoginPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { login } = useAuth();
  const helperMessage = (location.state as { message?: string } | null)?.message;
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting }
  } = useForm<LoginValues>({ resolver: zodResolver(loginSchema) });

  return (
    <div className="pb-16">
      <Navbar
        subtitle="Login interno de barbeiro com credenciais proprias, sem dependencia de auth.users."
        title="Área do barbeiro"
      />
      <main className="shell mt-8 max-w-2xl space-y-6">
        <BotaoVoltar to="/" />
        {helperMessage ? (
          <div className="rounded-[22px] border border-amber-400/20 bg-amber-400/10 px-4 py-3 text-sm text-amber-100">
            {helperMessage}
          </div>
        ) : null}
        <form
          className="surface-elevated grid gap-5 p-6 sm:p-7"
          onSubmit={handleSubmit(async (values) => {
            try {
              await login(values.email, values.password, "barber");
              toast.success("Login realizado.");
              navigate("/barbeiro");
            } catch (error) {
              toast.error(formatSupabaseError(error));
            }
          })}
        >
          <div>
            <label className="label">Email</label>
            <input className="field" {...register("email")} />
            {errors.email ? <p className="mt-1 text-xs text-[#d09c9c]">{errors.email.message}</p> : null}
          </div>
          <div>
            <label className="label">Senha</label>
            <input className="field" type="password" {...register("password")} />
            {errors.password ? <p className="mt-1 text-xs text-[#d09c9c]">{errors.password.message}</p> : null}
          </div>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <button className="btn-primary" disabled={isSubmitting} type="submit">
              {isSubmitting ? "Entrando..." : "Entrar"}
            </button>
            <button
              className="text-sm font-semibold text-[#c9a96e]"
              onClick={() => {
                toast.info("A redefinicao de senha do barbeiro deve ser feita por um admin no painel interno.");
              }}
              type="button"
            >
              Solicitar reset ao admin
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}
