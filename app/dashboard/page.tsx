"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/api";
import { HealthMetrics, Project } from "@/app/types";
import { 
  Activity, 
  AlertTriangle, 
  CheckCircle, 
  TrendingDown, 
  Plus, 
  X, 
  FolderGit2 
} from "lucide-react";

export default function Dashboard() {
  const router = useRouter();
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<number | null>(null);
  const [metrics, setMetrics] = useState<HealthMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newProjectName, setNewProjectName] = useState("");
  const [newProjectDomain, setNewProjectDomain] = useState("general");
  const [creating, setCreating] = useState(false);

  // 1. Fetch Projects
  const fetchProjects = async () => {
    try {
      const res = await api.get("/projects/");
      setProjects(res.data);
      if (res.data.length > 0 && !selectedProjectId) {
        setSelectedProjectId(res.data[0].id);
      }
    } catch (err) {
      console.error("Failed to fetch projects", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  // 2. Fetch Health Metrics
  useEffect(() => {
    if (!selectedProjectId) return;
    const fetchHealth = async () => {
      try {
        const res = await api.post(`/projects/${selectedProjectId}/health`);
        setMetrics(res.data);
      } catch (err) {
        console.error("Failed to fetch health metrics", err);
        setMetrics(null);
      }
    };
    fetchHealth();
  }, [selectedProjectId]);

  // 3. Handle Create Project
  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    try {
      const res = await api.post("/projects/", {
        name: newProjectName,
        domain: newProjectDomain
      });
      // Refresh list and select new project
      await fetchProjects();
      setSelectedProjectId(res.data.id);
      setIsModalOpen(false);
      setNewProjectName("");
    } catch (err) {
      alert("Failed to create project");
    } finally {
      setCreating(false);
    }
  };

  if (loading) return <div className="p-8 text-white">Loading...</div>;

  return (
    <div className="min-h-screen bg-gray-900 p-8 text-white">
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <FolderGit2 className="h-8 w-8 text-blue-500" />
          <h1 className="text-3xl font-bold">TrustLLM</h1>
        </div>
        
        <div className="flex gap-4">
          <select
            className="rounded bg-gray-800 px-4 py-2 border border-gray-700 outline-none focus:border-blue-500"
            value={selectedProjectId || ""}
            onChange={(e) => setSelectedProjectId(Number(e.target.value))}
          >
            {projects.map((p) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>

          {/* NEW BUTTON: Manage Tests */}
          {selectedProjectId && (
            <button
              onClick={() => router.push(`/dashboard/project/${selectedProjectId}`)}
              className="flex items-center gap-2 rounded bg-gray-700 px-4 py-2 font-bold hover:bg-gray-600 border border-gray-600"
            >
              <FolderGit2 className="h-5 w-5" /> Manage Tests
            </button>
          )}

          <button 
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 rounded bg-blue-600 px-4 py-2 font-bold hover:bg-blue-500"
          >
            <Plus className="h-5 w-5" /> New Project
          </button>
        </div>
      </div>

      {metrics ? (
        <>
          {/* Stats Grid */}
          <div className="grid grid-cols-1 gap-6 md:grid-cols-4">
            <div className="rounded-xl bg-gray-800 p-6 shadow-lg border border-gray-700">
              <div className="flex items-center justify-between">
                <span className="text-gray-400">Pass Rate</span>
                <CheckCircle className="h-5 w-5 text-green-500" />
              </div>
              <div className="mt-4 text-3xl font-bold">{metrics.pass_rate}%</div>
            </div>

            <div className="rounded-xl bg-gray-800 p-6 shadow-lg border border-gray-700">
              <div className="flex items-center justify-between">
                <span className="text-gray-400">Drift</span>
                <Activity className="h-5 w-5 text-blue-500" />
              </div>
              <div className={`mt-4 text-3xl font-bold ${metrics.drift < 0 ? 'text-red-500' : 'text-green-500'}`}>
                {metrics.drift > 0 ? "+" : ""}{metrics.drift}%
              </div>
            </div>

            <div className="rounded-xl bg-gray-800 p-6 shadow-lg border border-gray-700">
              <div className="flex items-center justify-between">
                <span className="text-gray-400">Regression</span>
                <TrendingDown className="h-5 w-5 text-red-500" />
              </div>
              <div className="mt-4 text-3xl font-bold text-red-400">{metrics.regression_score}</div>
            </div>

            <div className="rounded-xl bg-gray-800 p-6 shadow-lg border border-gray-700">
              <div className="flex items-center justify-between">
                <span className="text-gray-400">Models</span>
                <Activity className="h-5 w-5 text-purple-500" />
              </div>
              <div className="mt-4 text-3xl font-bold">{metrics.models_compared}</div>
            </div>
          </div>

          {/* Worst Failing Tests */}
          <div className="mt-8 rounded-xl bg-gray-800 p-6 border border-gray-700">
            <h2 className="mb-4 text-xl font-semibold flex items-center gap-2">
              <AlertTriangle className="text-orange-500 h-5 w-5"/> 
              Top Failing Tests
            </h2>
            <div className="space-y-4">
              {metrics.worst_failing_tests.length === 0 ? (
                <p className="text-gray-500">No failing tests found or no runs yet.</p>
              ) : (
                metrics.worst_failing_tests.map((test) => (
                  <div key={test.test_id} className="flex items-center justify-between rounded bg-gray-900/50 p-4 border border-gray-700/50">
                    <div>
                      <p className="font-medium text-white">Test ID #{test.test_id}</p>
                      <p className="text-sm text-gray-400">{test.prompt}</p>
                    </div>
                    <div className="rounded bg-red-500/10 px-3 py-1 text-sm font-medium text-red-400 border border-red-500/20">
                      {test.failure_count} Failures
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </>
      ) : (
        <div className="flex h-64 flex-col items-center justify-center rounded-xl bg-gray-800 border border-gray-700 text-gray-400">
           <FolderGit2 className="h-12 w-12 mb-4 opacity-50" />
           <p>No projects found. Create one to get started!</p>
        </div>
      )}

      {/* Create Project Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-xl bg-gray-800 p-6 shadow-2xl border border-gray-700">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-xl font-bold">Create New Project</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-white">
                <X className="h-6 w-6" />
              </button>
            </div>
            
            <form onSubmit={handleCreateProject} className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-400">Project Name</label>
                <input
                  type="text"
                  value={newProjectName}
                  onChange={(e) => setNewProjectName(e.target.value)}
                  className="w-full rounded bg-gray-700 py-2 px-3 text-white outline-none focus:ring-2 focus:ring-blue-500 border border-gray-600"
                  placeholder="e.g. Chatbot Alpha"
                  required
                />
              </div>
              
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-400">Domain</label>
                <select
                   value={newProjectDomain}
                   onChange={(e) => setNewProjectDomain(e.target.value)}
                   className="w-full rounded bg-gray-700 py-2 px-3 text-white outline-none focus:ring-2 focus:ring-blue-500 border border-gray-600"
                >
                  <option value="general">General</option>
                  <option value="math">Math</option>
                  <option value="code">Coding</option>
                  <option value="medical">Medical</option>
                </select>
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="rounded px-4 py-2 text-gray-300 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="rounded bg-blue-600 px-6 py-2 font-bold text-white hover:bg-blue-500 disabled:opacity-50"
                >
                  {creating ? "Creating..." : "Create Project"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}