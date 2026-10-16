import type { ReportReasonKey } from "@sublay/react-js";

// 🌐 Every piece of text the comment section shows. Edit the values here to
// reword or translate it. Entries that depend on a number or a name are
// functions, so each language can use its own plural forms and word order.
const strings = {
  // Inputs
  commentPlaceholder: "Kirjoita kommentti...",
  cancel: "Peruuta",
  post: "Julkaise",
  replyingTo: (name: string) => `Vastaus käyttäjälle ${name}`,

  // Comment list
  noCommentsTitle: "Ei vielä kommentteja",
  noCommentsSubtitle: "Aloita keskustelu.",
  loadMoreComments: "Lataa lisää kommentteja",
  loading: "Ladataan...",
  loadCommentsFailed: "Kommenttien lataaminen epäonnistui",
  loadMoreFailed: "Lisää ei voitu ladata",
  tryAgain: "Yritä uudelleen",
  sortTop: "Suosituimmat",
  sortNew: "Uusimmat",
  sortOld: "Vanhimmat",

  // A comment
  reply: "Vastaa",
  viewMoreReplies: (count: number) => `Näytä lisää vastauksia (${count})`,
  hideReplies: "Piilota vastaukset",
  removeYourReaction: "Poista reaktiosi",
  timeAgo: {
    justNow: "Juuri nyt",
    minutes: (count: number) =>
      count === 1 ? "minuutti sitten" : `${count} minuuttia sitten`,
    hours: (count: number) =>
      count === 1 ? "tunti sitten" : `${count} tuntia sitten`,
    days: (count: number) =>
      count === 1 ? "päivä sitten" : `${count} päivää sitten`,
    months: (count: number) =>
      count === 1 ? "kuukausi sitten" : `${count} kuukautta sitten`,
    years: (count: number) =>
      count === 1 ? "vuosi sitten" : `${count} vuotta sitten`,
  },

  // Comments that can't be shown
  deleted: "[poistettu]",
  removed: "[piilotettu]",
  unavailable: "Tämä kommentti ei ole saatavilla",
  blockedAuthor: "Kommentti käyttäjältä, jonka olet estänyt",
  showAnyway: "Näytä silti",
  removedByModerator: (reason?: string | null) =>
    `Moderaattorin piilottama${reason ? `: ${reason}` : ""} · vain sinä näet tämän`,

  // Menus
  report: "Ilmoita",
  remove: "Poista",
  confirmDelete: "Haluatko varmasti poistaa tämän kommentin?",

  // Report dialog
  reportTitle: "Tee ilmoitus",
  reportIntro:
    "Kiitos, että pidät huolta yhteisöstämme. Kerro meille, mitä on tapahtunut, niin selvitämme asian.",
  reportReasons: {
    spam: "Se on roskapostia",
    inappropriateContent: "Sisältää sopimatonta materiaalia",
    harassment: "Se on häirintää tai kiusaamista",
    misinformation: "Levittää väärää tietoa",
    hateSpeech: "Sisältää vihapuhetta tai vihasymboleja",
    violence: "Kannustaa väkivaltaan tai vaaralliseen toimintaan",
    illegalActivity: "Kannustaa laittomaan toimintaan",
    selfHarm: "Kannustaa itsensä vahingoittamiseen tai itsemurhaan",
    other: "Muu",
  } satisfies Record<ReportReasonKey, string>,
  submitReport: "Lähetä ilmoitus",
  submittingReport: "Lähetetään...",

  // Messages
  loginRequired: "Kirjaudu sisään tehdäksesi tämän",
  commentEmpty: "Kommentti ei voi olla tyhjä",
  userNotMentionable:
    "Tällä käyttäjällä ei ole käyttäjänimeä, joten häntä ei voi mainita",
  parentDeleted: "Tämä kommentti on poistettu, joten et voi vastata siihen.",
  parentRemoved: "Tämä kommentti on piilotettu, joten et voi vastata siihen.",
  postFailed: "Kommentin julkaiseminen epäonnistui. Yritä uudelleen.",
};

export default strings;
