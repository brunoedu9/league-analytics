import { useEffect, useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { Loader2, Search } from "lucide-react";
import type { Platform } from "../types/riot";
import { REGIONS } from "../lib/regions";
import { parseRiotId, searchPlayer } from "../services/playerApi";
import { errorMessage } from "../hooks/useAsync";
import { useActivePlayer } from "./ActivePlayer";

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
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const online = useOnline();
  const navigate = useNavigate();
  const activePlayer = useActivePlayer();

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (searching) return;
    const id = parseRiotId(query);
    if (typeof id === "string") {
      setError(id);
      return;
    }
    setError(null);
    setSearching(true);
    try {
      const profile = await searchPlayer(id, region);
      setQuery("");
      // O primeiro jogador pesquisado vira o jogador principal.
      if (activePlayer.ready && !activePlayer.puuid) await activePlayer.setActive(profile.player.puuid);
      navigate(`/player/${profile.player.puuid}`, { state: { warning: profile.warning } });
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setSearching(false);
    }
  }

  return (
    <header className="topbar">
      <div className="search-wrap">
        <form className={`search${error ? " has-error" : ""}`} onSubmit={onSubmit} role="search">
          {searching ? <Loader2 size={16} className="spin" /> : <Search size={16} />}
          <input
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              if (error) setError(null);
            }}
            placeholder="Buscar Riot ID — ex.: Nome#BR1"
            aria-label="Riot ID"
            aria-invalid={!!error}
            aria-describedby={error ? "search-error" : undefined}
            disabled={searching}
          />
          <select value={region} onChange={(e) => setRegion(e.target.value as Platform)} aria-label="Região">
            {REGIONS.map((r) => (
              <option key={r.value} value={r.value}>
                {r.label}
              </option>
            ))}
          </select>
        </form>
        {error && (
          <div className="search-error" id="search-error" role="alert">
            {error}
          </div>
        )}
      </div>
      <div className="topbar__spacer" />
      <div className={`sync-status${online ? "" : " is-offline"}`} title="Os dados exibidos vêm do banco local">
        <span className="sync-status__dot" />
        {online ? "Online · dados locais" : "Offline · exibindo dados salvos"}
      </div>
    </header>
  );
}
