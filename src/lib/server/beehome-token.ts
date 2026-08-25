import { cookies } from "next/headers";

/**
 * Cookie httpOnly com uma sobrescrita manual do token da BeeHome, colada
 * pela administradora na tela de Integrações. Existe porque o token
 * documentado expira em ~10 minutos e trocar `BEEHOME_BEARER_TOKEN` (variável
 * de ambiente) exige um novo deploy — isto permite atualizar o token em uso
 * sem redeploy. Nunca exposto a JavaScript do navegador. Expira sozinho em
 * 20 minutos (folga sobre a vida útil observada do token) para não manter um
 * token morto guardado por muito tempo.
 */
export const BEEHOME_TOKEN_COOKIE_NAME = "beehome_token_override";
const MAX_AGE_SECONDS = 20 * 60;
const isProduction = process.env.NODE_ENV === "production";

export async function setBeeHomeTokenOverride(token: string): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(BEEHOME_TOKEN_COOKIE_NAME, token, {
    httpOnly: true,
    secure: isProduction,
    sameSite: "lax",
    path: "/",
    maxAge: MAX_AGE_SECONDS,
  });
}

export async function clearBeeHomeTokenOverride(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(BEEHOME_TOKEN_COOKIE_NAME);
}

export async function getBeeHomeTokenOverride(): Promise<string | undefined> {
  const cookieStore = await cookies();
  return cookieStore.get(BEEHOME_TOKEN_COOKIE_NAME)?.value;
}
