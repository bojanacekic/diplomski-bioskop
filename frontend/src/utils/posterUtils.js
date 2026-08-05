import odysseyPoster from "../assets/odyssey-vertical.jpg";
import invitePoster from "../assets/invite-vertical.jpg";
import toyStoryPoster from "../assets/toy-story-vertical.jpg";
import spiderManPoster from "../assets/spider-man-vertical.jpg";
import endOfOakStreetPoster from "../assets/end-of-oak-street-vertical.jpg";
import pawPatrolDinoPoster from "../assets/paw-patrol-dino-vertical.jpg";
import { apiUrl } from "../services/apiClient";

export const posterUrlFor = (movie, vertical = false) =>
  `${apiUrl}/api/movies/${movie.id}/poster${vertical ? "?vertical=true" : ""}`;

export const verticalPosterFor = (title = "") => {
  const normalized = title.toLowerCase();
  if (normalized.includes("odyssey") || normalized.includes("odiseja"))
    return odysseyPoster;
  if (normalized.includes("invite") || normalized.includes("poziv"))
    return invitePoster;
  if (normalized.includes("toy story") || normalized.includes("prica"))
    return toyStoryPoster;
  if (normalized.includes("spider") || normalized.includes("spajder"))
    return spiderManPoster;
  if (normalized.includes("end of oak") || normalized.includes("oak street"))
    return endOfOakStreetPoster;
  if (normalized.includes("paw patrol") || normalized.includes("dino movie"))
    return pawPatrolDinoPoster;
  return null;
};
