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
  commentPlaceholder: "Dodaj komentar...",
  cancel: "Odustani",
  post: "Objavi",
  replyingTo: (name: string) => `Odgovor korisniku ${name}`,

  // Comment list
  noCommentsTitle: "Još nema komentara",
  noCommentsSubtitle: "Započni razgovor.",
  loadMoreComments: "Učitaj još komentara",
  loading: "Učitavanje...",
  loadCommentsFailed: "Učitavanje komentara nije uspjelo",
  loadMoreFailed: "Učitavanje nije uspjelo",
  tryAgain: "Pokušaj ponovno",
  sortTop: "Najbolji",
  sortNew: "Najnoviji",
  sortOld: "Najstariji",

  // A comment
  reply: "Odgovori",
  viewMoreReplies: (count: number) => `Prikaži još odgovora (${count})`,
  hideReplies: "Sakrij odgovore",
  removeYourReaction: "Ukloni svoju reakciju",
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

  // Comments that can't be shown
  deleted: "[izbrisano]",
  removed: "[uklonjeno]",
  unavailable: "Ovaj komentar nije dostupan",
  blockedAuthor: "Komentar blokiranog korisnika",
  showAnyway: "Ipak prikaži",
  removedByModerator: (reason?: string | null) =>
    `Uklonio moderator${reason ? `: ${reason}` : ""} · vidljivo samo tebi`,

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
  commentEmpty: "Komentar ne može biti prazan",
  userNotMentionable:
    "Ovaj korisnik nema korisničko ime pa ga nije moguće spomenuti",
  parentDeleted: "Ovaj komentar je izbrisan pa na njega ne možeš odgovoriti.",
  parentRemoved: "Ovaj komentar je uklonjen pa na njega ne možeš odgovoriti.",
  postFailed: "Objava komentara nije uspjela. Pokušaj ponovno.",
};

export default strings;
