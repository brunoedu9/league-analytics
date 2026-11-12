import { Database, HardDrive } from "lucide-react";
import { PageHeader } from "../../components/PageHeader";
import { Card } from "../../components/Card";
import { useAsync } from "../../hooks/useAsync";
import { getDbStatus, type DbStatus } from "../../services/databaseService";
import { formatInt, formatRelative } from "../../lib/format";

function formatBytes(bytes: number | null): string {
  if (bytes === null) return "—";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

function StatusRows({ status }: { status: DbStatus }) {
  const rows: [string, string][] = [
    ["Jogadores", formatInt(status.players)],
    ["Partidas", formatInt(status.matches)],
    ["Participantes", formatInt(status.participants)],
    ["Registros de elo", formatInt(status.rankSnapshots)],
    ["Tamanho", formatBytes(status.sizeBytes)],
    ["Versão do esquema", String(status.schemaVersion)],
    [
      "Última sincronização",
      status.lastSyncAt ? formatRelative(new Date(status.lastSyncAt).toISOString()) : "nunca",
    ],
  ];
  return (
    <>
      <table className="table">
        <tbody>
          {rows.map(([label, value]) => (
            <tr key={label}>
              <td className="secondary">{label}</td>
              <td className="right num">{value}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {status.path && (
        <div className="muted" style={{ fontSize: 12, marginTop: 12, wordBreak: "break-all" }}>
          <HardDrive size={12} style={{ verticalAlign: -2, marginRight: 6 }} />
          {status.path}
        </div>
      )}
    </>
  );
}

/** RF11/RF12 — Configurações. Por enquanto mostra o estado do banco local. */
export function SettingsPage() {
  const state = useAsync(getDbStatus);
  return (
    <section className="page">
      <PageHeader title="Configurações" description="Região, sincronização, aparência e preferências." />
      <div className="grid grid--2">
        <Card
          title="Banco de dados local"
          subtitle="Os dados ficam no seu computador e continuam acessíveis sem internet."
          actions={<Database size={18} className="muted" />}
        >
          {state.status === "loading" && <div className="skeleton" style={{ minHeight: 180 }} />}
          {state.status === "error" && (
            <div className="empty">{state.error instanceof Error ? state.error.message : String(state.error)}</div>
          )}
          {state.status === "success" && <StatusRows status={state.data} />}
        </Card>
        <div className="placeholder">Região, sincronização automática e aparência — em construção</div>
      </div>
    </section>
  );
}
