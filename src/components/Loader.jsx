export function Loader({ label = "Loading..." }) {
  return (
    <div className="loader-state" role="status" aria-live="polite">
      <span className="loader-spinner" aria-hidden="true" />
      <strong>{label}</strong>
    </div>
  );
}
