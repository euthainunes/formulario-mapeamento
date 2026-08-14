import { NextResponse } from "next/server";
import { clearAuthCookie } from "@/lib/server/auth-cookie";

/** POST /api/auth/logout — limpa o cookie httpOnly de sessão. Não há endpoint de logout no backend (JWT stateless); a "sessão" só existe como este cookie. */
export async function POST() {
  await clearAuthCookie();
  return NextResponse.json({ success: true });
}
