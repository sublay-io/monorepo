import type { ReportReasonKey } from "@sublay/react-js";

// 🌐 Every piece of text the comment section shows. Edit the values here to
// reword or translate it. Entries that depend on a number or a name are
// functions, so each language can use its own plural forms and word order.
const strings = {
  // Inputs
  commentPlaceholder: "Magdagdag ng komento...",
  cancel: "Kanselahin",
  post: "I-post",
  replyingTo: (name: string) => `Sumasagot kay ${name}`,

  // Comment list
  noCommentsTitle: "Wala pang komento",
  noCommentsSubtitle: "Simulan ang usapan.",
  loadMoreComments: "Mag-load pa ng mga komento",
  loading: "Naglo-load...",
  loadCommentsFailed: "Hindi ma-load ang mga komento",
  loadMoreFailed: "Hindi ma-load ang iba pa",
  tryAgain: "Subukang muli",
  sortTop: "Nangunguna",
  sortNew: "Bago",
  sortOld: "Luma",

  // A comment
  reply: "Sumagot",
  viewMoreReplies: (count: number) => `Tingnan pa ang mga sagot (${count})`,
  hideReplies: "Itago ang mga sagot",
  removeYourReaction: "Alisin ang iyong reaksyon",
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

  // Comments that can't be shown
  deleted: "[binura]",
  removed: "[inalis]",
  unavailable: "Hindi available ang komentong ito",
  blockedAuthor: "Komento mula sa user na na-block mo",
  showAnyway: "Ipakita pa rin",
  removedByModerator: (reason?: string | null) =>
    `Inalis ng isang moderator${reason ? `: ${reason}` : ""} · ikaw lang ang nakakakita nito`,

  // Menus
  report: "I-report",
  remove: "Burahin",
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
  loginRequired: "Mag-log in para magawa ito",
  commentEmpty: "Hindi puwedeng walang laman ang komento",
  userNotMentionable:
    "Walang username ang user na ito kaya hindi siya puwedeng i-mention",
  parentDeleted: "Binura na ang komentong ito, kaya hindi mo na ito masasagot.",
  parentRemoved: "Inalis na ang komentong ito, kaya hindi mo na ito masasagot.",
  postFailed: "Hindi ma-post ang iyong komento. Subukang muli.",
};

export default strings;
