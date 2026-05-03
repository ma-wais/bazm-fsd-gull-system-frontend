export function Toast({ message, type = "info", onClose }) {
  if (!message) return null;

  return (
    <div className={`toast toast-${type}`}>
      <span>{message}</span>
      <button type="button" className="icon-button" onClick={onClose} aria-label="Close message">
        x
      </button>
    </div>
  );
}
