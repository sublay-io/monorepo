import { SublayHttpClient } from "../../core/client";

/**
 * DELETE /db/tables/:tableName/columns/:columnName — drop a custom column
 * (service-key only). `tableName` is logical; managed columns are refused.
 */
export async function dropColumn(
  client: SublayHttpClient,
  data: { tableName: string; columnName: string },
): Promise<void> {
  await client.projectInstance.delete<void>(
    `/db/tables/${data.tableName}/columns/${data.columnName}`,
  );
}
