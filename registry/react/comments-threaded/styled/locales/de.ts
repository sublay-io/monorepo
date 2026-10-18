import type { ReportReasonKey } from "@sublay/react-js";

// 🌐 Every piece of text the comment section shows. Edit the values here to
// reword or translate it. Entries that depend on a number or a name are
// functions, so each language can use its own plural forms and word order.
const strings = {
  // Inputs
  commentPlaceholder: "Beteilige dich an der Unterhaltung",
  replyPlaceholder: "Antwort schreiben...",
  cancel: "Abbrechen",
  submitComment: "Posten",
  addGif: "GIF hinzufügen",

  // Sorting
  sortBy: "Sortieren nach",
  sortTop: "Top",
  sortNew: "Neu",
  sortOld: "Alt",
  sortControversial: "Kontrovers",

  // Comment list
  noCommentsTitle: "Noch keine Kommentare",
  noCommentsSubtitle: "Beginne die Unterhaltung.",
  viewAllComments: "Alle Kommentare anzeigen",
  loadMoreComments: "Weitere Kommentare laden",
  loading: "Wird geladen...",
  loadCommentsFailed: "Kommentare konnten nicht geladen werden",
  loadMoreFailed: "Weitere konnten nicht geladen werden",
  tryAgain: "Erneut versuchen",

  // A comment
  reply: "Antworten",
  replyCount: (count: number) => count === 1 ? "1 Antwort" : `${count} Antworten`,
  moreReplyCount: (count: number) =>
    count === 1 ? "1 weitere Antwort" : `${count} weitere Antworten`,
  moreReplies: "Weitere Antworten",
  expandThread: "Thread ausklappen",
  collapseThread: "Thread einklappen",
  moreOptions: "Weitere Optionen",
  upvote: "Positiv bewerten",
  downvote: "Negativ bewerten",
  removeYourVote: "Bewertung entfernen",

  // Comments that can't be shown
  deleted: "[gelöscht]",
  removed: "[entfernt]",
  unavailable: "Dieser Kommentar ist nicht verfügbar",
  blockedAuthor: "Kommentar von einem Nutzer, den du blockiert hast",
  showAnyway: "Trotzdem anzeigen",
  removedByModerator: (reason?: string | null) =>
    `Von einem Moderator entfernt${reason ? `: ${reason}` : ""} · nur für dich sichtbar`,

  // Mentions
  noUsersFound: "Keine Nutzer gefunden",

  // Menus
  report: "Melden",
  remove: "Löschen",
  confirmDelete: "Möchtest du diesen Kommentar wirklich löschen?",

  // Report dialog
  reportTitle: "Meldung senden",
  reportIntro:
    "Danke, dass du auf unsere Community achtest. Sag uns, was los ist, und wir sehen es uns an.",
  reportReasons: {
    spam: "Es ist Spam",
    inappropriateContent: "Enthält unangemessene Inhalte",
    harassment: "Belästigung oder Mobbing",
    misinformation: "Verbreitet Falschinformationen",
    hateSpeech: "Enthält Hassrede oder Hasssymbole",
    violence: "Fördert Gewalt oder gefährliches Verhalten",
    illegalActivity: "Fördert illegale Aktivitäten",
    selfHarm: "Fördert Selbstverletzung oder Suizid",
    other: "Sonstiges",
  } satisfies Record<ReportReasonKey, string>,
  submitReport: "Meldung senden",
  submittingReport: "Wird gesendet...",

  // Messages
  loginRequired: "Bitte melde dich an, um diese Aktion auszuführen",
  usernameRequired:
    "Lege einen Benutzernamen fest, bevor du mit Kommentaren interagierst",
  commentEmpty: "Der Kommentar darf nicht leer sein",
  userNotMentionable:
    "Dieser Nutzer kann nicht erwähnt werden, da er keinen Benutzernamen hat",
  parentDeleted:
    "Dieser Kommentar wurde gelöscht, daher kannst du nicht darauf antworten.",
  parentRemoved:
    "Dieser Kommentar wurde entfernt, daher kannst du nicht darauf antworten.",
  postFailed: "Dein Kommentar konnte nicht veröffentlicht werden. Versuche es erneut.",
};

export default strings;
