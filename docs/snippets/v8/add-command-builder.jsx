// Builds the `add` command for a component and a language. Platform and
// style are not part of the command: `add` reads them from sublay.json.
export const AddCommandBuilder = ({ component: initialComponent = "comments-threaded" }) => {
  const components = [
    { value: "comments-threaded", label: "Threaded comments", translated: true },
    { value: "comments-social", label: "Social comments", translated: true },
    { value: "notifications-control", label: "Notifications", translated: false },
  ];
  const languages = [
    { value: "en", label: "English" },
    { value: "ar", label: "Arabic — العربية" },
    { value: "bn", label: "Bengali — বাংলা" },
    { value: "zh", label: "Chinese (Simplified) — 简体中文" },
    { value: "zh-TW", label: "Chinese (Traditional) — 繁體中文" },
    { value: "nl", label: "Dutch — Nederlands" },
    { value: "fr", label: "French — Français" },
    { value: "de", label: "German — Deutsch" },
    { value: "he", label: "Hebrew — עברית" },
    { value: "hi", label: "Hindi — हिन्दी" },
    { value: "id", label: "Indonesian — Bahasa Indonesia" },
    { value: "it", label: "Italian — Italiano" },
    { value: "ja", label: "Japanese — 日本語" },
    { value: "ko", label: "Korean — 한국어" },
    { value: "ms", label: "Malay — Bahasa Melayu" },
    { value: "fa", label: "Persian — فارسی" },
    { value: "pl", label: "Polish — Polski" },
    { value: "pt", label: "Portuguese (Brazil) — Português" },
    { value: "ro", label: "Romanian — Română" },
    { value: "ru", label: "Russian — Русский" },
    { value: "es", label: "Spanish — Español" },
    { value: "sv", label: "Swedish — Svenska" },
    { value: "th", label: "Thai — ไทย" },
    { value: "tr", label: "Turkish — Türkçe" },
    { value: "uk", label: "Ukrainian — Українська" },
    { value: "ur", label: "Urdu — اردو" },
    { value: "vi", label: "Vietnamese — Tiếng Việt" },
  ];

  const [component, setComponent] = useState(initialComponent);
  const [language, setLanguage] = useState("en");
  const [copied, setCopied] = useState(false);

  const translated = components.find((c) => c.value === component)?.translated;
  const lang = translated ? language : "en";
  const command = `npx @sublay/cli add ${component} --ref v8${
    lang === "en" ? "" : ` --lang ${lang}`
  }`;

  const copy = () => {
    navigator.clipboard?.writeText(command).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  };

  const fieldClass =
    "mt-1 w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100";
  const labelClass = "text-sm font-medium text-zinc-700 dark:text-zinc-300";

  return (
    <div className="not-prose my-6 rounded-xl border border-zinc-200 p-4 dark:border-zinc-800">
      <div className="grid gap-4 sm:grid-cols-2">
        <label className={labelClass}>
          Component
          <select
            className={fieldClass}
            value={component}
            onChange={(e) => setComponent(e.target.value)}
          >
            {components.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </select>
        </label>
        <label className={labelClass}>
          Language
          <select
            className={fieldClass}
            value={lang}
            disabled={!translated}
            onChange={(e) => setLanguage(e.target.value)}
          >
            {languages.map((l) => (
              <option key={l.value} value={l.value}>
                {l.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="mt-4 flex items-center gap-3 rounded-lg bg-zinc-950 px-4 py-3">
        {/* A span, not <code>: inline code gets its own background here */}
        <span
          dir="ltr"
          className="min-w-0 flex-1 break-words font-mono text-sm text-zinc-100"
        >
          {command}
        </span>
        <button
          type="button"
          onClick={copy}
          className="shrink-0 rounded-md border border-zinc-700 px-3 py-1 text-xs font-medium text-zinc-200 hover:bg-zinc-800"
        >
          {copied ? "Copied" : "Copy"}
        </button>
      </div>

      <p className="mt-3 text-xs text-zinc-500 dark:text-zinc-400">
        The platform (React, React Native or Expo) and the style (styled or
        Tailwind) come from your <code>sublay.json</code>, written by{" "}
        <code>npx @sublay/cli init</code>.
      </p>
    </div>
  );
};
