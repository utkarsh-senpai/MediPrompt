import { useState } from "react";
import type { TranscriptDraft } from "@/practice/types";

function normalizedRanges(
  text: string,
  ranges: TranscriptDraft["uncertainRanges"],
): Array<{ start: number; end: number }> {
  const valid = ranges
    .map(({ start, end }) => ({
      start: Math.max(0, Math.min(text.length, Math.floor(start))),
      end: Math.max(0, Math.min(text.length, Math.floor(end))),
    }))
    .filter(({ start, end }) => end > start)
    .sort((left, right) => left.start - right.start || left.end - right.end);
  return valid.reduce<Array<{ start: number; end: number }>>((merged, range) => {
    const previous = merged[merged.length - 1];
    if (previous && range.start <= previous.end) {
      previous.end = Math.max(previous.end, range.end);
    } else {
      merged.push({ ...range });
    }
    return merged;
  }, []);
}

function UncertainTranscript({ draft }: { draft: TranscriptDraft }) {
  const ranges = normalizedRanges(draft.text, draft.uncertainRanges);
  if (ranges.length === 0) return null;
  const pieces: Array<{ text: string; uncertain: boolean }> = [];
  let cursor = 0;
  for (const range of ranges) {
    if (range.start > cursor) {
      pieces.push({ text: draft.text.slice(cursor, range.start), uncertain: false });
    }
    pieces.push({ text: draft.text.slice(range.start, range.end), uncertain: true });
    cursor = range.end;
  }
  if (cursor < draft.text.length) {
    pieces.push({ text: draft.text.slice(cursor), uncertain: false });
  }
  return (
    <p className="transcript-text transcript-preview" aria-label="Machine transcript with uncertain passages marked">
      {pieces.map((piece, index) =>
        piece.uncertain ? (
          <mark key={`${index}-${piece.text}`} title="Model marked this passage uncertain">
            {piece.text}
          </mark>
        ) : (
          <span key={`${index}-${piece.text}`}>{piece.text}</span>
        ),
      )}
    </p>
  );
}

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
      <UncertainTranscript draft={draft} />
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
          className="primary"
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
