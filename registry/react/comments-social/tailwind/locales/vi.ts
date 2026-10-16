import type { ReportReasonKey } from "@sublay/react-js";

// 🌐 Every piece of text the comment section shows. Edit the values here to
// reword or translate it. Entries that depend on a number or a name are
// functions, so each language can use its own plural forms and word order.
const strings = {
  // Inputs
  commentPlaceholder: "Viết bình luận...",
  cancel: "Hủy",
  post: "Đăng",
  replyingTo: (name: string) => `Đang phản hồi ${name}`,

  // Comment list
  noCommentsTitle: "Chưa có bình luận nào",
  noCommentsSubtitle: "Hãy bắt đầu cuộc trò chuyện.",
  loadMoreComments: "Tải thêm bình luận",
  loading: "Đang tải...",
  loadCommentsFailed: "Không thể tải bình luận",
  loadMoreFailed: "Không thể tải thêm",
  tryAgain: "Thử lại",
  sortTop: "Hàng đầu",
  sortNew: "Mới nhất",
  sortOld: "Cũ nhất",

  // A comment
  reply: "Phản hồi",
  viewMoreReplies: (count: number) => `Xem thêm phản hồi (${count})`,
  hideReplies: "Ẩn phản hồi",
  removeYourReaction: "Bỏ cảm xúc của bạn",
  timeAgo: {
    justNow: "Vừa xong",
    minutes: (count: number) => `${count} phút trước`,
    hours: (count: number) => `${count} giờ trước`,
    days: (count: number) => `${count} ngày trước`,
    months: (count: number) => `${count} tháng trước`,
    years: (count: number) => `${count} năm trước`,
  },

  // Comments that can't be shown
  deleted: "[đã xóa]",
  removed: "[đã gỡ]",
  unavailable: "Bình luận này không khả dụng",
  blockedAuthor: "Bình luận từ người dùng bạn đã chặn",
  showAnyway: "Vẫn hiển thị",
  removedByModerator: (reason?: string | null) =>
    `Đã bị người kiểm duyệt gỡ${reason ? `: ${reason}` : ""} · chỉ bạn nhìn thấy nội dung này`,

  // Menus
  report: "Báo cáo",
  remove: "Xóa",
  confirmDelete: "Bạn có chắc muốn xóa bình luận này không?",

  // Report dialog
  reportTitle: "Gửi báo cáo",
  reportIntro:
    "Cảm ơn bạn đã góp phần bảo vệ cộng đồng. Hãy cho chúng tôi biết chuyện gì đang xảy ra, chúng tôi sẽ xem xét.",
  reportReasons: {
    spam: "Đây là spam",
    inappropriateContent: "Có nội dung không phù hợp",
    harassment: "Quấy rối hoặc bắt nạt",
    misinformation: "Lan truyền thông tin sai lệch",
    hateSpeech: "Có ngôn từ hoặc biểu tượng thù ghét",
    violence: "Cổ xúy bạo lực hoặc hành vi nguy hiểm",
    illegalActivity: "Cổ xúy hoạt động phi pháp",
    selfHarm: "Cổ xúy hành vi tự hại hoặc tự tử",
    other: "Khác",
  } satisfies Record<ReportReasonKey, string>,
  submitReport: "Gửi báo cáo",
  submittingReport: "Đang gửi...",

  // Messages
  loginRequired: "Vui lòng đăng nhập để thực hiện thao tác này",
  commentEmpty: "Bình luận không được để trống",
  userNotMentionable:
    "Người dùng này chưa có tên người dùng nên không thể nhắc đến",
  parentDeleted: "Bình luận này đã bị xóa nên bạn không thể phản hồi.",
  parentRemoved: "Bình luận này đã bị gỡ nên bạn không thể phản hồi.",
  postFailed: "Không thể đăng bình luận của bạn. Hãy thử lại.",
};

export default strings;
