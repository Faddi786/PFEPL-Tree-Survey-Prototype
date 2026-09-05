import { ArrowLeft, QrCode, Shield, Users } from "lucide-react";
import { Link } from "react-router-dom";
import { GREENWATCH_USERS, QR_TAG_ISSUANCE } from "../data/greenwatch";

export default function AdminPage() {
  return (
    <div className="flex h-screen flex-col overflow-hidden bg-[#F7F7F5] p-3 lg:p-4">
      <main className="min-h-0 flex-1 overflow-y-auto rounded-2xl border border-white/70 bg-white/85 p-4 shadow-[0_8px_30px_rgba(0,0,0,0.06)] lg:p-5">
        <Link
          to="/app"
          className="mb-3 inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-slate-800"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to map
        </Link>
        <div className="mb-5 flex items-center gap-2">
          <Shield className="h-5 w-5" />
          <div>
            <h1 className="text-lg font-semibold">Platform administration</h1>
            <p className="text-xs text-slate-500">Users, QR tag issuance, and view-only access for authorised departments.</p>
          </div>
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <section className="rounded-2xl border border-slate-200 bg-white p-4">
            <div className="mb-3 flex items-center gap-2 text-sm font-semibold">
              <Users className="h-4 w-4" />
              Role-based access
            </div>
            <table className="w-full text-left text-xs">
              <thead className="text-[10px] uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="pb-2">User</th>
                  <th className="pb-2">Role</th>
                  <th className="pb-2">Unit</th>
                </tr>
              </thead>
              <tbody>
                {GREENWATCH_USERS.map((user) => (
                  <tr key={user.id} className="border-t border-slate-100">
                    <td className="py-2 font-medium">{user.name}</td>
                    <td className="py-2">{user.role}</td>
                    <td className="py-2 text-slate-500">{user.unit}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-4">
            <div className="mb-3 flex items-center gap-2 text-sm font-semibold">
              <QrCode className="h-4 w-4" />
              QR tag issuance / re-tag
            </div>
            <p className="mb-3 text-xs text-slate-500">
              Lost or damaged tags are re-linked to the same tree record. History is not lost.
            </p>
            <table className="w-full text-left text-xs">
              <thead className="text-[10px] uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="pb-2">QR</th>
                  <th className="pb-2">Tree</th>
                  <th className="pb-2">Status</th>
                </tr>
              </thead>
              <tbody>
                {QR_TAG_ISSUANCE.map((row) => (
                  <tr key={row.qr} className="border-t border-slate-100">
                    <td className="py-2 font-medium">{row.qr}</td>
                    <td className="py-2">{row.treeId}</td>
                    <td className="py-2">{row.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        </div>
      </main>
    </div>
  );
}
