import type { ReportReasonKey } from "@sublay/react-js";

// Polish nouns take one of three forms, depending on the number.
const plural = (count: number, one: string, few: string, many: string) => {
  const mod10 = count % 10;
  const mod100 = count % 100;
  if (count === 1) return one;
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return few;
  return many;
};

// 🌐 Every piece of text the comment section shows. Edit the values here to
// reword or translate it. Entries that depend on a number or a name are
// functions, so each language can use its own plural forms and word order.
const strings = {
  // Inputs
  commentPlaceholder: "Dodaj komentarz...",
  cancel: "Anuluj",
  post: "Opublikuj",
  replyingTo: (name: string) => `Odpowiedź dla ${name}`,

  // Comment list
  noCommentsTitle: "Brak komentarzy",
  noCommentsSubtitle: "Rozpocznij rozmowę.",
  loadMoreComments: "Wczytaj więcej komentarzy",
  loading: "Wczytywanie...",
  loadCommentsFailed: "Nie udało się wczytać komentarzy",
  loadMoreFailed: "Nie udało się wczytać więcej",
  tryAgain: "Spróbuj ponownie",
  sortTop: "Najlepsze",
  sortNew: "Najnowsze",
  sortOld: "Najstarsze",

  // A comment
  reply: "Odpowiedz",
  viewMoreReplies: (count: number) => `Zobacz więcej odpowiedzi (${count})`,
  hideReplies: "Ukryj odpowiedzi",
  removeYourReaction: "Cofnij swoją reakcję",
  timeAgo: {
    justNow: "Przed chwilą",
    minutes: (count: number) =>
      plural(count, "minutę temu", `${count} minuty temu`, `${count} minut temu`),
    hours: (count: number) =>
      plural(count, "godzinę temu", `${count} godziny temu`, `${count} godzin temu`),
    days: (count: number) =>
      plural(count, "dzień temu", `${count} dni temu`, `${count} dni temu`),
    months: (count: number) =>
      plural(
        count,
        "miesiąc temu",
        `${count} miesiące temu`,
        `${count} miesięcy temu`,
      ),
    years: (count: number) =>
      plural(count, "rok temu", `${count} lata temu`, `${count} lat temu`),
  },

  // Comments that can't be shown
  deleted: "[usunięto]",
  removed: "[ukryto]",
  unavailable: "Ten komentarz jest niedostępny",
  blockedAuthor: "Komentarz zablokowanego przez Ciebie użytkownika",
  showAnyway: "Pokaż mimo to",
  removedByModerator: (reason?: string | null) =>
    `Ukryte przez moderatora${reason ? `: ${reason}` : ""} · widoczne tylko dla Ciebie`,

  // Menus
  report: "Zgłoś",
  remove: "Usuń",
  confirmDelete: "Czy na pewno chcesz usunąć ten komentarz?",

  // Report dialog
  reportTitle: "Wyślij zgłoszenie",
  reportIntro:
    "Dziękujemy za dbanie o naszą społeczność. Daj nam znać, co się dzieje, a my się temu przyjrzymy.",
  reportReasons: {
    spam: "To spam",
    inappropriateContent: "Zawiera nieodpowiednie treści",
    harassment: "Nękanie lub zastraszanie",
    misinformation: "Rozpowszechnia fałszywe informacje",
    hateSpeech: "Zawiera mowę nienawiści lub symbole nienawiści",
    violence: "Promuje przemoc lub niebezpieczne zachowania",
    illegalActivity: "Promuje nielegalne działania",
    selfHarm: "Promuje samookaleczenie lub samobójstwo",
    other: "Inne",
  } satisfies Record<ReportReasonKey, string>,
  submitReport: "Wyślij zgłoszenie",
  submittingReport: "Wysyłanie...",

  // Messages
  loginRequired: "Zaloguj się, aby wykonać tę czynność",
  commentEmpty: "Komentarz nie może być pusty",
  userNotMentionable:
    "Nie można oznaczyć tego użytkownika, ponieważ nie ma nazwy użytkownika",
  parentDeleted: "Ten komentarz został usunięty, więc nie można na niego odpowiedzieć.",
  parentRemoved: "Ten komentarz został ukryty, więc nie można na niego odpowiedzieć.",
  postFailed: "Nie udało się opublikować komentarza. Spróbuj ponownie.",
};

export default strings;
