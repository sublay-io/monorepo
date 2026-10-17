import type { ReportReasonKey } from "@sublay/react-js";

// 🌐 Every piece of text the comment section shows. Edit the values here to
// reword or translate it. Entries that depend on a number or a name are
// functions, so each language can use its own plural forms and word order.
const strings = {
  // Inputs
  commentPlaceholder: "વાતચીતમાં જોડાઓ",
  replyPlaceholder: "તમારો જવાબ ઉમેરો...",
  cancel: "રદ કરો",
  submitComment: "પોસ્ટ કરો",
  addGif: "GIF ઉમેરો",

  // Sorting
  sortBy: "આના દ્વારા ગોઠવો",
  sortTop: "લોકપ્રિય",
  sortNew: "નવી",
  sortOld: "જૂની",
  sortControversial: "વિવાદાસ્પદ",

  // Comment list
  noCommentsTitle: "હજી સુધી કોઈ ટિપ્પણી નથી",
  noCommentsSubtitle: "વાતચીત શરૂ કરો.",
  viewAllComments: "બધી ટિપ્પણીઓ જુઓ",
  loadMoreComments: "વધુ ટિપ્પણીઓ લોડ કરો",
  loading: "લોડ થઈ રહ્યું છે...",
  loadCommentsFailed: "ટિપ્પણીઓ લોડ થઈ શકી નહીં",
  loadMoreFailed: "વધુ લોડ થઈ શક્યું નહીં",
  tryAgain: "ફરી પ્રયાસ કરો",

  // A comment
  reply: "જવાબ આપો",
  replyCount: (count: number) => `${count} ${count === 1 ? "જવાબ" : "જવાબો"}`,
  moreReplyCount: (count: number) =>
    `${count} વધુ ${count === 1 ? "જવાબ" : "જવાબો"}`,
  moreReplies: "વધુ જવાબો",
  continueThread: "આ થ્રેડ આગળ જુઓ",
  expandThread: "થ્રેડ વિસ્તૃત કરો",
  collapseThread: "થ્રેડ સંકુચિત કરો",
  moreOptions: "વધુ વિકલ્પો",
  upvote: "અપવોટ કરો",
  downvote: "ડાઉનવોટ કરો",
  removeYourVote: "તમારો વોટ દૂર કરો",

  // Comments that can't be shown
  deleted: "[કાઢી નાખેલી]",
  removed: "[દૂર કરેલી]",
  unavailable: "આ ટિપ્પણી ઉપલબ્ધ નથી",
  blockedAuthor: "તમે બ્લૉક કરેલા વપરાશકર્તાની ટિપ્પણી",
  showAnyway: "છતાં બતાવો",
  removedByModerator: (reason?: string | null) =>
    `મૉડરેટર દ્વારા દૂર કરાઈ${reason ? `: ${reason}` : ""} · ફક્ત તમે જ આ જોઈ શકો છો`,

  // Mentions
  noUsersFound: "કોઈ વપરાશકર્તા મળ્યા નથી",

  // Menus
  report: "રિપોર્ટ કરો",
  remove: "કાઢી નાખો",
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
  loginRequired: "આ ક્રિયા કરવા માટે કૃપા કરીને લૉગ ઇન કરો",
  usernameRequired: "ટિપ્પણીઓમાં ભાગ લેતાં પહેલાં કૃપા કરીને વપરાશકર્તા નામ સેટ કરો",
  commentEmpty: "ટિપ્પણી ખાલી ન હોઈ શકે",
  userNotMentionable: "આ વપરાશકર્તાનો ઉલ્લેખ કરી શકાતો નથી (વપરાશકર્તા નામ સેટ કરેલું નથી)",
  parentDeleted: "આ ટિપ્પણી કાઢી નાખવામાં આવી છે, તેથી તમે તેનો જવાબ આપી શકતા નથી.",
  parentRemoved: "આ ટિપ્પણી દૂર કરવામાં આવી છે, તેથી તમે તેનો જવાબ આપી શકતા નથી.",
  postFailed: "તમારી ટિપ્પણી પોસ્ટ થઈ શકી નહીં. ફરી પ્રયાસ કરો.",
};

export default strings;
