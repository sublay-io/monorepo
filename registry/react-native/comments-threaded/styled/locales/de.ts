import type { ReportReasonKey } from "@sublay/react-native";

// 🌐 Every piece of text the comment section shows. Edit the values here to
// reword or translate it. Entries that depend on a number or a name are
// functions, so each language can use its own plural forms and word order.
const strings = {
  // Inputs
  commentPlaceholder: "Beteilige dich an der Unterhaltung",
  cancel: "Abbrechen",
  replyingTo: "Antwort an",
  cancelReply: "Antwort abbrechen",
  moreOptions: "Weitere Optionen",
  collapseThread: "Thread einklappen",
  expandThread: "Thread ausklappen",

  // Sorting
  sortBy: "Sortieren nach",
  sortSheetTitle: "Kommentare sortieren nach",
  sortTop: "Top",
  sortNew: "Neu",
  sortOld: "Alt",
  sortControversial: "Kontrovers",

  // When a comment was posted
  timeAgo: {
    justNow: "Gerade eben",
    minutes: (count: number) =>
      count === 1 ? "vor einer Minute" : `vor ${count} Minuten`,
    hours: (count: number) => count === 1 ? "vor einer Stunde" : `vor ${count} Stunden`,
    days: (count: number) => count === 1 ? "vor einem Tag" : `vor ${count} Tagen`,
    months: (count: number) => count === 1 ? "vor einem Monat" : `vor ${count} Monaten`,
    years: (count: number) => count === 1 ? "vor einem Jahr" : `vor ${count} Jahren`,
  },

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
  delete: "Löschen",
  deleteCommentTitle: "Kommentar löschen",
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
  parentDeleted:
    "Dieser Kommentar wurde gelöscht, daher kannst du nicht darauf antworten.",
  parentRemoved:
    "Dieser Kommentar wurde entfernt, daher kannst du nicht darauf antworten.",
  postFailed: "Dein Kommentar konnte nicht veröffentlicht werden. Versuche es erneut.",
};

export default strings;
