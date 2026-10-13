// Registry-only: fails the typecheck when a language is missing an entry or
// has one of the wrong shape. Not installed with the component.
import en from "../utils/strings";
import ar from "./ar";
import de from "./de";
import es from "./es";
import fr from "./fr";
import he from "./he";
import hi from "./hi";
import id_ from "./id";
import it from "./it";
import ja from "./ja";
import ko from "./ko";
import nl from "./nl";
import pl from "./pl";
import pt from "./pt";
import ru from "./ru";
import tr from "./tr";
import zh from "./zh";

export const languages: Record<string, typeof en> = {
  ar,
  de,
  es,
  fr,
  he,
  hi,
  id: id_,
  it,
  ja,
  ko,
  nl,
  pl,
  pt,
  ru,
  tr,
  zh,
};
