import { useEffect, useMemo, useState } from "react";

const api = import.meta.env.VITE_API_GATEWAY_URL;

const formatDateTime = (value) =>
  new Intl.DateTimeFormat("sr-RS", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));

export default function MovieDetailsPage({
  movie,
  token,
  onBack,
  onSignIn,
}) {
  const [screenings, setScreenings] = useState([]);
  const [halls, setHalls] = useState([]);
  const [selectedScreeningId, setSelectedScreeningId] = useState("");
  const [reservedSeats, setReservedSeats] = useState([]);
  const [selectedSeats, setSelectedSeats] = useState([]);
  const [message, setMessage] = useState(null);

  const loadReservedSeats = async (screeningId) => {
    if (!screeningId) return setReservedSeats([]);
    const response = await fetch(`${api}/api/reservations/screenings/${screeningId}/seats`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    if (response.ok) setReservedSeats(await response.json());
  };

  useEffect(() => {
    if (!movie) return;
    Promise.all([fetch(`${api}/api/screenings`), fetch(`${api}/api/halls`)])
      .then(async ([screeningsResponse, hallsResponse]) => {
        const loadedScreenings = screeningsResponse.ok
          ? await screeningsResponse.json()
          : [];
        const loadedHalls = hallsResponse.ok ? await hallsResponse.json() : [];
        const available = loadedScreenings.filter(
          (screening) => screening.movieId === movie.id && screening.status < 2,
        );
        setScreenings(available);
        setHalls(loadedHalls);
        setSelectedScreeningId(available[0]?.id ?? "");
      })
      .catch(() => setMessage({ type: "error", text: "Screenings are currently unavailable." }));
  }, [movie?.id]);

  useEffect(() => {
    setSelectedSeats([]);
    loadReservedSeats(selectedScreeningId);
  }, [selectedScreeningId]);

  const selectedScreening = screenings.find(
    (screening) => screening.id === selectedScreeningId,
  );
  const selectedHall = halls.find((hall) => hall.id === selectedScreening?.hallId);
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
      setMessage({ type: "error", text: "Select a screening and at least one seat." });
      return;
    }
    const response = await fetch(`${api}/api/reservations`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ screeningId: selectedScreeningId, seatLabels: selectedSeats }),
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
      setMessage({ type: "error", text: payload.message ?? "Reservation could not be created." });
      return;
    }
    setMessage({
      type: "success",
      text: `${selectedSeats.length} seat${selectedSeats.length === 1 ? "" : "s"} reserved successfully.`,
    });
    setSelectedSeats([]);
    loadReservedSeats(selectedScreeningId);
  };

  if (!movie) return null;

  return (
    <section className="movie-details-page">
      <button className="back-button details-back" onClick={onBack}>
        ← Back to movies
      </button>
      <div className="movie-details-hero">
        {movie.posterBase64 && <img src={movie.posterBase64} alt={`${movie.title} poster`} />}
        <div>
          <p className="eyebrow">SMART CINEMA</p>
          <h1>{movie.title}</h1>
          <p className="movie-detail-meta">
            {movie.genre} · {movie.durationMinutes} min · {movie.ageRating}
          </p>
          <p>{movie.description}</p>
          <p className="movie-detail-premiere">
            Premiere: {new Intl.DateTimeFormat("sr-RS", { dateStyle: "long" }).format(new Date(movie.premiereDate))}
          </p>
        </div>
      </div>

      <section className="reservation-section">
        <div>
          <p className="eyebrow">RESERVE YOUR SEAT</p>
          <h2>Available screenings</h2>
        </div>
        {screenings.length === 0 ? (
          <p className="state-message">There are no available screenings for this movie yet.</p>
        ) : (
          <div className="screening-choice-list">
            {screenings.map((screening) => (
              <button
                className={screening.id === selectedScreeningId ? "screening-choice active" : "screening-choice"}
                key={screening.id}
                onClick={() => setSelectedScreeningId(screening.id)}
              >
                <strong>{formatDateTime(screening.startsAtUtc)}</strong>
                <span>{halls.find((hall) => hall.id === screening.hallId)?.name ?? "Hall"}</span>
                <span>{screening.baseTicketPrice} RSD</span>
              </button>
            ))}
          </div>
        )}
        {selectedHall && (
          <>
            <div className="screen">SCREEN</div>
            <div className="seat-legend reservation-legend">
              <span><i /> Available</span>
              <span><i className="selected" /> Selected</span>
              <span><i className="reserved" /> Reserved</span>
              {token && <span><i className="mine" /> My reservation</span>}
            </div>
            <div className="seat-layout reservation-seat-layout" style={{ gridTemplateColumns: `repeat(${selectedHall.seatsPerRow}, 34px)` }}>
              {seats.map((seat) => {
                const reservation = reservedSeats.find((item) => item.seatLabel === seat);
                const isReserved = Boolean(reservation);
                const isMine = reservation?.isMine;
                const isSelected = selectedSeats.includes(seat);
                return (
                  <button
                    className={`seat ${isReserved ? "reserved" : ""} ${isMine ? "mine" : ""} ${isSelected ? "selected" : ""} ${!token ? "guest" : ""}`}
                    disabled={isReserved || !token}
                    key={seat}
                    onClick={() =>
                      setSelectedSeats((currentSeats) =>
                        currentSeats.includes(seat)
                          ? currentSeats.filter((currentSeat) => currentSeat !== seat)
                          : [...currentSeats, seat],
                      )
                    }
                    title={token ? `Seat ${seat}` : "Sign in to select a seat"}
                  >
                    {seat}
                  </button>
                );
              })}
            </div>
            {message && <p className={`form-message ${message.type}`}>{message.text}</p>}
            <button className="submit-button reserve-button" onClick={reserve}>
              {token
                ? `Reserve ${selectedSeats.length || "selected"} seat${selectedSeats.length === 1 ? "" : "s"}`
                : "Sign in to reserve"}
            </button>
          </>
        )}
      </section>
    </section>
  );
}
