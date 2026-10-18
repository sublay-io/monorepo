import type { ReportReasonKey } from "@sublay/react-native";

// 🌐 Every piece of text the comment section shows. Edit the values here to
// reword or translate it. Entries that depend on a number or a name are
// functions, so each language can use its own plural forms and word order.
const strings = {
  // Inputs
  commentPlaceholder: "Participez à la conversation",
  cancel: "Annuler",
  replyingTo: "En réponse à",
  cancelReply: "Annuler la réponse",

  // Sorting
  sortBy: "Trier par",
  sortSheetTitle: "Trier les commentaires par",
  sortTop: "Populaires",
  sortNew: "Récents",
  sortOld: "Anciens",
  sortControversial: "Controversés",

  // When a comment was posted
  timeAgo: {
    justNow: "À l’instant",
    minutes: (count: number) =>
      count === 1 ? "il y a une minute" : `il y a ${count} minutes`,
    hours: (count: number) =>
      count === 1 ? "il y a une heure" : `il y a ${count} heures`,
    days: (count: number) => count === 1 ? "il y a un jour" : `il y a ${count} jours`,
    months: (count: number) => count === 1 ? "il y a un mois" : `il y a ${count} mois`,
    years: (count: number) => count === 1 ? "il y a un an" : `il y a ${count} ans`,
  },

  // Comment list
  noCommentsTitle: "Aucun commentaire pour le moment",
  noCommentsSubtitle: "Lancez la conversation.",
  viewAllComments: "Voir tous les commentaires",
  loadMoreComments: "Charger plus de commentaires",
  loading: "Chargement...",
  loadCommentsFailed: "Impossible de charger les commentaires",
  loadMoreFailed: "Impossible d’en charger plus",
  tryAgain: "Réessayer",

  // A comment
  reply: "Répondre",
  replyCount: (count: number) => count < 2 ? `${count} réponse` : `${count} réponses`,
  moreReplyCount: (count: number) =>
    count < 2 ? `${count} réponse de plus` : `${count} réponses de plus`,
  moreReplies: "Plus de réponses",
  removeYourVote: "Retirer votre vote",

  // Comments that can't be shown
  deleted: "[supprimé]",
  removed: "[retiré]",
  unavailable: "Ce commentaire n’est pas disponible",
  blockedAuthor: "Commentaire d’un utilisateur que vous avez bloqué",
  showAnyway: "Afficher quand même",
  removedByModerator: (reason?: string | null) =>
    `Retiré par un modérateur${reason ? ` : ${reason}` : ""} · visible par vous uniquement`,

  // Mentions
  noUsersFound: "Aucun utilisateur trouvé",

  // Menus
  report: "Signaler",
  delete: "Supprimer",
  deleteCommentTitle: "Supprimer le commentaire",
  confirmDelete: "Voulez-vous vraiment supprimer ce commentaire ?",

  // Report dialog
  reportTitle: "Envoyer un signalement",
  reportIntro:
    "Merci de veiller sur notre communauté. Dites-nous ce qui se passe et nous examinerons la situation.",
  reportReasons: {
    spam: "C’est du spam",
    inappropriateContent: "Contenu inapproprié",
    harassment: "Harcèlement ou intimidation",
    misinformation: "Diffuse de fausses informations",
    hateSpeech: "Discours ou symboles haineux",
    violence: "Incite à la violence ou à des comportements dangereux",
    illegalActivity: "Incite à des activités illégales",
    selfHarm: "Incite à l’automutilation ou au suicide",
    other: "Autre",
  } satisfies Record<ReportReasonKey, string>,
  submitReport: "Envoyer le signalement",
  submittingReport: "Envoi...",

  // Messages
  parentDeleted: "Ce commentaire a été supprimé, vous ne pouvez donc pas y répondre.",
  parentRemoved: "Ce commentaire a été retiré, vous ne pouvez donc pas y répondre.",
  postFailed: "Impossible de publier votre commentaire. Réessayez.",
};

export default strings;
