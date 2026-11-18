import { SublayHttpClient } from "../../core/client";

/** DELETE /db/tables/:tableName — drop a custom table (service-key only). */
export async function dropTable(
  client: SublayHttpClient,
  data: { tableName: string },
): Promise<void> {
  await client.projectInstance.delete<void>(
    `/db/tables/${data.tableName}`,
  );
}
