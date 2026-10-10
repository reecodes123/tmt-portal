import type { NextRequest } from "next/server";
import { listPublishedArticles } from "@/server/repositories/articles";
import { searchQuerySchema } from "@/lib/validation";
import { handle, parseQuery } from "../_helpers";

/**
 * Public search across published articles.
 *
 * Currently returns filtered seed data (see repositories/articles.ts). In the
 * backend phase, swap for a MySQL FULLTEXT MATCH ... AGAINST query — the
 * index is already declared in prisma/schema.prisma.
 */
export async function GET(request: NextRequest) {
  return handle(() => {
    const query = parseQuery(request, searchQuerySchema);
    return listPublishedArticles({
      q: query.q,
      category: query.category,
      page: query.page,
      pageSize: query.pageSize,
    });
  });
}
