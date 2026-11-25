import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import { resetAccountScopedState } from "../actions";
import type { File as SublayFile } from "../../interfaces/models/File";

/**
 * Fresh Files from `POST /files/links` (S#144), by file id. `useFileLinks`
 * reads them in place of a File whose links expired, so a record already on
 * screen keeps working without being read again. `unavailable` holds the ids
 * the server left out (missing, or no longer visible to the viewer): they
 * aren't asked for again.
 *
 * What one account may see isn't what another may, so an account change
 * empties it. `generation` counts those changes: it's part of every refresh
 * request's key, so the next account asks again for what the last one did.
 */
export interface FileLinksState {
  byId: Record<string, SublayFile>;
  unavailable: Record<string, true>;
  generation: number;
}

const initialState: FileLinksState = { byId: {}, unavailable: {}, generation: 0 };

const fileLinksSlice = createSlice({
  name: "fileLinks",
  initialState,
  reducers: {
    fileLinksRefreshed(state, action: PayloadAction<SublayFile[]>) {
      for (const file of action.payload) {
        state.byId[file.id] = file;
        delete state.unavailable[file.id];
      }
    },
    fileLinksUnavailable(state, action: PayloadAction<string[]>) {
      for (const id of action.payload) state.unavailable[id] = true;
    },
  },
  extraReducers: (builder) => {
    builder.addCase(resetAccountScopedState, (state) => ({
      ...initialState,
      generation: state.generation + 1,
    }));
  },
});

export const { fileLinksRefreshed, fileLinksUnavailable } = fileLinksSlice.actions;
export default fileLinksSlice.reducer;
