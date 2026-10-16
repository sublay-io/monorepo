import type { ReportReasonKey } from "@sublay/react-js";

// Slovak nouns take one of three forms, depending on the number (1, 2–4, other).
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
  commentPlaceholder: "Zapojte sa do konverzácie",
  replyPlaceholder: "Napíšte odpoveď...",
  cancel: "Zrušiť",

  // Comment list
  noCommentsTitle: "Zatiaľ žiadne komentáre",
  noCommentsSubtitle: "Začnite konverzáciu.",
  viewAllComments: "Zobraziť všetky komentáre",
  loadMoreComments: "Načítať ďalšie komentáre",
  loading: "Načítava sa...",
  loadCommentsFailed: "Komentáre sa nepodarilo načítať",
  loadMoreFailed: "Ďalšie sa nepodarilo načítať",
  tryAgain: "Skúsiť znova",

  // A comment
  reply: "Odpovedať",
  replyCount: (count: number) =>
    plural(count, "1 odpoveď", `${count} odpovede`, `${count} odpovedí`),
  moreReplyCount: (count: number) =>
    plural(
      count,
      "ešte 1 odpoveď",
      `ešte ${count} odpovede`,
      `ešte ${count} odpovedí`,
    ),
  moreReplies: "Ďalšie odpovede",
  continueThread: "Pokračovať vo vlákne",
  expandThread: "Rozbaliť vlákno",
  collapseThread: "Zbaliť vlákno",
  moreOptions: "Ďalšie možnosti",
  upvote: "Hlasovať za",
  downvote: "Hlasovať proti",
  removeYourVote: "Odstrániť hlas",

  // Comments that can't be shown
  deleted: "[zmazané]",
  removed: "[odstránené]",
  unavailable: "Tento komentár nie je dostupný",
  blockedAuthor: "Komentár od používateľa, ktorého ste zablokovali",
  showAnyway: "Napriek tomu zobraziť",
  removedByModerator: (reason?: string | null) =>
    `Odstránené moderátorom${reason ? `: ${reason}` : ""} · vidíte to len vy`,

  // Mentions
  noUsersFound: "Nenašli sa žiadni používatelia",

  // Menus
  report: "Nahlásiť",
  remove: "Zmazať",
  confirmDelete: "Naozaj chcete tento komentár zmazať?",

  // Report dialog
  reportTitle: "Odoslať hlásenie",
  reportIntro:
    "Ďakujeme, že dbáte na našu komunitu. Dajte nám vedieť, čo sa deje, a my sa na to pozrieme.",
  reportReasons: {
    spam: "Je to spam",
    inappropriateContent: "Obsahuje nevhodný obsah",
    harassment: "Ide o obťažovanie alebo šikanovanie",
    misinformation: "Šíri nepravdivé informácie",
    hateSpeech: "Obsahuje nenávistné prejavy alebo symboly",
    violence: "Propaguje násilie alebo nebezpečné správanie",
    illegalActivity: "Propaguje nezákonnú činnosť",
    selfHarm: "Propaguje sebapoškodzovanie alebo samovraždu",
    other: "Iné",
  } satisfies Record<ReportReasonKey, string>,
  submitReport: "Odoslať hlásenie",
  submittingReport: "Odosiela sa...",

  // Messages
  loginRequired: "Na vykonanie tejto akcie sa prihláste",
  usernameRequired: "Pred komentovaním si nastavte používateľské meno",
  commentEmpty: "Komentár nemôže byť prázdny",
  userNotMentionable: "Tohto používateľa nemožno označiť (nemá nastavené používateľské meno)",
  parentDeleted: "Tento komentár bol zmazaný, takže naň nemôžete odpovedať.",
  parentRemoved: "Tento komentár bol odstránený, takže naň nemôžete odpovedať.",
  postFailed: "Komentár sa nepodarilo uverejniť. Skúste to znova.",
};

export default strings;
