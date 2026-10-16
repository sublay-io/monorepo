import type { ReportReasonKey } from "@sublay/react-js";

// 🌐 Every piece of text the comment section shows. Edit the values here to
// reword or translate it. Entries that depend on a number or a name are
// functions, so each language can use its own plural forms and word order.
const strings = {
  // Inputs
  commentPlaceholder: "Adiciona um comentário...",
  cancel: "Cancelar",
  post: "Publicar",
  replyingTo: (name: string) => `A responder a ${name}`,

  // Comment list
  noCommentsTitle: "Ainda não há comentários",
  noCommentsSubtitle: "Inicia a conversa.",
  loadMoreComments: "Carregar mais comentários",
  loading: "A carregar...",
  loadCommentsFailed: "Não foi possível carregar os comentários",
  loadMoreFailed: "Não foi possível carregar mais",
  tryAgain: "Tentar novamente",
  sortTop: "Populares",
  sortNew: "Recentes",
  sortOld: "Antigos",

  // A comment
  reply: "Responder",
  viewMoreReplies: (count: number) => `Ver mais respostas (${count})`,
  hideReplies: "Ocultar respostas",
  removeYourReaction: "Remover a tua reação",
  timeAgo: {
    justNow: "Agora mesmo",
    minutes: (count: number) => count === 1 ? "há um minuto" : `há ${count} minutos`,
    hours: (count: number) => count === 1 ? "há uma hora" : `há ${count} horas`,
    days: (count: number) => count === 1 ? "há um dia" : `há ${count} dias`,
    months: (count: number) => count === 1 ? "há um mês" : `há ${count} meses`,
    years: (count: number) => count === 1 ? "há um ano" : `há ${count} anos`,
  },

  // Comments that can't be shown
  deleted: "[eliminado]",
  removed: "[removido]",
  unavailable: "Este comentário não está disponível",
  blockedAuthor: "Comentário de um utilizador que bloqueaste",
  showAnyway: "Mostrar mesmo assim",
  removedByModerator: (reason?: string | null) =>
    `Removido por um moderador${reason ? `: ${reason}` : ""} · só tu podes ver isto`,

  // Menus
  report: "Denunciar",
  remove: "Eliminar",
  confirmDelete: "Tens a certeza de que queres eliminar este comentário?",

  // Report dialog
  reportTitle: "Enviar uma denúncia",
  reportIntro:
    "Obrigado por zelares pela nossa comunidade. Diz-nos o que se passa e nós vamos analisar.",
  reportReasons: {
    spam: "É spam",
    inappropriateContent: "Contém conteúdo inadequado",
    harassment: "É assédio ou bullying",
    misinformation: "Espalha informação falsa",
    hateSpeech: "Contém discurso ou símbolos de ódio",
    violence: "Promove violência ou comportamentos perigosos",
    illegalActivity: "Promove atividades ilegais",
    selfHarm: "Promove a automutilação ou o suicídio",
    other: "Outro",
  } satisfies Record<ReportReasonKey, string>,
  submitReport: "Enviar denúncia",
  submittingReport: "A enviar...",

  // Messages
  loginRequired: "Inicia sessão para realizar esta ação",
  commentEmpty: "O comentário não pode estar vazio",
  userNotMentionable:
    "Este utilizador não pode ser mencionado porque não tem nome de utilizador",
  parentDeleted: "Este comentário foi eliminado, por isso não podes responder-lhe.",
  parentRemoved: "Este comentário foi removido, por isso não podes responder-lhe.",
  postFailed: "Não foi possível publicar o teu comentário. Tenta novamente.",
};

export default strings;
