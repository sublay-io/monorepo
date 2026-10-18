import type { ReportReasonKey } from "@sublay/react-native";

// 🌐 Every piece of text the comment section shows. Edit the values here to
// reword or translate it. Entries that depend on a number or a name are
// functions, so each language can use its own plural forms and word order.
const strings = {
  // Inputs
  commentPlaceholder: "Gabung ke percakapan",
  cancel: "Batal",
  replyingTo: "Membalas",
  cancelReply: "Batalkan balasan",

  // Sorting
  sortBy: "Urutkan",
  sortSheetTitle: "Urutkan komentar",
  sortTop: "Teratas",
  sortNew: "Terbaru",
  sortOld: "Terlama",
  sortControversial: "Kontroversial",

  // Comment list
  noCommentsTitle: "Belum ada komentar",
  noCommentsSubtitle: "Mulai percakapan.",
  viewAllComments: "Lihat semua komentar",
  loadMoreComments: "Muat komentar lainnya",
  loading: "Memuat...",
  loadCommentsFailed: "Komentar tidak dapat dimuat",
  loadMoreFailed: "Tidak dapat memuat lainnya",
  tryAgain: "Coba lagi",

  // A comment
  reply: "Balas",
  replyCount: (count: number) => `${count} balasan`,
  moreReplyCount: (count: number) => `${count} balasan lainnya`,
  moreReplies: "Balasan lainnya",
  removeYourVote: "Hapus suara Anda",

  // Comments that can't be shown
  deleted: "[dihapus]",
  removed: "[diturunkan]",
  unavailable: "Komentar ini tidak tersedia",
  blockedAuthor: "Komentar dari pengguna yang Anda blokir",
  showAnyway: "Tetap tampilkan",
  removedByModerator: (reason?: string | null) =>
    `Diturunkan oleh moderator${reason ? `: ${reason}` : ""} · hanya Anda yang dapat melihatnya`,

  // Mentions
  noUsersFound: "Pengguna tidak ditemukan",

  // Menus
  report: "Laporkan",
  delete: "Hapus",
  deleteCommentTitle: "Hapus komentar",
  confirmDelete: "Yakin ingin menghapus komentar ini?",

  // Report dialog
  reportTitle: "Kirim laporan",
  reportIntro:
    "Terima kasih telah menjaga komunitas kami. Beri tahu kami apa yang terjadi dan kami akan memeriksanya.",
  reportReasons: {
    spam: "Ini spam",
    inappropriateContent: "Berisi konten yang tidak pantas",
    harassment: "Pelecehan atau perundungan",
    misinformation: "Menyebarkan informasi palsu",
    hateSpeech: "Berisi ujaran atau simbol kebencian",
    violence: "Mendorong kekerasan atau perilaku berbahaya",
    illegalActivity: "Mendorong aktivitas ilegal",
    selfHarm: "Mendorong tindakan menyakiti diri atau bunuh diri",
    other: "Lainnya",
  } satisfies Record<ReportReasonKey, string>,
  submitReport: "Kirim laporan",
  submittingReport: "Mengirim...",

  // Messages
  parentDeleted: "Komentar ini telah dihapus, jadi tidak dapat dibalas.",
  parentRemoved: "Komentar ini telah diturunkan, jadi tidak dapat dibalas.",
  postFailed: "Komentar Anda tidak dapat dikirim. Coba lagi.",
};

export default strings;
