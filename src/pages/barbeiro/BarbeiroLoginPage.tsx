import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { useLocation, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { z } from "zod";

import { BotaoVoltar } from "../../components/layout/BotaoVoltar.tsx";
import { Navbar } from "../../components/layout/Navbar.tsx";
import { useAuth } from "../../hooks/useAuth.tsx";
import { hasPasswordRecoveryInUrl } from "../../lib/auth.ts";
import { formatSupabaseError } from "../../lib/supabase.ts";

const loginSchema = z.object({
  email: z.string().email("Informe um email válido."),
  password: z.string().min(6, "Informe a senha.")
});

const recoverySchema = z
  .object({
    password: z.string().min(6, "A nova senha precisa ter pelo menos 6 caracteres."),
    confirmPassword: z.string().min(6, "Confirme a nova senha.")
  })
  .refine((values) => values.password === values.confirmPassword, {
    message: "As senhas precisam ser iguais.",
    path: ["confirmPassword"]
  });

type LoginValues = z.infer<typeof loginSchema>;
type RecoveryValues = z.infer<typeof recoverySchema>;

export function BarbeiroLoginPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { login, recoverPassword, prepareRecovery, finishRecovery } = useAuth();
  const [isRecoveryMode, setIsRecoveryMode] = useState(() => hasPasswordRecoveryInUrl());
  const [isPreparingRecovery, setIsPreparingRecovery] = useState(() => hasPasswordRecoveryInUrl());
  const helperMessage = (location.state as { message?: string } | null)?.message;
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    getValues
  } = useForm<LoginValues>({ resolver: zodResolver(loginSchema) });
  const recoveryForm = useForm<RecoveryValues>({ resolver: zodResolver(recoverySchema) });

  useEffect(() => {
    if (!hasPasswordRecoveryInUrl()) {
      setIsPreparingRecovery(false);
      return;
    }

    setIsRecoveryMode(true);
    setIsPreparingRecovery(true);

    void (async () => {
      try {
        await prepareRecovery();
      } catch (error) {
        toast.error(formatSupabaseError(error));
        setIsRecoveryMode(false);
      } finally {
        setIsPreparingRecovery(false);
      }
    })();
  }, [prepareRecovery]);

  return (
    <div className="pb-16">
      <Navbar
        subtitle={
          isRecoveryMode
            ? "Finalize a redefinicao de senha usando o link enviado por email."
            : "Login exclusivo para barbeiros autenticados no Supabase Auth."
        }
        title="Área do barbeiro"
      />
      <main className="shell mt-8 max-w-2xl space-y-6">
        <BotaoVoltar to="/" />
        {helperMessage && !isRecoveryMode ? (
          <div className="rounded-[22px] border border-amber-400/20 bg-amber-400/10 px-4 py-3 text-sm text-amber-100">
            {helperMessage}
          </div>
        ) : null}
        {isRecoveryMode ? (
          <form
            className="surface-elevated grid gap-5 p-6 sm:p-7"
            onSubmit={recoveryForm.handleSubmit(async (values) => {
              try {
                await finishRecovery(values.password);
                if (typeof window !== "undefined") {
                  window.history.replaceState({}, document.title, window.location.pathname);
                }
                toast.success("Senha atualizada.");
                navigate("/barbeiro", { replace: true });
              } catch (error) {
                toast.error(formatSupabaseError(error));
              }
            })}
          >
            <div>
              <label className="label">Nova senha</label>
              <input className="field" type="password" {...recoveryForm.register("password")} />
              {recoveryForm.formState.errors.password ? (
                <p className="mt-1 text-xs text-[#d09c9c]">{recoveryForm.formState.errors.password.message}</p>
              ) : null}
            </div>
            <div>
              <label className="label">Confirmar nova senha</label>
              <input className="field" type="password" {...recoveryForm.register("confirmPassword")} />
              {recoveryForm.formState.errors.confirmPassword ? (
                <p className="mt-1 text-xs text-[#d09c9c]">{recoveryForm.formState.errors.confirmPassword.message}</p>
              ) : null}
            </div>
            <button className="btn-primary" disabled={isPreparingRecovery || recoveryForm.formState.isSubmitting} type="submit">
              {isPreparingRecovery || recoveryForm.formState.isSubmitting ? "Atualizando..." : "Salvar nova senha"}
            </button>
          </form>
        ) : (
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
                onClick={async () => {
                  const email = getValues("email");
                  if (!email) {
                    toast.error("Informe o email para recuperar a senha.");
                    return;
                  }

                  try {
                    await recoverPassword(email);
                    toast.success("Link de recuperação enviado.");
                  } catch (error) {
                    toast.error(formatSupabaseError(error));
                  }
                }}
                type="button"
              >
                Esqueci minha senha
              </button>
            </div>
          </form>
        )}
      </main>
    </div>
  );
}
