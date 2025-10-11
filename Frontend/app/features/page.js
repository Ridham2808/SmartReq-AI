'use client'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { MdMic, MdFlashOn, MdEdit, MdSync, MdAnalytics, MdPersonalVideo, MdSecurity, MdGavel, MdBarChart, MdEditNote, MdPlayArrow, MdArrowOutward } from 'react-icons/md'

export default function FeaturesPage(){
  return (
    <main className="container mx-auto px-4 py-6 sm:py-10">
      {/* Hero: mirror home spacing and type scale */}
      <section className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">
        <div className="space-y-4 sm:space-y-6">
          <motion.h1 
            initial={{opacity:0,y:10}} 
            animate={{opacity:1,y:0}} 
            className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight leading-tight"
          >
            Revolutionize Requirement Gathering with SmartReq AI
          </motion.h1>
          <motion.p 
            initial={{opacity:0}} 
            animate={{opacity:1}} 
            transition={{delay:0.1}} 
            className="text-base sm:text-lg text-gray-600 leading-relaxed"
          >
            A smart platform for FinTech and AI automation that instantly turns stakeholder inputs into user stories and interactive process flows. Save time from weeks to hours!
          </motion.p>
          <p className="text-gray-700 leading-relaxed">
            Are you a business analyst tired of endless meetings and manual notes? SmartReq AI is powered by NLP and OpenAI, extracting requirements from text, voice, or documents. Instantly generate Gherkin user stories and deep, interactive flows—with real-time editing. For FinTech projects, automate security, compliance, and fraud detection with zero errors.
          </p>
          <div className="flex flex-col sm:flex-row gap-3">
            <Link 
              href="/auth/register" 
              className="px-4 py-3 rounded-md bg-brand text-white text-center font-medium hover:bg-blue-700 transition-colors"
            >
              Get Started Free
            </Link>
            <a 
              href="#demo" 
              className="px-4 py-3 rounded-md border border-gray-300 text-center font-medium hover:bg-gray-50 transition-colors flex items-center justify-center gap-2"
            >
              <MdPlayArrow className="text-xl" /> Watch Demo
            </a>
          </div>
          <div className="text-sm text-gray-600 flex items-center gap-2">
            <span className="inline-flex items-center gap-2">
              <span className="font-semibold">Cut Requirement Time by 47%</span> with AI Prompts
            </span>
            <span className="opacity-70">(Source: IBM Report on AI in Business Analysis)</span>
          </div>
        </div>

        {/* Visual placeholder: animated flow nodes */}
        <motion.div 
          initial={{opacity:0}} 
          animate={{opacity:1}} 
          className="relative w-full h-[300px] sm:h-[380px] lg:h-[420px]"
        >
          <div className="absolute inset-0 rounded-2xl border bg-white overflow-hidden">
            <div className="absolute inset-0 opacity-40 bg-[radial-gradient(circle_at_20%_20%,#22c55e_0%,transparent_25%),radial-gradient(circle_at_80%_30%,#16a34a_0%,transparent_25%),radial-gradient(circle_at_50%_80%,#86efac_0%,transparent_25%)]"></div>
            {/* simple green nodes */}
            <FlowNode x="15%" y="18%" label="Start" />
            <FlowNode x="45%" y="18%" label="KYC" />
            <FlowNode x="75%" y="18%" label="Score" />
            <FlowNode x="45%" y="55%" label="Approve" success />
            <FlowNode x="75%" y="55%" label="Fraud" />
            <Connector from="15,18" to="45,18" />
            <Connector from="45,18" to="75,18" />
            <Connector from="75,18" to="75,55" />
            <Connector from="45,18" to="45,55" />
          </div>
        </motion.div>
      </section>

      {/* Section 2: Advanced AI Automation Features */}
      <section className="mt-12 sm:mt-16">
        <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight mb-3">Advanced AI Automation Features</h2>
        <p className="text-gray-700 leading-relaxed mb-6">Beyond the basics, SmartReq AI’s advanced capabilities offer predictive power and customization. These features give FinTech teams an edge, such as risk prediction and personalized requirements.</p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
          <AdvCard icon={<MdAnalytics />} title="Predictive Insights & Gap Analysis"
            desc="Identify requirement gaps using AI; suggest fixes with OpenAI."
            stat="47% time save (IBM AI Efficiency Study)"
            usecase="Analyze alternative data in credit scoring for more inclusive loans."
          />
          <AdvCard icon={<MdPersonalVideo />} title="Personalization Engine"
            desc="Adapt to stakeholder preferences — visual flows or detailed stories."
            stat="Satisfaction +30% (IBM Customer Experience Report)"
            usecase="Personalized financial advice — analyze voice mood."
          />
          <AdvCard icon={<MdSecurity />} title="Fraud & Risk Mitigation"
            desc="Built‑in ML anomaly detection — flags risk in incomplete requirements."
            stat="False negatives -50% (Gartner Trends)"
            usecase="Real-time fraud escalations in flows."
          />
          <AdvCard icon={<MdGavel />} title="Compliance Automation"
            desc="Monitor regulations with NLP — auto‑add compliance nodes."
            stat="Compliance costs -25% (IBM)"
            usecase="RegTech auto-reports, predictive issue alerts."
          />
          <AdvCard icon={<MdBarChart />} title="Scalable Analytics"
            desc="Dashboards: req accuracy, delay prediction, forecasting."
            stat="Forecasting +35% (Deloitte)"
            usecase="ESG risk assessment in investments."
          />
          <AdvCard icon={<MdEditNote />} title="Custom AI Prompts"
            desc="15+ ready prompts for BAs — summarize gaps and run what‑if scenarios."
            stat="Gathering 47% faster (EPAM Study)"
            usecase="Trading risk what-if automation."
          />
        </div>
      </section>

  
      {/* Section 4: Why Fintech Teams Love It */}
      <section className="mt-12 sm:mt-16">
        <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight mb-3">Why Fintech Teams Love It</h2>
        <p className="text-gray-700 leading-relaxed mb-6">Thousands of teams have adopted SmartReq — these stats and testimonials show why.</p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8 mb-6">
          <StatCard value="92%" label="C-suites adopt AI by 2026" source="Gartner AI Trends" />
          <StatCard value="30%" label="AI cuts costs in customer service" source="IBM Fintech Report" />
          <StatCard value="47%" label="Faster requirement gathering" source="EPAM Automation Study" />
        </div>

        <blockquote className="rounded-xl border p-6 bg-gray-50">
          <p className="text-gray-800 text-lg">“SmartReq moved our banking project from weeks to hours! The deep flows made stakeholder alignment super easy.”</p>
          <footer className="mt-2 text-sm text-gray-600">– Fintech Business Analyst, Rai University Team</footer>
        </blockquote>
      </section>
    </main>
  )
}


