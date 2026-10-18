import type { ReportReasonKey } from "@sublay/react-native";

// 🌐 Every piece of text the comment section shows. Edit the values here to
// reword or translate it. Entries that depend on a number or a name are
// functions, so each language can use its own plural forms and word order.
const strings = {
  // Inputs
  commentPlaceholder: "Delta i samtalet",
  cancel: "Avbryt",
  replyingTo: "Svarar",
  cancelReply: "Avbryt svar",
  moreOptions: "Fler alternativ",
  collapseThread: "Fäll ihop tråden",
  expandThread: "Fäll ut tråden",

  // Sorting
  sortBy: "Sortera efter",
  sortSheetTitle: "Sortera kommentarer efter",
  sortTop: "Topp",
  sortNew: "Nyast",
  sortOld: "Äldst",
  sortControversial: "Kontroversiella",

  // When a comment was posted
  timeAgo: {
    justNow: "Just nu",
    minutes: (count: number) =>
      count === 1 ? "för en minut sedan" : `för ${count} minuter sedan`,
    hours: (count: number) =>
      count === 1 ? "för en timme sedan" : `för ${count} timmar sedan`,
    days: (count: number) =>
      count === 1 ? "för en dag sedan" : `för ${count} dagar sedan`,
    months: (count: number) =>
      count === 1 ? "för en månad sedan" : `för ${count} månader sedan`,
    years: (count: number) =>
      count === 1 ? "för ett år sedan" : `för ${count} år sedan`,
  },

  // Comment list
  noCommentsTitle: "Inga kommentarer än",
  noCommentsSubtitle: "Starta samtalet.",
  viewAllComments: "Visa alla kommentarer",
  loadMoreComments: "Läs in fler kommentarer",
  loading: "Läser in...",
  loadCommentsFailed: "Det gick inte att läsa in kommentarerna",
  loadMoreFailed: "Det gick inte att läsa in fler",
  tryAgain: "Försök igen",

  // A comment
  reply: "Svara",
  replyCount: (count: number) => `${count} svar`,
  moreReplyCount: (count: number) => `${count} svar till`,
  moreReplies: "Fler svar",
  removeYourVote: "Ta bort din röst",

  // Comments that can't be shown
  deleted: "[raderad]",
  removed: "[borttagen]",
  unavailable: "Den här kommentaren är inte tillgänglig",
  blockedAuthor: "Kommentar från en användare du har blockerat",
  showAnyway: "Visa ändå",
  removedByModerator: (reason?: string | null) =>
    `Borttagen av en moderator${reason ? `: ${reason}` : ""} · bara du kan se detta`,

  // Mentions
  noUsersFound: "Inga användare hittades",

  // Menus
  report: "Rapportera",
  delete: "Radera",
  deleteCommentTitle: "Radera kommentar",
  confirmDelete: "Vill du verkligen radera den här kommentaren?",

  // Report dialog
  reportTitle: "Skicka en rapport",
  reportIntro:
    "Tack för att du hjälper till att hålla koll på vår community. Berätta vad som händer, så tittar vi på det.",
  reportReasons: {
    spam: "Det är spam",
    inappropriateContent: "Innehåller olämpligt material",
    harassment: "Det är trakasserier eller mobbning",
    misinformation: "Sprider falsk information",
    hateSpeech: "Innehåller hatretorik eller hatsymboler",
    violence: "Uppmuntrar till våld eller farligt beteende",
    illegalActivity: "Uppmuntrar till olaglig verksamhet",
    selfHarm: "Uppmuntrar till självskada eller självmord",
    other: "Annat",
  } satisfies Record<ReportReasonKey, string>,
  submitReport: "Skicka rapport",
  submittingReport: "Skickar...",

  // Messages
  parentDeleted: "Den här kommentaren har raderats, så du kan inte svara på den.",
  parentRemoved: "Den här kommentaren har tagits bort, så du kan inte svara på den.",
  postFailed: "Det gick inte att publicera din kommentar. Försök igen.",
};

export default strings;
