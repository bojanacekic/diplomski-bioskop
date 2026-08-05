import { useEffect, useMemo, useState } from "react";
import odysseyPoster from "../assets/odyssey-vertical.jpg";
import invitePoster from "../assets/invite-vertical.jpg";
import toyStoryPoster from "../assets/toy-story-vertical.jpg";
import spiderManPoster from "../assets/spider-man-vertical.jpg";
import endOfOakStreetPoster from "../assets/end-of-oak-street-vertical.jpg";
import pawPatrolDinoPoster from "../assets/paw-patrol-dino-vertical.jpg";
import { movieService } from "../services/movieService";
import { hallService } from "../services/hallService";
import { screeningService } from "../services/screeningService";
import { ticketService } from "../services/ticketService";
import { reservationService } from "../services/reservationService";
import { ratingService } from "../services/ratingService";
import { toCreateReservationRequestDto } from "../dtos/reservationRequestDtos";
import { toRatingRequestDto } from "../dtos/ratingRequestDtos";
import { ScreeningStatus } from "../models/screeningStatus";
import { TicketStatus } from "../models/ticketStatus";
import MovieHero from "../components/movie/MovieHero";
import MovieTrailer from "../components/movie/MovieTrailer";
import SeatReservationSection from "../components/movie/SeatReservationSection";

const api = import.meta.env.VITE_API_GATEWAY_URL;
const posterUrlFor = (movie, vertical = false) =>
  `${api}/api/movies/${movie.id}/poster${vertical ? "?vertical=true" : ""}`;

const youtubeEmbedUrl = (value) => {
  if (!value) return null;
  try {
    const url = new URL(value);
    const host = url.hostname.replace(/^www\./, "");
    let videoId = null;
    if (host === "youtu.be")
      videoId = url.pathname.split("/").filter(Boolean)[0];
    if (host === "youtube.com" || host === "youtube-nocookie.com") {
      videoId =
        url.searchParams.get("v") ??
        (url.pathname.startsWith("/embed/") ||
        url.pathname.startsWith("/shorts/")
          ? url.pathname.split("/")[2]
          : null);
    }
    return videoId
      ? `https://www.youtube-nocookie.com/embed/${encodeURIComponent(videoId)}?autoplay=1&rel=0`
      : null;
  } catch {
    return null;
  }
};

const verticalPosters = [
  { terms: ["odyssey", "odiseja"], source: odysseyPoster },
  { terms: ["invite", "poziv"], source: invitePoster },
  { terms: ["toy story", "prica", "priÄa"], source: toyStoryPoster },
  { terms: ["spider", "spajder"], source: spiderManPoster },
  { terms: ["end of oak", "oak street"], source: endOfOakStreetPoster },
  { terms: ["paw patrol", "dino movie"], source: pawPatrolDinoPoster },
];

const verticalPosterFor = (title) =>
  verticalPosters.find(({ terms }) =>
    terms.some((term) => title.toLowerCase().includes(term)),
  )?.source;

const posterPositionFor = (title) => {
  const normalizedTitle = title.toLowerCase();
  if (
    normalizedTitle.includes("toy story") ||
    normalizedTitle.includes("prica") ||
    normalizedTitle.includes("priÄa")
  )
    return "center top";
  if (normalizedTitle.includes("spider") || normalizedTitle.includes("spajder"))
    return "center 85%";
  if (
    normalizedTitle.includes("odyssey") ||
    normalizedTitle.includes("odiseja")
  )
    return "center 83%";
  if (normalizedTitle.includes("invite") || normalizedTitle.includes("poziv"))
    return "center 80%";
  return "center bottom";
};

export default function MovieDetailsPage({
  movie,
  token,
  onBack,
  onSignIn,
  onReservationCreated,
}) {
  const [fullMovie, setFullMovie] = useState(movie);
  const [screenings, setScreenings] = useState([]);
  const [halls, setHalls] = useState([]);
  const [selectedScreeningId, setSelectedScreeningId] = useState("");
  const [reservedSeats, setReservedSeats] = useState([]);
  const [selectedSeats, setSelectedSeats] = useState([]);
  const [message, setMessage] = useState(null);
  const [rating, setRating] = useState(null);
  const [ratingAverage, setRatingAverage] = useState({
    averageRating: movie?.averageRating ?? 0,
    ratingCount: movie?.ratingCount ?? 0,
  });
  const [ratingState, setRatingState] = useState("hidden");

  useEffect(() => {
    if (!movie?.id) return;
    const controller = new AbortController();
    setFullMovie(movie);
    setRatingAverage({
      averageRating: movie.averageRating ?? 0,
      ratingCount: movie.ratingCount ?? 0,
    });

    movieService
      .getById(movie.id, controller.signal)
      .then((response) => (response.ok ? response.json() : Promise.reject()))
      .then(setFullMovie)
      .catch((error) => {
        if (error?.name !== "AbortError") setFullMovie(movie);
      });

    return () => controller.abort();
  }, [movie?.id]);

  useEffect(() => {
    if (!token || !movie) return setRatingState("hidden");
    Promise.all([
      ratingService.getMine(token),
      ticketService.getMine(token),
      screeningService.getAll(),
    ]).then(async ([ratingsResponse, ticketsResponse, screeningsResponse]) => {
      const ratings = ratingsResponse.ok ? await ratingsResponse.json() : [];
      const tickets = ticketsResponse.ok ? await ticketsResponse.json() : [];
      const allScreenings = screeningsResponse.ok
        ? await screeningsResponse.json()
        : [];
      setRating(ratings.find((item) => item.movieId === movie.id) ?? null);
      const matchingTickets = tickets.filter((ticket) => {
        const screening = allScreenings.find(
          (item) => item.id === ticket.screeningId,
        );
        return (
          screening?.movieId === movie.id &&
          ticket.status !== TicketStatus.Cancelled
        );
      });
      setRatingState(
        matchingTickets.some(
          (ticket) =>
            ticket.status === TicketStatus.Used ||
            new Date(
              allScreenings.find((item) => item.id === ticket.screeningId)
                ?.startsAtUtc,
            ) <= new Date(),
        )
          ? "allowed"
          : matchingTickets.length
            ? "future"
            : "unavailable",
      );
    });
  }, [movie, token]);

  const rateMovie = async (score) => {
    if (!token) return onSignIn();
    const response = await ratingService.rate(
      toRatingRequestDto(movie.id, score),
      token,
    );
    if (response.ok) {
      setRating(await response.json());
      const averagesResponse = await ratingService.getAverages();
      if (averagesResponse.ok) {
        const averages = await averagesResponse.json();
        const current = averages.find((item) => item.movieId === movie.id);
        setRatingAverage(current ?? { averageRating: 0, ratingCount: 0 });
      }
    }
  };

  const loadReservedSeats = async (screeningId) => {
    if (!screeningId) return setReservedSeats([]);
    const response = await reservationService.getReservedSeats(
      screeningId,
      token,
    );
    if (response.ok) setReservedSeats(await response.json());
  };

  useEffect(() => {
    if (!movie) return;
    Promise.all([screeningService.getAll(), hallService.getAll()])
      .then(async ([screeningsResponse, hallsResponse]) => {
        const loadedScreenings = screeningsResponse.ok
          ? await screeningsResponse.json()
          : [];
        const loadedHalls = hallsResponse.ok ? await hallsResponse.json() : [];
        const matchingScreenings = loadedScreenings.filter(
          (screening) =>
            screening.movieId === movie.id &&
            screening.status < ScreeningStatus.Completed &&
            new Date(screening.startsAtUtc) > new Date(),
        );
        setScreenings(matchingScreenings);
        setHalls(loadedHalls);
        setSelectedScreeningId(
          matchingScreenings.find(
            (screening) =>
              new Date(screening.startsAtUtc) >
              new Date(Date.now() + 30 * 60 * 1000),
          )?.id ?? "",
        );
      })
      .catch(() =>
        setMessage({
          type: "error",
          text: "Screenings are currently unavailable.",
        }),
      );
  }, [movie?.id]);

  useEffect(() => {
    setSelectedSeats([]);
    loadReservedSeats(selectedScreeningId);
  }, [selectedScreeningId]);

  const selectedScreening = screenings.find(
    (screening) => screening.id === selectedScreeningId,
  );
  const selectedHall = halls.find(
    (hall) => hall.id === selectedScreening?.hallId,
  );
  const seats = useMemo(
    () =>
      selectedHall
        ? Array.from(
            { length: selectedHall.rows * selectedHall.seatsPerRow },
            (_, index) => {
              const row = Math.floor(index / selectedHall.seatsPerRow) + 1;
              const seat = (index % selectedHall.seatsPerRow) + 1;
              return `${row}-${seat}`;
            },
          )
        : [],
    [selectedHall],
  );

  const reserve = async () => {
    if (!token) {
      onSignIn();
      return;
    }
    if (!selectedScreeningId || selectedSeats.length === 0) {
      setMessage({
        type: "error",
        text: "Select a screening and at least one seat.",
      });
      return;
    }
    const response = await reservationService.create(
      toCreateReservationRequestDto(selectedScreeningId, selectedSeats),
      token,
    );
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
      setMessage({
        type: "error",
        text: payload.message ?? "Reservation could not be created.",
      });
      return;
    }
    setMessage({
      type: "success",
      text: `${selectedSeats.length} seat${selectedSeats.length === 1 ? "" : "s"} reserved successfully.`,
    });
    setSelectedSeats([]);
    onReservationCreated?.();
  };

  if (!movie) return null;
  const verticalPoster =
    fullMovie?.verticalPosterBase64 ??
    verticalPosterFor(movie.title) ??
    fullMovie?.posterBase64 ??
    posterUrlFor(movie, true);
  const posterPosition = posterPositionFor(movie.title);
  const trailerEmbedUrl = youtubeEmbedUrl(
    fullMovie?.trailerUrl ?? movie.trailerUrl,
  );

  return (
    <section className="movie-details-page">
      <button className="back-button details-back" onClick={onBack}>
        ← Back to movies
      </button>
      <MovieHero
        movie={movie}
        poster={verticalPoster}
        posterPosition={posterPosition}
        ratingAverage={ratingAverage}
        rating={rating}
        ratingState={ratingState}
        token={token}
        onRate={rateMovie}
      />
      <MovieTrailer
        key={movie.id}
        title={movie.title}
        embedUrl={trailerEmbedUrl}
      />
      <SeatReservationSection
        screenings={screenings}
        halls={halls}
        selectedScreeningId={selectedScreeningId}
        onSelectScreening={setSelectedScreeningId}
        selectedHall={selectedHall}
        seats={seats}
        reservedSeats={reservedSeats}
        selectedSeats={selectedSeats}
        setSelectedSeats={setSelectedSeats}
        token={token}
        message={message}
        onReserve={reserve}
      />
    </section>
  );
}
