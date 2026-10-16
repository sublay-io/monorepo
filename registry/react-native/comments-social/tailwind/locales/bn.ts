import type { ReportReasonKey } from "@sublay/react-native";

// 🌐 Every piece of text the comment section shows. Edit the values here to
// reword or translate it. Entries that depend on a number or a name are
// functions, so each language can use its own plural forms and word order.
const strings = {
  // Inputs
  commentPlaceholder: "একটি মন্তব্য লিখুন...",
  cancel: "বাতিল করুন",
  post: "পোস্ট করুন",
  replyingTo: (name: string) => `${name}-কে উত্তর দিচ্ছেন`,

  // Comment list
  noCommentsTitle: "এখনও কোনো মন্তব্য নেই",
  noCommentsSubtitle: "আলোচনা শুরু করুন।",
  loadCommentsFailed: "মন্তব্য লোড করা যায়নি",
  loadMoreFailed: "আরও লোড করা যায়নি",
  tryAgain: "আবার চেষ্টা করুন",
  sortTop: "জনপ্রিয়",
  sortNew: "নতুন",
  sortOld: "পুরনো",

  // A comment
  reply: "উত্তর দিন",
  viewMoreReplies: (count: number) => `আরও ${count}টি উত্তর দেখুন`,
  hideReplies: "উত্তর লুকান",
  removeYourReaction: "আপনার প্রতিক্রিয়া সরান",
  timeAgo: {
    justNow: "এইমাত্র",
    minutes: (count: number) => `${count} মিনিট আগে`,
    hours: (count: number) => `${count} ঘণ্টা আগে`,
    days: (count: number) => `${count} দিন আগে`,
    months: (count: number) => `${count} মাস আগে`,
    years: (count: number) => `${count} বছর আগে`,
  },

  // Comments that can't be shown
  deleted: "[মুছে ফেলা হয়েছে]",
  removed: "[সরানো হয়েছে]",
  unavailable: "এই মন্তব্যটি উপলব্ধ নেই",
  blockedAuthor: "আপনার ব্লক করা একজন ব্যবহারকারীর মন্তব্য",
  showAnyway: "তবুও দেখান",
  removedByModerator: (reason?: string | null) =>
    `একজন মডারেটর সরিয়ে দিয়েছেন${reason ? `: ${reason}` : ""} · শুধু আপনি এটি দেখতে পাচ্ছেন`,

  // Menus
  report: "রিপোর্ট করুন",
  delete: "মুছুন",
  deleteCommentTitle: "মন্তব্য মুছুন",
  confirmDelete: "আপনি কি নিশ্চিত যে এই মন্তব্যটি মুছতে চান?",

  // Report dialog
  reportTitle: "রিপোর্ট জমা দিন",
  reportIntro:
    "আমাদের কমিউনিটির খেয়াল রাখার জন্য ধন্যবাদ। কী ঘটছে আমাদের জানান, আমরা বিষয়টি খতিয়ে দেখব।",
  reportReasons: {
    spam: "এটি স্প্যাম",
    inappropriateContent: "এতে অনুপযুক্ত কনটেন্ট আছে",
    harassment: "এটি হয়রানি বা উৎপীড়ন",
    misinformation: "এটি ভুল তথ্য ছড়ায়",
    hateSpeech: "এতে বিদ্বেষমূলক ভাষা বা প্রতীক আছে",
    violence: "এটি সহিংসতা বা বিপজ্জনক আচরণে উৎসাহ দেয়",
    illegalActivity: "এটি বেআইনি কার্যকলাপে উৎসাহ দেয়",
    selfHarm: "এটি আত্মক্ষতি বা আত্মহত্যায় উৎসাহ দেয়",
    other: "অন্যান্য",
  } satisfies Record<ReportReasonKey, string>,
  submitReport: "রিপোর্ট জমা দিন",
  submittingReport: "জমা দেওয়া হচ্ছে...",

  // Messages
  parentDeleted: "এই মন্তব্যটি মুছে ফেলা হয়েছে, তাই আপনি এর উত্তর দিতে পারবেন না।",
  parentRemoved: "এই মন্তব্যটি সরিয়ে ফেলা হয়েছে, তাই আপনি এর উত্তর দিতে পারবেন না।",
  postFailed: "আপনার মন্তব্য পোস্ট করা যায়নি। আবার চেষ্টা করুন।",
};

export default strings;
