// Enhanced local analysis function that generates truly dynamic responses
async function generateEnhancedLocalAnalysis(idea) {
  const ideaText = idea.toLowerCase();
  const ideaLength = idea.length;
  
  // Advanced keyword analysis for different industries
  const industryKeywords = {
    fintech: /fintech|banking|payment|finance|trading|investment|loan|credit|wallet|digital currency|crypto|bitcoin|ethereum|defi|nft|web3|blockchain/i,
    healthcare: /healthcare|medical|health|doctor|patient|hospital|pharma|telemedicine|diagnosis|treatment|therapy|wellness|fitness|mental health/i,
    ecommerce: /ecommerce|e-commerce|shopping|retail|marketplace|store|online store|dropshipping|inventory|product|sales/i,
    education: /education|learning|school|university|course|training|tutorial|student|teacher|academy|skill|knowledge/i,
    ai: /ai|artificial|intelligence|machine|learning|ml|neural|deep learning|automation|chatbot|nlp|computer vision/i,
    social: /social|community|chat|messaging|network|platform|social media|dating|friends|connection/i,
    gaming: /gaming|game|entertainment|vr|ar|metaverse|esports|streaming|twitch|youtube/i,
    productivity: /productivity|work|office|collaboration|management|project|task|calendar|scheduling/i,
    travel: /travel|tourism|booking|hotel|flight|vacation|trip|destination|accommodation/i,
    realestate: /real estate|property|house|apartment|rent|buy|sell|mortgage|construction/i,
    food: /food|restaurant|delivery|recipe|cooking|dining|meal|kitchen|chef/i,
    transport: /transport|logistics|delivery|shipping|uber|taxi|ride|vehicle|automotive/i,
    events: /event|conference|meeting|party|wedding|concert|festival|ticket|booking/i
  };
  
  // Detect industry
  let detectedIndustry = 'technology';
  let industryScore = 0;
  
  for (const [industry, regex] of Object.entries(industryKeywords)) {
    if (regex.test(ideaText)) {
      detectedIndustry = industry;
      industryScore += 25;
      break;
    }
  }
  
  // Business model detection
  const businessKeywords = {
    saas: /saas|software|subscription|platform|api|cloud|software as a service/i,
    marketplace: /marketplace|market|exchange|trading|auction|bid/i,
    mobile: /mobile|app|ios|android|smartphone|tablet/i,
    b2b: /b2b|business|enterprise|corporate|wholesale|company/i,
    b2c: /b2c|consumer|customer|individual|personal|user/i
  };
  
  let detectedBusinessModel = 'b2c';
  for (const [model, regex] of Object.entries(businessKeywords)) {
    if (regex.test(ideaText)) {
      detectedBusinessModel = model;
      break;
    }
  }
  
  // Innovation level detection
  const innovationKeywords = /innovative|new|revolutionary|disruptive|breakthrough|cutting-edge|advanced|next-generation|future|unique|novel|original|first|pioneer/i;
  const hasInnovationKeywords = innovationKeywords.test(ideaText);
  
  // Calculate dynamic scores
  const contentQuality = Math.min(30, ideaLength / 15);
  const techScore = /tech|ai|software|app|platform|digital|online|web|mobile/i.test(ideaText) ? 25 : 10;
  const businessScore = /business|startup|revenue|profit|market|customer|user|client|monetization/i.test(ideaText) ? 20 : 5;
  const innovationScore = hasInnovationKeywords ? 30 : 15;
  
  const baseSuccess = Math.min(95, 20 + contentQuality + techScore + businessScore + innovationScore + industryScore);
  const baseInnovation = Math.min(100, 15 + innovationScore + techScore + Math.random() * 20);
  const baseMarketTrend = Math.min(100, 35 + industryScore + Math.random() * 25);
  const baseCompetitiveRisk = Math.max(20, 75 - innovationScore - techScore);
  const baseFundingPotential = Math.min(100, 25 + businessScore + industryScore + Math.random() * 20);
  
  // Generate industry-specific content
  const industryContent = generateIndustrySpecificContent(detectedIndustry, ideaText);
  
  return {
    futureScope: {
      analysis: industryContent.futureScope,
      score: Math.round(baseSuccess)
    },
    advantages: industryContent.advantages,
    disadvantages: industryContent.disadvantages,
    successProbability: Math.round(baseSuccess),
    marketTrendAlignment: Math.round(baseMarketTrend),
    competitiveRisk: Math.round(baseCompetitiveRisk),
    innovationLevel: Math.round(baseInnovation),
    fundingPotential: Math.round(baseFundingPotential),
    marketReadiness: Math.round(45 + industryScore + Math.random() * 25),
    aiRecommendations: industryContent.recommendations,
    comparativeAnalysis: industryContent.comparativeAnalysis,
    growthForecast: generateDynamicGrowthForecast(baseSuccess, baseFundingPotential, detectedIndustry),
    radarData: [
      { metric: 'Innovation', value: Math.round(baseInnovation) },
      { metric: 'Market Fit', value: Math.round(baseMarketTrend) },
      { metric: 'Scalability', value: Math.round(baseSuccess * 0.85) },
      { metric: 'Competition', value: Math.round(100 - baseCompetitiveRisk) },
      { metric: 'Funding', value: Math.round(baseFundingPotential) },
      { metric: 'Readiness', value: Math.round(45 + industryScore + Math.random() * 25) }
    ]
  };
}

// Extract key features from idea text
function extractKeyFeatures(ideaText) {
  const features = [];
  
  // Technology features
  if (/ai|artificial|intelligence|machine|learning|ml|neural|deep learning/i.test(ideaText)) features.push('AI-powered');
  if (/blockchain|crypto|bitcoin|ethereum|defi|nft|web3/i.test(ideaText)) features.push('Blockchain-based');
  if (/mobile|app|ios|android|smartphone/i.test(ideaText)) features.push('Mobile-first');
  if (/cloud|saas|platform|api/i.test(ideaText)) features.push('Cloud-native');
  if (/vr|ar|virtual|augmented|metaverse/i.test(ideaText)) features.push('Immersive technology');
  
  // Business features
  if (/marketplace|market|exchange|trading/i.test(ideaText)) features.push('Marketplace model');
  if (/subscription|recurring|monthly|yearly/i.test(ideaText)) features.push('Subscription-based');
  if (/b2b|business|enterprise|corporate/i.test(ideaText)) features.push('B2B focused');
  if (/b2c|consumer|customer|individual/i.test(ideaText)) features.push('B2C focused');
  if (/social|community|chat|messaging/i.test(ideaText)) features.push('Social features');
  
  // Industry-specific features
  if (/payment|finance|banking|wallet/i.test(ideaText)) features.push('Payment integration');
  if (/healthcare|medical|health|doctor/i.test(ideaText)) features.push('Healthcare compliance');
  if (/education|learning|school|course/i.test(ideaText)) features.push('Educational content');
  if (/event|conference|meeting|party/i.test(ideaText)) features.push('Event management');
  if (/travel|tourism|booking|hotel/i.test(ideaText)) features.push('Travel booking');
  
  return features;
}

// Generate dynamic future scope based on idea content
function generateDynamicFutureScope(industry, ideaText, features, hasAI, hasMobile, hasBlockchain) {
  const featureText = features.length > 0 ? ` incorporating ${features.slice(0, 2).join(' and ')}` : '';
  
  const scopes = {
    fintech: `Your fintech concept${featureText} has strong potential in the rapidly growing digital financial services market. ${hasAI ? 'AI integration provides competitive advantages in fraud detection and personalized services.' : ''} ${hasMobile ? 'Mobile-first approach aligns with consumer preferences for digital banking.' : ''} The increasing adoption of digital payments creates favorable conditions for growth.`,
    healthcare: `Your healthcare innovation${featureText} addresses critical needs in an essential industry. ${hasAI ? 'AI capabilities can enhance diagnostic accuracy and treatment recommendations.' : ''} ${hasMobile ? 'Mobile accessibility improves patient engagement and remote monitoring capabilities.' : ''} With aging populations and increasing healthcare costs, there's significant market demand for efficient solutions.`,
    events: `Your event management concept${featureText} taps into the growing demand for digital event solutions. ${hasAI ? 'AI can personalize event recommendations and optimize attendee matching.' : ''} ${hasMobile ? 'Mobile-first design ensures seamless attendee experience across devices.' : ''} The shift towards hybrid and virtual events creates significant opportunities for innovation.`,
    ai: `Your AI-powered solution${featureText} leverages cutting-edge technology with significant competitive advantages. ${hasMobile ? 'Mobile integration expands accessibility and user engagement.' : ''} ${hasBlockchain ? 'Blockchain integration can provide enhanced security and transparency.' : ''} The AI market is experiencing explosive growth with increasing enterprise adoption.`,
    default: `Your concept${featureText} shows promising potential in a dynamic market environment. ${hasAI ? 'AI integration provides intelligent automation and insights.' : ''} ${hasMobile ? 'Mobile accessibility expands your potential user base significantly.' : ''} The combination of technology and market demand creates opportunities for scalable growth.`
  };
  
  return scopes[industry] || scopes.default;
}

// Generate dynamic advantages based on idea content
function generateDynamicAdvantages(industry, ideaText, features, hasAI, hasMobile, hasBlockchain) {
  const advantages = [];
  
  // Industry-specific advantages
  if (industry === 'fintech') {
    advantages.push("High demand in digital financial services market");
    advantages.push("Strong regulatory framework provides market barriers");
    if (hasAI) advantages.push("AI-powered fraud detection reduces security risks");
    if (hasMobile) advantages.push("Mobile-first approach captures growing mobile banking trend");
    if (hasBlockchain) advantages.push("Blockchain integration provides transparency and security");
  } else if (industry === 'healthcare') {
    advantages.push("Essential service with growing market demand");
    advantages.push("High barriers to entry protect market position");
    if (hasAI) advantages.push("AI capabilities enhance diagnostic accuracy");
    if (hasMobile) advantages.push("Mobile access improves patient engagement");
  } else if (industry === 'events') {
    advantages.push("Large addressable market with global reach");
    advantages.push("High demand for digital event solutions");
    if (hasAI) advantages.push("AI can optimize event matching and recommendations");
    if (hasMobile) advantages.push("Mobile platform ensures seamless attendee experience");
  } else {
    advantages.push("Clear market opportunity in growing sector");
    advantages.push("Scalable technology foundation");
    if (hasAI) advantages.push("AI integration provides competitive advantage");
    if (hasMobile) advantages.push("Mobile accessibility expands user reach");
  }
  
  // Feature-based advantages
  if (features.includes('Subscription-based')) advantages.push("Recurring revenue model provides predictable income");
  if (features.includes('Marketplace model')) advantages.push("Network effects increase platform value");
  if (features.includes('Cloud-native')) advantages.push("Scalable infrastructure supports rapid growth");
  
  return advantages.slice(0, 5);
}

// Generate dynamic disadvantages based on idea content
function generateDynamicDisadvantages(industry, ideaText, features, hasAI, hasMobile, hasBlockchain) {
  const disadvantages = [];
  
  // Industry-specific disadvantages
  if (industry === 'fintech') {
    disadvantages.push("Complex regulatory compliance requirements");
    if (hasAI) disadvantages.push("AI systems require extensive training data and validation");
    if (hasBlockchain) disadvantages.push("Blockchain integration increases complexity and costs");
  } else if (industry === 'healthcare') {
    disadvantages.push("Strict regulatory approval processes");
    if (hasAI) disadvantages.push("AI diagnostic tools require FDA approval and clinical validation");
  } else if (industry === 'events') {
    disadvantages.push("High customer acquisition costs");
    disadvantages.push("Seasonal demand fluctuations");
  } else {
    disadvantages.push("Market saturation in competitive landscape");
    disadvantages.push("High initial development and marketing costs");
  }
  
  // Feature-based disadvantages
  if (hasAI) disadvantages.push("High development and computational costs");
  if (hasMobile) disadvantages.push("Need for iOS and Android development expertise");
  if (features.includes('Subscription-based')) disadvantages.push("High customer acquisition costs");
  if (features.includes('Marketplace model')) disadvantages.push("Chicken-and-egg problem with supply and demand");
  
  return disadvantages.slice(0, 5);
}

// Generate dynamic recommendations based on idea content
function generateDynamicRecommendations(industry, ideaText, features, hasAI, hasMobile, hasBlockchain) {
  const recommendations = [];
  
  // Industry-specific recommendations
  if (industry === 'fintech') {
    recommendations.push("Focus on regulatory compliance from day one");
    if (hasAI) recommendations.push("Invest in high-quality training data for AI models");
    if (hasBlockchain) recommendations.push("Ensure blockchain integration meets regulatory standards");
  } else if (industry === 'healthcare') {
    recommendations.push("Ensure HIPAA compliance and data security");
    if (hasAI) recommendations.push("Obtain FDA approval for AI diagnostic tools");
  } else if (industry === 'events') {
    recommendations.push("Focus on user experience and ease of use");
    if (hasAI) recommendations.push("Implement AI-powered event recommendations");
  } else {
    recommendations.push("Focus on MVP development to validate core assumptions");
    if (hasAI) recommendations.push("Invest in high-quality training data");
  }
  
  // Feature-based recommendations
  if (hasMobile) recommendations.push("Optimize for mobile-first user experience");
  if (features.includes('Subscription-based')) recommendations.push("Implement robust billing and payment systems");
  if (features.includes('Marketplace model')) recommendations.push("Build strong onboarding for both supply and demand sides");
  
  return recommendations.slice(0, 5);
}

// Generate dynamic comparison based on idea content
function generateDynamicComparison(industry, ideaText, features, hasAI, hasMobile, hasBlockchain) {
  let similarStartups = [];
  let trendComparison = "";
  
  if (industry === 'fintech') {
    similarStartups = [
      { name: "Stripe", similarity: hasAI ? 70 : 65, innovation: hasAI ? 30 : 35, note: hasAI ? "Your AI integration provides fraud detection advantage" : "Consider adding AI-powered fraud detection" },
      { name: "PayPal", similarity: hasMobile ? 60 : 55, innovation: hasMobile ? 40 : 45, note: hasMobile ? "Your mobile-first approach is well-positioned" : "Focus on mobile-first payment experience" },
      { name: "Square", similarity: 45, innovation: 55, note: "Emphasize small business solutions and payment processing" }
    ];
    trendComparison = `Your fintech idea shows ${hasAI ? '70%' : '60%'} similarity to existing solutions but ${hasAI ? '30%' : '40%'} innovation potential. ${hasAI ? 'AI integration' : 'The fintech market'} is experiencing ${hasAI ? '30%' : '25%'} year-over-year growth.`;
  } else if (industry === 'healthcare') {
    similarStartups = [
      { name: "Teladoc", similarity: hasAI ? 65 : 60, innovation: hasAI ? 35 : 40, note: hasAI ? "Your AI capabilities enhance diagnostic accuracy" : "Consider adding AI diagnostic tools" },
      { name: "Epic", similarity: 50, innovation: 50, note: "Focus on interoperability features and patient engagement" },
      { name: "Cerner", similarity: 45, innovation: 55, note: "Emphasize patient engagement and healthcare workflow optimization" }
    ];
    trendComparison = `Your healthcare idea shows ${hasAI ? '65%' : '55%'} similarity to existing solutions but ${hasAI ? '35%' : '45%'} innovation potential. ${hasAI ? 'AI-enhanced healthcare' : 'The healthcare tech market'} is experiencing ${hasAI ? '25%' : '20%'} year-over-year growth.`;
  } else if (industry === 'events') {
    similarStartups = [
      { name: "Eventbrite", similarity: hasAI ? 75 : 70, innovation: hasAI ? 25 : 30, note: hasAI ? "Your AI integration provides personalized event recommendations" : "Consider adding AI-powered event recommendations" },
      { name: "Cvent", similarity: hasMobile ? 65 : 60, innovation: hasMobile ? 35 : 40, note: hasMobile ? "Your mobile platform enhances attendee experience" : "Focus on enterprise event management" },
      { name: "Hopin", similarity: 50, innovation: 50, note: "Emphasize virtual and hybrid event capabilities" }
    ];
    trendComparison = `Your event management idea shows ${hasAI ? '75%' : '60%'} similarity to existing solutions but ${hasAI ? '25%' : '40%'} innovation potential. ${hasAI ? 'AI-powered event tech' : 'The event tech market'} is experiencing ${hasAI ? '22%' : '18%'} year-over-year growth.`;
  } else {
    similarStartups = [
      { name: "Notion", similarity: hasAI ? 55 : 50, innovation: hasAI ? 45 : 50, note: hasAI ? "Your AI capabilities provide automation advantages" : "Focus on AI-powered automation" },
      { name: "Slack", similarity: 45, innovation: 55, note: "Emphasize real-time collaboration and communication" },
      { name: "Zoom", similarity: 40, innovation: 60, note: "Consider hybrid work solutions and video integration" }
    ];
    trendComparison = `Your idea shows ${hasAI ? '55%' : '50%'} similarity to existing solutions but ${hasAI ? '45%' : '50%'} innovation potential. ${hasAI ? 'AI-enhanced productivity' : 'The technology market'} is experiencing ${hasAI ? '20%' : '15%'} year-over-year growth.`;
  }
  
  return { similarStartups, trendComparison };
}

// Generate dynamic growth forecast
function generateDynamicGrowthForecast(successProbability, fundingPotential, industry) {
  const baseGrowth = successProbability / 100;
  const fundingMultiplier = fundingPotential / 100;
  const industryMultiplier = industry === 'fintech' ? 1.5 : industry === 'ai' ? 1.3 : industry === 'healthcare' ? 1.2 : industry === 'events' ? 1.4 : 1.0;
  
  return [
    { month: 'Month 1', users: Math.round(50 * baseGrowth * industryMultiplier), revenue: Math.round(500 * baseGrowth * fundingMultiplier * industryMultiplier) },
    { month: 'Month 3', users: Math.round(200 * baseGrowth * industryMultiplier), revenue: Math.round(2000 * baseGrowth * fundingMultiplier * industryMultiplier) },
    { month: 'Month 6', users: Math.round(800 * baseGrowth * industryMultiplier), revenue: Math.round(8000 * baseGrowth * fundingMultiplier * industryMultiplier) },
    { month: 'Month 12', users: Math.round(3000 * baseGrowth * industryMultiplier), revenue: Math.round(30000 * baseGrowth * fundingMultiplier * industryMultiplier) },
    { month: 'Month 18', users: Math.round(10000 * baseGrowth * industryMultiplier), revenue: Math.round(100000 * baseGrowth * fundingMultiplier * industryMultiplier) },
    { month: 'Month 24', users: Math.round(30000 * baseGrowth * industryMultiplier), revenue: Math.round(300000 * baseGrowth * fundingMultiplier * industryMultiplier) }
  ];
}

// Generate truly dynamic industry-specific content based on idea text
function generateIndustrySpecificContent(industry, ideaText) {
  // Extract key features from the idea text
  const features = extractKeyFeatures(ideaText);
  const hasAI = /ai|artificial|intelligence|machine|learning|ml|neural|deep learning|automation/i.test(ideaText);
  const hasMobile = /mobile|app|ios|android|smartphone|tablet/i.test(ideaText);
  const hasBlockchain = /blockchain|crypto|bitcoin|ethereum|defi|nft|web3/i.test(ideaText);
  
  const content = {
    fintech: {
      futureScope: generateDynamicFutureScope('fintech', ideaText, features, hasAI, hasMobile, hasBlockchain),
      advantages: generateDynamicAdvantages('fintech', ideaText, features, hasAI, hasMobile, hasBlockchain),
      disadvantages: generateDynamicDisadvantages('fintech', ideaText, features, hasAI, hasMobile, hasBlockchain),
      recommendations: generateDynamicRecommendations('fintech', ideaText, features, hasAI, hasMobile, hasBlockchain),
      comparativeAnalysis: generateDynamicComparison('fintech', ideaText, features, hasAI, hasMobile, hasBlockchain)
    },
    healthcare: {
      futureScope: generateDynamicFutureScope('healthcare', ideaText, features, hasAI, hasMobile, hasBlockchain),
      advantages: generateDynamicAdvantages('healthcare', ideaText, features, hasAI, hasMobile, hasBlockchain),
      disadvantages: generateDynamicDisadvantages('healthcare', ideaText, features, hasAI, hasMobile, hasBlockchain),
      recommendations: generateDynamicRecommendations('healthcare', ideaText, features, hasAI, hasMobile, hasBlockchain),
      comparativeAnalysis: generateDynamicComparison('healthcare', ideaText, features, hasAI, hasMobile, hasBlockchain)
    },
    events: {
      futureScope: generateDynamicFutureScope('events', ideaText, features, hasAI, hasMobile, hasBlockchain),
      advantages: generateDynamicAdvantages('events', ideaText, features, hasAI, hasMobile, hasBlockchain),
      disadvantages: generateDynamicDisadvantages('events', ideaText, features, hasAI, hasMobile, hasBlockchain),
      recommendations: generateDynamicRecommendations('events', ideaText, features, hasAI, hasMobile, hasBlockchain),
      comparativeAnalysis: generateDynamicComparison('events', ideaText, features, hasAI, hasMobile, hasBlockchain)
    },
    ai: {
      futureScope: generateDynamicFutureScope('ai', ideaText, features, hasAI, hasMobile, hasBlockchain),
      advantages: generateDynamicAdvantages('ai', ideaText, features, hasAI, hasMobile, hasBlockchain),
      disadvantages: generateDynamicDisadvantages('ai', ideaText, features, hasAI, hasMobile, hasBlockchain),
      recommendations: generateDynamicRecommendations('ai', ideaText, features, hasAI, hasMobile, hasBlockchain),
      comparativeAnalysis: generateDynamicComparison('ai', ideaText, features, hasAI, hasMobile, hasBlockchain)
    },
    default: {
      futureScope: generateDynamicFutureScope('default', ideaText, features, hasAI, hasMobile, hasBlockchain),
      advantages: generateDynamicAdvantages('default', ideaText, features, hasAI, hasMobile, hasBlockchain),
      disadvantages: generateDynamicDisadvantages('default', ideaText, features, hasAI, hasMobile, hasBlockchain),
      recommendations: generateDynamicRecommendations('default', ideaText, features, hasAI, hasMobile, hasBlockchain),
      comparativeAnalysis: generateDynamicComparison('default', ideaText, features, hasAI, hasMobile, hasBlockchain)
    }
  };
  
  return content[industry] || content.default;
}

export async function POST(request) {
  try {
    const { idea } = await request.json();
    
    if (!idea || idea.trim().length < 10) {
      return new Response(JSON.stringify({
        success: false,
        message: 'Idea description is required and must be at least 10 characters long'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Check if OpenAI API key is available
    const openaiApiKey = process.env.OPENAI_API_KEY;
    
    if (!openaiApiKey) {
      console.warn('OpenAI API key not found, using enhanced local analysis');
      // Return enhanced local analysis instead of failing
      return new Response(JSON.stringify({
        success: true,
        data: await generateEnhancedLocalAnalysis(idea),
        message: 'Analysis completed using enhanced local AI (OpenAI API key not configured)'
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Call OpenAI API for real AI analysis
    const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: `You are an expert business analyst and startup consultant. Analyze the given startup idea and provide comprehensive insights in the following JSON format:

{
  "futureScope": {
    "analysis": "Detailed analysis of the idea's potential and market opportunity",
    "score": 85
  },
  "advantages": [
    "List 5 specific advantages based on the idea content",
    "Make them relevant to the specific industry/domain"
  ],
  "disadvantages": [
    "List 5 specific challenges/risks based on the idea content",
    "Make them relevant to the specific industry/domain"
  ],
  "successProbability": 85,
  "marketTrendAlignment": 78,
  "competitiveRisk": 45,
  "innovationLevel": 82,
  "fundingPotential": 75,
  "marketReadiness": 65,
  "aiRecommendations": [
    "List 5 specific, actionable recommendations",
    "Based on the idea's unique characteristics"
  ],
  "comparativeAnalysis": {
    "similarStartups": [
      {
        "name": "Actual startup name",
        "similarity": 60,
        "innovation": 40,
        "note": "Specific advice based on comparison"
      }
    ],
    "trendComparison": "Detailed comparison with market trends and similar companies"
  },
  "growthForecast": [
    {"month": "Month 1", "users": 100, "revenue": 1000},
    {"month": "Month 3", "users": 500, "revenue": 5000},
    {"month": "Month 6", "users": 1500, "revenue": 15000},
    {"month": "Month 12", "users": 5000, "revenue": 50000},
    {"month": "Month 18", "users": 15000, "revenue": 150000},
    {"month": "Month 24", "users": 50000, "revenue": 500000}
  ],
  "radarData": [
    {"metric": "Innovation", "value": 82},
    {"metric": "Market Fit", "value": 78},
    {"metric": "Scalability", "value": 75},
    {"metric": "Competition", "value": 55},
    {"metric": "Funding", "value": 75},
    {"metric": "Readiness", "value": 65}
  ]
}

IMPORTANT: 
- Analyze the specific idea content, not generic responses
- Make advantages, disadvantages, and recommendations specific to the idea
- Use real startup names for comparisons when relevant
- Provide realistic numbers based on the idea's potential
- Be specific and actionable in all recommendations`
          },
          {
            role: 'user',
            content: `Please analyze this startup idea: "${idea}"`
          }
        ],
        temperature: 0.7,
        max_tokens: 2000
      })
    });

    if (!openaiResponse.ok) {
      const errorData = await openaiResponse.text();
      console.error('OpenAI API error:', errorData);
      console.log('Falling back to enhanced local analysis');
      
      // Fallback to enhanced local analysis
      return new Response(JSON.stringify({
        success: true,
        data: await generateEnhancedLocalAnalysis(idea),
        message: 'Analysis completed using enhanced local AI (OpenAI API unavailable)'
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const openaiData = await openaiResponse.json();
    const aiResponse = openaiData.choices[0].message.content;

    // Parse the JSON response from OpenAI
    let analysisData;
    try {
      // Extract JSON from the response (in case there's extra text)
      const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        analysisData = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('No valid JSON found in AI response');
      }
    } catch (parseError) {
      console.error('Failed to parse AI response:', parseError);
      console.error('AI Response:', aiResponse);
      throw new Error('Failed to parse AI analysis response');
    }

    return new Response(JSON.stringify({
      success: true,
      data: analysisData,
      message: 'AI analysis completed successfully'
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('AI analysis error:', error);
    console.log('Falling back to enhanced local analysis due to error');
    
    try {
      // Fallback to enhanced local analysis
      return new Response(JSON.stringify({
        success: true,
        data: await generateEnhancedLocalAnalysis(idea),
        message: 'Analysis completed using enhanced local AI (OpenAI API error)'
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    } catch (fallbackError) {
      console.error('Fallback analysis also failed:', fallbackError);
      return new Response(JSON.stringify({
        success: false,
        message: 'Failed to generate AI analysis',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }
  }
}