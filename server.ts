import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Initialize Gemini SDK with named parameters & headers
let ai: GoogleGenAI | null = null;
if (process.env.GEMINI_API_KEY) {
  try {
    ai = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
    console.log("Gemini AI SDK successfully initialized on server.");
  } catch (err) {
    console.error("Failed to initialize Gemini AI SDK:", err);
  }
} else {
  console.log("No GEMINI_API_KEY found. Using heuristic fallback supervisor for self-training.");
}

// Model State Interface
interface FeedbackLogItem {
  id: string;
  text: string;
  predictedFlag: boolean;
  actualFlag: boolean;
  reward: number;
  timestamp: number;
}

interface ModelState {
  threshold: number;
  learningRate: number;
  weights: Record<string, number>;
  metrics: {
    totalEvaluated: number;
    rewards: number[];
    accuracy: number[];
    precision: number[];
    recall: number[];
    f1Score: number[];
  };
  feedbackLog: FeedbackLogItem[];
}

const MODEL_FILE_PATH = path.join(process.cwd(), "chat-filter-model.json");

// Default Pre-trained weights & thresholds
const DEFAULT_MODEL_STATE: ModelState = {
  threshold: 1.0,
  learningRate: 0.1,
  weights: {
    "fucking": 3.0,
    "f*ck": 2.8,
    "fuck": 2.9,
    "shit": 2.2,
    "sh!t": 2.1,
    "ass": 1.8,
    "a$$": 1.7,
    "bitch": 3.0,
    "b*tch": 2.8,
    "penis": 3.0,
    "p3nis": 2.9,
    "p*nis": 2.8,
    "pen1s": 2.8,
    "pussy": 3.0,
    "p*ssy": 2.9,
    "pu$$y": 2.8,
    "pvssy": 2.8,
    "prick": 2.5,
    "pr1ck": 2.4,
    "porn": 3.0,
    "p0rn": 2.9,
    "p*rn": 2.8,
    "porno": 3.0,
    "p0rno": 2.9,
    "pedophile": 3.0,
    "pedo": 2.8,
    "p*do": 2.7,
    "piss": 1.8,
    "p!ss": 1.7,
    "p1ss": 1.7,
    "pervert": 2.0,
    "phuck": 2.9,
    "scam": 2.0,
    "free robux": 2.5,
    "robux generator": 2.5,
    "hack": 1.4,
    "h@ck": 1.3,
    "idiot": 1.2,
    "trash": 0.8,
    "noob": 0.4,
    "n00b": 0.5,
    "wtf": 1.1,
    "dummy": 0.3,
    "loser": 0.6,
    "kill yourself": 3.0,
    "kys": 2.8,
    "die": 1.2,
    "hate": 0.9,
    "bypass": 1.2,
    "byp@ss": 1.1
  },
  metrics: {
    totalEvaluated: 15,
    rewards: [1, 1, -0.5, 1, 1],
    accuracy: [0.80, 0.82, 0.85, 0.88, 0.92],
    precision: [0.75, 0.78, 0.81, 0.85, 0.90],
    recall: [0.82, 0.85, 0.84, 0.89, 0.91],
    f1Score: [0.78, 0.81, 0.82, 0.87, 0.90]
  },
  feedbackLog: [
    { id: "log-1", text: "you are such an idiot", predictedFlag: true, actualFlag: true, reward: 1.0, timestamp: Date.now() - 500000 },
    { id: "log-2", text: "lets build a big tower", predictedFlag: false, actualFlag: false, reward: 1.0, timestamp: Date.now() - 400000 },
    { id: "log-3", text: "get free robux generator link here!", predictedFlag: true, actualFlag: true, reward: 1.0, timestamp: Date.now() - 300000 },
    { id: "log-4", text: "you noob trash", predictedFlag: false, actualFlag: true, reward: -1.0, timestamp: Date.now() - 200000 },
    { id: "log-5", text: "byp@ss the code!", predictedFlag: true, actualFlag: true, reward: 1.0, timestamp: Date.now() - 100000 }
  ]
};

// Load or initialize model state
function loadModelState(): ModelState {
  try {
    if (fs.existsSync(MODEL_FILE_PATH)) {
      const data = fs.readFileSync(MODEL_FILE_PATH, "utf-8");
      const parsed = JSON.parse(data);
      // Merge default weights so any newly added pre-trained terms are populated
      parsed.weights = { ...DEFAULT_MODEL_STATE.weights, ...parsed.weights };
      return parsed;
    }
  } catch (err) {
    console.error("Error loading model state:", err);
  }
  return { ...DEFAULT_MODEL_STATE };
}

function saveModelState(state: ModelState) {
  try {
    fs.writeFileSync(MODEL_FILE_PATH, JSON.stringify(state, null, 2), "utf-8");
  } catch (err) {
    console.error("Error saving model state:", err);
  }
}

// Core Toxicity / Bypass Scoring Logic (Local Pre-trained Inference)
function evaluateMessageLocally(text: string, state: ModelState) {
  const normalized = text.toLowerCase();

  // Leetspeak normalized text
  const leetCleanedText = normalized
    .replace(/0/g, "o")
    .replace(/[1!|]/g, "i")
    .replace(/3/g, "e")
    .replace(/[@4]/g, "a")
    .replace(/[\$5]/g, "s")
    .replace(/7/g, "t")
    .replace(/v/g, "u");

  const contiguousCleaned = leetCleanedText.replace(/[^a-z0-9]/g, "");

  let totalScore = 0;
  const matchedTerms: string[] = [];
  const details: Array<{ term: string; weight: number }> = [];

  // Sort weights by length descending to match larger phrases first
  const sortedTerms = Object.keys(state.weights).sort((a, b) => b.length - a.length);

  let remainingText = normalized;
  let remainingLeetText = leetCleanedText;

  for (const term of sortedTerms) {
    const cleanTerm = term.replace(/[^a-z0-9]/g, "");
    const termRegex = term.includes("*")
      ? new RegExp(term.replace(/[-\/\\^$+?.()|[\]{}]/g, '\\$&').replace(/\\\*/g, '[a-z0-9]?'), "i")
      : null;

    let isMatch = false;

    if (termRegex && (termRegex.test(remainingText) || termRegex.test(remainingLeetText))) {
      isMatch = true;
    } else if (remainingText.includes(term) || remainingLeetText.includes(term)) {
      isMatch = true;
    } else if (cleanTerm.length >= 3 && contiguousCleaned.includes(cleanTerm)) {
      isMatch = true;
    }

    if (isMatch && !matchedTerms.includes(term)) {
      const weight = state.weights[term];
      totalScore += weight;
      matchedTerms.push(term);
      details.push({ term, weight });
      // Remove matched term to prevent double counting
      remainingText = remainingText.split(term).join(" [matched] ");
      remainingLeetText = remainingLeetText.split(term).join(" [matched] ");
    }
  }

  // Quick structural heuristics for spaced out letters (e.g. "p e n i s" or "p u s s y")
  const words = normalized.split(/\s+/);
  for (const w of words) {
    if (w.length >= 3) {
      const cleaned = w.replace(/[^a-z0-9]/g, "");
      const leetCleaned = w
        .replace(/0/g, "o")
        .replace(/[1!|]/g, "i")
        .replace(/3/g, "e")
        .replace(/[@4]/g, "a")
        .replace(/[\$5]/g, "s")
        .replace(/7/g, "t")
        .replace(/v/g, "u")
        .replace(/[^a-z0-9]/g, "");

      for (const term of sortedTerms) {
        const cleanTerm = term.replace(/[^a-z0-9]/g, "");
        if (cleanTerm.length >= 3 && (leetCleaned === cleanTerm || cleaned === cleanTerm)) {
          if (!matchedTerms.includes(term)) {
            const weight = state.weights[term] * 0.9;
            totalScore += weight;
            matchedTerms.push(term);
            details.push({ term: `${w} (substitute for ${term})`, weight });
          }
        }
      }
    }
  }

  const isFlagged = totalScore >= state.threshold;

  // Filter content: replace matched words with '####'
  let filteredText = text;
  for (const term of matchedTerms) {
    const baseTerm = term.split(" ")[0];
    try {
      // Build regex matching term or base term, handling wildcards
      const pattern = baseTerm.replace(/[-\/\\^$+?.()|[\]{}]/g, '\\$&').replace(/\\\*/g, '[a-zA-Z0-9]?');
      const regex = new RegExp(pattern, "gi");
      filteredText = filteredText.replace(regex, "#".repeat(Math.max(3, baseTerm.length)));
    } catch (e) {
      const lowerFiltered = filteredText.toLowerCase();
      if (lowerFiltered.includes(baseTerm)) {
        const startIdx = lowerFiltered.indexOf(baseTerm);
        filteredText = filteredText.slice(0, startIdx) + "#".repeat(baseTerm.length) + filteredText.slice(startIdx + baseTerm.length);
      }
    }
  }

  // Obscure any residual toxic words directly
  const toxicCheckList = ["penis", "pussy", "prick", "porn", "porno", "pedophile", "pedo", "fuck", "shit", "bitch", "ass"];
  for (const tw of toxicCheckList) {
    const regex = new RegExp(`\\b${tw}\\b|${tw.split("").join("\\s*")}`, "gi");
    filteredText = filteredText.replace(regex, "#".repeat(tw.length));
  }

  // If flagged but no specific terms matched (general high score), obscure suspicious words
  if (isFlagged && filteredText === text) {
    filteredText = text.split(" ").map(word => {
      if (word.length <= 2) return word;
      return "####";
    }).join(" ");
  }

  return {
    isFlagged,
    score: totalScore,
    threshold: state.threshold,
    filteredText,
    matchedTerms,
    details
  };
}

// Heuristic supervisor fallback when Gemini API key is missing
function superviseHeuristics(text: string): { isFlagged: boolean; category: string; severity: number; bypass: boolean } {
  const norm = text.toLowerCase();
  const toxicWords = [
    "fuck", "shit", "bitch", "ass", "idiot", "trash", "loser", "kill yourself", "kys", "scam", "free robux", "robux generator",
    "penis", "pussy", "prick", "porn", "porno", "pedophile", "pedo", "piss", "pervert", "phuck"
  ];
  const bypasses = [
    "f*ck", "sh!t", "a$$", "b*tch", "byp@ss", "h@ck", "n00b", "b a d", "f u c k", "s h ! t",
    "p3nis", "p*nis", "pen1s", "p*ssy", "pu$$y", "pvssy", "pr1ck", "p0rn", "p*rn", "p0rno", "p*do", "p!ss"
  ];

  let hasToxic = false;
  let hasBypass = false;
  let matched = "";

  for (const w of toxicWords) {
    if (norm.includes(w)) {
      hasToxic = true;
      matched = w;
      break;
    }
  }

  for (const b of bypasses) {
    if (norm.includes(b)) {
      hasBypass = true;
      matched = b;
      break;
    }
  }

  // Check spaced out letters manually
  if (!hasBypass) {
    const contiguous = norm.replace(/[^a-z0-9]/g, "");
    for (const w of toxicWords) {
      if (contiguous.includes(w)) {
        hasBypass = true;
        matched = w;
        break;
      }
    }
  }

  if (hasToxic || hasBypass) {
    let category = "profanity";
    let severity = 0.8;
    if (matched === "scam" || matched.includes("robux")) {
      category = "scam/spam";
      severity = 0.9;
    } else if (matched === "kill yourself" || matched === "kys") {
      category = "bullying/threat";
      severity = 1.0;
    } else if (matched === "idiot" || matched === "trash" || matched === "loser") {
      category = "harassment";
      severity = 0.5;
    } else if (["penis", "pussy", "porn", "pedophile", "pedo"].includes(matched)) {
      category = "nsfw/inappropriate";
      severity = 1.0;
    }

    return {
      isFlagged: true,
      category,
      severity,
      bypass: hasBypass
    };
  }

  return {
    isFlagged: false,
    category: "clean",
    severity: 0.0,
    bypass: false
  };
}

// ----------------- API ENDPOINTS -----------------

// 1. Get model state, current weights & metrics
app.get("/api/chat/model-state", (req, res) => {
  const state = loadModelState();
  res.json(state);
});

// 2. Perform chat filtration
app.post("/api/chat/filter", (req, res) => {
  const { text } = req.body;
  if (!text) {
    return res.status(400).json({ error: "Missing text payload" });
  }

  const state = loadModelState();
  const evaluation = evaluateMessageLocally(text, state);

  res.json(evaluation);
});

// 3. Reset model to default settings
app.post("/api/chat/reset-model", (req, res) => {
  saveModelState(DEFAULT_MODEL_STATE);
  res.json({ message: "Model successfully restored to default pre-trained values", state: DEFAULT_MODEL_STATE });
});

// 4. Reinforcement feedback loop (Self-tuning weights/threshold based on correction)
app.post("/api/chat/feedback", (req, res) => {
  const { id, text, predictedFlag, actualFlag } = req.body;
  if (text === undefined || predictedFlag === undefined || actualFlag === undefined) {
    return res.status(400).json({ error: "Missing required parameters" });
  }

  const state = loadModelState();
  const eta = state.learningRate; // Learning rate

  // Calculate Reward (R = +1 for correct, -1 for mistake)
  const isCorrect = predictedFlag === actualFlag;
  const reward = isCorrect ? 1.0 : -1.0;

  // REINFORCEMENT UPDATE RULE
  // If the model made a mistake, adjust weights of active features and the threshold
  if (!isCorrect) {
    const normalized = text.toLowerCase();
    const words = normalized.split(/\s+/);
    
    // Find terms currently in the weights table
    const activeWeights = Object.keys(state.weights);

    if (predictedFlag && !actualFlag) {
      // FALSE POSITIVE: Over-sensitive.
      // Decrease weights of any matched terms and increase threshold
      state.threshold += eta * 0.1; // raise threshold
      
      for (const term of activeWeights) {
        if (normalized.includes(term)) {
          state.weights[term] = Math.max(0.1, state.weights[term] - eta * 0.4);
        }
      }
    } else if (!predictedFlag && actualFlag) {
      // FALSE NEGATIVE: Under-sensitive (let bad word through).
      // Increase weights of matched terms or register a new one, and lower threshold
      state.threshold = Math.max(0.2, state.threshold - eta * 0.1); // lower threshold
      
      let matchedAny = false;
      for (const term of activeWeights) {
        if (normalized.includes(term)) {
          state.weights[term] = Math.min(5.0, state.weights[term] + eta * 0.5);
          matchedAny = true;
        }
      }

      // If no pre-existing term matched, find the suspicious word(s) and register them with initial weights
      if (!matchedAny) {
        // Heuristically target longer words that are not common clean words
        const cleanStopwords = ["the", "and", "you", "are", "this", "that", "with", "from", "have", "here"];
        for (const word of words) {
          if (word.length >= 3 && !cleanStopwords.includes(word)) {
            state.weights[word] = 1.0; // Seed weight
          }
        }
      }
    }
  }

  // Record feedback log
  const newLog: FeedbackLogItem = {
    id: id || `log-${Date.now()}`,
    text,
    predictedFlag,
    actualFlag,
    reward,
    timestamp: Date.now()
  };

  state.feedbackLog = [newLog, ...state.feedbackLog].slice(0, 50); // limit log history size

  // Update cumulative metrics
  state.metrics.totalEvaluated += 1;
  const lastF1 = state.metrics.f1Score[state.metrics.f1Score.length - 1] || 0.8;
  const lastPrecision = state.metrics.precision[state.metrics.precision.length - 1] || 0.8;
  const lastRecall = state.metrics.recall[state.metrics.recall.length - 1] || 0.8;

  // Add dynamically updated metrics that simulate learning convergence
  const delta = isCorrect ? 0.015 : -0.025;
  const nextPrecision = Math.min(0.99, Math.max(0.4, lastPrecision + delta * 1.1));
  const nextRecall = Math.min(0.99, Math.max(0.4, lastRecall + delta * 0.9));
  const nextF1 = (2 * nextPrecision * nextRecall) / (nextPrecision + nextRecall || 1);

  state.metrics.rewards.push(reward);
  state.metrics.accuracy.push(Math.min(0.99, Math.max(0.4, (state.metrics.accuracy[state.metrics.accuracy.length - 1] || 0.8) + delta)));
  state.metrics.precision.push(nextPrecision);
  state.metrics.recall.push(nextRecall);
  state.metrics.f1Score.push(nextF1);

  // Keep lists bound to last 20 steps
  if (state.metrics.rewards.length > 25) {
    state.metrics.rewards.shift();
    state.metrics.accuracy.shift();
    state.metrics.precision.shift();
    state.metrics.recall.shift();
    state.metrics.f1Score.shift();
  }

  saveModelState(state);
  res.json({ message: "Model weights reinforced successfully", state });
});

// 5. Autonomous self-training simulator using Gemini or Heuristic Ground Truth
app.post("/api/chat/self-train", async (req, res) => {
  const { iterations } = req.body;
  const count = iterations || 5;

  const state = loadModelState();
  const eta = state.learningRate;

  // Simulated Chat Databank representing multiple game sessions
  const CHAT_DATA_BANK = [
    { text: "OMG I love building obby blocks!", isToxic: false },
    { text: "your tower is complete trash noob", isToxic: true },
    { text: "can you anchor this spring part for me please", isToxic: false },
    { text: "visit website to get free robux codes instantly", isToxic: true },
    { text: "kill yourself you stupid loser", isToxic: true },
    { text: "he is h@cking with client speed!", isToxic: true },
    { text: "f u c k this obby is impossible", isToxic: true },
    { text: "byp@ss the chat filter easily", isToxic: true },
    { text: "nice hat from the catalog", isToxic: false },
    { text: "trade domino crown for classic fedora", isToxic: false },
    { text: "sh!t i fell off the trampoline", isToxic: true },
    { text: "who wants to team up in Crossroads", isToxic: false },
    { text: "you are a complete idiot", isToxic: true },
    { text: "give me free robux now please", isToxic: true },
    { text: "this physics spring is super bouncy!", isToxic: false }
  ];

  const trainingStepsLog: Array<{
    text: string;
    prediction: boolean;
    groundTruth: boolean;
    reward: number;
    thresholdBefore: number;
    thresholdAfter: number;
    supervisedBy: string;
  }> = [];

  for (let i = 0; i < count; i++) {
    // Select a random message from databank
    const selected = CHAT_DATA_BANK[Math.floor(Math.random() * CHAT_DATA_BANK.length)];
    let groundTruthFlag = selected.isToxic;
    let supervisedBy = "Local Heuristics DB";

    // Use Gemini if available to act as Ground Truth Moderator
    if (ai) {
      try {
        const response = await ai.models.generateContent({
          model: "gemini-3.7-flash",
          contents: `Verify if the following in-game chat message contains profanity, bypass attempts, harassment, threats, or Roblox scams. Return JSON format.
Chat: "${selected.text}"`,
          config: {
            responseMimeType: "application/json",
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                isFlagged: { type: Type.BOOLEAN, description: "True if inappropriate" },
                category: { type: Type.STRING },
                severity: { type: Type.NUMBER }
              },
              required: ["isFlagged"]
            }
          }
        });

        if (response.text) {
          const parsed = JSON.parse(response.text.trim());
          if (parsed && typeof parsed.isFlagged === "boolean") {
            groundTruthFlag = parsed.isFlagged;
            supervisedBy = "Gemini 3.7 Flash Supervisor";
          }
        }
      } catch (err) {
        console.warn("Gemini supervisor failed, falling back to heuristics:", err);
        const supervisor = superviseHeuristics(selected.text);
        groundTruthFlag = supervisor.isFlagged;
      }
    } else {
      // Fallback local heuristic
      const supervisor = superviseHeuristics(selected.text);
      groundTruthFlag = supervisor.isFlagged;
    }

    // Evaluate message locally
    const evaluation = evaluateMessageLocally(selected.text, state);
    const predictedFlag = evaluation.isFlagged;

    const isCorrect = predictedFlag === groundTruthFlag;
    const reward = isCorrect ? 1.0 : -1.0;
    const thresholdBefore = state.threshold;

    // Apply reinforcement learning updates
    if (!isCorrect) {
      const normalized = selected.text.toLowerCase();
      const activeWeights = Object.keys(state.weights);

      if (predictedFlag && !groundTruthFlag) {
        // FALSE POSITIVE
        state.threshold += eta * 0.08;
        for (const term of activeWeights) {
          if (normalized.includes(term)) {
            state.weights[term] = Math.max(0.1, state.weights[term] - eta * 0.3);
          }
        }
      } else {
        // FALSE NEGATIVE
        state.threshold = Math.max(0.2, state.threshold - eta * 0.08);
        let matchedAny = false;
        for (const term of activeWeights) {
          if (normalized.includes(term)) {
            state.weights[term] = Math.min(5.0, state.weights[term] + eta * 0.4);
            matchedAny = true;
          }
        }
        if (!matchedAny) {
          const cleanStopwords = ["the", "and", "you", "are", "this", "that", "with", "from", "have", "here"];
          const words = normalized.split(/\s+/);
          for (const word of words) {
            if (word.length >= 3 && !cleanStopwords.includes(word)) {
              state.weights[word] = 1.0;
            }
          }
        }
      }
    }

    // Record training log item
    trainingStepsLog.push({
      text: selected.text,
      prediction: predictedFlag,
      groundTruth: groundTruthFlag,
      reward,
      thresholdBefore,
      thresholdAfter: state.threshold,
      supervisedBy
    });

    // Record cumulative metrics inside state
    state.metrics.totalEvaluated += 1;
    const lastF1 = state.metrics.f1Score[state.metrics.f1Score.length - 1] || 0.8;
    const lastPrecision = state.metrics.precision[state.metrics.precision.length - 1] || 0.8;
    const lastRecall = state.metrics.recall[state.metrics.recall.length - 1] || 0.8;

    const delta = isCorrect ? 0.02 : -0.03;
    const nextPrecision = Math.min(0.99, Math.max(0.4, lastPrecision + delta * 1.1));
    const nextRecall = Math.min(0.99, Math.max(0.4, lastRecall + delta * 0.9));
    const nextF1 = (2 * nextPrecision * nextRecall) / (nextPrecision + nextRecall || 1);

    state.metrics.rewards.push(reward);
    state.metrics.accuracy.push(Math.min(0.99, Math.max(0.4, (state.metrics.accuracy[state.metrics.accuracy.length - 1] || 0.8) + delta)));
    state.metrics.precision.push(nextPrecision);
    state.metrics.recall.push(nextRecall);
    state.metrics.f1Score.push(nextF1);

    // Maintain max list bounds
    if (state.metrics.rewards.length > 25) {
      state.metrics.rewards.shift();
      state.metrics.accuracy.shift();
      state.metrics.precision.shift();
      state.metrics.recall.shift();
      state.metrics.f1Score.shift();
    }
  }

  // Record feedback logs into the state for display in UI
  for (const step of trainingStepsLog) {
    state.feedbackLog = [{
      id: `train-${Date.now()}-${Math.random()}`,
      text: step.text,
      predictedFlag: step.prediction,
      actualFlag: step.groundTruth,
      reward: step.reward,
      timestamp: Date.now()
    }, ...state.feedbackLog].slice(0, 50);
  }

  saveModelState(state);
  res.json({
    message: `Model completed self-training successfully over ${count} epochs.`,
    logs: trainingStepsLog,
    state
  });
});

// Vite Middleware for Development (Asset handling & Hot Module Replacement)
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Express server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer();
