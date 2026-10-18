import type { ReportReasonKey } from "@sublay/react-native";

// 🌐 Every piece of text the comment section shows. Edit the values here to
// reword or translate it. Entries that depend on a number or a name are
// functions, so each language can use its own plural forms and word order.
const strings = {
  // Inputs
  commentPlaceholder: "Sohbete katıl",
  cancel: "İptal",
  replyingTo: "Yanıtlanan:",
  cancelReply: "Yanıtı iptal et",
  moreOptions: "Diğer seçenekler",
  collapseThread: "Konuyu daralt",
  expandThread: "Konuyu genişlet",

  // Sorting
  sortBy: "Sırala",
  sortSheetTitle: "Yorumları sırala",
  sortTop: "Popüler",
  sortNew: "Yeni",
  sortOld: "Eski",
  sortControversial: "Tartışmalı",

  // When a comment was posted
  timeAgo: {
    justNow: "Az önce",
    minutes: (count: number) => `${count} dakika önce`,
    hours: (count: number) => `${count} saat önce`,
    days: (count: number) => `${count} gün önce`,
    months: (count: number) => `${count} ay önce`,
    years: (count: number) => `${count} yıl önce`,
  },

  // Comment list
  noCommentsTitle: "Henüz yorum yok",
  noCommentsSubtitle: "Sohbeti başlat.",
  viewAllComments: "Tüm yorumları gör",
  loadMoreComments: "Daha fazla yorum yükle",
  loading: "Yükleniyor...",
  loadCommentsFailed: "Yorumlar yüklenemedi",
  loadMoreFailed: "Daha fazlası yüklenemedi",
  tryAgain: "Tekrar dene",

  // A comment
  reply: "Yanıtla",
  replyCount: (count: number) => `${count} yanıt`,
  moreReplyCount: (count: number) => `${count} yanıt daha`,
  moreReplies: "Diğer yanıtlar",
  removeYourVote: "Oyunu geri al",

  // Comments that can't be shown
  deleted: "[silindi]",
  removed: "[kaldırıldı]",
  unavailable: "Bu yorum kullanılamıyor",
  blockedAuthor: "Engellediğin bir kullanıcının yorumu",
  showAnyway: "Yine de göster",
  removedByModerator: (reason?: string | null) =>
    `Bir moderatör tarafından kaldırıldı${reason ? `: ${reason}` : ""} · yalnızca sen görebilirsin`,

  // Mentions
  noUsersFound: "Kullanıcı bulunamadı",

  // Menus
  report: "Şikayet et",
  delete: "Sil",
  deleteCommentTitle: "Yorumu sil",
  confirmDelete: "Bu yorumu silmek istediğinden emin misin?",

  // Report dialog
  reportTitle: "Şikayet gönder",
  reportIntro:
    "Topluluğumuza göz kulak olduğun için teşekkürler. Neler olduğunu bize bildir, inceleyelim.",
  reportReasons: {
    spam: "Spam",
    inappropriateContent: "Uygunsuz içerik barındırıyor",
    harassment: "Taciz veya zorbalık",
    misinformation: "Yanlış bilgi yayıyor",
    hateSpeech: "Nefret söylemi veya sembolleri içeriyor",
    violence: "Şiddeti veya tehlikeli davranışları teşvik ediyor",
    illegalActivity: "Yasa dışı faaliyetleri teşvik ediyor",
    selfHarm: "Kendine zarar vermeyi veya intiharı teşvik ediyor",
    other: "Diğer",
  } satisfies Record<ReportReasonKey, string>,
  submitReport: "Şikayeti gönder",
  submittingReport: "Gönderiliyor...",

  // Messages
  parentDeleted: "Bu yorum silindiği için yanıtlanamaz.",
  parentRemoved: "Bu yorum kaldırıldığı için yanıtlanamaz.",
  postFailed: "Yorumun gönderilemedi. Tekrar dene.",
};

export default strings;
