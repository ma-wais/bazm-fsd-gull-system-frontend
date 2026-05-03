import { useEffect, useMemo, useState } from "react";
import { Download, Plus, RefreshCw, Search, ShieldCheck, Trash2 } from "lucide-react";
import { apiRequest, downloadCsv } from "../api/client.js";
import { EmptyState } from "../components/EmptyState.jsx";

const initialMember = {
  fullName: "",
  fatherName: "",
  address: "",
  className: "",
  institution: "",
  phone: "",
  guardianPhone: "",
  cnicOrBForm: "",
  unit: "",
  notes: ""
};

export function MembersPage({ notify }) {
  const [zones, setZones] = useState([]);
  const [units, setUnits] = useState([]);
  const [members, setMembers] = useState([]);
  const [filters, setFilters] = useState({ search: "", zone: "", unit: "", isShaheen: "" });
  const [form, setForm] = useState(initialMember);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const visibleUnits = useMemo(() => {
    if (!filters.zone) return units;
    return units.filter((unit) => (unit.zone?._id || unit.zone) === filters.zone);
  }, [units, filters.zone]);

  async function loadLookups() {
    const [zoneData, unitData] = await Promise.all([
      apiRequest("/organization/zones"),
      apiRequest("/organization/units")
    ]);
    setZones(zoneData.zones || []);
    setUnits(unitData.units || []);
    setForm((current) => ({ ...current, unit: current.unit || unitData.units?.[0]?._id || "" }));
  }

  async function loadMembers() {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value) params.set(key, value);
    });
    const data = await apiRequest(`/members?${params.toString()}`);
    setMembers(data.members || []);
  }

  async function loadAll() {
    setLoading(true);
    try {
      await loadLookups();
      await loadMembers();
    } catch (err) {
      notify(err.message, "error");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAll();
  }, []);

  useEffect(() => {
    loadMembers().catch((err) => notify(err.message, "error"));
  }, [filters.zone, filters.unit, filters.isShaheen]);

  function updateFilter(event) {
    const { name, value } = event.target;
    setFilters((current) => ({
      ...current,
      [name]: value,
      ...(name === "zone" ? { unit: "" } : {})
    }));
  }

  function updateForm(event) {
    setForm((current) => ({ ...current, [event.target.name]: event.target.value }));
  }

  async function search(event) {
    event.preventDefault();
    try {
      await loadMembers();
    } catch (err) {
      notify(err.message, "error");
    }
  }

  async function createMember(event) {
    event.preventDefault();
    setSaving(true);
    try {
      const data = await apiRequest("/members", {
        method: "POST",
        body: form
      });
      setMembers((current) => [data.member, ...current]);
      setForm((current) => ({ ...initialMember, unit: current.unit }));
      notify("Member saved.", "success");
    } catch (err) {
      notify(err.message, "error");
    } finally {
      setSaving(false);
    }
  }

  async function toggleShaheen(member) {
    try {
      const data = await apiRequest(`/members/${member._id}/shaheen`, {
        method: "PATCH",
        body: { isShaheen: !member.isShaheen }
      });
      setMembers((current) => current.map((item) => (item._id === member._id ? data.member : item)));
      notify(data.member.isShaheen ? "Shaheen appointed." : "Shaheen status removed.", "success");
    } catch (err) {
      notify(err.message, "error");
    }
  }

  async function deleteMember(member) {
    const confirmed = window.confirm(`Delete ${member.fullName}? This cannot be undone.`);
    if (!confirmed) return;

    try {
      await apiRequest(`/members/${member._id}`, { method: "DELETE" });
      setMembers((current) => current.filter((item) => item._id !== member._id));
      notify("Member deleted.", "success");
    } catch (err) {
      notify(err.message, "error");
    }
  }

  async function exportCsv() {
    try {
      await downloadCsv("/members/export.csv", "members.csv");
    } catch (err) {
      notify(err.message, "error");
    }
  }

  return (
    <section className="page-stack">
      <header className="page-header">
        <div>
          <h1>Members</h1>
          <p>Save student records by unit and appoint any member as a Shaheen.</p>
        </div>
        <div className="button-row">
          <button type="button" className="secondary-button" onClick={exportCsv}>
            <Download size={16} aria-hidden="true" />
            CSV
          </button>
          <button type="button" className="secondary-button" onClick={loadAll} disabled={loading}>
            <RefreshCw size={16} aria-hidden="true" />
            Refresh
          </button>
        </div>
      </header>

      <section className="panel">
        <div className="panel-header">
          <h2>Add Member</h2>
        </div>
        <form className="form-grid wide" onSubmit={createMember}>
          <label>
            Full name
            <input name="fullName" value={form.fullName} onChange={updateForm} required />
          </label>
          <label>
            Father name
            <input name="fatherName" value={form.fatherName} onChange={updateForm} />
          </label>
          <label>
            Class
            <input name="className" value={form.className} onChange={updateForm} required />
          </label>
          <label>
            Phone <span className="optional-text">optional</span>
            <input name="phone" value={form.phone} onChange={updateForm} />
          </label>
          <label>
            Guardian phone
            <input name="guardianPhone" value={form.guardianPhone} onChange={updateForm} />
          </label>
          <label>
            CNIC or B-Form <span className="optional-text">optional</span>
            <input name="cnicOrBForm" value={form.cnicOrBForm} onChange={updateForm} />
          </label>
          <label>
            Institution
            <input name="institution" value={form.institution} onChange={updateForm} />
          </label>
          <label>
            Unit
            <select name="unit" value={form.unit} onChange={updateForm} required>
              <option value="">Select unit</option>
              {units.map((unit) => (
                <option key={unit._id} value={unit._id}>
                  {unit.code} - {unit.name}
                </option>
              ))}
            </select>
          </label>
          <label className="span-2">
            Address
            <input name="address" value={form.address} onChange={updateForm} required />
          </label>
          <label className="span-2">
            Notes
            <textarea name="notes" value={form.notes} onChange={updateForm} rows={3} />
          </label>
          <button type="submit" className="primary-button span-2" disabled={saving}>
            <Plus size={16} aria-hidden="true" />
            Save member
          </button>
        </form>
      </section>

      <section className="panel">
        <div className="panel-header wrap">
          <h2>Member Records</h2>
          <form className="filter-row" onSubmit={search}>
            <label>
              Search
              <input name="search" value={filters.search} onChange={updateFilter} placeholder="Name, phone, area" />
            </label>
            <label>
              Zone
              <select name="zone" value={filters.zone} onChange={updateFilter}>
                <option value="">All zones</option>
                {zones.map((zone) => (
                  <option key={zone._id} value={zone._id}>
                    {zone.code} - {zone.name}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Unit
              <select name="unit" value={filters.unit} onChange={updateFilter}>
                <option value="">All units</option>
                {visibleUnits.map((unit) => (
                  <option key={unit._id} value={unit._id}>
                    {unit.code} - {unit.name}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Shaheen
              <select name="isShaheen" value={filters.isShaheen} onChange={updateFilter}>
                <option value="">All</option>
                <option value="true">Shaheen only</option>
                <option value="false">Members only</option>
              </select>
            </label>
            <button type="submit" className="secondary-button compact">
              <Search size={16} aria-hidden="true" />
              Search
            </button>
          </form>
        </div>

        {members.length ? (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Class</th>
                  <th>Phone</th>
                  <th>Unit</th>
                  <th>Address</th>
                  <th>Shaheen</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {members.map((member) => (
                  <tr key={member._id}>
                    <td>
                      <strong>{member.fullName}</strong>
                      <span className="table-subtext">{member.institution || member.fatherName || "Student"}</span>
                    </td>
                    <td>{member.className}</td>
                    <td>{member.phone || <span className="muted-text">Not added</span>}</td>
                    <td>{member.unit?.name}</td>
                    <td>{member.address}</td>
                    <td>
                      <button type="button" className={member.isShaheen ? "pill-button selected" : "pill-button"} onClick={() => toggleShaheen(member)}>
                        <ShieldCheck size={15} aria-hidden="true" />
                        {member.isShaheen ? "Shaheen" : "Appoint"}
                      </button>
                    </td>
                    <td>
                      <button type="button" className="icon-button danger-button" onClick={() => deleteMember(member)} aria-label={`Delete ${member.fullName}`}>
                        <Trash2 size={15} aria-hidden="true" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState title="No members found" text="Add a member or change the filters." />
        )}
      </section>
    </section>
  );
}
