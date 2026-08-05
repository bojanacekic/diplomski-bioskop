import { useCallback, useEffect, useState } from "react";
import { userService } from "../services/userService";
export const useUsers = (search, token) => {
  const [users, setUsers] = useState([]);
  const [state, setState] = useState("loading");
  const refresh = useCallback(async () => {
    try {
      setState("loading");
      const response = await userService.search(search, token);
      if (!response.ok) throw new Error();
      setUsers(await response.json());
      setState("ready");
    } catch { setState("error"); }
  }, [search, token]);
  useEffect(() => { if (token) refresh(); }, [refresh, token]);
  return { users, state, refresh };
};
