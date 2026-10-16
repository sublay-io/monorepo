import type { ReportReasonKey } from "@sublay/react-js";

// Romanian nouns take one of three forms; 20 and up add "de" unless the last two digits are 01-19.
const plural = (count: number, one: string, few: string, other: string) => {
  const mod100 = count % 100;
  if (count === 1) return one;
  if (count === 0 || (mod100 >= 1 && mod100 <= 19)) return few;
  return other;
};

// 🌐 Every piece of text the comment section shows. Edit the values here to
// reword or translate it. Entries that depend on a number or a name are
// functions, so each language can use its own plural forms and word order.
const strings = {
  // Inputs
  commentPlaceholder: "Adaugă un comentariu...",
  cancel: "Anulează",
  post: "Publică",
  replyingTo: (name: string) => `Răspunzi lui ${name}`,

  // Comment list
  noCommentsTitle: "Niciun comentariu încă",
  noCommentsSubtitle: "Începe conversația.",
  loadMoreComments: "Încarcă mai multe comentarii",
  loading: "Se încarcă...",
  loadCommentsFailed: "Comentariile nu au putut fi încărcate",
  loadMoreFailed: "Nu s-au putut încărca mai multe",
  tryAgain: "Încearcă din nou",
  sortTop: "Top",
  sortNew: "Noi",
  sortOld: "Vechi",

  // A comment
  reply: "Răspunde",
  viewMoreReplies: (count: number) => `Vezi mai multe răspunsuri (${count})`,
  hideReplies: "Ascunde răspunsurile",
  removeYourReaction: "Retrage-ți reacția",
  timeAgo: {
    justNow: "Chiar acum",
    minutes: (count: number) =>
      plural(count, `acum un minut`, `acum ${count} minute`, `acum ${count} de minute`),
    hours: (count: number) =>
      plural(count, `acum o oră`, `acum ${count} ore`, `acum ${count} de ore`),
    days: (count: number) =>
      plural(count, `acum o zi`, `acum ${count} zile`, `acum ${count} de zile`),
    months: (count: number) =>
      plural(count, `acum o lună`, `acum ${count} luni`, `acum ${count} de luni`),
    years: (count: number) =>
      plural(count, `acum un an`, `acum ${count} ani`, `acum ${count} de ani`),
  },

  // Comments that can't be shown
  deleted: "[șters]",
  removed: "[eliminat]",
  unavailable: "Acest comentariu nu este disponibil",
  blockedAuthor: "Comentariu de la un utilizator pe care l-ai blocat",
  showAnyway: "Afișează oricum",
  removedByModerator: (reason?: string | null) =>
    `Eliminat de un moderator${reason ? `: ${reason}` : ""} · doar tu poți vedea asta`,

  // Menus
  report: "Raportează",
  remove: "Șterge",
  confirmDelete: "Sigur vrei să ștergi acest comentariu?",

  // Report dialog
  reportTitle: "Trimite o raportare",
  reportIntro:
    "Îți mulțumim că ai grijă de comunitatea noastră. Spune-ne ce se întâmplă și ne vom ocupa.",
  reportReasons: {
    spam: "Este spam",
    inappropriateContent: "Are conținut nepotrivit",
    harassment: "Este hărțuire sau intimidare",
    misinformation: "Răspândește informații false",
    hateSpeech: "Conține discurs instigator la ură sau simboluri de ură",
    violence: "Promovează violența sau comportamente periculoase",
    illegalActivity: "Promovează activități ilegale",
    selfHarm: "Promovează autovătămarea sau sinuciderea",
    other: "Altceva",
  } satisfies Record<ReportReasonKey, string>,
  submitReport: "Trimite raportarea",
  submittingReport: "Se trimite...",

  // Messages
  loginRequired: "Conectează-te pentru a efectua această acțiune",
  commentEmpty: "Comentariul nu poate fi gol",
  userNotMentionable:
    "Acest utilizator nu are nume de utilizator și nu poate fi menționat",
  parentDeleted: "Acest comentariu a fost șters, așa că nu îi mai poți răspunde.",
  parentRemoved: "Acest comentariu a fost eliminat, așa că nu îi mai poți răspunde.",
  postFailed: "Comentariul nu a putut fi publicat. Încearcă din nou.",
};

export default strings;
