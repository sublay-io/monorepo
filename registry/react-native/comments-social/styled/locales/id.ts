import type { ReportReasonKey } from "@sublay/react-native";

// 🌐 Every piece of text the comment section shows. Edit the values here to
// reword or translate it. Entries that depend on a number or a name are
// functions, so each language can use its own plural forms and word order.
const strings = {
  // Inputs
  commentPlaceholder: "Tambahkan komentar...",
  cancel: "Batal",
  post: "Kirim",
  replyingTo: (name: string) => `Membalas ${name}`,

  // Comment list
  noCommentsTitle: "Belum ada komentar",
  noCommentsSubtitle: "Mulai percakapan.",
  loadCommentsFailed: "Komentar tidak dapat dimuat",
  loadMoreFailed: "Tidak dapat memuat lainnya",
  tryAgain: "Coba lagi",
  sortTop: "Teratas",
  sortNew: "Terbaru",
  sortOld: "Terlama",

  // A comment
  reply: "Balas",
  viewMoreReplies: (count: number) => `Lihat balasan lainnya (${count})`,
  hideReplies: "Sembunyikan balasan",
  removeYourReaction: "Hapus reaksi Anda",
  timeAgo: {
    justNow: "Baru saja",
    minutes: (count: number) => `${count} menit yang lalu`,
    hours: (count: number) => `${count} jam yang lalu`,
    days: (count: number) => `${count} hari yang lalu`,
    months: (count: number) => `${count} bulan yang lalu`,
    years: (count: number) => `${count} tahun yang lalu`,
  },

  // Comments that can't be shown
  deleted: "[dihapus]",
  removed: "[diturunkan]",
  unavailable: "Komentar ini tidak tersedia",
  blockedAuthor: "Komentar dari pengguna yang Anda blokir",
  showAnyway: "Tetap tampilkan",
  removedByModerator: (reason?: string | null) =>
    `Diturunkan oleh moderator${reason ? `: ${reason}` : ""} · hanya Anda yang dapat melihatnya`,

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
