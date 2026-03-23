import { useCallback, useEffect, useState } from "react";

import {
  excluirBarbeiro,
  listBarbeiros,
  listBarbeirosAdmin,
  listDisponibilidade,
  listScheduleBlocks,
  resetSenhaBarbeiro,
  saveOwnBarberProfile,
  toggleBarbeiro,
  upsertBarbeiro
} from "../lib/barbeiros.ts";
import type {
  AuthProfile,
  Barbeiro,
  BarbeiroAdmin,
  BarbeiroPayload,
  HorarioDisponibilidade,
  ScheduleBlock
} from "../types/index.ts";

export function useBarbeiros(includeInactive = false, withAdminData = false, sessionProfile?: AuthProfile | null) {
  const [barbeiros, setBarbeiros] = useState<Barbeiro[]>([]);
  const [barbeirosAdmin, setBarbeirosAdmin] = useState<BarbeiroAdmin[]>([]);
  const [disponibilidade, setDisponibilidade] = useState<HorarioDisponibilidade[]>([]);
  const [bloqueiosAgenda, setBloqueiosAgenda] = useState<ScheduleBlock[]>([]);
  const [error, setError] = useState<string>("");
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const scopedBarberId = sessionProfile?.role === "barber" ? sessionProfile.barberId ?? undefined : undefined;
      const [barbersData, availabilityData, scheduleBlocksData, barbersAdminData] = await Promise.all([
        listBarbeiros(includeInactive, scopedBarberId),
        listDisponibilidade(scopedBarberId),
        listScheduleBlocks(scopedBarberId),
        withAdminData ? listBarbeirosAdmin() : Promise.resolve([])
      ]);
      setBarbeiros(barbersData);
      setBarbeirosAdmin(barbersAdminData);
      setDisponibilidade(availabilityData);
      setBloqueiosAgenda(scheduleBlocksData);
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "Nao foi possivel carregar os barbeiros.");
      throw nextError;
    } finally {
      setLoading(false);
    }
  }, [includeInactive, sessionProfile?.barberId, sessionProfile?.role, withAdminData]);

  useEffect(() => {
    refresh().catch(() => {
      // O estado de erro ja foi salvo para a UI decidir como reagir.
    });
  }, [refresh]);

  return {
    barbeiros,
    barbeirosAdmin,
    disponibilidade,
    bloqueiosAgenda,
    error,
    loading,
    refresh,
    salvar: async (
      payload: BarbeiroPayload,
      options?: {
        avatarFile?: File | null;
        removeAvatar?: boolean;
      }
    ) => {
      if (sessionProfile?.role === "barber") {
        const result = await saveOwnBarberProfile(sessionProfile, payload, options);
        await refresh();
        return result;
      } else {
        const result = await upsertBarbeiro(payload, options, sessionProfile);
        await refresh();
        return result;
      }
    },
    alternarStatus: async (profileId: string, isActive: boolean) => {
      await toggleBarbeiro(profileId, isActive);
      await refresh();
    },
    resetarSenha: async (profileId: string, password: string) => {
      await resetSenhaBarbeiro(profileId, password);
    },
    excluir: async (profileId: string) => {
      await excluirBarbeiro(profileId);
      await refresh();
    }
  };
}
