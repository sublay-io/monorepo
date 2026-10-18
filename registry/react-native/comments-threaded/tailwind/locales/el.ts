import type { ReportReasonKey } from "@sublay/react-native";

// 🌐 Every piece of text the comment section shows. Edit the values here to
// reword or translate it. Entries that depend on a number or a name are
// functions, so each language can use its own plural forms and word order.
const strings = {
  // Inputs
  commentPlaceholder: "Πάρε μέρος στη συζήτηση",
  cancel: "Ακύρωση",
  replyingTo: "Απάντηση σε",
  cancelReply: "Ακύρωση απάντησης",
  collapseThread: "Σύμπτυξη νήματος",
  expandThread: "Ανάπτυξη νήματος",

  // Sorting
  sortBy: "Ταξινόμηση κατά",
  sortSheetTitle: "Ταξινόμηση σχολίων κατά",
  sortTop: "Κορυφαία",
  sortNew: "Νεότερα",
  sortOld: "Παλαιότερα",
  sortControversial: "Αμφιλεγόμενα",

  // When a comment was posted
  timeAgo: {
    justNow: "Μόλις τώρα",
    minutes: (count: number) =>
      count === 1 ? "πριν από ένα λεπτό" : `πριν από ${count} λεπτά`,
    hours: (count: number) =>
      count === 1 ? "πριν από μία ώρα" : `πριν από ${count} ώρες`,
    days: (count: number) =>
      count === 1 ? "πριν από μία μέρα" : `πριν από ${count} μέρες`,
    months: (count: number) =>
      count === 1 ? "πριν από έναν μήνα" : `πριν από ${count} μήνες`,
    years: (count: number) =>
      count === 1 ? "πριν από έναν χρόνο" : `πριν από ${count} χρόνια`,
  },

  // Comment list
  noCommentsTitle: "Δεν υπάρχουν σχόλια ακόμα",
  noCommentsSubtitle: "Ξεκίνα τη συζήτηση.",
  viewAllComments: "Προβολή όλων των σχολίων",
  loadMoreComments: "Φόρτωση περισσότερων σχολίων",
  loading: "Φόρτωση...",
  loadCommentsFailed: "Δεν ήταν δυνατή η φόρτωση των σχολίων",
  loadMoreFailed: "Δεν ήταν δυνατή η φόρτωση περισσότερων",
  tryAgain: "Δοκίμασε ξανά",

  // A comment
  reply: "Απάντηση",
  replyCount: (count: number) =>
    count === 1 ? "1 απάντηση" : `${count} απαντήσεις`,
  moreReplyCount: (count: number) =>
    count === 1 ? "1 ακόμα απάντηση" : `${count} ακόμα απαντήσεις`,
  moreReplies: "Περισσότερες απαντήσεις",
  removeYourVote: "Αφαίρεση της ψήφου σου",

  // Comments that can't be shown
  deleted: "[διαγράφηκε]",
  removed: "[αφαιρέθηκε]",
  unavailable: "Αυτό το σχόλιο δεν είναι διαθέσιμο",
  blockedAuthor: "Σχόλιο από χρήστη που έχεις αποκλείσει",
  showAnyway: "Εμφάνιση ούτως ή άλλως",
  removedByModerator: (reason?: string | null) =>
    `Αφαιρέθηκε από συντονιστή${reason ? `: ${reason}` : ""} · το βλέπεις μόνο εσύ`,

  // Mentions
  noUsersFound: "Δεν βρέθηκαν χρήστες",

  // Menus
  report: "Αναφορά",
  delete: "Διαγραφή",
  deleteCommentTitle: "Διαγραφή σχολίου",
  confirmDelete: "Θέλεις σίγουρα να διαγράψεις αυτό το σχόλιο;",

  // Report dialog
  reportTitle: "Υποβολή αναφοράς",
  reportIntro:
    "Σε ευχαριστούμε που νοιάζεσαι για την κοινότητά μας. Πες μας τι συμβαίνει και θα το εξετάσουμε.",
  reportReasons: {
    spam: "Είναι spam",
    inappropriateContent: "Περιέχει ακατάλληλο περιεχόμενο",
    harassment: "Είναι παρενόχληση ή εκφοβισμός",
    misinformation: "Διαδίδει ψευδείς πληροφορίες",
    hateSpeech: "Περιέχει ρητορική ή σύμβολα μίσους",
    violence: "Προωθεί τη βία ή επικίνδυνη συμπεριφορά",
    illegalActivity: "Προωθεί παράνομη δραστηριότητα",
    selfHarm: "Προωθεί τον αυτοτραυματισμό ή την αυτοκτονία",
    other: "Άλλο",
  } satisfies Record<ReportReasonKey, string>,
  submitReport: "Υποβολή αναφοράς",
  submittingReport: "Υποβολή...",

  // Messages
  parentDeleted: "Αυτό το σχόλιο διαγράφηκε, οπότε δεν μπορείς να απαντήσεις σε αυτό.",
  parentRemoved: "Αυτό το σχόλιο αφαιρέθηκε, οπότε δεν μπορείς να απαντήσεις σε αυτό.",
  postFailed: "Δεν ήταν δυνατή η δημοσίευση του σχολίου σου. Δοκίμασε ξανά.",
};

export default strings;
