export default function ConfirmationDialog({
  isOpen,
  title = "Confirm action",
  message,
  confirmLabel = "Confirm",
  onConfirm,
  onClose,
}) {
  if (!isOpen) return null;

  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true">
      <div className="confirmation-dialog">
        <p className="eyebrow">CONFIRM ACTION</p>
        <h2>{title}</h2>
        <p>{message}</p>
        <div className="form-actions">
          <button className="danger-button" onClick={onConfirm}>
            {confirmLabel}
          </button>
          <button className="secondary-button" onClick={onClose}>
            Keep it
          </button>
        </div>
      </div>
    </div>
  );
}
