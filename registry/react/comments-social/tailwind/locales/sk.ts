import type { ReportReasonKey } from "@sublay/react-js";

// 🌐 Every piece of text the comment section shows. Edit the values here to
// reword or translate it. Entries that depend on a number or a name are
// functions, so each language can use its own plural forms and word order.
const strings = {
  // Inputs
  commentPlaceholder: "Pridajte komentár...",
  cancel: "Zrušiť",
  post: "Uverejniť",
  replyingTo: (name: string) => `Odpoveď používateľovi ${name}`,

  // Comment list
  noCommentsTitle: "Zatiaľ žiadne komentáre",
  noCommentsSubtitle: "Začnite konverzáciu.",
  loadMoreComments: "Načítať ďalšie komentáre",
  loading: "Načítava sa...",
  loadCommentsFailed: "Komentáre sa nepodarilo načítať",
  loadMoreFailed: "Ďalšie sa nepodarilo načítať",
  tryAgain: "Skúsiť znova",
  sortTop: "Najlepšie",
  sortNew: "Najnovšie",
  sortOld: "Najstaršie",

  // A comment
  reply: "Odpovedať",
  viewMoreReplies: (count: number) => `Zobraziť ďalšie odpovede (${count})`,
  hideReplies: "Skryť odpovede",
  removeYourReaction: "Odstrániť reakciu",
  timeAgo: {
    justNow: "Práve teraz",
    minutes: (count: number) =>
      count === 1 ? "pred minútou" : `pred ${count} minútami`,
    hours: (count: number) =>
      count === 1 ? "pred hodinou" : `pred ${count} hodinami`,
    days: (count: number) => (count === 1 ? "pred dňom" : `pred ${count} dňami`),
    months: (count: number) =>
      count === 1 ? "pred mesiacom" : `pred ${count} mesiacmi`,
    years: (count: number) =>
      count === 1 ? "pred rokom" : `pred ${count} rokmi`,
  },

  // Comments that can't be shown
  deleted: "[zmazané]",
  removed: "[odstránené]",
  unavailable: "Tento komentár nie je dostupný",
  blockedAuthor: "Komentár od používateľa, ktorého ste zablokovali",
  showAnyway: "Napriek tomu zobraziť",
  removedByModerator: (reason?: string | null) =>
    `Odstránené moderátorom${reason ? `: ${reason}` : ""} · vidíte to len vy`,

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
  commentEmpty: "Komentár nemôže byť prázdny",
  userNotMentionable:
    "Tento používateľ nemá používateľské meno, a preto ho nemožno označiť",
  parentDeleted: "Tento komentár bol zmazaný, takže naň nemôžete odpovedať.",
  parentRemoved: "Tento komentár bol odstránený, takže naň nemôžete odpovedať.",
  postFailed: "Komentár sa nepodarilo uverejniť. Skúste to znova.",
};

export default strings;
