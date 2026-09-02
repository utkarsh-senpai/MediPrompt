// Slot-machine reel shown while a topic is being drawn. Titles blur and
// accelerate downward on a 3D-tilted strip, giving the spin a physical feel
// without shipping any media assets. Reduced-motion users see no reel at all;
// the spin button's "Finding a topic…" label remains the accessible affordance.

const REEL_SIZE = 14;

export interface SpinReelProps {
  titles: readonly string[];
  drawing: boolean;
}

/**
 * Picks a stable, varied slice of titles for the reel so repeated spins show
 * different entries without re-reading the full index on every render.
 */
function reelTitles(titles: readonly string[]): string[] {
  if (titles.length === 0) return [];
  const out: string[] = [];
  const stride = Math.max(1, Math.floor(titles.length / REEL_SIZE));
  for (let i = 0; i < REEL_SIZE; i++) {
    out.push(titles[(i * stride) % titles.length]!);
  }
  return out;
}

export function SpinReel({ titles, drawing }: SpinReelProps) {
  if (!drawing || titles.length === 0) return null;
  const reel = reelTitles(titles);
  // Repeat the strip so the downward scroll never runs out of entries mid-spin.
  const strip = [...reel, ...reel];
  return (
    <div className="spin-reel" aria-hidden="true">
      <div className="spin-reel-strip">
        {strip.map((title, index) => (
          <span key={index} className="spin-reel-item">
            {title}
          </span>
        ))}
      </div>
    </div>
  );
}
