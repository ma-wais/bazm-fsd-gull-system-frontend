import { useEffect, useMemo, useState } from "react";
import { Plus, RefreshCw, Save } from "lucide-react";
import { apiRequest } from "../api/client.js";
import { EmptyState } from "../components/EmptyState.jsx";
import { Loader } from "../components/Loader.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import { roleLabel, roleLevel } from "../utils/roles.js";

const initialForm = {
  name: "",
  email: "",
  password: "",
  phone: "",
  role: "",
  zone: "",
  unit: ""
};

export function AccountsPage({ notify }) {
  const { user, creatableRoles, updateProfile } = useAuth();
  const [users, setUsers] = useState([]);
  const [zones, setZones] = useState([]);
  const [units, setUnits] = useState([]);
  const [form, setForm] = useState(initialForm);
  const [profileForm, setProfileForm] = useState({ name: "", email: "", phone: "" });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);

  const targetLevel = roleLevel(form.role);
  const visibleUnits = useMemo(() => {
    if (!form.zone) return units;
    return units.filter((unit) => (unit.zone?._id || unit.zone) === form.zone);
  }, [units, form.zone]);

  async function loadAll() {
    setLoading(true);
    try {
      const [userData, zoneData, unitData] = await Promise.all([
        apiRequest("/users"),
        apiRequest("/organization/zones"),
        apiRequest("/organization/units")
      ]);
      const roles = creatableRoles || [];
      setUsers(userData.users || []);
      setZones(zoneData.zones || []);
      setUnits(unitData.units || []);
      setForm((current) => ({
        ...current,
        role: current.role || roles[0] || "",
        zone: current.zone || zoneData.zones?.[0]?._id || "",
        unit: current.unit || unitData.units?.[0]?._id || ""
      }));
    } catch (err) {
      notify(err.message, "error");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAll();
  }, [creatableRoles.join("|")]);

  useEffect(() => {
    setProfileForm({
      name: user?.name || "",
      email: user?.email || "",
      phone: user?.phone || ""
    });
  }, [user?.id, user?.name, user?.email, user?.phone]);

  function updateField(event) {
    const { name, value } = event.target;
    setForm((current) => ({
      ...current,
      [name]: value,
      ...(name === "zone" ? { unit: "" } : {})
    }));
  }

  function updateProfileField(event) {
    setProfileForm((current) => ({ ...current, [event.target.name]: event.target.value }));
  }

  async function saveProfile(event) {
    event.preventDefault();
    setSavingProfile(true);
    try {
      await updateProfile(profileForm);
      setUsers((current) => current.map((item) => ((item._id || item.id) === user.id ? { ...item, ...profileForm } : item)));
      notify("Account info updated.", "success");
    } catch (err) {
      notify(err.message, "error");
    } finally {
      setSavingProfile(false);
    }
  }

  async function createAccount(event) {
    event.preventDefault();
    setSaving(true);
    try {
      const payload = {
        ...form,
        zone: targetLevel === "zone" ? form.zone : undefined,
        unit: targetLevel === "unit" ? form.unit : undefined
      };
      const data = await apiRequest("/users", {
        method: "POST",
        body: payload
      });
      setUsers((current) => [data.user, ...current]);
      setForm((current) => ({
        ...initialForm,
        role: current.role,
        zone: current.zone,
        unit: current.unit
      }));
      notify("Account created with a temporary password.", "success");
    } catch (err) {
      notify(err.message, "error");
    } finally {
      setSaving(false);
    }
  }

  async function setStatus(user, isActive) {
    try {
      const data = await apiRequest(`/users/${user._id || user.id}/status`, {
        method: "PATCH",
        body: { isActive }
      });
      setUsers((current) => current.map((item) => ((item._id || item.id) === (user._id || user.id) ? data.user : item)));
      notify(isActive ? "Account activated." : "Account deactivated.", "success");
    } catch (err) {
      notify(err.message, "error");
    }
  }

  return (
    <section className="page-stack">
      <header className="page-header">
        <div>
          <h1>Accounts</h1>
          <p>Create scoped logins for zone heads, unit heads, secretaries, finance managers, and other posts.</p>
        </div>
        <button type="button" className="secondary-button" onClick={loadAll} disabled={loading}>
          <RefreshCw size={16} aria-hidden="true" />
          Refresh
        </button>
      </header>

      <section className="panel">
        <div className="panel-header">
          <h2>My Account</h2>
          <span>{roleLabel(user?.role)}</span>
        </div>
        <form className="form-grid wide" onSubmit={saveProfile}>
          <label>
            Name
            <input name="name" value={profileForm.name} onChange={updateProfileField} required />
          </label>
          <label>
            Email
            <input name="email" type="email" value={profileForm.email} onChange={updateProfileField} required />
          </label>
          <label>
            Phone
            <input name="phone" value={profileForm.phone} onChange={updateProfileField} />
          </label>
          <label>
            Scope
            <input value={user?.unit?.name || user?.zone?.name || "City"} disabled />
          </label>
          <button type="submit" className="primary-button span-2" disabled={savingProfile}>
            <Save size={16} aria-hidden="true" />
            Save account info
          </button>
        </form>
      </section>

      {creatableRoles.length ? (
        <section className="panel">
          <div className="panel-header">
            <h2>Create Account</h2>
          </div>
          <form className="form-grid wide" onSubmit={createAccount}>
            <label>
              Name
              <input name="name" value={form.name} onChange={updateField} required />
            </label>
            <label>
              Email
              <input name="email" type="email" value={form.email} onChange={updateField} required />
            </label>
            <label>
              Temporary password
              <input name="password" type="text" value={form.password} onChange={updateField} minLength={8} required />
            </label>
            <label>
              Phone
              <input name="phone" value={form.phone} onChange={updateField} />
            </label>
            <label>
              Role
              <select name="role" value={form.role} onChange={updateField} required>
                {creatableRoles.map((role) => (
                  <option key={role} value={role}>
                    {roleLabel(role)}
                  </option>
                ))}
              </select>
            </label>
            {targetLevel === "zone" ? (
              <label>
                Zone
                <select name="zone" value={form.zone} onChange={updateField} required>
                  <option value="">Select zone</option>
                  {zones.map((zone) => (
                    <option key={zone._id} value={zone._id}>
                      {zone.code} - {zone.name}
                    </option>
                  ))}
                </select>
              </label>
            ) : null}
            {targetLevel === "unit" ? (
              <>
                <label>
                  Zone
                  <select name="zone" value={form.zone} onChange={updateField}>
                    <option value="">All visible zones</option>
                    {zones.map((zone) => (
                      <option key={zone._id} value={zone._id}>
                        {zone.code} - {zone.name}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  Unit
                  <select name="unit" value={form.unit} onChange={updateField} required>
                    <option value="">Select unit</option>
                    {visibleUnits.map((unit) => (
                      <option key={unit._id} value={unit._id}>
                        {unit.code} - {unit.name}
                      </option>
                    ))}
                  </select>
                </label>
              </>
            ) : null}
            <button type="submit" className="primary-button span-2" disabled={saving}>
              <Plus size={16} aria-hidden="true" />
              Create account
            </button>
          </form>
        </section>
      ) : (
        <EmptyState title="No account roles available" text="Your current role cannot create other accounts." />
      )}

      <section className="panel">
        <div className="panel-header">
          <h2>Visible Accounts</h2>
          <span>{users.length} accounts</span>
        </div>
        {loading ? (
          <Loader label="Loading accounts..." />
        ) : users.length ? (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Scope</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {users.map((account) => (
                  <tr key={account._id || account.id}>
                    <td>{account.name}</td>
                    <td>{account.email}</td>
                    <td>{roleLabel(account.role)}</td>
                    <td>{account.unit?.name || account.zone?.name || "City"}</td>
                    <td>
                      <span className={account.isActive ? "status active" : "status muted"}>
                        {account.isActive ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td>
                      <button type="button" className="secondary-button compact" onClick={() => setStatus(account, !account.isActive)}>
                        {account.isActive ? "Deactivate" : "Activate"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState title="No accounts visible" text="Create the first account for your scope." />
        )}
      </section>
    </section>
  );
}
