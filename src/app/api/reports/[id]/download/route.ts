import { proxyBinaryDownload } from "@/lib/server/backend-proxy";

export async function GET(_request: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  return proxyBinaryDownload(`/reports/${id}/download`);
}
