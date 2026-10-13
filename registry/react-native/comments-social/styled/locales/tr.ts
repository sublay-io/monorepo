import type { ReportReasonKey } from "@sublay/react-native";

// 🌐 Every piece of text the comment section shows. Edit the values here to
// reword or translate it. Entries that depend on a number or a name are
// functions, so each language can use its own plural forms and word order.
const strings = {
  // Inputs
  commentPlaceholder: "Yorum ekle...",
  cancel: "İptal",
  post: "Paylaş",
  replyingTo: (name: string) => `Yanıtlanan: ${name}`,

  // Comment list
  noCommentsTitle: "Henüz yorum yok",
  noCommentsSubtitle: "Sohbeti başlat.",
  loadCommentsFailed: "Yorumlar yüklenemedi",
  loadMoreFailed: "Daha fazlası yüklenemedi",
  tryAgain: "Tekrar dene",
  sortTop: "Popüler",
  sortNew: "Yeni",
  sortOld: "Eski",

  // A comment
  reply: "Yanıtla",
  viewMoreReplies: (count: number) => `Diğer yanıtları gör (${count})`,
  hideReplies: "Yanıtları gizle",
  removeYourReaction: "Tepkini geri al",
  timeAgo: {
    justNow: "Az önce",
    minutes: (count: number) => `${count} dakika önce`,
    hours: (count: number) => `${count} saat önce`,
    days: (count: number) => `${count} gün önce`,
    months: (count: number) => `${count} ay önce`,
    years: (count: number) => `${count} yıl önce`,
  },

  // Comments that can't be shown
  deleted: "[silindi]",
  removed: "[kaldırıldı]",
  unavailable: "Bu yorum kullanılamıyor",
  blockedAuthor: "Engellediğin bir kullanıcının yorumu",
  showAnyway: "Yine de göster",
  removedByModerator: (reason?: string | null) =>
    `Bir moderatör tarafından kaldırıldı${reason ? `: ${reason}` : ""} · yalnızca sen görebilirsin`,

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
