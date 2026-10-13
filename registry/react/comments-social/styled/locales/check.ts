// Registry-only: fails the typecheck when a language is missing an entry or
// has one of the wrong shape. Not installed with the component.
import en from "../utils/strings";
import he from "./he";

export const languages: Record<string, typeof en> = { he };
