/**
 * Marca oficial da Rede Américas — asset real (public/brand/rede-americas-mark.png),
 * extraído com transparência a partir do arquivo fornecido pela empresa.
 */
export function LogoMark({ className, title = "Rede Américas" }: { className?: string; title?: string }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src="/brand/rede-americas-mark.png"
      alt={title}
      className={className}
      style={{ objectFit: "contain" }}
    />
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
