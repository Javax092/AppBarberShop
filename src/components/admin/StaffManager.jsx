// src/components/admin/StaffManager.jsx - gestao de acessos da equipe com validacao inline e acoes compactadas.
import { useMemo, useState } from "react";

function getInitials(name) {
  return (name || "")
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

function validateStaff(form) {
  const errors = {};
  if (!form.fullName?.trim()) errors.fullName = "Informe o nome.";
  if (!/\S+@\S+\.\S+/.test(form.email || "")) errors.email = "Informe um email valido.";
  if (form.role === "barber" && !form.barberId) errors.barberId = "Vincule um barbeiro.";
  if (!form.id && String(form.password || "").length < 6) errors.password = "Minimo de 6 caracteres.";
  return errors;
}

/**
 * @param {{
 *   staffMembers: import('../../types').StaffMember[],
 *   staffForm: import('../../types').StaffMember & { password?: string },
 *   onStaffFormChange: (field: string, value: string|boolean) => void,
 *   onSaveStaff: (event: React.FormEvent<HTMLFormElement>) => void,
 *   isSavingStaff: boolean,
 *   staffActionId: string,
 *   onEditStaffMember: (staff: import('../../types').StaffMember) => void,
 *   onToggleStaffActive: (staff: import('../../types').StaffMember) => void,
 *   onResetStaffPassword: (staff: import('../../types').StaffMember) => void,
 *   staffFeedback: string,
 *   barbers: import('../../types').Barber[]
 * }} props
 */
export function StaffManager({
  staffMembers,
  staffForm,
  onStaffFormChange,
  onSaveStaff,
  isSavingStaff,
  staffActionId,
  onEditStaffMember,
  onToggleStaffActive,
  onResetStaffPassword,
  staffFeedback,
  barbers
}) {
  const [memberAction, setMemberAction] = useState({});
  const errors = useMemo(() => validateStaff(staffForm), [staffForm]);
  const cx = {
    wrap: "glass-card subsection-card",
    list: "staff-manager__list",
    card: "staff-manager__card"
  };

  function handleSubmit(event) {
    if (Object.keys(errors).length) {
      event.preventDefault();
      return;
    }
    onSaveStaff(event);
  }

  function handleMemberAction(staff, value) {
    setMemberAction((current) => ({ ...current, [staff.id]: value }));
    if (value === "edit") onEditStaffMember(staff);
    if (value === "toggle") onToggleStaffActive(staff);
    if (value === "reset") onResetStaffPassword(staff);
  }

  return (
    <>
      <style>{`
        /* ALTERACAO: gestor de equipe com avatar por role, validacao inline e acoes compactadas em select nativo. */
        .staff-manager__list {
          display: grid;
          gap: 12px;
        }
        .staff-manager__card {
          display: grid;
          grid-template-columns: auto 1fr auto;
          gap: 14px;
          align-items: center;
          padding: 16px;
          border-radius: 20px;
          border: 1px solid var(--border-soft);
          background: rgba(255,255,255,0.03);
        }
        .staff-manager__avatar {
          width: 48px;
          height: 48px;
          border-radius: 999px;
          display: grid;
          place-items: center;
          font-weight: 700;
          color: var(--color-dark);
        }
        .staff-manager__avatar[data-role="admin"] { background: var(--color-gold); }
        .staff-manager__avatar[data-role="barber"] { background: var(--color-smoke); }
        .staff-manager__meta p,
        .staff-manager__meta small {
          margin: 0;
        }
        .staff-manager__error {
          /* CORRECAO: remove cor hardcoded que perdia contraste fora do dark original. */
          /* MOTIVO: status-danger acompanha o tema sem virar texto claro demais em superfícies claras. */
          color: var(--status-danger);
          font-size: 0.8rem;
        }
      `}</style>

      <section className={cx.wrap}>
        <div className="section-head compact">
          <div>
            <span className="mini-badge">Equipe</span>
            <h2>Acesso da equipe</h2>
          </div>
          <p>Crie, ajuste e recupere acessos da equipe.</p>
        </div>

        <form className="form-grid" onSubmit={handleSubmit}>
          <label>
            Nome
            <input value={staffForm.fullName} onChange={(event) => onStaffFormChange("fullName", event.target.value)} />
            {errors.fullName ? <span className="staff-manager__error">{errors.fullName}</span> : null}
          </label>
          <label>
            Email
            <input type="email" value={staffForm.email} onChange={(event) => onStaffFormChange("email", event.target.value)} />
            {errors.email ? <span className="staff-manager__error">{errors.email}</span> : null}
          </label>
          <label>
            Perfil
            <select value={staffForm.role} onChange={(event) => onStaffFormChange("role", event.target.value)}>
              <option value="barber">Barbeiro</option>
              <option value="admin">Admin</option>
            </select>
          </label>
          <label>
            Barbeiro vinculado
            <select value={staffForm.barberId || ""} onChange={(event) => onStaffFormChange("barberId", event.target.value)}>
              <option value="">Sem vinculo</option>
              {barbers.map((barber) => <option key={barber.id} value={barber.id}>{barber.name}</option>)}
            </select>
            {errors.barberId ? <span className="staff-manager__error">{errors.barberId}</span> : null}
          </label>
          <label>
            Senha
            <input type="password" value={staffForm.password || ""} onChange={(event) => onStaffFormChange("password", event.target.value)} />
            {errors.password ? <span className="staff-manager__error">{errors.password}</span> : null}
          </label>
          <label className="checkbox-row">
            <input type="checkbox" checked={staffForm.isActive} onChange={(event) => onStaffFormChange("isActive", event.target.checked)} />
            Usuario ativo
          </label>
          <div className="actions-row">
            <button className="primary-button" aria-label="Salvar membro da equipe" type="submit" disabled={isSavingStaff}>
              {isSavingStaff ? "Salvando..." : staffForm.id ? "Atualizar equipe" : "Criar membro"}
            </button>
          </div>
          {staffFeedback ? <p className="feedback-line">{staffFeedback}</p> : null}
        </form>

        <div className={cx.list}>
          {staffMembers.map((staff) => (
            <article key={staff.id} className={cx.card}>
              <div className="staff-manager__avatar" data-role={staff.role}>{getInitials(staff.fullName)}</div>
              <div className="staff-manager__meta">
                <strong>{staff.fullName}</strong>
                <p>{staff.email}</p>
                <small>{staff.barberId || "Operacao geral"} • {staff.isActive ? "Ativo" : "Inativo"}</small>
              </div>
              <select
                aria-label={`Acoes para ${staff.fullName}`}
                value={memberAction[staff.id] || ""}
                onChange={(event) => handleMemberAction(staff, event.target.value)}
                disabled={staffActionId === staff.id}
              >
                <option value="">Acoes</option>
                <option value="edit">Editar</option>
                <option value="toggle">{staff.isActive ? "Desativar" : "Reativar"}</option>
                <option value="reset">Resetar senha</option>
              </select>
            </article>
          ))}
        </div>
      </section>
    </>
  );
}
