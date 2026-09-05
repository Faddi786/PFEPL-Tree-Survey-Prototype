import { ArrowLeft, ClipboardList, Radio } from "lucide-react";
import { Link } from "react-router-dom";
import { GREENWATCH_ALERTS, PATROL_ASSIGNMENTS } from "../data/greenwatch";

const statusClass: Record<string, string> = {
  complete: "bg-emerald-50 text-emerald-800 border-emerald-200",
  "in-progress": "bg-sky-50 text-sky-800 border-sky-200",
  overdue: "bg-rose-50 text-rose-800 border-rose-200",
  scheduled: "bg-slate-50 text-slate-700 border-slate-200",
};

export default function PatrolMonitoringPage() {
  return (
    <div className="flex h-screen flex-col overflow-hidden bg-[#F7F7F5] p-3 lg:p-4">
      <main className="min-h-0 flex-1 overflow-y-auto rounded-2xl border border-white/70 bg-white/85 p-4 shadow-[0_8px_30px_rgba(0,0,0,0.06)] lg:p-5">
        <Link
          to="/app"
          className="mb-3 inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 transition hover:text-slate-800"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to map
        </Link>
        <div className="mb-5 flex items-start gap-2">
          <ClipboardList className="mt-0.5 h-5 w-5 text-slate-700" />
          <div>
            <h1 className="text-lg font-semibold text-[#1A1A1A]">Patrol monitoring</h1>
            <p className="text-xs text-slate-500">
              Range officers schedule beats; completion requires QR scan plus GNSS check-in.
            </p>
          </div>
        </div>

        <div className="mb-6 grid gap-3 sm:grid-cols-4">
          {["scheduled", "in-progress", "complete", "overdue"].map((status) => {
            const count = PATROL_ASSIGNMENTS.filter((p) => p.status === status).length;
            return (
              <div key={status} className="rounded-2xl border border-slate-200 bg-white px-4 py-3">
                <p className="text-[11px] uppercase tracking-wide text-slate-500">{status.replace("-", " ")}</p>
                <p className="mt-1 text-2xl font-semibold">{count}</p>
              </div>
            );
          })}
        </div>

        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-[10px] uppercase tracking-wider text-slate-500">
              <tr>
                <th className="px-3 py-2">Patrol</th>
                <th className="px-3 py-2">Range / Beat</th>
                <th className="px-3 py-2">Assigned to</th>
                <th className="px-3 py-2">Due window</th>
                <th className="px-3 py-2">Progress</th>
                <th className="px-3 py-2">Status</th>
              </tr>
            </thead>
            <tbody>
              {PATROL_ASSIGNMENTS.map((row) => (
                <tr key={row.id} className="border-t border-slate-100">
                  <td className="px-3 py-2 font-medium">
                    {row.id}
                    <div className="text-[10px] font-normal text-slate-500">{row.route}</div>
                  </td>
                  <td className="px-3 py-2">
                    {row.range}
                    <div className="text-[10px] text-slate-500">{row.beat}</div>
                  </td>
                  <td className="px-3 py-2">{row.assignedTo}</td>
                  <td className="px-3 py-2">{row.dueWindow}</td>
                  <td className="px-3 py-2">
                    {row.treesScanned}/{row.treesAssigned} trees · {row.completionPct}%
                  </td>
                  <td className="px-3 py-2">
                    <span className={`rounded-md border px-2 py-0.5 font-medium ${statusClass[row.status]}`}>
                      {row.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-6">
          <div className="mb-2 flex items-center gap-2 text-sm font-semibold">
            <Radio className="h-4 w-4" />
            Alerting engine
          </div>
          <div className="grid gap-2 md:grid-cols-2">
            {GREENWATCH_ALERTS.map((alert) => (
              <div key={alert.id} className="rounded-xl border border-slate-200 bg-white p-3">
                <p className="text-[10px] uppercase tracking-wide text-slate-400">{alert.family} · {alert.id}</p>
                <p className="mt-1 text-sm font-medium text-[#1A1A1A]">{alert.title}</p>
                <p className="mt-1 text-xs text-slate-600">{alert.detail}</p>
                <p className="mt-2 text-[10px] text-slate-400">
                  {alert.range} · {alert.beat} · {alert.raisedAt} · email/SMS to Range Officer
                </p>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
