import { useEffect, useState } from "react";

import { getPublicBookingSnapshot } from "../lib/public.ts";
import type { PublicBookingSnapshot } from "../types/index.ts";

const initialState: PublicBookingSnapshot = {
  barbers: [],
  services: [],
  availability: [],
  scheduleBlocks: []
};

export function usePublicBookingData() {
  const [data, setData] = useState<PublicBookingSnapshot>(initialState);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    async function load() {
      setLoading(true);
      setError("");
      try {
        const snapshot = await getPublicBookingSnapshot();
        if (active) {
          setData(snapshot);
        }
      } catch (nextError) {
        if (active) {
          setError(nextError instanceof Error ? nextError.message : "Nao foi possivel carregar os dados do agendamento.");
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    void load();

    return () => {
      active = false;
    };
  }, []);

  return {
    ...data,
    error,
    loading
  };
}
