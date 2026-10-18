import type { ReportReasonKey } from "@sublay/react-js";

// 🌐 Every piece of text the comment section shows. Edit the values here to
// reword or translate it. Entries that depend on a number or a name are
// functions, so each language can use its own plural forms and word order.
const strings = {
  // Inputs
  commentPlaceholder: "আলোচনায় যোগ দিন",
  replyPlaceholder: "আপনার উত্তর লিখুন...",
  cancel: "বাতিল করুন",
  submitComment: "পোস্ট করুন",
  addGif: "GIF যোগ করুন",

  // Sorting
  sortBy: "সাজান",
  sortTop: "জনপ্রিয়",
  sortNew: "নতুন",
  sortOld: "পুরনো",
  sortControversial: "বিতর্কিত",

  // Comment list
  noCommentsTitle: "এখনও কোনো মন্তব্য নেই",
  noCommentsSubtitle: "আলোচনা শুরু করুন।",
  viewAllComments: "সব মন্তব্য দেখুন",
  loadMoreComments: "আরও মন্তব্য লোড করুন",
  loading: "লোড হচ্ছে...",
  loadCommentsFailed: "মন্তব্য লোড করা যায়নি",
  loadMoreFailed: "আরও লোড করা যায়নি",
  tryAgain: "আবার চেষ্টা করুন",

  // A comment
  reply: "উত্তর দিন",
  replyCount: (count: number) => `${count}টি উত্তর`,
  moreReplyCount: (count: number) => `আরও ${count}টি উত্তর`,
  moreReplies: "আরও উত্তর",
  expandThread: "থ্রেড প্রসারিত করুন",
  collapseThread: "থ্রেড সংকুচিত করুন",
  moreOptions: "আরও বিকল্প",
  upvote: "আপভোট",
  downvote: "ডাউনভোট",
  removeYourVote: "আপনার ভোট সরান",

  // Comments that can't be shown
  deleted: "[মুছে ফেলা হয়েছে]",
  removed: "[সরানো হয়েছে]",
  unavailable: "এই মন্তব্যটি উপলব্ধ নেই",
  blockedAuthor: "আপনার ব্লক করা একজন ব্যবহারকারীর মন্তব্য",
  showAnyway: "তবুও দেখান",
  removedByModerator: (reason?: string | null) =>
    `একজন মডারেটর সরিয়ে দিয়েছেন${reason ? `: ${reason}` : ""} · শুধু আপনি এটি দেখতে পাচ্ছেন`,

  // Mentions
  noUsersFound: "কোনো ব্যবহারকারী পাওয়া যায়নি",

  // Menus
  report: "রিপোর্ট করুন",
  remove: "মুছুন",
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
  loginRequired: "এই কাজটি করতে লগ ইন করুন",
  usernameRequired: "মন্তব্যে অংশ নেওয়ার আগে একটি ইউজারনেম সেট করুন",
  commentEmpty: "মন্তব্য খালি রাখা যাবে না",
  userNotMentionable: "এই ব্যবহারকারীকে উল্লেখ করা যাবে না (কোনো ইউজারনেম সেট করা নেই)",
  parentDeleted: "এই মন্তব্যটি মুছে ফেলা হয়েছে, তাই আপনি এর উত্তর দিতে পারবেন না।",
  parentRemoved: "এই মন্তব্যটি সরিয়ে ফেলা হয়েছে, তাই আপনি এর উত্তর দিতে পারবেন না।",
  postFailed: "আপনার মন্তব্য পোস্ট করা যায়নি। আবার চেষ্টা করুন।",
};

export default strings;
