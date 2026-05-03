import { useEffect, useState } from "react";
import { RefreshCw } from "lucide-react";
import { apiRequest } from "../api/client.js";
import { EmptyState } from "../components/EmptyState.jsx";
import { Loader } from "../components/Loader.jsx";
import { StatCard } from "../components/StatCard.jsx";

function formatMoney(value) {
  return new Intl.NumberFormat("en-PK", {
    style: "currency",
    currency: "PKR",
    maximumFractionDigits: 0
  }).format(value || 0);
}

export function DashboardPage({ notify }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  async function loadOverview() {
    setLoading(true);
    try {
      const overview = await apiRequest("/organization/overview");
      setData(overview);
    } catch (err) {
      notify(err.message, "error");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadOverview();
  }, []);

  const stats = data?.stats || {};

  return (
    <section className="page-stack">
      <header className="page-header">
        <div>
          <h1>Dashboard</h1>
          <p>Live snapshot of the organization hierarchy, members, Shaheen appointments, and funds.</p>
        </div>
        <button type="button" className="secondary-button" onClick={loadOverview} disabled={loading}>
          <RefreshCw size={16} aria-hidden="true" />
          Refresh
        </button>
      </header>

      {loading ? <Loader label="Loading dashboard..." /> : null}

      <div className="stats-grid">
        <StatCard label="Zones" value={stats.zones || 0} helper="City structure" />
        <StatCard label="Units" value={stats.units || 0} helper="Active operating units" />
        <StatCard label="Members" value={stats.members || 0} helper="Saved student profiles" />
        <StatCard label="Shaheens" value={stats.shaheens || 0} helper="Members appointed as Shaheen" />
        <StatCard label="Income" value={formatMoney(stats.income)} helper="Recorded collections" />
        <StatCard label="Balance" value={formatMoney(stats.balance)} helper={`Expenses ${formatMoney(stats.expense)}`} />
      </div>

      <div className="two-column">
        <section className="panel">
          <div className="panel-header">
            <h2>Zones</h2>
          </div>
          {data?.zones?.length ? (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Code</th>
                    <th>Name</th>
                    <th>Units</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {data.zones.map((zone) => (
                    <tr key={zone._id}>
                      <td>{zone.code}</td>
                      <td>{zone.name}</td>
                      <td>{zone.unitCount}</td>
                      <td>
                        <span className={zone.isActive ? "status active" : "status muted"}>
                          {zone.isActive ? "Active" : "Inactive"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <EmptyState title="No zones yet" text="Create zones from the Organization tab." />
          )}
        </section>

        <section className="panel">
          <div className="panel-header">
            <h2>Recent Units</h2>
          </div>
          {data?.units?.length ? (
            <div className="unit-list">
              {data.units.slice(0, 8).map((unit) => (
                <article key={unit._id} className="list-row">
                  <div>
                    <strong>{unit.name}</strong>
                    <span>
                      {unit.zone?.name || "Zone"} | {unit.area || "Area not set"}
                    </span>
                  </div>
                  <small>{unit.code}</small>
                </article>
              ))}
            </div>
          ) : (
            <EmptyState title="No units yet" text="Create operating units under a zone." />
          )}
        </section>
      </div>
    </section>
  );
}
