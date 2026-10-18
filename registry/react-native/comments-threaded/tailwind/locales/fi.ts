import type { ReportReasonKey } from "@sublay/react-native";

// 🌐 Every piece of text the comment section shows. Edit the values here to
// reword or translate it. Entries that depend on a number or a name are
// functions, so each language can use its own plural forms and word order.
const strings = {
  // Inputs
  commentPlaceholder: "Osallistu keskusteluun",
  cancel: "Peruuta",
  replyingTo: "Vastaus käyttäjälle",
  cancelReply: "Peruuta vastaus",

  // Sorting
  sortBy: "Lajittele",
  sortSheetTitle: "Lajittele kommentit",
  sortTop: "Suosituimmat",
  sortNew: "Uusimmat",
  sortOld: "Vanhimmat",
  sortControversial: "Kiistanalaiset",

  // Comment list
  noCommentsTitle: "Ei vielä kommentteja",
  noCommentsSubtitle: "Aloita keskustelu.",
  viewAllComments: "Näytä kaikki kommentit",
  loadMoreComments: "Lataa lisää kommentteja",
  loading: "Ladataan...",
  loadCommentsFailed: "Kommenttien lataaminen epäonnistui",
  loadMoreFailed: "Lisää ei voitu ladata",
  tryAgain: "Yritä uudelleen",

  // A comment
  reply: "Vastaa",
  replyCount: (count: number) =>
    count === 1 ? "1 vastaus" : `${count} vastausta`,
  moreReplyCount: (count: number) =>
    count === 1 ? "1 vastaus lisää" : `${count} vastausta lisää`,
  moreReplies: "Lisää vastauksia",
  removeYourVote: "Poista äänesi",

  // Comments that can't be shown
  deleted: "[poistettu]",
  removed: "[piilotettu]",
  unavailable: "Tämä kommentti ei ole saatavilla",
  blockedAuthor: "Kommentti käyttäjältä, jonka olet estänyt",
  showAnyway: "Näytä silti",
  removedByModerator: (reason?: string | null) =>
    `Moderaattorin piilottama${reason ? `: ${reason}` : ""} · vain sinä näet tämän`,

  // Mentions
  noUsersFound: "Käyttäjiä ei löytynyt",

  // Menus
  report: "Ilmoita",
  delete: "Poista",
  deleteCommentTitle: "Poista kommentti",
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
  parentDeleted: "Tämä kommentti on poistettu, joten et voi vastata siihen.",
  parentRemoved: "Tämä kommentti on piilotettu, joten et voi vastata siihen.",
  postFailed: "Kommentin julkaiseminen epäonnistui. Yritä uudelleen.",
};

export default strings;
