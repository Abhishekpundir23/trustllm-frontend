"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/api";
import { 
  ArrowLeft, Plus, Trash2, FileText, CheckCircle2, X, Play, Loader2, History, Scale, Eye, MessageSquare 
} from "lucide-react";
import { Run, RunDetail, PromptVersion } from "@/app/types";

interface TestCase {
  id: number;
  prompt: string;
  expected: string;
  task_type: string;
}

export default function ProjectDetails({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  
  // Tabs: 'tests' | 'prompts' | 'runs'
  const [activeTab, setActiveTab] = useState("tests");

  const [tests, setTests] = useState<TestCase[]>([]);
  const [runs, setRuns] = useState<Run[]>([]);
  const [prompts, setPrompts] = useState<PromptVersion[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Modals
  const [isTestModalOpen, setIsTestModalOpen] = useState(false);
  const [isRunModalOpen, setIsRunModalOpen] = useState(false);
  const [isCompareModalOpen, setIsCompareModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isPromptModalOpen, setIsPromptModalOpen] = useState(false); // NEW

  // Data States
  const [newPrompt, setNewPrompt] = useState("");
  const [newExpected, setNewExpected] = useState("");
  const [newTaskType, setNewTaskType] = useState("general");
  
  // Run State
  const [modelName, setModelName] = useState("GPT-4");
  const [selectedPromptId, setSelectedPromptId] = useState<string>(""); // NEW
  const [isRunning, setIsRunning] = useState(false);
  const [runResult, setRunResult] = useState<{correct: number, incorrect: number} | null>(null);

  // Prompt Form State
  const [promptName, setPromptName] = useState("");
  const [promptTemplate, setPromptTemplate] = useState("You are a helpful assistant.\n\nUser Question: {{prompt}}");

  // Analysis Data
  const [selectedRunIds, setSelectedRunIds] = useState<string[]>([]);
  const [comparisonData, setComparisonData] = useState<any>(null);
  const [viewRunDetails, setViewRunDetails] = useState<{run: Run, details: RunDetail[]} | null>(null);

  // --- Fetching ---
  const fetchData = async () => {
    try {
        const [t, r, p] = await Promise.all([
            api.get(`/projects/${id}/tests/`),
            api.get(`/projects/${id}/run/`),
            api.get(`/projects/${id}/prompts/`) // Fetch prompts
        ]);
        setTests(t.data);
        setRuns(r.data);
        setPrompts(p.data);
    } catch (err) { console.error(err); } 
    finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, [id]);

  // --- Handlers ---
  const handleAddTest = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post(`/projects/${id}/tests/`, { prompt: newPrompt, expected: newExpected, task_type: newTaskType });
      setNewPrompt(""); setNewExpected(""); setIsTestModalOpen(false); fetchData();
    } catch (err) { alert("Failed to add test"); }
  };

  const handleCreatePrompt = async (e: React.FormEvent) => {
      e.preventDefault();
      try {
          await api.post(`/projects/${id}/prompts/`, { name: promptName, template: promptTemplate });
          setPromptName(""); setPromptTemplate("You are a helpful assistant.\n\nUser Question: {{prompt}}"); 
          setIsPromptModalOpen(false); fetchData();
      } catch (err) { alert("Failed to create prompt"); }
  };

  const handleDeleteTest = async (testId: number) => {
    if(!confirm("Are you sure?")) return;
    try { await api.delete(`/projects/${id}/tests/${testId}`); fetchData(); } catch (err) { alert("Failed to delete"); }
  };

  const handleRunEvaluation = async () => {
    setIsRunning(true); setRunResult(null);
    try {
      const payload: any = { model_name: modelName };
      if (selectedPromptId) payload.prompt_version_id = selectedPromptId; // Send selected prompt

      const res = await api.post(`/projects/${id}/run/`, payload);
      setRunResult({ correct: res.data.correct, incorrect: res.data.incorrect });
      fetchData();
    } catch (err) { alert("Run failed"); setIsRunModalOpen(false); } 
    finally { setIsRunning(false); }
  };

  const handleCompare = async () => {
    if (selectedRunIds.length !== 2) return;
    try {
        const res = await api.get(`/projects/${id}/run/compare`, { params: { run_id_1: selectedRunIds[0], run_id_2: selectedRunIds[1] } });
        setComparisonData(res.data); setIsCompareModalOpen(true);
    } catch (err) { alert("Comparison failed"); }
  };

  const handleViewDetails = async (run: Run) => {
      try {
          const res = await api.get(`/projects/${id}/run/${run.run_id}/details`);
          setViewRunDetails({ run, details: res.data });
          setIsViewModalOpen(true);
      } catch (err) { alert("Failed to load details"); }
  };

  const toggleRunSelection = (runId: string) => {
    if (selectedRunIds.includes(runId)) setSelectedRunIds(selectedRunIds.filter(id => id !== runId));
    else if (selectedRunIds.length < 2) setSelectedRunIds([...selectedRunIds, runId]);
  };

  if (loading) return <div className="p-8 text-white">Loading...</div>;

  return (
    <div className="min-h-screen bg-gray-900 p-8 text-white">
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={() => router.push("/dashboard")} className="rounded-full bg-gray-800 p-2 hover:bg-gray-700"><ArrowLeft className="h-6 w-6" /></button>
          <div><h1 className="text-3xl font-bold">Project Details</h1><p className="text-gray-400">ID: #{id}</p></div>
        </div>
        <button onClick={() => setIsRunModalOpen(true)} className="flex items-center gap-2 rounded bg-green-600 px-4 py-2 font-bold hover:bg-green-500 disabled:opacity-50" disabled={tests.length === 0}>
            <Play className="h-5 w-5" /> New Run
        </button>
      </div>

      {/* Tabs */}
      <div className="mb-6 flex gap-6 border-b border-gray-700">
        <button onClick={() => setActiveTab("tests")} className={`pb-3 font-medium ${activeTab === "tests" ? "border-b-2 border-blue-500 text-blue-400" : "text-gray-400"}`}>Test Cases ({tests.length})</button>
        <button onClick={() => setActiveTab("prompts")} className={`pb-3 font-medium ${activeTab === "prompts" ? "border-b-2 border-blue-500 text-blue-400" : "text-gray-400"}`}>Prompts ({prompts.length})</button>
        <button onClick={() => setActiveTab("runs")} className={`pb-3 font-medium ${activeTab === "runs" ? "border-b-2 border-blue-500 text-blue-400" : "text-gray-400"}`}>Run History ({runs.length})</button>
      </div>

      {/* --- TEST CASES TAB --- */}
      {activeTab === "tests" && (
        <div>
          <button onClick={() => setIsTestModalOpen(true)} className="mb-4 flex items-center gap-2 rounded bg-blue-600 px-4 py-2 font-bold hover:bg-blue-500"><Plus className="h-5 w-5" /> Add Test Case</button>
          <div className="grid gap-4">
            {tests.map((test) => (
                <div key={test.id} className="relative rounded-xl bg-gray-800 p-6 shadow-md border border-gray-700">
                  <button onClick={() => handleDeleteTest(test.id)} className="absolute right-4 top-4 text-gray-500 hover:text-red-500"><Trash2 className="h-5 w-5" /></button>
                  <div className="mb-2"><span className="rounded bg-blue-500/10 px-2 py-0.5 text-xs text-blue-400 border border-blue-500/20">{test.task_type}</span></div>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div><label className="text-xs font-semibold text-gray-500 uppercase">Prompt</label><p className="mt-1 text-gray-200">{test.prompt}</p></div>
                    <div><label className="text-xs font-semibold text-gray-500 uppercase">Expected</label><p className="mt-1 text-gray-300">{test.expected || "-"}</p></div>
                  </div>
                </div>
            ))}
          </div>
        </div>
      )}

      {/* --- PROMPTS TAB (NEW) --- */}
      {activeTab === "prompts" && (
          <div>
              <button onClick={() => setIsPromptModalOpen(true)} className="mb-4 flex items-center gap-2 rounded bg-blue-600 px-4 py-2 font-bold hover:bg-blue-500"><Plus className="h-5 w-5" /> Create Prompt Template</button>
              <div className="grid gap-4 md:grid-cols-2">
                  {prompts.length === 0 ? (
                      <div className="col-span-2 rounded-xl bg-gray-800 p-12 text-center text-gray-400 border border-gray-700">
                          <MessageSquare className="mx-auto mb-4 h-12 w-12 opacity-50" />
                          <h3 className="text-lg font-medium">No prompt templates</h3>
                          <p>Create a template to test different system instructions.</p>
                      </div>
                  ) : (
                      prompts.map((prompt) => (
                          <div key={prompt.id} className="rounded-xl bg-gray-800 p-6 shadow-md border border-gray-700">
                              <h3 className="font-bold text-white text-lg mb-2">{prompt.name}</h3>
                              <div className="rounded bg-black/30 p-3 border border-gray-600 font-mono text-sm text-gray-300 whitespace-pre-wrap">
                                  {prompt.template}
                              </div>
                              <p className="mt-2 text-xs text-gray-500">Created: {new Date(prompt.created_at).toLocaleDateString()}</p>
                          </div>
                      ))
                  )}
              </div>
          </div>
      )}

      {/* --- RUN HISTORY TAB --- */}
      {activeTab === "runs" && (
        <div>
           <div className="mb-4 flex items-center justify-between">
             <p className="text-gray-400">Select 2 runs to compare, or click Eye icon to view details.</p>
             <button onClick={handleCompare} disabled={selectedRunIds.length !== 2} className="flex items-center gap-2 rounded bg-purple-600 px-4 py-2 font-bold hover:bg-purple-500 disabled:opacity-50"><Scale className="h-5 w-5" /> Compare</button>
           </div>
           <div className="space-y-3">
             {runs.map((run) => (
                <div key={run.run_id} className={`flex items-center justify-between rounded-xl p-4 border transition ${selectedRunIds.includes(run.run_id) ? "bg-purple-900/20 border-purple-500" : "bg-gray-800 border-gray-700"}`}>
                    <div onClick={() => toggleRunSelection(run.run_id)} className="flex flex-1 cursor-pointer items-center gap-4">
                        <div className={`h-4 w-4 rounded-full border ${selectedRunIds.includes(run.run_id) ? "bg-purple-500 border-purple-500" : "border-gray-500"}`}></div>
                        <div><h3 className="font-bold text-white">{run.model_name}</h3><p className="text-xs text-gray-400">ID: {run.run_id.slice(0, 8)}...</p></div>
                    </div>
                    <div className="flex items-center gap-6">
                        <div className="text-right">
                           <p className="text-xs text-gray-500 uppercase">Pass Rate</p>
                           <p className="font-mono font-bold text-green-400">{run.total_tests > 0 ? Math.round((run.correct / run.total_tests) * 100) : 0}%</p>
                        </div>
                        <button onClick={(e) => { e.stopPropagation(); handleViewDetails(run); }} className="rounded p-2 text-gray-400 hover:bg-gray-700 hover:text-white"><Eye className="h-5 w-5" /></button>
                    </div>
                </div>
             ))}
           </div>
        </div>
      )}

      {/* --- MODALS --- */}
      {/* 1. Add Test */}
      {isTestModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
           <div className="w-full max-w-lg rounded-xl bg-gray-800 p-6 border border-gray-700">
              <h2 className="mb-4 text-xl font-bold">Add Test Case</h2>
              <form onSubmit={handleAddTest} className="space-y-4">
                  <textarea value={newPrompt} onChange={e=>setNewPrompt(e.target.value)} className="w-full rounded bg-gray-700 p-3 outline-none" placeholder="Prompt..." required />
                  <div className="grid grid-cols-2 gap-4">
                      <select value={newTaskType} onChange={e=>setNewTaskType(e.target.value)} className="rounded bg-gray-700 p-3"><option value="general">General</option><option value="math">Math</option><option value="code">Coding</option></select>
                      <input value={newExpected} onChange={e=>setNewExpected(e.target.value)} className="rounded bg-gray-700 p-3" placeholder="Expected..." />
                  </div>
                  <div className="flex justify-end gap-2 pt-4">
                      <button type="button" onClick={() => setIsTestModalOpen(false)} className="px-4 py-2 text-gray-300">Cancel</button>
                      <button type="submit" className="rounded bg-blue-600 px-6 py-2 font-bold hover:bg-blue-500">Save</button>
                  </div>
              </form>
           </div>
        </div>
      )}

      {/* 2. Create Prompt (NEW) */}
      {isPromptModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
           <div className="w-full max-w-lg rounded-xl bg-gray-800 p-6 border border-gray-700">
              <h2 className="mb-4 text-xl font-bold">Create Prompt Template</h2>
              <form onSubmit={handleCreatePrompt} className="space-y-4">
                  <div>
                      <label className="mb-1 block text-sm text-gray-400">Template Name</label>
                      <input value={promptName} onChange={e=>setPromptName(e.target.value)} className="w-full rounded bg-gray-700 p-3 outline-none" placeholder="e.g. Math Tutor Persona" required />
                  </div>
                  <div>
                      <label className="mb-1 block text-sm text-gray-400">System Instruction</label>
                      <textarea value={promptTemplate} onChange={e=>setPromptTemplate(e.target.value)} className="w-full h-32 rounded bg-gray-700 p-3 outline-none font-mono text-sm" required />
                      <p className="mt-1 text-xs text-gray-500">Use <span className="text-yellow-400">{"{{prompt}}"}</span> where the user's test question should go.</p>
                  </div>
                  <div className="flex justify-end gap-2 pt-4">
                      <button type="button" onClick={() => setIsPromptModalOpen(false)} className="px-4 py-2 text-gray-300">Cancel</button>
                      <button type="submit" className="rounded bg-blue-600 px-6 py-2 font-bold hover:bg-blue-500">Create</button>
                  </div>
              </form>
           </div>
        </div>
      )}

      {/* 3. Run Eval (UPDATED) */}
      {isRunModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
           <div className="w-full max-w-md rounded-xl bg-gray-800 p-6 border border-gray-700">
              {!runResult ? (
                  <>
                    <h2 className="mb-6 text-xl font-bold text-center">Run Evaluation</h2>
                    
                    {/* Model Select */}
                    <label className="mb-1 block text-sm text-gray-400">Model</label>
                    <select value={modelName} onChange={e=>setModelName(e.target.value)} className="mb-4 w-full rounded bg-gray-700 p-3 outline-none"><option>GPT-4</option><option>GPT-3.5</option><option>Claude-3</option></select>
                    
                    {/* Prompt Select (NEW) */}
                    <label className="mb-1 block text-sm text-gray-400">Prompt Template</label>
                    <select value={selectedPromptId} onChange={e=>setSelectedPromptId(e.target.value)} className="mb-6 w-full rounded bg-gray-700 p-3 outline-none">
                        <option value="">Default (Raw Input)</option>
                        {prompts.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                    </select>

                    <div className="flex justify-end gap-2">
                        <button onClick={() => setIsRunModalOpen(false)} disabled={isRunning} className="px-4 py-2 text-gray-300">Cancel</button>
                        <button onClick={handleRunEvaluation} disabled={isRunning} className="rounded bg-green-600 px-6 py-2 font-bold hover:bg-green-500">{isRunning ? "Running..." : "Start Run"}</button>
                    </div>
                  </>
              ) : (
                  <div className="text-center">
                    <CheckCircle2 className="mx-auto mb-4 h-16 w-16 text-green-500" />
                    <h2 className="text-2xl font-bold">Run Complete</h2>
                    <p className="mt-2 text-gray-400">Correct: {runResult.correct} | Incorrect: {runResult.incorrect}</p>
                    <button onClick={()=>{setIsRunModalOpen(false); setRunResult(null);}} className="mt-6 w-full rounded bg-gray-700 py-2 font-bold">Close</button>
                  </div>
              )}
           </div>
        </div>
      )}

      {/* 4. Compare Modal */}
      {isCompareModalOpen && comparisonData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
           <div className="w-full max-w-4xl h-[80vh] flex flex-col rounded-xl bg-gray-900 border border-gray-700 overflow-hidden">
               <div className="flex items-center justify-between bg-gray-800 p-4"><h2 className="text-xl font-bold">Comparison</h2><button onClick={() => setIsCompareModalOpen(false)}><X className="h-6 w-6 text-gray-400 hover:text-white"/></button></div>
               <div className="flex-1 overflow-y-auto p-4 space-y-4">
                   {comparisonData.comparisons.map((row: any) => (
                       <div key={row.test_id} className="grid grid-cols-3 gap-4 border-b border-gray-800 pb-4">
                           <div className="text-sm text-gray-300">{row.prompt}</div>
                           <div className={`rounded p-3 text-sm ${row.run1_score === 2 ? 'bg-green-900/20 text-green-300' : 'bg-red-900/20 text-red-300'}`}><div className="font-bold mb-1">{row.run1_score === 2 ? "PASS" : "FAIL"}</div>{row.run1_output}</div>
                           <div className={`rounded p-3 text-sm ${row.run2_score === 2 ? 'bg-green-900/20 text-green-300' : 'bg-red-900/20 text-red-300'}`}><div className="font-bold mb-1">{row.run2_score === 2 ? "PASS" : "FAIL"}</div>{row.run2_output}</div>
                       </div>
                   ))}
               </div>
           </div>
        </div>
      )}

      {/* 5. View Details Modal */}
      {isViewModalOpen && viewRunDetails && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
           <div className="w-full max-w-3xl h-[80vh] flex flex-col rounded-xl bg-gray-900 border border-gray-700 overflow-hidden">
               <div className="flex items-center justify-between bg-gray-800 p-4">
                   <div><h2 className="text-xl font-bold">Run Details</h2></div>
                   <button onClick={() => setIsViewModalOpen(false)}><X className="h-6 w-6 text-gray-400 hover:text-white"/></button>
               </div>
               <div className="flex-1 overflow-y-auto p-6 space-y-4">
                   {viewRunDetails.details.map((detail) => (
                       <div key={detail.test_id} className="rounded-lg bg-gray-800 p-4 border border-gray-700">
                           <div className="mb-3 flex items-start justify-between">
                               <p className="font-semibold text-white w-2/3">{detail.prompt}</p>
                               <span className={`px-2 py-1 rounded text-xs font-bold ${detail.score === 2 ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>{detail.score === 2 ? "PASSED" : "FAILED"}</span>
                           </div>
                           <div className="grid md:grid-cols-2 gap-4 text-sm">
                               <div className="rounded bg-black/30 p-3"><p className="text-xs text-gray-500 uppercase mb-1">Expected</p><p className="text-gray-300">{detail.expected}</p></div>
                               <div className={`rounded p-3 ${detail.score === 2 ? 'bg-green-900/10' : 'bg-red-900/10'}`}><p className="text-xs text-gray-500 uppercase mb-1">AI Output</p><p className={detail.score === 2 ? "text-green-200" : "text-red-200"}>{detail.output}</p></div>
                           </div>
                       </div>
                   ))}
               </div>
           </div>
        </div>
      )}
    </div>
  );
}