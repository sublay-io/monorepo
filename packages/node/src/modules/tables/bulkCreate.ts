import { SublayHttpClient } from "../../core/client";
import { BulkCreateResult, TableRow } from "../../interfaces/Table";

/**
 * POST /db/:tableName/bulk — insert many rows (capped at 100 server-side).
 * Answers `{ data }`, the inserted rows.
 */
export async function bulkCreate<T = TableRow>(
  client: SublayHttpClient,
  tableName: string,
  rows: Array<Partial<T> | Record<string, unknown>>,
): Promise<BulkCreateResult<T>> {
  const response = await client.projectInstance.post<BulkCreateResult<T>>(
    `/db/${tableName}/bulk`,
    { rows },
  );
  return response.data;
}
