import { NextRequest } from "next/server";
import { proxyToBackend } from "@/lib/server/backend-proxy";

export async function POST(request: NextRequest) {
  return proxyToBackend(request, "/insights/ask");
}
