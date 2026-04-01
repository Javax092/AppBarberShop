import { useEffect, useState } from "react";

import type { PublicHomeSnapshot } from "../types/index.ts";
import { getPublicHomeSnapshot } from "../lib/public.ts";

const initialState: PublicHomeSnapshot = {
  barbers: [],
  services: [],
  metrics: {
    servicesCount: 0,
    categoriesCount: 0,
    barbersCount: 0,
    barbersWithPhotos: 0
  }
};

export function usePublicHome() {
  const [data, setData] = useState<PublicHomeSnapshot>(initialState);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    async function load() {
      setLoading(true);
      setError("");
      try {
        const snapshot = await getPublicHomeSnapshot();
        if (active) {
          setData(snapshot);
        }
      } catch (nextError) {
        if (active) {
          setError(nextError instanceof Error ? nextError.message : "Nao foi possivel carregar a vitrine publica.");
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
