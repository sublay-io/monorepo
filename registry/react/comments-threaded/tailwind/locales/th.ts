import type { ReportReasonKey } from "@sublay/react-js";

// 🌐 Every piece of text the comment section shows. Edit the values here to
// reword or translate it. Entries that depend on a number or a name are
// functions, so each language can use its own plural forms and word order.
const strings = {
  // Inputs
  commentPlaceholder: "ร่วมแสดงความคิดเห็น",
  replyPlaceholder: "เขียนการตอบกลับ...",
  cancel: "ยกเลิก",
  submitComment: "โพสต์",
  addGif: "เพิ่ม GIF",

  // Comment list
  noCommentsTitle: "ยังไม่มีความคิดเห็น",
  noCommentsSubtitle: "มาเริ่มบทสนทนากันเลย",
  viewAllComments: "ดูความคิดเห็นทั้งหมด",
  loadMoreComments: "โหลดความคิดเห็นเพิ่มเติม",
  loading: "กำลังโหลด...",
  loadCommentsFailed: "โหลดความคิดเห็นไม่สำเร็จ",
  loadMoreFailed: "โหลดเพิ่มเติมไม่สำเร็จ",
  tryAgain: "ลองอีกครั้ง",

  // A comment
  reply: "ตอบกลับ",
  replyCount: (count: number) => `การตอบกลับ ${count} รายการ`,
  moreReplyCount: (count: number) => `การตอบกลับอีก ${count} รายการ`,
  moreReplies: "การตอบกลับเพิ่มเติม",
  continueThread: "ดูเธรดนี้ต่อ",
  expandThread: "ขยายเธรด",
  collapseThread: "ยุบเธรด",
  moreOptions: "ตัวเลือกเพิ่มเติม",
  upvote: "โหวตขึ้น",
  downvote: "โหวตลง",
  removeYourVote: "ยกเลิกการโหวตของคุณ",

  // Comments that can't be shown
  deleted: "[ถูกลบ]",
  removed: "[ถูกนำออก]",
  unavailable: "ไม่สามารถแสดงความคิดเห็นนี้ได้",
  blockedAuthor: "ความคิดเห็นจากผู้ใช้ที่คุณบล็อก",
  showAnyway: "แสดงอยู่ดี",
  removedByModerator: (reason?: string | null) =>
    `ถูกนำออกโดยผู้ดูแล${reason ? `: ${reason}` : ""} · มีเพียงคุณที่เห็นข้อความนี้`,

  // Mentions
  noUsersFound: "ไม่พบผู้ใช้",

  // Menus
  report: "รายงาน",
  remove: "ลบ",
  confirmDelete: "คุณแน่ใจหรือไม่ว่าต้องการลบความคิดเห็นนี้",

  // Report dialog
  reportTitle: "ส่งรายงาน",
  reportIntro:
    "ขอบคุณที่ช่วยดูแลชุมชนของเรา บอกเราว่าเกิดอะไรขึ้น แล้วเราจะตรวจสอบให้",
  reportReasons: {
    spam: "เป็นสแปม",
    inappropriateContent: "มีเนื้อหาที่ไม่เหมาะสม",
    harassment: "เป็นการคุกคามหรือกลั่นแกล้ง",
    misinformation: "เผยแพร่ข้อมูลเท็จ",
    hateSpeech: "มีถ้อยคำหรือสัญลักษณ์ที่แสดงความเกลียดชัง",
    violence: "ส่งเสริมความรุนแรงหรือพฤติกรรมที่เป็นอันตราย",
    illegalActivity: "ส่งเสริมกิจกรรมที่ผิดกฎหมาย",
    selfHarm: "ส่งเสริมการทำร้ายตัวเองหรือการฆ่าตัวตาย",
    other: "อื่นๆ",
  } satisfies Record<ReportReasonKey, string>,
  submitReport: "ส่งรายงาน",
  submittingReport: "กำลังส่ง...",

  // Messages
  loginRequired: "โปรดเข้าสู่ระบบเพื่อดำเนินการนี้",
  usernameRequired: "โปรดตั้งชื่อผู้ใช้ก่อนโต้ตอบกับความคิดเห็น",
  commentEmpty: "ความคิดเห็นต้องไม่ว่างเปล่า",
  userNotMentionable:
    "ไม่สามารถกล่าวถึงผู้ใช้นี้ได้ (ยังไม่ได้ตั้งชื่อผู้ใช้)",
  parentDeleted: "ความคิดเห็นนี้ถูกลบแล้ว จึงตอบกลับไม่ได้",
  parentRemoved: "ความคิดเห็นนี้ถูกนำออกแล้ว จึงตอบกลับไม่ได้",
  postFailed: "โพสต์ความคิดเห็นไม่สำเร็จ ลองอีกครั้ง",
};

export default strings;
