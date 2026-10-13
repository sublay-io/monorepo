import type { ReportReasonKey } from "@sublay/react-js";

// 🌐 Every piece of text the comment section shows. Edit the values here to
// reword or translate it. Entries that depend on a number or a name are
// functions, so each language can use its own plural forms and word order.
const strings = {
  // Inputs
  commentPlaceholder: "Añade un comentario...",
  cancel: "Cancelar",
  post: "Publicar",
  replyingTo: (name: string) => `Respondiendo a ${name}`,

  // Comment list
  noCommentsTitle: "Aún no hay comentarios",
  noCommentsSubtitle: "Inicia la conversación.",
  loadMoreComments: "Cargar más comentarios",
  loading: "Cargando...",
  loadCommentsFailed: "No se pudieron cargar los comentarios",
  loadMoreFailed: "No se pudieron cargar más",
  tryAgain: "Reintentar",
  sortTop: "Destacados",
  sortNew: "Recientes",
  sortOld: "Antiguos",

  // A comment
  reply: "Responder",
  viewMoreReplies: (count: number) => `Ver más respuestas (${count})`,
  hideReplies: "Ocultar respuestas",
  removeYourReaction: "Quitar tu reacción",
  timeAgo: {
    justNow: "Ahora mismo",
    minutes: (count: number) =>
      count === 1 ? "hace un minuto" : `hace ${count} minutos`,
    hours: (count: number) => count === 1 ? "hace una hora" : `hace ${count} horas`,
    days: (count: number) => count === 1 ? "hace un día" : `hace ${count} días`,
    months: (count: number) => count === 1 ? "hace un mes" : `hace ${count} meses`,
    years: (count: number) => count === 1 ? "hace un año" : `hace ${count} años`,
  },

  // Comments that can't be shown
  deleted: "[eliminado]",
  removed: "[retirado]",
  unavailable: "Este comentario no está disponible",
  blockedAuthor: "Comentario de un usuario que bloqueaste",
  showAnyway: "Mostrar de todos modos",
  removedByModerator: (reason?: string | null) =>
    `Retirado por un moderador${reason ? `: ${reason}` : ""} · solo tú puedes verlo`,

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
  commentEmpty: "El comentario no puede estar vacío",
  userNotMentionable:
    "No se puede mencionar a este usuario porque no tiene nombre de usuario",
  parentDeleted: "Este comentario fue eliminado, así que no puedes responderle.",
  parentRemoved: "Este comentario fue retirado, así que no puedes responderle.",
  postFailed: "No se pudo publicar tu comentario. Inténtalo de nuevo.",
};

export default strings;
