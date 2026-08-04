"use client"

import React, { useState } from "react"
import Link from "next/link"
import { SiteHeader } from "@/components/site-header"
import {
  Scale,
  UserCheck,
  FileText,
  ShieldCheck,
  AlertTriangle,
  Ban,
  Copyright,
  Globe,
  CreditCard,
  XCircle,
  Mail,
  ChevronDown,
  Sparkles,
  Share2
} from "lucide-react"

// ── Table of Contents ──────────────────────────────────────────
const sections = [
  { id: "acceptance", label: "Acceptance of Terms" },
  { id: "eligibility", label: "Eligibility" },
  { id: "account-responsibilities", label: "Account Responsibilities" },
  { id: "permitted-use", label: "Permitted Use" },
  { id: "prohibited-conduct", label: "Prohibited Conduct" },
  { id: "ai-features", label: "AI-Powered Features" },
  { id: "user-content", label: "User Content & Ownership" },
  { id: "sharing-and-export", label: "Sharing & Export" },
  { id: "intellectual-property", label: "Intellectual Property" },
  { id: "pricing-and-billing", label: "Pricing & Billing" },
  { id: "termination", label: "Termination" },
  { id: "disclaimers", label: "Disclaimers" },
  { id: "limitation-of-liability", label: "Limitation of Liability" },
  { id: "changes-to-terms", label: "Changes to These Terms" },
  { id: "contact", label: "Contact Us" },
]

export default function TermsOfServicePage() {
  const [expandedToc, setExpandedToc] = useState(false)

  return (
    <>
      <SiteHeader />
      <main className="min-h-screen bg-white dark:bg-slate-950 pt-28 sm:pt-32 pb-20">
        <div className="max-w-3xl mx-auto px-5 sm:px-8">

          {/* ── Header ──────────────────────────────────────── */}
          <div className="mb-14">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 text-xs font-semibold tracking-wide uppercase mb-6">
              <Scale className="w-3.5 h-3.5" />
              Legal
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white mb-4 leading-tight">
              Terms of Service
            </h1>
            <p className="text-base text-slate-500 dark:text-slate-400 leading-relaxed max-w-xl">
              Please read these terms carefully before using Chartography. By accessing or using our platform, you agree to be bound by these terms.
            </p>
            <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-slate-400 dark:text-slate-500">
              <span>Effective: August 1, 2026</span>
              <span className="w-1 h-1 rounded-full bg-slate-300 dark:bg-slate-700" />
              <span>Last Updated: August 1, 2026</span>
            </div>
          </div>

          {/* ── Table of Contents ───────────────────────────── */}
          <div className="mb-14 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/40 overflow-hidden">
            <button
              onClick={() => setExpandedToc(!expandedToc)}
              className="w-full flex items-center justify-between px-5 py-3.5 text-left sm:cursor-default"
            >
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Table of Contents
              </span>
              <ChevronDown className={`w-4 h-4 sm:hidden text-slate-400 transition-transform duration-200 ${expandedToc ? "rotate-180" : ""}`} />
            </button>
            <nav className={`px-5 pb-4 grid grid-cols-1 sm:grid-cols-2 gap-0.5 ${expandedToc ? "block" : "hidden sm:grid"}`}>
              {sections.map((sec, i) => (
                <a
                  key={sec.id}
                  href={`#${sec.id}`}
                  className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-white dark:hover:bg-slate-800/60 transition-colors"
                >
                  <span className="text-slate-400 dark:text-slate-600 text-xs font-mono w-5">{String(i + 1).padStart(2, "0")}</span>
                  {sec.label}
                </a>
              ))}
            </nav>
          </div>

          {/* ── Terms Content ───────────────────────────────── */}
          <article className="space-y-14">

            {/* ── 1. Acceptance of Terms ───────────────────── */}
            <section id="acceptance">
              <SectionHeading number="01" icon={FileText} color="blue" title="Acceptance of Terms" />
              <P>By accessing or using Chartography (&quot;the Service&quot;), operated by Chartography (&quot;we,&quot; &quot;us,&quot; or &quot;our&quot;), you agree to comply with and be bound by these Terms of Service (&quot;Terms&quot;). If you do not agree to these Terms, you must not access or use the Service.</P>
              <P>These Terms constitute a legally binding agreement between you and Chartography governing your use of the platform, including all features, tools, content, and services offered through <strong>chartography.in</strong>.</P>
            </section>

            <Divider />

            {/* ── 2. Eligibility ──────────────────────────── */}
            <section id="eligibility">
              <SectionHeading number="02" icon={UserCheck} color="emerald" title="Eligibility" />
              <P>You must be at least <strong>13 years of age</strong> to use the Service. By using Chartography, you represent and warrant that you meet this age requirement.</P>
              <P>If you are using the Service on behalf of an organization, you represent that you have the authority to bind that organization to these Terms, and &quot;you&quot; refers to both you individually and the organization.</P>
            </section>

            <Divider />

            {/* ── 3. Account Responsibilities ─────────────── */}
            <section id="account-responsibilities">
              <SectionHeading number="03" icon={ShieldCheck} color="violet" title="Account Responsibilities" />
              <P>When you create an account with Chartography, you agree to:</P>
              <Ul>
                <Li>Provide <strong>accurate details</strong> during registration (such as a valid email address) and maintain your account information.</Li>
                <Li>Maintain the <strong>confidentiality of your account credentials</strong> and not share your login details with others.</Li>
                <Li>Accept <strong>responsibility for all activity</strong> that occurs under your account, whether authorized or not.</Li>
                <Li><strong>Notify us immediately</strong> if you suspect any unauthorized use of your account.</Li>
              </Ul>
              <P>We reserve the right to suspend or terminate accounts that violate these Terms or that we reasonably believe have been compromised.</P>
            </section>

            <Divider />

            {/* ── 4. Permitted Use ────────────────────────── */}
            <section id="permitted-use">
              <SectionHeading number="04" icon={FileText} color="teal" title="Permitted Use" />
              <P>Chartography grants you a limited, non-exclusive, non-transferable, revocable license to access and use the Service for your personal or internal business purposes, subject to these Terms. You may:</P>
              <Ul>
                <Li>Create, edit, and manage charts, infographic templates, and data visualizations.</Li>
                <Li>Use the AI-powered chart generation tools to create and modify visual content.</Li>
                <Li>Export your charts in available formats (PNG, SVG, HTML) for personal or commercial use.</Li>
                <Li>Share your charts via publicly accessible links generated through the platform.</Li>
                <Li>Upload images for use as backgrounds, logos, or icons in your designs.</Li>
              </Ul>
            </section>

            <Divider />

            {/* ── 5. Prohibited Conduct ──────────────────── */}
            <section id="prohibited-conduct">
              <SectionHeading number="05" icon={Ban} color="red" title="Prohibited Conduct" />
              <P>You agree <strong>not</strong> to use the Service to:</P>
              <Ul>
                <Li>Violate any applicable law, regulation, or third-party rights.</Li>
                <Li>Upload, transmit, or generate content that is <strong>illegal, harmful, threatening, abusive, defamatory, or otherwise objectionable</strong>.</Li>
                <Li>Attempt to <strong>reverse-engineer, decompile, or disassemble</strong> any part of the Service or its underlying systems.</Li>
                <Li><strong>Circumvent rate limits</strong>, security measures, or access controls implemented by the platform.</Li>
                <Li>Use automated tools, bots, or scripts to <strong>scrape, crawl, or extract data</strong> from the Service without our prior written consent.</Li>
                <Li><strong>Impersonate</strong> any person or entity, or misrepresent your affiliation with any person or entity.</Li>
                <Li>Introduce <strong>malicious code</strong>, viruses, or other harmful material to the Service.</Li>
                <Li>Use the AI features to generate content that <strong>infringes copyrights</strong>, promotes violence, or produces misleading data visualizations intended to deceive.</Li>
              </Ul>
            </section>

            <Divider />

            {/* ── 6. AI-Powered Features ─────────────────── */}
            <section id="ai-features">
              <SectionHeading number="06" icon={Sparkles} color="violet" title="AI-Powered Features" />
              <P>Chartography offers AI-powered chart generation and editing capabilities. By using these features, you acknowledge and agree that:</P>
              <Ul>
                <Li><strong>AI outputs are generated content.</strong> Charts, data configurations, and suggestions produced by AI models are machine-generated and may contain errors, inaccuracies, or unexpected results. You are responsible for reviewing and validating all AI-generated output before use.</Li>
                <Li><strong>No guarantees of accuracy.</strong> We do not warrant that AI-generated charts will be factually accurate, statistically valid, or suitable for any particular purpose.</Li>
                <Li><strong>Your inputs are processed by third-party AI providers.</strong> Prompts, data, and conversation history you provide may be transmitted to third-party AI service providers for processing. Please refer to our <Link href="/privacy" className="text-indigo-600 dark:text-indigo-400 hover:underline">Privacy Policy</Link> for details.</Li>
                <Li><strong>Rate limits apply.</strong> AI features are subject to usage limits to ensure fair access for all users. Exceeding these limits may result in temporary throttling.</Li>
                <Li><strong>You retain responsibility.</strong> You are solely responsible for how you use, publish, or distribute AI-generated content created through the Service.</Li>
              </Ul>
            </section>

            <Divider />

            {/* ── 7. User Content & Ownership ────────────── */}
            <section id="user-content">
              <SectionHeading number="07" icon={Copyright} color="orange" title="User Content & Ownership" />

              <H3>Your Content</H3>
              <P>You retain <strong>full ownership</strong> of all content you create, upload, or input into Chartography, including charts, datasets, templates, images, annotations, and text. We do not claim ownership of your content.</P>

              <H3>License to Operate</H3>
              <P>By using the Service, you grant Chartography a limited, non-exclusive, worldwide, royalty-free license to host, store, process, and display your content <strong>solely for the purpose of operating and providing the Service</strong> to you. This includes:</P>
              <Ul>
                <Li>Storing your charts and data in our cloud infrastructure.</Li>
                <Li>Processing your inputs through AI models to generate chart configurations.</Li>
                <Li>Rendering your charts on publicly shared pages when you choose to share them.</Li>
              </Ul>
              <P>This license terminates when you delete your content or close your account.</P>

              <H3>Your Responsibility</H3>
              <P>You represent and warrant that you have all necessary rights to the content you upload or input, and that your content does not infringe upon any third-party intellectual property or other rights.</P>
            </section>

            <Divider />

            {/* ── 8. Sharing & Export ────────────────────── */}
            <section id="sharing-and-export">
              <SectionHeading number="08" icon={Share2} color="cyan" title="Sharing & Export" />
              <P>When you use the sharing and export features of Chartography:</P>
              <Ul>
                <Li><strong>Public sharing links</strong> make your chart visible to anyone with the link. You are responsible for the content you choose to share publicly.</Li>
                <Li><strong>Exported files</strong> (PNG, SVG, HTML) are generated in your browser and downloaded to your device. Once exported, these files are under your control and responsibility.</Li>
                <Li>Publicly shared charts display the visualization only and <strong>do not expose your account information</strong> or underlying raw datasets.</Li>
                <Li>You may <strong>revoke public access</strong> to a shared chart at any time by deleting it from your dashboard.</Li>
              </Ul>
            </section>

            <Divider />

            {/* ── 9. Intellectual Property ───────────────── */}
            <section id="intellectual-property">
              <SectionHeading number="09" icon={Copyright} color="amber" title="Intellectual Property" />
              <P>The Service, including its design, logos, trademarks, visual identity, user interface, underlying code, and documentation, is the <strong>intellectual property of Chartography</strong> and is protected by applicable copyright, trademark, and other intellectual property laws.</P>
              <P>You may not copy, modify, distribute, sell, or lease any part of the Service or its branding, nor may you reverse-engineer or attempt to extract the source code, except as permitted by law.</P>
            </section>

            <Divider />

            {/* ── 10. Pricing & Billing ─────────────────── */}
            <section id="pricing-and-billing">
              <SectionHeading number="10" icon={CreditCard} color="green" title="Pricing & Billing" />
              <P>Chartography currently offers features during a <strong>public beta period</strong>. Pricing details for current and future plans are available on our <Link href="/pricing" className="text-indigo-600 dark:text-indigo-400 hover:underline">Pricing page</Link>.</P>
              <Ul>
                <Li><strong>Free tier</strong> — access to core features with defined usage limits as described on the Pricing page.</Li>
                <Li><strong>Paid plans</strong> — if and when paid plans become available, pricing, billing cycles, and payment terms will be clearly communicated before any charges apply.</Li>
                <Li><strong>No surprise charges.</strong> We will never charge your payment method without your explicit consent and prior notification.</Li>
                <Li><strong>Changes to pricing</strong> will be communicated with reasonable advance notice. Continued use after a pricing change constitutes acceptance of the new terms.</Li>
              </Ul>
            </section>

            <Divider />

            {/* ── 11. Termination ───────────────────────── */}
            <section id="termination">
              <SectionHeading number="11" icon={XCircle} color="rose" title="Termination" />
              <P>You may stop using the Service and delete your account at any time by contacting us.</P>
              <P>We reserve the right to <strong>suspend or terminate</strong> your access to the Service, without prior notice, if:</P>
              <Ul>
                <Li>You violate any provision of these Terms.</Li>
                <Li>Your account is used for prohibited or fraudulent activity.</Li>
                <Li>Continued access poses a security risk to the Service or other users.</Li>
                <Li>We are required to do so by law or legal process.</Li>
              </Ul>
              <P>Upon termination, your right to access the Service ceases immediately. We may, at our discretion, retain or delete your data in accordance with our <Link href="/privacy" className="text-indigo-600 dark:text-indigo-400 hover:underline">Privacy Policy</Link>.</P>
            </section>

            <Divider />

            {/* ── 12. Disclaimers ──────────────────────── */}
            <section id="disclaimers">
              <SectionHeading number="12" icon={AlertTriangle} color="amber" title="Disclaimers" />
              <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-500/5 border border-amber-200 dark:border-amber-500/20 mb-4">
                <p className="text-sm font-semibold text-amber-800 dark:text-amber-300 mb-2">Important Notice</p>
                <p className="text-[14px] leading-relaxed text-amber-700 dark:text-amber-400">
                  The Service is provided on an &quot;AS IS&quot; and &quot;AS AVAILABLE&quot; basis, without warranties of any kind, either express or implied.
                </p>
              </div>
              <P>Chartography disclaims all warranties, express or implied, including but not limited to:</P>
              <Ul>
                <Li>Implied warranties of <strong>merchantability, fitness for a particular purpose, and non-infringement</strong>.</Li>
                <Li>Any warranty that the Service will be <strong>uninterrupted, error-free, secure, or free of harmful components</strong>.</Li>
                <Li>Any warranty regarding the <strong>accuracy, reliability, or completeness</strong> of content generated by AI features.</Li>
              </Ul>
              <P>You use the Service at your own risk. We are not responsible for any decisions made based on AI-generated charts, data visualizations, or other outputs from the platform.</P>
            </section>

            <Divider />

            {/* ── 13. Limitation of Liability ─────────── */}
            <section id="limitation-of-liability">
              <SectionHeading number="13" icon={AlertTriangle} color="red" title="Limitation of Liability" />
              <P>Chartography and its team members shall <strong>not be liable</strong> for any indirect, incidental, special, consequential, or punitive damages, including but not limited to:</P>
              <Ul>
                <Li>Loss of data, profits, revenue, or business opportunities.</Li>
                <Li>Service interruptions or data breaches beyond our reasonable control.</Li>
                <Li>Errors or inaccuracies in AI-generated content.</Li>
                <Li>Third-party actions, including those of AI service providers.</Li>
              </Ul>
              <P>Our total aggregate liability for any claims arising out of or relating to the Service is limited to direct damages and shall not exceed the total fees paid by you to access or use the Service.</P>
            </section>

            <Divider />

            {/* ── 14. Changes to These Terms ──────────── */}
            <section id="changes-to-terms">
              <SectionHeading number="14" icon={FileText} color="slate" title="Changes to These Terms" />
              <P>We may revise these Terms from time to time. When we make material changes, we will update the &quot;Last Updated&quot; date at the top of this page and, where appropriate, provide additional notice (such as a banner on the Service).</P>
              <P>Your continued use of the Service after the revised Terms take effect constitutes your acceptance of the changes. If you do not agree to the revised Terms, you should stop using the Service.</P>
            </section>

            <Divider />

            {/* ── 15. Contact Us ─────────────────────── */}
            <section id="contact">
              <SectionHeading number="15" icon={Mail} color="indigo" title="Contact Us" />
              <P>If you have any questions or concerns about these Terms, please contact us:</P>
              <div className="mt-5 p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/40">
                <p className="font-semibold text-slate-900 dark:text-white text-sm mb-2">Chartography</p>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Email:{" "}
                  <a href="mailto:support@chartography.in" className="text-indigo-600 dark:text-indigo-400 hover:underline">
                    support@chartography.in
                  </a>
                </p>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                  Website:{" "}
                  <a href="https://chartography.in" target="_blank" rel="noopener noreferrer" className="text-indigo-600 dark:text-indigo-400 hover:underline">
                    chartography.in
                  </a>
                </p>
              </div>
            </section>

          </article>

          {/* ── Bottom Navigation ───────────────────────── */}
          <div className="mt-16 pt-8 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
            <Link
              href="/privacy"
              className="text-sm font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 transition-colors"
            >
              Read our Privacy Policy →
            </Link>
            <Link
              href="/"
              className="text-sm text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300 transition-colors"
            >
              ← Back to Home
            </Link>
          </div>

        </div>
      </main>
    </>
  )
}


// ── Reusable Sub-components ─────────────────────────────────────

const colorMap: Record<string, string> = {
  blue: "bg-blue-100 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400",
  emerald: "bg-emerald-100 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  violet: "bg-violet-100 dark:bg-violet-500/10 text-violet-600 dark:text-violet-400",
  orange: "bg-orange-100 dark:bg-orange-500/10 text-orange-600 dark:text-orange-400",
  amber: "bg-amber-100 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400",
  cyan: "bg-cyan-100 dark:bg-cyan-500/10 text-cyan-600 dark:text-cyan-400",
  green: "bg-green-100 dark:bg-green-500/10 text-green-600 dark:text-green-400",
  pink: "bg-pink-100 dark:bg-pink-500/10 text-pink-600 dark:text-pink-400",
  indigo: "bg-indigo-100 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400",
  teal: "bg-teal-100 dark:bg-teal-500/10 text-teal-600 dark:text-teal-400",
  rose: "bg-rose-100 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400",
  red: "bg-red-100 dark:bg-red-500/10 text-red-600 dark:text-red-400",
  slate: "bg-slate-100 dark:bg-slate-500/10 text-slate-600 dark:text-slate-400",
}

function SectionHeading({ number, icon: Icon, color, title }: { number: string; icon: React.ElementType; color: string; title: string }) {
  const colors = colorMap[color] || colorMap.slate
  return (
    <div className="flex items-center gap-3 mb-5">
      <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${colors}`}>
        <Icon className="w-[18px] h-[18px]" />
      </div>
      <div>
        <span className="text-xs font-mono text-slate-400 dark:text-slate-600 block leading-none mb-1">{number}</span>
        <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white leading-tight">{title}</h2>
      </div>
    </div>
  )
}

function H3({ children }: { children: React.ReactNode }) {
  return <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 mt-6 mb-2">{children}</h3>
}

function P({ children }: { children: React.ReactNode }) {
  return <p className="text-[15px] leading-relaxed text-slate-600 dark:text-slate-400 mb-3">{children}</p>
}

function Ul({ children }: { children: React.ReactNode }) {
  return <ul className="space-y-2 mb-3">{children}</ul>
}

function Li({ children }: { children: React.ReactNode }) {
  return (
    <li className="flex items-start gap-2.5 text-[15px] leading-relaxed text-slate-600 dark:text-slate-400">
      <span className="mt-2.5 w-1 h-1 rounded-full bg-slate-400 dark:bg-slate-600 flex-shrink-0" />
      <span>{children}</span>
    </li>
  )
}

function Divider() {
  return <hr className="border-slate-200 dark:border-slate-800/60" />
}
