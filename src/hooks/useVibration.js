export function useVibration() {
  // ALTERACAO: detecta suporte nativo sem quebrar SSR ou browsers limitados.
  const supportsVibration =
    typeof navigator !== "undefined" && typeof navigator.vibrate === "function";

  const vibrate = (pattern) => {
    // ALTERACAO: fallback silencioso para plataformas sem suporte.
    if (!supportsVibration) {
      return false;
    }

    return navigator.vibrate(pattern);
  };

  return {
    supportsVibration,
    vibrate,
    // ALTERACAO: preset curto para taps simples.
    tap: () => vibrate(10),
    // ALTERACAO: preset de confirmacao com dois pulsos.
    confirm: () => vibrate([18, 28, 18]),
    // ALTERACAO: preset de erro com tres pulsos curtos.
    error: () => vibrate([16, 28, 16, 28, 16])
  };
}
