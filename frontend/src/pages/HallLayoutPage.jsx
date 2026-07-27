 export default function HallLayoutPage({ hall, onBack }) {
  if (!hall) return null;
  const seats = Array.from(
    { length: hall.rows * hall.seatsPerRow },
    (_, index) => ({
      row: Math.floor(index / hall.seatsPerRow) + 1,
      seat: (index % hall.seatsPerRow) + 1,
    }),
  );
  return (
    <section className="management-page hall-layout-page">
      <div className="management-heading">
        <div>
          <p className="eyebrow">HALL LAYOUT</p>
          <h1>{hall.name}.</h1>
          <p>
            {["Standard", "Premium", "IMAX", "3D"][hall.type]} hall ·{" "}
            {hall.capacity} seats
          </p>
        </div>
        <button className="header-link" onClick={onBack}>
          ← Back to halls
        </button>
      </div>
      <div className="screen">SCREEN</div>
      <div className="seat-legend">
        <span>
          <i /> Available seat
        </span>
      </div>
      <div
        className="seat-layout"
        style={{ gridTemplateColumns: `repeat(${hall.seatsPerRow}, 26px)` }}
      >
        {seats.map(({ row, seat }) => (
          <span
            className="seat"
            key={`${row}-${seat}`}
            title={`Row ${row}, seat ${seat}`}
          >
            {row}-{seat}
          </span>
        ))}
      </div>
    </section>
  );
}
