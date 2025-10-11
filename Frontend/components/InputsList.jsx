import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'react-toastify'
import { internalApi as api } from '@/lib/api'

export default function InputsList({ projectId, inputs }) {
  const queryClient = useQueryClient()
  const [editingId, setEditingId] = useState(null)
  const [editText, setEditText] = useState('')

  const deleteMutation = useMutation({
    mutationFn: async (inputId) => {
      const { data } = await api.delete(`/api/projects/${projectId}/inputs?inputId=${inputId}`)
      return data
    },
    onSuccess: () => {
      toast.success('Input deleted')
      queryClient.invalidateQueries(['project-inputs', projectId])
    },
    onError: (e) => toast.error(e.message)
  })

  const updateMutation = useMutation({
    mutationFn: async ({ inputId, content }) => {
      const { data } = await api.put(`/api/projects/${projectId}/inputs?inputId=${inputId}`, { content })
      return data
    },
    onSuccess: () => {
      toast.success('Input updated')
      setEditingId(null)
      setEditText('')
      queryClient.invalidateQueries(['project-inputs', projectId])
    },
    onError: (e) => toast.error(e.message)
  })

  const renderItem = (item, type) => {
    const isText = type === 'text'
    const id = item.id
    const content = isText ? item.content : (item.content || '')
    return (
      <div key={`${type}-${id}`} className="border border-gray-200 rounded-md p-3 flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="text-xs text-gray-500 mb-1">
            {isText ? 'Text' : (item.type?.startsWith('audio') ? 'Voice' : 'Document')} • {new Date(item.createdAt || item.uploadedAt || Date.now()).toLocaleString()}
          </div>
          {editingId === id && isText ? (
            <textarea
              value={editText}
              onChange={(e) => setEditText(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 resize-y min-h-[80px]"
            />
          ) : (
            <div className="text-sm text-gray-900 whitespace-pre-wrap break-words">
              {content || '—'}
            </div>
          )}
          {!isText && item.name && (
            <div className="text-xs text-gray-600 mt-1">File: {item.name} ({Math.round((item.size || 0)/1024)} KB)</div>
          )}
        </div>
        <div className="flex flex-col gap-2 shrink-0">
          {isText && editingId === id ? (
            <>
              <button
                onClick={() => updateMutation.mutate({ inputId: id, content: editText.trim() })}
                disabled={!editText.trim() || updateMutation.isPending}
                className="px-3 py-1 text-xs rounded-md bg-blue-600 text-white disabled:opacity-50"
              >Save</button>
              <button
                onClick={() => { setEditingId(null); setEditText('') }}
                className="px-3 py-1 text-xs rounded-md border border-gray-300"
              >Cancel</button>
            </>
          ) : (
            <>
              {isText && (
                <button
                  onClick={() => { setEditingId(id); setEditText(content || '') }}
                  className="px-3 py-1 text-xs rounded-md border border-gray-300"
                >Edit</button>
              )}
              <button
                onClick={() => deleteMutation.mutate(id)}
                className="px-3 py-1 text-xs rounded-md bg-red-50 text-red-700 border border-red-200"
              >Delete</button>
            </>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {/* Text inputs */}
      {(inputs?.textInputs || []).map(i => renderItem(i, 'text'))}
      {/* Files (voice/doc) */}
      {(inputs?.files || []).map(i => renderItem(i, 'file'))}
    </div>
  )
}
