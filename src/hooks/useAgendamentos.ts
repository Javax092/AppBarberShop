import { useCallback, useEffect, useState } from "react";

import {
  createAgendamento,
  getDashboardResumo,
  listAgendaHoje,
  listAgendamentos,
  listProximosAgendamentos,
  updateStatusAgendamento
} from "../lib/agendamentos.ts";
import type { Agendamento, AuthProfile, CreateAppointmentInput, DashboardResumo, StatusAgendamento } from "../types/index.ts";

export function useAgendamentos(
  filters?: { barberId?: string; date?: string; status?: StatusAgendamento | "all" },
  sessionProfile?: AuthProfile | null
) {
  const [agendamentos, setAgendamentos] = useState<Agendamento[]>([]);
  const [agendaHoje, setAgendaHoje] = useState<Agendamento[]>([]);
  const [proximos, setProximos] = useState<Agendamento[]>([]);
  const [dashboard, setDashboard] = useState<DashboardResumo | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const [listData, todayData, upcomingData, dashboardData] = await Promise.all([
        listAgendamentos(filters, sessionProfile),
        listAgendaHoje(filters?.barberId, sessionProfile),
        listProximosAgendamentos(filters?.barberId, sessionProfile),
        getDashboardResumo(sessionProfile)
      ]);
      setAgendamentos(listData);
      setAgendaHoje(todayData);
      setProximos(upcomingData);
      setDashboard(dashboardData);
    } finally {
      setLoading(false);
    }
  }, [filters, sessionProfile]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return {
    agendamentos,
    agendaHoje,
    proximos,
    dashboard,
    loading,
    refresh,
    criar: async (payload: CreateAppointmentInput) => {
      const appointment = await createAgendamento(payload);
      await refresh();
      return appointment;
    },
    atualizarStatus: async (id: string, status: StatusAgendamento) => {
      await updateStatusAgendamento(id, status, sessionProfile);
      await refresh();
    }
  };
}
