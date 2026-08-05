import { hallService } from "./hallService";
import { movieService } from "./movieService";
import { screeningService } from "./screeningService";
const cacheLifetimeMs = 30_000;

let cachedData = null;
let cachedAt = 0;
let pendingRequest = null;

const getAll = async () => {
  if (cachedData && Date.now() - cachedAt < cacheLifetimeMs) return cachedData;
  if (pendingRequest) return pendingRequest;

  pendingRequest = Promise.all([
    screeningService.getAll(),
    movieService.getResponse("?includeImages=false"),
    hallService.getAll(),
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

export const cinemaReferenceService = { getAll };
