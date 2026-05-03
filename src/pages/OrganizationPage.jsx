import { useEffect, useMemo, useState } from "react";
import { Archive, CheckCircle2, Edit3, Plus, RefreshCw, Save, X } from "lucide-react";
import { apiRequest } from "../api/client.js";
import { EmptyState } from "../components/EmptyState.jsx";
import { Loader } from "../components/Loader.jsx";
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
  const [editingZoneId, setEditingZoneId] = useState("");
  const [editingUnitId, setEditingUnitId] = useState("");
  const [zoneEditForm, setZoneEditForm] = useState(initialZone);
  const [unitEditForm, setUnitEditForm] = useState(initialUnit);
  const [unitZoneFilter, setUnitZoneFilter] = useState("");
  const [zonePage, setZonePage] = useState(1);
  const [unitPage, setUnitPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const pageSize = 8;
  const filteredUnits = useMemo(() => {
    if (!unitZoneFilter) return units;
    return units.filter((unit) => (unit.zone?._id || unit.zone) === unitZoneFilter);
  }, [units, unitZoneFilter]);
  const zonePageCount = Math.max(1, Math.ceil(zones.length / pageSize));
  const unitPageCount = Math.max(1, Math.ceil(filteredUnits.length / pageSize));
  const visibleZones = zones.slice((zonePage - 1) * pageSize, zonePage * pageSize);
  const visibleUnits = filteredUnits.slice((unitPage - 1) * pageSize, unitPage * pageSize);

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

  function updateZoneEditField(event) {
    setZoneEditForm((current) => ({ ...current, [event.target.name]: event.target.value }));
  }

  function updateUnitEditField(event) {
    setUnitEditForm((current) => ({ ...current, [event.target.name]: event.target.value }));
  }

  function startZoneEdit(zone) {
    setEditingZoneId(zone._id);
    setZoneEditForm({ name: zone.name || "", code: zone.code || "", description: zone.description || "" });
  }

  function startUnitEdit(unit) {
    setEditingUnitId(unit._id);
    setUnitEditForm({
      name: unit.name || "",
      code: unit.code || "",
      zone: unit.zone?._id || unit.zone || "",
      area: unit.area || "",
      meetingDay: unit.meetingDay || ""
    });
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
      setZonePage(Math.max(1, Math.ceil((zones.length + 1) / pageSize)));
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
      setUnitPage(Math.max(1, Math.ceil((filteredUnits.length + 1) / pageSize)));
      setUnitForm((current) => ({ ...initialUnit, zone: current.zone }));
      notify("Unit created.", "success");
    } catch (err) {
      notify(err.message, "error");
    } finally {
      setSaving(false);
    }
  }

  async function setZoneStatus(zone, isActive) {
    try {
      const data = await apiRequest(`/organization/zones/${zone._id}`, {
        method: "PATCH",
        body: { isActive }
      });
      setZones((current) => current.map((item) => (item._id === zone._id ? data.zone : item)));
      notify(isActive ? "Zone activated." : "Zone archived.", "success");
    } catch (err) {
      notify(err.message, "error");
    }
  }

  async function saveZoneEdit(zoneId) {
    setSaving(true);
    try {
      const data = await apiRequest(`/organization/zones/${zoneId}`, {
        method: "PATCH",
        body: zoneEditForm
      });
      setZones((current) => current.map((item) => (item._id === zoneId ? data.zone : item)));
      setEditingZoneId("");
      notify("Zone updated.", "success");
    } catch (err) {
      notify(err.message, "error");
    } finally {
      setSaving(false);
    }
  }

  async function saveUnitEdit(unitId) {
    setSaving(true);
    try {
      const data = await apiRequest(`/organization/units/${unitId}`, {
        method: "PATCH",
        body: unitEditForm
      });
      setUnits((current) => current.map((item) => (item._id === unitId ? data.unit : item)));
      setEditingUnitId("");
      notify("Unit updated.", "success");
    } catch (err) {
      notify(err.message, "error");
    } finally {
      setSaving(false);
    }
  }

  async function setUnitStatus(unit, isActive) {
    try {
      const data = await apiRequest(`/organization/units/${unit._id}`, {
        method: "PATCH",
        body: { isActive }
      });
      setUnits((current) => current.map((item) => (item._id === unit._id ? data.unit : item)));
      notify(isActive ? "Unit activated." : "Unit archived.", "success");
    } catch (err) {
      notify(err.message, "error");
    }
  }

  function changeUnitZoneFilter(event) {
    setUnitZoneFilter(event.target.value);
    setUnitPage(1);
  }

  function Pagination({ page, pageCount, onPageChange }) {
    return (
      <div className="pagination">
        <button type="button" className="secondary-button compact" onClick={() => onPageChange(Math.max(1, page - 1))} disabled={page <= 1}>
          Previous
        </button>
        <span>
          Page {page} of {pageCount}
        </span>
        <button type="button" className="secondary-button compact" onClick={() => onPageChange(Math.min(pageCount, page + 1))} disabled={page >= pageCount}>
          Next
        </button>
      </div>
    );
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
          <h2>Zones</h2>
          <span>{zones.length} zones</span>
        </div>
        {loading ? (
          <Loader label="Loading zones..." />
        ) : zones.length ? (
          <>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Code</th>
                    <th>Name</th>
                    <th>Description</th>
                    <th>Status</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {visibleZones.map((zone) => (
                    <tr key={zone._id}>
                      <td>{editingZoneId === zone._id ? <input name="code" value={zoneEditForm.code} onChange={updateZoneEditField} required /> : zone.code}</td>
                      <td>{editingZoneId === zone._id ? <input name="name" value={zoneEditForm.name} onChange={updateZoneEditField} required /> : zone.name}</td>
                      <td>{editingZoneId === zone._id ? <input name="description" value={zoneEditForm.description} onChange={updateZoneEditField} /> : zone.description || <span className="muted-text">Not added</span>}</td>
                      <td>
                        <span className={zone.isActive ? "status active" : "status muted"}>{zone.isActive ? "Active" : "Inactive"}</span>
                      </td>
                      <td>
                        <div className="row-actions">
                          {canManageZones(user.role) && editingZoneId === zone._id ? (
                            <>
                              <button type="button" className="icon-button success-button" onClick={() => saveZoneEdit(zone._id)} aria-label={`Save ${zone.name}`} disabled={saving}>
                                <Save size={15} aria-hidden="true" />
                              </button>
                              <button type="button" className="icon-button" onClick={() => setEditingZoneId("")} aria-label="Cancel edit">
                                <X size={15} aria-hidden="true" />
                              </button>
                            </>
                          ) : canManageZones(user.role) ? (
                            <>
                              <button type="button" className="icon-button edit-button" onClick={() => startZoneEdit(zone)} aria-label={`Edit ${zone.name}`}>
                                <Edit3 size={15} aria-hidden="true" />
                              </button>
                              <button type="button" className={zone.isActive ? "icon-button archive-button" : "icon-button success-button"} onClick={() => setZoneStatus(zone, !zone.isActive)} aria-label={zone.isActive ? `Archive ${zone.name}` : `Activate ${zone.name}`}>
                                {zone.isActive ? <Archive size={15} aria-hidden="true" /> : <CheckCircle2 size={15} aria-hidden="true" />}
                              </button>
                            </>
                          ) : null}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Pagination page={zonePage} pageCount={zonePageCount} onPageChange={setZonePage} />
          </>
        ) : (
          <EmptyState title="No zones yet" text="Create the first zone to begin." />
        )}
      </section>

      <section className="panel">
        <div className="panel-header wrap">
          <h2>Units</h2>
          <div className="filter-row slim">
            <label>
              Zone
              <select value={unitZoneFilter} onChange={changeUnitZoneFilter}>
                <option value="">All zones</option>
                {zones.map((zone) => (
                  <option key={zone._id} value={zone._id}>
                    {zone.code} - {zone.name}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <span>{filteredUnits.length} units</span>
        </div>
        {loading ? (
          <Loader label="Loading units..." />
        ) : filteredUnits.length ? (
          <>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Code</th>
                    <th>Name</th>
                    <th>Zone</th>
                    <th>Area</th>
                    <th>Meeting</th>
                    <th>Status</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {visibleUnits.map((unit) => (
                    <tr key={unit._id}>
                      <td>{editingUnitId === unit._id ? <input name="code" value={unitEditForm.code} onChange={updateUnitEditField} required /> : unit.code}</td>
                      <td>{editingUnitId === unit._id ? <input name="name" value={unitEditForm.name} onChange={updateUnitEditField} required /> : unit.name}</td>
                      <td>
                        {editingUnitId === unit._id ? (
                          <select name="zone" value={unitEditForm.zone} onChange={updateUnitEditField} required>
                            {zones.map((zone) => (
                              <option key={zone._id} value={zone._id}>
                                {zone.code} - {zone.name}
                              </option>
                            ))}
                          </select>
                        ) : (
                          unit.zone?.name || "Zone"
                        )}
                      </td>
                      <td>{editingUnitId === unit._id ? <input name="area" value={unitEditForm.area} onChange={updateUnitEditField} /> : unit.area || <span className="muted-text">Not set</span>}</td>
                      <td>{editingUnitId === unit._id ? <input name="meetingDay" value={unitEditForm.meetingDay} onChange={updateUnitEditField} /> : unit.meetingDay || <span className="muted-text">Not set</span>}</td>
                      <td>
                        <span className={unit.isActive ? "status active" : "status muted"}>{unit.isActive ? "Active" : "Inactive"}</span>
                      </td>
                      <td>
                        <div className="row-actions">
                          {canManageUnits(user.role) && editingUnitId === unit._id ? (
                            <>
                              <button type="button" className="icon-button success-button" onClick={() => saveUnitEdit(unit._id)} aria-label={`Save ${unit.name}`} disabled={saving}>
                                <Save size={15} aria-hidden="true" />
                              </button>
                              <button type="button" className="icon-button" onClick={() => setEditingUnitId("")} aria-label="Cancel edit">
                                <X size={15} aria-hidden="true" />
                              </button>
                            </>
                          ) : canManageUnits(user.role) ? (
                            <>
                              <button type="button" className="icon-button edit-button" onClick={() => startUnitEdit(unit)} aria-label={`Edit ${unit.name}`}>
                                <Edit3 size={15} aria-hidden="true" />
                              </button>
                              <button type="button" className={unit.isActive ? "icon-button archive-button" : "icon-button success-button"} onClick={() => setUnitStatus(unit, !unit.isActive)} aria-label={unit.isActive ? `Archive ${unit.name}` : `Activate ${unit.name}`}>
                                {unit.isActive ? <Archive size={15} aria-hidden="true" /> : <CheckCircle2 size={15} aria-hidden="true" />}
                              </button>
                            </>
                          ) : null}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Pagination page={unitPage} pageCount={unitPageCount} onPageChange={setUnitPage} />
          </>
        ) : (
          <EmptyState title="No units found" text="Create a unit or change the zone filter." />
        )}
      </section>
    </section>
  );
}
