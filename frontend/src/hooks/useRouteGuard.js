import { useEffect } from "react";

const managementPages = [
  "manage",
  "halls",
  "hall-layout",
  "screenings",
  "reservations",
  "ticket-validation",
];

export const useRouteGuard = ({
  page,
  session,
  isCinemaManager,
  isAdministrator,
  navigate,
  onAuthenticationRequired,
}) => {
  useEffect(() => {
    if (page === "profile" && !session) {
      onAuthenticationRequired(page);
      navigate("auth", null, { replace: true });
    } else if (
      managementPages.includes(page) &&
      !(isCinemaManager || isAdministrator)
    ) {
      navigate(session ? "home" : "auth", null, { replace: true });
    } else if (page === "users" && !isAdministrator) {
      navigate(session ? "home" : "auth", null, { replace: true });
    }
  }, [page, session, isCinemaManager, isAdministrator]);
};
