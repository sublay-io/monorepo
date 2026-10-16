import type { ReportReasonKey } from "@sublay/react-js";

// 🌐 Every piece of text the comment section shows. Edit the values here to
// reword or translate it. Entries that depend on a number or a name are
// functions, so each language can use its own plural forms and word order.
const strings = {
  // Inputs
  commentPlaceholder: "Γράψε ένα σχόλιο...",
  cancel: "Ακύρωση",
  post: "Δημοσίευση",
  replyingTo: (name: string) => `Απάντηση σε ${name}`,

  // Comment list
  noCommentsTitle: "Δεν υπάρχουν σχόλια ακόμα",
  noCommentsSubtitle: "Ξεκίνα τη συζήτηση.",
  loadMoreComments: "Φόρτωση περισσότερων σχολίων",
  loading: "Φόρτωση...",
  loadCommentsFailed: "Δεν ήταν δυνατή η φόρτωση των σχολίων",
  loadMoreFailed: "Δεν ήταν δυνατή η φόρτωση περισσότερων",
  tryAgain: "Δοκίμασε ξανά",
  sortTop: "Κορυφαία",
  sortNew: "Νεότερα",
  sortOld: "Παλαιότερα",

  // A comment
  reply: "Απάντηση",
  viewMoreReplies: (count: number) =>
    `Προβολή περισσότερων απαντήσεων (${count})`,
  hideReplies: "Απόκρυψη απαντήσεων",
  removeYourReaction: "Αφαίρεση της αντίδρασής σου",
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

  // Comments that can't be shown
  deleted: "[διαγράφηκε]",
  removed: "[αφαιρέθηκε]",
  unavailable: "Αυτό το σχόλιο δεν είναι διαθέσιμο",
  blockedAuthor: "Σχόλιο από χρήστη που έχεις αποκλείσει",
  showAnyway: "Εμφάνιση ούτως ή άλλως",
  removedByModerator: (reason?: string | null) =>
    `Αφαιρέθηκε από συντονιστή${reason ? `: ${reason}` : ""} · το βλέπεις μόνο εσύ`,

  // Menus
  report: "Αναφορά",
  remove: "Διαγραφή",
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
  loginRequired: "Συνδέσου για να κάνεις αυτή την ενέργεια",
  commentEmpty: "Το σχόλιο δεν μπορεί να είναι κενό",
  userNotMentionable:
    "Αυτός ο χρήστης δεν έχει όνομα χρήστη και δεν μπορεί να επισημανθεί",
  parentDeleted: "Αυτό το σχόλιο διαγράφηκε, οπότε δεν μπορείς να απαντήσεις σε αυτό.",
  parentRemoved: "Αυτό το σχόλιο αφαιρέθηκε, οπότε δεν μπορείς να απαντήσεις σε αυτό.",
  postFailed: "Δεν ήταν δυνατή η δημοσίευση του σχολίου σου. Δοκίμασε ξανά.",
};

export default strings;
