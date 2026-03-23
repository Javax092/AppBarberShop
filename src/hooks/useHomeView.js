// ALTERACAO: hook centraliza a view inicial correta por perfil para navegação consistente.
export function useHomeView(role) {
  const homeMap = {
    admin: "panel",
    barber: "panel",
    guest: "hero"
  };

  return homeMap[role] ?? "hero";
}
