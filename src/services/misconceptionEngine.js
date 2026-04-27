import { evaluateAnswerFallback } from './geminiAPI';

const BLOOM_TEMPLATES = {
  1: [ // Remembering (Recall) - Focus: Recognizing and recalling facts, terms, and basic concepts.
    "How would you clearly define '{name}'?",
    "What are the essential, key characteristics of '{name}'?",
    "If you were writing a textbook glossary, what is the exact definition of '{name}'?",
    "Briefly state the core facts about '{name}'.",
    "Without looking at your notes, how do you describe '{name}'?"
  ],
  2: [ // Understanding (Comprehension) - Focus: Explaining ideas or concepts in one's own words.
    "Can you write down the main idea of '{name}' in your own words?",
    "Imagine explaining '{name}' to a high school student. What would you say to clarify its meaning?",
    "Can you explain *why* '{name}' functions the way it does?",
    "How would you summarize the underlying principle behind '{name}'?",
    "What is the fundamental difference between '{name}' and a completely unrelated concept?"
  ],
  3: [ // Applying - Focus: Using information in new or concrete situations.
    "How could the concept of '{name}' be applied to solve a real-world problem?",
    "Can you provide a concrete, real-life example of '{name}' in action?",
    "If you had to demonstrate '{name}' to someone right now, what scenario would you use?",
    "What factors would you need to change if you were trying to implement '{name}' practically?",
    "How does understanding '{name}' help you approach new, unfamiliar situations?"
  ],
  4: [ // Analyzing - Focus: Drawing connections among ideas and breaking material into parts.
    "What is the underlying problem that the concept of '{name}' actually solves?",
    "If you had to break down '{name}' into its core components, what would they be?",
    "What evidence or logic supports the existence or use of '{name}'?",
    "Why do you think '{name}' is structured or formulated the way it is?",
    "What is the relationship between the different parts that make up '{name}'?"
  ]
};

const PREFIXES = [
  "", "", // Lower chance of prefix for a cleaner look
  "Concept Check: ",
  "Active Recall: ",
  "Let's test your understanding: ",
  "Feynman Technique time: "
];

export async function generateQuizQuestion(concept, bloomLevel, previousContext = '') {
  // If we have cached questions, we could try to reuse one, but for simplicity we'll generate
  // a new one based on a template.
  let level = bloomLevel;
  if (!BLOOM_TEMPLATES[level]) level = 3; // Fallback to Apply
  
  const templates = BLOOM_TEMPLATES[level];
  const template = templates[Math.floor(Math.random() * templates.length)];
  const prefix = PREFIXES[Math.floor(Math.random() * PREFIXES.length)];
  
  const questionText = prefix + template.replace(/{name}/g, concept.name);
  
  return {
    question: questionText,
    bloomLevel: level,
    expectedAnswer: concept.definition,
    hint: `Think about: ${concept.definition.split(' ').slice(0, 5).join(' ')}...`,
    questionType: "explanation"
  };
}

export async function evaluateAnswer(questionText, expectedAnswer, studentAnswer, concept) {
  const ans = studentAnswer.toLowerCase();
  const exp = expectedAnswer.toLowerCase();
  
  // Layer 1: Keyword correctness check
  const expectedWords = exp.split(/[\s,.-]+/).filter(w => w.length > 3);
  const matchedWords = expectedWords.filter(w => ans.includes(w));
  
  let score = 0;
  if (expectedWords.length > 0) {
    score = matchedWords.length / expectedWords.length;
  }
  
  // If the score is very high, just accept it
  if (score >= 0.6) {
    return {
      isCorrect: true,
      score: score,
      bloomsLevelAchieved: 2,
      feedback: "Great job! You clearly understand the core concept.",
      misconceptionDetected: false,
      misconceptionName: null,
      misconceptionExplanation: null,
      correctExplanation: expectedAnswer,
      encouragement: "Keep up the excellent work!"
    };
  }

  // Layer 2: Misconception pattern matching
  if (concept.misconceptions && concept.misconceptions.length > 0) {
    for (const m of concept.misconceptions) {
      if (m.pattern && ans.includes(m.pattern.toLowerCase())) {
        return {
          isCorrect: false,
          score: 0.2,
          bloomsLevelAchieved: 1,
          feedback: m.explanation,
          misconceptionDetected: true,
          misconceptionName: m.pattern,
          misconceptionExplanation: m.explanation,
          correctExplanation: expectedAnswer,
          encouragement: "Don't worry, this is a very common mix-up!"
        };
      }
    }
  }

  // Layer 3: LLM Fallback (if confidence is low or we couldn't evaluate properly)
  try {
    const fallbackResult = await evaluateAnswerFallback(questionText, expectedAnswer, studentAnswer, concept.name);
    return {
      isCorrect: fallbackResult.isCorrect,
      score: fallbackResult.score || (fallbackResult.isCorrect ? 0.8 : 0.2),
      bloomsLevelAchieved: fallbackResult.isCorrect ? 2 : 1,
      feedback: fallbackResult.feedback,
      misconceptionDetected: fallbackResult.misconceptionDetected || false,
      misconceptionName: fallbackResult.misconceptionName || null,
      misconceptionExplanation: fallbackResult.misconceptionExplanation || null,
      correctExplanation: expectedAnswer,
      encouragement: fallbackResult.isCorrect ? "Well done!" : "Let's review the concept."
    };
  } catch (err) {
    // If even the fallback fails, return a safe default
    console.error("LLM Fallback failed:", err);
    return {
      isCorrect: false,
      score: 0,
      bloomsLevelAchieved: 1,
      feedback: "Your answer didn't quite match the expected keywords, and our advanced grading system is currently offline. Let's try another one.",
      misconceptionDetected: false,
      correctExplanation: expectedAnswer,
      encouragement: "Keep trying!"
    };
  }
}
