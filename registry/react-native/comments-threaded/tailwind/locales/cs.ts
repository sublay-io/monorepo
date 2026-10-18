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
  commentPlaceholder: "Zapojte se do konverzace",
  cancel: "Zrušit",
  replyingTo: "Odpověď uživateli",
  cancelReply: "Zrušit odpověď",

  // Sorting
  sortBy: "Seřadit podle",
  sortSheetTitle: "Seřadit komentáře podle",
  sortTop: "Nejlepší",
  sortNew: "Nejnovější",
  sortOld: "Nejstarší",
  sortControversial: "Kontroverzní",

  // Comment list
  noCommentsTitle: "Zatím žádné komentáře",
  noCommentsSubtitle: "Začněte konverzaci.",
  viewAllComments: "Zobrazit všechny komentáře",
  loadMoreComments: "Načíst další komentáře",
  loading: "Načítání...",
  loadCommentsFailed: "Komentáře se nepodařilo načíst",
  loadMoreFailed: "Další se nepodařilo načíst",
  tryAgain: "Zkusit znovu",

  // A comment
  reply: "Odpovědět",
  replyCount: (count: number) =>
    plural(count, "1 odpověď", `${count} odpovědi`, `${count} odpovědí`),
  moreReplyCount: (count: number) =>
    plural(
      count,
      "ještě 1 odpověď",
      `ještě ${count} odpovědi`,
      `ještě ${count} odpovědí`,
    ),
  moreReplies: "Další odpovědi",
  removeYourVote: "Odebrat hlas",

  // Comments that can't be shown
  deleted: "[smazáno]",
  removed: "[odstraněno]",
  unavailable: "Tento komentář není dostupný",
  blockedAuthor: "Komentář od uživatele, kterého jste zablokovali",
  showAnyway: "Přesto zobrazit",
  removedByModerator: (reason?: string | null) =>
    `Odstraněno moderátorem${reason ? `: ${reason}` : ""} · vidíte to jen vy`,

  // Mentions
  noUsersFound: "Nebyli nalezeni žádní uživatelé",

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
