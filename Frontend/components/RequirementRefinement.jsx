'use client'
import { useState } from 'react'
import { toast } from 'react-toastify'

export default function RequirementRefinement({ 
  originalRequirement, 
  onRefinedRequirement, 
  projectId,
  className = '' 
}) {
  const [isRefining, setIsRefining] = useState(false)
  const [refinementResult, setRefinementResult] = useState(null)
  const [showComparison, setShowComparison] = useState(false)

  const handleRefine = async () => {
    if (!originalRequirement || originalRequirement.trim().length < 10) {
      toast.error('Please enter a requirement with at least 10 characters')
      return
    }

    setIsRefining(true)
    setRefinementResult(null)
    setShowComparison(false)

    try {
      const response = await fetch('/api/refinement/refine-requirement', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          requirement: originalRequirement.trim(),
          projectId: projectId
        })
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.message || `Refinement failed: ${response.status}`)
      }

      const result = await response.json()
      
      if (result.success) {
        setRefinementResult(result.data)
        setShowComparison(true)
        toast.success('✨ AI Refinement Successful!', {
          position: "top-right",
          autoClose: 3000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
        })
      } else {
        throw new Error(result.message || 'Refinement failed')
      }
    } catch (error) {
      console.error('Refinement error:', error)
      toast.error(`Refinement failed: ${error.message}`, {
        position: "top-right",
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
      })
    } finally {
      setIsRefining(false)
    }
  }

  const handleUseRefined = () => {
    if (refinementResult && onRefinedRequirement) {
      onRefinedRequirement(refinementResult.refinedRequirement)
      setShowComparison(false)
      setRefinementResult(null)
      toast.success('✅ Refined requirement applied!', {
        position: "top-right",
        autoClose: 2000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
      })
    }
  }

  const handleCloseComparison = () => {
    setShowComparison(false)
    setRefinementResult(null)
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Refine Button */}
      <div className="flex items-center gap-3">
        <button
          onClick={handleRefine}
          disabled={isRefining || !originalRequirement || originalRequirement.trim().length < 10}
          className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:from-purple-700 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 font-semibold shadow-lg hover:shadow-xl"
        >
          {isRefining ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
              <span>Refining with AI...</span>
            </>
          ) : (
            <>
              <span className="text-lg">✨</span>
              <span>Refine with AI</span>
            </>
          )}
        </button>
        
        {refinementResult && (
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <span className="w-2 h-2 bg-green-500 rounded-full"></span>
            <span>Refinement Score: {Math.round(refinementResult.refinementScore * 100)}%</span>
          </div>
        )}
      </div>

      {/* Comparison Modal */}
      {showComparison && refinementResult && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-purple-600 to-blue-600 text-white p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-2xl font-bold">✨ AI Requirement Refinement</h3>
                  <p className="text-purple-100 mt-1">Enhanced using semantic context from similar requirements</p>
                </div>
                <button
                  onClick={handleCloseComparison}
                  className="text-white hover:text-purple-200 transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
              {/* Side-by-side comparison */}
              <div className="grid md:grid-cols-2 gap-6 mb-6">
                {/* Original */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-gray-400 rounded-full"></div>
                    <h4 className="font-semibold text-gray-700">Original Requirement</h4>
                  </div>
                  <div className="bg-gray-50 border-2 border-gray-200 rounded-lg p-4 min-h-[120px]">
                    <p className="text-gray-800 leading-relaxed">{refinementResult.originalRequirement}</p>
                  </div>
                </div>

                {/* Refined */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full"></div>
                    <h4 className="font-semibold text-gray-700">AI Refined Requirement</h4>
                    <div className="ml-auto flex items-center gap-1 text-sm text-green-600">
                      <span>✨</span>
                      <span>{Math.round(refinementResult.refinementScore * 100)}% Enhanced</span>
                    </div>
                  </div>
                  <div className="bg-gradient-to-br from-purple-50 to-blue-50 border-2 border-purple-200 rounded-lg p-4 min-h-[120px] relative overflow-hidden">
                    {/* Glowing border effect */}
                    <div className="absolute inset-0 bg-gradient-to-r from-purple-400/20 to-blue-400/20 rounded-lg blur-sm"></div>
                    <div className="relative z-10">
                      <p className="text-gray-800 leading-relaxed">{refinementResult.refinedRequirement}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Context Information */}
              {refinementResult.contextUsed && refinementResult.contextUsed.length > 0 && (
                <div className="mb-6">
                  <h4 className="font-semibold text-gray-700 mb-3 flex items-center gap-2">
                    <span>🔍</span>
                    Context Used for Refinement
                  </h4>
                  <div className="space-y-2">
                    {refinementResult.contextUsed.map((context, index) => (
                      <div key={index} className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <p className="text-sm text-gray-800">{context.text}</p>
                            <div className="flex items-center gap-4 mt-2 text-xs text-gray-600">
                              <span>Category: {context.category}</span>
                              <span>Similarity: {Math.round(context.similarity * 100)}%</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Suggestions */}
              {refinementResult.suggestions && refinementResult.suggestions.length > 0 && (
                <div className="mb-6">
                  <h4 className="font-semibold text-gray-700 mb-3 flex items-center gap-2">
                    <span>💡</span>
                    Additional Suggestions
                  </h4>
                  <div className="space-y-2">
                    {refinementResult.suggestions.map((suggestion, index) => (
                      <div key={index} className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                        <div className="flex items-start gap-2">
                          <span className="text-yellow-600 text-sm font-medium">
                            {suggestion.priority === 'high' ? '🔴' : suggestion.priority === 'medium' ? '🟡' : '🟢'}
                          </span>
                          <div>
                            <p className="text-sm text-gray-800">{suggestion.suggestion}</p>
                            <span className="text-xs text-gray-600 capitalize">{suggestion.type}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Footer Actions */}
            <div className="bg-gray-50 px-6 py-4 flex items-center justify-between">
              <button
                onClick={handleCloseComparison}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleUseRefined}
                className="px-6 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:from-purple-700 hover:to-blue-700 transition-all duration-300 font-semibold shadow-lg hover:shadow-xl"
              >
                ✅ Use Refined Requirement
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
