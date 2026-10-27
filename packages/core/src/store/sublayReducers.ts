import { combineReducers } from "@reduxjs/toolkit";
import authReducer from "./slices/authSlice";
import { appNotificationsSlice } from "./slices/appNotificationsSlice";
import collectionsReducer from "./slices/collectionsSlice";
import { userReducer } from "./slices/userSlice";
import entityListsReducer from "./slices/entityListsSlice";
import spaceListsReducer from "./slices/spaceListsSlice";
import workspaceListsReducer from "./slices/workspaceListsSlice";
import accountsReducer from "./slices/accountsSlice";
import chatReducer from "./slices/chatSlice";
import tablesReducer from "./slices/tablesSlice";

/**
 * Combined reducer for all Sublay feature slices.
 * Used by both standalone mode (internal) and integration mode (user's store).
 *
 * For integration mode, add this to your store under the 'sublay' key:
 *
 * @example
 * ```typescript
 * import { sublayReducers, sublayApiReducer, sublayMiddleware } from '@sublay/react-js';
 *
 * const store = configureStore({
 *   reducer: {
 *     sublay: sublayReducers,
 *     sublayApi: sublayApiReducer,
 *     ...yourReducers
 *   },
 *   middleware: (getDefault) => getDefault().concat(...sublayMiddleware)
 * });
 * ```
 */
export const sublayReducers = combineReducers({
  auth: authReducer,
  appNotifications: appNotificationsSlice.reducer,
  collections: collectionsReducer,
  user: userReducer,
  entityLists: entityListsReducer,
  spaceLists: spaceListsReducer,
  workspaceLists: workspaceListsReducer,
  accounts: accountsReducer,
  chat: chatReducer,
  tables: tablesReducer,
});

export type SublayState = ReturnType<typeof sublayReducers>;
