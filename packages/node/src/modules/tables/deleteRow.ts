import { SublayHttpClient } from "../../core/client";

/**
 * DELETE /db/:tableName/:rowId — soft-delete on a paranoid table by default;
 * `force: true` hard-deletes.
 */
export async function deleteRow(
  client: SublayHttpClient,
  tableName: string,
  rowId: string,
  opts: { force?: boolean } = {},
): Promise<void> {
  await client.projectInstance.delete<void>(
    `/db/${tableName}/${rowId}`,
    {
      params:
        opts.force === undefined ? {} : { force: opts.force ? "true" : "false" },
    },
  );
}
