import { NextRequest, NextResponse } from "next/server";
import { getAuthToken } from "./auth-cookie";

/**
 * URL do backend NestJS, usada apenas do lado do servidor (nunca chega ao
 * navegador). Ver README.md para como configurar em cada ambiente.
 */
const BACKEND_URL = process.env.BACKEND_INTERNAL_URL || "http://localhost:3001";

interface ProxyOptions {
  /** Método HTTP a usar na chamada ao backend. Default: o método da request recebida. */
  method?: string;
  /** Corpo já serializável a enviar. Se omitido, repassa o corpo bruto da request (para métodos que não são GET/HEAD). */
  body?: unknown;
  /** Se true (default), exige cookie de sessão válido e retorna 401 sem chamar o backend quando ausente. */
  requireAuth?: boolean;
}

/**
 * Proxy autenticado genérico: Route Handler (servidor) -> backend NestJS.
 * Lê o JWT do cookie httpOnly (nunca exposto ao navegador), monta o header
 * `Authorization: Bearer <token>` e repassa a chamada, devolvendo o mesmo
 * status/JSON do backend ao client. Isso mantém o browser conversando
 * somente com a própria origem do Next.js (same-origin, sem CORS).
 */
export async function proxyToBackend(request: NextRequest, backendPath: string, options: ProxyOptions = {}): Promise<NextResponse> {
  const { method = request.method, body, requireAuth = true } = options;

  const token = await getAuthToken();
  if (requireAuth && !token) {
    return NextResponse.json({ statusCode: 401, message: "Sessão expirada ou inexistente. Faça login novamente." }, { status: 401 });
  }

  const url = new URL(backendPath, BACKEND_URL);
  if (!url.search && request.nextUrl.search) {
    url.search = request.nextUrl.search;
  }

  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (token) headers.Authorization = `Bearer ${token}`;

  let payload: string | undefined;
  if (body !== undefined) {
    payload = JSON.stringify(body);
  } else if (method !== "GET" && method !== "HEAD") {
    const text = await request.text();
    payload = text.length > 0 ? text : undefined;
  }

  let backendResponse: Response;
  try {
    backendResponse = await fetch(url.toString(), {
      method,
      headers,
      body: payload,
      cache: "no-store",
    });
  } catch {
    return NextResponse.json(
      {
        statusCode: 502,
        message: `Não foi possível conectar ao backend em ${BACKEND_URL}. Verifique se o serviço está em execução (ver README.md).`,
      },
      { status: 502 },
    );
  }

  const text = await backendResponse.text();
  const contentType = backendResponse.headers.get("content-type") ?? "application/json";

  return new NextResponse(text, {
    status: backendResponse.status,
    headers: { "content-type": contentType },
  });
}

/**
 * Proxy autenticado para downloads binários (PDF/Excel/CSV de relatórios).
 * Difere de `proxyToBackend` por nunca passar a resposta por `.text()` —
 * isso corromperia bytes de um .xlsx/.pdf real — repassando o `ArrayBuffer`
 * bruto e os headers `Content-Type`/`Content-Disposition` do backend.
 */
export async function proxyBinaryDownload(backendPath: string): Promise<NextResponse> {
  const token = await getAuthToken();
  if (!token) {
    return NextResponse.json({ statusCode: 401, message: "Sessão expirada ou inexistente. Faça login novamente." }, { status: 401 });
  }

  const url = new URL(backendPath, BACKEND_URL);

  let backendResponse: Response;
  try {
    backendResponse = await fetch(url.toString(), {
      method: "GET",
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    });
  } catch {
    return NextResponse.json(
      {
        statusCode: 502,
        message: `Não foi possível conectar ao backend em ${BACKEND_URL}. Verifique se o serviço está em execução (ver README.md).`,
      },
      { status: 502 },
    );
  }

  if (!backendResponse.ok) {
    const text = await backendResponse.text();
    const contentType = backendResponse.headers.get("content-type") ?? "application/json";
    return new NextResponse(text, { status: backendResponse.status, headers: { "content-type": contentType } });
  }

  const buffer = await backendResponse.arrayBuffer();
  const headers: Record<string, string> = {
    "content-type": backendResponse.headers.get("content-type") ?? "application/octet-stream",
  };
  const disposition = backendResponse.headers.get("content-disposition");
  if (disposition) headers["content-disposition"] = disposition;

  return new NextResponse(buffer, { status: backendResponse.status, headers });
}

/** Chamada servidor-a-servidor "crua" ao backend, para os handlers de auth (login/refresh), que não devem passar pelo proxy genérico pois lidam com o cookie diretamente. */
export async function callBackend(path: string, init: RequestInit): Promise<Response> {
  const url = new URL(path, BACKEND_URL);
  return fetch(url.toString(), {
    ...init,
    headers: { "Content-Type": "application/json", ...(init.headers ?? {}) },
    cache: "no-store",
  });
}
