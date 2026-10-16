import type { ReportReasonKey } from "@sublay/react-js";

// 🌐 Every piece of text the comment section shows. Edit the values here to
// reword or translate it. Entries that depend on a number or a name are
// functions, so each language can use its own plural forms and word order.
const strings = {
  // Inputs
  commentPlaceholder: "Ajouter un commentaire...",
  cancel: "Annuler",
  post: "Publier",
  replyingTo: (name: string) => `En réponse à ${name}`,

  // Comment list
  noCommentsTitle: "Aucun commentaire pour le moment",
  noCommentsSubtitle: "Lancez la conversation.",
  loadMoreComments: "Charger plus de commentaires",
  loading: "Chargement...",
  loadCommentsFailed: "Impossible de charger les commentaires",
  loadMoreFailed: "Impossible d’en charger plus",
  tryAgain: "Réessayer",
  sortTop: "Populaires",
  sortNew: "Récents",
  sortOld: "Anciens",

  // A comment
  reply: "Répondre",
  viewMoreReplies: (count: number) => `Voir plus de réponses (${count})`,
  hideReplies: "Masquer les réponses",
  removeYourReaction: "Retirer votre réaction",
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

  // Comments that can't be shown
  deleted: "[supprimé]",
  removed: "[retiré]",
  unavailable: "Ce commentaire n’est pas disponible",
  blockedAuthor: "Commentaire d’un utilisateur que vous avez bloqué",
  showAnyway: "Afficher quand même",
  removedByModerator: (reason?: string | null) =>
    `Retiré par un modérateur${reason ? ` : ${reason}` : ""} · visible par vous uniquement`,

  // Menus
  report: "Signaler",
  remove: "Supprimer",
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
  loginRequired: "Connectez-vous pour effectuer cette action",
  commentEmpty: "Le commentaire ne peut pas être vide",
  userNotMentionable:
    "Cet utilisateur ne peut pas être mentionné, car il n’a pas de nom d’utilisateur",
  parentDeleted: "Ce commentaire a été supprimé, vous ne pouvez donc pas y répondre.",
  parentRemoved: "Ce commentaire a été retiré, vous ne pouvez donc pas y répondre.",
  postFailed: "Impossible de publier votre commentaire. Réessayez.",
};

export default strings;
