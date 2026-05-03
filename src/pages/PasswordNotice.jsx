import { useState } from "react";
import { KeyRound } from "lucide-react";
import { useAuth } from "../context/AuthContext.jsx";

export function PasswordPage({ notify }) {
  const { user, changePassword } = useAuth();
  const [form, setForm] = useState({ currentPassword: "", newPassword: "" });
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  function updateField(event) {
    setForm((current) => ({ ...current, [event.target.name]: event.target.value }));
  }

  async function submit(event) {
    event.preventDefault();
    setSubmitting(true);
    setError("");
    try {
      await changePassword(form.currentPassword, form.newPassword);
      setForm({ currentPassword: "", newPassword: "" });
      notify("Password changed.", "success");
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="page-stack">
      <header className="page-header">
        <div>
          <h1>Password</h1>
          <p>Update the password for {user?.email}.</p>
        </div>
      </header>

      <section className="panel narrow-panel">
        <div className="panel-header">
          <h2>
            <KeyRound size={18} aria-hidden="true" />
            Change Password
          </h2>
          {user?.mustChangePassword ? <span className="status danger">Temporary password</span> : null}
        </div>
        <form className="form-stack password-form" onSubmit={submit}>
          <label>
            Current password
            <input name="currentPassword" type="password" value={form.currentPassword} onChange={updateField} required />
          </label>
          <label>
            New password
            <input name="newPassword" type="password" value={form.newPassword} minLength={8} onChange={updateField} required />
          </label>
          {error ? <p className="form-error">{error}</p> : null}
          <button type="submit" className="primary-button" disabled={submitting}>
            Update password
          </button>
        </form>
      </section>
    </section>
  );
}
