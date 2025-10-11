import React from 'react'

export default function ProcessFlowCard({ steps, textFlow, exampleStory, mermaidCode }) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6 space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Improved Process Flow</h3>
        <p className="text-sm text-gray-600">Use this in your diagram builder (React Flow, Draw.io, Mermaid, etc.).</p>
      </div>

      {/* Visual Flow (Cards) */}
      {Array.isArray(steps) && steps.length > 0 && (
        <div>
          <h4 className="text-sm font-semibold text-gray-900 mb-2">Visual Flow</h4>
          <div className="flex flex-col gap-3">
            {steps.map((s, idx) => {
              const isStart = (s.title || '').toLowerCase() === 'start' || (s.step || '').includes('🟢')
              const isEnd = (s.title || '').toLowerCase() === 'end' || (s.step || '').includes('🔴')
              const dotClass = isStart ? 'bg-green-500' : isEnd ? 'bg-red-500' : 'bg-blue-500'
              return (
                <div key={`vf-${idx}`} className="inline-flex items-center gap-3 px-4 py-2 rounded-md border border-gray-200 shadow-sm bg-white w-fit">
                  <span className={`w-3 h-3 rounded-full ${dotClass}`} />
                  <span className="text-gray-900 text-sm font-medium">{s.title || `Step ${idx + 1}`}</span>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Steps Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="text-left text-gray-600">
              <th className="py-2 pr-4">Step</th>
              <th className="py-2 pr-4">Node Title</th>
              <th className="py-2 pr-4">Description</th>
              <th className="py-2">Example</th>
            </tr>
          </thead>
          <tbody className="align-top">
            {steps.map((s, idx) => (
              <tr key={idx} className="border-t border-gray-100">
                <td className="py-2 pr-4 whitespace-nowrap">{s.step}</td>
                <td className="py-2 pr-4 font-medium">{s.title}</td>
                <td className="py-2 pr-4 text-gray-700">{s.description}</td>
                <td className="py-2 text-gray-700">{s.example}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Simple Text Flow */}
      {textFlow && (
        <div>
          <h4 className="text-sm font-semibold text-gray-900 mb-2">Simple Process Flow (Text)</h4>
          <div className="text-sm text-gray-800 whitespace-pre-wrap">{textFlow}</div>
        </div>
      )}

      {/* Example Output */}
      {exampleStory && (
        <div>
          <h4 className="text-sm font-semibold text-gray-900 mb-2">Example Output (Frontend Display)</h4>
          <div className="space-y-2 text-sm text-gray-800">
            <div className="font-medium">✅ User Story Generated:</div>
            <div><span className="font-medium">Title:</span> {exampleStory.title}</div>
            <div className="whitespace-pre-wrap">{exampleStory.body}</div>
            {exampleStory.acceptanceCriteria?.length > 0 && (
              <div>
                <div className="font-medium mt-2">Acceptance Criteria:</div>
                <ul className="list-disc pl-5 mt-1 space-y-1">
                  {exampleStory.acceptanceCriteria.map((c, i) => (
                    <li key={i}>{c}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Mermaid Diagram */}
      {mermaidCode && (
        <div>
          <h4 className="text-sm font-semibold text-gray-900 mb-2">Mermaid Diagram</h4>
          <pre className="bg-gray-50 border border-gray-200 rounded-md p-3 text-xs overflow-auto"><code>{mermaidCode}</code></pre>
        </div>
      )}
    </div>
  )
}
