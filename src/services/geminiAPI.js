/**
 * geminiAPI.js — All Google Gemini API calls for Gurukul AI
 * 
 * API Call 1: Concept Extraction (on upload)
 * API Call 2: Misconception Extraction (after diagnostic open-ended)
 * API Call 3: Question Generation (before each quiz question)
 * API Call 4: Misconception Detection (after every wrong answer)
 * API Call 5: Teaching Content Generation (during teaching phase)
 */

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
// Using gemini-2.5-flash because gemini-2.0-flash has a hard quota limit of 0 for this key.
// The previous 503 error on 2.5 was just a temporary high demand spike, which the retry loop will handle.
const MODEL_NAME = 'gemini-2.5-flash';
const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL_NAME}:generateContent?key=${API_KEY}`;

async function callGemini(systemInstruction, userMessage, schema = null, retries = 3) {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const config = {
        responseMimeType: "application/json",
        temperature: 0.2,
      };
      if (schema) config.responseSchema = schema;

      const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          systemInstruction: {
            parts: [{ text: systemInstruction }]
          },
          contents: [
            {
              role: 'user',
              parts: [{ text: userMessage }]
            }
          ],
          generationConfig: config
        }),
      });

      if (!response.ok) {
        const err = await response.text();
        if (response.status === 503 && attempt < retries) {
          console.warn(`Gemini 503 error, retrying attempt ${attempt}...`);
          await new Promise(r => setTimeout(r, 1500 * attempt)); // Exponential backoff
          continue;
        }
        throw new Error(`Gemini API error (${response.status}): ${err}`);
      }

      const data = await response.json();
      const text = data.candidates[0].content.parts[0].text;
      
      // Gemini with application/json mime type returns a JSON string
      return JSON.parse(text);
    } catch (error) {
      if (attempt === retries) {
        console.error('Gemini API call failed after retries:', error);
        throw error;
      }
    }
  }
}

// ═══════════════════════════════════════════════
// API CALL 1 — Concept Extraction
// ═══════════════════════════════════════════════
export async function extractConcepts(learningGoal, documentText = '') {
  const system = `You are a curriculum design expert and learning science specialist. 
Given a learning goal and optional document text, extract every important concept.
You must output a strictly valid JSON object matching the requested schema.`;

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
- Map prerequisite relationships accurately (dependencies map should show which IDs depend on which IDs)
- Tier concepts: foundation → bridge → core → extension
- Difficulty 1-5 (1=trivial, 5=very hard)
- Set bloomsLevel to 1 for all initially`;

  return await callGemini(system, user);
}

// ═══════════════════════════════════════════════
// API CALL 2 — Diagnostic Question Generation
// ═══════════════════════════════════════════════
export async function generateDiagnosticQuestions(concepts, mainTopic) {
  const system = `You are an expert educational diagnostician.
Generate diagnostic MCQ questions to assess a student's current knowledge level.
You must output a strictly valid JSON object matching the requested schema.`;

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
      "tier": "foundation" or "bridge" or "core",
      "bloomLevel": 1,
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

  return await callGemini(system, user);
}

// ═══════════════════════════════════════════════
// API CALL 3 — Analyze Diagnostic Results
// ═══════════════════════════════════════════════
export async function analyzeDiagnosticResults(mcqResults, openEndedAnswers, concepts) {
  const system = `You are an expert at diagnosing student misconceptions and knowledge gaps.
Analyze the student's diagnostic answers and return a detailed gap analysis.
You must output a strictly valid JSON object matching the requested schema.`;

  const user = `MCQ Results: ${JSON.stringify(mcqResults)}
Open-ended Answers: ${JSON.stringify(openEndedAnswers)}
Available Concepts: ${JSON.stringify(concepts.map(c => ({ id: c.id, name: c.name, tier: c.tier })))}

Return this exact JSON:
{
  "overallLevel": "beginner" or "partial" or "intermediate" or "advanced",
  "priorStrength": 0.5,
  "bestKnownConceptId": "c1",
  "conceptAnalysis": [
    {
      "conceptId": "c1",
      "detectedLevel": "strong" or "partial" or "weak" or "not-studied",
      "masteryEstimate": 0.5,
      "specificIssue": "Description of the issue or 'None'"
    }
  ],
  "misconceptionsFound": [
    {
      "name": "Misconception name",
      "severity": 1,
      "conceptAffected": "c1",
      "description": "What the student incorrectly believes"
    }
  ],
  "roadmapRecommendation": ["c1", "c2", "c3"]
}
Note: priorStrength and masteryEstimate should be numbers between 0.0 and 1.0. severity should be an integer 1-3.`;

  return await callGemini(system, user);
}

// ═══════════════════════════════════════════════
// API CALL 4 — Generate Quiz Question
// ═══════════════════════════════════════════════
export async function generateQuizQuestion(concept, bloomLevel, previousContext = '') {
  const system = `You are an expert tutor. Generate exactly one study question at the specified Bloom's Taxonomy level.
You must output a strictly valid JSON object matching the requested schema.`;

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

  const schema = {
    type: "OBJECT",
    properties: {
      question: { type: "STRING" },
      bloomLevel: { type: "INTEGER" },
      expectedAnswer: { type: "STRING" },
      hint: { type: "STRING" },
      questionType: { type: "STRING" }
    },
    required: ["question", "bloomLevel", "expectedAnswer", "hint", "questionType"]
  };

  return await callGemini(system, user, schema);
}

// ═══════════════════════════════════════════════
// API CALL 5 — Evaluate Answer + Detect Misconception
// ═══════════════════════════════════════════════
export async function evaluateAnswer(question, expectedAnswer, studentAnswer, concept) {
  const system = `You are an expert at identifying student misconceptions in educational contexts.
Evaluate the student's answer and detect any misconceptions.
You must output a strictly valid JSON object matching the requested schema.`;

  const user = `Question: ${question}
Correct/Expected Answer: ${expectedAnswer}
Student's Answer: ${studentAnswer}
Concept: ${concept.name} — ${concept.definition}

Return this exact JSON:
{
  "isCorrect": true,
  "score": 0.8,
  "bloomsLevelAchieved": 2,
  "feedback": "2-3 sentence explanation for the student",
  "misconceptionDetected": false,
  "misconceptionName": "Name of the misconception or null",
  "misconceptionExplanation": "2 sentence explanation of what the student believes incorrectly, or null",
  "correctExplanation": "Clear explanation of the correct answer",
  "encouragement": "Brief encouraging message"
}
Note: score should be a number between 0.0 and 1.0. bloomsLevelAchieved should be an integer 1-6.`;

  const schema = {
    type: "OBJECT",
    properties: {
      isCorrect: { type: "BOOLEAN" },
      score: { type: "NUMBER" },
      bloomsLevelAchieved: { type: "INTEGER" },
      feedback: { type: "STRING" },
      misconceptionDetected: { type: "BOOLEAN" },
      misconceptionName: { type: "STRING" },
      misconceptionExplanation: { type: "STRING" },
      correctExplanation: { type: "STRING" },
      encouragement: { type: "STRING" }
    },
    required: ["isCorrect", "score", "bloomsLevelAchieved", "feedback", "misconceptionDetected", "correctExplanation", "encouragement"]
  };

  return await callGemini(system, user, schema);
}

// ═══════════════════════════════════════════════
// API CALL 6 — Generate Teaching Content
// ═══════════════════════════════════════════════
export async function generateTeachingContent(concept, studentLevel, bestKnownConcept = null) {
  const system = `You are a world-class teacher who uses evidence-based teaching methods.
Generate teaching content in a structured 4-part format.
You must output a strictly valid JSON object matching the requested schema.`;

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

  const schema = {
    type: "OBJECT",
    properties: {
      partA: { type: "OBJECT", properties: { title: { type: "STRING" }, content: { type: "STRING" } } },
      partB: { type: "OBJECT", properties: { title: { type: "STRING" }, content: { type: "STRING" }, diagramDescription: { type: "STRING" } } },
      partC: { type: "OBJECT", properties: { title: { type: "STRING" }, content: { type: "STRING" } } },
      partD: { type: "OBJECT", properties: { title: { type: "STRING" }, microChecks: { type: "ARRAY", items: { type: "OBJECT", properties: { afterSection: { type: "STRING" }, question: { type: "STRING" }, expectedAnswer: { type: "STRING" } } } } } }
    }
  };

  return await callGemini(system, user, schema);
}

export default {
  extractConcepts,
  generateDiagnosticQuestions,
  analyzeDiagnosticResults,
  generateQuizQuestion,
  evaluateAnswer,
  generateTeachingContent,
};
