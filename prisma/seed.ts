import { PrismaClient, type Format, type Level, type Pricing, type Prisma, type ResourceStatus, type ResourceType } from "@prisma/client";
import { faker } from "@faker-js/faker";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

faker.seed(42);

const NOW = new Date();
const DAY_MS = 24 * 60 * 60 * 1000;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function pick<T>(arr: readonly T[]): T {
  if (arr.length === 0) throw new Error("pick() called on an empty array");
  const item = arr[faker.number.int({ min: 0, max: arr.length - 1 })];
  if (item === undefined) throw new Error("pick() produced undefined");
  return item;
}

function sample<T>(arr: readonly T[], min: number, max: number = min): T[] {
  const count = Math.min(arr.length, faker.number.int({ min, max }));
  return faker.helpers.arrayElements([...arr], count);
}

function int(min: number, max: number): number {
  return faker.number.int({ min, max });
}

function chance(probability: number): boolean {
  return faker.number.float({ min: 0, max: 1 }) < probability;
}

function weighted<T>(entries: ReadonlyArray<readonly [T, number]>): T {
  return faker.helpers.weightedArrayElement(entries.map(([value, weight]) => ({ value, weight })));
}

function must<T>(value: T | undefined | null, label: string): T {
  if (value === undefined || value === null) throw new Error(`Missing value: ${label}`);
  return value;
}

function slugify(input: string): string {
  return input
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/['’]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

const usedSlugs = new Set<string>();
function uniqueSlug(title: string): string {
  const base = slugify(title);
  let slug = base;
  let n = 2;
  while (usedSlugs.has(slug)) {
    slug = `${base}-${n}`;
    n += 1;
  }
  usedSlugs.add(slug);
  return slug;
}

const PROPER_WORDS = new Set(["Python", "Figma", "PyTorch"]);
function lowerTopic(topic: string): string {
  return topic
    .split(/(\s+|-)/)
    .map((part) => (/^[A-Z][a-z]+$/.test(part) && !PROPER_WORDS.has(part) ? part.toLowerCase() : part))
    .join("")
    .replace(/stable diffusion/g, "Stable Diffusion");
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function daysAgo(days: number): Date {
  return new Date(NOW.getTime() - days * DAY_MS - int(0, 23 * 60) * 60 * 1000);
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

// ---------------------------------------------------------------------------
// Static reference data
// ---------------------------------------------------------------------------

const TOOLS: Record<string, string> = {
  chatgpt: "ChatGPT",
  claude: "Claude",
  midjourney: "Midjourney",
  cursor: "Cursor",
  langchain: "LangChain",
  "hugging-face": "Hugging Face",
  "github-copilot": "GitHub Copilot",
  "notion-ai": "Notion AI",
  perplexity: "Perplexity",
  runway: "Runway",
  zapier: "Zapier",
  figma: "Figma",
  "stable-diffusion": "Stable Diffusion",
  pytorch: "PyTorch",
  gemini: "Gemini",
  llamaindex: "LlamaIndex",
  pinecone: "Pinecone",
  jasper: "Jasper",
  canva: "Canva",
  make: "Make",
  "dall-e": "DALL-E",
  elevenlabs: "ElevenLabs",
  jupyter: "Jupyter",
  pandas: "pandas",
  "scikit-learn": "scikit-learn",
  "weights-biases": "Weights & Biases",
  crewai: "CrewAI",
  ollama: "Ollama",
  v0: "v0",
  framer: "Framer",
  "surfer-seo": "Surfer SEO",
  "copy-ai": "Copy.ai",
  "vertex-ai": "Vertex AI",
  sagemaker: "Amazon SageMaker",
};

function toolName(slug: string): string {
  return TOOLS[slug] ?? slug;
}

const TAGS: ReadonlyArray<readonly [string, string]> = [
  ["gpt-4", "GPT-4"],
  ["rag", "RAG"],
  ["fine-tuning", "Fine-Tuning"],
  ["python", "Python"],
  ["pytorch", "PyTorch"],
  ["transformers", "Transformers"],
  ["diffusion", "Diffusion"],
  ["stable-diffusion", "Stable Diffusion"],
  ["langchain", "LangChain"],
  ["vector-databases", "Vector Databases"],
  ["embeddings", "Embeddings"],
  ["evaluation", "Evaluation"],
  ["prompt-design", "Prompt Design"],
  ["automation", "Automation"],
  ["no-code", "No-Code"],
  ["chatbots", "Chatbots"],
  ["computer-vision", "Computer Vision"],
  ["nlp", "NLP"],
  ["reinforcement-learning", "Reinforcement Learning"],
  ["mlops", "MLOps"],
  ["analytics", "Analytics"],
  ["copywriting", "Copywriting"],
  ["seo", "SEO"],
  ["ui-design", "UI Design"],
  ["responsible-ai", "Responsible AI"],
  ["open-source", "Open Source"],
  ["api", "API"],
  ["agents", "Agents"],
  ["multimodal", "Multimodal"],
  ["productivity", "Productivity"],
];

interface ProviderSeed {
  name: string;
  domain: string;
  description: string;
}

const PROVIDERS: ProviderSeed[] = [
  { name: "DeepLearning.AI", domain: "deeplearning.ai", description: "Education company offering short courses and specializations on machine learning and generative AI." },
  { name: "Google", domain: "google.com", description: "Learning paths and skill badges covering Google's generative AI, cloud, and machine learning platforms." },
  { name: "OpenAI", domain: "openai.com", description: "Official documentation, cookbooks, and guides for building with OpenAI models and APIs." },
  { name: "Anthropic", domain: "anthropic.com", description: "AI safety company publishing engineering guides, courses, and research on building with Claude." },
  { name: "Coursera", domain: "coursera.org", description: "Online learning platform partnering with universities and companies to offer courses and certificates." },
  { name: "fast.ai", domain: "fast.ai", description: "Non-profit research lab making deep learning accessible through free, practical courses." },
  { name: "Hugging Face", domain: "huggingface.co", description: "The open-source AI community hub, with free courses on transformers, diffusion, and agents." },
  { name: "Microsoft", domain: "microsoft.com", description: "Open curricula and Learn modules on AI fundamentals, Azure AI, and responsible AI." },
  { name: "Nvidia", domain: "nvidia.com", description: "Deep Learning Institute courses on accelerated computing, generative AI, and LLM deployment." },
  { name: "AWS", domain: "aws.amazon.com", description: "Training and certification programs for machine learning and generative AI on Amazon Web Services." },
  { name: "Udemy", domain: "udemy.com", description: "Marketplace of instructor-led video courses spanning programming, design, and AI tools." },
  { name: "edX", domain: "edx.org", description: "University-backed online courses and professional certificates across computer science and AI." },
  { name: "Stanford Online", domain: "stanford.edu", description: "Recorded lectures and graduate-level courses from Stanford's computer science department." },
  { name: "MIT OpenCourseWare", domain: "mit.edu", description: "Free lecture notes, videos, and assignments from MIT courses in AI and machine learning." },
  { name: "Kaggle", domain: "kaggle.com", description: "Data science community with free, hands-on micro-courses and competitions." },
  { name: "LangChain", domain: "langchain.com", description: "Framework maker offering LangChain Academy courses on agents, LangGraph, and LLM apps." },
  { name: "Replicate", domain: "replicate.com", description: "Platform for running open-source models in the cloud, with guides for developers." },
  { name: "Midjourney", domain: "midjourney.com", description: "Independent research lab behind the Midjourney image model and its official documentation." },
  { name: "Runway", domain: "runwayml.com", description: "Creative AI company offering Runway Academy tutorials on AI video generation and editing." },
  { name: "Zapier", domain: "zapier.com", description: "Automation platform publishing guides on connecting AI to thousands of business apps." },
  { name: "HubSpot Academy", domain: "hubspot.com", description: "Free marketing, sales, and service training including AI-powered marketing playbooks." },
  { name: "Figma", domain: "figma.com", description: "Collaborative design platform with tutorials on Figma AI and modern product design workflows." },
  { name: "The Rundown AI", domain: "therundown.ai", description: "Daily AI newsletter and tutorials helping professionals keep up with the latest tools." },
  { name: "Futurepedia", domain: "futurepedia.io", description: "AI tools directory with practical video tutorials and courses for non-technical learners." },
  { name: "Ben's Bites", domain: "bensbites.com", description: "Popular AI newsletter and community covering product launches, tools, and workflows." },
  { name: "Latent Space", domain: "latent.space", description: "Newsletter and podcast for AI engineers covering models, agents, and infrastructure." },
];

const UNVERIFIED_PROVIDERS = new Set(["replicate", "futurepedia", "bens-bites", "latent-space", "the-rundown-ai", "udemy", "midjourney", "hubspot-academy"]);

interface AuthorSeed {
  name: string;
  bio: string;
  social?: string;
}

const AUTHORS: AuthorSeed[] = [
  { name: "Maya Okafor", bio: "Maya is a machine learning researcher who spent six years building language models for search. She now teaches practical LLM engineering to developers moving into AI.", social: "https://x.com/mayaokafor" },
  { name: "Daniel Reyes", bio: "Daniel leads developer education at a large AI lab and has trained thousands of engineers on prompt design. He cares about turning fuzzy techniques into repeatable patterns.", social: "https://www.linkedin.com/in/danielreyes-ai" },
  { name: "Priya Raman", bio: "Priya is a data scientist turned educator with a focus on deep learning for computer vision. Her courses are known for clear intuition before any math.", social: "https://x.com/priyaraman_ml" },
  { name: "Lukas Brenner", bio: "Lukas is a staff engineer who has shipped agentic systems in fintech and logistics. He writes about reliability, evaluation, and the unglamorous parts of production AI." },
  { name: "Sofia Marchetti", bio: "Sofia is a creative director who adopted generative image tools early in her agency career. She teaches artists and marketers how to direct AI with intent.", social: "https://www.instagram.com/sofiamarchetti.studio" },
  { name: "Kenji Watanabe", bio: "Kenji is an open-source maintainer and former research engineer working on transformer tooling. He enjoys explaining complex architectures with small, runnable examples.", social: "https://github.com/kwatanabe" },
  { name: "Amara Bello", bio: "Amara advises executives on AI strategy and has led adoption programs at three Fortune 500 companies. She focuses on measurable business outcomes over hype." },
  { name: "Ethan Caldwell", bio: "Ethan is a full-stack developer who builds AI features for SaaS products. He teaches the day-to-day workflows that make AI coding assistants genuinely useful.", social: "https://x.com/ethancaldwell" },
  { name: "Nadia Haddad", bio: "Nadia researches fairness and accountability in machine learning systems. She has contributed to AI governance frameworks used by public-sector agencies.", social: "https://www.linkedin.com/in/nadiahaddad" },
  { name: "Oliver Grant", bio: "Oliver is a growth marketer who has built content engines for B2B startups. He shows teams how to use AI without losing their brand voice." },
  { name: "Ines Duarte", bio: "Ines is a product designer specializing in design systems and rapid prototyping. She runs workshops on bringing AI into the everyday design process.", social: "https://dribbble.com/inesduarte" },
  { name: "Rohan Mehta", bio: "Rohan is an MLOps engineer who has deployed models serving millions of requests a day. He teaches the infrastructure side of machine learning with a pragmatic lens.", social: "https://github.com/rohanmehta" },
  { name: "Clara Lindqvist", bio: "Clara is a former journalist who now curates AI news for a large professional audience. She specializes in separating meaningful releases from noise." },
  { name: "Marcus Hale", bio: "Marcus is an automation consultant who helps small teams replace manual busywork with AI workflows. He has built hundreds of no-code integrations for clients.", social: "https://x.com/marcushale" },
  { name: "Leila Farahani", bio: "Leila is a reinforcement learning researcher with a background in robotics. She teaches graduate-level material in a way that stays grounded in real experiments." },
];

interface CategorySeed {
  slug: string;
  name: string;
  description: string;
  icon: string;
  technical: boolean;
  topics: string[];
  concepts: string[];
  sectionThemes: string[];
  projects: string[];
  tools: string[];
  tags: string[];
  providers: string[];
}

const CATEGORIES: CategorySeed[] = [
  {
    slug: "llms",
    name: "LLMs",
    description: "Understand, fine-tune, and deploy large language models from APIs to open weights.",
    icon: "Brain",
    technical: true,
    topics: ["Large Language Models", "Transformer Architectures", "LLM Fine-Tuning", "Retrieval-Augmented Generation", "Open-Source LLMs", "LLM Evaluation", "Embeddings and Semantic Search", "Local LLM Deployment"],
    concepts: ["tokenization", "attention mechanisms", "context windows", "sampling parameters", "LoRA adapters", "instruction tuning", "embedding models", "vector indexes", "chunking strategies", "hallucination mitigation", "benchmark design", "quantization", "KV caching", "model distillation", "RLHF"],
    sectionThemes: ["Foundations", "How Transformers Work", "Working with Model APIs", "Retrieval and Grounding", "Fine-Tuning in Practice", "Evaluation and Monitoring", "Shipping to Production"],
    projects: ["document Q&A assistant", "semantic search engine", "customer support bot", "private local chatbot"],
    tools: ["chatgpt", "claude", "hugging-face", "langchain", "llamaindex", "ollama", "gemini"],
    tags: ["gpt-4", "rag", "fine-tuning", "transformers", "embeddings", "vector-databases", "evaluation", "open-source", "nlp", "api"],
    providers: ["openai", "anthropic", "hugging-face", "deeplearning-ai", "stanford-online", "nvidia", "latent-space", "google"],
  },
  {
    slug: "prompt-engineering",
    name: "Prompt Engineering",
    description: "Write prompts that produce reliable, structured, and high-quality model outputs.",
    icon: "MessageSquareText",
    technical: false,
    topics: ["Prompt Engineering", "Chain-of-Thought Prompting", "System Prompt Design", "Structured Output Prompting", "Prompt Testing", "Advanced Prompting Patterns"],
    concepts: ["zero-shot prompts", "few-shot examples", "role prompting", "chain-of-thought", "output schemas", "XML-tagged instructions", "prompt chaining", "self-consistency", "prompt templates", "guardrail instructions", "prompt versioning", "evaluation rubrics"],
    sectionThemes: ["Prompting Basics", "Anatomy of a Great Prompt", "Reasoning Techniques", "Structured Outputs", "Prompt Chains and Workflows", "Testing and Iteration"],
    projects: ["reusable prompt library", "JSON extraction pipeline", "meeting summarizer", "prompt evaluation harness"],
    tools: ["chatgpt", "claude", "perplexity", "gemini", "notion-ai"],
    tags: ["prompt-design", "gpt-4", "chatbots", "evaluation", "productivity", "api"],
    providers: ["deeplearning-ai", "openai", "anthropic", "coursera", "udemy", "futurepedia"],
  },
  {
    slug: "agents",
    name: "Agents",
    description: "Build AI agents that plan, use tools, and complete multi-step tasks on their own.",
    icon: "Bot",
    technical: true,
    topics: ["AI Agents", "Multi-Agent Systems", "Tool Use and Function Calling", "Agentic Workflows", "Autonomous Research Agents", "Agent Memory and Planning"],
    concepts: ["function calling", "tool schemas", "planning loops", "the ReAct pattern", "agent memory", "handoffs between agents", "human-in-the-loop checkpoints", "error recovery", "sandboxed execution", "orchestrator-worker patterns", "agent evaluation", "cost controls"],
    sectionThemes: ["What Makes an Agent", "Tools and Function Calling", "Planning and Reasoning Loops", "Memory and State", "Multi-Agent Orchestration", "Reliability and Evaluation", "Deploying Agents"],
    projects: ["research assistant agent", "email triage agent", "coding agent", "travel planning agent"],
    tools: ["langchain", "claude", "chatgpt", "crewai", "llamaindex", "zapier"],
    tags: ["agents", "langchain", "automation", "api", "evaluation", "rag", "python"],
    providers: ["langchain", "anthropic", "deeplearning-ai", "openai", "microsoft", "nvidia", "replicate"],
  },
  {
    slug: "image-video",
    name: "Image & Video",
    description: "Create striking images and video with diffusion models and generative media tools.",
    icon: "Image",
    technical: false,
    topics: ["AI Image Generation", "Diffusion Models", "AI Video Production", "Stable Diffusion Workflows", "Generative Art Direction", "AI Photo Editing"],
    concepts: ["prompt weighting", "style references", "aspect ratios", "inpainting", "outpainting", "ControlNet", "image-to-video", "motion brushes", "upscaling", "seed control", "LoRA styles", "consistent characters", "storyboarding", "color grading"],
    sectionThemes: ["Getting Started", "Crafting Visual Prompts", "Style and Composition", "Editing and Refinement", "Motion and Video", "Production Workflow"],
    projects: ["brand campaign visual set", "30-second product teaser", "illustrated children's story", "cinematic short film"],
    tools: ["midjourney", "runway", "stable-diffusion", "dall-e", "elevenlabs", "canva"],
    tags: ["diffusion", "stable-diffusion", "computer-vision", "multimodal", "open-source"],
    providers: ["midjourney", "runway", "replicate", "udemy", "hugging-face", "nvidia"],
  },
  {
    slug: "coding",
    name: "Coding",
    description: "Ship software faster with AI pair programmers and build LLM features into your apps.",
    icon: "Code",
    technical: true,
    topics: ["AI Pair Programming", "LLM-Powered Developer Tools", "Building AI Apps with Python", "AI Code Review", "Shipping LLM Features", "AI-Assisted Testing"],
    concepts: ["inline completions", "codebase context", "refactoring with AI", "test generation", "code review prompts", "API integration", "streaming responses", "rate limiting", "secrets management", "CI integration", "debugging sessions", "type-safe outputs"],
    sectionThemes: ["Setting Up Your Environment", "Everyday AI Coding Workflows", "Working in Large Codebases", "Testing and Debugging", "Building AI Features", "Shipping and Maintenance"],
    projects: ["full-stack chat app", "CLI coding assistant", "automated PR reviewer", "AI-powered REST API"],
    tools: ["cursor", "github-copilot", "claude", "chatgpt", "langchain", "v0"],
    tags: ["python", "api", "open-source", "productivity", "automation", "gpt-4"],
    providers: ["microsoft", "udemy", "openai", "anthropic", "edx", "aws", "replicate"],
  },
  {
    slug: "data-science",
    name: "Data Science",
    description: "Master machine learning and deep learning foundations with hands-on data projects.",
    icon: "ChartLine",
    technical: true,
    topics: ["Deep Learning", "Machine Learning Foundations", "Computer Vision", "Reinforcement Learning", "MLOps", "Neural Networks with PyTorch", "Applied Data Analysis"],
    concepts: ["gradient descent", "backpropagation", "convolutional networks", "data augmentation", "overfitting and regularization", "hyperparameter tuning", "feature engineering", "model deployment", "experiment tracking", "transfer learning", "policy gradients", "cross-validation", "data pipelines"],
    sectionThemes: ["Math and Intuition", "Data Preparation", "Training Your First Model", "Improving Model Performance", "Advanced Architectures", "Deployment and MLOps"],
    projects: ["image classifier", "demand forecasting model", "recommendation engine", "game-playing RL agent"],
    tools: ["pytorch", "jupyter", "pandas", "scikit-learn", "weights-biases", "hugging-face"],
    tags: ["python", "pytorch", "computer-vision", "reinforcement-learning", "mlops", "analytics", "transformers"],
    providers: ["fast-ai", "kaggle", "mit-opencourseware", "stanford-online", "nvidia", "coursera", "edx", "google"],
  },
  {
    slug: "business-productivity",
    name: "Business & Productivity",
    description: "Apply AI to everyday work, automate workflows, and lead successful adoption.",
    icon: "Briefcase",
    technical: false,
    topics: ["AI for Business Leaders", "Workflow Automation", "AI Productivity Systems", "AI Strategy", "No-Code AI Tools", "AI for Operations"],
    concepts: ["use-case discovery", "ROI estimation", "change management", "automation triggers", "meeting notes automation", "knowledge bases", "AI usage policies", "vendor evaluation", "team enablement", "process mapping", "pilot programs", "data privacy basics"],
    sectionThemes: ["The AI Opportunity", "Finding High-Value Use Cases", "Tools for Everyday Work", "Automating Workflows", "Rolling Out AI to Teams", "Measuring Impact"],
    projects: ["automated weekly report", "AI-powered CRM workflow", "team knowledge assistant", "AI adoption roadmap"],
    tools: ["zapier", "notion-ai", "chatgpt", "claude", "perplexity", "make"],
    tags: ["automation", "no-code", "productivity", "chatbots", "analytics"],
    providers: ["coursera", "zapier", "microsoft", "the-rundown-ai", "bens-bites", "futurepedia", "google", "edx"],
  },
  {
    slug: "marketing",
    name: "Marketing",
    description: "Use AI for content, SEO, campaigns, and analytics without losing your brand voice.",
    icon: "Megaphone",
    technical: false,
    topics: ["AI Marketing", "AI Copywriting", "SEO with AI", "AI-Powered Social Media", "Marketing Analytics with AI", "Email Marketing Automation"],
    concepts: ["brand voice prompts", "content calendars", "keyword clustering", "ad copy variations", "audience segmentation", "A/B testing", "landing page copy", "content repurposing", "campaign analytics", "email sequences", "content briefs", "personalization"],
    sectionThemes: ["AI in the Modern Marketing Stack", "Content Creation", "Search and Discovery", "Social and Community", "Campaign Automation", "Analytics and Optimization"],
    projects: ["90-day content calendar", "SEO content cluster", "product launch campaign", "automated newsletter funnel"],
    tools: ["chatgpt", "jasper", "copy-ai", "surfer-seo", "canva", "zapier"],
    tags: ["copywriting", "seo", "analytics", "automation", "productivity"],
    providers: ["hubspot-academy", "udemy", "coursera", "futurepedia", "zapier", "google"],
  },
  {
    slug: "design",
    name: "Design",
    description: "Bring AI into research, ideation, prototyping, and visual design workflows.",
    icon: "Palette",
    technical: false,
    topics: ["AI for Product Design", "UI Design with AI", "AI Prototyping", "Design Systems with AI", "UX Research with AI"],
    concepts: ["moodboards", "wireframe generation", "design tokens", "component libraries", "user interview synthesis", "rapid prototyping", "accessibility checks", "interface copy", "visual hierarchy", "usability testing", "developer handoff", "icon generation"],
    sectionThemes: ["Design Meets AI", "Research and Discovery", "Ideation and Wireframing", "Visual Design", "Prototyping and Testing", "Handoff and Systems"],
    projects: ["mobile app prototype", "landing page redesign", "design system starter kit", "UX research report"],
    tools: ["figma", "midjourney", "v0", "framer", "canva"],
    tags: ["ui-design", "multimodal", "productivity", "no-code"],
    providers: ["figma", "udemy", "coursera", "google", "microsoft"],
  },
  {
    slug: "ethics-safety",
    name: "Ethics & Safety",
    description: "Build and deploy AI responsibly with a grounding in safety, fairness, and governance.",
    icon: "ShieldCheck",
    technical: false,
    topics: ["Responsible AI", "AI Safety Fundamentals", "AI Governance", "Bias and Fairness in ML", "AI Policy and Regulation", "Red Teaming LLMs"],
    concepts: ["fairness metrics", "model cards", "risk assessments", "red teaming", "jailbreak resistance", "privacy-preserving ML", "the EU AI Act", "transparency reports", "alignment basics", "incident response", "content moderation", "interpretability"],
    sectionThemes: ["Why Responsible AI Matters", "Understanding Risks and Harms", "Fairness and Bias", "Safety Techniques", "Governance and Policy", "Putting Principles into Practice"],
    projects: ["AI risk assessment", "model card for a real system", "red-team test plan", "internal AI usage policy"],
    tools: ["claude", "chatgpt", "hugging-face", "gemini"],
    tags: ["responsible-ai", "evaluation", "open-source", "nlp"],
    providers: ["anthropic", "google", "microsoft", "stanford-online", "mit-opencourseware", "edx"],
  },
];

function categoryBySlug(slug: string): CategorySeed {
  return must(
    CATEGORIES.find((c) => c.slug === slug),
    `category ${slug}`,
  );
}

// ---------------------------------------------------------------------------
// Resource specs
// ---------------------------------------------------------------------------

interface Faq {
  question: string;
  answer: string;
}

interface ResourceSpec {
  title: string;
  tagline: string;
  description: string;
  type: ResourceType;
  level: Level;
  pricing: Pricing;
  priceUsd: number | null;
  format: Format;
  language: string;
  hasCertificate: boolean;
  featured: boolean;
  learnOutcomes: string[];
  prerequisites: string[];
  toolsCovered: string[];
  tags: string[];
  providerSlug: string;
  authorSlug: string | null;
  categorySlug: string;
  externalUrl: string | null;
  publishedAt: Date;
  status: ResourceStatus;
}

type HandSpec = Omit<ResourceSpec, "publishedAt" | "status" | "language"> & { daysAgo: number };

const HAND_WRITTEN: HandSpec[] = [
  {
    title: "ChatGPT Prompt Engineering for Developers",
    tagline: "Learn to call LLM APIs and write prompts that build real application features",
    description:
      "This short course teaches developers how to use a large language model through its API to quickly build new and powerful applications. Rather than treating prompts as magic incantations, you learn two core principles for writing clear, specific instructions and giving the model time to think.\n\nThrough hands-on notebooks you will summarize product reviews, infer sentiment and topics, transform text between formats and languages, and expand short notes into full emails. The final lessons walk through building a custom chatbot that takes orders for a pizza restaurant, tying every technique together.\n\nIt is ideal for developers with basic Python experience who want to move beyond the chat window and start integrating models into their own products.",
    type: "COURSE",
    level: "BEGINNER",
    pricing: "FREE",
    priceUsd: null,
    format: "VIDEO",
    hasCertificate: false,
    featured: true,
    learnOutcomes: [
      "Apply two core principles for writing effective prompts",
      "Iteratively refine prompts using a systematic development loop",
      "Summarize, classify, and extract information from unstructured text",
      "Transform text between tones, formats, and languages",
      "Build a conversational chatbot with persistent context",
      "Call a chat completion API from Python notebooks",
    ],
    prerequisites: ["Basic Python programming", "A free API key for testing", "Familiarity with Jupyter notebooks is helpful"],
    toolsCovered: ["chatgpt", "jupyter"],
    tags: ["prompt-design", "gpt-4", "api", "python"],
    providerSlug: "deeplearning-ai",
    authorSlug: "daniel-reyes",
    categorySlug: "prompt-engineering",
    externalUrl: "https://www.deeplearning.ai/short-courses/chatgpt-prompt-engineering-for-developers/",
    daysAgo: 4,
  },
  {
    title: "Practical Deep Learning for Coders",
    tagline: "Train state-of-the-art models in weeks using a top-down, code-first approach",
    description:
      "Practical Deep Learning for Coders is a free course designed for people with some coding experience who want to apply deep learning to real problems. You start by training a working image classifier in the very first lesson, then gradually peel back the layers to understand how everything works under the hood.\n\nThe course covers computer vision, natural language processing, tabular data, and collaborative filtering, and it culminates in building a neural network from scratch. You will learn how to deploy models to the web, how to recognize and fix overfitting, and how modern techniques like transfer learning make powerful results achievable on modest hardware.\n\nNo advanced math degree is required. If you can write a Python loop and are willing to experiment, this course will take you further than you expect.",
    type: "COURSE",
    level: "INTERMEDIATE",
    pricing: "FREE",
    priceUsd: null,
    format: "VIDEO",
    hasCertificate: false,
    featured: true,
    learnOutcomes: [
      "Train accurate image, text, and tabular models with transfer learning",
      "Deploy a trained model as a simple web application",
      "Diagnose and fix overfitting with data augmentation and regularization",
      "Understand stochastic gradient descent from first principles",
      "Build a neural network from scratch in PyTorch",
      "Fine-tune pretrained transformer models for NLP tasks",
    ],
    prerequisites: ["At least one year of programming experience, ideally in Python", "High-school level math", "Access to a GPU notebook environment such as Kaggle or Colab"],
    toolsCovered: ["pytorch", "jupyter", "hugging-face"],
    tags: ["pytorch", "python", "computer-vision", "transformers"],
    providerSlug: "fast-ai",
    authorSlug: "priya-raman",
    categorySlug: "data-science",
    externalUrl: "https://course.fast.ai/",
    daysAgo: 212,
  },
  {
    title: "Building Effective Agents",
    tagline: "Proven patterns for agentic systems, from simple workflows to autonomous agents",
    description:
      "Building Effective Agents distills lessons learned from working with dozens of teams building LLM agents across industries. Its central message is that the most successful implementations rarely use complex frameworks; instead they rely on simple, composable patterns that are easy to reason about and debug.\n\nThe guide draws a clear line between workflows, where LLMs and tools are orchestrated through predefined code paths, and agents, where the model dynamically directs its own process. It then walks through prompt chaining, routing, parallelization, orchestrator-workers, and evaluator-optimizer loops, explaining when each pattern is worth its added cost and latency.\n\nEngineers who are designing their first agent or rethinking an overly complicated one will find practical advice on tool design, transparency, and knowing when not to build an agent at all.",
    type: "GUIDE",
    level: "INTERMEDIATE",
    pricing: "FREE",
    priceUsd: null,
    format: "TEXT",
    hasCertificate: false,
    featured: true,
    learnOutcomes: [
      "Distinguish between agentic workflows and autonomous agents",
      "Choose the simplest pattern that solves your problem",
      "Implement prompt chaining, routing, and parallelization",
      "Design orchestrator-worker and evaluator-optimizer loops",
      "Write tool definitions that models can use reliably",
    ],
    prerequisites: ["Experience calling an LLM API", "Comfort reading code in Python or TypeScript"],
    toolsCovered: ["claude", "langchain"],
    tags: ["agents", "api", "evaluation"],
    providerSlug: "anthropic",
    authorSlug: "lukas-brenner",
    categorySlug: "agents",
    externalUrl: "https://www.anthropic.com/engineering/building-effective-agents",
    daysAgo: 2,
  },
  {
    title: "Hugging Face NLP Course",
    tagline: "Master transformers, datasets, and tokenizers with the open-source ecosystem",
    description:
      "The Hugging Face NLP Course teaches natural language processing using the libraries that power much of the open-source AI world: Transformers, Datasets, Tokenizers, and Accelerate. It is completely free, ad-free, and built around runnable notebooks you can open in the browser.\n\nThe first chapters introduce the pipeline API and explain how transformer models work, then move on to fine-tuning pretrained models on your own data and sharing them on the Hub. Later chapters dive into building custom tokenizers, tackling classic tasks like token classification, translation, summarization, and question answering, and debugging training runs.\n\nBy the end you will be comfortable navigating the Hugging Face ecosystem and adapting state-of-the-art models to your own language tasks.",
    type: "COURSE",
    level: "INTERMEDIATE",
    pricing: "FREE",
    priceUsd: null,
    format: "INTERACTIVE",
    hasCertificate: true,
    featured: true,
    learnOutcomes: [
      "Use the pipeline API for common NLP tasks",
      "Explain the encoder, decoder, and encoder-decoder architectures",
      "Fine-tune a pretrained transformer on a custom dataset",
      "Train a new tokenizer from an existing one",
      "Share models and datasets on the Hugging Face Hub",
      "Debug training runs and evaluate model quality",
    ],
    prerequisites: ["Good working knowledge of Python", "Basic understanding of deep learning concepts", "Familiarity with PyTorch or TensorFlow"],
    toolsCovered: ["hugging-face", "pytorch", "jupyter"],
    tags: ["transformers", "nlp", "fine-tuning", "open-source"],
    providerSlug: "hugging-face",
    authorSlug: "kenji-watanabe",
    categorySlug: "llms",
    externalUrl: "https://huggingface.co/learn/nlp-course",
    daysAgo: 96,
  },
  {
    title: "Google Generative AI Learning Path",
    tagline: "A guided path from generative AI basics to responsible, production-ready use",
    description:
      "The Generative AI Learning Path is a curated collection of short courses that takes you from the fundamentals of large language models to building with Google's generative AI tools. Each module pairs a concise video explanation with a quiz, and many include hands-on labs.\n\nYou will cover what generative AI is and how it differs from traditional machine learning, how large language models and diffusion models work, the transformer architecture and attention mechanism, and how to design prompts in Vertex AI Studio. A dedicated module on responsible AI explains why principles and governance matter from day one.\n\nThe path suits product managers, analysts, and developers alike, and completing it earns shareable skill badges.",
    type: "COURSE",
    level: "BEGINNER",
    pricing: "FREE",
    priceUsd: null,
    format: "VIDEO",
    hasCertificate: true,
    featured: false,
    learnOutcomes: [
      "Define generative AI and explain how it differs from predictive ML",
      "Describe how large language models and diffusion models work",
      "Understand attention mechanisms and the transformer architecture",
      "Design and test prompts in Vertex AI Studio",
      "Apply responsible AI principles to generative projects",
    ],
    prerequisites: ["No prior machine learning experience required", "A Google account to access labs"],
    toolsCovered: ["gemini", "vertex-ai"],
    tags: ["multimodal", "responsible-ai", "transformers"],
    providerSlug: "google",
    authorSlug: null,
    categorySlug: "llms",
    externalUrl: "https://www.cloudskillsboost.google/paths/118",
    daysAgo: 150,
  },
  {
    title: "Microsoft AI for Beginners",
    tagline: "A 12-week, 24-lesson open curriculum covering the foundations of AI",
    description:
      "AI for Beginners is a free, open-source curriculum from Microsoft that explores artificial intelligence across twelve weeks and twenty-four lessons. Each lesson includes pre- and post-lesson quizzes, written explanations, runnable notebooks, and suggested labs.\n\nThe curriculum starts with the history and symbolic approaches to AI before moving into neural networks, computer vision with convolutional networks, natural language processing with recurrent networks and transformers, and generative models. It also touches on genetic algorithms, multi-agent systems, and AI ethics, giving you a broad map of the field.\n\nIt is well suited to students, self-learners, and educators who want a structured, classroom-friendly introduction with plenty of practice.",
    type: "COURSE",
    level: "BEGINNER",
    pricing: "FREE",
    priceUsd: null,
    format: "INTERACTIVE",
    hasCertificate: false,
    featured: false,
    learnOutcomes: [
      "Trace the history of symbolic and connectionist AI",
      "Build and train simple neural networks",
      "Classify images with convolutional neural networks",
      "Process text with embeddings, RNNs, and transformers",
      "Understand the basics of generative adversarial networks",
      "Discuss the ethical implications of AI systems",
    ],
    prerequisites: ["Basic Python knowledge", "Comfort running Jupyter notebooks locally or in the cloud"],
    toolsCovered: ["pytorch", "jupyter", "scikit-learn"],
    tags: ["python", "computer-vision", "nlp", "pytorch"],
    providerSlug: "microsoft",
    authorSlug: null,
    categorySlug: "data-science",
    externalUrl: "https://microsoft.github.io/AI-For-Beginners/",
    daysAgo: 320,
  },
  {
    title: "LangChain for LLM Application Development",
    tagline: "Build chains, memory, retrieval, and agents with the LangChain framework",
    description:
      "LangChain for LLM Application Development shows you how to expand the capabilities of language models by composing them with prompts, memory, data sources, and tools. The course is taught through concise notebooks so you can follow along and adapt every example.\n\nYou will learn to structure prompts and parse model outputs, add conversational memory, and build sequential chains that break complex tasks into steps. The course then covers question answering over your own documents using embeddings and vector stores, evaluating LLM applications with model-graded checks, and giving an agent tools such as search and a Python interpreter.\n\nDevelopers who already know the basics of prompting will leave with a practical toolkit for turning prototypes into useful applications.",
    type: "COURSE",
    level: "INTERMEDIATE",
    pricing: "FREE",
    priceUsd: null,
    format: "VIDEO",
    hasCertificate: false,
    featured: true,
    learnOutcomes: [
      "Use prompt templates and output parsers to structure model calls",
      "Add conversation memory to chat applications",
      "Compose sequential and router chains",
      "Answer questions over documents with embeddings and vector stores",
      "Evaluate LLM applications using model-graded checks",
      "Build agents that call tools to complete tasks",
    ],
    prerequisites: ["Basic Python programming", "Familiarity with prompting LLMs", "An API key for a hosted model"],
    toolsCovered: ["langchain", "chatgpt", "jupyter"],
    tags: ["langchain", "rag", "agents", "python"],
    providerSlug: "deeplearning-ai",
    authorSlug: "maya-okafor",
    categorySlug: "agents",
    externalUrl: "https://www.deeplearning.ai/short-courses/langchain-for-llm-application-development/",
    daysAgo: 18,
  },
  {
    title: "Midjourney Mastery",
    tagline: "Go from first prompt to consistent, portfolio-ready AI art and brand visuals",
    description:
      "Midjourney Mastery is a hands-on video tutorial series for creators who want to move past random results and start directing the model with intent. Each lesson focuses on a single technique and ends with a short exercise you can complete in minutes.\n\nYou will learn how prompt structure, stylize values, aspect ratios, and chaos settings shape an image, then graduate to style references, character references, and the editor for inpainting and outpainting. Later lessons cover building a consistent visual identity for a brand, creating product mockups, and preparing images for print and social media.\n\nWhether you are a designer, marketer, or hobbyist, you will leave with a repeatable workflow and a personal library of prompts that reliably deliver.",
    type: "TUTORIAL",
    level: "BEGINNER",
    pricing: "PAID",
    priceUsd: 49,
    format: "VIDEO",
    hasCertificate: false,
    featured: true,
    learnOutcomes: [
      "Write structured image prompts with predictable results",
      "Control output with stylize, chaos, and aspect ratio parameters",
      "Create consistent characters using reference images",
      "Edit images with inpainting and outpainting",
      "Develop a cohesive visual style for a brand campaign",
    ],
    prerequisites: ["An active Midjourney subscription", "No design experience required"],
    toolsCovered: ["midjourney", "canva"],
    tags: ["diffusion", "multimodal"],
    providerSlug: "udemy",
    authorSlug: "sofia-marchetti",
    categorySlug: "image-video",
    externalUrl: "https://www.udemy.com/course/midjourney-mastery/",
    daysAgo: 6,
  },
  {
    title: "The Rundown AI Daily",
    tagline: "The most important AI news and tools, explained in a five-minute daily read",
    description:
      "The Rundown AI Daily delivers a concise briefing on the biggest developments in artificial intelligence every weekday morning. Each issue leads with the top story, explains why it matters, and highlights practical implications for your work.\n\nBeyond headlines, every edition features a quick tutorial showing how to use a new tool or technique, a roundup of trending AI products, and a handful of short updates from research labs and startups. The writing is plain-spoken and skimmable, so you stay informed without drowning in jargon.\n\nIt is built for busy professionals, founders, and curious learners who want to keep pace with AI in a few minutes a day.",
    type: "NEWSLETTER",
    level: "BEGINNER",
    pricing: "FREE",
    priceUsd: null,
    format: "TEXT",
    hasCertificate: false,
    featured: false,
    learnOutcomes: [
      "Stay current on major model releases and AI industry news",
      "Discover new AI tools relevant to your role",
      "Learn one practical AI workflow every issue",
      "Understand the business impact of new developments",
      "Spot trends before they become mainstream",
    ],
    prerequisites: ["An email address", "Curiosity about AI"],
    toolsCovered: ["chatgpt", "claude", "perplexity"],
    tags: ["productivity", "gpt-4", "automation"],
    providerSlug: "the-rundown-ai",
    authorSlug: "clara-lindqvist",
    categorySlug: "business-productivity",
    externalUrl: "https://www.therundown.ai/",
    daysAgo: 1,
  },
  {
    title: "Latent Space",
    tagline: "Deep, technical coverage of AI engineering from the people building it",
    description:
      "Latent Space is a newsletter for AI engineers who want more than surface-level news. Each issue digs into the models, infrastructure, and techniques that matter for teams shipping AI products, often drawing on long-form interviews with researchers and founders.\n\nRecurring themes include agent architectures, evaluation practices, inference economics, open-weight models, and the evolving AI engineering stack. Essays are opinionated and well-sourced, and the weekly recaps help you separate genuinely important releases from launch-day hype.\n\nIf you build with LLMs professionally and want context you cannot get from release notes, this is essential reading.",
    type: "NEWSLETTER",
    level: "INTERMEDIATE",
    pricing: "FREEMIUM",
    priceUsd: null,
    format: "TEXT",
    hasCertificate: false,
    featured: false,
    learnOutcomes: [
      "Follow the evolving AI engineering stack",
      "Understand trade-offs between open and closed models",
      "Learn evaluation and deployment practices from practitioners",
      "Track trends in agents and inference infrastructure",
      "Hear first-hand insights from AI researchers and founders",
    ],
    prerequisites: ["Some experience building with LLM APIs", "Familiarity with software engineering concepts"],
    toolsCovered: ["claude", "chatgpt", "cursor"],
    tags: ["agents", "open-source", "evaluation", "mlops"],
    providerSlug: "latent-space",
    authorSlug: null,
    categorySlug: "llms",
    externalUrl: "https://www.latent.space/",
    daysAgo: 45,
  },
  {
    title: "Ben's Bites",
    tagline: "A friendly daily digest of AI launches, tools, and workflows for builders",
    description:
      "Ben's Bites is one of the most widely read AI newsletters, known for its approachable tone and sharp curation. Each issue rounds up the day's notable launches, funding news, and clever uses of AI, with a sentence or two on why each item is worth your attention.\n\nThe newsletter leans practical, highlighting tools you can try immediately and workflows other builders are using to save time. Premium members also get access to deeper tutorials, a community of makers, and recordings of live sessions.\n\nIt is a great fit for founders, operators, and makers who want to spot useful AI tools early and learn how others put them to work.",
    type: "NEWSLETTER",
    level: "BEGINNER",
    pricing: "FREEMIUM",
    priceUsd: 19,
    format: "TEXT",
    hasCertificate: false,
    featured: false,
    learnOutcomes: [
      "Discover promising AI tools as they launch",
      "Learn practical workflows from other builders",
      "Understand funding and market trends in AI",
      "Find inspiration for your own AI-powered projects",
      "Build a habit of steady, low-effort learning",
    ],
    prerequisites: ["An email address", "Interest in AI products and startups"],
    toolsCovered: ["chatgpt", "zapier", "notion-ai"],
    tags: ["productivity", "no-code", "automation"],
    providerSlug: "bens-bites",
    authorSlug: null,
    categorySlug: "business-productivity",
    externalUrl: "https://www.bensbites.com/",
    daysAgo: 30,
  },
  {
    title: "Prompt Engineering Guide",
    tagline: "Strategies and tactics for getting consistently better results from LLMs",
    description:
      "The Prompt Engineering Guide collects proven strategies for getting better results from large language models into a single, well-organized reference. It is written for anyone who uses models through a chat interface or an API and wants outputs that are more accurate, consistent, and useful.\n\nThe guide covers writing clear instructions, providing reference text, splitting complex tasks into simpler subtasks, giving the model time to think, using external tools, and testing changes systematically. Each strategy comes with concrete tactics and before-and-after examples you can reuse immediately.\n\nKeep it open while you work: it is short enough to read in an afternoon and detailed enough to return to whenever a prompt is not behaving.",
    type: "EBOOK",
    level: "BEGINNER",
    pricing: "FREE",
    priceUsd: null,
    format: "PDF",
    hasCertificate: false,
    featured: false,
    learnOutcomes: [
      "Write clear, specific instructions that reduce ambiguity",
      "Use delimiters and reference text to ground responses",
      "Break complex tasks into manageable subtasks",
      "Prompt models to reason step by step before answering",
      "Evaluate prompt changes with systematic tests",
      "Combine models with external tools for better accuracy",
    ],
    prerequisites: ["Access to any modern chat assistant", "No programming required"],
    toolsCovered: ["chatgpt", "claude", "gemini"],
    tags: ["prompt-design", "gpt-4", "api"],
    providerSlug: "openai",
    authorSlug: null,
    categorySlug: "prompt-engineering",
    externalUrl: "https://platform.openai.com/docs/guides/prompt-engineering",
    daysAgo: 260,
  },
  {
    title: "AI for Everyone",
    tagline: "A non-technical course on what AI can and cannot do for your organization",
    description:
      "AI for Everyone is a non-technical course that helps you understand AI terminology, what AI can realistically do, and how to spot opportunities to apply it in your organization. It has become one of the most popular introductions to AI for business professionals worldwide.\n\nYou will learn what machine learning and data science actually mean, what the workflow of an AI project looks like, and how to choose projects that are both valuable and feasible. The course also discusses how to build an AI team, how AI is reshaping industries and jobs, and the societal and ethical questions leaders need to consider.\n\nIt is designed for managers, executives, and anyone who wants to participate in AI conversations with confidence, no coding required.",
    type: "COURSE",
    level: "BEGINNER",
    pricing: "FREEMIUM",
    priceUsd: 49,
    format: "VIDEO",
    hasCertificate: true,
    featured: true,
    learnOutcomes: [
      "Explain common AI terminology in plain language",
      "Recognize realistic and unrealistic AI capabilities",
      "Identify valuable AI opportunities in your organization",
      "Understand the workflow of machine learning and data science projects",
      "Plan how to build and work with an AI team",
      "Discuss the societal impact and ethics of AI",
    ],
    prerequisites: ["No technical background required", "Interest in how AI affects business"],
    toolsCovered: ["chatgpt", "notion-ai"],
    tags: ["productivity", "responsible-ai", "analytics"],
    providerSlug: "coursera",
    authorSlug: "amara-bello",
    categorySlug: "business-productivity",
    externalUrl: "https://www.coursera.org/learn/ai-for-everyone",
    daysAgo: 400,
  },
  {
    title: "Generative AI with Large Language Models",
    tagline: "Understand the LLM lifecycle from pretraining to fine-tuning and deployment",
    description:
      "Generative AI with Large Language Models teaches the fundamentals of how generative AI works and how to deploy it in real-world applications. Developed with practitioners who build and run these systems at scale, it focuses on the decisions you face across the full model lifecycle.\n\nYou will study the transformer architecture, scaling laws, and pretraining, then learn instruction fine-tuning and parameter-efficient methods such as LoRA. The course explains reinforcement learning from human feedback, model evaluation with standard benchmarks, and optimization techniques like quantization and distillation for efficient inference, with hands-on labs in a cloud environment.\n\nIt is aimed at data scientists and engineers who already know Python and basic machine learning and want a rigorous grounding in LLMs.",
    type: "COURSE",
    level: "INTERMEDIATE",
    pricing: "FREEMIUM",
    priceUsd: 49,
    format: "VIDEO",
    hasCertificate: true,
    featured: true,
    learnOutcomes: [
      "Describe the generative AI project lifecycle end to end",
      "Explain transformer architecture and scaling laws",
      "Fine-tune models with instruction tuning and LoRA",
      "Align models using reinforcement learning from human feedback",
      "Evaluate LLMs using standard metrics and benchmarks",
      "Optimize models for inference with quantization and distillation",
    ],
    prerequisites: ["Intermediate Python programming", "Basic machine learning knowledge", "Familiarity with cloud notebooks"],
    toolsCovered: ["hugging-face", "pytorch", "sagemaker"],
    tags: ["fine-tuning", "transformers", "rag", "mlops"],
    providerSlug: "aws",
    authorSlug: "rohan-mehta",
    categorySlug: "llms",
    externalUrl: "https://www.coursera.org/learn/generative-ai-with-llms",
    daysAgo: 60,
  },
  {
    title: "Stanford CS224N: Natural Language Processing with Deep Learning",
    tagline: "Graduate-level NLP lectures covering word vectors through modern LLMs",
    description:
      "CS224N is Stanford's flagship course on natural language processing with deep learning, and its full lecture series is available online. It offers a rigorous, research-oriented introduction to the ideas behind today's language models.\n\nThe course begins with word vectors and neural network fundamentals, then covers dependency parsing, recurrent networks, sequence-to-sequence models, attention, and the transformer. Later lectures explore pretraining, prompting, reinforcement learning from human feedback, question answering, and the societal impact of large models, with challenging assignments implemented in PyTorch.\n\nIt is best suited to learners with strong programming skills and comfort with calculus, linear algebra, and probability who want to understand NLP at a deep level.",
    type: "COURSE",
    level: "ADVANCED",
    pricing: "FREE",
    priceUsd: null,
    format: "VIDEO",
    hasCertificate: false,
    featured: false,
    learnOutcomes: [
      "Derive and implement word embedding algorithms",
      "Build neural dependency parsers",
      "Implement attention and transformer models in PyTorch",
      "Understand pretraining, prompting, and RLHF",
      "Critically read current NLP research papers",
    ],
    prerequisites: ["Proficiency in Python", "College-level calculus and linear algebra", "Basic probability and statistics"],
    toolsCovered: ["pytorch", "jupyter", "hugging-face"],
    tags: ["nlp", "transformers", "pytorch"],
    providerSlug: "stanford-online",
    authorSlug: null,
    categorySlug: "llms",
    externalUrl: "https://web.stanford.edu/class/cs224n/",
    daysAgo: 480,
  },
  {
    title: "MIT 6.S191: Introduction to Deep Learning",
    tagline: "MIT's fast-paced bootcamp on deep learning foundations and modern applications",
    description:
      "MIT 6.S191 is an intensive introduction to deep learning methods with applications in computer vision, natural language, biology, and more. Lectures are updated every year to reflect the latest advances, and all materials are freely available online.\n\nThe program covers the foundations of neural networks, sequence modeling with recurrent networks and transformers, convolutional networks for vision, generative modeling with autoencoders and diffusion, and deep reinforcement learning. Software labs in Python let you build a music generation model, a facial detection system with bias mitigation, and fine-tune a language model.\n\nIt is a great fit for learners with basic calculus and Python experience who want a compact but thorough grounding in the field.",
    type: "COURSE",
    level: "INTERMEDIATE",
    pricing: "FREE",
    priceUsd: null,
    format: "VIDEO",
    hasCertificate: false,
    featured: false,
    learnOutcomes: [
      "Explain how neural networks learn through backpropagation",
      "Model sequences with RNNs and transformers",
      "Build convolutional networks for image tasks",
      "Understand generative models including diffusion",
      "Apply deep reinforcement learning to control problems",
      "Identify and mitigate algorithmic bias in vision models",
    ],
    prerequisites: ["Basic Python programming", "Calculus and linear algebra fundamentals"],
    toolsCovered: ["pytorch", "jupyter"],
    tags: ["computer-vision", "reinforcement-learning", "pytorch"],
    providerSlug: "mit-opencourseware",
    authorSlug: "leila-farahani",
    categorySlug: "data-science",
    externalUrl: "https://introtodeeplearning.com/",
    daysAgo: 120,
  },
  {
    title: "Kaggle Intro to Machine Learning",
    tagline: "Learn the core ideas in machine learning and build your first models in hours",
    description:
      "Kaggle's Intro to Machine Learning is a free, hands-on micro-course that gets you building models right away. Every lesson is short and followed by an interactive coding exercise that runs directly in the browser, so there is nothing to install.\n\nYou will learn how models work, explore data with pandas, build your first decision tree, and validate it properly. The course then covers underfitting and overfitting, introduces random forests, and finishes by entering a real Kaggle competition with your own predictions.\n\nIt is an ideal starting point for aspiring data scientists who know a little Python and want quick, practical wins before tackling deeper material.",
    type: "COURSE",
    level: "BEGINNER",
    pricing: "FREE",
    priceUsd: null,
    format: "INTERACTIVE",
    hasCertificate: true,
    featured: false,
    learnOutcomes: [
      "Explore and summarize datasets with pandas",
      "Build and fit a decision tree model",
      "Validate models with a proper train and validation split",
      "Recognize and address underfitting and overfitting",
      "Improve accuracy with random forests",
      "Submit predictions to a Kaggle competition",
    ],
    prerequisites: ["Basic Python syntax", "A free Kaggle account"],
    toolsCovered: ["pandas", "scikit-learn", "jupyter"],
    tags: ["python", "analytics"],
    providerSlug: "kaggle",
    authorSlug: null,
    categorySlug: "data-science",
    externalUrl: "https://www.kaggle.com/learn/intro-to-machine-learning",
    daysAgo: 360,
  },
  {
    title: "Building RAG Agents with LLMs",
    tagline: "Design, deploy, and scale retrieval-augmented agents on accelerated infrastructure",
    description:
      "Building RAG Agents with LLMs is a hands-on workshop that teaches you to design retrieval-augmented generation systems and deploy them as agents that can reason over large document collections. Labs run in a GPU-accelerated cloud environment so you can work with realistic workloads.\n\nYou will orchestrate LLM pipelines with LangChain, manage conversational state, and build document ingestion with chunking and embeddings. The course then covers vector stores, retrieval strategies, guardrails, and evaluation of RAG quality, before you assemble a complete agent and serve it behind a web interface.\n\nIt is designed for developers comfortable with Python who want to move from notebook experiments to scalable, production-minded RAG applications.",
    type: "COURSE",
    level: "ADVANCED",
    pricing: "PAID",
    priceUsd: 99,
    format: "INTERACTIVE",
    hasCertificate: true,
    featured: false,
    learnOutcomes: [
      "Orchestrate multi-step LLM pipelines with LangChain",
      "Ingest and chunk documents for retrieval",
      "Build and query vector stores with embeddings",
      "Add guardrails to keep agents on topic",
      "Evaluate RAG pipelines with LLM-as-a-judge techniques",
      "Deploy a RAG agent as a scalable service",
    ],
    prerequisites: ["Intermediate Python", "Experience with LLM APIs", "Basic understanding of web services"],
    toolsCovered: ["langchain", "hugging-face", "pinecone"],
    tags: ["rag", "agents", "langchain", "vector-databases"],
    providerSlug: "nvidia",
    authorSlug: "maya-okafor",
    categorySlug: "agents",
    externalUrl: "https://learn.nvidia.com/courses/course-detail?course_id=course-v1:DLI+S-FX-15+V1",
    daysAgo: 75,
  },
  {
    title: "AI Pair Programming with Cursor and GitHub Copilot",
    tagline: "Everyday workflows for writing, refactoring, and testing code with AI",
    description:
      "This tutorial series shows how professional developers actually use AI coding assistants day to day. Instead of flashy demos, every video tackles a realistic task in an existing codebase and shows the prompts, context, and review habits that make AI help rather than hinder.\n\nYou will set up Cursor and GitHub Copilot, learn when to use inline completions versus chat and agent modes, and give the assistant the right context from your repository. Later lessons cover large refactors, generating and fixing tests, debugging production issues, and writing project rules so the AI follows your team's conventions.\n\nIt is aimed at working developers who want to ship faster without sacrificing code quality or understanding.",
    type: "TUTORIAL",
    level: "INTERMEDIATE",
    pricing: "PAID",
    priceUsd: 29,
    format: "VIDEO",
    hasCertificate: false,
    featured: false,
    learnOutcomes: [
      "Configure Cursor and Copilot for a real project",
      "Choose between completions, chat, and agent modes",
      "Provide effective codebase context to the assistant",
      "Refactor and test code safely with AI help",
      "Write project rules that enforce team conventions",
    ],
    prerequisites: ["Professional or hobby programming experience", "Git basics", "A code editor installed locally"],
    toolsCovered: ["cursor", "github-copilot", "claude"],
    tags: ["python", "productivity", "api"],
    providerSlug: "udemy",
    authorSlug: "ethan-caldwell",
    categorySlug: "coding",
    externalUrl: "https://www.udemy.com/course/ai-pair-programming-cursor-copilot/",
    daysAgo: 12,
  },
  {
    title: "Runway Gen-3 Video Crash Course",
    tagline: "Turn stills and text into cinematic AI video with Runway's generation tools",
    description:
      "This crash course is a compact set of video tutorials that teaches you to create compelling AI-generated video with Runway. It is designed so you can go from a blank project to a finished short sequence in a single weekend.\n\nYou will learn text-to-video and image-to-video generation, camera control, motion brush, and how to extend and stitch clips into a coherent scene. The course also covers pairing generated footage with AI voiceover and music, and finishing your edit with color and pacing that feel intentional rather than random.\n\nFilmmakers, social media creators, and marketers will leave with a repeatable workflow for producing short-form video concepts quickly.",
    type: "TUTORIAL",
    level: "BEGINNER",
    pricing: "FREE",
    priceUsd: null,
    format: "VIDEO",
    hasCertificate: false,
    featured: false,
    learnOutcomes: [
      "Generate video from text prompts and still images",
      "Direct camera movement and motion within a shot",
      "Extend and combine clips into a coherent sequence",
      "Add AI-generated voiceover and soundtrack",
      "Finish a short film with pacing and color grading",
    ],
    prerequisites: ["A free Runway account", "Basic familiarity with video editing concepts"],
    toolsCovered: ["runway", "elevenlabs", "midjourney"],
    tags: ["multimodal", "diffusion"],
    providerSlug: "runway",
    authorSlug: "sofia-marchetti",
    categorySlug: "image-video",
    externalUrl: "https://academy.runwayml.com/",
    daysAgo: 88,
  },
  {
    title: "Automate Your Work with AI: The Zapier Playbook",
    tagline: "Connect AI to the apps you already use and eliminate repetitive busywork",
    description:
      "The Zapier Playbook is a practical guide to combining AI with automation so routine work happens without you. It focuses on real workflows that teams in sales, support, marketing, and operations use every day.\n\nYou will learn how to spot tasks worth automating, build multi-step workflows that pass data between apps, and insert AI steps to summarize, classify, draft, and route information. The guide also covers testing, handling errors gracefully, and keeping humans in the loop for decisions that matter.\n\nNo coding is required, making it a strong fit for operators and team leads who want quick, measurable productivity gains.",
    type: "GUIDE",
    level: "BEGINNER",
    pricing: "FREE",
    priceUsd: null,
    format: "TEXT",
    hasCertificate: false,
    featured: false,
    learnOutcomes: [
      "Identify repetitive tasks that are good automation candidates",
      "Build multi-step workflows across business apps",
      "Add AI steps to summarize, classify, and draft content",
      "Keep a human in the loop for sensitive decisions",
      "Monitor and troubleshoot running automations",
    ],
    prerequisites: ["A free Zapier account", "Access to the apps you want to connect"],
    toolsCovered: ["zapier", "chatgpt", "notion-ai"],
    tags: ["automation", "no-code", "productivity"],
    providerSlug: "zapier",
    authorSlug: "marcus-hale",
    categorySlug: "business-productivity",
    externalUrl: "https://zapier.com/blog/ai-automation-guide/",
    daysAgo: 140,
  },
  {
    title: "The AI Marketing Playbook",
    tagline: "How modern marketing teams use AI for content, SEO, and campaigns",
    description:
      "The AI Marketing Playbook is a free ebook that shows how marketing teams are putting AI to work across the funnel. It combines survey data from marketers with step-by-step frameworks you can adopt immediately.\n\nChapters cover building brand voice guidelines for AI, generating and repurposing content, researching keywords and planning SEO clusters, personalizing email campaigns, and analyzing results. Each chapter closes with ready-to-use prompts and a checklist for keeping quality and accuracy high.\n\nIt is written for marketers of any experience level who want to work faster while staying on brand.",
    type: "EBOOK",
    level: "BEGINNER",
    pricing: "FREE",
    priceUsd: null,
    format: "PDF",
    hasCertificate: false,
    featured: false,
    learnOutcomes: [
      "Create brand voice guidelines that AI tools can follow",
      "Generate and repurpose content across channels",
      "Plan SEO topic clusters with AI-assisted research",
      "Personalize email campaigns at scale",
      "Measure the impact of AI on marketing performance",
    ],
    prerequisites: ["Basic marketing knowledge", "Access to an AI writing assistant"],
    toolsCovered: ["chatgpt", "jasper", "canva"],
    tags: ["copywriting", "seo", "analytics"],
    providerSlug: "hubspot-academy",
    authorSlug: "oliver-grant",
    categorySlug: "marketing",
    externalUrl: "https://offers.hubspot.com/ai-marketing",
    daysAgo: 200,
  },
  {
    title: "Designing with AI in Figma",
    tagline: "Speed up ideation, layout, and prototyping with Figma's built-in AI tools",
    description:
      "Designing with AI in Figma is a short tutorial series on using AI features inside the design tool you already know. Each video tackles one step of the product design process and shows exactly where AI saves time and where your judgment still matters.\n\nYou will generate first-draft layouts from a prompt, rename and organize layers automatically, create realistic content for mockups, and turn static frames into interactive prototypes. The series also covers searching your design system visually and pairing Figma with external generators for imagery and code.\n\nProduct designers and design-curious developers will come away with a faster, more experimental workflow.",
    type: "TUTORIAL",
    level: "BEGINNER",
    pricing: "FREE",
    priceUsd: null,
    format: "VIDEO",
    hasCertificate: false,
    featured: false,
    learnOutcomes: [
      "Generate first-draft UI layouts from prompts",
      "Automate layer naming and file organization",
      "Populate mockups with realistic content",
      "Build interactive prototypes quickly",
      "Combine Figma with external AI image and code tools",
    ],
    prerequisites: ["Basic Figma experience", "A Figma account with AI features enabled"],
    toolsCovered: ["figma", "v0", "midjourney"],
    tags: ["ui-design", "productivity", "no-code"],
    providerSlug: "figma",
    authorSlug: "ines-duarte",
    categorySlug: "design",
    externalUrl: "https://help.figma.com/hc/en-us/articles/23870272542231-Use-AI-tools-in-Figma",
    daysAgo: 33,
  },
  {
    title: "Responsible Generative AI: Principles in Practice",
    tagline: "Turn responsible AI principles into concrete practices for your team",
    description:
      "This guide translates high-level responsible AI principles into concrete practices that product and engineering teams can follow. It draws on years of experience deploying machine learning systems used by billions of people.\n\nTopics include designing with human-centered goals, identifying multiple metrics for fairness and quality, examining raw data for gaps and biases, understanding model limitations, and testing rigorously before and after launch. Dedicated sections address the new risks introduced by generative models, including hallucinations, harmful content, and misuse.\n\nIt is written for practitioners and leaders who want actionable steps rather than abstract ethics, and it pairs well with any technical AI curriculum.",
    type: "GUIDE",
    level: "INTERMEDIATE",
    pricing: "FREE",
    priceUsd: null,
    format: "TEXT",
    hasCertificate: false,
    featured: false,
    learnOutcomes: [
      "Apply human-centered design to AI products",
      "Choose multiple metrics to assess fairness and quality",
      "Audit training data for gaps and biases",
      "Communicate model limitations to users",
      "Plan testing and monitoring for generative AI risks",
    ],
    prerequisites: ["General familiarity with how ML products are built", "Interest in AI governance"],
    toolsCovered: ["gemini", "hugging-face"],
    tags: ["responsible-ai", "evaluation"],
    providerSlug: "google",
    authorSlug: "nadia-haddad",
    categorySlug: "ethics-safety",
    externalUrl: "https://ai.google/responsibility/responsible-ai-practices/",
    daysAgo: 250,
  },
];

// ---------------------------------------------------------------------------
// Generated resource templates
// ---------------------------------------------------------------------------

const TYPE_WORD: Record<ResourceType, string> = {
  COURSE: "course",
  GUIDE: "guide",
  EBOOK: "ebook",
  TUTORIAL: "tutorial",
  NEWSLETTER: "newsletter",
};

const URL_PATH: Record<ResourceType, string> = {
  COURSE: "courses",
  GUIDE: "guides",
  EBOOK: "ebooks",
  TUTORIAL: "tutorials",
  NEWSLETTER: "newsletter",
};

interface Ctx {
  title: string;
  topic: string;
  topicLower: string;
  tool: string;
  tool2: string;
  project: string;
  concepts: string[];
  provider: string;
  level: Level;
  type: ResourceType;
}

function titleFor(type: ResourceType, cat: CategorySeed, topic: string, tool: string, project: string): string {
  const projectTitle = project
    .split(" ")
    .map((w) => (/^[a-z]/.test(w) && !["and", "with", "for", "of"].includes(w) ? capitalize(w) : w))
    .join(" ");
  const templates: Record<ResourceType, string[]> = {
    COURSE: [`${topic} Fundamentals`, `Mastering ${topic}`, `${topic} with ${tool}: From Zero to Production`, `Applied ${topic} Bootcamp`, `${topic} for Professionals`, `The Complete ${topic} Course`, `Hands-On ${topic}`],
    GUIDE: [`The Practical Guide to ${topic}`, `${topic}: A Field Guide`, `A Beginner's Guide to ${topic}`, `${topic} Best Practices`, `Getting Started with ${topic} in ${tool}`, `How to Build a ${projectTitle}`],
    EBOOK: [`The ${topic} Handbook`, `The ${topic} Playbook`, `${topic} in Practice`, `${topic}: Patterns and Pitfalls`, `The Definitive Guide to ${topic}`],
    TUTORIAL: [`Build a ${projectTitle} with ${tool}`, `${tool} Crash Course: ${topic}`, `${topic} in One Weekend`, `Quickstart: ${topic} with ${tool}`, `Step-by-Step ${topic} with ${tool}`],
    NEWSLETTER: [`${topic} Weekly`, `The ${topic} Digest`, `${topic} Insider`, `This Week in ${topic}`, `The ${cat.name} Brief`],
  };
  return pick(templates[type]);
}

function taglineFor(ctx: Ctx): string {
  const t = ctx.topicLower;
  const byType: Record<ResourceType, string[]> = {
    COURSE: [`Master ${t} with hands-on projects and expert guidance`, `A structured path to real-world skills in ${t}`, `Go from fundamentals to confident practice in ${t}`, `Build a ${ctx.project} while learning ${t} step by step`],
    GUIDE: [`A practical, no-fluff walkthrough of ${t}`, `Everything you need to start using ${t} effectively`, `Clear frameworks and examples for ${t}`, `The essential playbook for ${t} with ${ctx.tool}`],
    EBOOK: [`An in-depth reference on ${t} you will keep coming back to`, `Proven patterns, pitfalls, and case studies in ${t}`, `A thorough, example-rich book on ${t}`],
    TUTORIAL: [`Build a ${ctx.project} with ${ctx.tool} in a few focused sessions`, `Follow along and ship a working ${ctx.project}`, `Quick, practical videos on ${t} with ${ctx.tool}`],
    NEWSLETTER: [`The most important updates in ${t}, curated weekly`, `A short, sharp briefing on ${t} for busy professionals`, `Stay ahead in ${t} in five minutes a week`],
  };
  const options = byType[ctx.type].filter((s) => s.length <= 90);
  return options.length > 0 ? pick(options) : `Learn ${t} with ${ctx.tool}`.slice(0, 90);
}

function descriptionFor(ctx: Ctx): string {
  const [c1, c2, c3] = [must(ctx.concepts[0], "c1"), must(ctx.concepts[1], "c2"), must(ctx.concepts[2], "c3")];
  const typeWord = TYPE_WORD[ctx.type];

  if (ctx.type === "NEWSLETTER") {
    const p1 = pick([
      `${ctx.title} lands in your inbox every week with the developments in ${ctx.topicLower} that actually matter. Each issue is edited to be read in a few minutes, so you stay informed without the noise.`,
      `${ctx.title} is a curated newsletter from ${ctx.provider} for people who want to keep up with ${ctx.topicLower}. Every edition filters dozens of announcements down to the handful worth your time.`,
    ]);
    const p2 = pick([
      `Issues typically open with a lead story, followed by a short explainer on topics like ${c1} and ${c2}, a tool spotlight featuring ${ctx.tool}, and quick links to research and product launches.`,
      `Regular sections include a deep dive on ${c1}, practical tips for ${c2}, and a roundup of new tools, with ${ctx.tool} and ${ctx.tool2} among the frequent favorites.`,
    ]);
    const p3 = pick([
      `It is written for practitioners, founders, and curious learners who want context, not just headlines.`,
      `Subscribers range from engineers to executives, and the tone stays clear and jargon-light throughout.`,
    ]);
    return [p1, p2, p3].join("\n\n");
  }

  const p1 = pick([
    `${ctx.title} is a ${typeWord} that takes you from the core ideas of ${ctx.topicLower} to confident, real-world use. Instead of abstract theory, every section is anchored in a concrete ${ctx.project}.`,
    `${capitalize(ctx.topicLower)} is changing how teams work, and this ${typeWord} from ${ctx.provider} gives you a structured path to keep up. It focuses on the techniques practitioners rely on today, explained clearly and without hype.`,
    `This ${typeWord} is a focused, practical introduction to ${ctx.topicLower}. It was designed around the questions people ask most often when they try to apply these ideas at work.`,
  ]);
  const p2 = pick([
    `You will work through ${c1}, ${c2}, and ${c3}, with worked examples you can adapt to your own projects. Along the way you will use ${ctx.tool} and ${ctx.tool2} to put each idea into practice.`,
    `The material covers ${c1} and ${c2} in depth before moving on to ${c3}. Each concept is paired with an exercise in ${ctx.tool}, so you finish with working artifacts rather than just notes.`,
    `Topics include ${c1}, ${c2}, and ${c3}, and the final section brings them together as you build a complete ${ctx.project} using ${ctx.tool}.`,
  ]);
  const audience: Record<Level, string[]> = {
    BEGINNER: [
      `No prior experience is required, making it a great starting point for newcomers who want a solid foundation.`,
      `It is well suited to beginners and career changers who want practical skills they can use right away.`,
    ],
    INTERMEDIATE: [
      `It is aimed at learners who already know the basics and want to deepen their skills with more realistic scenarios.`,
      `If you have dabbled with ${ctx.tool} and want to move from experiments to reliable results, this is for you.`,
    ],
    ADVANCED: [
      `It is intended for experienced practitioners who want rigorous, production-level depth.`,
      `Expect a fast pace and challenging material designed for people already working in the field.`,
    ],
  };
  const includeP3 = chance(0.75);
  return includeP3 ? [p1, p2, pick(audience[ctx.level])].join("\n\n") : [p1, p2].join("\n\n");
}

function outcomesFor(ctx: Ctx, cat: CategorySeed): string[] {
  const concepts = faker.helpers.shuffle([...cat.concepts]);
  const c = (i: number) => concepts[i % concepts.length] ?? "core techniques";
  const pool = [
    `Explain how ${c(0)} works and when to use it`,
    `Apply ${c(1)} to a real ${ctx.project}`,
    `Use ${ctx.tool} to streamline ${c(2)}`,
    `Build a working ${ctx.project} from scratch`,
    `Evaluate and improve results using ${c(3)}`,
    `Avoid the most common pitfalls with ${c(4)}`,
    `Combine ${ctx.tool} and ${ctx.tool2} in a repeatable workflow`,
    `Communicate the value of ${ctx.topicLower} to stakeholders`,
  ];
  if (ctx.type === "NEWSLETTER") {
    return sample(
      [
        `Stay current on the latest developments in ${ctx.topicLower}`,
        `Discover new tools and techniques as they emerge`,
        `Understand how ${c(0)} is evolving in practice`,
        `Learn practical tips for ${c(1)} from real teams`,
        `Spot meaningful trends before they go mainstream`,
        `Get a curated reading list without the noise`,
      ],
      5,
      6,
    );
  }
  return sample(pool, 5, 6).map(capitalize);
}

function prerequisitesFor(level: Level, cat: CategorySeed, tool: string): string[] {
  const technical: Record<Level, string[]> = {
    BEGINNER: ["No prior AI experience required", "Basic computer literacy", "Some exposure to Python is helpful but not required"],
    INTERMEDIATE: ["Working knowledge of Python", `Some hands-on experience with ${tool}`, "Familiarity with basic machine learning terminology"],
    ADVANCED: ["Solid Python programming skills", "Experience training or deploying models", "Comfort with linear algebra and probability"],
  };
  const nonTechnical: Record<Level, string[]> = {
    BEGINNER: ["No prior AI experience required", "Comfort using web apps and online tools", "Curiosity and a willingness to experiment"],
    INTERMEDIATE: [`Some experience using ${tool} or a similar tool`, "A basic understanding of how chat assistants work", "A real project or workflow to practice on"],
    ADVANCED: ["Several months of hands-on experience with AI tools", "Experience leading projects or teams", "Familiarity with your organization's data and processes"],
  };
  return sample((cat.technical ? technical : nonTechnical)[level], 2, 3);
}

function faqsFor(spec: Pick<ResourceSpec, "type" | "level" | "pricing" | "priceUsd" | "hasCertificate" | "toolsCovered" | "language">, durationMinutes: number): Faq[] {
  const hours = durationMinutes / 60;
  const durationText = durationMinutes < 90 ? `about ${durationMinutes} minutes` : `roughly ${Math.round(hours)} hours`;
  const levelAnswer: Record<Level, string> = {
    BEGINNER: "No. It is designed for beginners and explains every concept from the ground up.",
    INTERMEDIATE: "Some familiarity with the basics is expected, but key concepts are reviewed before they are used.",
    ADVANCED: "Yes. It assumes solid prior experience and moves quickly through foundational material.",
  };
  const priceAnswer =
    spec.pricing === "FREE"
      ? "Yes, all of the content is available completely free."
      : spec.pricing === "PAID"
        ? `It is a paid resource${spec.priceUsd !== null ? ` priced at $${spec.priceUsd}` : ""}, with lifetime access to the materials.`
        : `The core content is free, with optional premium extras${spec.priceUsd !== null ? ` starting at $${spec.priceUsd}` : ""}.`;
  const tools = spec.toolsCovered.map(toolName).join(", ");

  if (spec.type === "NEWSLETTER") {
    return sample(
      [
        { question: "How often is it published?", answer: "New issues are sent weekly, with occasional special editions for major announcements." },
        { question: "How long does each issue take to read?", answer: `Most issues take ${durationText} to read end to end.` },
        { question: "Can I unsubscribe at any time?", answer: "Yes. Every email includes a one-click unsubscribe link." },
        { question: "Is it free?", answer: priceAnswer },
        { question: "Which tools are covered most often?", answer: `Recent issues have frequently featured ${tools}.` },
      ],
      3,
      4,
    );
  }

  return sample(
    [
      { question: "Do I need prior experience?", answer: levelAnswer[spec.level] },
      { question: "Is it free?", answer: priceAnswer },
      { question: "How long does it take to finish?", answer: `Most learners finish in ${durationText}, working at their own pace.` },
      {
        question: "Will I get a certificate?",
        answer: spec.hasCertificate ? "Yes, a shareable certificate of completion is available when you finish." : "No certificate is offered, but you will have practical projects to show for your work.",
      },
      { question: "Which tools will I use?", answer: `You will work with ${tools}.` },
      {
        question: "What language is it in?",
        answer: spec.language === "en" ? "The content is in English." : spec.language === "es" ? "The content is in Spanish." : "The content is in Hindi.",
      },
    ],
    3,
    4,
  );
}

const PRICE_POINTS: Record<ResourceType, number[]> = {
  COURSE: [49, 79, 99, 129, 149, 199, 249, 299, 399, 499],
  GUIDE: [19, 29, 39, 49],
  EBOOK: [19, 24, 29, 39, 49, 59],
  TUTORIAL: [19, 29, 39, 49, 79, 99],
  NEWSLETTER: [19, 29, 49],
};

const usedTitles = new Set<string>(HAND_WRITTEN.map((h) => h.title));

function generateSpec(type: ResourceType, cat: CategorySeed, publishedAt: Date, status: ResourceStatus): ResourceSpec {
  let title = "";
  let topic = "";
  let toolSlugs: string[] = [];
  let project = "";
  for (let attempt = 0; attempt < 30; attempt += 1) {
    topic = pick(cat.topics);
    toolSlugs = sample(cat.tools, 2, Math.min(5, cat.tools.length));
    project = pick(cat.projects);
    title = titleFor(type, cat, topic, toolName(must(toolSlugs[0], "tool")), project);
    if (!usedTitles.has(title)) break;
  }
  usedTitles.add(title);

  const level: Level =
    type === "NEWSLETTER"
      ? weighted<Level>([["BEGINNER", 55], ["INTERMEDIATE", 45]])
      : weighted<Level>([["BEGINNER", 40], ["INTERMEDIATE", 40], ["ADVANCED", 20]]);

  const pricingWeights: Record<ResourceType, ReadonlyArray<readonly [Pricing, number]>> = {
    COURSE: [["FREE", 40], ["PAID", 35], ["FREEMIUM", 25]],
    GUIDE: [["FREE", 70], ["FREEMIUM", 20], ["PAID", 10]],
    EBOOK: [["FREE", 40], ["PAID", 45], ["FREEMIUM", 15]],
    TUTORIAL: [["FREE", 50], ["PAID", 35], ["FREEMIUM", 15]],
    NEWSLETTER: [["FREE", 60], ["FREEMIUM", 40]],
  };
  const pricing = weighted(pricingWeights[type]);
  const priceUsd = pricing === "PAID" || (pricing === "FREEMIUM" && chance(0.5)) ? pick(PRICE_POINTS[type]) : null;

  const format: Format =
    type === "NEWSLETTER" ? "TEXT" : type === "EBOOK" ? "PDF" : type === "TUTORIAL" ? "VIDEO" : type === "COURSE" ? weighted<Format>([["VIDEO", 70], ["INTERACTIVE", 30]]) : weighted<Format>([["TEXT", 85], ["INTERACTIVE", 15]]);

  const providerSlug = pick(cat.providers);
  const provider = must(
    PROVIDERS.find((p) => slugify(p.name) === providerSlug),
    `provider ${providerSlug}`,
  );
  const concepts = sample(cat.concepts, 3);
  const ctx: Ctx = {
    title,
    topic,
    topicLower: lowerTopic(topic),
    tool: toolName(must(toolSlugs[0], "tool0")),
    tool2: toolName(must(toolSlugs[1], "tool1")),
    project,
    concepts,
    provider: provider.name,
    level,
    type,
  };

  const language = weighted<string>([["en", 92], ["es", 4], ["hi", 4]]);
  const tagPool = cat.tags.includes("productivity") ? cat.tags : [...cat.tags, "productivity"];

  return {
    title,
    tagline: taglineFor(ctx),
    description: descriptionFor(ctx),
    type,
    level,
    pricing,
    priceUsd,
    format,
    language,
    hasCertificate: type === "COURSE" ? chance(0.65) : type === "TUTORIAL" ? chance(0.1) : false,
    featured: false,
    learnOutcomes: outcomesFor(ctx, cat),
    prerequisites: prerequisitesFor(level, cat, ctx.tool),
    toolsCovered: toolSlugs,
    tags: sample(tagPool, 2, 4),
    providerSlug,
    authorSlug: chance(0.8) ? slugify(pick(AUTHORS).name) : null,
    categorySlug: cat.slug,
    externalUrl: null,
    publishedAt,
    status,
  };
}

// ---------------------------------------------------------------------------
// Syllabus (sections + lessons)
// ---------------------------------------------------------------------------

interface LessonDraft {
  title: string;
  order: number;
  durationMinutes: number;
  isPreview: boolean;
}

interface SectionDraft {
  title: string;
  order: number;
  lessons: LessonDraft[];
}

const LESSON_SHAPE: Record<ResourceType, { sections: [number, number]; lessons: [number, number]; perLesson: [number, number]; total: [number, number] }> = {
  COURSE: { sections: [3, 6], lessons: [3, 8], perLesson: [6, 70], total: [120, 3000] },
  GUIDE: { sections: [3, 6], lessons: [3, 6], perLesson: [2, 12], total: [20, 240] },
  EBOOK: { sections: [3, 6], lessons: [3, 8], perLesson: [5, 40], total: [90, 600] },
  TUTORIAL: { sections: [3, 5], lessons: [3, 6], perLesson: [2, 12], total: [15, 180] },
  NEWSLETTER: { sections: [2, 3], lessons: [3, 4], perLesson: [1, 2], total: [5, 15] },
};

const LESSON_TEMPLATES: Array<(c: string) => string> = [
  (c) => `Introduction to ${c}`,
  (c) => `Understanding ${c}`,
  (c) => `Hands-on: ${c}`,
  (c) => `${capitalize(c)} in practice`,
  (c) => `Common mistakes with ${c}`,
  (c) => `Deep dive: ${c}`,
  (c) => `Lab: applying ${c}`,
  (c) => `Case study: ${c} at scale`,
  (c) => `Recap and quiz: ${c}`,
  (c) => `Getting started with ${c}`,
  (c) => `Best practices for ${c}`,
  (c) => `Troubleshooting ${c}`,
];

function buildSyllabus(type: ResourceType, cat: CategorySeed, tools: string[]): { sections: SectionDraft[]; lessonCount: number; durationMinutes: number } {
  const shape = LESSON_SHAPE[type];
  const sectionCount = int(shape.sections[0], shape.sections[1]);
  const lessonCounts = Array.from({ length: sectionCount }, () => int(shape.lessons[0], shape.lessons[1]));
  const lessonCount = lessonCounts.reduce((a, b) => a + b, 0);

  // Pick a total duration and distribute it across lessons so the sum is exact.
  const lo = Math.max(shape.total[0], lessonCount * shape.perLesson[0]);
  const hi = Math.max(lo, Math.min(shape.total[1], lessonCount * shape.perLesson[1]));
  const total = int(lo, hi);
  const weights = Array.from({ length: lessonCount }, () => int(1, 10));
  const weightSum = weights.reduce((a, b) => a + b, 0);
  const remainder = total - lessonCount * shape.perLesson[0];
  const durations = weights.map((w) => shape.perLesson[0] + Math.floor((remainder * w) / weightSum));
  let leftover = total - durations.reduce((a, b) => a + b, 0);
  let idx = 0;
  while (leftover > 0) {
    const i = idx % lessonCount;
    durations[i] = (durations[i] ?? 0) + 1;
    leftover -= 1;
    idx += int(1, 3);
  }

  const themeIdx = faker.helpers
    .arrayElements(
      cat.sectionThemes.map((_, i) => i),
      Math.min(sectionCount, cat.sectionThemes.length),
    )
    .sort((a, b) => a - b);

  let issueNo = int(40, 220);
  const usedLessonTitles = new Set<string>();
  const conceptQueue = faker.helpers.shuffle([...cat.concepts]);
  let conceptCursor = 0;
  let durationCursor = 0;

  const sections: SectionDraft[] = lessonCounts.map((count, s) => {
    const theme = cat.sectionThemes[themeIdx[s % themeIdx.length] ?? 0] ?? "Core Concepts";
    let title: string;
    if (type === "NEWSLETTER") {
      title = `Issue #${issueNo}: ${theme}`;
      issueNo -= 1;
    } else if (type === "EBOOK") {
      title = `Chapter ${s + 1}: ${theme}`;
    } else if (type === "GUIDE") {
      title = `Part ${s + 1}: ${theme}`;
    } else {
      title = theme;
    }

    const lessons: LessonDraft[] = [];
    for (let l = 0; l < count; l += 1) {
      let lessonTitle = "";
      for (let attempt = 0; attempt < 20; attempt += 1) {
        const concept = conceptQueue[conceptCursor % conceptQueue.length] ?? "core ideas";
        conceptCursor += 1;
        if (type === "NEWSLETTER") {
          lessonTitle = pick([
            `Top story: what's new in ${concept}`,
            `Tool of the week: ${toolName(pick(tools))}`,
            `Quick hits on ${concept}`,
            `Deep dive: ${concept}`,
            `Reader question: ${concept}`,
            `Worth reading: ${concept}`,
          ]);
        } else {
          lessonTitle = pick(LESSON_TEMPLATES)(concept);
        }
        if (!usedLessonTitles.has(lessonTitle)) break;
      }
      usedLessonTitles.add(lessonTitle);
      lessons.push({
        title: capitalize(lessonTitle),
        order: l + 1,
        durationMinutes: durations[durationCursor] ?? shape.perLesson[0],
        isPreview: s === 0 && l < (type === "NEWSLETTER" ? 1 : 2) && (l === 0 || chance(0.6)),
      });
      durationCursor += 1;
    }
    return { title, order: s + 1, lessons };
  });

  const durationMinutes = sections.reduce((acc, sec) => acc + sec.lessons.reduce((a, les) => a + les.durationMinutes, 0), 0);
  return { sections, lessonCount, durationMinutes };
}

// ---------------------------------------------------------------------------
// Reviews
// ---------------------------------------------------------------------------

const REVIEW_TITLES: Record<number, string[]> = {
  5: ["Absolutely worth it", "Best resource I've found on this topic", "Clear, practical, and well paced", "Exceeded my expectations", "A must for anyone getting started", "Finally, it clicked", "Top-notch material", "Changed how I work every day"],
  4: ["Very solid overall", "Great content with a few rough edges", "Practical and useful", "Recommended, with minor caveats", "Good depth, good examples", "Well structured and informative"],
  3: ["Decent but uneven", "Useful, though not for everyone", "Good start, needs more depth", "Some great parts, some filler", "Okay for the time invested"],
  2: ["Too shallow for me", "Felt outdated in places", "Expected more hands-on work", "Not what the description promised"],
  1: ["Disappointing", "Would not recommend", "Mostly recycled content"],
};

const REVIEW_SENTENCES: Record<number, string[]> = {
  5: [
    "The explanations are crisp and the examples map directly to problems I face at work.",
    "I went from confused to confident in about a week of evenings.",
    "Every section builds on the last, so nothing feels disconnected.",
    "I've already used what I learned to ship a small internal tool.",
    "The instructor clearly knows the material and never wastes your time.",
    "Loved the balance between concepts and hands-on exercises.",
    "This is the resource I now recommend to everyone on my team.",
    "The pacing is perfect and the exercises are genuinely challenging.",
    "It cut through the hype and focused on what actually works.",
  ],
  4: [
    "Really solid material, although a couple of lessons could be tightened up.",
    "I learned a lot, but I wish there were more advanced exercises at the end.",
    "The core content is excellent; some of the tool screenshots are slightly out of date.",
    "Good value overall and easy to follow.",
    "A few sections moved quickly, but revisiting them helped.",
    "Would love a follow-up that goes deeper into production use cases.",
    "Practical tips I could apply the same day.",
  ],
  3: [
    "Some modules are great, others feel like filler.",
    "It covers the basics well but stops short of anything advanced.",
    "Helpful as an overview, though I had to look elsewhere for details.",
    "The audio quality in a few lessons made it hard to follow.",
    "Fine for beginners, but experienced folks can skip it.",
    "Useful ideas, though the examples felt a bit contrived.",
  ],
  2: [
    "Most of this is available in free documentation.",
    "Several examples no longer work with current tool versions.",
    "The title oversells what is actually covered.",
    "I expected more practical exercises and fewer slides.",
  ],
  1: [
    "The content is thin and mostly repeats marketing material.",
    "Hard to follow, and questions in the community went unanswered.",
    "I stopped halfway through because it wasn't adding anything new.",
  ],
};

function reviewText(rating: number): { title: string; body: string } {
  const titles = must(REVIEW_TITLES[rating], `titles ${rating}`);
  const sentences = must(REVIEW_SENTENCES[rating], `sentences ${rating}`);
  return { title: pick(titles), body: sample(sentences, 1, 3).join(" ") };
}

function randomRating(): number {
  return weighted<number>([
    [5, 45],
    [4, 33],
    [3, 13],
    [2, 6],
    [1, 3],
  ]);
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main(): Promise<void> {
  const started = Date.now();
  console.log("Wiping existing data...");
  await prisma.progress.deleteMany();
  await prisma.savedResource.deleteMany();
  await prisma.review.deleteMany();
  await prisma.lesson.deleteMany();
  await prisma.section.deleteMany();
  await prisma.resource.deleteMany();
  await prisma.tag.deleteMany();
  await prisma.category.deleteMany();
  await prisma.author.deleteMany();
  await prisma.provider.deleteMany();
  await prisma.user.deleteMany();

  // Reference data -----------------------------------------------------------
  await prisma.category.createMany({
    data: CATEGORIES.map((c) => ({ slug: c.slug, name: c.name, description: c.description, icon: c.icon })),
  });
  const verifiedCandidates = PROVIDERS.map((p) => slugify(p.name));
  await prisma.provider.createMany({
    data: PROVIDERS.map((p) => {
      const slug = slugify(p.name);
      return {
        slug,
        name: p.name,
        logoUrl: `https://www.google.com/s2/favicons?domain=${p.domain}&sz=128`,
        websiteUrl: `https://${p.domain}`,
        description: p.description,
        verified: !UNVERIFIED_PROVIDERS.has(slug),
      };
    }),
  });
  await prisma.author.createMany({
    data: AUTHORS.map((a) => {
      const slug = slugify(a.name);
      return { slug, name: a.name, avatarUrl: `https://i.pravatar.cc/160?u=${slug}`, bio: a.bio, socialUrl: a.social ?? null };
    }),
  });
  await prisma.tag.createMany({ data: TAGS.map(([slug, name]) => ({ slug, name })) });

  const categories = new Map((await prisma.category.findMany()).map((c) => [c.slug, c.id]));
  const providers = new Map((await prisma.provider.findMany()).map((p) => [p.slug, p]));
  const authors = new Map((await prisma.author.findMany()).map((a) => [a.slug, a.id]));
  if (providers.size !== verifiedCandidates.length) throw new Error("Provider slug collision");

  // Users --------------------------------------------------------------------
  const demoHash = await bcrypt.hash("password123", 10);
  const sharedHash = await bcrypt.hash(faker.internet.password({ length: 24 }), 10);
  const demo = await prisma.user.create({
    data: { email: "demo@aiorbit.dev", passwordHash: demoHash, name: "Demo Learner", avatarUrl: "https://i.pravatar.cc/160?u=demo-learner" },
  });

  const emails = new Set<string>(["demo@aiorbit.dev"]);
  const userRows: Prisma.UserCreateManyInput[] = [];
  while (userRows.length < 120) {
    const firstName = faker.person.firstName();
    const lastName = faker.person.lastName();
    const email = faker.internet.email({ firstName, lastName }).toLowerCase();
    if (emails.has(email)) continue;
    emails.add(email);
    userRows.push({
      email,
      passwordHash: sharedHash,
      name: `${firstName} ${lastName}`,
      avatarUrl: chance(0.7) ? `https://i.pravatar.cc/160?u=${encodeURIComponent(email)}` : null,
      createdAt: daysAgo(int(10, 700)),
    });
  }
  await prisma.user.createMany({ data: userRows });
  const fakeUsers = await prisma.user.findMany({ where: { id: { not: demo.id } }, select: { id: true, createdAt: true } });

  // Resource specs -------------------------------------------------------------
  const specs: ResourceSpec[] = HAND_WRITTEN.map((h) => {
    const { daysAgo: ago, ...rest } = h;
    return { ...rest, language: "en", publishedAt: daysAgo(ago), status: "PUBLISHED" as const };
  });

  const generatedPlan: Array<[ResourceType, number]> = [
    ["COURSE", 18],
    ["GUIDE", 15],
    ["EBOOK", 10],
    ["TUTORIAL", 10],
    ["NEWSLETTER", 7],
  ];
  let genIndex = 0;
  const categoryOrder = faker.helpers.shuffle([...CATEGORIES]);
  for (const [type, count] of generatedPlan) {
    for (let i = 0; i < count; i += 1) {
      const cat = must(categoryOrder[genIndex % categoryOrder.length], "category order");
      const ago = genIndex % 10 === 3 ? int(0, 6) : int(0, 540);
      specs.push(generateSpec(type, cat, daysAgo(ago), "PUBLISHED"));
      genIndex += 1;
    }
  }

  const pendingSpecs = [
    generateSpec("TUTORIAL", categoryBySlug("coding"), NOW, "PENDING"),
    generateSpec("GUIDE", categoryBySlug("image-video"), NOW, "PENDING"),
  ];
  specs.push(...pendingSpecs);

  // Create resources with nested sections/lessons ------------------------------
  interface CreatedResource {
    id: string;
    spec: ResourceSpec;
    lessonIds: string[];
  }
  const created: CreatedResource[] = [];

  for (const spec of specs) {
    const cat = categoryBySlug(spec.categorySlug);
    const provider = must(providers.get(spec.providerSlug), `provider ${spec.providerSlug}`);
    const slug = uniqueSlug(spec.title);
    const domain = provider.websiteUrl.replace(/^https:\/\//, "");
    const host = domain.split(".").length === 2 ? `www.${domain}` : domain;
    const externalUrl = spec.externalUrl ?? `https://${host}/${URL_PATH[spec.type]}/${slug}`;
    const syllabus = buildSyllabus(spec.type, cat, spec.toolsCovered);
    const faqs = faqsFor(spec, syllabus.durationMinutes);

    const resource = await prisma.resource.create({
      data: {
        slug,
        title: spec.title,
        tagline: spec.tagline,
        description: spec.description,
        coverUrl: `https://picsum.photos/seed/${slug}/800/450`,
        externalUrl,
        type: spec.type,
        level: spec.level,
        pricing: spec.pricing,
        priceUsd: spec.priceUsd,
        format: spec.format,
        durationMinutes: syllabus.durationMinutes,
        lessonCount: syllabus.lessonCount,
        language: spec.language,
        hasCertificate: spec.hasCertificate,
        status: spec.status,
        featured: spec.featured,
        faqs: faqs as unknown as Prisma.InputJsonValue,
        learnOutcomes: spec.learnOutcomes,
        prerequisites: spec.prerequisites,
        toolsCovered: spec.toolsCovered,
        publishedAt: spec.publishedAt,
        provider: { connect: { id: provider.id } },
        category: { connect: { id: must(categories.get(spec.categorySlug), `category ${spec.categorySlug}`) } },
        ...(spec.authorSlug ? { author: { connect: { id: must(authors.get(spec.authorSlug), `author ${spec.authorSlug}`) } } } : {}),
        ...(spec.status === "PENDING" ? { submittedBy: { connect: { id: demo.id } } } : {}),
        tags: { connect: spec.tags.map((t) => ({ slug: t })) },
        sections: {
          create: syllabus.sections.map((s) => ({
            title: s.title,
            order: s.order,
            lessons: { createMany: { data: s.lessons } },
          })),
        },
      },
      select: {
        id: true,
        sections: { orderBy: { order: "asc" }, select: { lessons: { orderBy: { order: "asc" }, select: { id: true } } } },
      },
    });

    const lessonIds = resource.sections.flatMap((s) => s.lessons.map((l) => l.id));
    if (lessonIds.length !== syllabus.lessonCount) throw new Error(`Lesson count mismatch for ${slug}`);
    created.push({ id: resource.id, spec, lessonIds });
  }

  const published = created.filter((r) => r.spec.status === "PUBLISHED");

  // Reviews & saves --------------------------------------------------------------
  const reviewRows: Prisma.ReviewCreateManyInput[] = [];
  const savedRows: Prisma.SavedResourceCreateManyInput[] = [];
  const ratings = new Map<string, number[]>();
  const saves = new Map<string, number>();

  const randomDateAfter = (from: Date): Date => {
    const fromMs = Math.min(from.getTime(), NOW.getTime() - 60 * 1000);
    return faker.date.between({ from: fromMs, to: NOW.getTime() });
  };

  for (const r of published) {
    const reviewers = sample(fakeUsers, 5, 30);
    const list: number[] = [];
    for (const u of reviewers) {
      const rating = randomRating();
      const { title, body } = reviewText(rating);
      list.push(rating);
      reviewRows.push({ resourceId: r.id, userId: u.id, rating, title, body, createdAt: randomDateAfter(r.spec.publishedAt) });
    }
    ratings.set(r.id, list);

    const savers = sample(fakeUsers, 0, 40);
    for (const u of savers) {
      savedRows.push({ userId: u.id, resourceId: r.id, createdAt: randomDateAfter(r.spec.publishedAt) });
    }
    saves.set(r.id, savers.length);
  }

  // Demo user activity ------------------------------------------------------------
  const demoPool = faker.helpers.shuffle(published.filter((r) => r.spec.type !== "NEWSLETTER"));
  const demoSaved = demoPool.slice(0, 6);
  const demoStarted = demoPool.slice(6, 9);
  const demoCompleted = demoPool.slice(9, 11);
  if (demoCompleted.length < 2) throw new Error("Not enough resources for demo activity");

  for (const r of demoSaved) {
    savedRows.push({ userId: demo.id, resourceId: r.id, createdAt: randomDateAfter(r.spec.publishedAt) });
    saves.set(r.id, (saves.get(r.id) ?? 0) + 1);
  }

  const progressRows: Prisma.ProgressCreateManyInput[] = [];
  for (const r of demoStarted) {
    const total = r.lessonIds.length;
    const done = Math.max(1, Math.min(total - 1, int(2, Math.max(2, Math.floor(total / 2)))));
    progressRows.push({
      userId: demo.id,
      resourceId: r.id,
      status: "STARTED",
      completedLessonIds: r.lessonIds.slice(0, done),
      percent: Math.round((done / total) * 100),
    });
  }
  for (const r of demoCompleted) {
    progressRows.push({ userId: demo.id, resourceId: r.id, status: "COMPLETED", completedLessonIds: [...r.lessonIds], percent: 100 });
  }

  const demoReviewTarget = must(demoCompleted[0], "demo review target");
  reviewRows.push({
    resourceId: demoReviewTarget.id,
    userId: demo.id,
    rating: 5,
    title: "Exactly what I needed",
    body: "I finished every lesson and immediately put the ideas to work on a side project. The structure made it easy to stay consistent.",
    createdAt: randomDateAfter(demoReviewTarget.spec.publishedAt),
  });
  ratings.get(demoReviewTarget.id)?.push(5);

  await prisma.review.createMany({ data: reviewRows });
  await prisma.savedResource.createMany({ data: savedRows });
  await prisma.progress.createMany({ data: progressRows });

  // Stats -------------------------------------------------------------------------
  await prisma.$transaction(
    published.map((r) => {
      const list = ratings.get(r.id) ?? [];
      const ratingCount = list.length;
      const ratingAvg = ratingCount > 0 ? round2(list.reduce((a, b) => a + b, 0) / ratingCount) : 0;
      const saveCount = saves.get(r.id) ?? 0;
      const viewCount = Math.min(60000, Math.max(200, ratingCount * int(900, 1500) + int(200, 15000)));
      const ageDays = (NOW.getTime() - r.spec.publishedAt.getTime()) / DAY_MS;
      const recencyBonus = ageDays <= 30 ? 20 + 100 * (1 - ageDays / 30) : ageDays <= 90 ? 20 * (1 - (ageDays - 30) / 60) : 0;
      const trendingScore = round2(saveCount * 3 + viewCount / 100 + recencyBonus);
      return prisma.resource.update({
        where: { id: r.id },
        data: { ratingAvg, ratingCount, saveCount, viewCount, trendingScore },
      });
    }),
  );

  // Summary -----------------------------------------------------------------------
  const [users, providerCount, authorCount, categoryCount, tagCount, resourceCount, pendingCount, featuredCount, sectionCount, lessonCount, reviewCount, savedCount, progressCount] = await Promise.all([
    prisma.user.count(),
    prisma.provider.count(),
    prisma.author.count(),
    prisma.category.count(),
    prisma.tag.count(),
    prisma.resource.count({ where: { status: "PUBLISHED" } }),
    prisma.resource.count({ where: { status: "PENDING" } }),
    prisma.resource.count({ where: { featured: true } }),
    prisma.section.count(),
    prisma.lesson.count(),
    prisma.review.count(),
    prisma.savedResource.count(),
    prisma.progress.count(),
  ]);
  const byType = await prisma.resource.groupBy({ by: ["type"], where: { status: "PUBLISHED" }, _count: { _all: true } });

  console.log("Seed complete in", `${((Date.now() - started) / 1000).toFixed(1)}s`);
  console.table({
    users,
    providers: providerCount,
    authors: authorCount,
    categories: categoryCount,
    tags: tagCount,
    publishedResources: resourceCount,
    pendingResources: pendingCount,
    featured: featuredCount,
    sections: sectionCount,
    lessons: lessonCount,
    reviews: reviewCount,
    savedResources: savedCount,
    progress: progressCount,
  });
  console.log("Published by type:", Object.fromEntries(byType.map((t) => [t.type, t._count._all])));
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
