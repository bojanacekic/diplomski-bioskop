const api = import.meta.env.VITE_API_GATEWAY_URL;
const cacheLifetimeMs = 30_000;

let cachedData = null;
let cachedAt = 0;
let pendingRequest = null;

export const getCinemaReferenceData = async () => {
  if (cachedData && Date.now() - cachedAt < cacheLifetimeMs) return cachedData;
  if (pendingRequest) return pendingRequest;

  pendingRequest = Promise.all([
    fetch(`${api}/api/screenings`),
    fetch(`${api}/api/movies?includeImages=false`),
    fetch(`${api}/api/halls`),
  ])
    .then(async ([screeningsResponse, moviesResponse, hallsResponse]) => ({
      screenings: screeningsResponse.ok ? await screeningsResponse.json() : [],
      movies: moviesResponse.ok ? await moviesResponse.json() : [],
      halls: hallsResponse.ok ? await hallsResponse.json() : [],
    }))
    .then((data) => {
      cachedData = data;
      cachedAt = Date.now();
      return data;
    })
    .finally(() => {
      pendingRequest = null;
    });

  return pendingRequest;
};
