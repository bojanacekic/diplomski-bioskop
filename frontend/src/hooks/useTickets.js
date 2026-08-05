import { useCallback, useEffect, useState } from "react";
import { ticketService } from "../services/ticketService";
import { TicketStatus } from "../models/ticketStatus";
export const useTickets = (token, all = false) => {
  const [tickets, setTickets] = useState([]);
  const [state, setState] = useState("loading");
  const refresh = useCallback(async () => {
    try {
      setState("loading");
      const response = await (all
        ? ticketService.getAll(token)
        : ticketService.getMine(token));
      if (!response.ok) throw new Error();
      const loadedTickets = await response.json();
      setTickets(
        all
          ? loadedTickets
          : loadedTickets.filter(
              (ticket) => ticket.status !== TicketStatus.Cancelled,
            ),
      );
      setState("ready");
    } catch {
      setState("error");
    }
  }, [all, token]);
  useEffect(() => {
    if (token) refresh();
  }, [refresh, token]);
  return { tickets, setTickets, state, refresh };
};
