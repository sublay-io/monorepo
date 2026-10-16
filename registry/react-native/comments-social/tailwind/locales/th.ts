import type { ReportReasonKey } from "@sublay/react-native";

// 🌐 Every piece of text the comment section shows. Edit the values here to
// reword or translate it. Entries that depend on a number or a name are
// functions, so each language can use its own plural forms and word order.
const strings = {
  // Inputs
  commentPlaceholder: "เพิ่มความคิดเห็น...",
  cancel: "ยกเลิก",
  post: "โพสต์",
  replyingTo: (name: string) => `กำลังตอบกลับ ${name}`,

  // Comment list
  noCommentsTitle: "ยังไม่มีความคิดเห็น",
  noCommentsSubtitle: "มาเริ่มบทสนทนากันเลย",
  loadCommentsFailed: "โหลดความคิดเห็นไม่สำเร็จ",
  loadMoreFailed: "โหลดเพิ่มเติมไม่สำเร็จ",
  tryAgain: "ลองอีกครั้ง",
  sortTop: "ยอดนิยม",
  sortNew: "ล่าสุด",
  sortOld: "เก่าสุด",

  // A comment
  reply: "ตอบกลับ",
  viewMoreReplies: (count: number) => `ดูการตอบกลับอีก ${count} รายการ`,
  hideReplies: "ซ่อนการตอบกลับ",
  removeYourReaction: "ยกเลิกการแสดงความรู้สึกของคุณ",
  timeAgo: {
    justNow: "เมื่อสักครู่",
    minutes: (count: number) => `${count} นาทีที่แล้ว`,
    hours: (count: number) => `${count} ชั่วโมงที่แล้ว`,
    days: (count: number) => `${count} วันที่แล้ว`,
    months: (count: number) => `${count} เดือนที่แล้ว`,
    years: (count: number) => `${count} ปีที่แล้ว`,
  },

  // Comments that can't be shown
  deleted: "[ถูกลบ]",
  removed: "[ถูกนำออก]",
  unavailable: "ไม่สามารถแสดงความคิดเห็นนี้ได้",
  blockedAuthor: "ความคิดเห็นจากผู้ใช้ที่คุณบล็อก",
  showAnyway: "แสดงอยู่ดี",
  removedByModerator: (reason?: string | null) =>
    `ถูกนำออกโดยผู้ดูแล${reason ? `: ${reason}` : ""} · มีเพียงคุณที่เห็นข้อความนี้`,

  // Menus
  report: "รายงาน",
  delete: "ลบ",
  deleteCommentTitle: "ลบความคิดเห็น",
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
  parentDeleted: "ความคิดเห็นนี้ถูกลบแล้ว จึงตอบกลับไม่ได้",
  parentRemoved: "ความคิดเห็นนี้ถูกนำออกแล้ว จึงตอบกลับไม่ได้",
  postFailed: "โพสต์ความคิดเห็นไม่สำเร็จ ลองอีกครั้ง",
};

export default strings;
