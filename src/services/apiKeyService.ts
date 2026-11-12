import { call } from "./tauri";

export interface ApiKeyStatus {
  configured: boolean;
  /** "vault" = cadastrada no app; "environment" = .env (só em desenvolvimento). */
  source: "vault" | "environment" | null;
  /** Ex.: "RGAPI-…07a9". A chave completa nunca chega à interface. */
  masked: string | null;
}

export const getApiKeyStatus = () => call<ApiKeyStatus>("get_api_key_status");

/** Valida o formato, testa na Riot e salva no Gerenciador de Credenciais do Windows. */
export const setApiKey = (key: string) => call<ApiKeyStatus>("set_api_key", { key });

export const removeApiKey = () => call<ApiKeyStatus>("remove_api_key");

export const DEVELOPER_PORTAL_URL = "https://developer.riotgames.com/";
