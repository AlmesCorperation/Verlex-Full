import React, { useState, useEffect } from "react";
import { sounds } from "../game/soundEngine";
import {
  ShieldAlert,
  Brain,
  Wrench,
  RotateCcw,
  Zap,
  CheckCircle,
  XCircle,
  Play,
  Terminal,
  Activity,
  Sliders,
  SlidersHorizontal,
  FileText,
  Search,
  BookOpen,
  ArrowRight,
  TrendingUp,
  Cpu,
  UserPlus
} from "lucide-react";

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

export const FilterTrainerPage: React.FC = () => {
  const [modelState, setModelState] = useState<ModelState | null>(null);
  const [testText, setTestText] = useState<string>("");
  const [evaluation, setEvaluation] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [trainCount, setTrainCount] = useState<number>(10);
  const [isTraining, setIsTraining] = useState<boolean>(false);
  const [trainingLogs, setTrainingLogs] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<"dashboard" | "sandbox" | "weights">("dashboard");

  // Fetch model state from server
  const fetchModelState = async () => {
    try {
      const res = await fetch("/api/chat/model-state");
      if (res.ok) {
        const data = await res.json();
        setModelState(data);
      }
    } catch (err) {
      console.error("Failed to fetch chat filter model state:", err);
    }
  };

  useEffect(() => {
    fetchModelState();
  }, []);

  // Run local test evaluation
  const handleTestEvaluation = async (text: string) => {
    if (!text.trim()) {
      setEvaluation(null);
      return;
    }
    try {
      const res = await fetch("/api/chat/filter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text })
      });
      if (res.ok) {
        const data = await res.json();
        setEvaluation(data);
      }
    } catch (err) {
      console.error("Evaluation request failed:", err);
    }
  };

  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      handleTestEvaluation(testText);
    }, 250);
    return () => clearTimeout(delayDebounce);
  }, [testText]);

  // Send reinforcement feedback / correction
  const handleCorrection = async (actualFlag: boolean) => {
    if (!testText.trim() || !evaluation) return;
    sounds.playClick();
    try {
      const res = await fetch("/api/chat/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: testText,
          predictedFlag: evaluation.isFlagged,
          actualFlag
        })
      });
      if (res.ok) {
        const data = await res.json();
        setModelState(data.state);
        // Refresh local test evaluation with updated weights
        handleTestEvaluation(testText);
      }
    } catch (err) {
      console.error("Feedback submission failed:", err);
    }
  };

  // Run autonomous reinforcement learning simulation cycle
  const handleRunSelfTraining = async () => {
    if (isTraining) return;
    sounds.playClick();
    setIsTraining(true);
    setTrainingLogs([]);
    
    try {
      const res = await fetch("/api/chat/self-train", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ iterations: trainCount })
      });
      if (res.ok) {
        const data = await res.json();
        
        // Simulating progressive training logs for delightful visual effect
        let index = 0;
        const interval = setInterval(() => {
          if (index < data.logs.length) {
            setTrainingLogs((prev) => [...prev, data.logs[index]]);
            index++;
          } else {
            clearInterval(interval);
            setModelState(data.state);
            setIsTraining(false);
          }
        }, 180);
      } else {
        setIsTraining(false);
      }
    } catch (err) {
      console.error("Self-training failed:", err);
      setIsTraining(false);
    }
  };

  // Reset model weights & parameters to default
  const handleResetModel = async () => {
    if (!window.confirm("Are you sure you want to restore the pre-trained chat filter weights to default?")) return;
    sounds.playClick();
    try {
      const res = await fetch("/api/chat/reset-model", { method: "POST" });
      if (res.ok) {
        const data = await res.json();
        setModelState(data.state);
        setTestText("");
        setEvaluation(null);
        setTrainingLogs([]);
      }
    } catch (err) {
      console.error("Reset request failed:", err);
    }
  };

  if (!modelState) {
    return (
      <div className="w-full h-96 flex items-center justify-center text-gray-500 font-medium">
        <div className="animate-spin mr-2 text-blue-600">🌀</div>
        Loading AI Reinforcement State...
      </div>
    );
  }

  // Filtered weights dictionary
  const filteredWeights = (Object.entries(modelState.weights).filter(([term]) =>
    term.toLowerCase().includes(searchQuery.toLowerCase())
  ) as Array<[string, number]>).sort((a, b) => b[1] - a[1]);

  return (
    <div id="filter-trainer-page" className="w-full bg-[#f3f4f6] min-h-[calc(100vh-140px)] py-6 px-4 md:px-8 font-sans text-gray-800">
      <div className="max-w-6xl mx-auto space-y-6">
        
        {/* Banner Title */}
        <div className="bg-gradient-to-r from-[#111827] via-[#1f2937] to-[#374151] border-b-4 border-emerald-500 p-6 shadow-md text-white rounded-xl flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Brain className="text-emerald-400 w-7 h-7 animate-pulse" />
              <h1 className="text-2xl sm:text-3xl font-black tracking-wide">
                AI Filter Reinforcement System
              </h1>
            </div>
            <p className="text-xs sm:text-sm text-gray-300 font-medium">
              A dynamic, self-supervised Reinforcement Learning (RL) chat moderator that auto-adjusts bypass weights and sensitivities in real-time.
            </p>
          </div>
          <button
            onClick={handleResetModel}
            className="flex items-center justify-center gap-1.5 bg-red-600 hover:bg-red-500 text-white font-black text-xs uppercase px-4 py-2.5 rounded-lg shadow cursor-pointer transition self-start md:self-auto"
          >
            <RotateCcw size={14} />
            Reset Pre-trained Factory
          </button>
        </div>

        {/* Tab Selection */}
        <div className="flex border-b border-gray-200 gap-1 overflow-x-auto scrollbar-none">
          <button
            onClick={() => { sounds.playClick(); setActiveTab("dashboard"); }}
            className={`px-5 py-3 text-xs uppercase tracking-wider font-black border-b-4 transition cursor-pointer flex items-center gap-1.5 ${
              activeTab === "dashboard"
                ? "border-emerald-500 text-gray-900 bg-white rounded-t-lg"
                : "border-transparent text-gray-500 hover:text-gray-800"
            }`}
          >
            <Activity size={14} />
            Trainer Dashboard
          </button>
          <button
            onClick={() => { sounds.playClick(); setActiveTab("sandbox"); }}
            className={`px-5 py-3 text-xs uppercase tracking-wider font-black border-b-4 transition cursor-pointer flex items-center gap-1.5 ${
              activeTab === "sandbox"
                ? "border-emerald-500 text-gray-900 bg-white rounded-t-lg"
                : "border-transparent text-gray-500 hover:text-gray-800"
            }`}
          >
            <Wrench size={14} />
            Sandbox & Feedback Loop
          </button>
          <button
            onClick={() => { sounds.playClick(); setActiveTab("weights"); }}
            className={`px-5 py-3 text-xs uppercase tracking-wider font-black border-b-4 transition cursor-pointer flex items-center gap-1.5 ${
              activeTab === "weights"
                ? "border-emerald-500 text-gray-900 bg-white rounded-t-lg"
                : "border-transparent text-gray-500 hover:text-gray-800"
            }`}
          >
            <Sliders size={14} />
            Vocabulary Weights Table ({Object.keys(modelState.weights).length})
          </button>
        </div>

        {/* -------------------- TAB 1: DASHBOARD -------------------- */}
        {activeTab === "dashboard" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Left/Middle Column: Metrics & Graphs */}
            <div className="lg:col-span-2 space-y-6">
              
              {/* Primary Stats Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="bg-white p-4 border border-gray-200 rounded-xl shadow-xs">
                  <span className="text-[10px] uppercase font-bold text-gray-400">Total Evaluations</span>
                  <div className="text-xl font-black text-gray-900 font-mono mt-0.5">
                    {modelState.metrics.totalEvaluated}
                  </div>
                  <span className="text-[9px] text-gray-400">Across play sessions</span>
                </div>
                <div className="bg-white p-4 border border-gray-200 rounded-xl shadow-xs">
                  <span className="text-[10px] uppercase font-bold text-gray-400">Current Sensitivity (τ)</span>
                  <div className="text-xl font-black text-emerald-600 font-mono mt-0.5">
                    {modelState.threshold.toFixed(3)}
                  </div>
                  <span className="text-[9px] text-gray-400">Auto-tuned RL boundary</span>
                </div>
                <div className="bg-white p-4 border border-gray-200 rounded-xl shadow-xs">
                  <span className="text-[10px] uppercase font-bold text-gray-400">Active Vocab Weights</span>
                  <div className="text-xl font-black text-blue-600 font-mono mt-0.5">
                    {Object.keys(modelState.weights).length}
                  </div>
                  <span className="text-[9px] text-gray-400">Toxicity nodes registered</span>
                </div>
                <div className="bg-white p-4 border border-gray-200 rounded-xl shadow-xs">
                  <span className="text-[10px] uppercase font-bold text-gray-400">Average Reward Rating</span>
                  <div className="text-xl font-black text-purple-600 font-mono mt-0.5">
                    {(modelState.metrics.rewards.reduce((a, b) => a + b, 0) / Math.max(1, modelState.metrics.rewards.length)).toFixed(2)}
                  </div>
                  <span className="text-[9px] text-gray-400">Precision confidence scale</span>
                </div>
              </div>

              {/* F1 Convergence SVG Chart */}
              <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-xs">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="font-bold text-sm text-gray-800">Precision, Recall &amp; F1 Convergence</h3>
                    <p className="text-[11px] text-gray-400">Learning performance convergence across backpropagation steps.</p>
                  </div>
                  <span className="text-[10px] bg-emerald-50 text-emerald-700 font-bold border border-emerald-100 px-2.5 py-0.5 rounded-full">
                    Target: 95%+
                  </span>
                </div>
                <div className="h-44 w-full mt-2 relative">
                  {/* SVG line chart */}
                  <svg className="w-full h-full" viewBox="0 0 500 150" preserveAspectRatio="none">
                    {/* Grid Lines */}
                    <line x1="0" y1="37.5" x2="500" y2="37.5" stroke="#f1f5f9" strokeWidth="1" />
                    <line x1="0" y1="75" x2="500" y2="75" stroke="#f1f5f9" strokeWidth="1" />
                    <line x1="0" y1="112.5" x2="500" y2="112.5" stroke="#f1f5f9" strokeWidth="1" />
                    
                    {/* F1 Score path (Green) */}
                    <path
                      d={modelState.metrics.f1Score.map((val, idx) => {
                        const x = (idx / Math.max(1, modelState.metrics.f1Score.length - 1)) * 500;
                        const y = 150 - (val * 110 + 20); // Scale 0-1 into chart space
                        return `${idx === 0 ? 'M' : 'L'} ${x} ${y}`;
                      }).join(' ')}
                      fill="none"
                      stroke="#10b981"
                      strokeWidth="3"
                      strokeLinecap="round"
                    />

                    {/* Precision Score path (Blue) */}
                    <path
                      d={modelState.metrics.precision.map((val, idx) => {
                        const x = (idx / Math.max(1, modelState.metrics.precision.length - 1)) * 500;
                        const y = 150 - (val * 110 + 20);
                        return `${idx === 0 ? 'M' : 'L'} ${x} ${y}`;
                      }).join(' ')}
                      fill="none"
                      stroke="#3b82f6"
                      strokeWidth="1.5"
                      strokeDasharray="4 2"
                    />

                    {/* Recall Score path (Orange) */}
                    <path
                      d={modelState.metrics.recall.map((val, idx) => {
                        const x = (idx / Math.max(1, modelState.metrics.recall.length - 1)) * 500;
                        const y = 150 - (val * 110 + 20);
                        return `${idx === 0 ? 'M' : 'L'} ${x} ${y}`;
                      }).join(' ')}
                      fill="none"
                      stroke="#f97316"
                      strokeWidth="1.5"
                      strokeDasharray="2 2"
                    />
                  </svg>
                  
                  {/* Legend */}
                  <div className="flex items-center justify-end gap-4 mt-2 text-[10px] font-bold">
                    <div className="flex items-center gap-1">
                      <span className="w-2.5 h-0.5 bg-emerald-500" />
                      <span className="text-gray-600">F1 Score ({(modelState.metrics.f1Score[modelState.metrics.f1Score.length - 1] * 100 || 80).toFixed(1)}%)</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="w-2.5 h-0.5 bg-blue-500 border-dashed border-t" />
                      <span className="text-gray-600">Precision ({(modelState.metrics.precision[modelState.metrics.precision.length - 1] * 100 || 80).toFixed(1)}%)</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="w-2.5 h-0.5 bg-orange-500 border-dotted border-t" />
                      <span className="text-gray-600">Recall ({(modelState.metrics.recall[modelState.metrics.recall.length - 1] * 100 || 80).toFixed(1)}%)</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Training logs terminal simulation */}
              <div className="bg-[#111827] border border-gray-800 rounded-xl p-4 shadow-xl text-white font-mono text-xs overflow-hidden relative">
                <div className="flex items-center justify-between border-b border-gray-800 pb-2.5 mb-3 text-gray-400">
                  <div className="flex items-center gap-2">
                    <Terminal className="text-emerald-500 w-4 h-4" />
                    <span className="text-gray-300">Reinforcement Live Training Terminal</span>
                  </div>
                  <span className="text-[10px] text-gray-500">Auto-audited via supervisor</span>
                </div>
                
                <div className="h-56 overflow-y-auto space-y-2 custom-scrollbar">
                  {trainingLogs.length === 0 && !isTraining && (
                    <div className="text-gray-500 italic text-center py-12">
                      {"No training logs generated yet. Set epoch iterations and execute 'Run Autonomous Training Loop' on the right."}
                    </div>
                  )}
                  {isTraining && trainingLogs.length === 0 && (
                    <div className="text-yellow-400/80 animate-pulse text-center py-12">
                      Initializing RL simulation workspace & spinlocks...
                    </div>
                  )}
                  {trainingLogs.map((log, idx) => (
                    <div key={idx} className="p-2 rounded bg-gray-900/40 border-l-2 border-emerald-500 animate-fade-in space-y-1">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-gray-400">Epoch #{idx + 1}</span>
                        <span className={log.reward > 0 ? "text-emerald-400" : "text-red-400"}>
                          Reward: {log.reward > 0 ? `+${log.reward}` : log.reward}
                        </span>
                      </div>
                      <div className="text-gray-100">
                        Input Chat: <span className="text-yellow-300">"{log.text}"</span>
                      </div>
                      <div className="grid grid-cols-2 gap-4 text-[10px] text-gray-400 pt-0.5 border-t border-gray-800/50">
                        <div>
                          Prediction: <span className={log.prediction ? "text-red-400 font-bold" : "text-emerald-400 font-bold"}>
                            {log.prediction ? "FLAGGED" : "CLEAN"}
                          </span>
                        </div>
                        <div>
                          Ground Truth: <span className={log.groundTruth ? "text-red-400 font-bold" : "text-emerald-400 font-bold"}>
                            {log.groundTruth ? "FLAGGED" : "CLEAN"}
                          </span>
                        </div>
                      </div>
                      <div className="text-[10px] text-gray-500">
                        Audit supervisor: <span className="text-purple-400">{log.supervisedBy}</span> • τ bound: {log.thresholdBefore.toFixed(2)} → {log.thresholdAfter.toFixed(2)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

            </div>

            {/* Right Column: Training controls & Stats */}
            <div className="space-y-6">
              
              {/* Training Command Panel */}
              <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-xs space-y-4">
                <div className="flex items-center gap-2 pb-2 border-b border-gray-100">
                  <SlidersHorizontal className="text-emerald-500 w-5 h-5" />
                  <h3 className="font-extrabold text-sm text-gray-800">Trainer Setup</h3>
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-bold text-gray-600 uppercase mb-1">Epoch Iterations</label>
                    <select
                      value={trainCount}
                      onChange={(e) => setTrainCount(Number(e.target.value))}
                      disabled={isTraining}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-xs bg-white text-gray-900 focus:outline-none focus:border-emerald-500 disabled:opacity-50"
                    >
                      <option value={5}>5 cycles</option>
                      <option value={10}>10 cycles</option>
                      <option value={20}>20 cycles</option>
                      <option value={50}>50 cycles</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-600 uppercase mb-1">Learning Rate (η)</label>
                    <input
                      type="text"
                      disabled
                      value={modelState.learningRate.toString()}
                      className="w-full px-3 py-2 border border-gray-100 rounded-lg text-xs bg-gray-50 text-gray-500 font-mono font-bold"
                    />
                  </div>

                  <div className="bg-gray-50 p-3 rounded-lg border border-gray-100 text-[11px] text-gray-500 space-y-1">
                    <span className="font-bold text-gray-700 block">How it works:</span>
                    <p>The system spins up simulated virtual players typing chat messages. The AI audits predictions against a **Heuristic & Gemini-based Ground Truth Supervisor**, updating vocabulary weights via Reinforcement Backpropagation.</p>
                  </div>

                  <button
                    onClick={handleRunSelfTraining}
                    disabled={isTraining}
                    className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 disabled:bg-gray-400 text-white font-black text-xs uppercase rounded-lg shadow hover:shadow-md cursor-pointer transition flex items-center justify-center gap-1.5"
                  >
                    {isTraining ? (
                      <>
                        <span className="animate-spin text-sm">🌀</span>
                        Reinforcing weights...
                      </>
                    ) : (
                      <>
                        <Play size={14} fill="white" />
                        Run Autonomous Training Loop
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Feedback History Log */}
              <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-xs space-y-3">
                <h3 className="font-extrabold text-sm text-gray-800 flex items-center gap-1.5 pb-2 border-b border-gray-100">
                  <FileText className="text-blue-500 w-4.5 h-4.5" />
                  Recent Feedback Logs
                </h3>
                <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1.5 custom-scrollbar text-xs">
                  {modelState.feedbackLog.length === 0 ? (
                    <div className="text-gray-400 italic text-center py-8">
                      No feedback submitted yet.
                    </div>
                  ) : (
                    modelState.feedbackLog.map((log) => (
                      <div key={log.id} className="p-2.5 border border-gray-100 rounded-lg space-y-1 bg-gray-50/50">
                        <div className="flex items-center justify-between text-[10px]">
                          <span className="font-bold text-gray-500">
                            {new Date(log.timestamp).toLocaleTimeString()}
                          </span>
                          <span className={`font-mono px-1.5 py-0.5 rounded font-black ${
                            log.reward > 0 ? "bg-emerald-100 text-emerald-800" : "bg-red-100 text-red-800"
                          }`}>
                            {log.reward > 0 ? `+${log.reward}` : log.reward}
                          </span>
                        </div>
                        <p className="text-gray-800 font-medium">"{log.text}"</p>
                        <div className="flex items-center gap-3 text-[10px] text-gray-400">
                          <span>Pred: <strong className={log.predictedFlag ? "text-red-500" : "text-emerald-600"}>
                            {log.predictedFlag ? "Flagged" : "Clean"}
                          </strong></span>
                          <span>Actual: <strong className={log.actualFlag ? "text-red-500" : "text-emerald-600"}>
                            {log.actualFlag ? "Flagged" : "Clean"}
                          </strong></span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

            </div>

          </div>
        )}

        {/* -------------------- TAB 2: SANDBOX & FEEDBACK -------------------- */}
        {activeTab === "sandbox" && (
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
            
            {/* Left Sandbox Area */}
            <div className="lg:col-span-3 space-y-6">
              
              {/* Test Input Card */}
              <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-xs space-y-4">
                <div className="flex items-center gap-2 pb-2 border-b border-gray-100">
                  <Wrench className="text-emerald-500 w-5 h-5" />
                  <h3 className="font-extrabold text-sm text-gray-800">Filter Sandbox</h3>
                </div>

                <div className="space-y-2">
                  <label className="block text-xs font-extrabold text-gray-500 uppercase">Input Chat Text</label>
                  <textarea
                    rows={3}
                    placeholder="Type a chat message here, like 'you are such a trash noob' or with bypass attempts like 'f*ck'..."
                    value={testText}
                    onChange={(e) => setTestText(e.target.value)}
                    className="w-full border-2 border-gray-200 rounded-xl p-3 text-sm focus:border-emerald-500 focus:outline-none bg-gray-50 text-gray-900"
                  />
                  <div className="flex justify-between text-[11px] text-gray-400">
                    <span>Evaluates instantly on keystroke</span>
                    <span>{testText.length} characters</span>
                  </div>
                </div>

                {evaluation && (
                  <div className="p-4 rounded-xl border border-dashed border-gray-200 space-y-4 bg-gray-50/50">
                    <div>
                      <span className="block text-[10px] uppercase font-bold text-gray-400 mb-1">Final Result</span>
                      <div className="flex items-center gap-2">
                        {evaluation.isFlagged ? (
                          <div className="flex items-center gap-1 bg-red-100 text-red-800 px-3 py-1 rounded-full text-xs font-black uppercase">
                            <ShieldAlert size={14} /> FLAGGED
                          </div>
                        ) : (
                          <div className="flex items-center gap-1 bg-emerald-100 text-emerald-800 px-3 py-1 rounded-full text-xs font-black uppercase">
                            <CheckCircle size={14} /> CLEAN
                          </div>
                        )}
                        <span className="text-xs font-mono text-gray-500">
                          Toxicity Score: <strong className="text-gray-700">{evaluation.score.toFixed(2)}</strong> (τ threshold: {evaluation.threshold.toFixed(2)})
                        </span>
                      </div>
                    </div>

                    <div>
                      <span className="block text-[10px] uppercase font-bold text-gray-400 mb-0.5">Filtered Output (Game Chat Display)</span>
                      <div className="bg-neutral-900 text-neutral-100 rounded-lg p-3 font-mono text-sm shadow-inner break-words">
                        {evaluation.filteredText}
                      </div>
                    </div>

                    {evaluation.matchedTerms.length > 0 && (
                      <div>
                        <span className="block text-[10px] uppercase font-bold text-gray-400 mb-1">Detected Bypass & Toxicity Nodes</span>
                        <div className="flex flex-wrap gap-1.5">
                          {evaluation.matchedTerms.map((term: string) => (
                            <span key={term} className="bg-red-50 text-red-700 border border-red-100 text-[10px] font-bold px-2.5 py-0.5 rounded-md">
                              {term} ({modelState.weights[term]?.toFixed(2) || "heuristic"})
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Correction / Reinforcement Loop Controls */}
                    <div className="pt-2 border-t border-gray-100">
                      <span className="block text-xs font-bold text-gray-600 mb-2">Did the AI make a mistake? Train it here:</span>
                      <div className="flex gap-2.5">
                        <button
                          onClick={() => handleCorrection(true)}
                          className="flex-1 py-2 border-2 border-red-500 hover:bg-red-50 text-red-600 text-xs font-bold uppercase rounded-lg transition cursor-pointer flex items-center justify-center gap-1.5"
                        >
                          <XCircle size={14} />
                          Force Flag
                        </button>
                        <button
                          onClick={() => handleCorrection(false)}
                          className="flex-1 py-2 border-2 border-emerald-500 hover:bg-emerald-50 text-emerald-600 text-xs font-bold uppercase rounded-lg transition cursor-pointer flex items-center justify-center gap-1.5"
                        >
                          <CheckCircle size={14} />
                          Force Clean
                        </button>
                      </div>
                      <span className="text-[10px] text-gray-400 block mt-1.5 text-center">
                        Correcting the AI runs a **supervised feedback step** backpropagating corrections to fine-tune vocabulary nodes.
                      </span>
                    </div>

                  </div>
                )}
              </div>

            </div>

            {/* Right Instructions / Architecture Info */}
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-xs space-y-4">
                <h3 className="font-extrabold text-sm text-gray-800 flex items-center gap-1.5 pb-2 border-b border-gray-100">
                  <Cpu className="text-purple-600 w-4.5 h-4.5" />
                  Reinforcement Learning (RL) Mechanics
                </h3>
                <div className="space-y-3.5 text-xs text-gray-600 leading-relaxed">
                  <div className="flex gap-2.5">
                    <span className="text-lg mt-0.5">🧠</span>
                    <div>
                      <strong className="text-gray-800 block mb-0.5">Features &amp; Activation</strong>
                      <p>Features are mapped to words and bypass phrases inside the vocabulary table. When a player types, matched terms trigger weight parameters summing into an aggregate toxicity classification value.</p>
                    </div>
                  </div>
                  <div className="flex gap-2.5">
                    <span className="text-lg mt-0.5">📉</span>
                    <div>
                      <strong className="text-gray-800 block mb-0.5">Feedback Update Rules</strong>
                      <p>If you override the prediction, the learning model runs an instant parameter correction:</p>
                      <ul className="list-disc list-inside mt-1 text-gray-500 space-y-1">
                        <li><strong>False Positive</strong>: Decreases triggered vocabulary weights and rises the threshold τ.</li>
                        <li><strong>False Negative</strong>: Increases triggered word weights, binds new terms to the dictionary, and lowers τ.</li>
                      </ul>
                    </div>
                  </div>
                  <div className="flex gap-2.5">
                    <span className="text-lg mt-0.5">🌟</span>
                    <div>
                      <strong className="text-gray-800 block mb-0.5">Dynamic Spacing &amp; Leet Bypass</strong>
                      <p>The pre-trained local model uses structural heuristics to auto-detect character separation (e.g. `b a d`) and common leetspeak substitutions (e.g. `@`, `$`, `!`) to reinforce and protect chats even without direct spelling matches.</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

          </div>
        )}

        {/* -------------------- TAB 3: WEIGHTS TABLE -------------------- */}
        {activeTab === "weights" && (
          <div className="bg-white border border-gray-200 rounded-xl shadow-md overflow-hidden">
            
            {/* Search / Filter block */}
            <div className="p-4 bg-gray-50 border-b border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="relative w-full sm:w-80">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search toxicity weight terms..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-xs bg-white text-gray-900 focus:outline-none focus:border-emerald-500"
                />
              </div>
              <span className="text-xs font-bold text-gray-500 font-mono shrink-0">
                Found {filteredWeights.length} of {Object.keys(modelState.weights).length} registered nodes
              </span>
            </div>

            {/* Weights listing */}
            <div className="divide-y divide-gray-100 max-h-[500px] overflow-y-auto custom-scrollbar">
              {filteredWeights.length === 0 ? (
                <div className="text-center py-12 text-gray-400 italic">
                  No matching registered terms found.
                </div>
              ) : (
                filteredWeights.map(([term, val]) => (
                  <div key={term} className="p-4 flex items-center justify-between gap-6 hover:bg-gray-50/50 transition">
                    <div className="space-y-0.5">
                      <span className="font-mono text-sm font-bold text-gray-900">{term}</span>
                      <span className="block text-[10px] text-gray-400 uppercase font-sans">
                        {val >= 2.5 ? "Severe Inappropriate Node" : val >= 1.5 ? "Moderate Penalty Node" : "Low Severity / Warning Node"}
                      </span>
                    </div>

                    <div className="flex items-center gap-4 w-48 sm:w-64">
                      {/* Custom bar */}
                      <div className="flex-1 bg-gray-100 h-2.5 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${
                            val >= 2.5 ? "bg-red-600" : val >= 1.5 ? "bg-amber-500" : "bg-blue-500"
                          }`}
                          style={{ width: `${Math.min(100, (val / 3.0) * 100)}%` }}
                        />
                      </div>
                      <span className="font-mono text-xs font-bold text-gray-700 w-10 text-right">
                        {val.toFixed(2)}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
