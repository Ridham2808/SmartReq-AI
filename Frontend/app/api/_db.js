// Simple in-memory store for dev/demo
// NOTE: This resets on server restart. Replace with a real DB in production.

export const projectStore = {
  projects: new Map(), // id -> { id, name, description }
  inputs: new Map(),   // id -> { textInputs: [], files: [], voiceInputs: [] }
  artifacts: new Map() // id -> { userStories: [], flow: {nodes, edges}, requirements: [] }
}

export function ensureProject(id) {
  const pid = Number(id)
  if (!projectStore.projects.has(pid)) {
    projectStore.projects.set(pid, {
      id: pid,
      name: `Project #${pid}`,
      description: `This is a sample project with ID ${pid}`
    })
  }
  if (!projectStore.inputs.has(pid)) {
    projectStore.inputs.set(pid, { textInputs: [], files: [], voiceInputs: [] })
  }
  if (!projectStore.artifacts.has(pid)) {
    projectStore.artifacts.set(pid, { userStories: [], flow: { nodes: [], edges: [] }, requirements: [] })
  }
  return pid
}


