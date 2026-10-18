import type { ReportReasonKey } from "@sublay/react-native";

// 🌐 Every piece of text the comment section shows. Edit the values here to
// reword or translate it. Entries that depend on a number or a name are
// functions, so each language can use its own plural forms and word order.
const strings = {
  // Inputs
  commentPlaceholder: "Sumali sa usapan",
  cancel: "Kanselahin",
  replyingTo: "Sumasagot kay",
  cancelReply: "Kanselahin ang sagot",
  collapseThread: "Itiklop ang thread",
  expandThread: "Palawakin ang thread",

  // Sorting
  sortBy: "Ayusin ayon sa",
  sortSheetTitle: "Ayusin ang mga komento ayon sa",
  sortTop: "Nangunguna",
  sortNew: "Bago",
  sortOld: "Luma",
  sortControversial: "Kontrobersyal",

  // When a comment was posted
  timeAgo: {
    justNow: "Ngayon lang",
    minutes: (count: number) =>
      count === 1 ? "isang minuto ang nakalipas" : `${count} minuto ang nakalipas`,
    hours: (count: number) =>
      count === 1 ? "isang oras ang nakalipas" : `${count} oras ang nakalipas`,
    days: (count: number) =>
      count === 1 ? "isang araw ang nakalipas" : `${count} araw ang nakalipas`,
    months: (count: number) =>
      count === 1 ? "isang buwan ang nakalipas" : `${count} buwan ang nakalipas`,
    years: (count: number) =>
      count === 1 ? "isang taon ang nakalipas" : `${count} taon ang nakalipas`,
  },

  // Comment list
  noCommentsTitle: "Wala pang komento",
  noCommentsSubtitle: "Simulan ang usapan.",
  viewAllComments: "Tingnan ang lahat ng komento",
  loadMoreComments: "Mag-load pa ng mga komento",
  loading: "Naglo-load...",
  loadCommentsFailed: "Hindi ma-load ang mga komento",
  loadMoreFailed: "Hindi ma-load ang iba pa",
  tryAgain: "Subukang muli",

  // A comment
  reply: "Sumagot",
  replyCount: (count: number) => `${count} sagot`,
  moreReplyCount: (count: number) => `${count} pang sagot`,
  moreReplies: "Iba pang sagot",
  removeYourVote: "Alisin ang iyong boto",

  // Comments that can't be shown
  deleted: "[binura]",
  removed: "[inalis]",
  unavailable: "Hindi available ang komentong ito",
  blockedAuthor: "Komento mula sa user na na-block mo",
  showAnyway: "Ipakita pa rin",
  removedByModerator: (reason?: string | null) =>
    `Inalis ng isang moderator${reason ? `: ${reason}` : ""} · ikaw lang ang nakakakita nito`,

  // Mentions
  noUsersFound: "Walang nakitang user",

  // Menus
  report: "I-report",
  delete: "Burahin",
  deleteCommentTitle: "Burahin ang komento",
  confirmDelete: "Sigurado ka bang gusto mong burahin ang komentong ito?",

  // Report dialog
  reportTitle: "Magsumite ng report",
  reportIntro:
    "Salamat sa pagbabantay sa aming komunidad. Sabihin sa amin kung ano ang nangyayari, at titingnan namin ito.",
  reportReasons: {
    spam: "Spam ito",
    inappropriateContent: "May hindi angkop na nilalaman",
    harassment: "Panliligalig o pambu-bully ito",
    misinformation: "Nagkakalat ng maling impormasyon",
    hateSpeech: "May mapoot na pananalita o simbolo",
    violence: "Nagtataguyod ng karahasan o mapanganib na gawain",
    illegalActivity: "Nagtataguyod ng ilegal na gawain",
    selfHarm: "Nagtataguyod ng pananakit sa sarili o pagpapakamatay",
    other: "Iba pa",
  } satisfies Record<ReportReasonKey, string>,
  submitReport: "Isumite ang report",
  submittingReport: "Isinusumite...",

  // Messages
  parentDeleted: "Binura na ang komentong ito, kaya hindi mo na ito masasagot.",
  parentRemoved: "Inalis na ang komentong ito, kaya hindi mo na ito masasagot.",
  postFailed: "Hindi ma-post ang iyong komento. Subukang muli.",
};

export default strings;
