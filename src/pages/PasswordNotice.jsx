import { useState } from "react";
import { KeyRound } from "lucide-react";
import { useAuth } from "../context/AuthContext.jsx";

export function PasswordNotice() {
  const { user, changePassword } = useAuth();
  const [form, setForm] = useState({ currentPassword: "", newPassword: "" });
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  if (!user?.mustChangePassword) return null;

  function updateField(event) {
    setForm((current) => ({ ...current, [event.target.name]: event.target.value }));
  }

  async function submit(event) {
    event.preventDefault();
    setSubmitting(true);
    setError("");
    setMessage("");
    try {
      await changePassword(form.currentPassword, form.newPassword);
      setMessage("Password changed.");
      setForm({ currentPassword: "", newPassword: "" });
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="notice-band">
      <div>
        <KeyRound size={20} aria-hidden="true" />
        <strong>Change your temporary password</strong>
      </div>
      <form className="inline-form" onSubmit={submit}>
        <input
          name="currentPassword"
          type="password"
          placeholder="Current password"
          value={form.currentPassword}
          onChange={updateField}
          required
        />
        <input
          name="newPassword"
          type="password"
          placeholder="New password"
          value={form.newPassword}
          minLength={8}
          onChange={updateField}
          required
        />
        <button type="submit" className="primary-button compact" disabled={submitting}>
          Update
        </button>
      </form>
      {error ? <span className="form-error">{error}</span> : null}
      {message ? <span className="form-success">{message}</span> : null}
    </section>
  );
}
