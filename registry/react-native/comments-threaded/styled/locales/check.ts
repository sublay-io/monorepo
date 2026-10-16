// Registry-only: fails the typecheck when a language is missing an entry or
// has one of the wrong shape. Not installed with the component.
import en from "../utils/strings";
import ar from "./ar";
import bg from "./bg";
import bn from "./bn";
import ca from "./ca";
import cs from "./cs";
import da from "./da";
import de from "./de";
import el from "./el";
import es from "./es";
import fa from "./fa";
import fi from "./fi";
import fil from "./fil";
import fr from "./fr";
import gu from "./gu";
import he from "./he";
import hi from "./hi";
import hr from "./hr";
import hu from "./hu";
import id_ from "./id";
import it from "./it";
import ja from "./ja";
import kk from "./kk";
import ko from "./ko";
import lt from "./lt";
import mr from "./mr";
import ms from "./ms";
import nb from "./nb";
import nl from "./nl";
import pl from "./pl";
import pt from "./pt";
import pt_PT from "./pt-PT";
import ro from "./ro";
import ru from "./ru";
import sk from "./sk";
import sr from "./sr";
import sv from "./sv";
import sw from "./sw";
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
  bg,
  bn,
  ca,
  cs,
  da,
  de,
  el,
  es,
  fa,
  fi,
  fil,
  fr,
  gu,
  he,
  hi,
  hr,
  hu,
  id: id_,
  it,
  ja,
  kk,
  ko,
  lt,
  mr,
  ms,
  nb,
  nl,
  pl,
  pt,
  "pt-PT": pt_PT,
  ro,
  ru,
  sk,
  sr,
  sv,
  sw,
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
