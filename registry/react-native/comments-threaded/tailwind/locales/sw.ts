import type { ReportReasonKey } from "@sublay/react-native";

// 🌐 Every piece of text the comment section shows. Edit the values here to
// reword or translate it. Entries that depend on a number or a name are
// functions, so each language can use its own plural forms and word order.
const strings = {
  // Inputs
  commentPlaceholder: "Jiunge na mazungumzo",
  cancel: "Ghairi",
  replyingTo: "Unamjibu",
  cancelReply: "Ghairi jibu",

  // Sorting
  sortBy: "Panga kwa",
  sortSheetTitle: "Panga maoni kwa",
  sortTop: "Maarufu",
  sortNew: "Mapya",
  sortOld: "Ya zamani",
  sortControversial: "Zenye utata",

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
  delete: "Futa",
  deleteCommentTitle: "Futa maoni",
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
  parentDeleted: "Maoni haya yamefutwa, kwa hivyo huwezi kuyajibu.",
  parentRemoved: "Maoni haya yameondolewa, kwa hivyo huwezi kuyajibu.",
  postFailed: "Imeshindwa kuchapisha maoni yako. Jaribu tena.",
};

export default strings;
