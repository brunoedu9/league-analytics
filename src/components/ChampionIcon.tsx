interface ChampionIconProps {
  name: string;
  size?: number;
}

/**
 * Ícone provisório com as iniciais do campeão.
 * Será substituído pela imagem do Data Dragon (com cache local) na integração.
 */
export function ChampionIcon({ name, size = 40 }: ChampionIconProps) {
  const initials = name
    .replace(/[^\p{L} ]/gu, "")
    .split(" ")
    .map((word) => word[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
  return (
    <div
      className="champ-icon"
      style={{ width: size, height: size, fontSize: size * 0.34 }}
      title={name}
      aria-label={name}
    >
      {initials}
    </div>
  );
}
