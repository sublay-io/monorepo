import type { ReportReasonKey } from "@sublay/react-js";

// 🌐 Every piece of text the comment section shows. Edit the values here to
// reword or translate it. Entries that depend on a number or a name are
// functions, so each language can use its own plural forms and word order.
const strings = {
  // Inputs
  commentPlaceholder: "వ్యాఖ్యను జోడించండి...",
  cancel: "రద్దు చేయండి",
  post: "పోస్ట్ చేయండి",
  replyingTo: (name: string) => `${name}కి ప్రత్యుత్తరం`,

  // Comment list
  noCommentsTitle: "ఇంకా వ్యాఖ్యలు లేవు",
  noCommentsSubtitle: "సంభాషణను ప్రారంభించండి.",
  loadMoreComments: "మరిన్ని వ్యాఖ్యలను లోడ్ చేయండి",
  loading: "లోడ్ అవుతోంది...",
  loadCommentsFailed: "వ్యాఖ్యలను లోడ్ చేయలేకపోయాము",
  loadMoreFailed: "మరిన్ని లోడ్ చేయలేకపోయాము",
  tryAgain: "మళ్లీ ప్రయత్నించండి",
  sortTop: "ఉత్తమమైనవి",
  sortNew: "కొత్తవి",
  sortOld: "పాతవి",

  // A comment
  reply: "ప్రత్యుత్తరం ఇవ్వండి",
  viewMoreReplies: (count: number) => `మరిన్ని ప్రత్యుత్తరాలను చూడండి (${count})`,
  hideReplies: "ప్రత్యుత్తరాలను దాచండి",
  removeYourReaction: "మీ ప్రతిస్పందనను తీసివేయండి",
  timeAgo: {
    justNow: "ఇప్పుడే",
    minutes: (count: number) =>
      count === 1 ? "ఒక నిమిషం క్రితం" : `${count} నిమిషాల క్రితం`,
    hours: (count: number) =>
      count === 1 ? "ఒక గంట క్రితం" : `${count} గంటల క్రితం`,
    days: (count: number) =>
      count === 1 ? "ఒక రోజు క్రితం" : `${count} రోజుల క్రితం`,
    months: (count: number) =>
      count === 1 ? "ఒక నెల క్రితం" : `${count} నెలల క్రితం`,
    years: (count: number) =>
      count === 1 ? "ఒక సంవత్సరం క్రితం" : `${count} సంవత్సరాల క్రితం`,
  },

  // Comments that can't be shown
  deleted: "[తొలగించబడింది]",
  removed: "[తీసివేయబడింది]",
  unavailable: "ఈ వ్యాఖ్య అందుబాటులో లేదు",
  blockedAuthor: "మీరు బ్లాక్ చేసిన వినియోగదారు వ్యాఖ్య",
  showAnyway: "అయినా చూపించండి",
  removedByModerator: (reason?: string | null) =>
    `మోడరేటర్ తీసివేశారు${reason ? `: ${reason}` : ""} · ఇది మీకు మాత్రమే కనిపిస్తుంది`,

  // Menus
  report: "రిపోర్ట్ చేయండి",
  remove: "తొలగించండి",
  confirmDelete: "మీరు ఖచ్చితంగా ఈ వ్యాఖ్యను తొలగించాలనుకుంటున్నారా?",

  // Report dialog
  reportTitle: "రిపోర్ట్‌ను సమర్పించండి",
  reportIntro:
    "మా కమ్యూనిటీ పట్ల శ్రద్ధ చూపినందుకు ధన్యవాదాలు. ఏం జరుగుతోందో మాకు తెలియజేయండి, మేము దాన్ని పరిశీలిస్తాము.",
  reportReasons: {
    spam: "ఇది స్పామ్",
    inappropriateContent: "అనుచితమైన కంటెంట్ ఉంది",
    harassment: "ఇది వేధింపు లేదా బెదిరింపు",
    misinformation: "తప్పుడు సమాచారాన్ని వ్యాప్తి చేస్తోంది",
    hateSpeech: "ద్వేషపూరిత ప్రసంగం లేదా చిహ్నాలు ఉన్నాయి",
    violence: "హింసను లేదా ప్రమాదకరమైన ప్రవర్తనను ప్రోత్సహిస్తోంది",
    illegalActivity: "చట్టవిరుద్ధమైన కార్యకలాపాలను ప్రోత్సహిస్తోంది",
    selfHarm: "స్వీయ హాని లేదా ఆత్మహత్యను ప్రోత్సహిస్తోంది",
    other: "ఇతరం",
  } satisfies Record<ReportReasonKey, string>,
  submitReport: "రిపోర్ట్‌ను సమర్పించండి",
  submittingReport: "సమర్పిస్తోంది...",

  // Messages
  loginRequired: "ఈ చర్యను చేయడానికి దయచేసి లాగిన్ చేయండి",
  commentEmpty: "వ్యాఖ్య ఖాళీగా ఉండకూడదు",
  userNotMentionable:
    "ఈ వినియోగదారుకు వినియోగదారు పేరు లేదు, కాబట్టి వారిని పేర్కొనడం సాధ్యం కాదు",
  parentDeleted: "ఈ వ్యాఖ్య తొలగించబడింది, కాబట్టి మీరు దీనికి ప్రత్యుత్తరం ఇవ్వలేరు.",
  parentRemoved: "ఈ వ్యాఖ్య తీసివేయబడింది, కాబట్టి మీరు దీనికి ప్రత్యుత్తరం ఇవ్వలేరు.",
  postFailed: "మీ వ్యాఖ్యను పోస్ట్ చేయలేకపోయాము. మళ్లీ ప్రయత్నించండి.",
};

export default strings;
