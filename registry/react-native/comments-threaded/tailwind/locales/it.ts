import type { ReportReasonKey } from "@sublay/react-native";

// 🌐 Every piece of text the comment section shows. Edit the values here to
// reword or translate it. Entries that depend on a number or a name are
// functions, so each language can use its own plural forms and word order.
const strings = {
  // Inputs
  commentPlaceholder: "Partecipa alla conversazione",
  cancel: "Annulla",
  replyingTo: "In risposta a",
  cancelReply: "Annulla risposta",

  // Sorting
  sortBy: "Ordina per",
  sortSheetTitle: "Ordina i commenti per",
  sortTop: "Popolari",
  sortNew: "Recenti",
  sortOld: "Meno recenti",
  sortControversial: "Controversi",

  // When a comment was posted
  timeAgo: {
    justNow: "Proprio ora",
    minutes: (count: number) => count === 1 ? "un minuto fa" : `${count} minuti fa`,
    hours: (count: number) => count === 1 ? "un’ora fa" : `${count} ore fa`,
    days: (count: number) => count === 1 ? "un giorno fa" : `${count} giorni fa`,
    months: (count: number) => count === 1 ? "un mese fa" : `${count} mesi fa`,
    years: (count: number) => count === 1 ? "un anno fa" : `${count} anni fa`,
  },

  // Comment list
  noCommentsTitle: "Ancora nessun commento",
  noCommentsSubtitle: "Inizia la conversazione.",
  viewAllComments: "Vedi tutti i commenti",
  loadMoreComments: "Carica altri commenti",
  loading: "Caricamento...",
  loadCommentsFailed: "Impossibile caricare i commenti",
  loadMoreFailed: "Impossibile caricarne altri",
  tryAgain: "Riprova",

  // A comment
  reply: "Rispondi",
  replyCount: (count: number) => count === 1 ? "1 risposta" : `${count} risposte`,
  moreReplyCount: (count: number) =>
    count === 1 ? "1 altra risposta" : `altre ${count} risposte`,
  moreReplies: "Altre risposte",
  removeYourVote: "Rimuovi il tuo voto",

  // Comments that can't be shown
  deleted: "[eliminato]",
  removed: "[rimosso]",
  unavailable: "Questo commento non è disponibile",
  blockedAuthor: "Commento di un utente che hai bloccato",
  showAnyway: "Mostra comunque",
  removedByModerator: (reason?: string | null) =>
    `Rimosso da un moderatore${reason ? `: ${reason}` : ""} · visibile solo a te`,

  // Mentions
  noUsersFound: "Nessun utente trovato",

  // Menus
  report: "Segnala",
  delete: "Elimina",
  deleteCommentTitle: "Elimina commento",
  confirmDelete: "Vuoi davvero eliminare questo commento?",

  // Report dialog
  reportTitle: "Invia una segnalazione",
  reportIntro:
    "Grazie per l’attenzione verso la nostra community. Dicci cosa sta succedendo e daremo un’occhiata.",
  reportReasons: {
    spam: "È spam",
    inappropriateContent: "Contiene contenuti inappropriati",
    harassment: "Molestie o bullismo",
    misinformation: "Diffonde informazioni false",
    hateSpeech: "Contiene incitamento all’odio o simboli d’odio",
    violence: "Promuove violenza o comportamenti pericolosi",
    illegalActivity: "Promuove attività illegali",
    selfHarm: "Promuove autolesionismo o suicidio",
    other: "Altro",
  } satisfies Record<ReportReasonKey, string>,
  submitReport: "Invia segnalazione",
  submittingReport: "Invio...",

  // Messages
  parentDeleted: "Questo commento è stato eliminato, quindi non puoi rispondere.",
  parentRemoved: "Questo commento è stato rimosso, quindi non puoi rispondere.",
  postFailed: "Impossibile pubblicare il commento. Riprova.",
};

export default strings;
