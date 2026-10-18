import type { ReportReasonKey } from "@sublay/react-js";

// 🌐 Every piece of text the comment section shows. Edit the values here to
// reword or translate it. Entries that depend on a number or a name are
// functions, so each language can use its own plural forms and word order.
const strings = {
  // Inputs
  commentPlaceholder: "चर्चेत सहभागी व्हा",
  replyPlaceholder: "तुमचे उत्तर लिहा...",
  cancel: "रद्द करा",
  submitComment: "पोस्ट करा",
  addGif: "GIF जोडा",

  // Sorting
  sortBy: "यानुसार क्रमवारी लावा",
  sortTop: "लोकप्रिय",
  sortNew: "नवीन",
  sortOld: "जुने",
  sortControversial: "वादग्रस्त",

  // Comment list
  noCommentsTitle: "अद्याप कोणत्याही टिप्पण्या नाहीत",
  noCommentsSubtitle: "चर्चा सुरू करा.",
  viewAllComments: "सर्व टिप्पण्या पहा",
  loadMoreComments: "आणखी टिप्पण्या लोड करा",
  loading: "लोड होत आहे...",
  loadCommentsFailed: "टिप्पण्या लोड करता आल्या नाहीत",
  loadMoreFailed: "आणखी लोड करता आले नाही",
  tryAgain: "पुन्हा प्रयत्न करा",

  // A comment
  reply: "उत्तर द्या",
  replyCount: (count: number) => `${count} ${count === 1 ? "उत्तर" : "उत्तरे"}`,
  moreReplyCount: (count: number) =>
    `आणखी ${count} ${count === 1 ? "उत्तर" : "उत्तरे"}`,
  moreReplies: "आणखी उत्तरे",
  expandThread: "थ्रेड उघडा",
  collapseThread: "थ्रेड संकुचित करा",
  moreOptions: "अधिक पर्याय",
  upvote: "अपव्होट",
  downvote: "डाउनव्होट",
  removeYourVote: "तुमचे मत काढा",

  // Comments that can't be shown
  deleted: "[हटवली]",
  removed: "[काढून टाकली]",
  unavailable: "ही टिप्पणी उपलब्ध नाही",
  blockedAuthor: "तुम्ही ब्लॉक केलेल्या वापरकर्त्याची टिप्पणी",
  showAnyway: "तरीही दाखवा",
  removedByModerator: (reason?: string | null) =>
    `मॉडरेटरने काढून टाकली${reason ? `: ${reason}` : ""} · हे फक्त तुम्हाला दिसते`,

  // Mentions
  noUsersFound: "कोणतेही वापरकर्ते आढळले नाहीत",

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
  usernameRequired: "टिप्पण्यांमध्ये सहभागी होण्यापूर्वी कृपया वापरकर्तानाव सेट करा",
  commentEmpty: "टिप्पणी रिकामी असू शकत नाही",
  userNotMentionable: "या वापरकर्त्याचा उल्लेख करता येत नाही (वापरकर्तानाव सेट केलेले नाही)",
  parentDeleted: "ही टिप्पणी हटवली गेली आहे, त्यामुळे तुम्ही तिला उत्तर देऊ शकत नाही.",
  parentRemoved: "ही टिप्पणी काढून टाकली गेली आहे, त्यामुळे तुम्ही तिला उत्तर देऊ शकत नाही.",
  postFailed: "तुमची टिप्पणी पोस्ट करता आली नाही. पुन्हा प्रयत्न करा.",
};

export default strings;
