"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { useAuth } from "@clerk/nextjs";
import type { ReactNode } from "react";
import {
  ArrowRight,
  ArrowUpRight,
  Brain,
  Check,
  ChevronLeft,
  ChevronRight,
  Clock3,
  ExternalLink,
  FileText,
  Folder,
  Globe,
  MessageSquareText,
  Mic,
  Pencil,
  Pin,
  RefreshCw,
  Search,
  Shield,
  Sparkles,
  Wand2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  APP_BRAND_LOGO_URL,
  APP_BRAND_SHORT_NAME,
  APP_BRAND_SLOGAN,
} from "@/lib/branding-constants";

const heroChips = [
  "Break down difficult concepts",
  "Study from your own notes",
  "Search and inspect sources",
  "Pin exam prep chats",
  "Organize by course folders",
  "Temporary chat for rough thinking",
];

const heroStats = [
  { label: "Student workflows", value: "Many" },
  { label: "Built-in study tools", value: "Search + Browse" },
  { label: "Product feel", value: "Calm + Fast" },
];

const sections = [
  {
    id: "breakdown",
    kicker: "Understanding",
    title: "Break down complex topics until they feel clear",
    description:
      "Use Fast for quick revisions and Thinker for harder concepts. Ask follow-ups, request step-by-step explanations, and keep clarifying in one thread.",
    bullets: [
      "Model switcher for Fast, Thinker, Pro Thinker, and Lumy modes",
      "Reasoning foldout for deeper explanations on harder prompts",
      "Natural follow-up flow inside the same conversation",
    ],
    reverse: false,
  },
  {
    id: "materials",
    kicker: "Course Content",
    title: "Study from your own lecture files and notes",
    description:
      "Upload slides, PDFs, docs, and images directly in chat and ask Lumy to summarize, simplify, or turn content into revision-friendly structure.",
    bullets: [
      "Attachment support for images, PDF, DOC, DOCX, and TXT",
      "Ask for summaries, key points, and cleaner study notes",
      "Voice input when typing is slow during busy days",
    ],
    reverse: true,
  },
  {
    id: "research",
    kicker: "Research",
    title: "Search the web and inspect websites without context switching",
    description:
      "For essays and reports, use built-in web search and website viewing in the same conversation so your references stay connected to your draft.",
    bullets: [
      "Web search tool integrated into the response flow",
      "Website viewing tool to inspect source pages inline",
      "Continue writing immediately from what you found",
    ],
    reverse: false,
  },
  {
    id: "workspace",
    kicker: "Organization",
    title: "Keep every subject and deadline organized",
    description:
      "Group chats by course folders, pin tomorrow's exam prep, archive finished modules, and use temporary chat for throwaway brainstorming.",
    bullets: [
      "Folders and pinned conversations in the sidebar",
      "Archive for completed assignments and old study threads",
      "Temporary chat for disposable, non-history exploration",
    ],
    reverse: true,
  },
  {
    id: "revision",
    kicker: "Iteration",
    title: "Refine answers before submission",
    description:
      "Edit prompts, regenerate answers, and navigate message branches when comparing explanation styles for homework or project writeups.",
    bullets: [
      "Inline message editing for better prompts",
      "Regenerate replies when you need a different direction",
      "Branch navigation to compare multiple answer paths",
    ],
    reverse: false,
  },

] as const;

const sectionAnimation = {
  initial: { opacity: 0, y: 28 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, amount: 0.25 },
  transition: { duration: 0.65, ease: [0.22, 1, 0.36, 1] },
} as const;

export default function StudentsPage() {
  const { isSignedIn } = useAuth();

  return (
    <main className="relative overflow-hidden bg-[radial-gradient(circle_at_top,rgba(255,215,153,0.22),transparent_34%),linear-gradient(180deg,#fffdf9_0%,#fffaf2_34%,#fff_100%)] text-foreground dark:bg-[radial-gradient(circle_at_top,rgba(240,161,54,0.12),transparent_30%),linear-gradient(180deg,#15120f_0%,#110f0d_40%,#0f0d0c_100%)]">
      <div className="pointer-events-none absolute inset-0 opacity-80">
        <div className="absolute left-[-8%] top-20 h-72 w-72 rounded-full bg-primary/12 blur-3xl dark:bg-primary/16" />
        <div className="absolute right-[-10%] top-56 h-96 w-96 rounded-full bg-amber-200/30 blur-3xl dark:bg-amber-500/10" />
        <div className="absolute inset-x-0 top-0 h-px bg-linear-to-r from-transparent via-primary/30 to-transparent" />
        <div className="absolute inset-0 bg-[linear-gradient(rgba(120,120,120,0.06)_1px,transparent_1px),linear-gradient(90deg,rgba(120,120,120,0.06)_1px,transparent_1px)] bg-[size:72px_72px] [mask-image:radial-gradient(circle_at_center,black,transparent_82%)] dark:bg-[linear-gradient(rgba(255,255,255,0.04)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.04)_1px,transparent_1px)]" />
      </div>

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <TopBar />

        <section className="relative py-10 md:py-16 lg:py-20">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
            className="mx-auto flex max-w-5xl flex-col items-center text-center"
          >
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-border/60 bg-background/75 px-4 py-2 text-sm text-muted-foreground shadow-sm backdrop-blur-xl">
              <Sparkles className="h-4 w-4 text-primary" />
              <span>{APP_BRAND_SLOGAN} for students</span>
            </div>

            <h1 className="max-w-4xl text-balance text-5xl font-semibold tracking-tight sm:text-6xl lg:text-7xl">
              You&apos;re not alone at 2am.
              <span className="block bg-linear-to-r from-foreground via-foreground to-primary bg-clip-text text-transparent">
                The study partner that never sleeps.
              </span>
            </h1>

            <p className="mt-6 max-w-2xl text-pretty text-base leading-7 text-muted-foreground sm:text-lg">
              Use Lumy to understand hard concepts, revise from your own notes,
              research in-context, and keep coursework organized without losing focus.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                href={isSignedIn ? "/" : "/sign-in"}
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-primary px-5 py-3 text-sm font-medium text-primary-foreground shadow-[0_18px_50px_-20px_rgba(215,130,28,0.75)] transition-transform duration-300 hover:-translate-y-0.5 hover:bg-primary/90"
              >
                {isSignedIn ? "Open app" : "Sign into Oearol"}
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>

            <div className="mt-8 flex flex-wrap items-center justify-center gap-2">
              {heroChips.map((chip, index) => (
                <motion.span
                  key={chip}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 + index * 0.05, duration: 0.35 }}
                  className="rounded-full border border-border/60 bg-background/80 px-3 py-1.5 text-xs font-medium text-muted-foreground shadow-sm backdrop-blur-xl"
                >
                  {chip}
                </motion.span>
              ))}
            </div>

            <div className="mt-8 flex flex-wrap items-center justify-center gap-6 text-sm text-muted-foreground">
              {heroStats.map((stat) => (
                <div key={stat.label} className="text-center">
                  <div className="text-2xl font-semibold text-foreground">{stat.value}</div>
                  <div>{stat.label}</div>
                </div>
              ))}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 32 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.15 }}
            className="mt-14"
          >
            <HeroPreview />
          </motion.div>
        </section>

        <section id="student-features" className="relative pb-20 md:pb-24 lg:pb-28">
          <div className="mx-auto max-w-6xl space-y-8 md:space-y-10">
            {sections.map((section) => (
              <motion.div
                key={section.id}
                {...sectionAnimation}
                className={cn(
                  "grid items-center gap-6 rounded-[2rem] border border-border/60 bg-background/70 p-5 shadow-[0_30px_90px_-55px_rgba(24,24,27,0.32)] backdrop-blur-xl dark:bg-card/55 dark:shadow-[0_35px_100px_-55px_rgba(0,0,0,0.8)] md:gap-10 md:p-8 lg:grid-cols-[0.95fr_1.05fr] lg:p-10",
                  section.reverse && "lg:grid-cols-[1.05fr_0.95fr]"
                )}
              >
                <div className={cn(section.reverse && "lg:order-2")}>
                  <span className="inline-flex rounded-full border border-border/70 bg-secondary px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                    {section.kicker}
                  </span>
                  <h2 className="mt-4 max-w-xl text-3xl font-semibold tracking-tight md:text-4xl">
                    {section.title}
                  </h2>
                  <p className="mt-4 max-w-xl text-base leading-7 text-muted-foreground">
                    {section.description}
                  </p>
                  <div className="mt-6 space-y-3">
                    {section.bullets.map((bullet) => (
                      <div
                        key={bullet}
                        className="flex items-start gap-3 rounded-2xl border border-border/60 bg-background/80 px-4 py-3 text-sm text-muted-foreground shadow-sm"
                      >
                        <span className="mt-0.5 inline-flex h-5 w-5 items-center justify-center rounded-full bg-primary/15 text-primary">
                          <Check className="h-3.5 w-3.5" />
                        </span>
                        <span>{bullet}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className={cn("min-w-0", section.reverse && "lg:order-1")}>
                  <FeatureVisual id={section.id} />
                </div>
              </motion.div>
            ))}
          </div>
        </section>

        <section className="relative pb-16 md:pb-20">
          <motion.div
            {...sectionAnimation}
            className="relative overflow-hidden rounded-[2.25rem] border border-border/60 bg-[linear-gradient(135deg,rgba(255,255,255,0.82),rgba(255,250,242,0.9))] px-6 py-10 shadow-[0_30px_100px_-60px_rgba(24,24,27,0.4)] backdrop-blur-xl dark:bg-[linear-gradient(135deg,rgba(28,24,20,0.9),rgba(18,16,14,0.88))] dark:shadow-[0_35px_110px_-60px_rgba(0,0,0,0.85)] md:px-10 md:py-12"
          >
            <div className="absolute inset-y-0 right-0 hidden w-1/2 bg-[radial-gradient(circle_at_center,rgba(239,165,52,0.15),transparent_62%)] dark:bg-[radial-gradient(circle_at_center,rgba(239,165,52,0.12),transparent_62%)] lg:block" />
            <div className="relative flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
              <div className="max-w-2xl">
                <span className="inline-flex rounded-full border border-border/70 bg-background/75 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                  Start now
                </span>
                <h2 className="mt-4 text-3xl font-semibold tracking-tight md:text-4xl">
                  One place for understanding, revision, and delivery.
                </h2>
                <p className="mt-4 text-base leading-7 text-muted-foreground">
                  Use Lumy as your daily study workspace, from first confusion to final draft.
                </p>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row">
                <Link
                  href={isSignedIn ? "/" : "/sign-in"}
                  className="inline-flex items-center justify-center gap-2 rounded-2xl bg-primary px-5 py-3 text-sm font-medium text-primary-foreground shadow-[0_18px_50px_-20px_rgba(215,130,28,0.75)] transition-transform duration-300 hover:-translate-y-0.5 hover:bg-primary/90"
                >
                  {isSignedIn ? "Open app" : "Sign into Oearol"}
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>
          </motion.div>
        </section>
      </div>
    </main>
  );
}

function TopBar() {
  const { isSignedIn } = useAuth();

  return (
    <div className="sticky top-0 z-30 pt-4">
      <div className="mx-auto flex max-w-6xl items-center justify-between rounded-full border border-border/60 bg-background/72 px-4 py-3 shadow-sm backdrop-blur-xl">
        <Link href="/students" className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl">
            <Image
              src={APP_BRAND_LOGO_URL}
              alt={`${APP_BRAND_SHORT_NAME} logo`}
              width={28}
              height={28}
              className="h-7 w-7"
            />
          </div>
          <div className="text-2xl font-bold text-foreground">{APP_BRAND_SHORT_NAME}</div>
        </Link>

        <div className="flex items-center gap-6">
          <Link
            href="/landing"
            className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            Landing
          </Link>
          <Link
            href="/upgrade"
            className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            Pricing
          </Link>

          <Link
            href={isSignedIn ? "/" : "/sign-in"}
            className="inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            {isSignedIn ? "Open app" : "Sign in"}
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}

function HeroPreview() {
  return (
    <div className="overflow-hidden rounded-[2.25rem] border border-border/60 bg-background/75 p-3 shadow-[0_40px_110px_-65px_rgba(24,24,27,0.5)] backdrop-blur-2xl dark:bg-card/60 dark:shadow-[0_42px_120px_-65px_rgba(0,0,0,0.85)] md:p-4">
      <div className="grid gap-3 lg:grid-cols-[260px_minmax(0,1fr)]">
        <div
          className="rounded-[1.75rem] border border-border/70 bg-sidebar p-4 shadow-sm"
        >
          <div className="flex items-center justify-between">
            <div className="text-lg font-semibold">{APP_BRAND_SHORT_NAME}</div>
            <div className="rounded-xl bg-accent px-2 py-1 text-xs text-muted-foreground">
              Student
            </div>
          </div>

          <div className="mt-4 rounded-2xl bg-primary px-3 py-3 text-sm font-medium text-primary-foreground shadow-sm">
            + New Study Chat
          </div>

          <div className="mt-5 space-y-4">
            <SidebarBlock
              title="Folders"
              items={[
                { label: "Physics 201", tone: "amber" },
                { label: "Calculus II", tone: "emerald" },
                { label: "Thesis notes", tone: "slate" },
              ]}
            />
            <SidebarBlock
              title="Pinned"
              items={[
                { label: "Tomorrow: exam prep", icon: <Pin className="h-3.5 w-3.5" /> },
                { label: "Lab viva Q&A", icon: <Pin className="h-3.5 w-3.5" /> },
              ]}
            />
            <SidebarBlock
              title="Recent"
              items={[
                { label: "Lab report draft" },
                { label: "Essay draft structure" },
                { label: "Lecture 8 summary" },
              ]}
            />
          </div>
        </div>

        <div
          className="rounded-[1.75rem] border border-border/70 bg-card px-4 py-4 shadow-sm md:px-5"
        >
          <div className="flex items-center justify-between border-b border-border/70 pb-4">
            <div>
              <div className="text-sm font-medium text-foreground">Exam prep: Fourier Transform</div>
              <div className="text-xs text-muted-foreground">Need clear intuition + formula usage</div>
            </div>
            <div className="rounded-full border border-border/70 bg-background px-3 py-1 text-xs text-muted-foreground">
              Thinker
            </div>
          </div>

          <div className="space-y-4 py-5">
            <div className="flex justify-end">
              <div className="max-w-[70%] rounded-2xl rounded-br-md bg-primary px-4 py-3 text-sm leading-6 text-primary-foreground shadow-sm">
                Break down Fourier Transform like I am revising tonight. Start with intuition, then formulas, then one solved-style example.
              </div>
            </div>

            <div className="rounded-2xl border border-border/70 bg-background px-4 py-4 shadow-sm">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Brain className="h-4 w-4" />
                Thinking
              </div>
              <div className="mt-3 grid gap-2">
                <AnimatedLine className="w-[82%]" />
                <AnimatedLine className="w-[68%]" delay={0.2} />
                <AnimatedLine className="w-[58%]" delay={0.35} />
              </div>
            </div>

            <div className="rounded-2xl border border-border/70 bg-card px-4 py-4 shadow-sm">
              <div className="text-sm leading-7 text-foreground">
                Great revision plan: intuition first (frequency view), then the transform pair,
                then one example step-by-step so you can repeat the method in exam conditions.
              </div>
              <div className="mt-4 flex flex-wrap gap-2 text-xs text-muted-foreground">
                {[
                  "Regenerate",
                  "Edit",
                  "Branch",
                  "Message info",
                ].map((item) => (
                  <span
                    key={item}
                    className="rounded-full border border-border/70 bg-background px-3 py-1.5"
                  >
                    {item}
                  </span>
                ))}
              </div>
            </div>
          </div>

          <ComposerMock />
        </div>
      </div>
    </div>
  );
}

function FeatureVisual({ id }: { id: (typeof sections)[number]["id"] }) {
  if (id === "breakdown") return <BreakdownVisual />;
  if (id === "materials") return <MaterialsVisual />;
  if (id === "research") return <ResearchVisual />;
  if (id === "workspace") return <WorkspaceVisual />;
  if (id === "revision") return <RevisionVisual />;
  return <WorkspaceVisual />;
}

function SidebarBlock({
  title,
  items,
}: {
  title: string;
  items: Array<{ label: string; tone?: "amber" | "emerald" | "slate"; icon?: ReactNode }>;
}) {
  const tones = {
    amber: "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-200",
    emerald: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-200",
    slate: "bg-slate-200 text-slate-700 dark:bg-slate-500/20 dark:text-slate-200",
  };

  return (
    <div>
      <div className="mb-2 px-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
        {title}
      </div>
      <div className="space-y-1.5">
        {items.map((item) => (
          <div
            key={item.label}
            className="flex items-center gap-2 rounded-xl border border-border/60 bg-background/80 px-3 py-2 text-sm text-foreground shadow-sm"
          >
            {item.icon ? (
              <span className="text-muted-foreground">{item.icon}</span>
            ) : item.tone ? (
              <span
                className={cn(
                  "inline-flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-semibold",
                  tones[item.tone]
                )}
              >
                <Folder className="h-3.5 w-3.5" />
              </span>
            ) : null}
            <span className="truncate">{item.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function ComposerMock() {
  return (
    <div className="rounded-[1.5rem] border border-border/70 bg-background/85 p-3 shadow-sm">
      <div className="rounded-[1.35rem] border border-border/60 bg-card p-3">
        <div className="text-sm text-muted-foreground">
          Ask Lumy to explain, summarize your notes, search sources, or prep revision questions.
        </div>
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap gap-2">
            {["Attach", "Thinker", "Voice"].map((item, index) => (
              <span
                key={item}
                className={cn(
                  "inline-flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-medium",
                  index === 1
                    ? "bg-primary/10 text-primary"
                    : "bg-muted text-muted-foreground"
                )}
              >
                {item === "Voice" && <Mic className="h-3.5 w-3.5" />}
                {item}
              </span>
            ))}
          </div>
          <div className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-sm">
            <ArrowUpRight className="h-4 w-4" />
          </div>
        </div>
      </div>
    </div>
  );
}

function BreakdownVisual() {
  return (
    <FloatingCard className="overflow-hidden">
      <div className="grid gap-3">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm font-semibold">Concept breakdown</div>
            <div className="text-xs text-muted-foreground">From confusion to clarity</div>
          </div>
          <div className="rounded-full border border-border/70 bg-background px-3 py-1 text-xs text-muted-foreground">
            Thinker
          </div>
        </div>

        <div className="flex justify-end">
          <div className="max-w-[70%] rounded-2xl rounded-br-md bg-primary px-4 py-3 text-sm text-primary-foreground">
            Explain Laplace Transform with a simple intuition, then a quick exam-style example.
          </div>
        </div>

        <div className="rounded-2xl border border-border/70 bg-background px-4 py-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Brain className="h-4 w-4" />
            Thought
          </div>
          <div className="mt-3 grid gap-2">
            <AnimatedLine className="w-[82%]" />
            <AnimatedLine className="w-[68%]" delay={0.2} />
            <AnimatedLine className="w-[58%]" delay={0.35} />
          </div>
        </div>

        <div className="rounded-2xl border border-border/70 bg-card px-4 py-4 text-sm leading-7 text-foreground">
          Start by viewing Laplace as a machine that turns hard differential equations into easier algebra. Then convert, solve, and invert back.
        </div>

        <ComposerStrip />
      </div>
    </FloatingCard>
  );
}

function MaterialsVisual() {
  return (
    <FloatingCard className="overflow-hidden">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm font-semibold">Your course files</div>
            <div className="text-xs text-muted-foreground">Study from your own materials</div>
          </div>
          <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
            Attachments
          </span>
        </div>

        <div className="grid gap-2 sm:grid-cols-2">
          {[
            "Lecture-08-slides.pdf",
            "tutorial-notes.docx",
            "formula-sheet.txt",
            "whiteboard-explanation.jpg",
          ].map((file) => (
            <div
              key={file}
              className="flex items-center gap-2 rounded-xl border border-border/70 bg-background px-3 py-3 text-sm"
            >
              <FileText className="h-4 w-4 text-muted-foreground" />
              <span className="truncate">{file}</span>
            </div>
          ))}
        </div>

        <div className="rounded-2xl border border-border/70 bg-card px-4 py-4 text-sm text-muted-foreground">
          “Summarize these slides into a one-night revision sheet with key formulas and common mistakes.”
        </div>
      </div>
    </FloatingCard>
  );
}

function ResearchVisual() {
  return (
    <FloatingCard className="overflow-hidden">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm font-semibold">Search and browse</div>
            <div className="text-xs text-muted-foreground">Essay and report workflow</div>
          </div>
          <div className="flex items-center gap-2 rounded-full border border-border/70 bg-background px-3 py-1 text-xs text-muted-foreground">
            <Search className="h-3.5 w-3.5" />
            Web search
          </div>
        </div>

        <div className="rounded-2xl border border-border/70 bg-background p-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Search className="h-4 w-4" />
            Searched for “recent studies on social media and student attention span”
          </div>
          <div className="mt-4 space-y-3">
            {[
              { title: "Meta-analysis on student screen habits", source: "journal-site.org", date: "Apr 14" },
              { title: "Classroom focus and digital interruption", source: "education-review.edu", date: "Apr 12" },
            ].map((item) => (
              <div
                key={item.title}
                className="rounded-2xl border border-border/70 bg-card p-3 shadow-sm"
              >
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Globe className="h-3.5 w-3.5" />
                  <span>{item.source}</span>
                  <span className="inline-flex items-center gap-1">
                    <Clock3 className="h-3 w-3" />
                    {item.date}
                  </span>
                </div>
                <div className="mt-2 flex items-start justify-between gap-3">
                  <div className="text-sm font-medium leading-6 text-primary">{item.title}</div>
                  <ExternalLink className="mt-1 h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </FloatingCard>
  );
}

function WorkspaceVisual() {
  return (
    <FloatingCard className="overflow-hidden">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm font-semibold">Study workspace</div>
            <div className="text-xs text-muted-foreground">Folders, pinning, archive, temporary</div>
          </div>
          <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
            Organized
          </span>
        </div>

        <div className="grid gap-3 md:grid-cols-[1.05fr_0.95fr]">
          <div className="rounded-2xl border border-border/70 bg-background p-4">
            <div className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              Sidebar
            </div>
            <div className="mt-4 space-y-2">
              {[
                { label: "Pinned: Tomorrow exam prep", icon: <Pin className="h-3.5 w-3.5" /> },
                { label: "Folder: Physics 201", icon: <Folder className="h-3.5 w-3.5" /> },
                { label: "Temporary chat", icon: <Shield className="h-3.5 w-3.5" /> },
                { label: "Archived: completed assignments", icon: <MessageSquareText className="h-3.5 w-3.5" /> },
              ].map((item) => (
                <div
                  key={item.label}
                  className="flex items-center gap-2 rounded-xl border border-border/70 bg-card px-3 py-3 text-sm"
                >
                  <span className="text-muted-foreground">{item.icon}</span>
                  <span>{item.label}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-border/70 bg-background p-4">
            <div className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              Typical actions
            </div>
            <div className="mt-4 space-y-3">
              <div className="rounded-xl border border-border/70 bg-card px-3 py-3 text-sm">
                <div className="font-medium text-foreground">Pin exam-critical chats</div>
                <div className="mt-1 text-muted-foreground">Keep urgent prep threads one click away.</div>
              </div>
              <div className="rounded-xl border border-border/70 bg-card px-3 py-3 text-sm">
                <div className="font-medium text-foreground">Group by subject folders</div>
                <div className="mt-1 text-muted-foreground">Separate physics, math, and project discussions cleanly.</div>
              </div>
              <div className="rounded-xl border border-border/70 bg-card px-3 py-3 text-sm">
                <div className="font-medium text-foreground">Archive finished modules</div>
                <div className="mt-1 text-muted-foreground">Reduce noise while keeping old work accessible.</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </FloatingCard>
  );
}

function RevisionVisual() {
  return (
    <FloatingCard className="overflow-hidden">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm font-semibold">Revision loop</div>
            <div className="text-xs text-muted-foreground">Edit, branch, and compare outputs</div>
          </div>
          <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
            Iteration
          </span>
        </div>

        <div className="flex justify-end">
          <div className="max-w-[74%] rounded-2xl rounded-br-md border border-primary/25 bg-primary/10 px-4 py-3">
            <div className="text-sm text-foreground">
              Make this answer shorter, with bullet points and a final checklist for tonight&apos;s revision.
            </div>
            <div className="mt-3 flex items-center justify-end gap-1 text-primary/80">
              <button className="rounded-lg p-2 transition-colors hover:bg-primary/10">
                <Pencil className="h-4 w-4" />
              </button>
              <button className="rounded-lg p-2 transition-colors hover:bg-primary/10">
                <ChevronLeft className="h-4 w-4" />
              </button>
              <span className="px-1 text-xs">2 / 3</span>
              <button className="rounded-lg p-2 transition-colors hover:bg-primary/10">
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-border/70 bg-card p-4">
          <div className="text-sm leading-7 text-foreground">
            Done. I rewrote it into shorter bullets and added a quick self-check list for pre-exam recall.
          </div>
          <div className="mt-4 flex flex-wrap gap-2 text-xs text-muted-foreground">
            <ActionChip icon={<RefreshCw className="h-3.5 w-3.5" />} label="Regenerate" />
            <ActionChip icon={<Wand2 className="h-3.5 w-3.5" />} label="Reasoning" />
            <ActionChip icon={<MessageSquareText className="h-3.5 w-3.5" />} label="Message info" />
          </div>
        </div>
      </div>
    </FloatingCard>
  );
}



function FloatingCard({ className, children }: { className?: string; children: ReactNode }) {
  return (
    <div
      className={cn(
        "rounded-[1.75rem] border border-border/70 bg-card p-4 shadow-sm md:p-5",
        className
      )}
    >
      {children}
    </div>
  );
}

function AnimatedLine({ className, delay = 0 }: { className?: string; delay?: number }) {
  return (
    <motion.div
      initial={{ opacity: 0.35 }}
      animate={{ opacity: [0.35, 1, 0.35] }}
      transition={{ duration: 1.8, repeat: Infinity, delay, ease: "easeInOut" }}
      className={cn("h-2 rounded-full bg-primary/25", className)}
    />
  );
}

function ComposerStrip() {
  return (
    <div className="rounded-2xl border border-border/70 bg-background px-4 py-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2 text-xs">
          <span className="rounded-full bg-muted px-3 py-1.5 text-muted-foreground">Attach</span>
          <span className="rounded-full bg-primary/10 px-3 py-1.5 text-primary">Thinker</span>
          <span className="rounded-full bg-muted px-3 py-1.5 text-muted-foreground">Voice</span>
        </div>
        <span className="inline-flex h-8 w-8 items-center justify-center rounded-xl bg-primary text-primary-foreground">
          <ArrowUpRight className="h-3.5 w-3.5" />
        </span>
      </div>
    </div>
  );
}

function ActionChip({ icon, label }: { icon: ReactNode; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-border/70 bg-background px-3 py-1.5">
      {icon}
      {label}
    </span>
  );
}


