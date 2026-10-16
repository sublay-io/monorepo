import type { ReportReasonKey } from "@sublay/react-js";

// 🌐 Every piece of text the comment section shows. Edit the values here to
// reword or translate it. Entries that depend on a number or a name are
// functions, so each language can use its own plural forms and word order.
const strings = {
  // Inputs
  commentPlaceholder: "टिप्पणी जोडा...",
  cancel: "रद्द करा",
  post: "पोस्ट करा",
  replyingTo: (name: string) => `${name} यांना उत्तर`,

  // Comment list
  noCommentsTitle: "अद्याप कोणत्याही टिप्पण्या नाहीत",
  noCommentsSubtitle: "चर्चा सुरू करा.",
  loadMoreComments: "आणखी टिप्पण्या लोड करा",
  loading: "लोड होत आहे...",
  loadCommentsFailed: "टिप्पण्या लोड करता आल्या नाहीत",
  loadMoreFailed: "आणखी लोड करता आले नाही",
  tryAgain: "पुन्हा प्रयत्न करा",
  sortTop: "लोकप्रिय",
  sortNew: "नवीन",
  sortOld: "जुने",

  // A comment
  reply: "उत्तर द्या",
  viewMoreReplies: (count: number) => `आणखी उत्तरे पहा (${count})`,
  hideReplies: "उत्तरे लपवा",
  removeYourReaction: "तुमची प्रतिक्रिया काढा",
  timeAgo: {
    justNow: "आत्ताच",
    minutes: (count: number) =>
      count === 1 ? "एका मिनिटापूर्वी" : `${count} मिनिटांपूर्वी`,
    hours: (count: number) =>
      count === 1 ? "एका तासापूर्वी" : `${count} तासांपूर्वी`,
    days: (count: number) =>
      count === 1 ? "एका दिवसापूर्वी" : `${count} दिवसांपूर्वी`,
    months: (count: number) =>
      count === 1 ? "एका महिन्यापूर्वी" : `${count} महिन्यांपूर्वी`,
    years: (count: number) =>
      count === 1 ? "एका वर्षापूर्वी" : `${count} वर्षांपूर्वी`,
  },

  // Comments that can't be shown
  deleted: "[हटवली]",
  removed: "[काढून टाकली]",
  unavailable: "ही टिप्पणी उपलब्ध नाही",
  blockedAuthor: "तुम्ही ब्लॉक केलेल्या वापरकर्त्याची टिप्पणी",
  showAnyway: "तरीही दाखवा",
  removedByModerator: (reason?: string | null) =>
    `मॉडरेटरने काढून टाकली${reason ? `: ${reason}` : ""} · हे फक्त तुम्हाला दिसते`,

  // Menus
  report: "रिपोर्ट करा",
  remove: "हटवा",
  confirmDelete: "तुम्हाला खरोखर ही टिप्पणी हटवायची आहे का?",

  // Report dialog
  reportTitle: "रिपोर्ट पाठवा",
  reportIntro:
    "आमच्या समुदायाची काळजी घेतल्याबद्दल धन्यवाद. काय घडत आहे ते आम्हाला सांगा, आम्ही त्याची तपासणी करू.",
  reportReasons: {
    spam: "हे स्पॅम आहे",
    inappropriateContent: "यात अयोग्य मजकूर आहे",
    harassment: "हा छळ किंवा दादागिरी आहे",
    misinformation: "हे खोटी माहिती पसरवते",
    hateSpeech: "यात द्वेषपूर्ण भाषा किंवा चिन्हे आहेत",
    violence: "हे हिंसा किंवा धोकादायक वर्तनाला प्रोत्साहन देते",
    illegalActivity: "हे बेकायदेशीर कृत्यांना प्रोत्साहन देते",
    selfHarm: "हे स्वतःला इजा करण्यास किंवा आत्महत्येला प्रोत्साहन देते",
    other: "इतर",
  } satisfies Record<ReportReasonKey, string>,
  submitReport: "रिपोर्ट पाठवा",
  submittingReport: "पाठवत आहे...",

  // Messages
  loginRequired: "ही कृती करण्यासाठी कृपया लॉग इन करा",
  commentEmpty: "टिप्पणी रिकामी असू शकत नाही",
  userNotMentionable:
    "या वापरकर्त्याचे वापरकर्तानाव नाही, त्यामुळे त्यांचा उल्लेख करता येत नाही",
  parentDeleted: "ही टिप्पणी हटवली गेली आहे, त्यामुळे तुम्ही तिला उत्तर देऊ शकत नाही.",
  parentRemoved: "ही टिप्पणी काढून टाकली गेली आहे, त्यामुळे तुम्ही तिला उत्तर देऊ शकत नाही.",
  postFailed: "तुमची टिप्पणी पोस्ट करता आली नाही. पुन्हा प्रयत्न करा.",
};

export default strings;
