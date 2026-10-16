import type { ReportReasonKey } from "@sublay/react-js";

// 🌐 Every piece of text the comment section shows. Edit the values here to
// reword or translate it. Entries that depend on a number or a name are
// functions, so each language can use its own plural forms and word order.
const strings = {
  // Inputs
  commentPlaceholder: "Πάρε μέρος στη συζήτηση",
  replyPlaceholder: "Γράψε την απάντησή σου...",
  cancel: "Ακύρωση",

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
  continueThread: "Συνέχεια του νήματος",
  expandThread: "Ανάπτυξη νήματος",
  collapseThread: "Σύμπτυξη νήματος",
  moreOptions: "Περισσότερες επιλογές",
  upvote: "Υπερψήφιση",
  downvote: "Καταψήφιση",
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
  usernameRequired: "Όρισε ένα όνομα χρήστη για να αλληλεπιδράς με τα σχόλια",
  commentEmpty: "Το σχόλιο δεν μπορεί να είναι κενό",
  userNotMentionable: "Αυτός ο χρήστης δεν μπορεί να επισημανθεί (δεν έχει όνομα χρήστη)",
  parentDeleted: "Αυτό το σχόλιο διαγράφηκε, οπότε δεν μπορείς να απαντήσεις σε αυτό.",
  parentRemoved: "Αυτό το σχόλιο αφαιρέθηκε, οπότε δεν μπορείς να απαντήσεις σε αυτό.",
  postFailed: "Δεν ήταν δυνατή η δημοσίευση του σχολίου σου. Δοκίμασε ξανά.",
};

export default strings;
