import type { ReportReasonKey } from "@sublay/react-js";

// 🌐 Every piece of text the comment section shows. Edit the values here to
// reword or translate it. Entries that depend on a number or a name are
// functions, so each language can use its own plural forms and word order.
const strings = {
  // Inputs
  commentPlaceholder: "Пікір қосыңыз...",
  cancel: "Бас тарту",
  post: "Жариялау",
  replyingTo: (name: string) => `Жауап: ${name}`,

  // Comment list
  noCommentsTitle: "Әзірге пікір жоқ",
  noCommentsSubtitle: "Талқылауды бастаңыз.",
  loadMoreComments: "Тағы пікір жүктеу",
  loading: "Жүктелуде...",
  loadCommentsFailed: "Пікірлерді жүктеу мүмкін болмады",
  loadMoreFailed: "Тағы жүктеу мүмкін болмады",
  tryAgain: "Қайталап көріңіз",
  sortTop: "Үздік",
  sortNew: "Жаңа",
  sortOld: "Ескі",

  // A comment
  reply: "Жауап беру",
  viewMoreReplies: (count: number) => `Тағы жауаптарды көру (${count})`,
  hideReplies: "Жауаптарды жасыру",
  removeYourReaction: "Реакцияңызды алып тастау",
  timeAgo: {
    justNow: "Жаңа ғана",
    minutes: (count: number) => `${count} минут бұрын`,
    hours: (count: number) => `${count} сағат бұрын`,
    days: (count: number) => `${count} күн бұрын`,
    months: (count: number) => `${count} ай бұрын`,
    years: (count: number) => `${count} жыл бұрын`,
  },

  // Comments that can't be shown
  deleted: "[жойылды]",
  removed: "[алынып тасталды]",
  unavailable: "Бұл пікір қолжетімсіз",
  blockedAuthor: "Сіз бұғаттаған пайдаланушының пікірі",
  showAnyway: "Бәрібір көрсету",
  removedByModerator: (reason?: string | null) =>
    `Модератор алып тастады${reason ? `: ${reason}` : ""} · мұны тек сіз көресіз`,

  // Menus
  report: "Шағымдану",
  remove: "Жою",
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
  loginRequired: "Бұл әрекетті орындау үшін жүйеге кіріңіз",
  commentEmpty: "Пікір бос болмауы керек",
  userNotMentionable:
    "Бұл пайдаланушыда пайдаланушы аты жоқ, сондықтан оны атап өту мүмкін емес",
  parentDeleted: "Бұл пікір жойылған, сондықтан оған жауап беру мүмкін емес.",
  parentRemoved: "Бұл пікір алынып тасталған, сондықтан оған жауап беру мүмкін емес.",
  postFailed: "Пікіріңізді жариялау мүмкін болмады. Қайталап көріңіз.",
};

export default strings;
