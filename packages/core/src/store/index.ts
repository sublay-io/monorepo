import { configureStore } from "@reduxjs/toolkit";
import { rootReducer } from "./rootReducer";
import { customMiddleware } from "./middleware";
import { baseApi } from "./api/baseApi";
import { isDevelopment } from "../utils/env";

// Configure the Redux store
export const store = configureStore({
  reducer: rootReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        // Ignore these action types for serializable check
        ignoredActions: [
          'persist/PERSIST', 
          'persist/REHYDRATE',
          // RTK Query actions that might contain functions
          'appNotificationsApi/executeQuery/pending',
          'appNotificationsApi/executeQuery/fulfilled',
          'appNotificationsApi/executeQuery/rejected',
          'appNotificationsApi/executeMutation/pending',
          'appNotificationsApi/executeMutation/fulfilled',
          'appNotificationsApi/executeMutation/rejected',
        ],
        // Ignore these field paths in all actions
        ignoredActionsPaths: [
          'meta.arg', 
          'payload.timestamp',
          // RTK Query meta fields that may contain functions
          'meta.baseQueryMeta',
          'meta.arg.originalArgs',
          'meta.arg.endpointName',
          'payload.meta',
        ],
        // Ignore these paths in the state
        ignoredPaths: [
          'items.dates',
          // RTK Query state paths that may contain functions/metadata
          'sublayApi',
          'appNotificationsApi',
        ],
      },
    })
      // Add RTK Query middleware
      .concat(baseApi.middleware)
      // Add custom middleware
      .concat(customMiddleware),
  
  // Redux DevTools is a debugging aid: on only while developing, not in tests
  devTools: isDevelopment(),
});

// Export types
export type { RootState, AppDispatch, AppStore, AppThunk } from "./types";

// Export store for provider
export { store as sublayStore };

// Export for advanced users who need direct access
export { rootReducer } from "./rootReducer";
export * from "./types";
export * from "./hooks";

// Integration mode exports (for users with their own Redux store)
export * from "./integration";