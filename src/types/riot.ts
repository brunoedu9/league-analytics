/** Plataformas (regiões) suportadas pela Riot API. Usado em RF01. */
export type Platform =
  | "br1" | "na1" | "la1" | "la2" | "euw1" | "eun1" | "tr1" | "ru"
  | "kr" | "jp1" | "oc1" | "sg2" | "tw2" | "vn2" | "me1";

export interface RiotId {
  gameName: string;
  tagLine: string;
}
