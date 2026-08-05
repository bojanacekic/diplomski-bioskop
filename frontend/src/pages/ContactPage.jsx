export default function ContactPage() {
  return (
    <section className="info-page">
      <div className="info-hero">
        <h1>
          We are here
          <br />
          to help.
        </h1>
        <span>
          Questions about screenings, reservations or tickets? Contact our team
          or ask the Smart Cinema AI assistant.
        </span>
      </div>
      <div className="info-grid contact-grid">
        <article>
          <span>EMAIL</span>
          <h2>smartcinema2026@gmail.com</h2>
          <p>We usually reply within one business day.</p>
          <a href="mailto:support@smartcinema.rs">Send an email</a>
        </article>
        <article>
          <span>PHONE</span>
          <h2>+381 21 555 0123</h2>
          <p>Every day from 10:00 to 22:00.</p>
          <a href="tel:+381215550123">Call us</a>
        </article>
        <article>
          <span>VISIT US</span>
          <h2>Trg Dositeja Obradovića 6</h2>
          <p>Novi Sad 21000, Serbia</p>
          <a
            href="https://maps.google.com/?q=Trg+Dositeja+Obradovica+6+Novi+Sad+21000"
            target="_blank"
            rel="noreferrer"
          >
            Open map
          </a>
        </article>
      </div>
      <div className="info-highlight">
        <strong>Opening hours</strong>
        <p>Monday–Sunday · 10:00–23:30</p>
      </div>
    </section>
  );
}
