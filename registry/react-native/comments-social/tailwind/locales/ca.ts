import type { ReportReasonKey } from "@sublay/react-native";

// 🌐 Every piece of text the comment section shows. Edit the values here to
// reword or translate it. Entries that depend on a number or a name are
// functions, so each language can use its own plural forms and word order.
const strings = {
  // Inputs
  commentPlaceholder: "Afegeix un comentari...",
  cancel: "Cancel·la",
  post: "Publica",
  replyingTo: (name: string) => `Responent a ${name}`,

  // Comment list
  noCommentsTitle: "Encara no hi ha comentaris",
  noCommentsSubtitle: "Comença la conversa.",
  loadCommentsFailed: "No s'han pogut carregar els comentaris",
  loadMoreFailed: "No se n'han pogut carregar més",
  tryAgain: "Torna-ho a provar",
  sortTop: "Populars",
  sortNew: "Recents",
  sortOld: "Antics",

  // A comment
  reply: "Respon",
  viewMoreReplies: (count: number) =>
    count === 1 ? "Mostra 1 resposta més" : `Mostra ${count} respostes més`,
  hideReplies: "Amaga les respostes",
  removeYourReaction: "Treu la teva reacció",
  timeAgo: {
    justNow: "Ara mateix",
    minutes: (count: number) => count === 1 ? "fa un minut" : `fa ${count} minuts`,
    hours: (count: number) => count === 1 ? "fa una hora" : `fa ${count} hores`,
    days: (count: number) => count === 1 ? "fa un dia" : `fa ${count} dies`,
    months: (count: number) => count === 1 ? "fa un mes" : `fa ${count} mesos`,
    years: (count: number) => count === 1 ? "fa un any" : `fa ${count} anys`,
  },

  // Comments that can't be shown
  deleted: "[suprimit]",
  removed: "[retirat]",
  unavailable: "Aquest comentari no està disponible",
  blockedAuthor: "Comentari d'un usuari que has bloquejat",
  showAnyway: "Mostra'l igualment",
  removedByModerator: (reason?: string | null) =>
    `Retirat per un moderador${reason ? `: ${reason}` : ""} · només tu ho pots veure`,

  // Menus
  report: "Denuncia",
  delete: "Suprimeix",
  deleteCommentTitle: "Suprimeix el comentari",
  confirmDelete: "Segur que vols suprimir aquest comentari?",

  // Report dialog
  reportTitle: "Envia una denúncia",
  reportIntro:
    "Gràcies per vetllar per la nostra comunitat. Explica'ns què passa i ho revisarem.",
  reportReasons: {
    spam: "És spam",
    inappropriateContent: "Conté contingut inadequat",
    harassment: "És assetjament o intimidació",
    misinformation: "Difon informació falsa",
    hateSpeech: "Conté discurs o símbols d'odi",
    violence: "Promou la violència o conductes perilloses",
    illegalActivity: "Promou activitats il·legals",
    selfHarm: "Promou l'autolesió o el suïcidi",
    other: "Altres",
  } satisfies Record<ReportReasonKey, string>,
  submitReport: "Envia la denúncia",
  submittingReport: "S'està enviant...",

  // Messages
  parentDeleted: "Aquest comentari s'ha suprimit, així que no hi pots respondre.",
  parentRemoved: "Aquest comentari s'ha retirat, així que no hi pots respondre.",
  postFailed: "No s'ha pogut publicar el comentari. Torna-ho a provar.",
};

export default strings;
