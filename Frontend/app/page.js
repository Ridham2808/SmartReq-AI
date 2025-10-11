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

      {/* Problem Section */}
      <section className="mb-24">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold mb-4">The Challenge</h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Traditional requirement gathering is slow, error-prone, and frustrating for teams
          </p>
        </div>
        <div className="grid md:grid-cols-3 gap-8">
          {[
            {title: 'Time-Consuming', desc: 'Weeks spent on interviews and documentation', stat: '70%', label: 'Over-budget projects'},
            {title: 'Error-Prone', desc: 'Manual processes lead to ambiguities and mistakes', stat: '40%', label: 'Requirement errors'},
            {title: 'Poor Collaboration', desc: 'Endless revision loops and miscommunication', stat: '30%', label: 'Wasted time'}
          ].map((item)=> (
            <div key={item.title} className="rounded-2xl border-2 border-gray-100 p-8 hover:border-blue-300 hover:shadow-xl transition-all duration-300 bg-white">
              <div className="text-5xl font-bold text-red-500 mb-3">{item.stat}</div>
              <h3 className="font-bold text-xl mb-3">{item.title}</h3>
              <p className="text-gray-600 mb-2">{item.desc}</p>
              <p className="text-sm text-gray-500 italic">{item.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Solution Section */}
      <section className="mb-24 bg-gradient-to-br from-blue-50 to-purple-50 rounded-3xl p-12">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold mb-4">The SmartReq AI Solution</h2>
          <p className="text-xl text-gray-700 max-w-3xl mx-auto">
            AI-powered platform that automates every step of requirement gathering
          </p>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[
            {icon: '🎯', title: 'Smart Input', desc: 'Voice, text, or documents—we handle it all'},
            {icon: '🤖', title: 'AI Generation', desc: 'Instant Gherkin stories and JSON flows'},
            {icon: '✏️', title: 'Interactive Editing', desc: 'Drag-and-drop visual editor'},
            {icon: '🔗', title: 'Integrations', desc: 'Auto-sync with Jira and tools'},
            {icon: '📊', title: 'Analytics', desc: 'Predict gaps and compliance issues'},
            {icon: '🚀', title: 'Fast Results', desc: 'Hours instead of weeks'}
          ].map((item)=> (
            <div key={item.title} className="rounded-xl bg-white p-6 hover:shadow-lg transition-all duration-300 border border-gray-100">
              <div className="text-4xl mb-3">{item.icon}</div>
              <h3 className="font-bold text-lg mb-2">{item.title}</h3>
              <p className="text-gray-600">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How It Works */}
      <section className="mb-24">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold mb-4">How It Works</h2>
          <p className="text-xl text-gray-600">Simple 4-step process to transform your workflow</p>
        </div>
        <div className="grid md:grid-cols-4 gap-6">
          {[
            {num: '1', title: 'Capture', desc: 'Record voice or upload documents', color: 'from-blue-500 to-blue-600'},
            {num: '2', title: 'Generate', desc: 'AI creates stories and flows instantly', color: 'from-purple-500 to-purple-600'},
            {num: '3', title: 'Edit', desc: 'Collaborate on interactive canvas', color: 'from-indigo-500 to-indigo-600'},
            {num: '4', title: 'Deploy', desc: 'Push to Jira and start building', color: 'from-pink-500 to-pink-600'}
          ].map((step)=> (
            <div key={step.num} className="text-center">
              <div className={`w-16 h-16 rounded-full bg-gradient-to-r ${step.color} text-white flex items-center justify-center text-2xl font-bold mx-auto mb-4 shadow-lg`}>
                {step.num}
              </div>
              <h3 className="font-bold text-lg mb-2">{step.title}</h3>
              <p className="text-gray-600">{step.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Testimonials */}
      <section className="mb-24">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold mb-4">Loved by Teams</h2>
          <p className="text-xl text-gray-600">Real results from real users</p>
        </div>
        <div className="grid md:grid-cols-3 gap-8">
          {[
            {quote: 'Made our KYC project 80% faster. The compliance team was impressed!', author: 'Raj Patel', role: 'Fintech PM'},
            {quote: 'Voice input is a game-changer. Now I focus on creative solutions instead of typing.', author: 'Priya Sharma', role: 'Business Analyst'},
            {quote: 'Jira integration is seamless. Projects finish weeks ahead of schedule.', author: 'Ahmed Khan', role: 'Dev Lead'}
          ].map((testimonial)=> (
            <div key={testimonial.author} className="rounded-2xl bg-white border-2 border-gray-100 p-8 hover:border-blue-300 hover:shadow-xl transition-all duration-300">
              <div className="text-4xl mb-4">💬</div>
              <p className="text-gray-700 italic mb-6">"{testimonial.quote}"</p>
              <div>
                <div className="font-bold">{testimonial.author}</div>
                <div className="text-sm text-gray-600">{testimonial.role}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Final CTA */}
      <section className="rounded-3xl bg-gradient-to-r from-blue-600 to-purple-600 p-12 text-center text-white">
        <h2 className="text-4xl font-bold mb-4">Ready to Transform Your Workflow?</h2>
        <p className="text-xl mb-8 max-w-2xl mx-auto opacity-90">
          Join 500+ teams already saving time and delivering better results with AI
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link href="/auth/register" className="px-8 py-4 rounded-xl bg-white text-blue-600 font-bold hover:shadow-2xl hover:scale-105 transition-all duration-300">
            Start Free Trial
          </Link>
          <Link href="/features" className="px-8 py-4 rounded-xl border-2 border-white text-white font-bold hover:bg-white hover:text-blue-600 transition-all duration-300">
            Schedule Demo
          </Link>
        </div>
      </section>
    </main>
  )
}