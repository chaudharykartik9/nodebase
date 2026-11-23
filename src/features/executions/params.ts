import { parseAsInteger } from "nuqs/server";
import { PAGINATION } from "@/config/constants";

// URL query params for the executions list: ?page=2&pageSize=5
export const executionsParams = {
  page: parseAsInteger
    .withDefault(PAGINATION.DEFAULT_PAGE)
    .withOptions({ clearOnDefault: true }),
  pageSize: parseAsInteger
    .withDefault(PAGINATION.DEFAULT_PAGE_SIZE)
    .withOptions({ clearOnDefault: true }),
};
