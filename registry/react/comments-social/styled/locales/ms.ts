import type { ReportReasonKey } from "@sublay/react-js";

// 🌐 Every piece of text the comment section shows. Edit the values here to
// reword or translate it. Entries that depend on a number or a name are
// functions, so each language can use its own plural forms and word order.
const strings = {
  // Inputs
  commentPlaceholder: "Tambah komen...",
  cancel: "Batal",
  post: "Siarkan",
  replyingTo: (name: string) => `Membalas ${name}`,

  // Comment list
  noCommentsTitle: "Belum ada komen",
  noCommentsSubtitle: "Mulakan perbualan.",
  loadMoreComments: "Muatkan lebih banyak komen",
  loading: "Memuatkan...",
  loadCommentsFailed: "Tidak dapat memuatkan komen",
  loadMoreFailed: "Tidak dapat memuatkan lagi",
  tryAgain: "Cuba lagi",
  sortTop: "Teratas",
  sortNew: "Terbaru",
  sortOld: "Terlama",

  // A comment
  reply: "Balas",
  viewMoreReplies: (count: number) => `Lihat lebih banyak balasan (${count})`,
  hideReplies: "Sembunyikan balasan",
  removeYourReaction: "Alih keluar reaksi anda",
  timeAgo: {
    justNow: "Sebentar tadi",
    minutes: (count: number) =>
      count === 1 ? "seminit yang lalu" : `${count} minit yang lalu`,
    hours: (count: number) =>
      count === 1 ? "sejam yang lalu" : `${count} jam yang lalu`,
    days: (count: number) =>
      count === 1 ? "sehari yang lalu" : `${count} hari yang lalu`,
    months: (count: number) =>
      count === 1 ? "sebulan yang lalu" : `${count} bulan yang lalu`,
    years: (count: number) =>
      count === 1 ? "setahun yang lalu" : `${count} tahun yang lalu`,
  },

  // Comments that can't be shown
  deleted: "[dipadam]",
  removed: "[dialih keluar]",
  unavailable: "Komen ini tidak tersedia",
  blockedAuthor: "Komen daripada pengguna yang anda sekat",
  showAnyway: "Tunjukkan juga",
  removedByModerator: (reason?: string | null) =>
    `Dialih keluar oleh moderator${reason ? `: ${reason}` : ""} · hanya anda yang dapat melihat ini`,

  // Menus
  report: "Laporkan",
  remove: "Padam",
  confirmDelete: "Adakah anda pasti mahu memadam komen ini?",

  // Report dialog
  reportTitle: "Hantar laporan",
  reportIntro:
    "Terima kasih kerana prihatin terhadap komuniti kami. Beritahu kami apa yang berlaku dan kami akan menelitinya.",
  reportReasons: {
    spam: "Ini spam",
    inappropriateContent: "Mengandungi kandungan yang tidak sesuai",
    harassment: "Ini gangguan atau buli",
    misinformation: "Menyebarkan maklumat palsu",
    hateSpeech: "Mengandungi ucapan atau simbol kebencian",
    violence: "Menggalakkan keganasan atau tingkah laku berbahaya",
    illegalActivity: "Menggalakkan aktiviti haram",
    selfHarm: "Menggalakkan perbuatan mencederakan diri atau bunuh diri",
    other: "Lain-lain",
  } satisfies Record<ReportReasonKey, string>,
  submitReport: "Hantar laporan",
  submittingReport: "Menghantar...",

  // Messages
  loginRequired: "Sila log masuk untuk melakukan tindakan ini",
  commentEmpty: "Komen tidak boleh kosong",
  userNotMentionable:
    "Pengguna ini tiada nama pengguna dan tidak boleh disebut",
  parentDeleted: "Komen ini telah dipadam, jadi anda tidak boleh membalasnya.",
  parentRemoved:
    "Komen ini telah dialih keluar, jadi anda tidak boleh membalasnya.",
  postFailed: "Tidak dapat menyiarkan komen anda. Cuba lagi.",
};

export default strings;
