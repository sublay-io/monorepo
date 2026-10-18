import type { ReportReasonKey } from "@sublay/react-js";

// Lithuanian nouns take one of three forms: 1, 21, 31… / 2–9, 22–29… / 0, 10–20, 30…
const plural = (count: number, one: string, few: string, other: string) => {
  const mod10 = count % 10;
  const mod100 = count % 100;
  if (mod100 >= 11 && mod100 <= 19) return other;
  if (mod10 === 1) return one;
  if (mod10 >= 2) return few;
  return other;
};

// 🌐 Every piece of text the comment section shows. Edit the values here to
// reword or translate it. Entries that depend on a number or a name are
// functions, so each language can use its own plural forms and word order.
const strings = {
  // Inputs
  commentPlaceholder: "Įsitraukite į pokalbį",
  replyPlaceholder: "Parašykite atsakymą...",
  cancel: "Atšaukti",
  submitComment: "Skelbti",
  addGif: "Pridėti GIF",

  // Sorting
  sortBy: "Rikiuoti pagal",
  sortTop: "Populiariausi",
  sortNew: "Naujausi",
  sortOld: "Seniausi",
  sortControversial: "Prieštaringi",

  // When a comment was posted
  timeAgo: {
    justNow: "Ką tik",
    minutes: (count: number) =>
      count === 1
        ? "prieš minutę"
        : plural(count, `prieš ${count} minutę`, `prieš ${count} minutes`, `prieš ${count} minučių`),
    hours: (count: number) =>
      count === 1
        ? "prieš valandą"
        : plural(count, `prieš ${count} valandą`, `prieš ${count} valandas`, `prieš ${count} valandų`),
    days: (count: number) =>
      count === 1
        ? "prieš dieną"
        : plural(count, `prieš ${count} dieną`, `prieš ${count} dienas`, `prieš ${count} dienų`),
    months: (count: number) =>
      count === 1
        ? "prieš mėnesį"
        : plural(count, `prieš ${count} mėnesį`, `prieš ${count} mėnesius`, `prieš ${count} mėnesių`),
    years: (count: number) =>
      count === 1
        ? "prieš metus"
        : plural(count, `prieš ${count} metus`, `prieš ${count} metus`, `prieš ${count} metų`),
  },

  // Comment list
  noCommentsTitle: "Komentarų dar nėra",
  noCommentsSubtitle: "Pradėkite pokalbį.",
  viewAllComments: "Rodyti visus komentarus",
  loadMoreComments: "Įkelti daugiau komentarų",
  loading: "Įkeliama...",
  loadCommentsFailed: "Nepavyko įkelti komentarų",
  loadMoreFailed: "Nepavyko įkelti daugiau",
  tryAgain: "Bandyti dar kartą",

  // A comment
  reply: "Atsakyti",
  replyCount: (count: number) =>
    plural(count, `${count} atsakymas`, `${count} atsakymai`, `${count} atsakymų`),
  moreReplyCount: (count: number) =>
    plural(
      count,
      `dar ${count} atsakymas`,
      `dar ${count} atsakymai`,
      `dar ${count} atsakymų`,
    ),
  moreReplies: "Daugiau atsakymų",
  expandThread: "Išskleisti giją",
  collapseThread: "Suskleisti giją",
  moreOptions: "Daugiau parinkčių",
  upvote: "Balsuoti už",
  downvote: "Balsuoti prieš",
  removeYourVote: "Atšaukti savo balsą",

  // Comments that can't be shown
  deleted: "[ištrinta]",
  removed: "[pašalinta]",
  unavailable: "Šis komentaras nepasiekiamas",
  blockedAuthor: "Jūsų užblokuoto naudotojo komentaras",
  showAnyway: "Vis tiek rodyti",
  removedByModerator: (reason?: string | null) =>
    `Pašalino moderatorius${reason ? `: ${reason}` : ""} · matote tik jūs`,

  // Mentions
  noUsersFound: "Naudotojų nerasta",

  // Menus
  report: "Pranešti",
  remove: "Ištrinti",
  confirmDelete: "Ar tikrai norite ištrinti šį komentarą?",

  // Report dialog
  reportTitle: "Pateikti pranešimą",
  reportIntro:
    "Dėkojame, kad rūpinatės mūsų bendruomene. Praneškite mums, kas vyksta, ir mes tai išsiaiškinsime.",
  reportReasons: {
    spam: "Tai šlamštas",
    inappropriateContent: "Yra netinkamo turinio",
    harassment: "Tai priekabiavimas ar patyčios",
    misinformation: "Skleidžia melagingą informaciją",
    hateSpeech: "Yra neapykantą kurstančių pasisakymų ar simbolių",
    violence: "Skatina smurtą ar pavojingą elgesį",
    illegalActivity: "Skatina neteisėtą veiklą",
    selfHarm: "Skatina savęs žalojimą ar savižudybę",
    other: "Kita",
  } satisfies Record<ReportReasonKey, string>,
  submitReport: "Pateikti pranešimą",
  submittingReport: "Pateikiama...",

  // Messages
  loginRequired: "Prisijunkite, kad galėtumėte atlikti šį veiksmą",
  usernameRequired: "Prieš komentuodami nusistatykite naudotojo vardą",
  commentEmpty: "Komentaras negali būti tuščias",
  userNotMentionable: "Šio naudotojo negalima paminėti (nenustatytas naudotojo vardas)",
  parentDeleted: "Šis komentaras ištrintas, todėl į jį atsakyti negalite.",
  parentRemoved: "Šis komentaras pašalintas, todėl į jį atsakyti negalite.",
  postFailed: "Nepavyko paskelbti komentaro. Bandykite dar kartą.",
};

export default strings;
