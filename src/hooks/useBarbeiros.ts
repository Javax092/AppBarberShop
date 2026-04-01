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
      const previousBarbeiros = barbeiros;
      const previousBarbeirosAdmin = barbeirosAdmin;

      setBarbeirosAdmin((current) =>
        current.map((item) => (item.profileId === profileId ? { ...item, isActive } : item))
      );
      setBarbeiros((current) => current.map((item) => {
        const matchingAdmin = previousBarbeirosAdmin.find((adminItem) => adminItem.profileId === profileId);
        return matchingAdmin && item.id === matchingAdmin.id ? { ...item, isActive } : item;
      }));

      try {
        await toggleBarbeiro(profileId, isActive);
        await refresh();
      } catch (nextError) {
        setBarbeiros(previousBarbeiros);
        setBarbeirosAdmin(previousBarbeirosAdmin);
        throw nextError;
      }
    },
    resetarSenha: async (profileId: string, password: string) => {
      await resetSenhaBarbeiro(profileId, password);
    },
    excluir: async (profileId: string) => {
      const previousBarbeiros = barbeiros;
      const previousBarbeirosAdmin = barbeirosAdmin;
      const previousDisponibilidade = disponibilidade;
      const previousBloqueiosAgenda = bloqueiosAgenda;
      const deletedBarber = barbeirosAdmin.find((item) => item.profileId === profileId);

      setBarbeirosAdmin((current) => current.filter((item) => item.profileId !== profileId));
      if (deletedBarber) {
        setBarbeiros((current) => current.filter((item) => item.id !== deletedBarber.id));
        setDisponibilidade((current) => current.filter((item) => item.barberId !== deletedBarber.id));
        setBloqueiosAgenda((current) => current.filter((item) => item.barberId !== deletedBarber.id));
      }

      try {
        await excluirBarbeiro(profileId);
        await refresh();
      } catch (nextError) {
        setBarbeiros(previousBarbeiros);
        setBarbeirosAdmin(previousBarbeirosAdmin);
        setDisponibilidade(previousDisponibilidade);
        setBloqueiosAgenda(previousBloqueiosAgenda);
        throw nextError;
      }
    }
  };
}
