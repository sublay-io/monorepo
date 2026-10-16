import type { ReportReasonKey } from "@sublay/react-native";

// 🌐 Every piece of text the comment section shows. Edit the values here to
// reword or translate it. Entries that depend on a number or a name are
// functions, so each language can use its own plural forms and word order.
const strings = {
  // Inputs
  commentPlaceholder: "ટિપ્પણી ઉમેરો...",
  cancel: "રદ કરો",
  post: "પોસ્ટ કરો",
  replyingTo: (name: string) => `${name} ને જવાબ`,

  // Comment list
  noCommentsTitle: "હજી સુધી કોઈ ટિપ્પણી નથી",
  noCommentsSubtitle: "વાતચીત શરૂ કરો.",
  loadCommentsFailed: "ટિપ્પણીઓ લોડ થઈ શકી નહીં",
  loadMoreFailed: "વધુ લોડ થઈ શક્યું નહીં",
  tryAgain: "ફરી પ્રયાસ કરો",
  sortTop: "લોકપ્રિય",
  sortNew: "નવી",
  sortOld: "જૂની",

  // A comment
  reply: "જવાબ આપો",
  viewMoreReplies: (count: number) =>
    `વધુ ${count} ${count === 1 ? "જવાબ" : "જવાબો"} જુઓ`,
  hideReplies: "જવાબો છુપાવો",
  removeYourReaction: "તમારી પ્રતિક્રિયા દૂર કરો",
  timeAgo: {
    justNow: "હમણાં જ",
    minutes: (count: number) => `${count} મિનિટ પહેલાં`,
    hours: (count: number) => `${count} કલાક પહેલાં`,
    days: (count: number) => `${count} દિવસ પહેલાં`,
    months: (count: number) => `${count} મહિના પહેલાં`,
    years: (count: number) => `${count} વર્ષ પહેલાં`,
  },

  // Comments that can't be shown
  deleted: "[કાઢી નાખેલી]",
  removed: "[દૂર કરેલી]",
  unavailable: "આ ટિપ્પણી ઉપલબ્ધ નથી",
  blockedAuthor: "તમે બ્લૉક કરેલા વપરાશકર્તાની ટિપ્પણી",
  showAnyway: "છતાં બતાવો",
  removedByModerator: (reason?: string | null) =>
    `મૉડરેટર દ્વારા દૂર કરાઈ${reason ? `: ${reason}` : ""} · ફક્ત તમે જ આ જોઈ શકો છો`,

  // Menus
  report: "રિપોર્ટ કરો",
  delete: "કાઢી નાખો",
  deleteCommentTitle: "ટિપ્પણી કાઢી નાખો",
  confirmDelete: "શું તમે ખરેખર આ ટિપ્પણી કાઢી નાખવા માંગો છો?",

  // Report dialog
  reportTitle: "રિપોર્ટ મોકલો",
  reportIntro:
    "અમારા સમુદાયનું ધ્યાન રાખવા બદલ આભાર. શું થઈ રહ્યું છે તે અમને જણાવો, અને અમે તેની તપાસ કરીશું.",
  reportReasons: {
    spam: "આ સ્પામ છે",
    inappropriateContent: "આમાં અયોગ્ય સામગ્રી છે",
    harassment: "આ પજવણી અથવા દાદાગીરી છે",
    misinformation: "આ ખોટી માહિતી ફેલાવે છે",
    hateSpeech: "આમાં નફરતભરી ભાષા અથવા પ્રતીકો છે",
    violence: "આ હિંસા અથવા જોખમી વર્તનને પ્રોત્સાહન આપે છે",
    illegalActivity: "આ ગેરકાયદે પ્રવૃત્તિને પ્રોત્સાહન આપે છે",
    selfHarm: "આ સ્વ-નુકસાન અથવા આત્મહત્યાને પ્રોત્સાહન આપે છે",
    other: "અન્ય",
  } satisfies Record<ReportReasonKey, string>,
  submitReport: "રિપોર્ટ મોકલો",
  submittingReport: "મોકલી રહ્યાં છીએ...",

  // Messages
  parentDeleted: "આ ટિપ્પણી કાઢી નાખવામાં આવી છે, તેથી તમે તેનો જવાબ આપી શકતા નથી.",
  parentRemoved: "આ ટિપ્પણી દૂર કરવામાં આવી છે, તેથી તમે તેનો જવાબ આપી શકતા નથી.",
  postFailed: "તમારી ટિપ્પણી પોસ્ટ થઈ શકી નહીં. ફરી પ્રયાસ કરો.",
};

export default strings;
