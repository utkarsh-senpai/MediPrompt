/**
 * Bounds synchronous transcript processing and in-memory review state. Ten
 * minutes of normal speech remains comfortably below this limit.
 */
export const MAX_TRANSCRIPT_CHARACTERS = 20_000;
