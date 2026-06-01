import { prisma } from "@/data/db";
import { checkApplicationHealth } from "@/data/health";

export const runtime = "nodejs";

export async function GET() {
  const result = await checkApplicationHealth({
    pingDatabase: () => prisma.$queryRaw`SELECT 1`,
  });

  return Response.json(result.body, {
    status: result.status,
    headers: {
      "Cache-Control": "no-store",
    },
  });
}
