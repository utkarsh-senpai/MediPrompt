// Decorative emoji per subject/mode label, matched by keyword so pack content
// stays the source of truth for text. Unknown subjects get a neutral book.
const KEYWORD_EMOJI: ReadonlyArray<readonly [string, string]> = [
  ["anatom", "🫀"],
  ["cardio", "❤️"],
  ["respir", "🫁"],
  ["neuro", "🧠"],
  ["physio", "🧬"],
  ["pharm", "💊"],
  ["patho", "🦠"],
  ["microbio", "🧫"],
  ["biochem", "⚗️"],
  ["clinic", "🩺"],
  ["everyday", "💬"],
  ["science", "🔭"],
  ["nature", "🌿"],
  ["reason", "🧭"],
  ["trade", "⚖️"],
];

export function subjectEmoji(title: string): string {
  const lower = title.toLowerCase();
  for (const [keyword, emoji] of KEYWORD_EMOJI) {
    if (lower.includes(keyword)) return emoji;
  }
  return "📖";
}
