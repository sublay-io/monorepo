import type { ReportReasonKey } from "@sublay/react-native";

// 🌐 Every piece of text the comment section shows. Edit the values here to
// reword or translate it. Entries that depend on a number or a name are
// functions, so each language can use its own plural forms and word order.
const strings = {
  // Inputs
  commentPlaceholder: "Талқылауға қосылыңыз",
  cancel: "Бас тарту",
  replyingTo: "Жауап:",
  cancelReply: "Жауаптан бас тарту",

  // Sorting
  sortBy: "Сұрыптау",
  sortSheetTitle: "Пікірлерді сұрыптау",
  sortTop: "Үздік",
  sortNew: "Жаңа",
  sortOld: "Ескі",
  sortControversial: "Даулы",

  // When a comment was posted
  timeAgo: {
    justNow: "Жаңа ғана",
    minutes: (count: number) => `${count} минут бұрын`,
    hours: (count: number) => `${count} сағат бұрын`,
    days: (count: number) => `${count} күн бұрын`,
    months: (count: number) => `${count} ай бұрын`,
    years: (count: number) => `${count} жыл бұрын`,
  },

  // Comment list
  noCommentsTitle: "Әзірге пікір жоқ",
  noCommentsSubtitle: "Талқылауды бастаңыз.",
  viewAllComments: "Барлық пікірлерді көру",
  loadMoreComments: "Тағы пікір жүктеу",
  loading: "Жүктелуде...",
  loadCommentsFailed: "Пікірлерді жүктеу мүмкін болмады",
  loadMoreFailed: "Тағы жүктеу мүмкін болмады",
  tryAgain: "Қайталап көріңіз",

  // A comment
  reply: "Жауап беру",
  replyCount: (count: number) => `${count} жауап`,
  moreReplyCount: (count: number) => `тағы ${count} жауап`,
  moreReplies: "Басқа жауаптар",
  removeYourVote: "Дауысыңызды алып тастау",

  // Comments that can't be shown
  deleted: "[жойылды]",
  removed: "[алынып тасталды]",
  unavailable: "Бұл пікір қолжетімсіз",
  blockedAuthor: "Сіз бұғаттаған пайдаланушының пікірі",
  showAnyway: "Бәрібір көрсету",
  removedByModerator: (reason?: string | null) =>
    `Модератор алып тастады${reason ? `: ${reason}` : ""} · мұны тек сіз көресіз`,

  // Mentions
  noUsersFound: "Пайдаланушылар табылмады",

  // Menus
  report: "Шағымдану",
  delete: "Жою",
  deleteCommentTitle: "Пікірді жою",
  confirmDelete: "Бұл пікірді шынымен жойғыңыз келе ме?",

  // Report dialog
  reportTitle: "Шағым жіберу",
  reportIntro:
    "Қауымдастығымызға қамқорлық танытқаныңыз үшін рақмет. Не болып жатқанын айтыңыз, біз мұны қарастырамыз.",
  reportReasons: {
    spam: "Бұл спам",
    inappropriateContent: "Орынсыз мазмұн бар",
    harassment: "Қудалау немесе қорлау",
    misinformation: "Жалған ақпарат таратады",
    hateSpeech: "Өшпенділік тілі немесе нышандары бар",
    violence: "Зорлық-зомбылыққа немесе қауіпті әрекетке шақырады",
    illegalActivity: "Заңсыз әрекетке шақырады",
    selfHarm: "Өзіне зиян келтіруге немесе суицидке шақырады",
    other: "Басқа",
  } satisfies Record<ReportReasonKey, string>,
  submitReport: "Шағымды жіберу",
  submittingReport: "Жіберілуде...",

  // Messages
  parentDeleted: "Бұл пікір жойылған, сондықтан оған жауап беру мүмкін емес.",
  parentRemoved: "Бұл пікір алынып тасталған, сондықтан оған жауап беру мүмкін емес.",
  postFailed: "Пікіріңізді жариялау мүмкін болмады. Қайталап көріңіз.",
};

export default strings;
