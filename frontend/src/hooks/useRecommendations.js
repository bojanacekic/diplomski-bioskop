import { useEffect, useMemo, useState } from "react";
import { recommendationService } from "../services/recommendationService";

export const useRecommendations = (
  accessToken,
  enabled,
  movies,
  refreshKey,
) => {
  const [recommendations, setRecommendations] = useState([]);
  useEffect(() => {
    if (!accessToken || !enabled) {
      setRecommendations([]);
      return undefined;
    }
    let active = true;
    recommendationService
      .getMine(accessToken)
      .then((response) => (response.ok ? response.json() : []))
      .then((items) => active && setRecommendations(items))
      .catch(() => active && setRecommendations([]));
    return () => {
      active = false;
    };
  }, [accessToken, enabled, refreshKey]);
  return useMemo(
    () =>
      recommendations
        .map((recommendation) => ({
          ...movies.find((movie) => movie.id === recommendation.movieId),
          recommendationReason: recommendation.reason,
        }))
        .filter((movie) => movie.id),
    [movies, recommendations],
  );
};
