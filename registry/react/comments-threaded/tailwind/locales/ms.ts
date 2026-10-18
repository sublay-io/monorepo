import type { ReportReasonKey } from "@sublay/react-js";

// 🌐 Every piece of text the comment section shows. Edit the values here to
// reword or translate it. Entries that depend on a number or a name are
// functions, so each language can use its own plural forms and word order.
const strings = {
  // Inputs
  commentPlaceholder: "Sertai perbualan",
  replyPlaceholder: "Tambah balasan anda...",
  cancel: "Batal",
  submitComment: "Hantar",
  addGif: "Tambah GIF",

  // Sorting
  sortBy: "Isih mengikut",
  sortTop: "Teratas",
  sortNew: "Terbaru",
  sortOld: "Terlama",
  sortControversial: "Kontroversi",

  // Comment list
  noCommentsTitle: "Belum ada komen",
  noCommentsSubtitle: "Mulakan perbualan.",
  viewAllComments: "Lihat semua komen",
  loadMoreComments: "Muatkan lebih banyak komen",
  loading: "Memuatkan...",
  loadCommentsFailed: "Tidak dapat memuatkan komen",
  loadMoreFailed: "Tidak dapat memuatkan lagi",
  tryAgain: "Cuba lagi",

  // A comment
  reply: "Balas",
  replyCount: (count: number) => `${count} balasan`,
  moreReplyCount: (count: number) => `${count} lagi balasan`,
  moreReplies: "Lagi balasan",
  expandThread: "Kembangkan bebenang",
  collapseThread: "Kuncupkan bebenang",
  moreOptions: "Lagi pilihan",
  upvote: "Undi naik",
  downvote: "Undi turun",
  removeYourVote: "Alih keluar undian anda",

  // Comments that can't be shown
  deleted: "[dipadam]",
  removed: "[dialih keluar]",
  unavailable: "Komen ini tidak tersedia",
  blockedAuthor: "Komen daripada pengguna yang anda sekat",
  showAnyway: "Tunjukkan juga",
  removedByModerator: (reason?: string | null) =>
    `Dialih keluar oleh moderator${reason ? `: ${reason}` : ""} · hanya anda yang dapat melihat ini`,

  // Mentions
  noUsersFound: "Tiada pengguna ditemui",

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
  usernameRequired:
    "Sila tetapkan nama pengguna sebelum berinteraksi dengan komen",
  commentEmpty: "Komen tidak boleh kosong",
  userNotMentionable:
    "Pengguna ini tidak boleh disebut (nama pengguna belum ditetapkan)",
  parentDeleted: "Komen ini telah dipadam, jadi anda tidak boleh membalasnya.",
  parentRemoved:
    "Komen ini telah dialih keluar, jadi anda tidak boleh membalasnya.",
  postFailed: "Tidak dapat menyiarkan komen anda. Cuba lagi.",
};

export default strings;
