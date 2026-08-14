import { NextRequest } from "next/server";
import { proxyToBackend } from "@/lib/server/backend-proxy";

export async function GET(request: NextRequest) {
  return proxyToBackend(request, "/reports");
}

export async function POST(request: NextRequest) {
  return proxyToBackend(request, "/reports");
}
