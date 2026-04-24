/**
 * knowledgeModel.js — localStorage CRUD for the Gurukul AI knowledge model
 * 
 * The knowledge model is the most critical data structure in the app.
 * Every feature reads from and writes to it.
 */

const SESSION_KEY = 'gurukul_session';

// ═══════════════════════════════════════════════
// Create a new session
// ═══════════════════════════════════════════════
export function createSession(mainTopic, concepts, dependencies = {}) {
  const sessionId = `sess_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  
  const conceptsMap = {};
  concepts.forEach(c => {
    conceptsMap[c.id] = {
      id: c.id,
      name: c.name,
      definition: c.definition || '',
      difficulty: c.difficulty || 3,
      tier: c.tier || 'core',
      prerequisites: c.prerequisites || [],

      // Teaching state
      teachingStatus: 'not_started', // not_started | in_progress | taught | confirmed
      workedExampleSeen: false,
      diagramSeen: false,
      analogyGenerated: null,

      // Assessment state
      bloomsLevelAchieved: 0,
      feynmanCheckPassed: false,
      zpd: null,

      // Mastery & retention
      masteryScore: 0.0,
      halfLifeDays: 1,
      correctStreak: 0,
      totalAnswered: 0,
      totalCorrect: 0,
      lastAnsweredAt: null,
      nextReviewAt: null,

      // Confidence tracking
      confidenceHistory: [],

      // Misconception tracking
      activeMisconceptions: [],
      resolvedMisconceptions: [],
    };
  });

  const session = {
    sessionId,
    mainTopic,
    createdAt: Date.now(),
    status: 'diagnostic_pending', // diagnostic_pending | diagnostic_done | roadmap_pending | learning | consolidation | complete

    student: {
      diagnosticLevel: null,
      priorStrength: 0,
      bestKnownConceptId: null,
      calibrationScore: 0,
      totalStudyTimeMs: 0,
      totalQuestionsAnswered: 0,
      totalCorrectAnswers: 0,
    },

    roadmap: {
      agreedAt: null,
      sequence: [],
      currentIndex: 0,
      skippedPrereqs: [],
    },

    diagnosticResults: null,

    concepts: conceptsMap,
    dependencies,
  };

  saveSession(session);
  return session;
}

// ═══════════════════════════════════════════════
// CRUD Operations
// ═══════════════════════════════════════════════
export function getSession() {
  const raw = localStorage.getItem(SESSION_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function saveSession(session) {
  localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  // Dispatch a custom event so components can react
  window.dispatchEvent(new CustomEvent('session-updated', { detail: session }));
}

export function clearSession() {
  localStorage.removeItem(SESSION_KEY);
  window.dispatchEvent(new CustomEvent('session-updated', { detail: null }));
}

// ═══════════════════════════════════════════════
// Update helpers
// ═══════════════════════════════════════════════
export function updateConcept(conceptId, updates) {
  const session = getSession();
  if (!session || !session.concepts[conceptId]) return null;

  session.concepts[conceptId] = {
    ...session.concepts[conceptId],
    ...updates,
  };

  saveSession(session);
  return session;
}

export function updateStudent(updates) {
  const session = getSession();
  if (!session) return null;

  session.student = { ...session.student, ...updates };
  saveSession(session);
  return session;
}

export function updateRoadmap(updates) {
  const session = getSession();
  if (!session) return null;

  session.roadmap = { ...session.roadmap, ...updates };
  saveSession(session);
  return session;
}

export function updateSessionStatus(status) {
  const session = getSession();
  if (!session) return null;

  session.status = status;
  saveSession(session);
  return session;
}

export function setDiagnosticResults(results) {
  const session = getSession();
  if (!session) return null;

  session.diagnosticResults = results;
  session.status = 'diagnostic_done';

  // Update student info from results
  session.student.diagnosticLevel = results.overallLevel;
  session.student.priorStrength = results.priorStrength;
  session.student.bestKnownConceptId = results.bestKnownConceptId;

  // Update concept mastery estimates
  if (results.conceptAnalysis) {
    results.conceptAnalysis.forEach(ca => {
      if (session.concepts[ca.conceptId]) {
        session.concepts[ca.conceptId].masteryScore = ca.masteryEstimate || 0;
      }
    });
  }

  // Add misconceptions
  if (results.misconceptionsFound) {
    results.misconceptionsFound.forEach(m => {
      if (session.concepts[m.conceptAffected]) {
        session.concepts[m.conceptAffected].activeMisconceptions.push({
          name: m.name,
          severity: m.severity,
          description: m.description,
          detectedAt: Date.now(),
        });
      }
    });
  }

  saveSession(session);
  return session;
}

export function setRoadmapSequence(sequence) {
  const session = getSession();
  if (!session) return null;

  session.roadmap.sequence = sequence;
  session.roadmap.agreedAt = Date.now();
  session.roadmap.currentIndex = 0;
  session.status = 'learning';

  saveSession(session);
  return session;
}

// ═══════════════════════════════════════════════
// Record a quiz answer
// ═══════════════════════════════════════════════
export function recordAnswer(conceptId, confidence, isCorrect, bloomLevel, misconception = null) {
  const session = getSession();
  if (!session || !session.concepts[conceptId]) return null;

  const concept = session.concepts[conceptId];

  // Update totals
  concept.totalAnswered += 1;
  if (isCorrect) concept.totalCorrect += 1;
  concept.lastAnsweredAt = Date.now();

  // Update confidence history
  concept.confidenceHistory.push({
    confidence,
    correct: isCorrect,
    timestamp: Date.now(),
  });

  // Update Bloom's level
  if (isCorrect && bloomLevel > concept.bloomsLevelAchieved) {
    concept.bloomsLevelAchieved = bloomLevel;
  }

  // Update mastery score
  if (isCorrect) {
    concept.correctStreak += 1;
    concept.masteryScore = Math.min(1.0, concept.masteryScore + 0.1);
  } else {
    concept.correctStreak = 0;
    concept.masteryScore = Math.max(0.0, concept.masteryScore - 0.08);
  }

  // Handle misconception
  if (misconception) {
    concept.activeMisconceptions.push({
      name: misconception.name,
      severity: misconception.severity || 2,
      description: misconception.description,
      detectedAt: Date.now(),
    });
  }

  // Update HLR / spaced repetition
  if (isCorrect) {
    concept.halfLifeDays = concept.halfLifeDays * 2;
  } else {
    concept.halfLifeDays = 1;
  }
  const msPerDay = 24 * 60 * 60 * 1000;
  concept.nextReviewAt = Date.now() + (concept.halfLifeDays * msPerDay);

  // Update student totals
  session.student.totalQuestionsAnswered += 1;
  if (isCorrect) session.student.totalCorrectAnswers += 1;

  // Recalculate calibration score
  const allConfidence = [];
  Object.values(session.concepts).forEach(c => {
    c.confidenceHistory.forEach(ch => allConfidence.push(ch));
  });
  if (allConfidence.length > 0) {
    const lastN = allConfidence.slice(-20); // last 20 answers
    const calibrated = lastN.filter(ch => {
      const wasConfident = ch.confidence >= 4;
      return (wasConfident && ch.correct) || (!wasConfident && !ch.correct);
    });
    session.student.calibrationScore = Math.round((calibrated.length / lastN.length) * 100) / 100;
  }

  session.concepts[conceptId] = concept;
  saveSession(session);
  return session;
}

// ═══════════════════════════════════════════════
// Computed getters
// ═══════════════════════════════════════════════
export function getConceptsArray(session) {
  if (!session) return [];
  return Object.values(session.concepts);
}

export function getMasteryColor(masteryScore) {
  if (masteryScore === 0) return 'gray';
  if (masteryScore < 0.4) return 'red';
  if (masteryScore < 0.7) return 'yellow';
  return 'green';
}

export function getOverdueConcepts(session) {
  if (!session) return [];
  const now = Date.now();
  return Object.values(session.concepts).filter(
    c => c.nextReviewAt && c.nextReviewAt < now && c.totalAnswered > 0
  );
}

export function getConceptStats(session) {
  if (!session) return { total: 0, mastered: 0, learning: 0, weak: 0, notStarted: 0 };
  
  const concepts = Object.values(session.concepts);
  return {
    total: concepts.length,
    mastered: concepts.filter(c => c.masteryScore >= 0.7).length,
    learning: concepts.filter(c => c.masteryScore >= 0.4 && c.masteryScore < 0.7).length,
    weak: concepts.filter(c => c.masteryScore > 0 && c.masteryScore < 0.4).length,
    notStarted: concepts.filter(c => c.masteryScore === 0 && c.totalAnswered === 0).length,
    overdue: getOverdueConcepts(session).length,
  };
}

export default {
  createSession,
  getSession,
  saveSession,
  clearSession,
  updateConcept,
  updateStudent,
  updateRoadmap,
  updateSessionStatus,
  setDiagnosticResults,
  setRoadmapSequence,
  recordAnswer,
  getConceptsArray,
  getMasteryColor,
  getOverdueConcepts,
  getConceptStats,
};
