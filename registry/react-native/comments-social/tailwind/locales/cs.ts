import type { ReportReasonKey } from "@sublay/react-native";

// Czech nouns take one of three forms, depending on the number (1, 2–4, other).
const plural = (count: number, one: string, few: string, other: string) => {
  if (count === 1) return one;
  if (count >= 2 && count <= 4) return few;
  return other;
};

// 🌐 Every piece of text the comment section shows. Edit the values here to
// reword or translate it. Entries that depend on a number or a name are
// functions, so each language can use its own plural forms and word order.
const strings = {
  // Inputs
  commentPlaceholder: "Přidejte komentář...",
  cancel: "Zrušit",
  post: "Odeslat",
  replyingTo: (name: string) => `Odpověď uživateli ${name}`,

  // Comment list
  noCommentsTitle: "Zatím žádné komentáře",
  noCommentsSubtitle: "Začněte konverzaci.",
  loadCommentsFailed: "Komentáře se nepodařilo načíst",
  loadMoreFailed: "Další se nepodařilo načíst",
  tryAgain: "Zkusit znovu",
  sortTop: "Nejlepší",
  sortNew: "Nejnovější",
  sortOld: "Nejstarší",

  // A comment
  reply: "Odpovědět",
  viewMoreReplies: (count: number) =>
    plural(
      count,
      "Zobrazit 1 další odpověď",
      `Zobrazit ${count} další odpovědi`,
      `Zobrazit ${count} dalších odpovědí`,
    ),
  hideReplies: "Skrýt odpovědi",
  removeYourReaction: "Odebrat reakci",
  timeAgo: {
    justNow: "Právě teď",
    minutes: (count: number) =>
      count === 1 ? "před minutou" : `před ${count} minutami`,
    hours: (count: number) =>
      count === 1 ? "před hodinou" : `před ${count} hodinami`,
    days: (count: number) => (count === 1 ? "před dnem" : `před ${count} dny`),
    months: (count: number) =>
      count === 1 ? "před měsícem" : `před ${count} měsíci`,
    years: (count: number) =>
      count === 1 ? "před rokem" : `před ${count} lety`,
  },

  // Comments that can't be shown
  deleted: "[smazáno]",
  removed: "[odstraněno]",
  unavailable: "Tento komentář není dostupný",
  blockedAuthor: "Komentář od uživatele, kterého jste zablokovali",
  showAnyway: "Přesto zobrazit",
  removedByModerator: (reason?: string | null) =>
    `Odstraněno moderátorem${reason ? `: ${reason}` : ""} · vidíte to jen vy`,

  // Menus
  report: "Nahlásit",
  delete: "Smazat",
  deleteCommentTitle: "Smazat komentář",
  confirmDelete: "Opravdu chcete tento komentář smazat?",

  // Report dialog
  reportTitle: "Odeslat hlášení",
  reportIntro:
    "Děkujeme, že dbáte na naši komunitu. Dejte nám vědět, co se děje, a my se na to podíváme.",
  reportReasons: {
    spam: "Je to spam",
    inappropriateContent: "Obsahuje nevhodný obsah",
    harassment: "Jde o obtěžování nebo šikanu",
    misinformation: "Šíří nepravdivé informace",
    hateSpeech: "Obsahuje nenávistné projevy nebo symboly",
    violence: "Propaguje násilí nebo nebezpečné chování",
    illegalActivity: "Propaguje nezákonnou činnost",
    selfHarm: "Propaguje sebepoškozování nebo sebevraždu",
    other: "Jiné",
  } satisfies Record<ReportReasonKey, string>,
  submitReport: "Odeslat hlášení",
  submittingReport: "Odesílání...",

  // Messages
  parentDeleted: "Tento komentář byl smazán, takže na něj nemůžete odpovědět.",
  parentRemoved: "Tento komentář byl odstraněn, takže na něj nemůžete odpovědět.",
  postFailed: "Komentář se nepodařilo odeslat. Zkuste to znovu.",
};

export default strings;
