import { createSlice } from "@reduxjs/toolkit";
import { resetAccountScopedState } from "../actions";

/**
 * Counts account changes: bumped on every `resetAccountScopedState`. State
 * kept outside Redux for the active account (the list hooks' shared load
 * status) watches it to start over too.
 */
const accountEpochSlice = createSlice({
  name: "accountEpoch",
  initialState: 0,
  reducers: {},
  extraReducers: (builder) => {
    builder.addCase(resetAccountScopedState, (state) => state + 1);
  },
});

export default accountEpochSlice.reducer;
