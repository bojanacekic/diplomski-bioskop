import { useEffect, useState } from "react";

const initialForm = {
  cardholderName: "",
  cardNumber: "",
  expiryDate: "",
  cvv: "",
};

export default function PaymentModal({ isOpen, price, onClose, onSubmit, submitting }) {
  const [form, setForm] = useState(initialForm);

  useEffect(() => {
    if (isOpen) setForm(initialForm);
  }, [isOpen]);

  if (!isOpen) return null;

  const formatCardNumber = (value) =>
    value
      .replace(/\D/g, "")
      .slice(0, 16)
      .replace(/(\d{4})(?=\d)/g, "$1 ");

  const formatExpiryDate = (value) => {
    const digits = value.replace(/\D/g, "").slice(0, 4);
    return digits.length > 2 ? `${digits.slice(0, 2)}/${digits.slice(2)}` : digits;
  };

  const update = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({
      ...current,
      [name]:
        name === "cardNumber"
          ? formatCardNumber(value)
          : name === "expiryDate"
            ? formatExpiryDate(value)
            : name === "cvv"
              ? value.replace(/\D/g, "").slice(0, 4)
            : value,
    }));
  };

  const submit = (event) => {
    event.preventDefault();
    onSubmit(form);
  };

  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={onClose}>
      <form className="user-modal payment-modal" onSubmit={submit} onMouseDown={(event) => event.stopPropagation()}>
        <button className="modal-close" type="button" onClick={onClose} aria-label="Close payment form">
          ×
        </button>
        <p className="eyebrow">TEST PAYMENT</p>
        <h2>Pay for your ticket</h2>
        <p className="profile-help">No card details are saved. This is a test payment for {Number(price).toFixed(2)} RSD.</p>
        <label>
          Cardholder name
          <input name="cardholderName" value={form.cardholderName} onChange={update} required />
        </label>
        <label>
          Card number
          <input name="cardNumber" inputMode="numeric" autoComplete="cc-number" value={form.cardNumber} onChange={update} placeholder="4242 4242 4242 4242" maxLength="19" required />
        </label>
        <div className="form-row">
          <label>
            Expiry date
            <input name="expiryDate" inputMode="numeric" autoComplete="cc-exp" value={form.expiryDate} onChange={update} placeholder="MM/YY" maxLength="5" required />
          </label>
          <label>
            CVV
            <input name="cvv" inputMode="numeric" autoComplete="cc-csc" type="password" value={form.cvv} onChange={update} maxLength="4" required />
          </label>
        </div>
        <p className="payment-note">Use any valid test card. A card ending in 0000 simulates a declined payment.</p>
        <div className="form-actions">
          <button className="secondary-button" type="button" onClick={onClose} disabled={submitting}>Cancel</button>
          <button className="submit-button" type="submit" disabled={submitting}>{submitting ? "Processing..." : "Pay and issue ticket"}</button>
        </div>
      </form>
    </div>
  );
}
