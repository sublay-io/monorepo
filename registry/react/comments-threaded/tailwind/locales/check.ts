// Registry-only: fails the typecheck when a language is missing an entry or
// has one of the wrong shape. Not installed with the component.
import en from "../utils/strings";
import ar from "./ar";
import bn from "./bn";
import cs from "./cs";
import da from "./da";
import de from "./de";
import el from "./el";
import es from "./es";
import fa from "./fa";
import fi from "./fi";
import fil from "./fil";
import fr from "./fr";
import he from "./he";
import hi from "./hi";
import hu from "./hu";
import id_ from "./id";
import it from "./it";
import ja from "./ja";
import ko from "./ko";
import mr from "./mr";
import ms from "./ms";
import nb from "./nb";
import nl from "./nl";
import pl from "./pl";
import pt from "./pt";
import ro from "./ro";
import ru from "./ru";
import sv from "./sv";
import ta from "./ta";
import te from "./te";
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
  cs,
  da,
  de,
  el,
  es,
  fa,
  fi,
  fil,
  fr,
  he,
  hi,
  hu,
  id: id_,
  it,
  ja,
  ko,
  mr,
  ms,
  nb,
  nl,
  pl,
  pt,
  ro,
  ru,
  sv,
  ta,
  te,
  th,
  tr,
  uk,
  ur,
  vi,
  zh,
  "zh-TW": zh_TW,
};
