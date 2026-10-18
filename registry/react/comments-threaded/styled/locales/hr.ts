import type { ReportReasonKey } from "@sublay/react-js";

// Croatian nouns take one of three forms, depending on the number.
const plural = (count: number, one: string, few: string, many: string) => {
  const mod10 = count % 10;
  const mod100 = count % 100;
  if (mod10 === 1 && mod100 !== 11) return one;
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return few;
  return many;
};

// 🌐 Every piece of text the comment section shows. Edit the values here to
// reword or translate it. Entries that depend on a number or a name are
// functions, so each language can use its own plural forms and word order.
const strings = {
  // Inputs
  commentPlaceholder: "Uključi se u razgovor",
  replyPlaceholder: "Napiši odgovor...",
  cancel: "Odustani",
  submitComment: "Objavi",
  addGif: "Dodaj GIF",

  // Sorting
  sortBy: "Poredaj po",
  sortTop: "Najbolji",
  sortNew: "Najnoviji",
  sortOld: "Najstariji",
  sortControversial: "Kontroverzni",

  // When a comment was posted
  timeAgo: {
    justNow: "Upravo sada",
    minutes: (count: number) =>
      plural(
        count,
        `prije ${count} minutu`,
        `prije ${count} minute`,
        `prije ${count} minuta`,
      ),
    hours: (count: number) =>
      plural(
        count,
        `prije ${count} sat`,
        `prije ${count} sata`,
        `prije ${count} sati`,
      ),
    days: (count: number) =>
      plural(
        count,
        `prije ${count} dan`,
        `prije ${count} dana`,
        `prije ${count} dana`,
      ),
    months: (count: number) =>
      plural(
        count,
        `prije ${count} mjesec`,
        `prije ${count} mjeseca`,
        `prije ${count} mjeseci`,
      ),
    years: (count: number) =>
      plural(
        count,
        `prije ${count} godinu`,
        `prije ${count} godine`,
        `prije ${count} godina`,
      ),
  },

  // Comment list
  noCommentsTitle: "Još nema komentara",
  noCommentsSubtitle: "Započni razgovor.",
  viewAllComments: "Prikaži sve komentare",
  loadMoreComments: "Učitaj još komentara",
  loading: "Učitavanje...",
  loadCommentsFailed: "Učitavanje komentara nije uspjelo",
  loadMoreFailed: "Učitavanje nije uspjelo",
  tryAgain: "Pokušaj ponovno",

  // A comment
  reply: "Odgovori",
  replyCount: (count: number) =>
    plural(
      count,
      `${count} odgovor`,
      `${count} odgovora`,
      `${count} odgovora`,
    ),
  moreReplyCount: (count: number) =>
    plural(
      count,
      `još ${count} odgovor`,
      `još ${count} odgovora`,
      `još ${count} odgovora`,
    ),
  moreReplies: "Još odgovora",
  expandThread: "Proširi nit",
  collapseThread: "Sažmi nit",
  moreOptions: "Više mogućnosti",
  upvote: "Glasaj za",
  downvote: "Glasaj protiv",
  removeYourVote: "Ukloni svoj glas",

  // Comments that can't be shown
  deleted: "[izbrisano]",
  removed: "[uklonjeno]",
  unavailable: "Ovaj komentar nije dostupan",
  blockedAuthor: "Komentar blokiranog korisnika",
  showAnyway: "Ipak prikaži",
  removedByModerator: (reason?: string | null) =>
    `Uklonio moderator${reason ? `: ${reason}` : ""} · vidljivo samo tebi`,

  // Mentions
  noUsersFound: "Nije pronađen nijedan korisnik",

  // Menus
  report: "Prijavi",
  remove: "Izbriši",
  confirmDelete: "Želiš li sigurno izbrisati ovaj komentar?",

  // Report dialog
  reportTitle: "Pošalji prijavu",
  reportIntro:
    "Hvala što brineš o našoj zajednici. Reci nam što se događa i provjerit ćemo.",
  reportReasons: {
    spam: "Ovo je spam",
    inappropriateContent: "Neprimjeren sadržaj",
    harassment: "Uznemiravanje ili zlostavljanje",
    misinformation: "Širi lažne informacije",
    hateSpeech: "Govor mržnje ili simboli mržnje",
    violence: "Potiče nasilje ili opasno ponašanje",
    illegalActivity: "Potiče nezakonite aktivnosti",
    selfHarm: "Potiče samoozljeđivanje ili samoubojstvo",
    other: "Ostalo",
  } satisfies Record<ReportReasonKey, string>,
  submitReport: "Pošalji prijavu",
  submittingReport: "Slanje...",

  // Messages
  loginRequired: "Za ovu radnju moraš se prijaviti",
  usernameRequired: "Prije komentiranja postavi korisničko ime",
  commentEmpty: "Komentar ne može biti prazan",
  userNotMentionable:
    "Ovog korisnika nije moguće spomenuti (nema korisničko ime)",
  parentDeleted: "Ovaj komentar je izbrisan pa na njega ne možeš odgovoriti.",
  parentRemoved: "Ovaj komentar je uklonjen pa na njega ne možeš odgovoriti.",
  postFailed: "Objava komentara nije uspjela. Pokušaj ponovno.",
};

export default strings;
