import { useState, type FormEvent } from "react";
import { CheckCircle2, ExternalLink, Eye, EyeOff, KeyRound, Loader2, Trash2, XCircle } from "lucide-react";
import { openUrl } from "@tauri-apps/plugin-opener";
import { Card } from "../../components/Card";
import { errorMessage, useAsync } from "../../hooks/useAsync";
import {
  DEVELOPER_PORTAL_URL,
  getApiKeyStatus,
  removeApiKey,
  setApiKey,
  type ApiKeyStatus,
} from "../../services/apiKeyService";
import { isTauri } from "../../services/tauri";

function StatusLine({ status }: { status: ApiKeyStatus }) {
  if (!status.configured) {
    return (
      <div className="key-status key-status--missing">
        <XCircle size={16} />
        <span>
          <strong>Nenhuma chave cadastrada.</strong> Sem ela, o app mostra apenas os dados já salvos.
        </span>
      </div>
    );
  }
  return (
    <div className="key-status key-status--ok">
      <CheckCircle2 size={16} />
      <span>
        <strong>Chave configurada</strong> <span className="num">{status.masked}</span>
        {status.source === "environment" && <span className="muted"> · lida do arquivo .env (modo desenvolvimento)</span>}
      </span>
    </div>
  );
}

/** RF12 + RNF03 — cada usuário cadastra a própria chave da Riot API. */
export function ApiKeyCard() {
  const [reloadKey, setReloadKey] = useState(0);
  const state = useAsync(getApiKeyStatus, [reloadKey]);
  const [value, setValue] = useState("");
  const [visible, setVisible] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ kind: "ok" | "error"; text: string } | null>(null);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!value.trim() || saving) return;
    setSaving(true);
    setMessage(null);
    try {
      await setApiKey(value);
      setValue("");
      setVisible(false);
      setMessage({ kind: "ok", text: "Chave testada na Riot e salva com segurança." });
      setReloadKey((k) => k + 1);
    } catch (err) {
      setMessage({ kind: "error", text: errorMessage(err) });
    } finally {
      setSaving(false);
    }
  }

  async function onRemove() {
    setMessage(null);
    try {
      await removeApiKey();
      setMessage({ kind: "ok", text: "Chave removida deste computador." });
      setReloadKey((k) => k + 1);
    } catch (err) {
      setMessage({ kind: "error", text: errorMessage(err) });
    }
  }

  const openPortal = () => {
    if (isTauri()) openUrl(DEVELOPER_PORTAL_URL).catch(() => {});
    else window.open(DEVELOPER_PORTAL_URL, "_blank", "noopener");
  };

  return (
    <Card
      title="Chave da Riot API"
      subtitle="Cada usuário usa a própria chave para buscar dados na Riot"
      actions={<KeyRound size={18} className="muted" />}
    >
      {state.status === "loading" && <div className="skeleton" style={{ minHeight: 40 }} />}
      {state.status === "error" && <div className="empty">{errorMessage(state.error)}</div>}
      {state.status === "success" && <StatusLine status={state.data} />}

      <form className="key-form" onSubmit={onSubmit}>
        <label htmlFor="riot-key" className="key-form__label">
          {state.status === "success" && state.data.configured ? "Substituir chave" : "Cole sua chave"}
        </label>
        <div className="key-form__row">
          <div className="key-input">
            <input
              id="riot-key"
              type={visible ? "text" : "password"}
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder="RGAPI-xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
              autoComplete="off"
              spellCheck={false}
              disabled={saving}
            />
            <button
              type="button"
              className="key-input__toggle"
              onClick={() => setVisible((v) => !v)}
              aria-label={visible ? "Ocultar chave" : "Mostrar chave"}
            >
              {visible ? <EyeOff size={15} /> : <Eye size={15} />}
            </button>
          </div>
          <button className="btn btn--primary" type="submit" disabled={saving || !value.trim()}>
            {saving ? <Loader2 size={15} className="spin" /> : <CheckCircle2 size={15} />}
            {saving ? "Testando…" : "Salvar e testar"}
          </button>
        </div>
      </form>

      {message && (
        <div className={`key-message key-message--${message.kind}`} role={message.kind === "error" ? "alert" : "status"}>
          {message.text}
        </div>
      )}

      <div className="key-help">
        <p>
          A chave fica no <strong>Gerenciador de Credenciais do Windows</strong> deste computador. Ela não é enviada para
          nenhum lugar além dos servidores da Riot.
        </p>
        <p>
          Para obter uma: entre no Riot Developer Portal com sua conta Riot e copie a <em>Development API Key</em>. Ela
          expira a cada 24 horas; para uso contínuo, solicite uma <em>Personal API Key</em> no próprio portal.
        </p>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <button className="btn" type="button" onClick={openPortal}>
            <ExternalLink size={15} />
            Abrir Riot Developer Portal
          </button>
          {state.status === "success" && state.data.source === "vault" && (
            <button className="btn" type="button" onClick={onRemove}>
              <Trash2 size={15} />
              Remover chave
            </button>
          )}
        </div>
      </div>
    </Card>
  );
}
