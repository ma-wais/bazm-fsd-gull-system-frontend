import { useEffect, useMemo, useState } from "react";
import { Download, Plus, RefreshCw } from "lucide-react";
import { apiRequest, downloadCsv } from "../api/client.js";
import { EmptyState } from "../components/EmptyState.jsx";
import { Loader } from "../components/Loader.jsx";
import { StatCard } from "../components/StatCard.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import { canWriteFinance } from "../utils/roles.js";

const initialRecord = {
  scopeType: "unit",
  zone: "",
  unit: "",
  direction: "expense",
  amount: "",
  category: "",
  description: "",
  paymentMethod: "cash",
  reference: "",
  occurredAt: new Date().toISOString().slice(0, 10)
};

function formatMoney(value) {
  return new Intl.NumberFormat("en-PK", {
    style: "currency",
    currency: "PKR",
    maximumFractionDigits: 0
  }).format(value || 0);
}

export function FinancePage({ notify }) {
  const { user } = useAuth();
  const [zones, setZones] = useState([]);
  const [units, setUnits] = useState([]);
  const [records, setRecords] = useState([]);
  const [summary, setSummary] = useState(null);
  const [form, setForm] = useState(initialRecord);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const visibleUnits = useMemo(() => {
    if (!form.zone) return units;
    return units.filter((unit) => (unit.zone?._id || unit.zone) === form.zone);
  }, [units, form.zone]);

  async function loadAll() {
    setLoading(true);
    try {
      const [zoneData, unitData, financeData, summaryData] = await Promise.all([
        apiRequest("/organization/zones"),
        apiRequest("/organization/units"),
        apiRequest("/finance"),
        apiRequest("/finance/summary")
      ]);
      const loadedZones = zoneData.zones || [];
      const loadedUnits = unitData.units || [];
      setZones(loadedZones);
      setUnits(loadedUnits);
      setRecords(financeData.records || []);
      setSummary(summaryData.summary);
      setForm((current) => ({
        ...current,
        zone: current.zone || loadedZones[0]?._id || "",
        unit: current.unit || loadedUnits[0]?._id || ""
      }));
    } catch (err) {
      notify(err.message, "error");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAll();
  }, []);

  function updateField(event) {
    const { name, value } = event.target;
    setForm((current) => ({
      ...current,
      [name]: value,
      ...(name === "scopeType" ? { zone: current.zone || zones[0]?._id || "", unit: current.unit || units[0]?._id || "" } : {}),
      ...(name === "zone" ? { unit: "" } : {})
    }));
  }

  async function createRecord(event) {
    event.preventDefault();
    setSaving(true);
    try {
      const payload = {
        ...form,
        amount: Number(form.amount),
        zone: form.scopeType === "city" ? undefined : form.zone,
        unit: form.scopeType === "unit" ? form.unit : undefined
      };
      const data = await apiRequest("/finance", {
        method: "POST",
        body: payload
      });
      setRecords((current) => [data.record, ...current]);
      setForm((current) => ({
        ...initialRecord,
        scopeType: current.scopeType,
        zone: current.zone,
        unit: current.unit,
        occurredAt: new Date().toISOString().slice(0, 10)
      }));
      await loadAll();
      notify("Finance record saved.", "success");
    } catch (err) {
      notify(err.message, "error");
    } finally {
      setSaving(false);
    }
  }

  async function exportCsv() {
    try {
      await downloadCsv("/finance/export.csv", "finance.csv");
    } catch (err) {
      notify(err.message, "error");
    }
  }

  return (
    <section className="page-stack">
      <header className="page-header">
        <div>
          <h1>Finance</h1>
          <p>Record income and expenses at city, zone, or unit level with date and purpose.</p>
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

      {loading ? <Loader label="Loading finance records..." /> : null}

      <div className="stats-grid finance-stats">
        <StatCard label="Income" value={formatMoney(summary?.income)} helper="All accessible records" />
        <StatCard label="Expense" value={formatMoney(summary?.expense)} helper="All accessible records" />
        <StatCard label="Balance" value={formatMoney(summary?.balance)} helper="Income minus expense" />
      </div>

      {canWriteFinance(user.role) ? (
        <section className="panel">
          <div className="panel-header">
            <h2>Add Finance Record</h2>
          </div>
          <form className="form-grid wide" onSubmit={createRecord}>
            <label>
              Scope
              <select name="scopeType" value={form.scopeType} onChange={updateField}>
                <option value="city">City</option>
                <option value="zone">Zone</option>
                <option value="unit">Unit</option>
              </select>
            </label>
            {form.scopeType !== "city" ? (
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
            {form.scopeType === "unit" ? (
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
            ) : null}
            <label>
              Type
              <select name="direction" value={form.direction} onChange={updateField}>
                <option value="income">Income</option>
                <option value="expense">Expense</option>
              </select>
            </label>
            <label>
              Amount
              <input name="amount" type="number" min="0" value={form.amount} onChange={updateField} required />
            </label>
            <label>
              Category
              <input name="category" value={form.category} onChange={updateField} placeholder="Donation, event, transport" required />
            </label>
            <label>
              Date
              <input name="occurredAt" type="date" value={form.occurredAt} onChange={updateField} required />
            </label>
            <label>
              Payment method
              <select name="paymentMethod" value={form.paymentMethod} onChange={updateField}>
                <option value="cash">Cash</option>
                <option value="bank">Bank</option>
                <option value="jazzcash">JazzCash</option>
                <option value="easypaisa">EasyPaisa</option>
                <option value="other">Other</option>
              </select>
            </label>
            <label>
              Reference
              <input name="reference" value={form.reference} onChange={updateField} />
            </label>
            <label className="span-2">
              Description
              <textarea name="description" value={form.description} onChange={updateField} rows={3} required />
            </label>
            <button type="submit" className="primary-button span-2" disabled={saving}>
              <Plus size={16} aria-hidden="true" />
              Save finance record
            </button>
          </form>
        </section>
      ) : null}

      <section className="panel">
        <div className="panel-header">
          <h2>Recent Finance Records</h2>
          <span>{records.length} records</span>
        </div>
        {records.length ? (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Scope</th>
                  <th>Type</th>
                  <th>Category</th>
                  <th>Description</th>
                  <th>Amount</th>
                </tr>
              </thead>
              <tbody>
                {records.map((record) => (
                  <tr key={record._id}>
                    <td>{new Date(record.occurredAt).toLocaleDateString()}</td>
                    <td>
                      <strong>{record.scopeType}</strong>
                      <span className="table-subtext">{record.unit?.name || record.zone?.name || "City"}</span>
                    </td>
                    <td>
                      <span className={record.direction === "income" ? "status active" : "status danger"}>
                        {record.direction}
                      </span>
                    </td>
                    <td>{record.category}</td>
                    <td>{record.description}</td>
                    <td>{formatMoney(record.amount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState title="No finance records" text="Add income or expense records when money moves." />
        )}
      </section>
    </section>
  );
}
