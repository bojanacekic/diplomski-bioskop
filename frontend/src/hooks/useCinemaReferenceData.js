import { useCallback, useEffect, useState } from "react";
import { cinemaReferenceService } from "../services/cinemaReferenceService";

export const useCinemaReferenceData = (autoLoad = true) => {
  const [data, setData] = useState({ movies: [], halls: [], screenings: [] });
  const [state, setState] = useState("loading");
  const refresh = useCallback(async () => {
    setState("loading");
    try { setData(await cinemaReferenceService.getAll()); setState("ready"); }
    catch { setState("error"); }
  }, []);
  useEffect(() => { if (autoLoad) refresh(); }, [autoLoad, refresh]);
  return { ...data, state, refresh };
};
