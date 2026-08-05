import { useCallback, useEffect, useState } from "react";
import { ticketService } from "../services/ticketService";
export const useTickets = (token, all = false) => {
  const [tickets, setTickets] = useState([]);
  const [state, setState] = useState("loading");
  const refresh = useCallback(async () => {
    try {
      setState("loading");
      const response = await (all ? ticketService.getAll(token) : ticketService.getMine(token));
      if (!response.ok) throw new Error();
      setTickets(await response.json());
      setState("ready");
    } catch { setState("error"); }
  }, [all, token]);
  useEffect(() => { if (token) refresh(); }, [refresh, token]);
  return { tickets, setTickets, state, refresh };
};
