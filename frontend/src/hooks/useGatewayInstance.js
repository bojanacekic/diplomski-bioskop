import { useEffect, useRef } from "react";
import { authService } from "../services/authService";

export const useGatewayInstance = (enabled, onInstanceChanged) => {
  const callbackRef = useRef(onInstanceChanged);
  callbackRef.current = onInstanceChanged;
  useEffect(() => {
    if (!enabled) return undefined;
    let active = true;
    const check = async () => {
      try {
        const response = await authService.getGatewayHealth();
        if (!response.ok || !active) return;
        const { instanceId } = await response.json();
        if (!instanceId) return;
        const key = "smartCinemaGatewayInstance";
        const previous = sessionStorage.getItem(key);
        if (previous && previous !== instanceId) callbackRef.current();
        sessionStorage.setItem(key, instanceId);
      } catch { /* A temporary outage must not sign the user out. */ }
    };
    check();
    const interval = window.setInterval(check, 5000);
    return () => { active = false; window.clearInterval(interval); };
  }, [enabled]);
};
