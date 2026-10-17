import type { ReportReasonKey } from "@sublay/react-js";

// 🌐 Every piece of text the comment section shows. Edit the values here to
// reword or translate it. Entries that depend on a number or a name are
// functions, so each language can use its own plural forms and word order.
const strings = {
  // Inputs
  commentPlaceholder: "Participe da conversa",
  replyPlaceholder: "Escreva sua resposta...",
  cancel: "Cancelar",
  submitComment: "Publicar",
  addGif: "Adicionar um GIF",

  // Comment list
  noCommentsTitle: "Ainda não há comentários",
  noCommentsSubtitle: "Comece a conversa.",
  viewAllComments: "Ver todos os comentários",
  loadMoreComments: "Carregar mais comentários",
  loading: "Carregando...",
  loadCommentsFailed: "Não foi possível carregar os comentários",
  loadMoreFailed: "Não foi possível carregar mais",
  tryAgain: "Tentar novamente",

  // A comment
  reply: "Responder",
  replyCount: (count: number) => count === 1 ? "1 resposta" : `${count} respostas`,
  moreReplyCount: (count: number) =>
    count === 1 ? "mais 1 resposta" : `mais ${count} respostas`,
  moreReplies: "Mais respostas",
  continueThread: "Continuar esta conversa",
  expandThread: "Expandir conversa",
  collapseThread: "Recolher conversa",
  moreOptions: "Mais opções",
  upvote: "Voto positivo",
  downvote: "Voto negativo",
  removeYourVote: "Remover seu voto",

  // Comments that can't be shown
  deleted: "[excluído]",
  removed: "[removido]",
  unavailable: "Este comentário não está disponível",
  blockedAuthor: "Comentário de um usuário que você bloqueou",
  showAnyway: "Mostrar mesmo assim",
  removedByModerator: (reason?: string | null) =>
    `Removido por um moderador${reason ? `: ${reason}` : ""} · só você pode ver`,

  // Mentions
  noUsersFound: "Nenhum usuário encontrado",

  // Menus
  report: "Denunciar",
  remove: "Excluir",
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
  loginRequired: "Faça login para realizar esta ação",
  usernameRequired: "Defina um nome de usuário antes de interagir com os comentários",
  commentEmpty: "O comentário não pode ficar vazio",
  userNotMentionable:
    "Este usuário não pode ser mencionado porque não tem nome de usuário",
  parentDeleted: "Este comentário foi excluído, então não é possível responder a ele.",
  parentRemoved: "Este comentário foi removido, então não é possível responder a ele.",
  postFailed: "Não foi possível publicar seu comentário. Tente novamente.",
};

export default strings;
