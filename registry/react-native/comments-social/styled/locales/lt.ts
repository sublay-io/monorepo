import type { ReportReasonKey } from "@sublay/react-native";

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
  commentPlaceholder: "Parašykite komentarą...",
  cancel: "Atšaukti",
  post: "Paskelbti",
  replyingTo: (name: string) => `Atsakoma naudotojui ${name}`,

  // Comment list
  noCommentsTitle: "Komentarų dar nėra",
  noCommentsSubtitle: "Pradėkite pokalbį.",
  loadCommentsFailed: "Nepavyko įkelti komentarų",
  loadMoreFailed: "Nepavyko įkelti daugiau",
  tryAgain: "Bandyti dar kartą",
  sortTop: "Populiariausi",
  sortNew: "Naujausi",
  sortOld: "Seniausi",

  // A comment
  reply: "Atsakyti",
  viewMoreReplies: (count: number) =>
    plural(
      count,
      `Rodyti dar ${count} atsakymą`,
      `Rodyti dar ${count} atsakymus`,
      `Rodyti dar ${count} atsakymų`,
    ),
  hideReplies: "Slėpti atsakymus",
  removeYourReaction: "Pašalinti savo reakciją",
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

  // Comments that can't be shown
  deleted: "[ištrinta]",
  removed: "[pašalinta]",
  unavailable: "Šis komentaras nepasiekiamas",
  blockedAuthor: "Jūsų užblokuoto naudotojo komentaras",
  showAnyway: "Vis tiek rodyti",
  removedByModerator: (reason?: string | null) =>
    `Pašalino moderatorius${reason ? `: ${reason}` : ""} · matote tik jūs`,

  // Menus
  report: "Pranešti",
  delete: "Ištrinti",
  deleteCommentTitle: "Ištrinti komentarą",
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
  parentDeleted: "Šis komentaras ištrintas, todėl į jį atsakyti negalite.",
  parentRemoved: "Šis komentaras pašalintas, todėl į jį atsakyti negalite.",
  postFailed: "Nepavyko paskelbti komentaro. Bandykite dar kartą.",
};

export default strings;
