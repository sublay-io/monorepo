import type { ReportReasonKey } from "@sublay/react-js";

// 🌐 Every piece of text the comment section shows. Edit the values here to
// reword or translate it. Entries that depend on a number or a name are
// functions, so each language can use its own plural forms and word order.
const strings = {
  // Inputs
  commentPlaceholder: "Jiunge na mazungumzo",
  replyPlaceholder: "Andika jibu lako...",
  cancel: "Ghairi",
  submitComment: "Chapisha",
  addGif: "Ongeza GIF",

  // Sorting
  sortBy: "Panga kwa",
  sortTop: "Maarufu",
  sortNew: "Mapya",
  sortOld: "Ya zamani",
  sortControversial: "Zenye utata",

  // When a comment was posted
  timeAgo: {
    justNow: "Sasa hivi",
    minutes: (count: number) =>
      count === 1 ? "dakika moja iliyopita" : `dakika ${count} zilizopita`,
    hours: (count: number) =>
      count === 1 ? "saa moja iliyopita" : `saa ${count} zilizopita`,
    days: (count: number) =>
      count === 1 ? "siku moja iliyopita" : `siku ${count} zilizopita`,
    months: (count: number) =>
      count === 1 ? "mwezi mmoja uliopita" : `miezi ${count} iliyopita`,
    years: (count: number) =>
      count === 1 ? "mwaka mmoja uliopita" : `miaka ${count} iliyopita`,
  },

  // Comment list
  noCommentsTitle: "Bado hakuna maoni",
  noCommentsSubtitle: "Anzisha mazungumzo.",
  viewAllComments: "Tazama maoni yote",
  loadMoreComments: "Pakia maoni zaidi",
  loading: "Inapakia...",
  loadCommentsFailed: "Imeshindwa kupakia maoni",
  loadMoreFailed: "Imeshindwa kupakia zaidi",
  tryAgain: "Jaribu tena",

  // A comment
  reply: "Jibu",
  replyCount: (count: number) =>
    count === 1 ? "jibu 1" : `majibu ${count}`,
  moreReplyCount: (count: number) =>
    count === 1 ? "jibu 1 zaidi" : `majibu ${count} zaidi`,
  moreReplies: "Majibu zaidi",
  expandThread: "Panua mjadala",
  collapseThread: "Kunja mjadala",
  moreOptions: "Chaguo zaidi",
  upvote: "Pigia kura juu",
  downvote: "Pigia kura chini",
  removeYourVote: "Ondoa kura yako",

  // Comments that can't be shown
  deleted: "[imefutwa]",
  removed: "[imeondolewa]",
  unavailable: "Maoni haya hayapatikani",
  blockedAuthor: "Maoni kutoka kwa mtumiaji uliyemzuia",
  showAnyway: "Onyesha hata hivyo",
  removedByModerator: (reason?: string | null) =>
    `Yameondolewa na msimamizi${reason ? `: ${reason}` : ""} · ni wewe tu unayeweza kuyaona`,

  // Mentions
  noUsersFound: "Hakuna watumiaji waliopatikana",

  // Menus
  report: "Ripoti",
  remove: "Futa",
  confirmDelete: "Una uhakika unataka kufuta maoni haya?",

  // Report dialog
  reportTitle: "Tuma ripoti",
  reportIntro:
    "Asante kwa kuijali jumuiya yetu. Tueleze kinachoendelea, nasi tutalifuatilia.",
  reportReasons: {
    spam: "Ni barua taka",
    inappropriateContent: "Yana maudhui yasiyofaa",
    harassment: "Ni unyanyasaji au uonevu",
    misinformation: "Yanaeneza taarifa za uongo",
    hateSpeech: "Yana matamshi au alama za chuki",
    violence: "Yanachochea vurugu au tabia hatari",
    illegalActivity: "Yanachochea shughuli haramu",
    selfHarm: "Yanachochea kujidhuru au kujiua",
    other: "Nyingine",
  } satisfies Record<ReportReasonKey, string>,
  submitReport: "Tuma ripoti",
  submittingReport: "Inatuma...",

  // Messages
  loginRequired: "Tafadhali ingia ili kufanya kitendo hiki",
  usernameRequired: "Tafadhali weka jina la mtumiaji kabla ya kushiriki kwenye maoni",
  commentEmpty: "Maoni hayawezi kuwa tupu",
  userNotMentionable: "Mtumiaji huyu hawezi kutajwa (hana jina la mtumiaji)",
  parentDeleted: "Maoni haya yamefutwa, kwa hivyo huwezi kuyajibu.",
  parentRemoved: "Maoni haya yameondolewa, kwa hivyo huwezi kuyajibu.",
  postFailed: "Imeshindwa kuchapisha maoni yako. Jaribu tena.",
};

export default strings;
