import type { VivaLevel } from "@/practice/types";

export function vivaLevelLabel(level: VivaLevel): string {
  switch (level) {
    case "RECALL":
      return "Recall";
    case "EXPLAIN":
      return "Explain";
    case "APPLY":
      return "Apply";
    case "DIFFERENTIATE":
      return "Differentiate";
    case "DEFEND":
      return "Defend";
  }
}
