import type { ReportReasonKey } from "@sublay/react-js";

// 🌐 Every piece of text the comment section shows. Edit the values here to
// reword or translate it. Entries that depend on a number or a name are
// functions, so each language can use its own plural forms and word order.
const strings = {
  // Inputs
  commentPlaceholder: "Participa en la conversa",
  replyPlaceholder: "Escriu la teva resposta...",
  cancel: "Cancel·la",
  submitComment: "Publica",
  addGif: "Afegeix un GIF",

  // Sorting
  sortBy: "Ordena per",
  sortTop: "Populars",
  sortNew: "Recents",
  sortOld: "Antics",
  sortControversial: "Polèmics",

  // When a comment was posted
  timeAgo: {
    justNow: "Ara mateix",
    minutes: (count: number) => count === 1 ? "fa un minut" : `fa ${count} minuts`,
    hours: (count: number) => count === 1 ? "fa una hora" : `fa ${count} hores`,
    days: (count: number) => count === 1 ? "fa un dia" : `fa ${count} dies`,
    months: (count: number) => count === 1 ? "fa un mes" : `fa ${count} mesos`,
    years: (count: number) => count === 1 ? "fa un any" : `fa ${count} anys`,
  },

  // Comment list
  noCommentsTitle: "Encara no hi ha comentaris",
  noCommentsSubtitle: "Comença la conversa.",
  viewAllComments: "Mostra tots els comentaris",
  loadMoreComments: "Carrega més comentaris",
  loading: "S'està carregant...",
  loadCommentsFailed: "No s'han pogut carregar els comentaris",
  loadMoreFailed: "No se n'han pogut carregar més",
  tryAgain: "Torna-ho a provar",

  // A comment
  reply: "Respon",
  replyCount: (count: number) => count === 1 ? "1 resposta" : `${count} respostes`,
  moreReplyCount: (count: number) =>
    count === 1 ? "1 resposta més" : `${count} respostes més`,
  moreReplies: "Més respostes",
  expandThread: "Desplega el fil",
  collapseThread: "Plega el fil",
  moreOptions: "Més opcions",
  upvote: "Vota a favor",
  downvote: "Vota en contra",
  removeYourVote: "Treu el teu vot",

  // Comments that can't be shown
  deleted: "[suprimit]",
  removed: "[retirat]",
  unavailable: "Aquest comentari no està disponible",
  blockedAuthor: "Comentari d'un usuari que has bloquejat",
  showAnyway: "Mostra'l igualment",
  removedByModerator: (reason?: string | null) =>
    `Retirat per un moderador${reason ? `: ${reason}` : ""} · només tu ho pots veure`,

  // Mentions
  noUsersFound: "No s'ha trobat cap usuari",

  // Menus
  report: "Denuncia",
  remove: "Suprimeix",
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
  loginRequired: "Inicia la sessió per fer aquesta acció",
  usernameRequired: "Defineix un nom d'usuari abans d'interactuar amb els comentaris",
  commentEmpty: "El comentari no pot estar buit",
  userNotMentionable: "No es pot esmentar aquest usuari (no té nom d'usuari)",
  parentDeleted: "Aquest comentari s'ha suprimit, així que no hi pots respondre.",
  parentRemoved: "Aquest comentari s'ha retirat, així que no hi pots respondre.",
  postFailed: "No s'ha pogut publicar el comentari. Torna-ho a provar.",
};

export default strings;
