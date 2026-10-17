import type { ReportReasonKey } from "@sublay/react-js";

// 🌐 Every piece of text the comment section shows. Edit the values here to
// reword or translate it. Entries that depend on a number or a name are
// functions, so each language can use its own plural forms and word order.
const strings = {
  // Inputs
  commentPlaceholder: "Delta i samtalet",
  replyPlaceholder: "Skriv ditt svar...",
  cancel: "Avbryt",
  submitComment: "Publicera",
  addGif: "Lägg till en GIF",

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
  continueThread: "Fortsätt tråden",
  expandThread: "Fäll ut tråden",
  collapseThread: "Fäll ihop tråden",
  moreOptions: "Fler alternativ",
  upvote: "Rösta upp",
  downvote: "Rösta ner",
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
  remove: "Radera",
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
  loginRequired: "Logga in för att utföra den här åtgärden",
  usernameRequired: "Välj ett användarnamn innan du interagerar med kommentarer",
  commentEmpty: "Kommentaren får inte vara tom",
  userNotMentionable: "Den här användaren kan inte nämnas (inget användarnamn valt)",
  parentDeleted: "Den här kommentaren har raderats, så du kan inte svara på den.",
  parentRemoved: "Den här kommentaren har tagits bort, så du kan inte svara på den.",
  postFailed: "Det gick inte att publicera din kommentar. Försök igen.",
};

export default strings;
