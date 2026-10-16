import type { ReportReasonKey } from "@sublay/react-native";

// 🌐 Every piece of text the comment section shows. Edit the values here to
// reword or translate it. Entries that depend on a number or a name are
// functions, so each language can use its own plural forms and word order.
const strings = {
  // Inputs
  commentPlaceholder: "टिप्पणी जोड़ें...",
  cancel: "रद्द करें",
  post: "पोस्ट करें",
  replyingTo: (name: string) => `${name} को जवाब`,

  // Comment list
  noCommentsTitle: "अभी तक कोई टिप्पणी नहीं",
  noCommentsSubtitle: "बातचीत शुरू करें।",
  loadCommentsFailed: "टिप्पणियाँ लोड नहीं हो सकीं",
  loadMoreFailed: "और लोड नहीं हो सका",
  tryAgain: "फिर से कोशिश करें",
  sortTop: "लोकप्रिय",
  sortNew: "नई",
  sortOld: "पुरानी",

  // A comment
  reply: "जवाब दें",
  viewMoreReplies: (count: number) => `और जवाब देखें (${count})`,
  hideReplies: "जवाब छिपाएँ",
  removeYourReaction: "अपनी प्रतिक्रिया हटाएँ",
  timeAgo: {
    justNow: "अभी-अभी",
    minutes: (count: number) => `${count} मिनट पहले`,
    hours: (count: number) => `${count} घंटे पहले`,
    days: (count: number) => `${count} दिन पहले`,
    months: (count: number) => `${count} महीने पहले`,
    years: (count: number) => `${count} साल पहले`,
  },

  // Comments that can't be shown
  deleted: "[डिलीट की गई]",
  removed: "[हटा दी गई]",
  unavailable: "यह टिप्पणी उपलब्ध नहीं है",
  blockedAuthor: "आपके द्वारा ब्लॉक किए गए उपयोगकर्ता की टिप्पणी",
  showAnyway: "फिर भी दिखाएँ",
  removedByModerator: (reason?: string | null) =>
    `मॉडरेटर द्वारा हटाई गई${reason ? `: ${reason}` : ""} · केवल आप इसे देख सकते हैं`,

  // Menus
  report: "रिपोर्ट करें",
  delete: "डिलीट करें",
  deleteCommentTitle: "टिप्पणी डिलीट करें",
  confirmDelete: "क्या आप वाकई यह टिप्पणी डिलीट करना चाहते हैं?",

  // Report dialog
  reportTitle: "रिपोर्ट भेजें",
  reportIntro:
    "हमारे समुदाय का ध्यान रखने के लिए धन्यवाद। हमें बताएँ कि क्या हो रहा है, हम इसकी जाँच करेंगे।",
  reportReasons: {
    spam: "यह स्पैम है",
    inappropriateContent: "इसमें अनुचित सामग्री है",
    harassment: "यह उत्पीड़न या धमकाना है",
    misinformation: "यह गलत जानकारी फैलाती है",
    hateSpeech: "इसमें नफ़रत भरी भाषा या प्रतीक हैं",
    violence: "यह हिंसा या ख़तरनाक व्यवहार को बढ़ावा देती है",
    illegalActivity: "यह ग़ैर-क़ानूनी गतिविधि को बढ़ावा देती है",
    selfHarm: "यह आत्म-क्षति या आत्महत्या को बढ़ावा देती है",
    other: "अन्य",
  } satisfies Record<ReportReasonKey, string>,
  submitReport: "रिपोर्ट भेजें",
  submittingReport: "भेजा जा रहा है...",

  // Messages
  parentDeleted: "यह टिप्पणी डिलीट कर दी गई है, इसलिए आप इसका जवाब नहीं दे सकते।",
  parentRemoved: "यह टिप्पणी हटा दी गई है, इसलिए आप इसका जवाब नहीं दे सकते।",
  postFailed: "आपकी टिप्पणी पोस्ट नहीं हो सकी। फिर से कोशिश करें।",
};

export default strings;
