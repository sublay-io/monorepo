import type { ReportReasonKey } from "@sublay/react-native";

// 🌐 Every piece of text the comment section shows. Edit the values here to
// reword or translate it. Entries that depend on a number or a name are
// functions, so each language can use its own plural forms and word order.
const strings = {
  // Inputs
  commentPlaceholder: "Andika maoni...",
  cancel: "Ghairi",
  post: "Chapisha",
  replyingTo: (name: string) => `Unamjibu ${name}`,

  // Comment list
  noCommentsTitle: "Bado hakuna maoni",
  noCommentsSubtitle: "Anzisha mazungumzo.",
  loadCommentsFailed: "Imeshindwa kupakia maoni",
  loadMoreFailed: "Imeshindwa kupakia zaidi",
  tryAgain: "Jaribu tena",
  sortTop: "Maarufu",
  sortNew: "Mapya",
  sortOld: "Ya zamani",

  // A comment
  reply: "Jibu",
  viewMoreReplies: (count: number) =>
    count === 1 ? "Tazama jibu 1 zaidi" : `Tazama majibu ${count} zaidi`,
  hideReplies: "Ficha majibu",
  removeYourReaction: "Ondoa hisia yako",
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

  // Comments that can't be shown
  deleted: "[imefutwa]",
  removed: "[imeondolewa]",
  unavailable: "Maoni haya hayapatikani",
  blockedAuthor: "Maoni kutoka kwa mtumiaji uliyemzuia",
  showAnyway: "Onyesha hata hivyo",
  removedByModerator: (reason?: string | null) =>
    `Yameondolewa na msimamizi${reason ? `: ${reason}` : ""} · ni wewe tu unayeweza kuyaona`,

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
