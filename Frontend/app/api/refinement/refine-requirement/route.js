export async function POST(request) {
  try {
    const body = await request.json();
    const { requirement, projectId } = body;
    
    // Check if requirement is valid
    if (!requirement || requirement.trim().length < 10) {
      return new Response(JSON.stringify({
        success: false,
        message: 'Requirement must be at least 10 characters long'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Try backend first, fallback to mock if backend is not available
    try {
      const backendUrl = process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000';
      const response = await fetch(`${backendUrl}/api/refinement/refine-requirement`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(5000) // 5 second timeout
      });

      if (response.ok) {
        const data = await response.json();
        return new Response(JSON.stringify(data), {
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        });
      }
    } catch (backendError) {
      console.log('Backend not available, using mock refinement');
    }

    // Mock refinement response when backend is not available
    const mockRefinement = {
      success: true,
      data: {
        originalRequirement: requirement,
        refinedRequirement: `Enhanced: ${requirement}\n\nThis refined requirement includes:\n• Clear acceptance criteria\n• Detailed functional specifications\n• Performance considerations\n• User experience requirements`,
        refinementScore: 0.85,
        contextUsed: [
          {
            text: "Similar requirement from project context",
            category: "Functional",
            similarity: 0.75
          }
        ],
        suggestions: [
          {
            suggestion: "Consider adding performance metrics",
            type: "Performance",
            priority: "medium"
          },
          {
            suggestion: "Include error handling scenarios",
            type: "Reliability",
            priority: "high"
          }
        ]
      }
    };

    return new Response(JSON.stringify(mockRefinement), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('API route error:', error);
    return new Response(JSON.stringify({
      success: false,
      message: 'Internal server error',
      error: error.message
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
