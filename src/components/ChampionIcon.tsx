import { useState } from "react";

interface ChampionIconProps {
  name: string;
  /** Imagem do Data Dragon. Sem ela (ou se falhar, ex.: offline), mostra as iniciais. */
  src?: string | null;
  size?: number;
}

export function ChampionIcon({ name, src, size = 40 }: ChampionIconProps) {
  const [failed, setFailed] = useState(false);
  const style = { width: size, height: size, fontSize: size * 0.34 };

  if (src && !failed) {
    return (
      <img
        className="champ-icon champ-icon--img"
        src={src}
        alt={name}
        title={name}
        style={style}
        loading="lazy"
        onError={() => setFailed(true)}
      />
    );
  }

  const initials = name
    .replace(/[^\p{L} ]/gu, "")
    .split(" ")
    .map((word) => word[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
  return (
    <div className="champ-icon" style={style} title={name} aria-label={name}>
      {initials}
    </div>
  );
}
