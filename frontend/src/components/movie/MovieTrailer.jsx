import { useState } from "react";

export default function MovieTrailer({ title, embedUrl }) {
  const [open, setOpen] = useState(false);
  if (!embedUrl) return null;
  return (
    <section className="trailer-section">
      <div className="trailer-heading">
        <div>
          <h2>Official trailer</h2>
          <p>Watch the trailer before choosing your screening.</p>
        </div>
        <button className="submit-button" onClick={() => setOpen((current) => !current)}>
          {open ? "Close trailer" : "Watch trailer"}
        </button>
      </div>
      {open && (
        <div className="trailer-player">
          <iframe
            src={embedUrl}
            title={`${title} official trailer`}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>
      )}
    </section>
  );
}
