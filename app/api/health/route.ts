import { jsonOk } from "@/lib/api/response";
import { getHealthReport, healthHttpStatus } from "@/lib/health/check";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const report = await getHealthReport();
  return jsonOk(report, healthHttpStatus(report));
}
