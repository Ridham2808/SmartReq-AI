'use client'
import { motion } from 'framer-motion'
import Link from 'next/link'

export default function HomePage(){
  return (
    <main className="container mx-auto px-4 py-12 max-w-7xl">
      {/* Hero Section */}
      <section className="grid lg:grid-cols-2 gap-16 items-center mb-24">
        <div className="space-y-6">
          <motion.h1
            initial={{opacity:0,y:20}}
            animate={{opacity:1,y:0}}
            className="text-5xl lg:text-6xl font-bold tracking-tight leading-tight bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent"
          >
            Welcome to SmartReq AI
          </motion.h1>
          <motion.p
            initial={{opacity:0}}
            animate={{opacity:1}}
            transition={{delay:0.1}}
            className="text-xl text-gray-600 leading-relaxed"
          >
            Transform weeks of requirement gathering into hours. From stakeholder inputs to instant user stories and process flows—powered by AI.
          </motion.p>
          <motion.div
            initial={{opacity:0}}
            animate={{opacity:1}}
            transition={{delay:0.2}}
            className="flex flex-col sm:flex-row gap-4 pt-4"
          >
            <Link href="/auth/register" className="px-8 py-4 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 text-white text-center font-semibold hover:shadow-xl hover:scale-105 transition-all duration-300">
              Start Free Trial
            </Link>
            <Link href="/features" className="px-8 py-4 rounded-xl border-2 border-gray-200 text-center font-semibold hover:border-blue-600 hover:bg-blue-50 transition-all duration-300">
              See How It Works
            </Link>
          </motion.div>

          {/* Stats */}
          <div className="flex items-center gap-6 pt-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600">47%</div>
              <div className="text-sm text-gray-600">Faster Delivery</div>
            </div>
            <div className="w-px h-12 bg-gray-200"></div>
            <div className="text-center">
              <div className="text-3xl font-bold text-purple-600">500+</div>
              <div className="text-sm text-gray-600">Teams Using</div>
            </div>
            <div className="w-px h-12 bg-gray-200"></div>
            <div className="text-center">
              <div className="text-3xl font-bold text-indigo-600">40%</div>
              <div className="text-sm text-gray-600">Fewer Errors</div>
            </div>
          </div>
        </div>

        {/* Feature Highlights */}
        <motion.div
          initial={{opacity:0,scale:0.95}}
          animate={{opacity:1,scale:1}}
          transition={{delay:0.3}}
          className="rounded-2xl border-2 border-gray-100 p-8 bg-gradient-to-br from-blue-50 to-purple-50 shadow-xl"
        >
          <div className="grid grid-cols-1 gap-4">
            {[
              {icon: '🎙️', title: 'Voice Input', desc: 'Dictate requirements naturally'},
              {icon: '📄', title: 'Document Upload', desc: 'Parse any format instantly'},
              {icon: '⚡', title: 'AI Generation', desc: 'Stories & flows in seconds'}
            ].map((item)=> (
              <div key={item.title} className="rounded-xl bg-white p-6 hover:shadow-lg transition-all duration-300 border border-gray-100">
                <div className="text-3xl mb-2">{item.icon}</div>
                <h3 className="font-semibold text-lg mb-1">{item.title}</h3>
                <p className="text-sm text-gray-600">{item.desc}</p>
              </div>
            ))}
          </div>
        </motion.div>
      </section>
    </main>
  )
}
