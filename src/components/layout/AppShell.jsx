import { BottomNav, DEFAULT_BOTTOM_NAV_ITEMS } from "./BottomNav";

export function AppShell({ children, activeView, onViewChange, items = DEFAULT_BOTTOM_NAV_ITEMS }) {
  return (
    <>
      <style>{`
        .app-shell__main {
          width: 100%;
        }
      `}</style>

      <div
        style={{
          minHeight: "100dvh",
          background: "var(--bg-page)",
          display: "flex",
          flexDirection: "column"
        }}
      >
        {/* CORRECAO: AppShell deixa de usar grid com sidebar desktop para nao competir com a sidebar do hero. */}
        {/* MOTIVO: o wrapper global agora so controla fluxo vertical e reserva espaco para a bottom nav mobile. */}
        <main
          className="app-shell__main"
          style={{
            flex: 1,
            overflowY: "auto",
            paddingBottom: "calc(64px + env(safe-area-inset-bottom))"
          }}
        >
          {children}
        </main>
        <BottomNav activeView={activeView} onViewChange={onViewChange} items={items} />
      </div>
    </>
  );
}
