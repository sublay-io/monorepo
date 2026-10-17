import type { ReportReasonKey } from "@sublay/react-js";

// 🌐 Every piece of text the comment section shows. Edit the values here to
// reword or translate it. Entries that depend on a number or a name are
// functions, so each language can use its own plural forms and word order.
const strings = {
  // Inputs
  commentPlaceholder: "Únete a la conversación",
  replyPlaceholder: "Escribe tu respuesta...",
  cancel: "Cancelar",
  submitComment: "Publicar",
  addGif: "Añadir un GIF",

  // Comment list
  noCommentsTitle: "Aún no hay comentarios",
  noCommentsSubtitle: "Inicia la conversación.",
  viewAllComments: "Ver todos los comentarios",
  loadMoreComments: "Cargar más comentarios",
  loading: "Cargando...",
  loadCommentsFailed: "No se pudieron cargar los comentarios",
  loadMoreFailed: "No se pudieron cargar más",
  tryAgain: "Reintentar",

  // A comment
  reply: "Responder",
  replyCount: (count: number) => count === 1 ? "1 respuesta" : `${count} respuestas`,
  moreReplyCount: (count: number) =>
    count === 1 ? "1 respuesta más" : `${count} respuestas más`,
  moreReplies: "Más respuestas",
  continueThread: "Continuar este hilo",
  expandThread: "Expandir hilo",
  collapseThread: "Contraer hilo",
  moreOptions: "Más opciones",
  upvote: "Voto positivo",
  downvote: "Voto negativo",
  removeYourVote: "Quitar tu voto",

  // Comments that can't be shown
  deleted: "[eliminado]",
  removed: "[retirado]",
  unavailable: "Este comentario no está disponible",
  blockedAuthor: "Comentario de un usuario que bloqueaste",
  showAnyway: "Mostrar de todos modos",
  removedByModerator: (reason?: string | null) =>
    `Retirado por un moderador${reason ? `: ${reason}` : ""} · solo tú puedes verlo`,

  // Mentions
  noUsersFound: "No se encontraron usuarios",

  // Menus
  report: "Denunciar",
  remove: "Eliminar",
  confirmDelete: "¿Seguro que quieres eliminar este comentario?",

  // Report dialog
  reportTitle: "Enviar una denuncia",
  reportIntro:
    "Gracias por cuidar de nuestra comunidad. Cuéntanos qué ocurre y lo revisaremos.",
  reportReasons: {
    spam: "Es spam",
    inappropriateContent: "Contiene contenido inapropiado",
    harassment: "Es acoso o intimidación",
    misinformation: "Difunde información falsa",
    hateSpeech: "Contiene discurso o símbolos de odio",
    violence: "Promueve la violencia o conductas peligrosas",
    illegalActivity: "Promueve actividades ilegales",
    selfHarm: "Promueve la autolesión o el suicidio",
    other: "Otro",
  } satisfies Record<ReportReasonKey, string>,
  submitReport: "Enviar denuncia",
  submittingReport: "Enviando...",

  // Messages
  loginRequired: "Inicia sesión para realizar esta acción",
  usernameRequired:
    "Elige un nombre de usuario antes de interactuar con los comentarios",
  commentEmpty: "El comentario no puede estar vacío",
  userNotMentionable:
    "No se puede mencionar a este usuario porque no tiene nombre de usuario",
  parentDeleted: "Este comentario fue eliminado, así que no puedes responderle.",
  parentRemoved: "Este comentario fue retirado, así que no puedes responderle.",
  postFailed: "No se pudo publicar tu comentario. Inténtalo de nuevo.",
};

export default strings;
