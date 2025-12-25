"use client";

import { useState, useEffect } from "react";
import { ChevronDown, FolderKanban, Plus, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface Project {
  id: string;
  name: string;
  description: string | null;
  status: string;
  _count: { conversations: number };
}

interface ProjectSelectorProps {
  selectedProjectId: string | null;
  onProjectChange: (projectId: string | null) => void;
  className?: string;
}

export function ProjectSelector({
  selectedProjectId,
  onProjectChange,
  className,
}: ProjectSelectorProps) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newProjectName, setNewProjectName] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  // Fetch projects on mount
  useEffect(() => {
    fetchProjects();
  }, []);

  async function fetchProjects() {
    try {
      const res = await fetch("/api/projects");
      const data = await res.json();
      setProjects(data.projects || []);
    } catch (error) {
      console.error("Failed to fetch projects:", error);
    } finally {
      setIsLoading(false);
    }
  }

  async function createProject() {
    if (!newProjectName.trim()) return;
    setIsCreating(true);

    try {
      const res = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newProjectName.trim() }),
      });

      if (res.ok) {
        const data = await res.json();
        setProjects((prev) => [data.project, ...prev]);
        onProjectChange(data.project.id);
        setNewProjectName("");
        setShowCreateForm(false);
      }
    } catch (error) {
      console.error("Failed to create project:", error);
    } finally {
      setIsCreating(false);
    }
  }

  const selectedProject = projects.find((p) => p.id === selectedProjectId);

  return (
    <div className={cn("relative", className)}>
      {/* Selector Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "w-full flex items-center gap-2 px-3 py-2 rounded-lg",
          "bg-zinc-800/50 border border-zinc-700",
          "hover:bg-zinc-800 transition-colors",
          "text-left"
        )}
      >
        <FolderKanban className="h-4 w-4 text-purple-400" />
        <span className="flex-1 truncate text-sm">
          {isLoading ? (
            <span className="text-zinc-500">Cargando...</span>
          ) : selectedProject ? (
            selectedProject.name
          ) : (
            <span className="text-zinc-500">Sin proyecto seleccionado</span>
          )}
        </span>
        <ChevronDown
          className={cn(
            "h-4 w-4 text-zinc-500 transition-transform",
            isOpen && "rotate-180"
          )}
        />
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-1 z-50 bg-zinc-900 border border-zinc-700 rounded-lg shadow-xl overflow-hidden">
          {/* No Project Option */}
          <button
            onClick={() => {
              onProjectChange(null);
              setIsOpen(false);
            }}
            className={cn(
              "w-full px-3 py-2 text-left text-sm hover:bg-zinc-800 transition-colors",
              !selectedProjectId && "bg-purple-500/20 text-purple-300"
            )}
          >
            <span className="text-zinc-500">Sin proyecto (General)</span>
          </button>

          {/* Project List */}
          {projects.map((project) => (
            <button
              key={project.id}
              onClick={() => {
                onProjectChange(project.id);
                setIsOpen(false);
              }}
              className={cn(
                "w-full px-3 py-2 text-left hover:bg-zinc-800 transition-colors",
                selectedProjectId === project.id &&
                  "bg-purple-500/20 text-purple-300"
              )}
            >
              <div className="text-sm font-medium">{project.name}</div>
              <div className="text-xs text-zinc-500">
                {project._count?.conversations ?? 0} conversaciones
              </div>
            </button>
          ))}

          {/* Create New */}
          {showCreateForm ? (
            <div className="p-2 border-t border-zinc-700">
              <input
                type="text"
                value={newProjectName}
                onChange={(e) => setNewProjectName(e.target.value)}
                placeholder="Nombre del proyecto..."
                className="w-full px-2 py-1.5 text-sm bg-zinc-800 border border-zinc-700 rounded focus:outline-none focus:ring-1 focus:ring-purple-500"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === "Enter") createProject();
                  if (e.key === "Escape") setShowCreateForm(false);
                }}
              />
              <div className="flex gap-1 mt-2">
                <button
                  onClick={createProject}
                  disabled={isCreating || !newProjectName.trim()}
                  className="flex-1 px-2 py-1 text-xs bg-purple-600 hover:bg-purple-500 rounded disabled:opacity-50"
                >
                  {isCreating ? (
                    <Loader2 className="h-3 w-3 animate-spin mx-auto" />
                  ) : (
                    "Crear"
                  )}
                </button>
                <button
                  onClick={() => setShowCreateForm(false)}
                  className="px-2 py-1 text-xs bg-zinc-700 hover:bg-zinc-600 rounded"
                >
                  Cancelar
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setShowCreateForm(true)}
              className="w-full px-3 py-2 text-left text-sm text-purple-400 hover:bg-zinc-800 border-t border-zinc-700 flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              Nuevo Proyecto
            </button>
          )}
        </div>
      )}
    </div>
  );
}
