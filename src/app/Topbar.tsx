import { useEffect, useState, type FormEvent } from "react";
import { Search } from "lucide-react";
import type { Platform } from "../types/riot";

const REGIONS: { value: Platform; label: string }[] = [
  { value: "br1", label: "BR" },
  { value: "la1", label: "LAN" },
  { value: "la2", label: "LAS" },
  { value: "na1", label: "NA" },
  { value: "euw1", label: "EUW" },
  { value: "eun1", label: "EUNE" },
  { value: "kr", label: "KR" },
  { value: "jp1", label: "JP" },
  { value: "oc1", label: "OCE" },
  { value: "tr1", label: "TR" },
  { value: "ru", label: "RU" },
];

function useOnline() {
  const [online, setOnline] = useState(navigator.onLine);
  useEffect(() => {
    const update = () => setOnline(navigator.onLine);
    window.addEventListener("online", update);
    window.addEventListener("offline", update);
    return () => {
      window.removeEventListener("online", update);
      window.removeEventListener("offline", update);
    };
  }, []);
  return online;
}

export function Topbar() {
  const [query, setQuery] = useState("");
  const [region, setRegion] = useState<Platform>("br1");
  const online = useOnline();

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    // RF01: a busca real (Riot ID → PUUID) entra na integração com a Riot API.
  }

  return (
    <header className="topbar">
      <form className="search" onSubmit={onSubmit} role="search">
        <Search size={16} />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Buscar Riot ID — ex.: Nome#BR1"
          aria-label="Riot ID"
        />
        <select value={region} onChange={(e) => setRegion(e.target.value as Platform)} aria-label="Região">
          {REGIONS.map((r) => (
            <option key={r.value} value={r.value}>
              {r.label}
            </option>
          ))}
        </select>
      </form>
      <div className="topbar__spacer" />
      <div className={`sync-status${online ? "" : " is-offline"}`} title="Os dados exibidos vêm do banco local">
        <span className="sync-status__dot" />
        {online ? "Online · dados locais" : "Offline · exibindo dados salvos"}
      </div>
    </header>
  );
}
