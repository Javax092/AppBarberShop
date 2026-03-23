import { useCallback, useEffect, useState } from "react";

import { listAvailableSlots } from "../lib/horarios.ts";
import type { Barbeiro, HorarioDisponibilidade, HorarioSlot, ScheduleBlock } from "../types/index.ts";

export function useHorarios(
  date: string,
  barberId: string | null,
  serviceDuration: number,
  preload?: {
    barbers?: Barbeiro[];
    availability?: HorarioDisponibilidade[];
    scheduleBlocks?: ScheduleBlock[];
  }
) {
  const [slots, setSlots] = useState<HorarioSlot[]>([]);
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    if (!date || serviceDuration <= 0) {
      setSlots([]);
      return;
    }

    setLoading(true);
    try {
      const data = await listAvailableSlots(date, barberId, serviceDuration, preload);
      setSlots(data);
    } finally {
      setLoading(false);
    }
  }, [barberId, date, preload, serviceDuration]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return { slots, loading, refresh };
}
