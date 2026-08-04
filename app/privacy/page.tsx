"use client"

import React, { useState } from "react"
import Link from "next/link"
import { SiteHeader } from "@/components/site-header"
import {
  Shield,
  Database,
  Eye,
  Lock,
  Globe,
  Cookie,
  Upload,
  Sparkles,
  Share2,
  Mail,
  ChevronDown,
  FileText
} from "lucide-react"

// ── Table of Contents Section IDs ──────────────────────────────
const sections = [
  { id: "information-we-collect", label: "Information We Collect", icon: Database },
  { id: "how-we-use-information", label: "How We Use Your Information", icon: Eye },
  { id: "ai-data-processing", label: "AI & Data Processing", icon: Sparkles },
  { id: "third-party-services", label: "Third-Party Services", icon: Globe },
  { id: "cookies-and-storage", label: "Cookies & Local Storage", icon: Cookie },
  { id: "data-sharing-and-export", label: "Data Sharing & Export", icon: Share2 },
  { id: "data-security", label: "Data Security", icon: Lock },
  { id: "file-uploads", label: "File Uploads & Image Processing", icon: Upload },
  { id: "your-rights", label: "Your Rights & Choices", icon: Shield },
  { id: "data-retention", label: "Data Retention", icon: FileText },
  { id: "childrens-privacy", label: "Children's Privacy", icon: Shield },
  { id: "changes-to-policy", label: "Changes to This Policy", icon: FileText },
  { id: "contact-us", label: "Contact Us", icon: Mail },
]

export default function PrivacyPolicyPage() {
  const [expandedToc, setExpandedToc] = useState(false)

  return (
    <>
      <SiteHeader />
      <main className="min-h-screen bg-white dark:bg-slate-950 pt-28 sm:pt-32 pb-20">
        <div className="max-w-3xl mx-auto px-5 sm:px-8">

          {/* ── Header ──────────────────────────────────────── */}
          <div className="mb-14">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 text-xs font-semibold tracking-wide uppercase mb-6">
              <Shield className="w-3.5 h-3.5" />
              Legal
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white mb-4 leading-tight">
              Privacy Policy
            </h1>
            <p className="text-base text-slate-500 dark:text-slate-400 leading-relaxed max-w-xl">
              This policy explains how Chartography collects, uses, and protects your information when you use our platform.
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

          {/* ── Policy Content ──────────────────────────────── */}
          <article className="space-y-14">

            {/* ── 1. Information We Collect ─────────────────── */}
            <section id="information-we-collect">
              <SectionHeading number="01" icon={Database} color="blue" title="Information We Collect" />

              <H3>Account Information</H3>
              <P>When you create a Chartography account, we collect:</P>
              <Ul>
                <Li><strong>Full name</strong> and <strong>email address</strong> provided during registration.</Li>
                <Li><strong>Password</strong> — securely hashed using industry-standard algorithms. We never store or have access to your plaintext password.</Li>
                <Li><strong>Profile picture</strong> and OAuth identifiers when signing in via third-party providers such as Google.</Li>
              </Ul>

              <H3>User-Generated Content</H3>
              <P>We store content you actively create within the platform, including:</P>
              <Ul>
                <Li>Natural language prompts and pasted datasets (tables, CSV data, text).</Li>
                <Li>Chart data, titles, labels, dataset configurations, and styling choices.</Li>
                <Li>Custom layout templates, rich text notes, canvas annotations, and decorations.</Li>
                <Li>Uploaded images such as backgrounds, logos, and custom icons.</Li>
              </Ul>

              <H3>Technical & Session Data</H3>
              <P>For security and service reliability, we automatically collect:</P>
              <Ul>
                <Li><strong>IP address</strong> and <strong>browser information</strong> for authentication audit logging and rate limiting.</Li>
                <Li>Session timestamps and authentication events (e.g., failed login attempts).</Li>
              </Ul>

              <H3>Client-Side Preferences</H3>
              <P>We store certain preferences locally on your device, including theme preference (light/dark mode), language settings, and cookie consent status.</P>
            </section>

            <Divider />

            {/* ── 2. How We Use Your Information ────────────── */}
            <section id="how-we-use-information">
              <SectionHeading number="02" icon={Eye} color="emerald" title="How We Use Your Information" />
              <P>We use the information we collect to:</P>
              <Ul>
                <Li><strong>Provide and operate the service</strong> — authenticate your identity, display your dashboard, and persist your charts, templates, and projects across sessions.</Li>
                <Li><strong>Power AI chart generation</strong> — process your prompts and pasted data through AI models to generate and modify chart configurations.</Li>
                <Li><strong>Enable export and sharing</strong> — generate downloadable files of your charts and create publicly accessible shared links.</Li>
                <Li><strong>Ensure security</strong> — detect and prevent unauthorized access, rate-limit abuse, and monitor for suspicious authentication activity.</Li>
                <Li><strong>Improve the platform</strong> — understand usage patterns to improve features, fix issues, and enhance the user experience.</Li>
                <Li><strong>Communicate with you</strong> — send transactional emails including verification links and password reset instructions.</Li>
              </Ul>
            </section>

            <Divider />

            {/* ── 3. AI & Data Processing ──────────────────── */}
            <section id="ai-data-processing">
              <SectionHeading number="03" icon={Sparkles} color="violet" title="AI & Data Processing" />
              <P>Chartography uses artificial intelligence models to generate and modify charts from your inputs. When you use our AI features, the following data may be transmitted to our AI service providers:</P>
              <Ul>
                <Li>Your <strong>prompt text</strong> (natural language instructions).</Li>
                <Li><strong>Pasted raw data</strong> such as tables, CSV content, or text paragraphs.</Li>
                <Li><strong>Conversation history</strong> for multi-turn editing context.</Li>
                <Li>Current <strong>chart configuration</strong> when requesting modifications.</Li>
                <Li><strong>Web search results</strong> when real-time search mode is enabled by you.</Li>
              </Ul>

              <P>Your data is processed by third-party AI service providers under their respective privacy policies and data processing agreements. We select providers that maintain appropriate data handling and security standards.</P>
              <P>To protect service availability, AI requests are subject to rate limiting.</P>
            </section>

            <Divider />

            {/* ── 4. Third-Party Services ──────────────────── */}
            <section id="third-party-services">
              <SectionHeading number="04" icon={Globe} color="orange" title="Third-Party Services" />
              <P>We work with trusted third-party service providers to deliver our platform. These providers fall into the following categories:</P>
              <Ul>
                <Li><strong>Cloud infrastructure and database hosting</strong> — for secure data storage, user authentication, and file management.</Li>
                <Li><strong>Authentication providers</strong> — to enable secure sign-in methods including email/password and third-party OAuth (e.g., Google Sign-In).</Li>
                <Li><strong>AI model providers</strong> — to power chart generation and conversational chart editing features.</Li>
                <Li><strong>Web search services</strong> — to fetch real-time information when you enable web search mode for AI prompts.</Li>
                <Li><strong>Stock image providers</strong> — to supply optional background images for chart designs.</Li>
              </Ul>
              <P>Each service provider processes data in accordance with their own privacy policies and applicable data protection regulations. We share only the minimum data necessary for each provider to perform its function.</P>
              <P>We do <strong>not</strong> integrate any third-party web analytics or advertising tracking services. Your browsing activity on Chartography is not monitored by external analytics providers.</P>
            </section>

            <Divider />

            {/* ── 5. Cookies & Local Storage ───────────────── */}
            <section id="cookies-and-storage">
              <SectionHeading number="05" icon={Cookie} color="amber" title="Cookies & Local Storage" />

              <H3>Cookies</H3>
              <P>Chartography uses only <strong>essential, functional cookies</strong> required for the service to operate. We do not use advertising or tracking cookies.</P>

              <div className="mt-5 overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-slate-900/60">
                      <th className="text-left py-3 px-4 font-semibold text-slate-700 dark:text-slate-300 text-xs uppercase tracking-wider">Cookie</th>
                      <th className="text-left py-3 px-4 font-semibold text-slate-700 dark:text-slate-300 text-xs uppercase tracking-wider">Purpose</th>
                      <th className="text-left py-3 px-4 font-semibold text-slate-700 dark:text-slate-300 text-xs uppercase tracking-wider">Duration</th>
                    </tr>
                  </thead>
                  <tbody className="text-slate-600 dark:text-slate-400 divide-y divide-slate-100 dark:divide-slate-800/50">
                    <tr>
                      <td className="py-3 px-4 font-mono text-xs text-slate-800 dark:text-slate-300">access_token</td>
                      <td className="py-3 px-4">Session authentication</td>
                      <td className="py-3 px-4">Session</td>
                    </tr>
                    <tr>
                      <td className="py-3 px-4 font-mono text-xs text-slate-800 dark:text-slate-300">refresh_token</td>
                      <td className="py-3 px-4">Token renewal</td>
                      <td className="py-3 px-4">30 days</td>
                    </tr>
                    <tr>
                      <td className="py-3 px-4 font-mono text-xs text-slate-800 dark:text-slate-300">oauth_state</td>
                      <td className="py-3 px-4">CSRF protection for OAuth sign-in</td>
                      <td className="py-3 px-4">10 minutes</td>
                    </tr>
                    <tr>
                      <td className="py-3 px-4 font-mono text-xs text-slate-800 dark:text-slate-300">is_authenticated</td>
                      <td className="py-3 px-4">UI session state</td>
                      <td className="py-3 px-4">15 days</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <H3>Local Storage</H3>
              <P>We use browser local storage for performance and offline functionality:</P>
              <Ul>
                <Li><strong>Work-in-progress caches</strong> — temporary local copies of your active charts and conversations, scoped to your user ID. These expire automatically after 12 hours of inactivity.</Li>
                <Li><strong>Undo/redo history</strong> — stored locally for editor session continuity.</Li>
                <Li><strong>User preferences</strong> — theme, language, and cookie consent status.</Li>
                <Li><strong>Automatic cleanup</strong> — all user-scoped local data is completely cleared upon sign-out.</Li>
              </Ul>
            </section>

            <Divider />

            {/* ── 6. Data Sharing & Export ──────────────────── */}
            <section id="data-sharing-and-export">
              <SectionHeading number="06" icon={Share2} color="cyan" title="Data Sharing & Export" />

              <H3>Public Chart Sharing</H3>
              <P>When you generate a shareable link for a chart, it becomes <strong>publicly accessible</strong> to anyone with the link. Public chart pages display only the chart visualization and do not reveal your account information or raw datasets.</P>

              <H3>Export Downloads</H3>
              <P>You can export your charts as PNG images, SVG vector graphics, or standalone HTML files. Exported files are generated client-side in your browser and downloaded directly to your device — they do not pass through our servers.</P>

              <H3>We Do Not Sell Your Data</H3>
              <P>We do <strong>not</strong> sell, rent, or trade your personal information or user-generated content to any third party for advertising, marketing, or any other commercial purpose.</P>
            </section>

            <Divider />

            {/* ── 7. Data Security ─────────────────────────── */}
            <section id="data-security">
              <SectionHeading number="07" icon={Lock} color="green" title="Data Security" />
              <P>We take the security of your data seriously and implement the following measures:</P>
              <Ul>
                <Li><strong>Secure token storage</strong> — authentication tokens are stored in HTTP-only cookies to prevent client-side access.</Li>
                <Li><strong>CSRF protection</strong> — OAuth sign-in flows use cryptographic state tokens to prevent cross-site request forgery.</Li>
                <Li><strong>Rate limiting</strong> — applied to authentication endpoints and AI processing routes to prevent brute-force attacks and abuse.</Li>
                <Li><strong>Security audit logging</strong> — failed login attempts, rate-limit violations, and suspicious activity are recorded for security investigations.</Li>
                <Li><strong>Password hashing</strong> — passwords are hashed using industry-standard algorithms before storage.</Li>
                <Li><strong>Role-based access control</strong> — administrative functions are restricted to authorized accounts only.</Li>
              </Ul>
              <P>While we implement robust security practices, no method of electronic transmission or storage is 100% secure. We cannot guarantee absolute security but are committed to protecting your data to the best of our ability.</P>
            </section>

            <Divider />

            {/* ── 8. File Uploads & Image Processing ────────── */}
            <section id="file-uploads">
              <SectionHeading number="08" icon={Upload} color="pink" title="File Uploads & Image Processing" />
              <P>When you upload images (backgrounds, logos, icons) to Chartography:</P>
              <Ul>
                <Li><strong>Supported formats</strong> include PNG, JPG, WebP, SVG, and GIF.</Li>
                <Li><strong>Automatic optimization</strong> — large images may be resized and compressed on our servers before storage to ensure optimal performance.</Li>
                <Li><strong>Secure storage</strong> — uploaded files are stored in secure cloud storage, organized by your user ID.</Li>
                <Li><strong>Deletion</strong> — you can permanently delete uploaded images at any time from your dashboard. Deletion removes files from both our database records and cloud storage.</Li>
              </Ul>
            </section>

            <Divider />

            {/* ── 9. Your Rights & Choices ─────────────────── */}
            <section id="your-rights">
              <SectionHeading number="09" icon={Shield} color="indigo" title="Your Rights & Choices" />
              <P>You have the following rights regarding your personal data:</P>
              <Ul>
                <Li><strong>Access</strong> — view all your charts, templates, and account information through your dashboard at any time.</Li>
                <Li><strong>Correction</strong> — update your profile information, including your name and avatar.</Li>
                <Li><strong>Deletion</strong> — delete individual charts, templates, uploaded images, and conversation histories. To request full account deletion, contact us at the address below.</Li>
                <Li><strong>Export</strong> — download your charts in PNG, SVG, and HTML formats at any time.</Li>
                <Li><strong>Cookie management</strong> — essential authentication cookies are required for the service to function.</Li>
              </Ul>
            </section>

            <Divider />

            {/* ── 10. Data Retention ──────────────────────── */}
            <section id="data-retention">
              <SectionHeading number="10" icon={FileText} color="teal" title="Data Retention" />
              <Ul>
                <Li><strong>Account data</strong> is retained for as long as your account is active.</Li>
                <Li><strong>User-generated content</strong> (charts, templates, conversations) is retained until you delete it or request account deletion.</Li>
                <Li><strong>Security logs</strong> are retained for investigation purposes and may be periodically purged.</Li>
                <Li><strong>Local browser data</strong> automatically expires after 12 hours of inactivity and is fully cleared upon sign-out.</Li>
              </Ul>
            </section>

            <Divider />

            {/* ── 11. Children's Privacy ───────────────────── */}
            <section id="childrens-privacy">
              <SectionHeading number="11" icon={Shield} color="rose" title="Children's Privacy" />
              <P>Chartography is not intended for use by individuals under the age of 13. We do not knowingly collect personal information from children under 13. If you believe a child under 13 has provided us with personal data, please contact us and we will promptly delete the information.</P>
            </section>

            <Divider />

            {/* ── 12. Changes to This Policy ────────────────── */}
            <section id="changes-to-policy">
              <SectionHeading number="12" icon={FileText} color="slate" title="Changes to This Policy" />
              <P>We may update this Privacy Policy from time to time to reflect changes in our practices or legal requirements. When we make significant changes, we will update the &quot;Last Updated&quot; date at the top of this page. We encourage you to review this page periodically.</P>
            </section>

            <Divider />

            {/* ── 13. Contact Us ───────────────────────────── */}
            <section id="contact-us">
              <SectionHeading number="13" icon={Mail} color="indigo" title="Contact Us" />
              <P>If you have any questions, concerns, or requests regarding this Privacy Policy or our data practices, please contact us:</P>
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
              href="/terms"
              className="text-sm font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 transition-colors"
            >
              Read our Terms of Service →
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
