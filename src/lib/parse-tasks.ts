import { Task, TaskStatus } from "@/components/chat/TaskCard";

/**
 * Parsea el contenido del mensaje para detectar listas de tareas
 * 
 * Detecta patrones como:
 * - [ ] Tarea pendiente
 * - [x] Tarea completada
 * - 1. Tarea numerada
 * - • Tarea con bullet
 */
export function parseTasksFromContent(content: string): {
  tasks: Task[];
  cleanedContent: string;
} {
  // Handle null/undefined input
  if (!content) {
    return { tasks: [], cleanedContent: "" };
  }
  
  const tasks: Task[] = [];
  const lines = content.split("\n");
  const nonTaskLines: string[] = [];
  
  let taskIdCounter = 0;
  let inTaskBlock = false;
  let taskBlockStarted = false;

  // Patrones para detectar listas de tareas
  const taskPatterns = [
    // Markdown checkboxes: - [ ] or - [x]
    /^[\s]*[-*]\s*\[([ x])\]\s*(.+)$/i,
    // Numbered lists that look like tasks: 1. Crear archivo
    /^[\s]*(\d+)\.\s*(.+)$/,
  ];

  // Keywords que indican que una lista es de tareas
  const taskKeywords = [
    "crear", "implementar", "modificar", "añadir", "agregar", "configurar",
    "actualizar", "eliminar", "refactorizar", "integrar", "build", "setup",
    "create", "implement", "modify", "add", "update", "delete", "refactor"
  ];

  for (const line of lines) {
    let matched = false;

    for (const pattern of taskPatterns) {
      const match = line.match(pattern);
      if (match) {
        const taskText = match[2] || match[1];
        
        // Check if it contains task keywords
        const lowerText = taskText.toLowerCase();
        const isLikelyTask = taskKeywords.some(kw => lowerText.includes(kw));
        
        if (isLikelyTask || inTaskBlock) {
          taskBlockStarted = true;
          inTaskBlock = true;
          
          // Determine initial status from checkbox
          let status: TaskStatus = "pending";
          if (match[1]?.toLowerCase() === "x") {
            status = "accepted";
          }

          tasks.push({
            id: `task-${taskIdCounter++}`,
            title: taskText.trim(),
            status,
          });
          matched = true;
          break;
        }
      }
    }

    if (!matched) {
      // Si salimos de una secuencia de tareas, cerramos el bloque
      if (taskBlockStarted && line.trim() === "") {
        inTaskBlock = false;
      }
      nonTaskLines.push(line);
    }
  }

  // Si encontramos pocas tareas (menos de 2), probablemente no es una lista de tareas
  if (tasks.length < 2) {
    return { tasks: [], cleanedContent: content };
  }

  return {
    tasks,
    cleanedContent: nonTaskLines.join("\n").trim(),
  };
}

/**
 * Detecta si un mensaje contiene un plan de implementación
 */
export function isImplementationPlan(content: string): boolean {
  const planIndicators = [
    "## propuestas",
    "## tareas",
    "## plan",
    "## fases",
    "## pasos",
    "### fase",
    "### step",
    "implementation plan",
    "plan de implementación",
    "tareas propuestas",
    "cambios propuestos",
  ];

  const lowerContent = content.toLowerCase();
  return planIndicators.some(indicator => lowerContent.includes(indicator));
}
