// `SuspendedError` lives beside `SublayError` (which builds it from a
// `user/suspended` response); this module keeps its import path.
export {
  SUSPENDED_ERROR_CODE,
  SuspendedError,
  isSuspendedError,
} from "./SublayError";
