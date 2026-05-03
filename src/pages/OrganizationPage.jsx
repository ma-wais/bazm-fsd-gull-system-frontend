import { useEffect, useMemo, useState } from "react";
import { Plus, RefreshCw } from "lucide-react";
import { apiRequest } from "../api/client.js";
import { EmptyState } from "../components/EmptyState.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import { canManageUnits, canManageZones } from "../utils/roles.js";

const initialZone = { name: "", code: "", description: "" };
const initialUnit = { name: "", code: "", zone: "", area: "", meetingDay: "" };

export function OrganizationPage({ notify }) {
  const { user } = useAuth();
  const [zones, setZones] = useState([]);
  const [units, setUnits] = useState([]);
  const [zoneForm, setZoneForm] = useState(initialZone);
  const [unitForm, setUnitForm] = useState(initialUnit);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const unitsByZone = useMemo(() => {
    return units.reduce((acc, unit) => {
      const zoneId = unit.zone?._id || unit.zone;
      acc[zoneId] = acc[zoneId] || [];
      acc[zoneId].push(unit);
      return acc;
    }, {});
  }, [units]);

  async function load() {
    setLoading(true);
    try {
      const [zoneData, unitData] = await Promise.all([
        apiRequest("/organization/zones"),
        apiRequest("/organization/units")
      ]);
      setZones(zoneData.zones || []);
      setUnits(unitData.units || []);
      setUnitForm((current) => ({ ...current, zone: current.zone || zoneData.zones?.[0]?._id || "" }));
    } catch (err) {
      notify(err.message, "error");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  function updateZoneField(event) {
    setZoneForm((current) => ({ ...current, [event.target.name]: event.target.value }));
  }

  function updateUnitField(event) {
    setUnitForm((current) => ({ ...current, [event.target.name]: event.target.value }));
  }

  async function createZone(event) {
    event.preventDefault();
    setSaving(true);
    try {
      const data = await apiRequest("/organization/zones", {
        method: "POST",
        body: zoneForm
      });
      setZones((current) => [...current, data.zone]);
      setZoneForm(initialZone);
      notify("Zone created.", "success");
    } catch (err) {
      notify(err.message, "error");
    } finally {
      setSaving(false);
    }
  }

  async function createUnit(event) {
    event.preventDefault();
    setSaving(true);
    try {
      const data = await apiRequest("/organization/units", {
        method: "POST",
        body: unitForm
      });
      setUnits((current) => [...current, data.unit]);
      setUnitForm((current) => ({ ...initialUnit, zone: current.zone }));
      notify("Unit created.", "success");
    } catch (err) {
      notify(err.message, "error");
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="page-stack">
      <header className="page-header">
        <div>
          <h1>Organization</h1>
          <p>Manage the city, zone, and unit structure used by accounts, members, and finances.</p>
        </div>
        <button type="button" className="secondary-button" onClick={load} disabled={loading}>
          <RefreshCw size={16} aria-hidden="true" />
          Refresh
        </button>
      </header>

      <div className="two-column">
        {canManageZones(user.role) ? (
          <section className="panel">
            <div className="panel-header">
              <h2>Add Zone</h2>
            </div>
            <form className="form-grid" onSubmit={createZone}>
              <label>
                Zone name
                <input name="name" value={zoneForm.name} onChange={updateZoneField} required />
              </label>
              <label>
                Code
                <input name="code" value={zoneForm.code} onChange={updateZoneField} placeholder="Z9" required />
              </label>
              <label className="span-2">
                Description
                <textarea name="description" value={zoneForm.description} onChange={updateZoneField} rows={3} />
              </label>
              <button type="submit" className="primary-button span-2" disabled={saving}>
                <Plus size={16} aria-hidden="true" />
                Create zone
              </button>
            </form>
          </section>
        ) : null}

        {canManageUnits(user.role) ? (
          <section className="panel">
            <div className="panel-header">
              <h2>Add Unit</h2>
            </div>
            <form className="form-grid" onSubmit={createUnit}>
              <label>
                Unit name
                <input name="name" value={unitForm.name} onChange={updateUnitField} required />
              </label>
              <label>
                Code
                <input name="code" value={unitForm.code} onChange={updateUnitField} placeholder="Z1-U2" required />
              </label>
              <label>
                Zone
                <select name="zone" value={unitForm.zone} onChange={updateUnitField} required>
                  <option value="">Select zone</option>
                  {zones.map((zone) => (
                    <option key={zone._id} value={zone._id}>
                      {zone.code} - {zone.name}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Meeting day
                <input name="meetingDay" value={unitForm.meetingDay} onChange={updateUnitField} />
              </label>
              <label className="span-2">
                Area
                <input name="area" value={unitForm.area} onChange={updateUnitField} />
              </label>
              <button type="submit" className="primary-button span-2" disabled={saving}>
                <Plus size={16} aria-hidden="true" />
                Create unit
              </button>
            </form>
          </section>
        ) : null}
      </div>

      <section className="panel">
        <div className="panel-header">
          <h2>Current Structure</h2>
          <span>{zones.length} zones | {units.length} units</span>
        </div>
        {zones.length ? (
          <div className="zone-grid">
            {zones.map((zone) => (
              <article className="zone-card" key={zone._id}>
                <div className="zone-card-head">
                  <div>
                    <strong>{zone.name}</strong>
                    <span>{zone.code}</span>
                  </div>
                  <span className={zone.isActive ? "status active" : "status muted"}>
                    {zone.isActive ? "Active" : "Inactive"}
                  </span>
                </div>
                <p>{zone.description || "No description added."}</p>
                <div className="unit-list compact-list">
                  {(unitsByZone[zone._id] || []).map((unit) => (
                    <div className="list-row" key={unit._id}>
                      <div>
                        <strong>{unit.name}</strong>
                        <span>{unit.area || "Area not set"}</span>
                      </div>
                      <small>{unit.code}</small>
                    </div>
                  ))}
                  {!unitsByZone[zone._id]?.length ? <span className="muted-text">No units yet.</span> : null}
                </div>
              </article>
            ))}
          </div>
        ) : (
          <EmptyState title="No structure yet" text="Create the first zone to begin." />
        )}
      </section>
    </section>
  );
}
