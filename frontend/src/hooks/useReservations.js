import { useCallback, useEffect, useState } from "react";
import { reservationService } from "../services/reservationService";
import { ReservationStatus } from "../models/reservationStatus";
export const useReservations = (token, all = false) => {
  const [reservations, setReservations] = useState([]);
  const [state, setState] = useState("loading");
  const refresh = useCallback(async () => {
    try {
      setState("loading");
      const response = await (all
        ? reservationService.getAll(token)
        : reservationService.getMine(token));
      if (!response.ok) throw new Error();
      const loadedReservations = await response.json();
      setReservations(
        all
          ? loadedReservations
          : loadedReservations.filter(
              (reservation) =>
                reservation.status !== ReservationStatus.Cancelled,
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
  return { reservations, setReservations, state, refresh };
};
