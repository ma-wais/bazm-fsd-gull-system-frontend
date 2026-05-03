import { useState } from "react";
import { ShieldCheck } from "lucide-react";
import { useAuth } from "../context/AuthContext.jsx";

export function LoginPage() {
  const { login, setupInitialAccount } = useAuth();
  const [mode, setMode] = useState("login");
  const [form, setForm] = useState({
    name: "City President",
    email: "president@bazm.test",
    password: "ChangeMe123!"
  });
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  function updateField(event) {
    setForm((current) => ({ ...current, [event.target.name]: event.target.value }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setSubmitting(true);
    setError("");
    try {
      if (mode === "login") {
        await login(form.email, form.password);
      } else {
        await setupInitialAccount(form);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="login-page">
      <section className="login-panel">
        <div className="login-brand">
          <ShieldCheck size={34} aria-hidden="true" />
          <div>
            <h1>Bazm Faisalabad</h1>
            <p>Organization, members, Shaheen appointments, and finance records.</p>
          </div>
        </div>

        <div className="segmented-control" role="tablist" aria-label="Login mode">
          <button type="button" className={mode === "login" ? "active" : ""} onClick={() => setMode("login")}>
            Login
          </button>
          <button type="button" className={mode === "setup" ? "active" : ""} onClick={() => setMode("setup")}>
            Initial setup
          </button>
        </div>

        <form className="form-stack" onSubmit={handleSubmit}>
          {mode === "setup" ? (
            <label>
              Name
              <input name="name" value={form.name} onChange={updateField} autoComplete="name" required />
            </label>
          ) : null}

          <label>
            Email
            <input name="email" type="email" value={form.email} onChange={updateField} autoComplete="email" required />
          </label>

          <label>
            Password
            <input
              name="password"
              type="password"
              value={form.password}
              onChange={updateField}
              autoComplete={mode === "login" ? "current-password" : "new-password"}
              minLength={8}
              required
            />
          </label>

          {error ? <p className="form-error">{error}</p> : null}

          <button type="submit" className="primary-button" disabled={submitting}>
            {submitting ? "Working..." : mode === "login" ? "Login" : "Create city president"}
          </button>
        </form>
      </section>
    </main>
  );
}
