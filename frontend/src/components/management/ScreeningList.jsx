import { screeningStatusLabel } from "../../models/screeningStatus";

const dateTime = (value) =>
  new Intl.DateTimeFormat("en-GB", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));

export default function ScreeningList({
  screenings,
  movies,
  halls,
  search,
  onSearch,
  onEdit,
}) {
  const name = (items, id, field) =>
    items.find((item) => item.id === id)?.[field] ?? "Unknown";
  const visible = screenings
    .filter((screening) =>
      `${name(movies, screening.movieId, "title")} ${name(halls, screening.hallId, "name")}`
        .toLowerCase()
        .includes(search.toLowerCase()),
    )
    .sort(
      (left, right) => new Date(right.startsAtUtc) - new Date(left.startsAtUtc),
    );
  return (
    <div>
      <label className="search">
        <span>⌕</span>
        <input
          value={search}
          onChange={(event) => onSearch(event.target.value)}
          placeholder="Search movie or hall"
        />
      </label>
      <div className="management-list user-list">
        {visible.map((screening) => (
          <article
            className="manage-card clickable-card"
            key={screening.id}
            onClick={() => onEdit(screening)}
          >
            <div>
              <p className="eyebrow">
                {screeningStatusLabel(screening.status)}
              </p>
              <h2>{name(movies, screening.movieId, "title")}</h2>
              <p>
                {name(halls, screening.hallId, "name")} ·{" "}
                {dateTime(screening.startsAtUtc)} · {screening.baseTicketPrice}{" "}
                RSD
              </p>
            </div>
          </article>
        ))}
        {visible.length === 0 && (
          <p className="state-message">No screenings found.</p>
        )}
      </div>
    </div>
  );
}
