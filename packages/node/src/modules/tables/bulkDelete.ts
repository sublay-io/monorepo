import { SublayHttpClient } from "../../core/client";
import { BulkDeleteProps, BulkDeleteResult } from "../../interfaces/Table";

/**
 * POST /db/:tableName/bulk-delete — bulk delete by id list and/or `filters`
 * predicate (at least one required). Paranoid tables soft-delete unless
 * `force: true`. A POST, not a DELETE: the id and filter lists travel in the
 * body, which a DELETE doesn't take and a query string can't hold at that size.
 */
export async function bulkDelete(
  client: SublayHttpClient,
  tableName: string,
  params: BulkDeleteProps,
): Promise<BulkDeleteResult> {
  const response = await client.projectInstance.post<BulkDeleteResult>(
    `/db/${tableName}/bulk-delete`,
    params,
  );
  return response.data;
}
