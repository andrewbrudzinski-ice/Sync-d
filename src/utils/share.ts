import type { Game } from '../types';

export function buildShareText(game: Game): string {
  const sorted = [...game.teams].sort((a, b) => b.score - a.score);
  const winner = sorted[0];
  const standings = sorted
    .map((t, i) => `${i + 1}. ${t.name} — ${t.score} pts`)
    .join('\n');
  return `🎉 Just played Sync'd!\n\n🏆 Winner: ${winner.name} with ${winner.score} matches!\n\nFinal Standings:\n${standings}\n\nPlay at syncd.app`;
}

export async function shareResult(game: Game): Promise<boolean> {
  const text = buildShareText(game);
  if (navigator.share) {
    try {
      await navigator.share({ title: "Sync'd Results", text });
      return true;
    } catch {
      // user cancelled or not supported
    }
  }
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}
