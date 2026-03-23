import { useNavigate } from "react-router-dom";

export function BotaoVoltar({ to }: { to?: string }) {
  const navigate = useNavigate();

  return (
    <button
      className="btn-secondary gap-2 px-4 py-2"
      onClick={() => {
        if (to) {
          navigate(to);
          return;
        }

        navigate(-1);
      }}
      type="button"
    >
      <span aria-hidden="true">←</span>
      Retornar
    </button>
  );
}
