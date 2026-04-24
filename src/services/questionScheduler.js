/**
 * questionScheduler.js — Picks the next concept + Bloom level
 */

export function pickNextConcept(session) {
  if (!session) return null;
  const now = Date.now();
  const concepts = Object.values(session.concepts);

  // P1: Overdue for review
  const overdue = concepts
    .filter(c => c.nextReviewAt && c.nextReviewAt < now && c.totalAnswered > 0)
    .sort((a, b) => a.nextReviewAt - b.nextReviewAt);
  if (overdue.length > 0) return { concept: overdue[0], reason: 'Due for review' };

  // P2: Weakest mastery
  const weak = concepts
    .filter(c => c.totalAnswered > 0 && c.masteryScore < 0.5)
    .sort((a, b) => a.masteryScore - b.masteryScore);
  if (weak.length > 0) return { concept: weak[0], reason: 'Needs strengthening' };

  // Follow roadmap
  if (session.roadmap.sequence.length > 0) {
    const idx = session.roadmap.currentIndex;
    if (idx < session.roadmap.sequence.length) {
      const next = session.concepts[session.roadmap.sequence[idx]];
      if (next) return { concept: next, reason: 'Next in your path' };
    }
  }

  // P3: Prerequisites met — unlock next
  const unlocked = concepts.filter(c =>
    c.totalAnswered === 0 &&
    c.prerequisites.every(pid => (session.concepts[pid]?.masteryScore || 0) >= 0.6)
  );
  if (unlocked.length > 0) return { concept: unlocked[0], reason: 'Ready to learn' };

  // P4: Any new concept
  const unseen = concepts.filter(c => c.totalAnswered === 0);
  if (unseen.length > 0) return { concept: unseen[0], reason: 'New concept' };

  // Fallback
  const sorted = [...concepts].sort((a, b) => a.masteryScore - b.masteryScore);
  return { concept: sorted[0], reason: 'Review' };
}

export function getTargetBloomLevel(concept) {
  if (concept.zpd) return Math.min(6, concept.zpd + 1);
  if (concept.masteryScore >= 0.7) return 4;
  if (concept.masteryScore >= 0.4) return 3;
  if (concept.totalAnswered > 0) return 2;
  return 3;
}

export function getZPDFallbackLevel(level) {
  return Math.max(1, level - 1);
}

export function isConceptConfirmed(concept) {
  return concept.bloomsLevelAchieved >= 3 && concept.activeMisconceptions.length === 0 && concept.masteryScore >= 0.7;
}

export function getConsolidationConcepts(session) {
  return Object.values(session.concepts)
    .filter(c => c.masteryScore >= 0.7)
    .sort((a, b) => (b.lastAnsweredAt || 0) - (a.lastAnsweredAt || 0))
    .slice(0, 5);
}
