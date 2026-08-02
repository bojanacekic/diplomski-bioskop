import { useState } from "react";

const api = import.meta.env.VITE_API_GATEWAY_URL;

export default function TicketValidationPage({ accessToken, onBack }) {
  const [code, setCode] = useState("");
  const [result, setResult] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const validate = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    setResult(null);

    try {
      const response = await fetch(`${api}/api/tickets/validate-entry`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ code }),
      });
      const payload = await response.json().catch(() => ({}));
      setResult({
        valid: response.ok && payload.isValid,
        text: payload.message ?? "Ticket could not be validated.",
      });
      if (response.ok && payload.isValid) setCode("");
    } catch {
      setResult({ valid: false, text: "Ticket service is currently unavailable." });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="management-page ticket-validation-page">
      <div className="management-heading">
        <div>
          <h1>Validate tickets</h1>
        </div>
        <button className="header-link" onClick={onBack}>
          ← Back to movies
        </button>
      </div>
      <p className="validation-intro">
        Scan or enter the QR value from a Smart Cinema ticket at the entrance.
      </p>
      <form className="movie-form validation-form" onSubmit={validate}>
        <label>
          QR code or ticket number
          <input
            value={code}
            onChange={(event) => setCode(event.target.value)}
            placeholder="SMART-CINEMA|SC-..."
            required
          />
        </label>
        <button className="submit-button" type="submit" disabled={submitting}>
          {submitting ? "Validating..." : "Validate entry"}
        </button>
        {result && (
          <p className={`form-message ${result.valid ? "success" : "error"}`}>{result.text}</p>
        )}
      </form>
    </section>
  );
}
