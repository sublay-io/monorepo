import type { ReportReasonKey } from "@sublay/react-native";

// 🌐 Every piece of text the comment section shows. Edit the values here to
// reword or translate it. Entries that depend on a number or a name are
// functions, so each language can use its own plural forms and word order.
const strings = {
  // Inputs
  commentPlaceholder: "Adicione um comentário...",
  cancel: "Cancelar",
  post: "Publicar",
  replyingTo: (name: string) => `Respondendo a ${name}`,

  // Comment list
  noCommentsTitle: "Ainda não há comentários",
  noCommentsSubtitle: "Comece a conversa.",
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
  removeYourReaction: "Remover sua reação",
  timeAgo: {
    justNow: "Agora mesmo",
    minutes: (count: number) => count === 1 ? "há um minuto" : `há ${count} minutos`,
    hours: (count: number) => count === 1 ? "há uma hora" : `há ${count} horas`,
    days: (count: number) => count === 1 ? "há um dia" : `há ${count} dias`,
    months: (count: number) => count === 1 ? "há um mês" : `há ${count} meses`,
    years: (count: number) => count === 1 ? "há um ano" : `há ${count} anos`,
  },

  // Comments that can't be shown
  deleted: "[excluído]",
  removed: "[removido]",
  unavailable: "Este comentário não está disponível",
  blockedAuthor: "Comentário de um usuário que você bloqueou",
  showAnyway: "Mostrar mesmo assim",
  removedByModerator: (reason?: string | null) =>
    `Removido por um moderador${reason ? `: ${reason}` : ""} · só você pode ver`,

  // Menus
  report: "Denunciar",
  delete: "Excluir",
  deleteCommentTitle: "Excluir comentário",
  confirmDelete: "Tem certeza de que deseja excluir este comentário?",

  // Report dialog
  reportTitle: "Enviar uma denúncia",
  reportIntro:
    "Obrigado por cuidar da nossa comunidade. Conte o que está acontecendo e vamos analisar.",
  reportReasons: {
    spam: "É spam",
    inappropriateContent: "Contém conteúdo inadequado",
    harassment: "É assédio ou bullying",
    misinformation: "Espalha informações falsas",
    hateSpeech: "Contém discurso ou símbolos de ódio",
    violence: "Promove violência ou comportamento perigoso",
    illegalActivity: "Promove atividades ilegais",
    selfHarm: "Promove automutilação ou suicídio",
    other: "Outro",
  } satisfies Record<ReportReasonKey, string>,
  submitReport: "Enviar denúncia",
  submittingReport: "Enviando...",

  // Messages
  parentDeleted: "Este comentário foi excluído, então não é possível responder a ele.",
  parentRemoved: "Este comentário foi removido, então não é possível responder a ele.",
  postFailed: "Não foi possível publicar seu comentário. Tente novamente.",
};

export default strings;
