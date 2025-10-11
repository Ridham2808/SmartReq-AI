import { Router } from 'express'
import { authenticateToken } from '../middleware/auth.js'
import { getArtifacts, getArtifactsSummary, getArtifact, updateArtifact, deleteArtifact } from '../controllers/artifacts.js'
import prisma from '../config/db.js'

const router = Router()

// All routes are protected
router.use(authenticateToken)

// GET /api/projects/:projectId/artifacts/summary
router.get('/:projectId/artifacts/summary', getArtifactsSummary)

// GET /api/projects/:projectId/artifacts
router.get('/:projectId/artifacts', getArtifacts)

// GET /api/projects/:projectId/artifacts/:artifactId
router.get('/:projectId/artifacts/:artifactId', getArtifact)

// IMPORTANT: Define flow route BEFORE generic :artifactId route handlers to avoid matching 'flow' as :artifactId
// Live flow updates for real-time collaboration
router.put('/:projectId/artifacts/flow', async (req, res, next) => {
  try {
    const { projectId } = req.params
    const { flow } = req.body || {}
    if (!flow) return res.status(400).json({ success: false, message: 'Missing flow' })

    // Sanitize and validate incoming flow shape to avoid Prisma JSON validation errors
    const arr = (v) => Array.isArray(v) ? v : []
    const str = (v) => typeof v === 'string' ? v : (v == null ? undefined : String(v))
    const safeNodesRaw = arr(flow.nodes).map((n) => {
      const node = {
        id: str(n?.id),
        label: str(n?.label) || '',
        type: str(n?.type) || 'process',
      }
      if (n?.actor != null) node.actor = str(n.actor)
      if (n?.description != null) node.description = str(n.description)
      return node
    })
    // Drop nodes missing required fields
    const idSet = new Set()
    const safeNodes = safeNodesRaw.filter((n) => {
      const ok = Boolean(n.id && n.label && n.type)
      if (ok) idSet.add(n.id)
      return ok
    })

    const safeEdgesRaw = arr(flow.edges).map((e) => {
      const edge = {
        source: str(e?.source) || '',
        target: str(e?.target) || ''
      }
      if (e?.label != null) edge.label = str(e.label)
      return edge
    })
    // Keep only edges that reference existing nodes and are not self-loops
    const safeEdges = safeEdgesRaw.filter((e) => e.source && e.target && e.source !== e.target && idSet.has(e.source) && idSet.has(e.target))

    const safeFlow = JSON.parse(JSON.stringify({ nodes: safeNodes, edges: safeEdges }))
    const existing = await prisma.artifact.findFirst({ where: { projectId: parseInt(projectId), type: 'flow' } })
    let artifact
    if (existing) {
      artifact = await prisma.artifact.update({ where: { id: existing.id }, data: { content: safeFlow } })
    } else {
      artifact = await prisma.artifact.create({ data: { projectId: parseInt(projectId), type: 'flow', content: safeFlow } })
    }
    const io = req.io
    io?.to(`project-${projectId}`).emit('flow-update', { projectId: parseInt(projectId), flow: safeFlow })
    return res.json({ success: true, data: { id: artifact.id } })
  } catch (e) { next(e) }
})

// PUT /api/projects/:projectId/artifacts/:artifactId
router.put('/:projectId/artifacts/:artifactId', updateArtifact)

// DELETE /api/projects/:projectId/artifacts/:artifactId
router.delete('/:projectId/artifacts/:artifactId', deleteArtifact)

export default router