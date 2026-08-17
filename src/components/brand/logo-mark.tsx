/**
 * Marca da Rede Américas — recriação vetorial fiel ao logo oficial (faixas
 * escalonadas em degrau, de largura decrescente, num gradiente
 * roxo → verde). O arquivo original ainda não foi recebido como anexo (só
 * chegou colado inline na conversa, sem arquivo acessível) — esta é uma
 * reconstrução cuidadosa por inspeção visual, não um asset oficial
 * pixel-a-pixel. Trocar por `<img>`/`<Image>` apontando para o arquivo real
 * assim que ele estiver disponível em `public/`.
 */
export function LogoMark({ className, title = "Rede Américas" }: { className?: string; title?: string }) {
  // 7 faixas, cada uma um degrau mais estreito e deslocado para
  // baixo/direita que a anterior — mesma leitura visual do logo oficial.
  const bars = [
    { x: 4, y: 4, w: 46, h: 9 },
    { x: 10, y: 16, w: 46, h: 9 },
    { x: 16, y: 28, w: 42, h: 9 },
    { x: 24, y: 40, w: 32, h: 9 },
    { x: 34, y: 52, w: 40, h: 9 },
    { x: 40, y: 64, w: 34, h: 9 },
    { x: 46, y: 76, w: 24, h: 9 },
  ];

  return (
    <svg viewBox="0 0 84 88" className={className} role="img" aria-label={title}>
      <title>{title}</title>
      <defs>
        <linearGradient id="ra-logo-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#6d2077" />
          <stop offset="45%" stopColor="#d9b4d5" />
          <stop offset="70%" stopColor="#c7c6c2" />
          <stop offset="100%" stopColor="#cddc9c" />
        </linearGradient>
      </defs>
      {bars.map((bar, i) => (
        <path
          key={i}
          d={`M${bar.x},${bar.y} h${bar.w - 8} l8,${bar.h / 2} l-8,${bar.h / 2} h-${bar.w - 8} z`}
          fill="url(#ra-logo-gradient)"
        />
      ))}
    </svg>
  );
}

/** Lockup completo: marca + nome, para contextos de maior destaque (login, splash). */
export function LogoFull({ className, tone = "dark" }: { className?: string; tone?: "dark" | "light" }) {
  const textColor = tone === "light" ? "#ffffff" : "#6d2077";
  return (
    <div className={className} style={{ display: "flex", alignItems: "center", gap: 10 }}>
      <LogoMark className="h-9 w-9 shrink-0" />
      <span style={{ fontSize: 20, lineHeight: 1.1, color: textColor }}>
        <span style={{ fontWeight: 400 }}>Rede</span> <span style={{ fontWeight: 700 }}>Américas</span>
      </span>
    </div>
  );
}
