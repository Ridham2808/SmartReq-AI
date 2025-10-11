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

      {/* Demo */}
      <section id="demo" className="mt-10 sm:mt-16">
        <div className="aspect-video w-full rounded-xl overflow-hidden border bg-black">
          <iframe 
            className="w-full h-full"
            src="https://www.youtube.com/embed/dQw4w9WgXcQ" 
            title="SmartReq AI Demo" 
            frameBorder="0" 
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" 
            allowFullScreen
          />
        </div>
      </section>

      {/* Section 1: Core Features – 2x2 grid */}
      <section className="mt-12 sm:mt-16">
        <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight mb-3">Core Features – Multi-Modal Inputs & Instant Magic</h2>
        <p className="text-gray-700 leading-relaxed mb-6">SmartReq AI’s core NLP engine is highly versatile. Whether you dictate by voice or upload complex PDFs, it deeply analyzes everything. Specially tuned for FinTech, it automatically detects security and compliance requirements. Below are 4 key features that will transform your workflow.</p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8">
          <FeatureCard icon={<MdMic />} title="Voice, Text, and Documents — Handle It All"
            desc="NLP-powered analysis that extracts requirements whether you type text, dictate by voice, or upload PDFs. In FinTech, it parses voice inputs like 'Secure 2FA login with fraud check' and identifies entities."
            bullets={[
              'Voice: Real-time transcription via Browser SpeechRecognition.',
              'Text: Paste emails/docs – OCR for scanned files.',
              'Docs: PDF/Word parse with pdf-parse, chunk long docs for deep analysis.'
            ]}
            fintech="For a banking app, record stakeholder meetings — AI detects mood and analyzes sentiment (positive/negative feedback)."
            benefit="No more manual notes – 30% faster input gathering (Source: EPAM AI in Fintech Report)."
          />

          <FeatureCard icon={<MdFlashOn />} title="User Stories & Process Flows — In One Click"
            desc="Analyze inputs with OpenAI GPT‑4o to generate 5–10 Gherkin stories. Also produces a deep JSON flow with 10–20 nodes for React Flow visualization."
            bullets={[
              'Stories: Full Given-When-Then, fintech compliance nodes.',
              'Flows: Hierarchical, color-coded (green success, red error).',
              'Speed: <3s simple inputs, streaming for partial results.'
            ]}
            fintech="Loan approval with KYC: Start -> KYC Verify -> Credit Score Check -> Approve/Deny."
            benefit="Reduces errors by 40% (Source: Apriorit Fintech Automation Guide)."
          />

          <FeatureCard icon={<MdEdit />} title="Drag-and-Drop Flows — Collaborate in Real Time"
            desc="Interactive diagrams with React Flow; drag, edit, and zoom nodes. Team collaboration via Socket.io – changes sync instantly. Dagre auto-layout."
            bullets={[
              'Interactivity: Add/delete nodes, tooltips with descriptions.',
              'Hierarchy: Groups for sub-flows like 2FA.',
              "Collab: Emit 'flow-update', multi-user editing."
            ]}
            fintech="Edit the decision node in a fraud-detection flow ('If IP suspicious?') – OpenAI re-validates with suggestions."
            benefit="Enhances collaboration, 25% better stakeholder buy-in (Source: IBM Collaboration Tools Study)."
          />

          <FeatureCard icon={<MdSync />} title="Jira, CRM, ERP — Sync Everything"
            desc="Push stories to Jira via API, pull data from ERPs for custom flows. RegTech compliance auto-check."
            bullets={[
              'Jira: Create issues from stories, sync flows as attachments.',
              'Others: CRM (Salesforce), ERP for finance rules.',
              'Compliance: AI monitors regs changes in real-time.'
            ]}
            fintech="Convert generated stories into Jira tickets – auto-assign to devs and track progress."
            benefit="Smooth workflows, 20% faster project kickoff (Source: EPAM Integration Best Practices)."
          />
        </div>
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

      {/* Section 3: Best Practices Integration */}
      <section className="mt-12 sm:mt-16">
        <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight mb-3">Best Practices Integration</h2>
        <p className="text-gray-700 leading-relaxed mb-6">SmartReq AI is not just a tool; it’s a companion for best practices. It amplifies proven methods with AI to ensure ethical and scalable adoption.</p>

        <div className="divide-y rounded-xl border overflow-hidden">
          <AccordionItem title="Start Small & Scale" desc="Focus on repetitive tasks — requirement elicitation. Pilot with one project, then auto‑scale to the enterprise.">
            <Tips items={[
              'Identify high‑impact processes (e.g., KYC requirements).',
              'Measure ROI with built‑in analytics.'
            ]} />
          </AccordionItem>
          <AccordionItem title="Data Quality First" desc="Clean data for AI — validate inputs and anonymize PII.">
            <Tips items={[
              'Integrate with existing tools.',
              'Phased rollout for smooth adoption.'
            ]} />
          </AccordionItem>
          <AccordionItem title="Ethical AI & Upskilling" desc="Bias‑free flows and team training modules.">
            <Tips items={[
              'Explainable AI (SHAP for decisions).',
              'Reskill BAs for AI oversight.'
            ]} />
          </AccordionItem>
          <AccordionItem title="Monitor & Optimize" desc="Real‑time metrics — flow accuracy score.">
            <Tips items={[
              'Use AI for sentiment analysis on feedback.',
              'Auto‑optimize prompts based on usage.'
            ]} />
          </AccordionItem>
          <AccordionItem title="Collaborate Cross-Team" desc="Real-time edits with Socket.io.">
            <Tips items={[
              'AI for summarizing meetings.',
              'Draft presentations from stories.'
            ]} />
          </AccordionItem>
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

function FlowNode({ x, y, label, success }){
  const style = { left: x, top: y, position: 'absolute', transform: 'translate(-50%, -50%)' }
  const base = 'px-3 py-2 rounded-md text-xs font-medium border'
  const variant = success ? ' bg-green-500 text-white border-green-600' : ' bg-white text-gray-800 border-gray-300'
  return (
    <div className={base + variant} style={style}>
      {label}
    </div>
  )
}

function Connector({ from, to }){
  const [fx, fy] = from.split(',').map(v => parseFloat(v))
  const [tx, ty] = to.split(',').map(v => parseFloat(v))
  const x1 = `${fx}%`; const y1 = `${fy}%`
  const x2 = `${tx}%`; const y2 = `${ty}%`
  return (
    <svg className="absolute inset-0 w-full h-full pointer-events-none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <marker id="arrow" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto" markerUnits="strokeWidth">
          <path d="M0,0 L0,6 L6,3 z" fill="#4b5563" />
        </marker>
      </defs>
      <line x1={x1} y1={y1} x2={x2} y2={y2} stroke="#4b5563" strokeWidth="1.5" markerEnd="url(#arrow)" />
    </svg>
  )
}

function FeatureCard({ icon, title, desc, bullets, fintech, benefit }){
  return (
    <div className="rounded-xl border p-6 hover:shadow-lg transition-all duration-300 hover:scale-[1.02] bg-white">
      <div className="flex items-center gap-3 mb-3 text-black">
        <div className="w-9 h-9 rounded-md bg-gray-100 grid place-content-center text-xl">{icon}</div>
        <h3 className="text-lg font-semibold leading-tight">{title}</h3>
      </div>
      <p className="text-gray-700 leading-relaxed mb-3">{desc}</p>
      <ul className="list-disc pl-5 space-y-1 text-gray-700 mb-3">
        {bullets?.map(b => <li key={b}>{b}</li>)}
      </ul>
      {fintech ? <p className="text-gray-800 mb-2"><span className="font-semibold">Fintech Example:</span> {fintech}</p> : null}
      {benefit ? <p className="text-gray-600 text-sm">{benefit}</p> : null}
    </div>
  )
}

function AdvCard({ icon, title, desc, stat, usecase }){
  return (
    <div className="rounded-xl border p-6 bg-white hover:shadow-lg transition-all">
      <div className="flex items-center gap-3 mb-3">
        <div className="w-9 h-9 rounded-md bg-gray-100 grid place-content-center text-xl">{icon}</div>
        <h3 className="text-lg font-semibold leading-tight">{title}</h3>
      </div>
      <p className="text-gray-700 leading-relaxed mb-2">{desc}</p>
      {usecase ? <p className="text-gray-800 mb-1"><span className="font-semibold">Use Case:</span> {usecase}</p> : null}
      {stat ? <p className="text-gray-600 text-sm">{stat}</p> : null}
    </div>
  )
}

function AccordionItem({ title, desc, children }){
  return (
    <details className="group">
      <summary className="cursor-pointer select-none p-5 bg-white hover:bg-gray-50 flex items-center justify-between">
        <div>
          <h4 className="text-base font-semibold">{title}</h4>
          <p className="text-sm text-gray-600">{desc}</p>
        </div>
        <MdArrowOutward className="opacity-60 group-open:rotate-45 transition-transform" />
      </summary>
      <div className="p-5 bg-white">
        {children}
      </div>
    </details>
  )
}

function Tips({ items }){
  return (
    <ul className="list-disc pl-5 space-y-1 text-gray-700">
      {items?.map(t => <li key={t}>{t}</li>)}
    </ul>
  )
}

function StatCard({ value, label, source }){
  return (
    <div className="rounded-xl border p-6 bg-white text-center">
      <div className="text-4xl font-extrabold tracking-tight">{value}</div>
      <div className="text-gray-800 mt-1">{label}</div>
      <div className="text-sm text-gray-600 mt-1">Source: {source}</div>
    </div>
  )
}

