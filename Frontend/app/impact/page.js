"use client"
import { Bar } from 'react-chartjs-2'
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Tooltip, Legend } from 'chart.js'
ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend)

export default function ImpactPage(){
  const data = {
    labels: ['Discovery', 'Drafting', 'Review', 'Handover'],
    datasets: [
      { label: 'Manual (hrs)', data: [12, 10, 6, 4], backgroundColor: 'rgba(203,213,225,0.8)' },
      { label: 'SmartReq AI (hrs)', data: [4, 3, 2, 1], backgroundColor: 'rgba(79,70,229,0.8)' }
    ]
  }
  const options = { responsive: true, plugins: { legend: { position: 'bottom' } } }
  return (
    <main className="container mx-auto px-4 py-6 sm:py-10">
      <div className="text-center mb-8 sm:mb-12">
        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-semibold mb-4">Impact</h1>
        <p className="text-gray-600 text-lg max-w-2xl mx-auto">
          See how SmartReq AI transforms your requirements management process
        </p>
      </div>
      <div className="rounded-xl border p-4 sm:p-6 lg:p-8 bg-white shadow-sm">
        <div className="mb-6">
          <h2 className="text-xl font-semibold mb-2">Time Savings Comparison</h2>
          <p className="text-gray-600">Manual vs SmartReq AI approach</p>
        </div>
        <div className="h-64 sm:h-80 lg:h-96">
          <Bar data={data} options={options} />
        </div>
      </div>
    </main>
  )
}


