import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  ShieldCheck,
  ShieldAlert,
  Award,
  RefreshCw,
  Send,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  HelpCircle,
  TrendingUp,
  RotateCcw,
  BookOpen,
  Volume2
} from 'lucide-react';
import { ObjectionScenarioDefinition, ObjectionDrillResponse } from '../types';
import { fetchObjectionScenarios, runObjectionDrill } from '../services/api';

export const ObjectionDrillPractice: React.FC = () => {
  const [scenarios, setScenarios] = useState<ObjectionScenarioDefinition[]>([]);
  const [selectedScenarioId, setSelectedScenarioId] = useState<string>('SCENARIO_AFFORDABILITY');
  const [repResponse, setRepResponse] = useState<string>('');
  const [evaluating, setEvaluating] = useState<boolean>(false);
  const [result, setResult] = useState<ObjectionDrillResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loadingScenarios, setLoadingScenarios] = useState<boolean>(true);

  useEffect(() => {
    loadScenarios();
  }, []);

  const loadScenarios = async () => {
    setLoadingScenarios(true);
    try {
      const res = await fetchObjectionScenarios();
      if (res.success && res.data) {
        setScenarios(res.data);
        if (res.data.length > 0) {
          setSelectedScenarioId(res.data[0].id);
        }
      }
    } catch (err) {
      console.error('Failed to load objection scenarios:', err);
    } finally {
      setLoadingScenarios(false);
    }
  };

  const activeScenario = scenarios.find((s) => s.id === selectedScenarioId) || scenarios[0];

  const handleSelectScenario = (id: string) => {
    setSelectedScenarioId(id);
    setRepResponse('');
    setResult(null);
    setError(null);
  };

  const handleRunEvaluation = async () => {
    if (!repResponse.trim()) {
      setError('Please type or dictate your verbal response before evaluating.');
      return;
    }
    setEvaluating(true);
    setError(null);
    try {
      const res = await runObjectionDrill(selectedScenarioId, repResponse);
      if (res.success && res.data) {
        setResult(res.data);
      } else {
        setError(res.error || 'Evaluation failed.');
      }
    } catch (err: any) {
      setError(err.message || 'Evaluation request error.');
    } finally {
      setEvaluating(false);
    }
  };

  const handleQuickInsertFact = (fact: string) => {
    setRepResponse((prev) => (prev ? `${prev} ${fact}` : fact));
  };

  return (
    <div id="objection-drill-container" className="space-y-6">
      {/* Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-5 rounded-2xl border border-slate-800 shadow-md flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded bg-indigo-500/30 text-indigo-200 border border-indigo-400/30">
              Interactive Field Simulator
            </span>
            <span className="text-[10px] font-bold text-emerald-300 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-500/30 flex items-center gap-1">
              <ShieldCheck className="w-3 h-3" />
              Locked Product Truth
            </span>
          </div>
          <h2 className="text-xl font-bold tracking-tight">HCP Objection Practice & Drill Arena</h2>
          <p className="text-xs text-slate-300 mt-0.5">
            Test your clinical and commercial objection handling in real time with AI scoring & zero-tolerance compliance checks.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              setRepResponse('');
              setResult(null);
            }}
            className="px-3.5 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Drill</span>
          </button>
        </div>
      </div>

      {loadingScenarios ? (
        <div className="py-16 text-center text-slate-500">
          <RefreshCw className="w-6 h-6 animate-spin mx-auto text-indigo-600 mb-2" />
          <p className="text-xs font-medium">Loading objection scenarios...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          {/* Left Column (4 cols): Scenario Selector List */}
          <div className="lg:col-span-4 space-y-3">
            <div className="flex items-center justify-between px-1">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Drill Scenarios ({scenarios.length})
              </span>
              <span className="text-[10px] font-semibold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">
                Real Field Objections
              </span>
            </div>

            <div className="space-y-2 max-h-[580px] overflow-y-auto pr-1">
              {scenarios.map((sc) => {
                const isSelected = sc.id === selectedScenarioId;
                return (
                  <button
                    key={sc.id}
                    onClick={() => handleSelectScenario(sc.id)}
                    className={`w-full text-left p-3.5 rounded-xl border transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-indigo-50 border-indigo-400 shadow-xs'
                        : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50/70'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-1 mb-1">
                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                        sc.category === 'Commercial & Price'
                          ? 'bg-amber-100 text-amber-800'
                          : sc.category === 'Competitor Contrast'
                          ? 'bg-purple-100 text-purple-800'
                          : 'bg-sky-100 text-sky-800'
                      }`}>
                        {sc.category}
                      </span>
                      <span className="text-[10px] text-slate-400 font-medium">
                        {sc.difficulty}
                      </span>
                    </div>
                    <h4 className={`text-xs font-bold leading-tight ${isSelected ? 'text-indigo-950' : 'text-slate-800'}`}>
                      {sc.title}
                    </h4>
                    <p className="text-[11px] text-slate-500 mt-1 line-clamp-2">
                      "{sc.doctorStatement}"
                    </p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Right Column (8 cols): Interactive Simulator & Evaluation */}
          <div className="lg:col-span-8 space-y-5">
            {activeScenario && (
              <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4">
                {/* Scenario Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600">
                      Doctor Persona: {activeScenario.doctorPersona}
                    </span>
                    <h3 className="text-base font-bold text-slate-900 mt-0.5">
                      {activeScenario.title}
                    </h3>
                  </div>
                  <span className="self-start sm:self-center text-xs font-semibold px-2.5 py-1 bg-slate-100 text-slate-700 rounded-lg">
                    {activeScenario.category}
                  </span>
                </div>

                {/* Doctor's Objection Bubble */}
                <div className="p-4 bg-amber-50/70 border border-amber-200 rounded-xl space-y-2">
                  <div className="flex items-center gap-2 text-amber-800 font-bold text-xs">
                    <Volume2 className="w-4 h-4 text-amber-600" />
                    <span>The Doctor Challenges:</span>
                  </div>
                  <p className="text-sm font-semibold text-amber-950 leading-relaxed italic">
                    "{activeScenario.doctorStatement}"
                  </p>
                  {activeScenario.safetyTrapWarning && (
                    <div className="mt-2 text-[11px] text-red-700 bg-red-50/80 p-2 rounded border border-red-200 flex items-start gap-1.5">
                      <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5 text-red-500" />
                      <span><strong>Compliance Warning:</strong> {activeScenario.safetyTrapWarning}</span>
                    </div>
                  )}
                </div>

                {/* Rep Response Input */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-700">
                      Your Spoken / Field Response:
                    </label>
                    <span className="text-[11px] text-slate-400">
                      {repResponse.length} chars
                    </span>
                  </div>

                  <textarea
                    id="rep-objection-response-input"
                    rows={4}
                    value={repResponse}
                    onChange={(e) => setRepResponse(e.target.value)}
                    placeholder="Type what you would say to address the clinician's objection while adhering strictly to verified specifications (8.66% MARD, 15 days, IP68, authorized pricing)..."
                    className="w-full p-3.5 text-xs text-slate-800 bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:border-indigo-500 focus:bg-white transition-colors"
                  />

                  {/* Quick Inject Shortcuts */}
                  <div className="flex flex-wrap items-center gap-1.5 pt-1">
                    <span className="text-[10px] text-slate-400 font-medium">Quick-Insert Truth:</span>
                    <button
                      onClick={() => handleQuickInsertFact('EvoCheck provides 15 days continuous wear with verified 8.66% MARD.')}
                      className="text-[10px] px-2 py-0.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded font-medium transition-colors"
                    >
                      + 15-day 8.66% MARD
                    </button>
                    <button
                      onClick={() => handleQuickInsertFact('Public online price is PKR 13,600 on MyPharmEvo with no unauthorized discounts.')}
                      className="text-[10px] px-2 py-0.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded font-medium transition-colors"
                    >
                      + PKR 13,600 Price
                    </button>
                    <button
                      onClick={() => handleQuickInsertFact('Certified IP68 water resistance ensures continuous protection during daily hygiene.')}
                      className="text-[10px] px-2 py-0.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded font-medium transition-colors"
                    >
                      + IP68 Waterproof
                    </button>
                  </div>
                </div>

                {error && (
                  <div className="p-3 bg-red-50 text-red-700 text-xs rounded-xl border border-red-200">
                    {error}
                  </div>
                )}

                {/* Submit Evaluation CTA */}
                <div className="flex items-center justify-end gap-3 pt-2">
                  <button
                    id="evaluate-objection-btn"
                    onClick={handleRunEvaluation}
                    disabled={evaluating}
                    className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm flex items-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    {evaluating ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>Evaluating Response...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4" />
                        <span>Score & Evaluate Response</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}

            {/* Evaluation Results Card */}
            {result && (
              <div
                id="drill-evaluation-result"
                className={`p-5 rounded-2xl border transition-all space-y-5 animate-in fade-in zoom-in-95 duration-200 ${
                  result.isCompliant
                    ? 'bg-white border-emerald-200 shadow-sm'
                    : 'bg-white border-red-300 shadow-sm'
                }`}
              >
                {/* Result Header & Score */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded border ${
                        result.isCompliant
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : 'bg-red-50 text-red-700 border-red-200'
                      }`}>
                        {result.isCompliant ? 'COMPLIANT PASS' : 'COMPLIANCE VIOLATION DETECTED'}
                      </span>
                      <span className="text-xs text-slate-500">
                        {new Date(result.evaluatedAt).toLocaleTimeString()}
                      </span>
                    </div>
                    <h3 className="text-lg font-bold text-slate-900 mt-1">
                      Drill Performance Assessment
                    </h3>
                  </div>

                  {/* Big Circular/Pill Score */}
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <span className="text-xs font-bold text-slate-500 uppercase block">Overall Score</span>
                      <span className="text-[11px] text-slate-400">
                        Accuracy: {result.accuracyScore}% • Persuasion: {result.persuasivenessScore}%
                      </span>
                    </div>
                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center font-black text-xl border ${
                      result.overallScore >= 80
                        ? 'bg-emerald-500 text-white border-emerald-600'
                        : result.overallScore >= 60
                        ? 'bg-amber-500 text-white border-amber-600'
                        : 'bg-red-500 text-white border-red-600'
                    }`}>
                      {result.overallScore}
                    </div>
                  </div>
                </div>

                {/* Safety Flags Warning if any */}
                {result.safetyFlags && result.safetyFlags.length > 0 && (
                  <div className="p-4 bg-red-50 border border-red-300 rounded-xl space-y-2">
                    <div className="flex items-center gap-2 text-red-800 font-bold text-xs">
                      <ShieldAlert className="w-4 h-4 text-red-600" />
                      <span>Zero-Tolerance Compliance Flags:</span>
                    </div>
                    <ul className="space-y-1 text-xs text-red-900 font-medium">
                      {result.safetyFlags.map((flag, idx) => (
                        <li key={idx} className="flex items-start gap-1.5">
                          <XCircle className="w-3.5 h-3.5 text-red-600 shrink-0 mt-0.5" />
                          <span>{flag}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* 6 Dimension Breakdown */}
                <div className="space-y-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-600">
                    6-Dimension Competency Scorecard
                  </span>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                    {result.dimensions.map((dim, idx) => (
                      <div key={idx} className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs space-y-1">
                        <div className="flex items-center justify-between font-bold">
                          <span className="text-slate-700">{dim.name}</span>
                          <span className={`${dim.score >= 80 ? 'text-emerald-600' : dim.score >= 60 ? 'text-amber-600' : 'text-red-600'}`}>
                            {dim.score}%
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-500 leading-tight">
                          {dim.feedback}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Done Well vs Could Improve */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="p-3.5 bg-emerald-50/60 border border-emerald-200 rounded-xl space-y-2">
                    <div className="flex items-center gap-1.5 text-emerald-800 font-bold text-xs">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      <span>What You Did Well:</span>
                    </div>
                    <ul className="space-y-1 text-xs text-emerald-950">
                      {result.whatDoneWell.map((w, idx) => (
                        <li key={idx}>• {w}</li>
                      ))}
                    </ul>
                  </div>

                  <div className="p-3.5 bg-amber-50/60 border border-amber-200 rounded-xl space-y-2">
                    <div className="flex items-center gap-1.5 text-amber-800 font-bold text-xs">
                      <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                      <span>Coaching Improvements:</span>
                    </div>
                    <ul className="space-y-1 text-xs text-amber-950">
                      {result.whatCouldImprove.map((item, idx) => (
                        <li key={idx}>• {item}</li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* Grounded Gold Standard Response */}
                <div className="p-4 bg-indigo-50/70 border border-indigo-200 rounded-xl space-y-1.5">
                  <div className="flex items-center gap-1.5 text-indigo-900 font-bold text-xs">
                    <BookOpen className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Authorized Gold Standard Rebuttal:</span>
                  </div>
                  <p className="text-xs text-indigo-950 font-medium leading-relaxed italic">
                    "{result.groundedRecommendedResponse}"
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
