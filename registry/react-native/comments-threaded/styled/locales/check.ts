// Registry-only: fails the typecheck when a language is missing an entry or
// has one of the wrong shape. Not installed with the component.
import en from "../utils/strings";
import ar from "./ar";
import bn from "./bn";
import de from "./de";
import es from "./es";
import fa from "./fa";
import fr from "./fr";
import he from "./he";
import hi from "./hi";
import id_ from "./id";
import it from "./it";
import ja from "./ja";
import ko from "./ko";
import ms from "./ms";
import nl from "./nl";
import pl from "./pl";
import pt from "./pt";
import ro from "./ro";
import ru from "./ru";
import sv from "./sv";
import th from "./th";
import tr from "./tr";
import uk from "./uk";
import ur from "./ur";
import vi from "./vi";
import zh from "./zh";
import zh_TW from "./zh-TW";

export const languages: Record<string, typeof en> = {
  ar,
  bn,
  de,
  es,
  fa,
  fr,
  he,
  hi,
  id: id_,
  it,
  ja,
  ko,
  ms,
  nl,
  pl,
  pt,
  ro,
  ru,
  sv,
  th,
  tr,
  uk,
  ur,
  vi,
  zh,
  "zh-TW": zh_TW,
};
