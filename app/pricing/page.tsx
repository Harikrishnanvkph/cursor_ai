"use client"

import React, { useState } from "react"
import Link from "next/link"
import { SiteHeader } from "@/components/site-header"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Check,
  X,
  Sparkles,
  Zap,
  Lock,
  ArrowRight,
  HelpCircle,
  ChevronDown,
  CheckCircle2,
  Info,
  BarChart3,
  Globe,
  Terminal,
  Clock,
  ChevronUp
} from "lucide-react"

export default function PricingPage() {
  const [billingPeriod, setBillingPeriod] = useState<"monthly" | "yearly">("monthly")
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(null)

  const toggleFaq = (index: number) => {
    setOpenFaqIndex(openFaqIndex === index ? null : index)
  };

  const plans = [
    {
      name: "Starter",
      description: "Perfect for students, individuals, and exploring visual AI creation.",
      price: {
        monthly: 0,
        yearly: 0,
      },
      features: [
        "Up to 5 saved active charts",
        "Standard visual editor access",
        "AI prompt generation (Gemini 2.5 Flash)",
        "Download responsive HTML packages",
        "Crisp client-side PNG exports",
        "Standard formatting templates",
      ],
      unsupportedFeatures: [
        "Vector SVG exports",
        "Waterfall, Funnel & Gauge plugins",
        "Isometric 3D rendering modes",
        "Universal Image Point plugin",
        "TipTap custom surrounding layouts",
        "Extended Zundo history (50 stacks)",
        "Priority developer support",
      ],
      cta: "Get Started Free",
      ctaLink: "/landing",
      badge: "Free Forever",
      popular: false,
      gradient: "from-slate-500 to-slate-600",
    },
    {
      name: "Professional",
      description: "Best for data analysts, professional designers, and high-impact teams.",
      price: {
        monthly: 19,
        yearly: 15,
      },
      features: [
        "Unlimited saved active charts",
        "Ultra-fast AI prompt (Gemini Pro & DeepSeek R1)",
        "High-fidelity Vector SVG exports",
        "Tiptap rich text surrounding HTML layouts",
        "Waterfall, Funnel, Gauge & Gauge plugins",
        "Universal Image Point icon rendering",
        "Full Isometric 3D rendering modes",
        "Extended Zundo undo/redo history (50 entries)",
        "Automated Supabase database sync snapshots",
        "Priority dedicated client support",
      ],
      unsupportedFeatures: [
        "Custom branded rendering plugins",
        "Enterprise SSO & SAML integrations",
        "Custom API data stream connectors",
      ],
      cta: "Go Professional",
      ctaLink: "/signin",
      badge: "Most Popular",
      popular: true,
      gradient: "from-indigo-500 via-purple-500 to-indigo-600",
    },
    {
      name: "Enterprise",
      description: "Tailored visual assets, robust team workspaces, and custom integrations.",
      price: {
        monthly: "Custom",
        yearly: "Custom",
      },
      features: [
        "Unlimited saved active charts & drafts",
        "Custom team workspaces & permissions",
        "Enterprise SSO, SAML & Okta authentication",
        "Priority dedicated API developer pipelines",
        "Custom branded rendering visual plugins",
        "1-on-1 visual design onboarding sessions",
        "99.9% uptime SLA commitments",
        "Dedicated account developer specialist",
      ],
      unsupportedFeatures: [],
      cta: "Contact Sales",
      ctaLink: "mailto:sales@aichartor.com",
      badge: "Custom Scale",
      popular: false,
      gradient: "from-cyan-500 to-blue-600",
    },
  ]

  const faqs = [
    {
      question: "Can I really create charts using only natural language?",
      answer: "Yes! Our AI-powered parsing engine interprets unstructured Excel copy-pastes, paragraphs, and raw dataset summaries. It resolves coordinates, classifies variables, structures datasets, and immediately generates an interactive chart preview.",
    },
    {
      question: "Can I export my charts as vectors (SVG)?",
      answer: "Absolutely. Vector SVG exports are available on the Professional plan. It allows you to download clean vector graphics that preserve layer groupings, making it exceptionally easy to edit, scale, or polish inside Adobe Illustrator, Figma, or Sketch.",
    },
    {
      question: "How does the cloud synchronization and history stack work?",
      answer: "Every time you save your progress, AIChartor automatically uploads your immutable configurations to our Supabase databases. In the Professional plan, you can easily browse historic version snapshots, compare alterations, and restore any previous workspace state in one click.",
    },
    {
      question: "Is there a limit on AI prompt generation?",
      answer: "Starter accounts get baseline access to Gemini 2.5 Flash. Professional users enjoy high-speed, multi-step conversational edits powered by Gemini 2.5 Pro and DeepSeek R1 for deep reasoning, allowing much more complex dataset formatting without limitations.",
    },
    {
      question: "What visual plugins are included in the Pro tier?",
      answer: "Pro unlocks highly customized plugins including Waterfall charts (mapping financial flows), interactive Funnels, Gauge speeds, and 3D Isometric styles that add deep drop shadows to standard bar/pie layouts. You also get the Tiptap rich-text layout panel to build comprehensive reports around your charts.",
    },
  ]

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950 transition-colors duration-300 flex flex-col">
      <SiteHeader />

      {/* ─── HERO HEADER SECTION ─── */}
      <section className="relative overflow-hidden pt-28 pb-16 sm:pt-36 sm:pb-20 bg-gradient-to-b from-indigo-50/40 via-white to-slate-50 dark:from-slate-950 dark:via-slate-900/50 dark:to-slate-950 transition-colors duration-300">
        {/* Decorative background orbs */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="animate-float-slow absolute -top-24 -left-24 w-[380px] h-[380px] rounded-full bg-indigo-500/10 dark:bg-indigo-600/15 blur-[100px]"></div>
          <div className="animate-float-medium absolute top-1/4 right-0 w-[300px] h-[300px] rounded-full bg-purple-500/10 dark:bg-purple-600/15 blur-[100px]"></div>
          {/* Grid pattern */}
          <div 
            className="absolute inset-0 transition-opacity duration-300 opacity-60"
            style={{
              backgroundImage: `linear-gradient(rgba(148, 163, 184, 0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(148, 163, 184, 0.05) 1px, transparent 1px)`,
              backgroundSize: '40px 40px'
            }}
          ></div>
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-6">
          <Badge className="px-4 py-1.5 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 border-indigo-200/50 dark:border-indigo-500/20 font-semibold shadow-sm">
            Simple Transparent Pricing
          </Badge>
          
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-slate-900 dark:text-white leading-[1.1]">
            Plans for Everyone, from
            <br />
            <span className="bg-gradient-to-r from-indigo-500 via-purple-500 to-cyan-500 dark:from-indigo-400 dark:via-purple-400 dark:to-cyan-400 bg-clip-text text-transparent animate-gradient-x">
              Drafts to Masterpieces
            </span>
          </h1>

          <p className="max-w-2xl mx-auto text-lg text-slate-500 dark:text-slate-400 leading-relaxed font-light">
            All features are completely free during our public beta. Secure your future plan tier details early. Select the ideal structure for your visual data storytelling.
          </p>

          {/* Billing Switcher */}
          <div className="flex justify-center items-center gap-4 pt-4">
            <span className={`text-sm font-semibold transition-colors duration-200 ${billingPeriod === "monthly" ? "text-slate-900 dark:text-white" : "text-slate-400 dark:text-slate-500"}`}>
              Monthly billing
            </span>
            
            <button
              onClick={() => setBillingPeriod(billingPeriod === "monthly" ? "yearly" : "monthly")}
              className="relative inline-flex h-7 w-14 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-300 ease-in-out bg-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:ring-offset-2"
              aria-label="Toggle billing cycle"
            >
              <span
                className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow ring-0 transition duration-300 ease-in-out ${
                  billingPeriod === "yearly" ? "translate-x-7" : "translate-x-0"
                }`}
              />
            </button>

            <span className={`text-sm font-semibold flex items-center gap-1.5 transition-colors duration-200 ${billingPeriod === "yearly" ? "text-slate-900 dark:text-white" : "text-slate-400 dark:text-slate-500"}`}>
              Yearly billing
              <Badge className="bg-emerald-500 text-white border-0 font-bold px-2 py-0.5 text-[10px] rounded-md animate-pulse">
                Save 20%
              </Badge>
            </span>
          </div>
        </div>
      </section>

      {/* ─── PRICING CARDS SECTION ─── */}
      <section className="py-12 bg-white dark:bg-slate-950 transition-colors duration-300 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-3 gap-8 items-stretch">
            {plans.map((plan, index) => {
              const displayPrice = typeof plan.price[billingPeriod] === "number" 
                ? `$${plan.price[billingPeriod]}` 
                : plan.price[billingPeriod];
                
              const annualPretext = billingPeriod === "yearly" && typeof plan.price.yearly === "number";

              return (
                <div
                  key={index}
                  className={`group relative rounded-3xl flex flex-col transition-all duration-300 hover:shadow-xl ${
                    plan.popular
                      ? "bg-slate-50 dark:bg-slate-900/60 border-2 border-indigo-500 dark:border-indigo-400 shadow-lg hover:-translate-y-1.5 z-10"
                      : "bg-white dark:bg-slate-900/40 border border-slate-200/80 dark:border-slate-800/80 hover:border-slate-300 dark:hover:border-slate-700 hover:-translate-y-1 z-0"
                  }`}
                >
                  {/* Decorative glowing gradient elements for Popular plan */}
                  {plan.popular && (
                    <>
                      <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-indigo-500 via-purple-500 to-cyan-500"></div>
                      <div className="absolute top-0 right-0 w-36 h-36 bg-indigo-500/10 dark:bg-indigo-500/20 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none group-hover:scale-110 transition-transform duration-500"></div>
                      <span className="absolute top-6 right-6 bg-gradient-to-r from-indigo-500 to-purple-600 text-white text-[10px] sm:text-xs font-bold px-3.5 py-1 rounded-full uppercase tracking-wider shadow-md">
                        {plan.badge}
                      </span>
                    </>
                  )}

                  {!plan.popular && (
                    <span className="absolute top-6 right-6 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-[10px] sm:text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                      {plan.badge}
                    </span>
                  )}

                  {/* Top Block */}
                  <div className="p-8 sm:p-10 flex-1 space-y-6">
                    <div className="space-y-2">
                      <h3 className="text-2xl font-bold text-slate-900 dark:text-white transition-colors">
                        {plan.name}
                      </h3>
                      <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed font-light min-h-[40px]">
                        {plan.description}
                      </p>
                    </div>

                    <div className="py-2 border-b border-slate-100 dark:border-slate-800/60 transition-colors">
                      <div className="flex items-baseline text-slate-900 dark:text-white transition-colors">
                        <span className="text-5xl font-extrabold tracking-tight">
                          {displayPrice}
                        </span>
                        {typeof plan.price[billingPeriod] === "number" && (
                          <span className="ml-1.5 text-lg font-medium text-slate-500 dark:text-slate-400">
                            /month
                          </span>
                        )}
                      </div>
                      
                      {annualPretext ? (
                        <p className="text-xs text-indigo-600 dark:text-indigo-400 font-medium mt-2">
                          Billed annually (${plan.price.yearly * 12}/yr)
                        </p>
                      ) : (
                        <p className="text-xs text-transparent select-none mt-2">
                          placeholder
                        </p>
                      )}
                    </div>

                    {/* Features list */}
                    <div className="space-y-4 pt-2">
                      <p className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                        What's Included
                      </p>
                      
                      <ul className="space-y-3.5">
                        {plan.features.map((feature, fIndex) => (
                          <li key={fIndex} className="flex items-start text-sm text-slate-600 dark:text-slate-300">
                            <span className="flex-shrink-0 w-5 h-5 rounded-full bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mr-3 mt-0.5 shadow-sm">
                              <Check className="w-3 h-3" strokeWidth={3} />
                            </span>
                            <span className="leading-tight transition-colors">{feature}</span>
                          </li>
                        ))}

                        {plan.unsupportedFeatures.map((feature, fIndex) => (
                          <li key={fIndex} className="flex items-start text-sm text-slate-400 dark:text-slate-600">
                            <span className="flex-shrink-0 w-5 h-5 rounded-full bg-slate-50 dark:bg-slate-800/20 text-slate-300 dark:text-slate-700 flex items-center justify-center mr-3 mt-0.5">
                              <X className="w-2.5 h-2.5" strokeWidth={3} />
                            </span>
                            <span className="leading-tight line-through decoration-slate-200 dark:decoration-slate-800 transition-colors">{feature}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  {/* Bottom CTA Block */}
                  <div className="p-8 sm:p-10 pt-0">
                    <Button
                      asChild
                      className={`w-full py-6 text-sm font-semibold rounded-2xl border transition-all duration-300 transform hover:-translate-y-0.5 group ${
                        plan.popular
                          ? "bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-600 hover:from-indigo-600 hover:via-purple-600 hover:to-indigo-700 border-transparent text-white shadow-lg shadow-indigo-500/20"
                          : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200"
                      }`}
                    >
                      <Link href={plan.ctaLink}>
                        {plan.popular ? <Zap className="w-4 h-4 mr-2 text-indigo-200 group-hover:scale-110 transition-transform" /> : null}
                        {plan.cta}
                        <ArrowRight className="w-4 h-4 ml-2 opacity-60 group-hover:translate-x-1 group-hover:opacity-100 transition-all" />
                      </Link>
                    </Button>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* ─── CORE VALUES & TRUST INDICATORS (Glassmorphism row) ─── */}
      <section className="py-12 bg-slate-50/50 dark:bg-slate-900/30 transition-colors duration-300 relative border-y border-slate-100 dark:border-slate-900">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-3 gap-8">
            <div className="flex gap-4 items-start">
              <div className="w-12 h-12 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-xl flex items-center justify-center shrink-0 shadow-sm text-indigo-500">
                <Globe className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h4 className="font-bold text-slate-900 dark:text-white text-base">Beta Period Free</h4>
                <p className="text-sm text-slate-500 dark:text-slate-400 font-light">Take advantage of all Pro tier features at no cost during our public feedback beta window.</p>
              </div>
            </div>
            
            <div className="flex gap-4 items-start">
              <div className="w-12 h-12 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-xl flex items-center justify-center shrink-0 shadow-sm text-purple-500">
                <Terminal className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h4 className="font-bold text-slate-900 dark:text-white text-base">Full Data Portability</h4>
                <p className="text-sm text-slate-500 dark:text-slate-400 font-light">Export raw configurations or HTML files anytime. Your structured datasets are always wholly owned by you.</p>
              </div>
            </div>

            <div className="flex gap-4 items-start">
              <div className="w-12 h-12 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-xl flex items-center justify-center shrink-0 shadow-sm text-cyan-500">
                <Clock className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h4 className="font-bold text-slate-900 dark:text-white text-base">Cancel Subscriptions Anytime</h4>
                <p className="text-sm text-slate-500 dark:text-slate-400 font-light">Flexible billing packages. Drop to Starter status or adjust your tiers in one click from your profile portal.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── INTERACTIVE FAQ SECTION ─── */}
      <section className="py-20 sm:py-24 bg-white dark:bg-slate-950 transition-colors duration-300">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14 space-y-3">
            <Badge className="px-3.5 py-1 bg-purple-50 dark:bg-purple-500/10 text-purple-700 dark:text-purple-400 border-purple-200/50 dark:border-purple-500/20 font-medium">
              Got Questions?
            </Badge>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              Frequently Asked Questions
            </h2>
            <p className="text-base text-slate-500 dark:text-slate-400 max-w-xl mx-auto font-light">
              Understand billing structures, workspace capabilities, and security details.
            </p>
          </div>

          <div className="space-y-4">
            {faqs.map((faq, index) => {
              const isOpen = openFaqIndex === index;
              return (
                <div
                  key={index}
                  className="rounded-2xl border border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-slate-900/40 overflow-hidden transition-all duration-300"
                >
                  <button
                    onClick={() => toggleFaq(index)}
                    className="w-full flex items-center justify-between p-6 text-left font-semibold text-slate-900 dark:text-white hover:bg-slate-50 dark:hover:bg-slate-900/80 transition-colors focus:outline-none"
                  >
                    <span className="pr-4 leading-snug">{faq.question}</span>
                    <span className={`w-6 h-6 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0 text-slate-500 transition-transform duration-300 ${isOpen ? "rotate-180" : ""}`}>
                      <ChevronDown className="w-4 h-4" />
                    </span>
                  </button>

                  <div
                    className={`transition-all duration-300 ease-in-out overflow-hidden ${
                      isOpen ? "max-h-[300px] border-t border-slate-100 dark:border-slate-800" : "max-h-0"
                    }`}
                  >
                    <p className="p-6 text-sm text-slate-500 dark:text-slate-400 leading-relaxed font-light">
                      {faq.answer}
                    </p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* ─── BOTTOM CTA SECTION ─── */}
      <section className="relative overflow-hidden">
        <div className="bg-gradient-to-br from-indigo-600 via-purple-600 to-indigo-700 py-16 sm:py-20">
          <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-30">
            <div className="absolute inset-0" style={{ backgroundImage: 'radial-gradient(circle at 30% 20%, rgba(255,255,255,0.08), transparent 50%)' }}></div>
            <div className="absolute inset-0" style={{ backgroundImage: 'radial-gradient(circle at 70% 80%, rgba(255,255,255,0.05), transparent 50%)' }}></div>
          </div>

          <div className="relative max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8 space-y-6">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight leading-tight">
              Unleash the Full Power of Visual Data
            </h2>
            <p className="text-lg text-indigo-100 max-w-xl mx-auto font-light leading-relaxed">
              Start parsing structured reports and styling high-definition publications in seconds with the ultimate dual-engine AI platform.
            </p>
            <div className="pt-2">
              <Button asChild size="lg" className="px-8 py-6 text-base font-semibold bg-white text-indigo-700 hover:bg-indigo-50 shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-0.5 rounded-xl">
                <Link href="/landing">
                  <Sparkles className="w-5 h-5 mr-2" />
                  Start Creating Now
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* ─── FOOTER ─── */}
      <footer className="bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white transition-colors duration-300 border-t border-slate-200 dark:border-transparent">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="grid md:grid-cols-4 gap-10">
            {/* Brand */}
            <div className="md:col-span-2">
              <div className="flex items-center space-x-3 mb-5">
                <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                  <BarChart3 className="w-6 h-6 text-white" />
                </div>
                <span className="text-2xl font-bold">AIChartor</span>
              </div>
              <p className="text-slate-500 dark:text-slate-400 max-w-md leading-relaxed text-sm transition-colors font-light">
                Transform your data into stunning visualizations with the power of AI and professional design tools.
                Create, customize, and share charts that tell your story.
              </p>
            </div>

            {/* Quick Links */}
            <div>
              <h3 className="font-semibold mb-5 text-slate-900 dark:text-slate-200 transition-colors">Platform</h3>
              <div className="space-y-3">
                <Link href="/landing" className="block text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-white transition-colors text-sm font-light">AI Chat</Link>
                <Link href="/editor" className="block text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-white transition-colors text-sm font-light">Advanced Editor</Link>
                <Link href="/board" className="block text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-white transition-colors text-sm font-light">Dashboard</Link>
                <Link href="/documentation" className="block text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-white transition-colors text-sm font-light">Documentation</Link>
              </div>
            </div>

            {/* Resources */}
            <div>
              <h3 className="font-semibold mb-5 text-slate-900 dark:text-slate-200 transition-colors">Resources</h3>
              <div className="space-y-3">
                <Link href="/pricing" className="block text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-white transition-colors text-sm font-light">Pricing</Link>
                <Link href="/about" className="block text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-white transition-colors text-sm font-light">About</Link>
                <Link href="/signin" className="block text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-white transition-colors text-sm font-light">Sign In</Link>
                <Link href="/signup" className="block text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-white transition-colors text-sm font-light">Sign Up</Link>
              </div>
            </div>
          </div>

          <div className="border-t border-slate-200 dark:border-slate-800 mt-12 pt-8 flex flex-col md:flex-row items-center justify-between gap-4 transition-colors">
            <div className="text-slate-500 dark:text-slate-400 text-sm transition-colors font-light">
              © {new Date().getFullYear()} AIChartor. All rights reserved.
            </div>
            <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20">
              <div className="w-2 h-2 bg-emerald-400 rounded-full mr-2 animate-pulse"></div>
              All systems operational
            </Badge>
          </div>
        </div>
      </footer>
    </div>
  )
}

