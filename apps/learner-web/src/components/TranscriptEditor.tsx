import { useState } from "react";
import type { TranscriptDraft } from "@/practice/types";

interface TranscriptEditorProps {
  draft: TranscriptDraft;
  onApprove: (text: string) => void;
  onTypeInstead: () => void;
}

/**
 * Review and correct the machine transcript. The draft is shown as inert,
 * editable text; corrections are explicit learner edits. The app never
 * auto-corrects medical meaning.
 */
export function TranscriptEditor({ draft, onApprove, onTypeInstead }: TranscriptEditorProps) {
  const [text, setText] = useState(draft.text);
  const uncertainCount = draft.uncertainRanges.length;

  return (
    <section aria-labelledby="review-heading">
      <h2 id="review-heading" tabIndex={-1}>
        Check your transcript
      </h2>
      <p className="status">
        Transcribed on this device by {draft.model?.id ?? "the local model"}
        {draft.model ? ` (${draft.model.quantization}, pinned build)` : ""}. Fix anything
        it misheard — your corrections are what gets reviewed.
      </p>
      {uncertainCount > 0 ? (
        <p className="status">
          {uncertainCount === 1
            ? "One part was uncertain and is marked below."
            : `${uncertainCount} parts were uncertain and are marked below.`}{" "}
          Marked parts are never auto-corrected.
        </p>
      ) : null}
      <div className="control-row">
        <label htmlFor="transcript-editor">Transcript (editable)</label>
        <textarea
          id="transcript-editor"
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={6}
        />
      </div>
      <div className="toolbar">
        <button
          type="button"
          onClick={() => onApprove(text)}
          disabled={text.trim().length === 0}
        >
          Approve transcript
        </button>
        <button type="button" onClick={onTypeInstead}>
          Type from scratch instead
        </button>
      </div>
    </section>
  );
}
