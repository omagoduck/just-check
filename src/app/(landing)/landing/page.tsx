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
  Code2,
  ExternalLink,
  Folder,
  Globe,
  GraduationCap,
  MessageSquareText,
  Mic,
  Monitor,
  Moon,
  Pencil,
  Pin,
  RefreshCw,
  Search,
  Shield,
  Sparkles,
  Sun,
  Wand2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  APP_BRAND_LOGO_URL,
  APP_BRAND_NAME,
  APP_BRAND_SLOGAN,
} from "@/lib/branding-constants";

const heroChips = [
  "Live message stream",
  "Reasoning foldouts",
  "Code rendering",
  "Search and browse",
  "Memory and customization",
  "Folders and pin",
  "Temporary chat",
];

const heroStats = [
  { label: "Real features", value: "12+" },
  { label: "UI moods", value: "Warm" },
  { label: "Primary feel", value: "Fast" },
];

const sections = [
  {
    id: "chat",
    kicker: "Conversation",
    title: "Chat that feels active, not static",
    description:
      "Lumy feels fast and alive from the first prompt, with warm chat surfaces, model switching, attachments, voice input, and answers that stream naturally.",
    bullets: [
      "Streaming responses and compact reasoning states",
      "Model switcher with Fast, Thinker, and Lumy-branded modes",
      "Attachment-ready composer with voice entry",
    ],
    reverse: false,
  },
  {
    id: "craft",
    kicker: "Rendering",
    title: "Beautiful answers for code, docs, and structure",
    description:
      "Markdown, code, notes, and structured output stay readable and polished, so complex answers feel useful instead of noisy.",
    bullets: [
      "Highlighted code blocks with copy affordance",
      "Readable markdown, lists, tables, and notes",
      "Design language pulled from the real response UI",
    ],
    reverse: true,
  },
  {
    id: "search",
    kicker: "Tools",
    title: "Search the web without leaving the thread",
    description:
      "Search feels native inside the conversation, with source cards, live query states, and results that are easy to scan and continue from.",
    bullets: [
      "Clean search results with source citations",
      "Inline search state inside the response flow",
      "Built for research-heavy prompts and follow-up questions",
    ],
    reverse: false,
  },
  {
    id: "browse",
    kicker: "Browsing",
    title: "Open websites and inspect sources inline",
    description:
      "Website viewing deserves its own feature story. It is different from search: once Lumy finds something, it can step into the source and surface what matters.",
    bullets: [
      "Website browsing previews with domain and favicon feel",
      "Inline website result cards shaped like the actual tool UI",
      "Designed for source checking after search",
    ],
    reverse: true,
  },
  {
    id: "control",
    kicker: "Iteration",
    title: "Edit, branch, and regenerate without losing momentum",
    description:
      "Editing, regenerating, and switching branches makes iteration feel fluid, especially when you are refining prompts or comparing different directions.",
    bullets: [
      "Inline message editing",
      "Regenerate and branch controls",
      "Reasoning for complex prompts when needed",
    ],
    reverse: true,
  },
  {
    id: "workspace",
    kicker: "Workspace",
    title: "Keep chats organized with folders, pins, and archive",
    description:
      "Folders, pinned conversations, and archive state make Lumy feel like a calm daily workspace instead of a messy stream of chats.",
    bullets: [
      "Folders and pinned chats in the sidebar",
      "Archived chats for a cleaner active workspace",
      "Product-style sidebar language borrowed from the real app",
    ],
    reverse: false,
  },
  {
    id: "private",
    kicker: "Private",
    title: "Temporary chat for clean, disposable thinking",
    description:
      "Use temporary chat when you want quick exploration, sensitive questions, or rough thinking that should stay separate from your main history.",
    bullets: [
      "Separate from your long-term chat history",
      "Fast access from the main interface header",
      "Perfect for one-off prompts and rough exploration",
    ],
    reverse: true,
  },
  {
    id: "memory",
    kicker: "Memory",
    title: "Persistent memory that you can review and control",
    description:
      "Memory is not just a hidden toggle. You can review, edit, and clean up what Lumy remembers, and even bring context over from another assistant.",
    bullets: [
      "Dedicated memory manager outside the chat thread",
      "Edit or delete remembered details whenever you want",
      "Bring long-term context over from another chatbot",
    ],
    reverse: false,
  },
  {
    id: "customization",
    kicker: "Customization",
    title: "Tune personality, response style, and appearance",
    description:
      "Make Lumy feel more personal by shaping its tone, response style, instructions, and visual appearance.",
    bullets: [
      "AI nickname, tone, and response-length controls",
      "Custom instructions and about-you context",
      "Theme options for system, day, and night",
    ],
    reverse: true,
  },
] as const;

const sectionAnimation = {
  initial: { opacity: 0, y: 28 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, amount: 0.25 },
  transition: { duration: 0.65, ease: [0.22, 1, 0.36, 1] },
} as const;

export default function LandingPage() {
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
              <span>{APP_BRAND_SLOGAN}</span>
            </div>

            <h1 className="max-w-4xl text-balance text-5xl font-semibold tracking-tight sm:text-6xl lg:text-7xl">
              Minimal on the surface.
              <span className="block bg-linear-to-r from-foreground via-foreground to-primary bg-clip-text text-transparent">
                Surprisingly capable underneath.
              </span>
            </h1>

            <p className="mt-6 max-w-2xl text-pretty text-base leading-7 text-muted-foreground sm:text-lg">
              Chat, reason, search, browse, organize, and personalize everything
              in one warm, fast AI workspace built to stay clear even as your
              conversations get deeper.
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

        <section id="features" className="relative pb-20 md:pb-24 lg:pb-28">
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
            className="relative overflow-hidden rounded-[2.25rem] border border-border/60 bg-background/70 px-6 py-10 shadow-[0_30px_100px_-60px_rgba(24,24,27,0.32)] backdrop-blur-xl dark:bg-card/55 dark:shadow-[0_35px_110px_-60px_rgba(0,0,0,0.8)] md:px-10 md:py-12"
          >
            <div className="flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">
              <div className="max-w-2xl">
                <span className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-background/75 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                  <GraduationCap className="h-3.5 w-3.5 text-primary" />
                  Students
                </span>
                <h2 className="mt-4 text-3xl font-semibold tracking-tight md:text-4xl">
                  Lumy works well for students too.
                </h2>
                <p className="mt-4 max-w-xl text-base leading-7 text-muted-foreground">
                  Break down hard concepts, study from your own notes, research with
                  sources in-thread, and keep every subject organized by folder and
                  pinned deadline.
                </p>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row">
                <Link
                  href="/students"
                  className="inline-flex items-center justify-center gap-2 rounded-2xl border border-border/80 bg-background/80 px-5 py-3 text-sm font-medium text-foreground transition-colors hover:bg-secondary"
                >
                  See how students use Lumy
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>
          </motion.div>
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
                  Launch
                </span>
                <h2 className="mt-4 text-3xl font-semibold tracking-tight md:text-4xl">
                  Everything you need in one calm AI workspace.
                </h2>
                <p className="mt-4 text-base leading-7 text-muted-foreground">
                  Fast replies, thoughtful reasoning, strong tools, and controls that
                  keep your work organized without making the interface feel heavy.
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
        <Link href="/landing" className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl">
            <Image
              src={APP_BRAND_LOGO_URL}
              alt={`${APP_BRAND_NAME} logo`}
              width={28}
              height={28}
              className="h-7 w-7"
            />
          </div>
          <div className="text-2xl font-bold text-foreground">{APP_BRAND_NAME}</div>
        </Link>

        <div className="flex items-center gap-6">
          <Link
            href="/students"
            className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            Students
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
    <div
      id="interface"
      className="overflow-hidden rounded-[2.25rem] border border-border/60 bg-background/75 p-3 shadow-[0_40px_110px_-65px_rgba(24,24,27,0.5)] backdrop-blur-2xl dark:bg-card/60 dark:shadow-[0_42px_120px_-65px_rgba(0,0,0,0.85)] md:p-4"
    >
      <div className="grid gap-3 lg:grid-cols-[260px_minmax(0,1fr)]">
        <div
          className="rounded-[1.75rem] border border-border/70 bg-sidebar p-4 shadow-sm"
        >
          <div className="flex items-center justify-between">
            <div className="text-lg font-semibold">Lumy</div>
            <div className="rounded-xl bg-accent px-2 py-1 text-xs text-muted-foreground">
              Alpha
            </div>
          </div>

          <div className="mt-4 rounded-2xl bg-primary px-3 py-3 text-sm font-medium text-primary-foreground shadow-sm">
            + New Chat
          </div>

          <div className="mt-5 space-y-4">
            <SidebarBlock
              title="Folders"
              items={[
                { label: "Product ideas", tone: "amber" },
                { label: "Launch plan", tone: "emerald" },
                { label: "Research", tone: "slate" },
              ]}
            />
            <SidebarBlock
              title="Pinned"
              items={[
                { label: "Product strategy", icon: <Pin className="h-3.5 w-3.5" /> },
                { label: "Reasoning demo", icon: <Pin className="h-3.5 w-3.5" /> },
              ]}
            />
            <SidebarBlock
              title="Recent"
              items={[
                { label: "Quick debugging help" },
                { label: "Web search examples" },
                { label: "Memory manager copy" },
              ]}
            />
          </div>
        </div>

          <div
          className="rounded-[1.75rem] border border-border/70 bg-card px-4 py-4 shadow-sm md:px-5"
        >
          <div className="flex items-center justify-between border-b border-border/70 pb-4">
            <div>
              <div className="text-sm font-medium text-foreground">Weekend trip from Berlin</div>
              <div className="text-xs text-muted-foreground">Cheap, nearby, good weather</div>
            </div>
            <div className="rounded-full border border-border/70 bg-background px-3 py-1 text-xs text-muted-foreground">
              Thinker
            </div>
          </div>

          <div className="space-y-4 py-5">
            <div className="flex justify-end">
              <div className="max-w-[70%] rounded-2xl rounded-br-md bg-primary px-4 py-3 text-sm leading-6 text-primary-foreground shadow-sm">
                I need a cheap weekend trip from Berlin next month. Somewhere with decent weather and direct train access. Help me pick one and outline the plan.
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
                Dresden looks strong for this: 2 hours by direct IC train, hotel options
                under 50 euros a night, and May averages 19 degrees. The old town,
                Zwinger Palace, and a day hike in Saxon Switzerland are all doable in
                a weekend.
              </div>
              <div className="mt-4 flex flex-wrap gap-2 text-xs text-muted-foreground">
                {["Regenerate", "Copy", "Search", "Message info"].map((item) => (
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
  if (id === "chat") return <ChatVisual />;
  if (id === "craft") return <CraftVisual />;
  if (id === "search") return <SearchVisual />;
  if (id === "browse") return <BrowseVisual />;
  if (id === "control") return <ControlVisual />;
  if (id === "workspace") return <WorkspaceVisual />;
  if (id === "private") return <PrivateVisual />;
  if (id === "memory") return <MemoryVisual />;
  if (id === "customization") return <CustomizationVisual />;
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
          Ask Lumy to draft, reason, search, browse, or tidy your context.
        </div>
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap gap-2">
            {["Attach", "Fast", "Voice"].map((item, index) => (
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

function ChatVisual() {
  return (
    <FloatingCard className="overflow-hidden">
      <div className="grid gap-3">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm font-semibold">Conversation flow</div>
            <div className="text-xs text-muted-foreground">Streaming, reasoning, and input</div>
          </div>
          <div className="rounded-full border border-border/70 bg-background px-3 py-1 text-xs text-muted-foreground">
            Live
          </div>
        </div>

        <div className="flex justify-end">
          <div className="max-w-[70%] rounded-2xl rounded-br-md bg-primary px-4 py-3 text-sm text-primary-foreground">
            Summarize what matters most and show me the fastest way forward.
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

        <div className="rounded-2xl border border-border/70 bg-card px-4 py-4">
          <div className="space-y-2 text-sm leading-7 text-foreground">
            <p>Lumy already ships the bones of a strong AI workspace.</p>
            <p>
              Warm cards, rounded interactions, compact utility, and subtle motion
              make each answer feel calm instead of overwhelming.
            </p>
          </div>
        </div>

        <ComposerStrip />
      </div>
    </FloatingCard>
  );
}

function CraftVisual() {
  return (
    <FloatingCard className="overflow-hidden">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm font-semibold">Response styling</div>
            <div className="text-xs text-muted-foreground">Markdown and code, but polished</div>
          </div>
          <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
            Copy ready
          </span>
        </div>

        <div className="space-y-4">
          <h3 className="text-2xl font-bold text-foreground">Key Insights</h3>
          
          <p className="text-foreground">Here&apos;s a quick breakdown of what matters most:</p>
          <ul className="space-y-1.5 text-muted-foreground">
            <li><strong className="text-foreground">Shipping</strong> is the biggest bottleneck right now</li>
            <li>Customer <strong className="text-foreground">retention drops</strong> after week 3</li>
            <li>Q4 push should focus on <strong className="text-foreground">referral incentives</strong></li>
          </ul>
        </div>

        <div className="overflow-hidden rounded-2xl border border-border/70 bg-[linear-gradient(180deg,#fffaf3,#fff5e8)] text-[#3b2816] shadow-inner dark:bg-[linear-gradient(180deg,#1f1812,#17110d)] dark:text-[#f7ede2]">
          <div className="flex items-center justify-between border-b border-black/10 px-4 py-3 text-xs text-[#8e6c52] dark:border-white/10 dark:text-[#ccb8a4]">
            <div className="flex items-center gap-2">
              <Code2 className="h-4 w-4" />
              <span>analyzeMetrics.py</span>
            </div>
            <span>python</span>
          </div>
          <div className="space-y-2 px-4 py-4 font-mono text-xs leading-6">
            <div>
              <span className="text-[#c06e00] dark:text-[#ffbd7a]">def</span>{" "}
              <span className="text-[#5b3923] dark:text-[#ffefc8]">find_bottlenecks</span>(
              <span className="text-[#0e8b7d] dark:text-[#8fe2d2]">metrics</span>):
            </div>
            <div className="pl-4">
              <span className="text-[#5b3923] dark:text-[#ffefc8]">shipping_delay</span> ={" "}
              <span className="text-[#8f5d00] dark:text-[#f0c674]">avg</span>(
              <span className="text-[#0e8b7d] dark:text-[#8fe2d2]">metrics.shipping_times</span>)
            </div>
            <div className="pl-4">
              <span className="text-[#5b3923] dark:text-[#ffefc8]">retention</span> ={" "}
              <span className="text-[#8f5d00] dark:text-[#f0c674]">cohort_retention</span>(
              <span className="text-[#0e8b7d] dark:text-[#8fe2d2]">weeks=3</span>)
            </div>
            <div className="pl-4">
              <span className="text-[#c06e00] dark:text-[#ffbd7a]">return</span>{" "}
              <span className="text-[#0e8b7d] dark:text-[#8fe2d2]">{`{`}</span>
              <span className="text-[#5b3923] dark:text-[#ffefc8]">shipping_delay</span>,
              <span className="text-[#5b3923] dark:text-[#ffefc8]"> retention</span>
              <span className="text-[#0e8b7d] dark:text-[#8fe2d2]">{`}`}</span>
            </div>
          </div>
        </div>
        
        <p className="text-muted-foreground">Want me to dig into any of these?</p>
      </div>
    </FloatingCard>
  );
}

function SearchVisual() {
  return (
    <FloatingCard className="overflow-hidden">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm font-semibold">Search and browse</div>
            <div className="text-xs text-muted-foreground">Tool cards inside the answer flow</div>
          </div>
          <div className="flex items-center gap-2 rounded-full border border-border/70 bg-background px-3 py-1 text-xs text-muted-foreground">
            <Search className="h-3.5 w-3.5" />
            Web search
          </div>
        </div>

        <div className="rounded-2xl border border-border/70 bg-background p-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Search className="h-4 w-4" />
            Searched for &quot;best product launch strategy&quot;
          </div>
          <div className="mt-4 space-y-3">
            {[
              {
                title: "How modern SaaS pages balance clarity with motion",
                source: "design-notes.dev",
                date: "Apr 11",
              },
              {
                title: "Product storytelling through UI-shaped sections",
                source: "launchbook.studio",
                date: "Apr 10",
              },
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

function BrowseVisual() {
  return (
    <FloatingCard className="overflow-hidden">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm font-semibold">Website viewing</div>
            <div className="text-xs text-muted-foreground">Inspect the source after search</div>
          </div>
          <div className="flex items-center gap-2 rounded-full border border-border/70 bg-background px-3 py-1 text-xs text-muted-foreground">
            <Globe className="h-3.5 w-3.5" />
            Browse
          </div>
        </div>

        <div className="rounded-2xl border border-border/70 bg-background p-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Globe className="h-4 w-4" />
            Viewed 3 websites
          </div>
          <div className="mt-4 space-y-2">
            {[
              "github.com/vercel/nextjs",
              "en.wikipedia.org/wiki/Artificial_intelligence",
              "news.ycombinator.com",
            ].map((site) => (
              <div
                key={site}
                className="flex items-center justify-between rounded-xl border border-border/70 bg-card px-3 py-3 text-sm"
              >
                <div className="flex items-center gap-2">
                  <Globe className="h-4 w-4 text-muted-foreground" />
                  <span>{site}</span>
                </div>
                <ExternalLink className="h-4 w-4 text-muted-foreground" />
              </div>
            ))}
          </div>
        </div>

      </div>
    </FloatingCard>
  );
}

function ControlVisual() {
  return (
    <FloatingCard className="overflow-hidden">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm font-semibold">Iteration controls</div>
            <div className="text-xs text-muted-foreground">Edit, branch, and retry from the same thread</div>
          </div>
          <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
            Power flow
          </span>
        </div>

        <div className="flex justify-end">
          <div className="max-w-[74%] rounded-2xl rounded-br-md border border-primary/25 bg-primary/10 px-4 py-3">
            <div className="text-sm text-foreground">
              Make the hero more minimal and push feature depth lower on the page.
            </div>
            <div className="mt-3 flex items-center justify-end gap-1 text-primary/80">
              <button className="rounded-lg p-2 transition-colors hover:bg-primary/10">
                <Pencil className="h-4 w-4" />
              </button>
              <button className="rounded-lg p-2 transition-colors hover:bg-primary/10">
                <ChevronLeft className="h-4 w-4" />
              </button>
              <span className="px-1 text-xs">2 / 4</span>
              <button className="rounded-lg p-2 transition-colors hover:bg-primary/10">
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-border/70 bg-card p-4">
          <div className="text-sm leading-7 text-foreground">
            I tightened the hero and moved the detailed feature storytelling into alternating sections so the first screen feels lighter and more premium.
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

function WorkspaceVisual() {
  return (
    <FloatingCard className="overflow-hidden">
      <div id="workspace" className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm font-semibold">Workspace system</div>
            <div className="text-xs text-muted-foreground">Beyond the reply box</div>
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
                { label: "Pinned: Launch notes", icon: <Pin className="h-3.5 w-3.5" /> },
                { label: "Folder: Product ideas", icon: <Folder className="h-3.5 w-3.5" /> },
                { label: "Temporary chat", icon: <Shield className="h-3.5 w-3.5" /> },
                { label: "Archived chats", icon: <MessageSquareText className="h-3.5 w-3.5" /> },
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
              Workspace actions
            </div>
            <div className="mt-4 space-y-3">
              <div className="rounded-xl border border-border/70 bg-card px-3 py-3 text-sm">
                <div className="font-medium text-foreground">Pin the chats that matter</div>
                <div className="mt-1 text-muted-foreground">
                  Keep active conversations within reach while the rest of your history stays tidy.
                </div>
              </div>
              <div className="rounded-xl border border-border/70 bg-card px-3 py-3 text-sm">
                <div className="font-medium text-foreground">Move chats into folders</div>
                <div className="mt-1 text-muted-foreground">
                  Separate product work, research, and personal prompts into calmer spaces.
                </div>
              </div>
              <div className="rounded-xl border border-border/70 bg-card px-3 py-3 text-sm">
                <div className="font-medium text-foreground">Archive when you are done</div>
                <div className="mt-1 text-muted-foreground">
                  Reduce clutter in the main list without losing valuable old conversations.
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </FloatingCard>
  );
}

function PrivateVisual() {
  return (
    <FloatingCard className="overflow-hidden">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm font-semibold">Temporary chat</div>
            <div className="text-xs text-muted-foreground">A separate mode for disposable sessions</div>
          </div>
          <span className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-background px-3 py-1 text-xs text-muted-foreground">
            <Shield className="h-3.5 w-3.5" />
            Private
          </span>
        </div>

        <div className="rounded-2xl border border-amber-500/25 bg-primary/10 p-4">
          <div className="flex items-center gap-2 text-sm font-medium text-foreground">
            <Shield className="h-4 w-4 text-primary" />
            Temporary Chat Enabled
          </div>
          <p className="mt-2 text-sm leading-7 text-muted-foreground">
            Use a clean conversation mode when you want quick exploration without
            carrying that thread into your main workspace.
          </p>
        </div>

        <div className="space-y-2">
          {[
            "Start from the header in one tap",
            "Keep throwaway prompts out of your main list",
            "Great for rough drafts, experiments, and sensitive questions",
          ].map((item) => (
            <div
              key={item}
              className="rounded-xl border border-border/70 bg-background px-3 py-3 text-sm text-muted-foreground"
            >
              {item}
            </div>
          ))}
        </div>
      </div>
    </FloatingCard>
  );
}

function MemoryVisual() {
  return (
    <FloatingCard className="overflow-hidden">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm font-semibold">Memory manager</div>
            <div className="text-xs text-muted-foreground">Persistent context with controls</div>
          </div>
          <span className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-background px-3 py-1 text-xs text-muted-foreground">
            <Brain className="h-3.5 w-3.5" />
            Memory
          </span>
        </div>

        <div className="rounded-2xl border border-border/70 bg-background p-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-xl border border-border/70 bg-card px-3 py-3">
              <div className="text-xs text-muted-foreground">Total memories</div>
              <div className="mt-2 text-2xl font-semibold text-foreground">18</div>
            </div>
            <div className="rounded-xl border border-border/70 bg-card px-3 py-3">
              <div className="text-xs text-muted-foreground">Status</div>
              <div className="mt-2 text-base font-medium text-foreground">Ready</div>
            </div>
          </div>
        </div>

        <div className="space-y-2">
          {[
            "User prefers concise but clear explanations.",
            "User is planning the next Lumy release.",
            "User likes modern, animated interfaces with warm colors.",
          ].map((item) => (
            <div
              key={item}
              className="flex items-center justify-between rounded-xl border border-border/70 bg-background px-3 py-3 text-sm"
            >
              <span className="text-foreground">{item}</span>
              <div className="flex gap-1 text-muted-foreground">
                <button className="rounded-lg p-2 hover:bg-accent">
                  <Pencil className="h-4 w-4" />
                </button>
                <button className="rounded-lg p-2 hover:bg-accent">
                  <RefreshCw className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </FloatingCard>
  );
}

function CustomizationVisual() {
  return (
    <FloatingCard className="overflow-hidden">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm font-semibold">Customization</div>
            <div className="text-xs text-muted-foreground">Tune Lumy to your preferences</div>
          </div>
          <span className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-background px-3 py-1 text-xs text-muted-foreground">
            <Wand2 className="h-3.5 w-3.5" />
            Personalized
          </span>
        </div>

        <div className="rounded-2xl border border-border/70 bg-background p-4">
          <div className="space-y-3">
            <SettingRow label="AI nickname" value="Lumy" />
            <SettingRow label="AI tone" value="Warmer" />
            <SettingRow label="Response length" value="Detailed" />
          </div>
        </div>

        <div className="rounded-2xl border border-border/70 bg-background p-4">
          <div className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            Appearance
          </div>
          <div className="mt-3 grid grid-cols-3 gap-2">
            {[
              { label: "System", icon: <Monitor className="h-4 w-4" />, active: false },
              { label: "Day", icon: <Sun className="h-4 w-4" />, active: true },
              { label: "Night", icon: <Moon className="h-4 w-4" />, active: false },
            ].map((theme) => (
              <div
                key={theme.label}
                className={cn(
                  "rounded-xl border p-3 text-center text-sm",
                  theme.active
                    ? "border-primary bg-primary/10 text-foreground"
                    : "border-border/70 bg-card text-muted-foreground"
                )}
              >
                <div className="flex justify-center">{theme.icon}</div>
                <div className="mt-2 font-medium">{theme.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </FloatingCard>
  );
}

function FloatingCard({
  className,
  children,
}: {
  className?: string;
  children: ReactNode;
}) {
  return (
    <motion.div
      className={cn(
        "rounded-[2rem] border border-border/60 bg-[linear-gradient(180deg,rgba(255,255,255,0.92),rgba(255,252,247,0.82))] p-4 shadow-[0_26px_80px_-55px_rgba(24,24,27,0.4)] dark:bg-[linear-gradient(180deg,rgba(32,27,22,0.92),rgba(18,16,14,0.88))] dark:shadow-[0_35px_100px_-55px_rgba(0,0,0,0.82)] md:p-5",
        className
      )}
    >
      {children}
    </motion.div>
  );
}

function AnimatedLine({
  className,
  delay = 0,
}: {
  className?: string;
  delay?: number;
}) {
  return (
    <motion.div
      animate={{ opacity: [0.45, 1, 0.45] }}
      transition={{ duration: 2.1, repeat: Infinity, delay }}
      className={cn("h-2.5 rounded-full bg-muted", className)}
    />
  );
}

function ComposerStrip() {
  return (
    <div className="rounded-2xl border border-border/70 bg-card p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          <ActionChip icon={<Sparkles className="h-3.5 w-3.5" />} label="Fast" />
          <ActionChip icon={<Mic className="h-3.5 w-3.5" />} label="Voice" />
          <ActionChip icon={<Search className="h-3.5 w-3.5" />} label="Tools" />
        </div>
        <div className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-sm">
          <ArrowUpRight className="h-4 w-4" />
        </div>
      </div>
    </div>
  );
}

function ActionChip({
  icon,
  label,
}: {
  icon: ReactNode;
  label: string;
}) {
  return (
    <span className="inline-flex items-center gap-2 rounded-xl border border-border/70 bg-background px-3 py-2 text-xs font-medium text-muted-foreground">
      {icon}
      {label}
    </span>
  );
}

function SettingRow({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center justify-between rounded-xl border border-border/70 bg-card px-3 py-3 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium text-foreground">{value}</span>
    </div>
  );
}
