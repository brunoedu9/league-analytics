import type { Platform } from "../types/riot";

export const REGIONS: { value: Platform; label: string; name: string }[] = [
  { value: "br1", label: "BR", name: "Brasil" },
  { value: "la1", label: "LAN", name: "América Latina Norte" },
  { value: "la2", label: "LAS", name: "América Latina Sul" },
  { value: "na1", label: "NA", name: "América do Norte" },
  { value: "euw1", label: "EUW", name: "Europa Oeste" },
  { value: "eun1", label: "EUNE", name: "Europa Nórdica e Leste" },
  { value: "tr1", label: "TR", name: "Turquia" },
  { value: "ru", label: "RU", name: "Rússia" },
  { value: "me1", label: "ME", name: "Oriente Médio" },
  { value: "kr", label: "KR", name: "Coreia" },
  { value: "jp1", label: "JP", name: "Japão" },
  { value: "oc1", label: "OCE", name: "Oceania" },
  { value: "sg2", label: "SEA", name: "Sudeste Asiático" },
  { value: "tw2", label: "TW", name: "Taiwan" },
  { value: "vn2", label: "VN", name: "Vietnã" },
];

export const regionName = (platform: string) =>
  REGIONS.find((r) => r.value === platform)?.name ?? platform.toUpperCase();
