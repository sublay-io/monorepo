import type { ReportReasonKey } from "@sublay/react-native";

// 🌐 Every piece of text the comment section shows. Edit the values here to
// reword or translate it. Entries that depend on a number or a name are
// functions, so each language can use its own plural forms and word order.
const strings = {
  // Inputs
  commentPlaceholder: "உரையாடலில் இணையுங்கள்",
  cancel: "ரத்துசெய்",
  replyingTo: "இவருக்குப் பதில்:",
  cancelReply: "பதிலை ரத்துசெய்",

  // Sorting
  sortBy: "வரிசைப்படுத்து",
  sortSheetTitle: "கருத்துகளை வரிசைப்படுத்து",
  sortTop: "சிறந்தவை",
  sortNew: "புதியவை",
  sortOld: "பழையவை",
  sortControversial: "சர்ச்சைக்குரியவை",

  // When a comment was posted
  timeAgo: {
    justNow: "இப்போது",
    minutes: (count: number) =>
      count === 1 ? "ஒரு நிமிடத்திற்கு முன்பு" : `${count} நிமிடங்களுக்கு முன்பு`,
    hours: (count: number) =>
      count === 1 ? "ஒரு மணிநேரத்திற்கு முன்பு" : `${count} மணிநேரத்திற்கு முன்பு`,
    days: (count: number) =>
      count === 1 ? "ஒரு நாளுக்கு முன்பு" : `${count} நாட்களுக்கு முன்பு`,
    months: (count: number) =>
      count === 1 ? "ஒரு மாதத்திற்கு முன்பு" : `${count} மாதங்களுக்கு முன்பு`,
    years: (count: number) =>
      count === 1 ? "ஒரு வருடத்திற்கு முன்பு" : `${count} வருடங்களுக்கு முன்பு`,
  },

  // Comment list
  noCommentsTitle: "இதுவரை கருத்துகள் இல்லை",
  noCommentsSubtitle: "உரையாடலைத் தொடங்குங்கள்.",
  viewAllComments: "எல்லாக் கருத்துகளையும் காட்டு",
  loadMoreComments: "மேலும் கருத்துகளை ஏற்று",
  loading: "ஏற்றுகிறது...",
  loadCommentsFailed: "கருத்துகளை ஏற்ற முடியவில்லை",
  loadMoreFailed: "மேலும் ஏற்ற முடியவில்லை",
  tryAgain: "மீண்டும் முயலவும்",

  // A comment
  reply: "பதிலளி",
  replyCount: (count: number) =>
    count === 1 ? "1 பதில்" : `${count} பதில்கள்`,
  moreReplyCount: (count: number) =>
    count === 1 ? "மேலும் 1 பதில்" : `மேலும் ${count} பதில்கள்`,
  moreReplies: "மேலும் பதில்கள்",
  removeYourVote: "உங்கள் வாக்கை அகற்று",

  // Comments that can't be shown
  deleted: "[நீக்கப்பட்டது]",
  removed: "[அகற்றப்பட்டது]",
  unavailable: "இந்தக் கருத்து கிடைக்கவில்லை",
  blockedAuthor: "நீங்கள் தடுத்த பயனரின் கருத்து",
  showAnyway: "இருந்தாலும் காட்டு",
  removedByModerator: (reason?: string | null) =>
    `மதிப்பீட்டாளரால் அகற்றப்பட்டது${reason ? `: ${reason}` : ""} · இது உங்களுக்கு மட்டுமே தெரியும்`,

  // Mentions
  noUsersFound: "பயனர்கள் யாரும் கிடைக்கவில்லை",

  // Menus
  report: "புகாரளி",
  delete: "நீக்கு",
  deleteCommentTitle: "கருத்தை நீக்கு",
  confirmDelete: "இந்தக் கருத்தை நிச்சயமாக நீக்க வேண்டுமா?",

  // Report dialog
  reportTitle: "புகாரைச் சமர்ப்பி",
  reportIntro:
    "எங்கள் சமூகத்தின் மீது அக்கறை காட்டியதற்கு நன்றி. என்ன நடக்கிறது என்பதை எங்களுக்குத் தெரியப்படுத்துங்கள், நாங்கள் அதை ஆராய்வோம்.",
  reportReasons: {
    spam: "இது ஸ்பேம்",
    inappropriateContent: "பொருத்தமற்ற உள்ளடக்கம் உள்ளது",
    harassment: "இது துன்புறுத்தல் அல்லது கொடுமைப்படுத்தல்",
    misinformation: "தவறான தகவலைப் பரப்புகிறது",
    hateSpeech: "வெறுப்புப் பேச்சு அல்லது சின்னங்கள் உள்ளன",
    violence: "வன்முறையை அல்லது ஆபத்தான நடத்தையை ஊக்குவிக்கிறது",
    illegalActivity: "சட்டவிரோதச் செயல்பாட்டை ஊக்குவிக்கிறது",
    selfHarm: "சுய தீங்கு அல்லது தற்கொலையை ஊக்குவிக்கிறது",
    other: "மற்றவை",
  } satisfies Record<ReportReasonKey, string>,
  submitReport: "புகாரைச் சமர்ப்பி",
  submittingReport: "சமர்ப்பிக்கிறது...",

  // Messages
  parentDeleted: "இந்தக் கருத்து நீக்கப்பட்டதால், இதற்குப் பதிலளிக்க முடியாது.",
  parentRemoved: "இந்தக் கருத்து அகற்றப்பட்டதால், இதற்குப் பதிலளிக்க முடியாது.",
  postFailed: "உங்கள் கருத்தை இடுகையிட முடியவில்லை. மீண்டும் முயலவும்.",
};

export default strings;
