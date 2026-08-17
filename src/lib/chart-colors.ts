// Paleta de marca — Rede Américas. primary/accent vêm direto da marca;
// secondary é um tom mais escuro de brand-secondary (#D9B4D5 é claro demais
// para linhas/barras finas — perderia contraste sobre fundo branco).
export const CHART_COLORS = {
  primary: "#6D2077",
  secondary: "#A566AC",
  accent: "#8FA84E",
  success: "#12B76A",
  info: "#2E90FA",
  warning: "#F79009",
  error: "#F04438",
  critical: "#B42318",
  neutral: "#8C8B87",
};

// Paleta categórica para diferenciar muitas séries/categorias (gráficos com
// múltiplas séries, tags de campanha, departamentos etc.) — ordem fixa,
// nunca cicle os tons. Derivada da paleta de referência validada da skill
// dataviz (lightness band, chroma floor, separação CVD, piso de visão normal
// e contraste — ver scripts/validate_palette.js), reordenada para liderar
// com os tons violeta/verde da marca mantendo os pares adjacentes originais
// intactos (apenas o novo par vermelho↔azul foi revalidado).
export const CATEGORICAL_PALETTE = [
  "#008300", // verde (marca)
  "#4A3AA7", // violeta (marca)
  "#E34948", // vermelho
  "#2A78D6", // azul
  "#EB6834", // laranja
  "#1BAF7A", // água
  "#EDA100", // amarelo
  "#E87BA4", // magenta
];

export const GRID_COLOR = "#E4E7EC";
export const AXIS_COLOR = "#667085";
