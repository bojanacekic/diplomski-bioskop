export default function AboutPage() {
  return (
    <section className="info-page">
      <div className="info-hero">
        <h1>
          More than a movie.
          <br />A complete cinema experience.
        </h1>
        <span>
          Smart Cinema combines great films, comfortable halls and simple
          digital booking in one modern experience.
        </span>
      </div>
      <div className="info-grid about-grid">
        <article>
          <h2>Our story</h2>
          <p>
            Smart Cinema was created to make discovering films and booking
            tickets fast, clear and enjoyable for every guest.
          </p>
        </article>
        <article>
          <h2>Our mission</h2>
          <p>
            We bring audiences closer to the stories they love through quality
            screenings, carefully designed halls and reliable service.
          </p>
        </article>
        <article>
          <h2>Smart experience</h2>
          <p>
            Browse current and upcoming films, choose your seats, reserve or
            purchase tickets and access every ticket with its unique QR code.
          </p>
        </article>
      </div>
      <div className="info-highlight">
        <strong>Smart Cinema</strong>
        <p>Your next great story starts here.</p>
      </div>
    </section>
  );
}
