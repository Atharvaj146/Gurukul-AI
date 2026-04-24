/**
 * anthropicAPI.js — All Claude API calls for Gurukul AI
 * 
 * API Call 1: Concept Extraction (on upload)
 * API Call 2: Misconception Extraction (after diagnostic open-ended)
 * API Call 3: Question Generation (before each quiz question)
 * API Call 4: Misconception Detection (after every wrong answer)
 * API Call 5: Teaching Content Generation (during teaching phase)
 */

const API_URL = 'https://api.anthropic.com/v1/messages';
const API_KEY = import.meta.env.VITE_ANTHROPIC_API_KEY;
const MODEL = 'claude-sonnet-4-6';

async function callClaude(systemPrompt, userMessage, maxTokens = 4000) {
  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': API_KEY,
        'anthropic-version': '2023-06-01',
        'anthropic-dangerous-direct-browser-access': 'true',
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: maxTokens,
        system: systemPrompt,
        messages: [{ role: 'user', content: userMessage }],
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      throw new Error(`Claude API error (${response.status}): ${err}`);
    }

    const data = await response.json();
    const text = data.content[0].text;
    
    // Try to parse JSON from the response
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    
    // If it's an array response
    const arrMatch = text.match(/\[[\s\S]*\]/);
    if (arrMatch) {
      return JSON.parse(arrMatch[0]);
    }
    
    return { rawText: text };
  } catch (error) {
    console.error('Claude API call failed:', error);
    throw error;
  }
}

// ═══════════════════════════════════════════════
// API CALL 1 — Concept Extraction
// ═══════════════════════════════════════════════
export async function extractConcepts(learningGoal, documentText = '') {
  const system = `You are a curriculum design expert and learning science specialist. 
Given a learning goal and optional document text, extract every important concept.
Return ONLY valid JSON, no other text, no markdown.`;

  const user = `Learning goal: "${learningGoal}"
${documentText ? `\nDocument content:\n${documentText.slice(0, 15000)}` : ''}

Extract all concepts and return this exact JSON structure:
{
  "mainTopic": "string — the primary topic",
  "urgency": "normal" or "exam-soon",
  "concepts": [
    {
      "id": "c1",
      "name": "Concept Name",
      "definition": "Clear one-sentence definition",
      "difficulty": 1-5,
      "prerequisites": ["c2", "c3"],
      "bloomsLevel": 1,
      "tier": "foundation" or "bridge" or "core" or "extension"
    }
  ],
  "dependencies": {
    "c1": ["c2", "c3"]
  }
}

Rules:
- Generate between 8-30 concepts depending on topic complexity
- Assign unique IDs like c1, c2, c3...
- Map prerequisite relationships accurately
- Tier concepts: foundation → bridge → core → extension
- Difficulty 1-5 (1=trivial, 5=very hard)
- Set bloomsLevel to 1 for all initially`;

  return await callClaude(system, user, 4000);
}

// ═══════════════════════════════════════════════
// API CALL 2 — Diagnostic Question Generation
// ═══════════════════════════════════════════════
export async function generateDiagnosticQuestions(concepts, mainTopic) {
  const system = `You are an expert educational diagnostician.
Generate diagnostic MCQ questions to assess a student's current knowledge level.
Return ONLY valid JSON, no other text.`;

  const conceptList = concepts.map(c => `${c.id}: ${c.name} (${c.tier})`).join('\n');
  
  const user = `Topic: ${mainTopic}
Concepts to test:
${conceptList}

Generate exactly 6 MCQ questions + 2 open-ended questions.

Return this exact JSON:
{
  "mcqQuestions": [
    {
      "id": "q1",
      "question": "Question text",
      "conceptId": "c1",
      "tier": "foundation/bridge/core",
      "bloomLevel": 1-3,
      "options": ["A) ...", "B) ...", "C) ...", "D) ..."],
      "correctIndex": 0,
      "explanation": "Why this is correct"
    }
  ],
  "openEndedQuestions": [
    {
      "id": "oe1",
      "question": "In your own words, explain what you understand about ${mainTopic}. Do not look anything up — just write what you think you know.",
      "purpose": "Reveal overall understanding and misconceptions"
    },
    {
      "id": "oe2", 
      "question": "If you had to explain ${mainTopic} to a friend who has never studied it, what would you say? Be as specific as possible.",
      "purpose": "Detect depth of conceptual understanding"
    }
  ]
}

Rules:
- Test both prerequisites AND main topic concepts
- Mix Bloom levels 1-3 across questions
- Make distractors plausible (common misconceptions)`;

  return await callClaude(system, user, 3000);
}

// ═══════════════════════════════════════════════
// API CALL 3 — Analyze Diagnostic Results
// ═══════════════════════════════════════════════
export async function analyzeDiagnosticResults(mcqResults, openEndedAnswers, concepts) {
  const system = `You are an expert at diagnosing student misconceptions and knowledge gaps.
Analyze the student's diagnostic answers and return a detailed gap analysis.
Return ONLY valid JSON, no other text.`;

  const user = `MCQ Results: ${JSON.stringify(mcqResults)}
Open-ended Answers: ${JSON.stringify(openEndedAnswers)}
Available Concepts: ${JSON.stringify(concepts.map(c => ({ id: c.id, name: c.name, tier: c.tier })))}

Return this exact JSON:
{
  "overallLevel": "beginner" or "partial" or "intermediate" or "advanced",
  "priorStrength": 0.0-1.0,
  "bestKnownConceptId": "cX",
  "conceptAnalysis": [
    {
      "conceptId": "c1",
      "detectedLevel": "strong/partial/weak/not-studied",
      "masteryEstimate": 0.0-1.0,
      "specificIssue": "Description of the issue or 'None'"
    }
  ],
  "misconceptionsFound": [
    {
      "name": "Misconception name",
      "severity": 1-3,
      "conceptAffected": "c1",
      "description": "What the student incorrectly believes"
    }
  ],
  "roadmapRecommendation": ["c1", "c2", "c3"]
}`;

  return await callClaude(system, user, 3000);
}

// ═══════════════════════════════════════════════
// API CALL 4 — Generate Quiz Question
// ═══════════════════════════════════════════════
export async function generateQuizQuestion(concept, bloomLevel, previousContext = '') {
  const system = `You are an expert tutor. Generate exactly one study question at the specified Bloom's Taxonomy level.
Return ONLY valid JSON, no other text.`;

  const bloomDescriptions = {
    1: 'Remember — recall definition or fact',
    2: 'Understand — explain in own words',
    3: 'Apply — use in a new scenario or problem',
    4: 'Analyze — compare, contrast, or break down',
    5: 'Evaluate — judge or recommend',
    6: 'Create — design or construct something new',
  };

  const user = `Concept: ${concept.name}
Definition: ${concept.definition}
Required Bloom's Level: ${bloomLevel} — ${bloomDescriptions[bloomLevel]}
${previousContext ? `Context from previous answers: ${previousContext}` : ''}

Return this exact JSON:
{
  "question": "The question text",
  "bloomLevel": ${bloomLevel},
  "expectedAnswer": "What a correct answer should contain",
  "hint": "A helpful hint if the student is stuck",
  "questionType": "definition/explanation/application/analysis/evaluation/creation"
}`;

  return await callClaude(system, user, 800);
}

// ═══════════════════════════════════════════════
// API CALL 5 — Evaluate Answer + Detect Misconception
// ═══════════════════════════════════════════════
export async function evaluateAnswer(question, expectedAnswer, studentAnswer, concept) {
  const system = `You are an expert at identifying student misconceptions in educational contexts.
Evaluate the student's answer and detect any misconceptions.
Return ONLY valid JSON, no other text.`;

  const user = `Question: ${question}
Correct/Expected Answer: ${expectedAnswer}
Student's Answer: ${studentAnswer}
Concept: ${concept.name} — ${concept.definition}

Return this exact JSON:
{
  "isCorrect": true/false,
  "score": 0.0-1.0,
  "bloomsLevelAchieved": 1-6,
  "feedback": "2-3 sentence explanation for the student",
  "misconceptionDetected": true/false,
  "misconceptionName": "Name of the misconception or null",
  "misconceptionExplanation": "2 sentence explanation of what the student believes incorrectly, or null",
  "correctExplanation": "Clear explanation of the correct answer",
  "encouragement": "Brief encouraging message"
}`;

  return await callClaude(system, user, 800);
}

// ═══════════════════════════════════════════════
// API CALL 6 — Generate Teaching Content
// ═══════════════════════════════════════════════
export async function generateTeachingContent(concept, studentLevel, bestKnownConcept = null) {
  const system = `You are a world-class teacher who uses evidence-based teaching methods.
Generate teaching content in a structured 4-part format.
Return ONLY valid JSON, no other text.`;

  const user = `Concept to teach: ${concept.name}
Definition: ${concept.definition}
Student's current level: ${studentLevel}
${bestKnownConcept ? `Student's best-known concept: ${bestKnownConcept.name} (use for analogy)` : ''}

Generate teaching content in this exact JSON structure:
{
  "partA": {
    "title": "Worked Example",
    "content": "A fully worked example with step-by-step solution. Maximum 6 steps. Use clear formatting with Step 1:, Step 2:, etc."
  },
  "partB": {
    "title": "Core Explanation",
    "content": "Concise explanation of the concept's core mechanism. Maximum 150 words. Written at the student's level.",
    "diagramDescription": "Description of what a diagram would show for this concept"
  },
  "partC": {
    "title": "Analogy",
    "content": "A personalized analogy${bestKnownConcept ? ` mapping this concept onto '${bestKnownConcept.name}' which the student knows well` : ' using an everyday real-world scenario'}. Show explicit mapping between elements."
  },
  "partD": {
    "title": "Quick Checks",
    "microChecks": [
      {
        "afterSection": "Part A",
        "question": "Quick retrieval question about the worked example",
        "expectedAnswer": "What a correct answer looks like"
      },
      {
        "afterSection": "Part B", 
        "question": "Quick retrieval question about the explanation",
        "expectedAnswer": "What a correct answer looks like"
      },
      {
        "afterSection": "Part C",
        "question": "Quick retrieval question tying it all together",
        "expectedAnswer": "What a correct answer looks like"
      }
    ]
  }
}`;

  return await callClaude(system, user, 2000);
}

export default {
  extractConcepts,
  generateDiagnosticQuestions,
  analyzeDiagnosticResults,
  generateQuizQuestion,
  evaluateAnswer,
  generateTeachingContent,
};
