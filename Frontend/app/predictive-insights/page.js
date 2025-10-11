'use client'
import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Cell } from 'recharts'
import { toast } from 'react-toastify'
import confetti from 'canvas-confetti'

const RiskTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="p-4 bg-white border-2 border-blue-200 rounded-xl shadow-xl text-sm">
        <p className="font-bold text-blue-900 mb-2 text-base">{label}</p>
        {payload.map((entry, index) => (
          <div key={`item-${index}`} className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: entry.color }}></div>
            <span className="text-gray-700">Risk Level:</span>
            <span className="font-bold text-blue-900 text-lg">{entry.value}</span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

const LineTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="p-4 bg-white border-2 border-blue-200 rounded-xl shadow-xl text-sm">
        <p className="font-bold text-blue-900 mb-2 text-base">{label}</p>
        {payload.map((entry, index) => (
          <div key={`item-${index}`} className="flex items-center gap-2 mb-1">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: entry.color }}></div>
            <span className="text-gray-700">{entry.name}:</span>
            <span className="font-bold text-blue-900 text-lg">{entry.value}</span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

export default function PredictiveInsightsPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [insights, setInsights] = useState(null)
  const [currentTipIndex, setCurrentTipIndex] = useState(0)
  const [simulatorData, setSimulatorData] = useState({
    delay: 0,
    domain: 'FinTech'
  })

  // Mock data for visualizations
  const requirementTrends = [
    { month: 'Jan', trend: 45, prediction: 45 },
    { month: 'Feb', trend: 52, prediction: 52 },
    { month: 'Mar', trend: 48, prediction: 48 },
    { month: 'Apr', trend: 61, prediction: 61 },
    { month: 'May', trend: 55, prediction: 55 },
    { month: 'Jun', trend: 67, prediction: 67 },
    { month: 'Jul', trend: 72, prediction: 72 },
    { month: 'Aug', trend: 68, prediction: 68 },
    { month: 'Sep', trend: 75, prediction: 75 },
    { month: 'Oct', trend: 82, prediction: 82 },
    { month: 'Nov', trend: 78, prediction: 78 },
    { month: 'Dec', trend: 85, prediction: 85 }
  ]

  const domainHeatmapData = [
    { domain: 'FinTech', popularity: 85, forecast: 92 },
    { domain: 'Healthcare', popularity: 72, forecast: 78 },
    { domain: 'E-commerce', popularity: 68, forecast: 71 },
    { domain: 'Education', popularity: 55, forecast: 62 },
    { domain: 'Manufacturing', popularity: 48, forecast: 52 }
  ]

  const riskProjection = [
    { category: 'UI/UX', risk: 0.2, color: '#10b981' },
    { category: 'Backend', risk: 0.6, color: '#f59e0b' },
    { category: 'API', risk: 0.8, color: '#ef4444' },
    { category: 'Security', risk: 0.4, color: '#8b5cf6' },
    { category: 'Database', risk: 0.3, color: '#06b6d4' }
  ]

  const aiTips = [
    "Security modules will rise by 22% next quarter.",
    "API complexity is trending upward - consider microservices.",
    "UI/UX requirements are stabilizing at 15% growth.",
    "Backend scalability concerns are increasing by 18%.",
    "Database optimization needs are rising by 12%.",
    "Mobile-first approaches are gaining 25% more traction."
  ]

  // Load initial insights
  useEffect(() => {
    loadInsights()
  }, [])

  // Rotate AI tips
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTipIndex((prev) => (prev + 1) % aiTips.length)
    }, 4000)
    return () => clearInterval(interval)
  }, [aiTips.length])

  const loadInsights = async () => {
    setIsLoading(true)
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500))
      
      setInsights({
        forecast: requirementTrends,
        domainInsights: [
          "Security requirements expected to rise by 27%",
          "Automation trends stable",
          "Mobile-first approaches gaining traction",
          "API complexity increasing by 15%"
        ],
        riskProjection: riskProjection,
        aiTips: aiTips
      })
      
      toast.success('✨ Predictive insights generated successfully!', {
        position: "top-right",
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
      })
    } catch (error) {
      toast.error('Failed to load insights')
    } finally {
      setIsLoading(false)
    }
  }

  const regenerateInsights = async () => {
    setIsLoading(true)
    
    // Trigger confetti animation
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 }
    })
    
    try {
      await new Promise(resolve => setTimeout(resolve, 2000))
      await loadInsights()
    } finally {
      setIsLoading(false)
    }
  }

  const predictWithSimulator = async () => {
    setIsLoading(true)
    
    // Trigger confetti animation
    confetti({
      particleCount: 50,
      spread: 50,
      origin: { y: 0.8 }
    })
    
    try {
      await new Promise(resolve => setTimeout(resolve, 1500))
      
      // Simulate prediction based on simulator data
      const adjustedTrends = requirementTrends.map(item => ({
        ...item,
        prediction: item.trend + (simulatorData.delay * 2) + Math.random() * 10
      }))
      
      setInsights(prev => ({
        ...prev,
        forecast: adjustedTrends
      }))
      
      toast.success('🎯 New prediction generated with simulator data!', {
        position: "top-right",
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
      })
    } catch (error) {
      toast.error('Failed to generate prediction')
    } finally {
      setIsLoading(false)
    }
  }

  const exportToPDF = () => {
    toast.success('📄 PDF export initiated!', {
      position: "top-right",
      autoClose: 2000,
      hideProgressBar: false,
      closeOnClick: true,
      pauseOnHover: true,
      draggable: true,
    })
    // PDF export functionality would be implemented here
  }

  return (
    <div className="min-h-screen bg-white">
      {/* AI Forecast Engine Banner */}
      <motion.div
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="bg-gradient-to-r from-emerald-500 to-cyan-500 text-white py-2 px-4 text-center font-semibold relative overflow-hidden"
      >
        <div className="absolute inset-0 bg-gradient-to-r from-emerald-400/20 to-cyan-400/20 animate-pulse"></div>
        <div className="relative z-10 flex items-center justify-center gap-2">
          <span className="text-lg">⚡</span>
          <span>AI Forecast Engine Active</span>
          <div className="w-2 h-2 bg-white rounded-full animate-ping"></div>
        </div>
      </motion.div>

      <div className="container mx-auto px-4 py-8">
        {/* Hero Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <h1 className="text-5xl font-bold text-gray-900 mb-4 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Predictive Insights Hub
          </h1>
          <p className="text-xl text-gray-700 max-w-3xl mx-auto">
            See the Future of Your Projects
          </p>
          <p className="text-lg text-gray-600 mt-4 max-w-4xl mx-auto">
            AI analyzes your historical data to predict emerging trends, risks, and domain shifts. 
            Get ahead of the curve with intelligent forecasting and risk assessment.
          </p>
        </motion.div>

        {/* Graph Cards Section */}
        <div className="grid lg:grid-cols-2 gap-8 mb-8">
          {/* Requirement Trends Line Chart */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-2xl p-6 border border-gray-200 shadow-lg"
          >
            <h3 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
              <span className="text-blue-500">📈</span>
              Requirement Trends Over Time
            </h3>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={insights?.forecast || requirementTrends}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                   <XAxis 
                     dataKey="month" 
                     stroke="#374151" 
                     tick={{ fontSize: 14, fill: '#374151', fontWeight: 'bold' }}
                   />
                   <YAxis 
                     stroke="#374151" 
                     tick={{ fontSize: 14, fill: '#374151', fontWeight: 'bold' }}
                   />
                  <Tooltip content={<LineTooltip />} />
                  <Line 
                    type="monotone" 
                    dataKey="trend" 
                    stroke="#3b82f6" 
                    strokeWidth={3}
                    dot={{ fill: '#3b82f6', strokeWidth: 2, r: 4 }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="prediction" 
                    stroke="#8b5cf6" 
                    strokeWidth={3}
                    strokeDasharray="5 5"
                    dot={{ fill: '#8b5cf6', strokeWidth: 2, r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <div className="flex items-center justify-center gap-6 mt-4 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                <span className="text-gray-600">Historical</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
                <span className="text-gray-600">Predicted</span>
              </div>
            </div>
          </motion.div>

          {/* Domain Popularity Heatmap */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-2xl p-6 border border-gray-200 shadow-lg"
          >
            <h3 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
              <span className="text-orange-500">🔥</span>
              Domain Popularity Forecast
            </h3>
            <div className="space-y-4">
              {domainHeatmapData.map((item, index) => (
                <motion.div
                  key={item.domain}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 + index * 0.1 }}
                  className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200"
                >
                  <span className="text-gray-900 font-medium">{item.domain}</span>
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <span className="text-gray-600 text-sm">Current:</span>
                      <span className="text-blue-600 font-bold">{item.popularity}%</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-gray-600 text-sm">Forecast:</span>
                      <span className="text-purple-600 font-bold">{item.forecast}%</span>
                    </div>
                    <div className="w-16 h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full transition-all duration-1000"
                        style={{ width: `${item.forecast}%` }}
                      ></div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>

        {/* Risk Projection Bar Chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white rounded-2xl p-6 border border-gray-200 shadow-lg mb-8"
        >
          <h3 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
            <span className="text-red-500">⚠️</span>
            Risk Projection by Category
          </h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={insights?.riskProjection || riskProjection} layout="horizontal" margin={{ left: 80, right: 20, top: 20, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis 
                  type="number" 
                  domain={[0, 1]} 
                  stroke="#374151" 
                  tick={{ fontSize: 14, fill: '#374151', fontWeight: 'bold' }}
                />
                <YAxis 
                  dataKey="category" 
                  type="category" 
                  stroke="#374151" 
                  width={80}
                  tick={{ fontSize: 13, fill: '#374151', fontWeight: 'bold' }}
                />
                <Tooltip content={<RiskTooltip />} />
                <Bar dataKey="risk" radius={[0, 4, 4, 0]}>
                  {riskProjection.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* AI Insights Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-2xl p-6 border border-blue-200 shadow-lg mb-8"
        >
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <span className="text-purple-600">🤖</span>
              AI Insights
            </h3>
            <button
              onClick={regenerateInsights}
              disabled={isLoading}
              className="px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 transition-all duration-300 font-semibold"
            >
              {isLoading ? 'Generating...' : 'Regenerate Insights'}
            </button>
          </div>
          
          <div className="bg-white rounded-lg p-4 min-h-[100px] flex items-center justify-center border border-gray-200">
            <AnimatePresence mode="wait">
              <motion.p
                key={currentTipIndex}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.5 }}
                className="text-gray-800 text-lg text-center font-medium"
              >
                {aiTips[currentTipIndex]}
              </motion.p>
            </AnimatePresence>
          </div>
        </motion.div>

        {/* What-If Simulator */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-white rounded-2xl p-6 border border-gray-200 shadow-lg mb-8"
        >
          <h3 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
            <span className="text-yellow-500">🎯</span>
            What-If Simulator
          </h3>
          
          <div className="grid md:grid-cols-3 gap-6">
            <div>
              <label className="block text-gray-900 font-medium mb-2">Project Delay (in days)</label>
              <input
                type="range"
                min="0"
                max="30"
                value={simulatorData.delay}
                onChange={(e) => setSimulatorData(prev => ({ ...prev, delay: parseInt(e.target.value) }))}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
              />
              <div className="text-center text-blue-600 font-bold mt-2">{simulatorData.delay} days</div>
            </div>
            
            <div>
              <label className="block text-gray-900 font-medium mb-2">Domain</label>
              <select
                value={simulatorData.domain}
                onChange={(e) => setSimulatorData(prev => ({ ...prev, domain: e.target.value }))}
                className="w-full p-3 bg-white border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="FinTech">FinTech</option>
                <option value="Healthcare">Healthcare</option>
                <option value="E-commerce">E-commerce</option>
                <option value="Education">Education</option>
                <option value="Manufacturing">Manufacturing</option>
              </select>
            </div>
            
            <div className="flex items-end">
              <button
                onClick={predictWithSimulator}
                disabled={isLoading}
                className="w-full px-6 py-3 bg-gradient-to-r from-yellow-500 to-orange-500 text-white rounded-lg hover:from-yellow-600 hover:to-orange-600 disabled:opacity-50 transition-all duration-300 font-semibold"
              >
                {isLoading ? 'Predicting...' : 'Predict Again'}
              </button>
            </div>
          </div>
        </motion.div>

        {/* Export Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="text-center"
        >
          <button
            onClick={exportToPDF}
            className="px-8 py-4 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-xl hover:from-emerald-600 hover:to-teal-600 transition-all duration-300 font-semibold text-lg shadow-lg hover:shadow-xl"
          >
            📄 Export PDF Report
          </button>
        </motion.div>
      </div>

      {/* Custom CSS for slider */}
      <style jsx>{`
        .slider::-webkit-slider-thumb {
          appearance: none;
          height: 20px;
          width: 20px;
          border-radius: 50%;
          background: linear-gradient(45deg, #3b82f6, #8b5cf6);
          cursor: pointer;
          box-shadow: 0 0 10px rgba(59, 130, 246, 0.5);
        }
        
        .slider::-moz-range-thumb {
          height: 20px;
          width: 20px;
          border-radius: 50%;
          background: linear-gradient(45deg, #3b82f6, #8b5cf6);
          cursor: pointer;
          border: none;
          box-shadow: 0 0 10px rgba(59, 130, 246, 0.5);
        }
      `}</style>
    </div>
  )
}
