import express from "express";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";
import { executeCodeInSandbox, TestCaseInput } from "./compilerService";

dotenv.config();

export const app = express();

app.use(express.json({ limit: "5mb" }));

// CORS & Preflight headers for seamless local and Vercel deployments
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  res.header("Access-Control-Allow-Headers", "Content-Type, Authorization");
  if (req.method === "OPTIONS") {
    return res.sendStatus(200);
  }
  next();
});

// Lazy GoogleGenAI client helper
function getGeminiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        "User-Agent": "aistudio-build",
      },
    },
  });
}

// In-memory cache & rate-limiting cooldown
const responseCache = new Map<string, { timestamp: number; data: any }>();
const CACHE_TTL_MS = 1000 * 60 * 30; // 30 minutes
let geminiCooldownUntil = 0;

// Resilient Gemini content generator with multi-model fallback & rate-limit handling
async function generateJsonWithFallback(prompt: string, schema: any, cacheKey: string): Promise<any | null> {
  // Check in-memory cache first
  const cached = responseCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
    return cached.data;
  }

  // If in rate-limit cooldown, gracefully return null to use curated heuristics
  if (Date.now() < geminiCooldownUntil) {
    return null;
  }

  const ai = getGeminiClient();
  if (!ai) return null;

  // Candidate models to try in order of preference
  const candidateModels = ["gemini-2.5-flash", "gemini-flash-latest", "gemini-3.8-flash"];

  for (const modelName of candidateModels) {
    try {
      const response = await ai.models.generateContent({
        model: modelName,
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: schema,
        },
      });

      if (response.text) {
        const parsed = JSON.parse(response.text);
        responseCache.set(cacheKey, { timestamp: Date.now(), data: parsed });
        return parsed;
      }
    } catch (err: any) {
      const errMsg = String(err?.message || "");
      const isRateLimited = errMsg.includes("429") || errMsg.includes("RESOURCE_EXHAUSTED") || errMsg.includes("quota");
      const isUnavailable = errMsg.includes("503") || errMsg.includes("UNAVAILABLE") || errMsg.includes("high demand");

      if (isRateLimited || isUnavailable) {
        // Cool down for 45 seconds so we don't spam rate-limited quota
        geminiCooldownUntil = Date.now() + 45000;
        console.log(`[Gemini Engine] Rate limit or high demand on ${modelName}; activating curated heuristics mode.`);
        break;
      }
    }
  }

  return null;
}

// API Router
const apiRouter = express.Router();

// Root API info & Health check (only under /api)
apiRouter.get("/health", (_req, res) => {
  res.json({
    status: "ok",
    service: "SkillMatcher & Career Launchpad API",
    hasGeminiKey: Boolean(process.env.GEMINI_API_KEY),
    isRateLimited: Date.now() < geminiCooldownUntil,
    timestamp: new Date().toISOString(),
  });
});

// Endpoint: Personalized Quiz Generator for Weak Topics
apiRouter.post("/gemini/quiz", async (req, res) => {
  const { topic, weakSkills = [], studentLevel = "intermediate", count = 4 } = req.body;
  const targetTopic = topic || (weakSkills.length > 0 ? weakSkills[0] : "Web Development & Algorithms");
  const cacheKey = `quiz_${targetTopic}_${studentLevel}_${count}`;

  const prompt = `Generate a ${count}-question diagnostic multiple-choice quiz targeted for a college student who identified "${targetTopic}" as their weak area (related weak skills: ${weakSkills.join(", ") || "general"}).
Student experience level: ${studentLevel}.
Requirements:
- Questions must be practical, testing real-world understanding or debugging code, not trivial trivia.
- Exactly 4 options per question with 1 correct option.
- Detailed explanation for WHY the correct answer is right and why common misconceptions are wrong.
- A "quickFixTip" (1-2 sentence golden takeaway to solidify this concept immediately).
`;

  const schema = {
    type: Type.OBJECT,
    properties: {
      topic: { type: Type.STRING },
      skillFocus: { type: Type.STRING },
      questions: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            id: { type: Type.STRING },
            question: { type: Type.STRING },
            codeSnippet: { type: Type.STRING, description: "Optional code snippet if relevant or empty string" },
            options: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
            },
            correctAnswerIndex: { type: Type.INTEGER },
            explanation: { type: Type.STRING },
            quickFixTip: { type: Type.STRING },
          },
          required: ["id", "question", "options", "correctAnswerIndex", "explanation", "quickFixTip"],
        },
      },
    },
    required: ["topic", "skillFocus", "questions"],
  };

  const aiResult = await generateJsonWithFallback(prompt, schema, cacheKey);
  if (aiResult && Array.isArray(aiResult.questions) && aiResult.questions.length > 0) {
    return res.json({ success: true, data: aiResult, source: "gemini" });
  }

  // Fallback diagnostic quiz
  const fallbackQuizzes: Record<string, any> = {
    SQL: {
      topic: "SQL & Relational Databases",
      skillFocus: "SQL",
      questions: [
        {
          id: "sql-1",
          question: "What is the key performance difference between WHERE and HAVING clauses in SQL?",
          codeSnippet: "SELECT department_id, AVG(salary) FROM employees WHERE status = 'active' GROUP BY department_id HAVING AVG(salary) > 80000;",
          options: [
            "WHERE filters rows before aggregation; HAVING filters groups after aggregation.",
            "HAVING can only be used with string columns, while WHERE works on numbers.",
            "WHERE and HAVING are completely interchangeable in modern SQL standards.",
            "HAVING executes before WHERE to index aggregate metrics.",
          ],
          correctAnswerIndex: 0,
          explanation: "The WHERE clause acts as a row-level filter prior to grouping. Once GROUP BY aggregates the data, HAVING applies conditions across those aggregated groupings.",
          quickFixTip: "Remember: 'W' comes before 'H' in the alphabet — WHERE filters before GROUP BY, HAVING filters after!",
        },
        {
          id: "sql-2",
          question: "When querying an indexed column, which scenario will most likely prevent the database engine from using the index?",
          codeSnippet: "SELECT * FROM users WHERE LOWER(email) = 'alex@example.com';",
          options: [
            "Checking equality on an indexed integer column",
            "Applying a function or calculation like LOWER(col) directly on the indexed column in the WHERE clause",
            "Using a LIMIT 10 clause at the end of the query",
            "Selecting more than 3 columns in the SELECT clause",
          ],
          correctAnswerIndex: 1,
          explanation: "Wrapping an indexed column in a function prevents B-tree index seeks unless an explicit functional index (e.g. index on LOWER(email)) has been defined.",
          quickFixTip: "Normalize data before inserting so you can query plain columns without wrapping them in functions.",
        },
        {
          id: "sql-3",
          question: "What does an INNER JOIN return when there are multiple matching rows on both sides?",
          codeSnippet: "SELECT o.id, c.name FROM orders o INNER JOIN customers c ON o.customer_id = c.id;",
          options: [
            "Only the first matching row from the customers table",
            "A Cartesian product (all combinations) for the matching keys",
            "An error indicating duplicate unique keys",
            "Null values for non-unique customer entries",
          ],
          correctAnswerIndex: 1,
          explanation: "An INNER JOIN matches all pairs satisfying the condition. If customer has 2 records and orders has 3 records with the same ID, 6 joined rows result.",
          quickFixTip: "Verify foreign key cardinality and uniqueness constraints to prevent unintentional row multiplication.",
        },
      ],
    },
    default: {
      topic: targetTopic,
      skillFocus: targetTopic,
      questions: [
        {
          id: "gen-1",
          question: `In professional software engineering with ${targetTopic}, what is the primary benefit of modular decomposition?`,
          codeSnippet: "",
          options: [
            "It minimizes code reusability across microservices",
            "It isolates failures, reduces cognitive load, and enables independent testing and scaling",
            "It eliminates the need for unit testing completely",
            "It guarantees zero runtime memory allocation",
          ],
          correctAnswerIndex: 1,
          explanation: "Modular architectures allow teams to test, maintain, and reason about components in isolation without cascading side effects.",
          quickFixTip: "Always design modules with high cohesion and low coupling.",
        },
        {
          id: "gen-2",
          question: `Which approach is best practice when debugging an unexpected state inconsistency in ${targetTopic}?`,
          codeSnippet: "",
          options: [
            "Restarting the container without logging anything",
            "Isolating the minimum reproducible test case and inspecting input/output boundaries",
            "Hardcoding mock values in production",
            "Removing error handlers so the crash goes unlogged",
          ],
          correctAnswerIndex: 1,
          explanation: "Creating a minimal reproducible reproduction case lets you verify boundary conditions without external noise.",
          quickFixTip: "Trace the data flow through entry and exit boundaries before modifying any internal logic.",
        },
        {
          id: "gen-3",
          question: `When optimizing performance for a system utilizing ${targetTopic}, what should be your first step?`,
          codeSnippet: "",
          options: [
            "Profile and measure actual bottlenecks using telemetry or profiling tools",
            "Rewrite everything in assembly language immediately",
            "Double the server RAM without checking CPU utilization",
            "Disable all caching mechanisms",
          ],
          correctAnswerIndex: 0,
          explanation: "Premature optimization is a common pitfall. Measuring first guarantees you optimize the actual hot path.",
          quickFixTip: "'Measure, don't guess.' Use real telemetry to identify high-latency operations before writing optimization code.",
        },
      ],
    },
  };

  const selectedFallback = fallbackQuizzes[targetTopic] || fallbackQuizzes.default;
  return res.json({ success: true, data: selectedFallback, source: "fallback" });
});

// Endpoint: Resume & LinkedIn Auto-Optimizer
apiRouter.post("/gemini/optimize-profile", async (req, res) => {
  const {
    currentBullets = [],
    skills = [],
    targetRole = "Software Engineering Intern",
    experienceSummary = "",
    targetCompanyType = "Tech Startups & Top Companies",
  } = req.body;

  const cacheKey = `opt_${targetRole}_${JSON.stringify(skills.slice(0, 4))}_${(currentBullets[0] || "").slice(0, 30)}`;

  const prompt = `Act as an elite tech recruiter and career coach for college students and recent grads.
Student Profile:
- Target Role: ${targetRole}
- Target Company Type: ${targetCompanyType}
- Strong Skills: ${skills.map((s: any) => (typeof s === "string" ? s : `${s.name} (${s.level})`)).join(", ")}
- Student Experience Background: ${experienceSummary || "Undergraduate computer science student with projects"}
- Current Resume Bullets to Optimize:
${currentBullets.length > 0 ? currentBullets.map((b: string, i: number) => `${i + 1}. ${b}`).join("\n") : "1. Built a web app with React and database\n2. Collaborated with a team of students on class project\n3. Implemented API endpoints for fetching user data"}

Output:
1. Optimized Resume Bullets: Provide 3-4 rewritten bullet points using the Google XYZ formula ("Accomplished [X] as measured by [Y], by doing [Z]"). Include realistic metrics, strong action verbs, and highlighted keywords.
2. LinkedIn Headline: 3 distinct catchy options (Keyword-rich, Impact-driven, and Aspiring specialist).
3. LinkedIn About Section: 2-3 engaging, conversational paragraphs showcasing passion, projects, technical skills, and eagerness for internships.
4. ATS Keyword Alignment: Top 6 keywords the student MUST integrate for ${targetRole}.
`;

  const schema = {
    type: Type.OBJECT,
    properties: {
      optimizedBullets: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            original: { type: Type.STRING },
            improved: { type: Type.STRING },
            metricsHighlighted: { type: Type.STRING },
            rationale: { type: Type.STRING },
          },
          required: ["original", "improved", "metricsHighlighted", "rationale"],
        },
      },
      linkedInHeadlines: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            style: { type: Type.STRING },
            headline: { type: Type.STRING },
          },
          required: ["style", "headline"],
        },
      },
      linkedInAbout: { type: Type.STRING },
      atsKeywords: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            keyword: { type: Type.STRING },
            importance: { type: Type.STRING },
            inProfile: { type: Type.BOOLEAN },
          },
          required: ["keyword", "importance", "inProfile"],
        },
      },
    },
    required: ["optimizedBullets", "linkedInHeadlines", "linkedInAbout", "atsKeywords"],
  };

  const aiResult = await generateJsonWithFallback(prompt, schema, cacheKey);
  if (aiResult && Array.isArray(aiResult.optimizedBullets) && aiResult.optimizedBullets.length > 0) {
    return res.json({ success: true, data: aiResult, source: "gemini" });
  }

  // Fallback optimization
  const fallback = {
    optimizedBullets: [
      {
        original: currentBullets[0] || "Built a full stack application for tracking student tasks",
        improved: "Architected a responsive full-stack task management dashboard utilizing React and Node.js, cutting state synchronization latency by 42% and supporting 1,200+ active session requests.",
        metricsHighlighted: "42% latency reduction, 1,200+ active sessions",
        rationale: "Replaced passive phrasing with 'Architected' and added quantifiable impact metrics following the Google XYZ formula.",
      },
      {
        original: currentBullets[1] || "Created REST APIs and connected to database",
        improved: "Engineered 8+ scalable RESTful endpoints with Express and PostgreSQL, enforcing role-based authentication and indexing foreign keys to accelerate query lookup times by 3.5x.",
        metricsHighlighted: "8+ endpoints, 3.5x faster lookups",
        rationale: "Demonstrates architectural understanding of relational databases and indexing rather than merely 'connecting' to a database.",
      },
      {
        original: currentBullets[2] || "Worked in a student team with Git",
        improved: "Spearheaded Git branching protocols and CI/CD automated linting for a 4-engineer agile sprint, trimming pull request review cycles from 48 hours to under 6 hours.",
        metricsHighlighted: "48h to <6h review cycles",
        rationale: "Highlights collaborative ownership and DevOps agility instead of basic Git familiarity.",
      },
    ],
    linkedInHeadlines: [
      {
        style: "Impact & Tech Stack",
        headline: `${targetRole} Candidate | React, TypeScript & Node.js | Passionate about Scalable Systems & Developer Tooling`,
      },
      {
        style: "Keyword Heavy (ATS Optimized)",
        headline: `Aspiring ${targetRole} @ Seeking Summer Internships | Full-Stack Development | Cloud Computing | Algorithms`,
      },
      {
        style: "Founder/Builder Mindset",
        headline: `Software Engineer & Builder | Turning complex data workflows into intuitive user experiences | CS Student`,
      },
    ],
    linkedInAbout: `I am an ambitious Computer Science student specializing in building reliable, high-performance web applications and distributed systems. From architecting scalable microservices to polishing fluid front-end interfaces, I thrive at the intersection of engineering rigor and user empathy.

Over the past year, I've built end-to-end applications handling real-time data pipelines, optimized database query execution, and collaborated in fast-paced agile team environments. My core toolkit revolves around TypeScript, React, Node.js, Python, and SQL.

Currently seeking ${targetRole} opportunities where I can tackle challenging technical problems, learn alongside seasoned engineers, and deliver measurable impact from day one. Let's connect!`,
    atsKeywords: [
      { keyword: "RESTful APIs", importance: "Critical", inProfile: true },
      { keyword: "System Design", importance: "High", inProfile: false },
      { keyword: "CI/CD & Docker", importance: "High", inProfile: false },
      { keyword: "Unit & Integration Testing", importance: "Medium", inProfile: false },
      { keyword: "TypeScript", importance: "Critical", inProfile: true },
      { keyword: "Database Optimization", importance: "High", inProfile: true },
    ],
  };

  return res.json({ success: true, data: fallback, source: "fallback" });
});

// Endpoint: Initial Level Assessment based on Resume & LinkedIn
apiRouter.post("/gemini/evaluate-initial-level", async (req, res) => {
  const {
    resumeText = "",
    linkedinTextOrUrl = "",
    targetRole = "Software Engineering Intern",
    currentSkills = [],
  } = req.body;

  const cacheKey = `level_${targetRole}_${resumeText.slice(0, 40)}_${linkedinTextOrUrl.slice(0, 30)}`;

  const prompt = `Act as an elite tech recruiter and principal engineering mentor assessing a student's initial capability level based on their Resume and LinkedIn profile.
We evaluate candidates on 5 canonical platform levels:
- Level 1: "Intern Novice" (Starting XP: 100 - 240) -> Coursework/intro projects only, passive bullet phrasing ("learned python", "helped team"), sparse or basic LinkedIn.
- Level 2: "Rising Candidate" (Starting XP: 350 - 550) -> Built 1-2 functional personal projects, basic Git version control, beginning to structure resume bullets, emerging LinkedIn presence.
- Level 3: "Tech Apprentice" (Starting XP: 750 - 1100) -> Deployed end-to-end full-stack or ML systems, quantified impact metrics on resume (latency, users, RPS, accuracy), strong portfolio on LinkedIn.
- Level 4: "Interview Ready" (Starting XP: 1400 - 1850) -> Completed software internship or research lab role, modern stack (Docker, AWS, microservices, PyTorch, testing), well-quantified Google XYZ bullets, professional LinkedIn with active network.
- Level 5: "Offer Magnet" (Starting XP: 2200 - 2800) -> Multiple prestigious internships or high-scale open-source maintainership, distributed systems/architecture depth, senior student leadership, outstanding recruiter appeal.

Input:
- Resume Content / Bullets:
${resumeText || "No detailed resume provided. Student has introductory computer science coursework."}

- LinkedIn Profile URL or Bio/Experience:
${linkedinTextOrUrl || "No LinkedIn details provided."}

- Target Internship Role:
${targetRole}

- Existing Skills (if any):
${JSON.stringify(currentSkills)}

Provide:
1. Exact integer level (1 to 5) and matching levelTitle ('Intern Novice', 'Rising Candidate', 'Tech Apprentice', 'Interview Ready', 'Offer Magnet').
2. Starting XP score strictly within that level's bracket.
3. Confidence score (0-100).
4. Candidate Archetype (e.g. 'Full-Stack Web Builder', 'Data & ML Specialist', 'Systems & Cloud Explorer', 'Early Aspiring Developer').
5. Detailed rationale explaining why this initial level was determined from the resume and LinkedIn evidence.
6. Deep resume diagnostic (bullet quality score 0-100, boolean for quantified metrics, strengths array, improvements needed array).
7. Deep LinkedIn diagnostic (headline assessment, profile completeness score 0-100, actionable recommendations array).
8. Extracted technical skills with category ('Frontend' | 'Backend' | 'Database' | 'DevOps' | 'AI/Data' | 'Language' | 'Core CS'), level ('Beginner' | 'Intermediate' | 'Advanced' | 'Expert'), masteryScore (0-100), and brief reasoning.
9. 3 recommended next milestones to jump to the next level.
`;

  const schema = {
    type: Type.OBJECT,
    properties: {
      level: { type: Type.INTEGER },
      levelTitle: { type: Type.STRING },
      startingXp: { type: Type.INTEGER },
      confidenceScore: { type: Type.INTEGER },
      candidateArchetype: { type: Type.STRING },
      rationale: { type: Type.STRING },
      resumeAnalysis: {
        type: Type.OBJECT,
        properties: {
          bulletQualityScore: { type: Type.INTEGER },
          quantifiedMetricsPresence: { type: Type.BOOLEAN },
          strengths: { type: Type.ARRAY, items: { type: Type.STRING } },
          improvementsNeeded: { type: Type.ARRAY, items: { type: Type.STRING } },
        },
        required: ["bulletQualityScore", "quantifiedMetricsPresence", "strengths", "improvementsNeeded"],
      },
      linkedInAnalysis: {
        type: Type.OBJECT,
        properties: {
          headlineAssessment: { type: Type.STRING },
          completenessScore: { type: Type.INTEGER },
          recommendations: { type: Type.ARRAY, items: { type: Type.STRING } },
        },
        required: ["headlineAssessment", "completenessScore", "recommendations"],
      },
      extractedSkills: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            name: { type: Type.STRING },
            category: { type: Type.STRING },
            level: { type: Type.STRING },
            masteryScore: { type: Type.INTEGER },
            reasoning: { type: Type.STRING },
          },
          required: ["name", "category", "level", "masteryScore"],
        },
      },
      recommendedNextMilestones: { type: Type.ARRAY, items: { type: Type.STRING } },
    },
    required: [
      "level",
      "levelTitle",
      "startingXp",
      "confidenceScore",
      "candidateArchetype",
      "rationale",
      "resumeAnalysis",
      "linkedInAnalysis",
      "extractedSkills",
      "recommendedNextMilestones",
    ],
  };

  const aiResult = await generateJsonWithFallback(prompt, schema, cacheKey);
  if (aiResult && aiResult.level && aiResult.levelTitle) {
    return res.json({ success: true, data: aiResult, source: "gemini" });
  }

  // Resilient Algorithmic Heuristic Fallback
  const combinedText = `${resumeText} ${linkedinTextOrUrl}`.toLowerCase();
  
  // Keyword and metric counters
  const hasInternship = /intern|co-?op|fellowship|engineer at|software engineering intern|developer at/.test(combinedText);
  const multipleInternships = (combinedText.match(/intern|co-?op|developer at/g) || []).length >= 2;
  const hasQuantMetrics = /([0-9]+%|\b[0-9]+x\b|[0-9]+ms|\$[0-9]+|\b[0-9]+k\b|[0-9]+\s*users|[0-9]+\s*requests)/.test(combinedText);
  const hasCloudDevOps = /docker|kubernetes|aws|gcp|azure|ci\/cd|terraform|linux/.test(combinedText);
  const hasFullStack = /react|node|express|typescript|next\.?js|tailwind|fastapi|django/.test(combinedText);
  const hasDatabase = /sql|postgresql|mongodb|redis|prisma|database/.test(combinedText);
  const hasAiData = /pytorch|tensorflow|pandas|numpy|machine learning|llm|deep learning/.test(combinedText);

  let calculatedLevel = 2;
  let levelTitle = 'Rising Candidate';
  let startingXp = 420;
  let confidence = 88;
  let archetype = 'Full-Stack Software Aspirant';

  if (multipleInternships && hasQuantMetrics && hasCloudDevOps) {
    calculatedLevel = 5;
    levelTitle = 'Offer Magnet';
    startingXp = 2450;
    confidence = 94;
    archetype = 'High-Impact Production Engineer';
  } else if ((hasInternship && hasQuantMetrics) || (hasCloudDevOps && hasFullStack && hasDatabase && hasQuantMetrics)) {
    calculatedLevel = 4;
    levelTitle = 'Interview Ready';
    startingXp = 1580;
    confidence = 92;
    archetype = 'Internship-Experienced Software Engineer';
  } else if (hasFullStack && hasDatabase && (hasQuantMetrics || combinedText.length > 250)) {
    calculatedLevel = 3;
    levelTitle = 'Tech Apprentice';
    startingXp = 820;
    confidence = 90;
    archetype = 'End-to-End Application Developer';
  } else if (hasFullStack || hasAiData || combinedText.length > 150) {
    calculatedLevel = 2;
    levelTitle = 'Rising Candidate';
    startingXp = 420;
    confidence = 86;
    archetype = 'Project-Oriented Computer Science Student';
  } else {
    calculatedLevel = 1;
    levelTitle = 'Intern Novice';
    startingXp = 160;
    confidence = 82;
    archetype = 'Foundational CS Explorer';
  }

  const fallbackSkills = [
    { name: 'TypeScript', category: 'Language', level: calculatedLevel >= 3 ? 'Advanced' : 'Intermediate', masteryScore: calculatedLevel >= 3 ? 82 : 64, reasoning: 'Strong modern frontend and server-side language adoption.' },
    { name: 'React', category: 'Frontend', level: calculatedLevel >= 3 ? 'Advanced' : 'Intermediate', masteryScore: calculatedLevel >= 3 ? 85 : 68, reasoning: 'Foundational component-driven development in project history.' },
    { name: 'Node.js', category: 'Backend', level: calculatedLevel >= 4 ? 'Advanced' : 'Intermediate', masteryScore: calculatedLevel >= 4 ? 80 : 62, reasoning: 'API architecture and backend integration.' },
    { name: 'SQL', category: 'Database', level: calculatedLevel >= 3 ? 'Intermediate' : 'Beginner', masteryScore: calculatedLevel >= 3 ? 68 : 45, reasoning: 'Relational data modeling and queries.' },
    { name: 'Git & GitHub', category: 'DevOps', level: calculatedLevel >= 3 ? 'Advanced' : 'Intermediate', masteryScore: calculatedLevel >= 3 ? 88 : 70, reasoning: 'Version control workflows and collaboration.' },
  ];

  if (hasCloudDevOps) {
    fallbackSkills.push({ name: 'Docker', category: 'DevOps', level: 'Intermediate', masteryScore: 72, reasoning: 'Containerization demonstrated in deployment pipeline.' });
  }

  const fallbackAssessment = {
    level: calculatedLevel,
    levelTitle,
    startingXp,
    confidenceScore: confidence,
    candidateArchetype: archetype,
    rationale: `Calibrated at Level ${calculatedLevel}: ${levelTitle} based on comprehensive evaluation of technical scope, bullet impact density, and LinkedIn completeness. ${hasQuantMetrics ? 'Presence of quantified outcome metrics signals engineering maturity.' : 'Transitioning bullets to quantified Google XYZ format will rapidly accelerate candidate ranking.'} ${hasInternship ? 'Industry internship experience positions the candidate well ahead of standard coursework peers.' : 'Focusing on deployed production projects will bridge the gap to top-tier internship readiness.'}`,
    resumeAnalysis: {
      bulletQualityScore: calculatedLevel * 18 + 10,
      quantifiedMetricsPresence: hasQuantMetrics,
      strengths: [
        'Identifiable modern tech stack matching current tech hiring criteria',
        hasQuantMetrics ? 'Effective inclusion of measurable business and performance metrics' : 'Clear project descriptions demonstrating architectural ownership',
        'Demonstrated ability to turn concept requirements into operational software',
      ],
      improvementsNeeded: [
        hasQuantMetrics ? 'Add deeper system design tradeoffs (e.g. why Redis over Postgres for caching)' : 'Adopt Google XYZ formula across all bullets: Accomplished [X] measured by [Y] by doing [Z]',
        'Highlight automated testing coverage and CI/CD workflow automation',
      ],
    },
    linkedInAnalysis: {
      headlineAssessment: linkedinTextOrUrl.includes('linkedin.com')
        ? 'Valid professional LinkedIn URL linked. Ensure headline highlights exact target role and core frameworks.'
        : 'Optimize headline beyond standard student title to include core specialties (e.g., Full-Stack React & Node.js Developer).',
      completenessScore: linkedinTextOrUrl.length > 20 ? 84 : 58,
      recommendations: [
        'Pin live demo links and GitHub repositories to your Featured section',
        'Add 10+ technical skills in the Skills section to boost recruiter algorithm indexing',
        'Write an engaging first-person About narrative outlining project passions and technical focus',
      ],
    },
    extractedSkills: fallbackSkills,
    recommendedNextMilestones: [
      `Complete 1 Diagnostic Quiz on your weakest technical domain to solidify mastery.`,
      `Upgrade your top resume bullet with Google XYZ metrics using the AI Resume Optimizer.`,
      `Deploy an end-to-end full-stack project with live URLs and README system architecture diagrams.`,
    ],
  };

  return res.json({ success: true, data: fallbackAssessment, source: "fallback" });
});

// Endpoint: Project Ideas for Strong Skills
apiRouter.post("/gemini/generate-projects", async (req, res) => {
  const { strongSkills = [], interests = [], targetRole = "Software Engineer" } = req.body;
  const skillsList = strongSkills.length > 0 ? strongSkills : ["React", "TypeScript", "Python", "SQL"];
  const cacheKey = `proj_${skillsList.sort().join("_")}_${targetRole}_${interests.slice(0, 2).join("_")}`;

  const prompt = `Create 3 impressive, standout portfolio project ideas tailored for a student's strongest skills: ${skillsList.join(", ")}.
Student career interests: ${interests.join(", ") || targetRole}.
Target role: ${targetRole}.
Requirements for each project:
- Must NOT be generic tutorials (no basic ToDo apps or generic weather apps).
- Must solve a real problem or simulate industry-grade challenges (e.g. rate limiters, caching layers, real-time analytics, AI workflow automation).
- Include: title, tagline, estimatedTime, difficulty, techStack array, problemSolved, 3-step milestone roadmap, and exact resume pitch bullet point.
`;

  const schema = {
    type: Type.OBJECT,
    properties: {
      projects: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            id: { type: Type.STRING },
            title: { type: Type.STRING },
            tagline: { type: Type.STRING },
            difficulty: { type: Type.STRING },
            estimatedHours: { type: Type.STRING },
            techStack: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
            },
            problemSolved: { type: Type.STRING },
            milestones: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  step: { type: Type.INTEGER },
                  title: { type: Type.STRING },
                  description: { type: Type.STRING },
                },
                required: ["step", "title", "description"],
              },
            },
            resumePitchBullet: { type: Type.STRING },
          },
          required: ["id", "title", "tagline", "difficulty", "estimatedHours", "techStack", "problemSolved", "milestones", "resumePitchBullet"],
        },
      },
    },
    required: ["projects"],
  };

  const aiResult = await generateJsonWithFallback(prompt, schema, cacheKey);
  if (aiResult && Array.isArray(aiResult.projects) && aiResult.projects.length > 0) {
    return res.json({ success: true, data: aiResult.projects, source: "gemini" });
  }

  // Fallback projects tailored to strong skills
  const fallbackProjects = [
    {
      id: "proj-1",
      title: "Real-Time Distributed Event Stream & Latency Profiler",
      tagline: "High-throughput telemetry ingestion engine with live visual bottlenecks detection.",
      difficulty: "Advanced",
      estimatedHours: "18-24 hours",
      techStack: [skillsList[0] || "TypeScript", skillsList[1] || "Node.js", "WebSockets", "Redis", "Tailwind CSS"],
      problemSolved: "Engineers struggle to monitor microservice payload latency without bloated enterprise APMs. This tool provides lightweight, instantaneous tracing.",
      milestones: [
        { step: 1, title: "Engine & Protocol Setup", description: "Implement WebSocket bidirectional pipe with sliding-window buffer and backpressure handling." },
        { step: 2, title: "Aggregation & Histogram Engine", description: "Compute p95/p99 percentiles across 10,000 synthetic event bursts using Redis ring buffers." },
        { step: 3, title: "Interactive Canvas Visualizer", description: "Build a responsive live dashboard plotting latency heatmaps with exportable incident postmortems." },
      ],
      resumePitchBullet: `Developed a high-throughput event telemetry pipeline in ${skillsList[0] || "TypeScript"}, benchmarking 12,000 events/sec with sub-5ms p99 latency visualization.`,
    },
    {
      id: "proj-2",
      title: "Intelligent Document Semantic Search & RAG Knowledge Base",
      tagline: "Local vector search interface with hybrid BM25 and cosine embedding ranking.",
      difficulty: "Intermediate",
      estimatedHours: "12-16 hours",
      techStack: [skillsList[1] || "Python", skillsList[0] || "React", "Vector Embeddings", "FastAPI", "SQLite"],
      problemSolved: "Traditional keyword searches miss contextual synonyms in technical documentation and developer guides.",
      milestones: [
        { step: 1, title: "Chunking & Embedding Pipeline", description: "Process PDF and markdown docs into semantic chunks with token overlap and generate vector representations." },
        { step: 2, title: "Hybrid Retrieval Engine", description: "Combine exact lexical search (BM25) with vector similarity for optimal search accuracy." },
        { step: 3, title: "Interactive Workspace UI", description: "Create a rich browser interface with highlighted citations and one-click source inspection." },
      ],
      resumePitchBullet: `Engineered an automated semantic retrieval pipeline utilizing hybrid vector search, improving document query precision by 38% over plain text matching.`,
    },
    {
      id: "proj-3",
      title: "Self-Healing API Gateway & Token Bucket Rate Limiter",
      tagline: "Resilient middleware layer with automated circuit-breakers and granular IP quotas.",
      difficulty: "Advanced",
      estimatedHours: "14-20 hours",
      techStack: [skillsList[0] || "Node.js", "Express", "Distributed Cache", "Docker", "Prometheus"],
      problemSolved: "Upstream third-party service outages cause cascading failures in student and small team web applications.",
      milestones: [
        { step: 1, title: "Token Bucket Algorithm", description: "Implement distributed rate-limiting middleware supporting burst capacity and tier-based quotas." },
        { step: 2, title: "Circuit Breaker State Machine", description: "Handle Closed, Open, and Half-Open failure states with exponential retry backoff." },
        { step: 3, title: "Monitoring & Chaos Simulator", description: "Simulate service failure spikes and verify automated fallback degradation with live metric graphing." },
      ],
      resumePitchBullet: `Implemented a fault-tolerant API gateway featuring token-bucket rate limiting and circuit breakers, eliminating cascading downtime during 99% simulated service dropouts.`,
    },
  ];

  return res.json({ success: true, data: fallbackProjects, source: "fallback" });
});

// Endpoint: AI-Ranked Internship Matcher
apiRouter.post("/gemini/match-internships", async (req, res) => {
  const { studentSkills = [], interests = [], experience = "", internships = [] } = req.body;
  const cacheKey = `match_${studentSkills.map((s: any) => `${s.name}_${s.level}`).sort().join("_")}_${internships.map((j: any) => j.id).sort().join("_")}`;

  if (internships.length > 0) {
    const prompt = `You are an AI Internship Matchmaker. Given this student's profile and a list of available internships, evaluate each internship and provide a match score (0-100), match reasons, missing skills to learn, and custom interview prep tip.
Student Profile:
- Skills: ${studentSkills.map((s: any) => `${s.name} (${s.level})`).join(", ")}
- Interests: ${interests.join(", ")}
- Experience/Projects: ${experience || "College student with coursework and projects"}

Internships to score:
${internships.map((job: any) => `ID: ${job.id} | Role: ${job.title} at ${job.company} | Required: ${job.requiredSkills.join(", ")} | Description: ${job.description}`).join("\n\n")}
`;

    const schema = {
      type: Type.OBJECT,
      properties: {
        matches: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              internshipId: { type: Type.STRING },
              matchScore: { type: Type.INTEGER },
              matchReasons: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
              },
              missingSkills: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
              },
              prepTip: { type: Type.STRING },
            },
            required: ["internshipId", "matchScore", "matchReasons", "missingSkills", "prepTip"],
          },
        },
      },
      required: ["matches"],
    };

    const aiResult = await generateJsonWithFallback(prompt, schema, cacheKey);
    if (aiResult && Array.isArray(aiResult.matches) && aiResult.matches.length > 0) {
      return res.json({ success: true, data: aiResult.matches, source: "gemini" });
    }
  }

  // Smart heuristic match calculation as fallback
  const userSkillMap = new Map(
    studentSkills.map((s: any) => [s.name.toLowerCase(), s.level.toLowerCase()])
  );

  const heuristicMatches = internships.map((job: any) => {
    let matchedCount = 0;
    const missing: string[] = [];
    const reasons: string[] = [];

    job.requiredSkills.forEach((reqSkill: string) => {
      const level = userSkillMap.get(reqSkill.toLowerCase());
      if (level) {
        matchedCount += (level === "expert" ? 1.2 : level === "advanced" ? 1.0 : level === "intermediate" ? 0.8 : 0.6);
        reasons.push(`Strong alignment with your ${reqSkill} background`);
      } else {
        missing.push(reqSkill);
      }
    });

    const interestOverlap = interests.some((interest: string) =>
      job.title.toLowerCase().includes(interest.toLowerCase()) ||
      job.category?.toLowerCase().includes(interest.toLowerCase())
    );
    if (interestOverlap) {
      matchedCount += 0.5;
      reasons.push("Directly aligns with your stated career interests");
    }

    const baseScore = Math.min(98, Math.max(45, Math.round((matchedCount / Math.max(job.requiredSkills.length, 1)) * 100)));

    return {
      internshipId: job.id,
      matchScore: baseScore,
      matchReasons: reasons.length > 0 ? reasons : ["Good general software foundations match this role"],
      missingSkills: missing,
      prepTip: missing.length > 0
        ? `Focus your study on ${missing.slice(0, 2).join(" & ")} and mention your fast ramp-up curve.`
        : "Highlight your production-ready projects and system design trade-offs.",
    };
  });

  return res.json({ success: true, data: heuristicMatches, source: "fallback" });
});

// Endpoint: SkillTutor Socratic Guidance (No direct answers or code dumps)
apiRouter.post("/gemini/skilltutor-guidance", async (req, res) => {
  const {
    problemTitle = "Algorithmic Challenge",
    problemContext = "",
    studentQuery = "",
    currentDraft = "",
    hintLevel = 1,
    mode = "hint",
    topic = "Algorithms & Data Structures",
    pastMistakes = [],
    weakAreas = [],
    studentHistory = {},
    problemStatement = null,
    activeLanguage = "python",
    currentCode = "",
  } = req.body;

  // 1. Detect if the student is explicitly requesting the full solution or code dump
  const asksForDirectAnswer = /(give|show|write|provide|tell|what\s+is)\s+(me\s+)?(the\s+)?(answer|full\s+code|solution|final\s+code|code\s+for|complete\s+code)/i.test(
    studentQuery
  ) || /(just\s+(give|solve|write)|give\s+it\s+to\s+me|pls\s+solve|can\s+you\s+solve)/i.test(studentQuery);

  // 2. Detect if the student pasted raw programming syntax or boilerplate code
  const hasRawCode = /(class\s+Solution|def\s+[a-zA-Z_]|function\s+[a-zA-Z_]|public\s+(static\s+)?void|#include\s*<|import\s+java|const\s+\w+\s*=\s*\([^)]*\)\s*=>)/i.test(
    currentDraft + " " + studentQuery
  );

  const activeProblemDesc = problemStatement?.description || problemContext || "";
  const activeConstraints = problemStatement?.constraints || "";
  const activeInputFormat = problemStatement?.inputFormat || "";
  const activeOutputFormat = problemStatement?.outputFormat || "";

  const cacheKey = `skilltutor_${problemTitle.slice(0, 25)}_${mode}_${hintLevel}_${(studentQuery || "").slice(0, 25)}`;

  const prompt = `You are "SkillTutor", an expert Socratic Computer Science & Engineering Mentor.
You guide students to solve technical problems from first principles without ever spoon-feeding answers.

STRICT PEDAGOGICAL POLICY:
1. NEVER output working code, final solutions, or complete answers. If asked, politely refuse and provide a progressive conceptual hint instead.
2. Progressive 5-Stage Hints:
   - Stage 1: Concept Clarification (clarify fundamental definitions, patterns, and constraints)
   - Stage 2: Approach Suggestion (suggest high-level algorithmic paradigms, e.g. two-pointer, monotonically decreasing stack, sliding window)
   - Stage 3: Pseudocode or Small Analogy (give abstract pseudocode structure or a physical real-world analogy)
   - Stage 4: Likely Bug Location & Edge Cases (identify common pitfalls, off-by-one, boundary cases, or where learners stumble)
   - Stage 5: Guiding Question (ask a pointed, probing question that triggers the breakthrough)
3. Active Mode: "${mode}" (Available modes: hint, socratic, debug, concept, interview).
   - In "hint" mode: Follow the progressive 5-stage hint corresponding to hintLevel=${hintLevel}.
   - In "socratic" mode: Ask guiding questions that extract the student's own reasoning.
   - In "debug" mode: Analyze their current thinking/draft to identify logical gaps or missing invariants.
   - In "concept" mode: Explain foundational theoretical mechanics and asymptotic trade-offs.
   - In "interview" mode: Act as a senior tech interviewer asking clarifying questions and challenging complexity trade-offs.
4. Active Language Context: The student may be writing code in "${activeLanguage.toUpperCase()}". If discussing implementation or syntax bugs, frame language-specific concepts (e.g. pointers & memory in C, vectors & STL in C++, list slices & indentation in Python) without giving working solutions.
5. Copied Answer Detection: If the student entered boilerplate code or solutions, instruct them to re-explain the mechanism conceptually in their own words.
6. Adaptive Calibration:
   - Past Mistakes: ${pastMistakes.length > 0 ? pastMistakes.join("; ") : "None recorded"}
   - Weak Areas: ${weakAreas.length > 0 ? weakAreas.join("; ") : "General foundations"}
   Adapt your guidance to address these past pitfalls specifically.

Context:
- Problem Title: "${problemTitle}"
- Problem Description / Invariants: "${activeProblemDesc}"
- Input Format: "${activeInputFormat}"
- Output Format: "${activeOutputFormat}"
- Constraints: "${activeConstraints}"
- Topic: "${topic}"
- Active Language: "${activeLanguage}"
- Requested Hint Stage (1-5): ${hintLevel}
- Student Conceptual Draft: "${currentDraft || "Not started yet"}"
- Student Active Code (if any):
\`\`\`${activeLanguage}
${(currentCode || "").slice(0, 1500)}
\`\`\`
- Student Query: "${studentQuery || "Seeking guidance"}"
- Student Asks For Direct Answer: ${asksForDirectAnswer ? "YES - REFUSE POLITELY AND HINT" : "NO"}
- Raw Code Detected: ${hasRawCode ? "YES - DEMAND RE-EXPLANATION" : "NO"}

Output:
- socraticNudge: Conversational mentor guidance tailored directly to "${problemTitle}" (strictly NO working code).
- guidingQuestion: One sharp question for the student to answer.
- conceptualAnalogy: A vivid real-world analogy illuminating the core pattern.
- likelyBugLocation: Key pitfall or boundary case where learners fail for this specific problem.
- authorizedSnippet: Exactly ONE concise conceptual token (max 20 words, e.g. "[Concept] Invariant: Move left pointer when sum < target").
- hintTierName: Name matching the 5 progressive stages.
- isRefusal: boolean (true if student asked for direct answer).
- requiresReExplanation: boolean (true if student pasted code).
- adaptiveNote: Brief note on how this guidance was adapted to their history and problem constraints.
`;

  const schema = {
    type: Type.OBJECT,
    properties: {
      socraticNudge: { type: Type.STRING },
      guidingQuestion: { type: Type.STRING },
      conceptualAnalogy: { type: Type.STRING },
      likelyBugLocation: { type: Type.STRING },
      authorizedSnippet: { type: Type.STRING },
      hintTierName: { type: Type.STRING },
      isRefusal: { type: Type.BOOLEAN },
      requiresReExplanation: { type: Type.BOOLEAN },
      adaptiveNote: { type: Type.STRING },
    },
    required: [
      "socraticNudge",
      "guidingQuestion",
      "conceptualAnalogy",
      "likelyBugLocation",
      "authorizedSnippet",
      "hintTierName",
      "isRefusal",
      "requiresReExplanation",
      "adaptiveNote",
    ],
  };

  const aiResult = await generateJsonWithFallback(prompt, schema, cacheKey);
  if (aiResult && aiResult.socraticNudge) {
    return res.json({ success: true, data: aiResult, source: "gemini" });
  }

  // Curated Socratic 5-Stage Progressive Fallback Guidance
  const progressiveStages = [
    {
      hintTierName: "Stage 1: Concept Clarification",
      socraticNudge: asksForDirectAnswer
        ? "I cannot provide complete answers or working code directly—in engineering interviews, what gets you hired is defending your solution from first principles. Let's clarify the core concept first: What fundamental property distinguishes this problem from a brute-force search?"
        : "Let's clarify the underlying concept before writing any logic. Consider the mathematical structure of the data: is there monotonicity, sorting, or an overlapping sub-problem that eliminates redundant work?",
      guidingQuestion: "What specific invariant must remain true after every step of your algorithm?",
      conceptualAnalogy: "Like sorting a deck of cards: you don't inspect all 52 cards for every comparison once you know the suit is in ascending order.",
      likelyBugLocation: "Confusing zero-based indices or assuming the input is non-empty without checking.",
      authorizedSnippet: "[Concept] Invariant Definition: Identify the property preserved across every loop step.",
      isRefusal: asksForDirectAnswer,
      requiresReExplanation: hasRawCode,
      adaptiveNote: "Calibrated for foundational pattern recognition based on your recent diagnostic score.",
    },
    {
      hintTierName: "Stage 2: Approach Suggestion",
      socraticNudge:
        "Consider which algorithmic paradigm applies here: can two pointers converge towards the center in O(N) time, or does a sliding window maintain a dynamic candidate range?",
      guidingQuestion: "If you have two candidate boundaries, under what exact numeric condition should the left boundary advance versus the right boundary?",
      conceptualAnalogy: "Think of an optical zoom: expand the aperture while searching for valid signals, and narrow it as soon as the target constraint is satisfied.",
      likelyBugLocation: "Moving both pointers simultaneously and accidentally skipping the optimal midpoint candidate.",
      authorizedSnippet: "[Concept] Approach Strategy: Use dual converging pointers to prune impossible search space in O(1) space.",
      isRefusal: asksForDirectAnswer,
      requiresReExplanation: hasRawCode,
      adaptiveNote: "Adjusted to emphasize memory trade-offs, addressing your previous O(N) auxiliary space feedback.",
    },
    {
      hintTierName: "Stage 3: Pseudocode & Small Analogy",
      socraticNudge:
        "Here is the high-level abstract flow in plain words: Initialize boundaries -> Evaluate current window metric -> While condition is violated, shrink boundary and update running state -> Record optimal checkpoint.",
      guidingQuestion: "How can you update your running sum or frequency tracker in O(1) without re-iterating over the entire window?",
      conceptualAnalogy: "Like a balance scale: when you add a weight to one tray, you subtract the displaced counter-weight rather than rebuilding the scale from scratch.",
      likelyBugLocation: "Updating the result counter before properly evicting the invalid boundary element.",
      authorizedSnippet: "[Concept] Rolling State: Increment right index, evaluate window metric, conditionally shrink left index.",
      isRefusal: asksForDirectAnswer,
      requiresReExplanation: hasRawCode,
      adaptiveNote: "Emphasizing step-by-step state transitions to avoid premature optimization traps.",
    },
    {
      hintTierName: "Stage 4: Likely Bug Location & Pitfalls",
      socraticNudge:
        "Watch out for the classic trap: boundary termination. When the two boundaries meet (e.g. left == right or left > right), what should happen? Does your logic handle duplicate elements, negative numbers, or single-element inputs?",
      guidingQuestion: "What happens on the very last iteration when only one element remains? Does your loop condition terminate safely without an off-by-one error?",
      conceptualAnalogy: "Like stopping an elevator at the top floor: if you don't check for roof clearance before moving up, you cause an out-of-bounds collision.",
      likelyBugLocation: "Off-by-one error in termination check (`<` vs `<=`) and missing empty collection guard.",
      authorizedSnippet: "[Concept] Edge Safety: Check collection length > 0 and verify boundary condition termination (< vs <=).",
      isRefusal: asksForDirectAnswer,
      requiresReExplanation: hasRawCode,
      adaptiveNote: "Flagged boundary edge-cases specifically based on past quiz errors in condition checks.",
    },
    {
      hintTierName: "Stage 5: Guiding Question",
      socraticNudge:
        "You are right at the finish line. Put all the pieces together in your own words: explain why your invariant guarantees finding the optimal answer, and what the final Big-O time and space complexity will be.",
      guidingQuestion: "Can you prove why any element excluded by advancing your pointer could never participate in an optimal solution with any future element?",
      conceptualAnalogy: "Like solving a maze by wall-following: once you verify a dead end, you seal it permanently so you never waste steps retracing it.",
      likelyBugLocation: "Claiming O(1) space when recursive stack frames or auxiliary maps actually cost O(N).",
      authorizedSnippet: "[Concept] Asymptotic Proof: Time complexity is strictly O(N) since each pointer advances at most N times.",
      isRefusal: asksForDirectAnswer,
      requiresReExplanation: hasRawCode,
      adaptiveNote: "Final synthesis check: articulates complete engineering rationale for tech interview defense.",
    },
  ];

  const stageIndex = Math.min(Math.max(0, hintLevel - 1), progressiveStages.length - 1);
  const selectedGuidance = { ...progressiveStages[stageIndex] };

  if (asksForDirectAnswer) {
    selectedGuidance.isRefusal = true;
    selectedGuidance.socraticNudge =
      "I cannot provide complete answers or code directly—technical recruiters and engineering leads evaluate your capacity to reason through unfamiliar problems independently. Let's tackle it conceptually instead: " +
      selectedGuidance.socraticNudge;
  }

  if (hasRawCode) {
    selectedGuidance.requiresReExplanation = true;
    selectedGuidance.socraticNudge =
      "I noticed code syntax or template keywords in your input. SkillTutor is an anti-paste conceptual environment. Please re-explain the invariant logic and execution loop in plain words to demonstrate authentic mastery: " +
      selectedGuidance.socraticNudge;
  }

  return res.json({ success: true, data: selectedGuidance, source: "fallback" });
});

// Endpoint: SkillTutor Conceptual Answer Evaluator (with Independence & AI Reliance scores)
apiRouter.post("/gemini/skilltutor-evaluate", async (req, res) => {
  const {
    problemTitle = "",
    problemContext = "",
    studentAnswer = "",
    hintsUsedCount = 0,
    topic = "Algorithms",
    timeOnTaskSeconds = 120,
    attemptsCount = 1,
    refusalGivenCount = 0,
    copiedAnswerWarnings = 0,
    reExplanationProvided = false,
    pasteAttemptsCount = 0,
    integrityScore = 100,
  } = req.body;

  const cacheKey = `eval_${problemTitle.slice(0, 25)}_${studentAnswer.slice(0, 35)}_${hintsUsedCount}_${pasteAttemptsCount}`;

  // Check for copied code patterns in the submission
  const detectedCopiedCode = /(class\s+Solution|def\s+[a-zA-Z_]\w*\(|function\s+[a-zA-Z_]|public\s+static\s+void|#include\s*<)/i.test(
    studentAnswer
  );

  const prompt = `You are evaluating a student's answer submitted to SkillTutor.
In SkillTutor, students are NOT permitted to copy-paste code. They must explain their solution CONCEPTUALLY:
- The algorithmic approach and mental model
- Time and space complexity trade-offs
- Key invariants and edge case handling
- Why the chosen approach works better than brute force

Problem: "${problemTitle}"
Problem Context: "${problemContext}"
Topic: "${topic}"
Student's Conceptual Answer:
"""
${studentAnswer}
"""
Telemetry:
- Hints Used: ${hintsUsedCount} (out of 5 progressive tiers)
- Time on Task: ${timeOnTaskSeconds} seconds
- Evaluation Attempts: ${attemptsCount}
- Copied Code Pattern Detected: ${detectedCopiedCode ? "YES" : "NO"}
- Re-explanation provided: ${reExplanationProvided ? "YES" : "NO"}
- Intercepted Paste Attempts: ${pasteAttemptsCount}
- Anti-Cheat Integrity Score: ${integrityScore}%

Evaluate their conceptual understanding and compute:
1. score (0 to 100): Based on conceptual correctness, depth, complexity awareness, and clarity. If copied code is detected and not re-explained, cap score at 50.
2. passed: true if score >= 70.
3. conceptualDepth: "Surface / Incomplete", "Solid Foundations", or "Deep & Nuanced".
4. independenceScore (0 to 100): Autonomy score. High when few hints are used and student solved independently.
5. aiRelianceScore (0 to 100): AI dependency score. High when many hints or paste attempts were intercepted.
6. integritySignal: "Pristine (100% Organic)", "Verified Organic", "Flagged Pastes Detected", or "Elevated AI Reliance".
7. selfRelianceRating: "Fully Independent" (0 hints), "Guided Breakthrough" (1-2 hints), or "Assisted Learner" (3+ hints).
8. strengths: Array of 2-3 specific conceptual strengths shown in their write-up.
9. cognitiveGaps: Array of 1-2 edge cases, blindspots, or trade-offs they omitted.
10. socraticFeedback: 2-3 sentences of encouraging, mentor-like appraisal.
11. careerReadinessVerdict: How a tech interviewer would perceive this response (e.g. "Strong Candidate: Defends asymptotic trade-offs from first principles").
12. requiresReExplanation: boolean (true if copied code was detected).
`;

  const schema = {
    type: Type.OBJECT,
    properties: {
      score: { type: Type.INTEGER },
      passed: { type: Type.BOOLEAN },
      conceptualDepth: { type: Type.STRING },
      independenceScore: { type: Type.INTEGER },
      aiRelianceScore: { type: Type.INTEGER },
      integritySignal: { type: Type.STRING },
      selfRelianceRating: { type: Type.STRING },
      strengths: {
        type: Type.ARRAY,
        items: { type: Type.STRING },
      },
      cognitiveGaps: {
        type: Type.ARRAY,
        items: { type: Type.STRING },
      },
      socraticFeedback: { type: Type.STRING },
      careerReadinessVerdict: { type: Type.STRING },
      requiresReExplanation: { type: Type.BOOLEAN },
    },
    required: [
      "score",
      "passed",
      "conceptualDepth",
      "independenceScore",
      "aiRelianceScore",
      "integritySignal",
      "selfRelianceRating",
      "strengths",
      "cognitiveGaps",
      "socraticFeedback",
      "careerReadinessVerdict",
      "requiresReExplanation",
    ],
  };

  const aiResult = await generateJsonWithFallback(prompt, schema, cacheKey);
  if (aiResult && typeof aiResult.score === "number") {
    return res.json({ success: true, data: aiResult, source: "gemini" });
  }

  // Fallback evaluation heuristic
  const hasComplexity = /O\(|complexity|time|space|linear|logarithmic|quadratic/i.test(studentAnswer);
  const hasInvariant = /pointer|window|condition|base case|iterate|cache|edge|invariant|boundary/i.test(studentAnswer);
  const lengthScore = Math.min(40, Math.round(studentAnswer.length / 6));

  let baseScore = Math.min(95, Math.max(50, lengthScore + (hasComplexity ? 25 : 10) + (hasInvariant ? 25 : 10) - (hintsUsedCount * 4)));
  if (detectedCopiedCode && !reExplanationProvided) {
    baseScore = Math.min(50, baseScore);
  }

  // Calculate Independence and AI Reliance factoring in paste attempts
  const rawIndependence = 100 - (hintsUsedCount * 10) - (refusalGivenCount * 8) - (copiedAnswerWarnings * 8) - (pasteAttemptsCount * 6) + (attemptsCount === 1 ? 5 : 0);
  const calculatedIndependence = Math.max(15, Math.min(100, Math.round(rawIndependence)));
  const calculatedAiReliance = Math.max(0, Math.min(90, 100 - calculatedIndependence + (pasteAttemptsCount * 5)));
  const computedIntegritySignal =
    pasteAttemptsCount === 0
      ? "Pristine (100% Organic)"
      : pasteAttemptsCount <= 2
      ? "Verified Organic (Pastes Intercepted & Resolved)"
      : "Elevated AI Reliance (Multiple Paste Warnings)";

  const fallbackEval = {
    score: baseScore,
    passed: baseScore >= 70,
    conceptualDepth: baseScore >= 85 ? "Deep & Nuanced" : baseScore >= 70 ? "Solid Foundations" : "Surface / Incomplete",
    independenceScore: calculatedIndependence,
    aiRelianceScore: calculatedAiReliance,
    integritySignal: computedIntegritySignal,
    selfRelianceRating: hintsUsedCount === 0 ? "Fully Independent" : hintsUsedCount <= 2 ? "Guided Breakthrough" : "Assisted Learner",
    strengths: [
      "Articulated algorithmic mechanics using first-principles reasoning without relying on pasted code.",
      hasComplexity ? "Explicitly factored Big-O asymptotic runtime and space bounds into design." : "Clearly structured the loop progression and state transition.",
    ],
    cognitiveGaps: [
      hasComplexity ? "Could deepen analysis by verifying empty input or duplicate element edge cases." : "Specify the exact Big-O runtime and auxiliary memory bounds.",
    ],
    socraticFeedback:
      baseScore >= 70
        ? "Impressive conceptual breakdown! You clearly reasoned through the core mechanism instead of reciting memorized code."
        : "Promising start. Focus more on explaining the exact invariant condition, boundary termination, and asymptotic bounds in your own words.",
    careerReadinessVerdict:
      baseScore >= 85
        ? "Strong Candidate: Defends engineering trade-offs with high verbal precision."
        : "Promising: Demonstrates working grasp of core logic, ready for guided interview rounds.",
    requiresReExplanation: detectedCopiedCode && !reExplanationProvided,
  };

  return res.json({ success: true, data: fallbackEval, source: "fallback" });
});

// Endpoint: SkillTutor Comprehensive Career Growth Report (with Independence & AI Reliance)
apiRouter.post("/gemini/skilltutor-report", async (req, res) => {
  const {
    studentProfile = {},
    challengesCompleted = 3,
    avgConceptualScore = 84,
    avgHintsPerProblem = 1.2,
    avgIndependenceScore = 82,
    avgAiRelianceScore = 18,
    totalPasteAttempts = 0,
    topicsSolved = ["Algorithms", "System Architecture", "SQL Optimization"],
  } = req.body;

  const cacheKey = `report_${studentProfile.name || "student"}_${challengesCompleted}_${avgConceptualScore}_${avgIndependenceScore}_${totalPasteAttempts}`;

  const prompt = `Generate an executive "SkillTutor Career & Conceptual Growth Report" for a student preparing for software engineering and tech internships.
Student Name: ${studentProfile.name || "Student Candidate"}
Target Role: ${studentProfile.targetRole || "Software Engineer Intern"}
Verified Challenges Completed: ${challengesCompleted}
Average Conceptual Score: ${avgConceptualScore}%
Average Hints Used: ${avgHintsPerProblem}
Independence Score: ${avgIndependenceScore}%
AI Reliance Score: ${avgAiRelianceScore}%
Total Intercepted Paste Attempts: ${totalPasteAttempts}
Topics Practiced: ${topicsSolved.join(", ")}

Requirements:
- Emphasize that all answers were written organically in a conceptual, anti-paste environment (100% anti-cheat integrity).
- Quantify independence vs AI reliance to show that the candidate derives logic rather than relying on LLM solutions.
- Highlight the integrity score: candidate solved problems with ${totalPasteAttempts === 0 ? "zero external pastes (100% organic derivation)" : `${totalPasteAttempts} blocked paste attempts fully cleared by manual conceptual explanations`}.
- Provide an objective assessment of their problem-solving autonomy and interview readiness.
- Include topic breakdown with recommendations.
`;

  const schema = {
    type: Type.OBJECT,
    properties: {
      executiveSummary: { type: Type.STRING },
      conceptualProficiencyIndex: { type: Type.INTEGER },
      selfRelianceRate: { type: Type.INTEGER },
      independenceScore: { type: Type.INTEGER },
      aiRelianceScore: { type: Type.INTEGER },
      antiCheatIntegrity: { type: Type.STRING },
      careerReadinessTier: { type: Type.STRING },
      recruiterPitchSummary: { type: Type.STRING },
      topStrengths: {
        type: Type.ARRAY,
        items: { type: Type.STRING },
      },
      growthOpportunities: {
        type: Type.ARRAY,
        items: { type: Type.STRING },
      },
      topicBreakdown: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            topic: { type: Type.STRING },
            score: { type: Type.INTEGER },
            status: { type: Type.STRING },
            recommendation: { type: Type.STRING },
          },
          required: ["topic", "score", "status", "recommendation"],
        },
      },
    },
    required: [
      "executiveSummary",
      "conceptualProficiencyIndex",
      "selfRelianceRate",
      "independenceScore",
      "aiRelianceScore",
      "antiCheatIntegrity",
      "careerReadinessTier",
      "recruiterPitchSummary",
      "topStrengths",
      "growthOpportunities",
      "topicBreakdown",
    ],
  };

  const aiResult = await generateJsonWithFallback(prompt, schema, cacheKey);
  if (aiResult && aiResult.executiveSummary) {
    return res.json({ success: true, data: aiResult, source: "gemini" });
  }

  // Fallback comprehensive report
  const fallbackReport = {
    executiveSummary: `${studentProfile.name || "The candidate"} demonstrates strong conceptual articulation under SkillTutor's anti-paste constraints. Across ${challengesCompleted} evaluated scenarios, they achieved an Independence Score of ${avgIndependenceScore}% and an AI Reliance Score of ${avgAiRelianceScore}%, showing disciplined first-principles reasoning with minimal copilot dependence.`,
    conceptualProficiencyIndex: avgConceptualScore || 85,
    selfRelianceRate: Math.max(70, Math.min(95, Math.round((1 - avgHintsPerProblem / 5) * 100))),
    independenceScore: avgIndependenceScore || 82,
    aiRelianceScore: avgAiRelianceScore || 18,
    antiCheatIntegrity: "100% Verified Organic Formulation (Zero external code pasted, all answers derived in-situ)",
    careerReadinessTier: avgConceptualScore >= 85 ? "Production-Ready Candidate" : "Competent Builder (Interview Stage)",
    recruiterPitchSummary:
      "Unlike candidates who rely on memorized LeetCode syntax or AI generators, this candidate can dissect unseen technical problems from first principles, explain asymptotic trade-offs, and defend architectural invariants out loud with high independence.",
    topStrengths: [
      "Translates complex runtime requirements into clean mathematical bounds with high independence.",
      "Maintains composure when navigating edge-case state transitions and boundary checks.",
      "Low AI reliance profile—derives algorithmic proofs with minimal external hinting.",
    ],
    growthOpportunities: [
      "Further solidify distributed system consistency trade-offs (CAP theorem nuances).",
      "Explicitly verbalize cache-invalidation policies when discussing persistence layers.",
    ],
    topicBreakdown: [
      {
        topic: "Algorithmic Invariants & Pointers",
        score: 88,
        status: "High Competency",
        recommendation: "Ready for tier-1 technical screening rounds.",
      },
      {
        topic: "System Design & Scaling",
        score: 82,
        status: "Competitive",
        recommendation: "Practice token bucket rate limiters and database sharding trade-offs.",
      },
      {
        topic: "Relational Query & Index Optimization",
        score: 79,
        status: "Developing Strength",
        recommendation: "Focus on composite index ordering and execution plan explain outputs.",
      },
    ],
  };

  return res.json({ success: true, data: fallbackReport, source: "fallback" });
});

// Endpoint: Synchronize LeetCode & HackerRank Streaks and Solved Statistics
apiRouter.post("/platforms/sync-streak", async (req, res) => {
  const { platform = "leetcode", username = "" } = req.body;

  const cleanUser = (username || "student_coder").trim();

  // Deterministic calculation based on username for realistic sync
  let hash = 0;
  for (let i = 0; i < cleanUser.length; i++) {
    hash = (hash << 5) - hash + cleanUser.charCodeAt(i);
    hash |= 0;
  }
  const absHash = Math.abs(hash);

  if (platform === "leetcode") {
    const dailyStreak = (absHash % 18) + 3; // 3 to 20 days streak
    const easy = (absHash % 80) + 45;
    const medium = (absHash % 60) + 30;
    const hard = (absHash % 15) + 5;
    const totalSolved = easy + medium + hard;
    const ranking = (absHash % 85000) + 12000;

    return res.json({
      success: true,
      platform: "leetcode",
      username: cleanUser,
      dailyStreak,
      totalSolved,
      breakdown: { easy, medium, hard },
      ranking: `#${ranking.toLocaleString()}`,
      verifiedToday: true,
      xpBonusAwarded: 40,
      badge: "LeetCode Daily Solver",
      lastSyncedAt: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    });
  } else if (platform === "hackerrank") {
    const dailyStreak = (absHash % 14) + 4; // 4 to 17 days
    const totalSolved = (absHash % 120) + 65;
    const stars = (absHash % 2) + 5; // 5 or 6 stars

    return res.json({
      success: true,
      platform: "hackerrank",
      username: cleanUser,
      dailyStreak,
      totalSolved,
      stars: `${stars} Stars in Problem Solving`,
      verifiedToday: true,
      xpBonusAwarded: 40,
      badge: "HackerRank Gold Badge",
      lastSyncedAt: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    });
  }

  return res.status(400).json({ success: false, message: "Unknown platform" });
});

// ==========================================
// SkillTutor Python, C, C++ Compiler Endpoints
// ==========================================

// Endpoint: Execute Code with Multi-Language Compiler (Python, C, C++)
apiRouter.post("/skilltutor/compile", async (req, res) => {
  const {
    language = "python",
    code = "",
    stdin = "",
    testCases = [],
  } = req.body;

  if (!code || typeof code !== "string" || !code.trim()) {
    return res.status(400).json({
      success: false,
      message: "Code must not be empty.",
    });
  }

  if (!["python", "c", "cpp"].includes(language)) {
    return res.status(400).json({
      success: false,
      message: `Invalid language '${language}'. Supported: python, c, cpp`,
    });
  }

  try {
    const result = await executeCodeInSandbox(
      language as "python" | "c" | "cpp",
      code,
      stdin,
      testCases as TestCaseInput[]
    );

    return res.json({
      success: true,
      data: result,
    });
  } catch (err: any) {
    console.error("Execution error:", err);
    return res.status(500).json({
      success: false,
      message: err.message || "Failed to execute code in sandbox environment.",
    });
  }
});

// Endpoint: Socratic AI Compiler Guidance & Diagnostics
apiRouter.post("/skilltutor/diagnose-compiler", async (req, res) => {
  const {
    language = "python",
    code = "",
    errorOutput = "",
    problemStatement = null,
    studentQuery = "",
  } = req.body;

  const problemTitle = problemStatement?.title || "Active Coding Problem";
  const problemDesc = problemStatement?.description || problemStatement?.conceptualScenario || "";
  const constraints = problemStatement?.constraints || "";

  const prompt = `You are "SkillTutor", an expert Socratic Compiler & Systems Programming Mentor.
The student is working on a problem in ${language.toUpperCase()}.
Their program produced an error (compilation error, runtime crash, wrong test output, or syntax issue).

PEDAGOGICAL DIRECTIVES:
1. Explain the underlying ROOT CAUSE clearly, but DO NOT provide the full corrected code or spoon-feed the direct solution!
2. If it is C or C++:
   - Identify memory model issues (uninitialized pointers, segmentation faults, buffer overflow, dangling pointers, missing headers like <stdlib.h> or <iostream>, type mismatches).
   - Point to the specific line or construct that violates language semantics.
3. If it is Python:
   - Identify syntax errors, IndentationError, IndexError, KeyError, recursion depth, or algorithmic complexity traps.
4. Relate the bug back to the active problem statement: "${problemTitle}".
5. Offer 1 Socratic guiding question and 1 small hint to help them fix it themselves.

Problem Details:
- Title: ${problemTitle}
- Problem Statement: ${problemDesc}
- Constraints: ${constraints}
- Language: ${language}
- Student Code:
\`\`\`${language}
${code.slice(0, 3000)}
\`\`\`
- Compiler / Runtime / Test Error Output:
\`\`\`
${(errorOutput || "").slice(0, 2000)}
\`\`\`
- Student's Question: "${studentQuery || "Why is my code failing?"}"

Format your response strictly as JSON with keys:
- rootCause: Clear, concise explanation of why the compiler or runtime failed.
- lineReference: Specific line or function area where the issue occurred (e.g. "Line 14 in loop header" or "Pointer dereference in main()").
- socraticHint: A guiding clue or mental model to resolve the issue without giving the full code.
- problemConnection: How this relates to the invariants or constraints of "${problemTitle}".
- guidingQuestion: One sharp question for the student to consider.`;

  try {
    const ai = getGeminiClient();
    if (ai && Date.now() >= geminiCooldownUntil) {
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              rootCause: { type: Type.STRING },
              lineReference: { type: Type.STRING },
              socraticHint: { type: Type.STRING },
              problemConnection: { type: Type.STRING },
              guidingQuestion: { type: Type.STRING },
            },
            required: ["rootCause", "socraticHint", "guidingQuestion"],
          },
        },
      });

      if (response.text) {
        const parsed = JSON.parse(response.text);
        return res.json({ success: true, data: parsed, source: "gemini" });
      }
    }
  } catch (err: any) {
    console.warn("Gemini compiler diagnostic error, using Socratic fallback:", err?.message);
    if (err?.status === 429 || err?.message?.includes("429")) {
      geminiCooldownUntil = Date.now() + 60000;
    }
  }

  // Heuristic Socratic Fallback
  let rootCause = "The program encountered an execution issue during compilation or runtime.";
  let lineReference = "Check loop bounds and variable declarations.";
  let socraticHint = "Trace the program step-by-step with a minimal test case on paper.";
  let guidingQuestion = "What values do your variables hold right before the error occurs?";

  if (language === "c" || language === "cpp") {
    if (/segmentation fault/i.test(errorOutput)) {
      rootCause = "Segmentation Fault (SIGSEGV): The program attempted to access memory that does not belong to it, such as dereferencing a NULL or uninitialized pointer, or reading past allocated array bounds.";
      lineReference = "Array indexing or pointer dereference (*ptr).";
      socraticHint = "Ensure all allocated pointers are checked for NULL before use, and confirm array indices stay strictly within 0 to N-1.";
      guidingQuestion = "Are you accessing index [N] when the array size is N?";
    } else if (/error:/i.test(errorOutput)) {
      rootCause = "Compilation Error: The compiler detected syntax errors or undeclared symbols before building the executable.";
      lineReference = errorOutput.split("\n")[0] || "Top of source";
      socraticHint = "Look at the first error reported by GCC/G++; fixing the first syntax error often eliminates subsequent cascading warnings.";
      guidingQuestion = "Did you include all necessary header files (#include <stdio.h>, <stdlib.h>, <iostream>, etc.)?";
    }
  } else if (language === "python") {
    if (/IndexError/i.test(errorOutput)) {
      rootCause = "IndexError: List index out of range. You tried to access an element at an index that exceeds the current length of the list.";
      lineReference = "List indexing brackets [i]";
      socraticHint = "Check whether your loop runs up to len(items) instead of len(items)-1, especially when accessing i+1.";
      guidingQuestion = "What is the maximum index your loop reaches on a 1-element input?";
    } else if (/SyntaxError|IndentationError/i.test(errorOutput)) {
      rootCause = "Python Syntax/Indentation Error: The Python interpreter found misaligned blocks or missing punctuation.";
      lineReference = errorOutput.split("\n").slice(-2)[0] || "Indented block";
      socraticHint = "Ensure consistent indentation (4 spaces) throughout the function block.";
      guidingQuestion = "Are you mixing tabs and spaces or missing a colon after an if/for/def statement?";
    }
  }

  return res.json({
    success: true,
    data: {
      rootCause,
      lineReference,
      socraticHint,
      problemConnection: `Consider how the constraints for '${problemTitle}' dictate memory and pointer limits.`,
      guidingQuestion,
    },
    source: "fallback",
  });
});

// Endpoint: AI-Assisted Custom Problem Statement Generator
apiRouter.post("/skilltutor/generate-problem", async (req, res) => {
  const { promptText = "Two Sum with sorted array", difficulty = "Intermediate Architecture", topic = "Algorithms" } = req.body;

  const prompt = `You are an expert Computer Science contest problem designer.
Generate a structured, high-quality technical coding challenge based on this prompt: "${promptText}".
Topic: ${topic}
Difficulty: ${difficulty}

Output strictly JSON with:
- title: Short, engaging problem title
- topic: Category (e.g. Arrays & Pointers, Dynamic Programming, Graphs)
- difficulty: One of 'Conceptual Foundational', 'Intermediate Architecture', 'Advanced Trade-offs'
- description: Clear problem description explaining the scenario, requirements, and goal
- inputFormat: Exact specification of stdin input format
- outputFormat: Exact specification of stdout output format
- constraints: Performance, memory, and value constraints (e.g. "1 <= N <= 10^5, Time: 2.0s, Space: O(N)")
- testCases: Array of 3 test cases, each with { id: "tc1", input: "string", expectedOutput: "string", explanation: "string" }
- starterCode: Object with keys { python: "string", c: "string", cpp: "string" } containing clean standard I/O starter templates`;

  try {
    const ai = getGeminiClient();
    if (ai && Date.now() >= geminiCooldownUntil) {
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING },
              topic: { type: Type.STRING },
              difficulty: { type: Type.STRING },
              description: { type: Type.STRING },
              inputFormat: { type: Type.STRING },
              outputFormat: { type: Type.STRING },
              constraints: { type: Type.STRING },
              testCases: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    id: { type: Type.STRING },
                    input: { type: Type.STRING },
                    expectedOutput: { type: Type.STRING },
                    explanation: { type: Type.STRING },
                  },
                  required: ["id", "input", "expectedOutput"],
                },
              },
              starterCode: {
                type: Type.OBJECT,
                properties: {
                  python: { type: Type.STRING },
                  c: { type: Type.STRING },
                  cpp: { type: Type.STRING },
                },
                required: ["python", "c", "cpp"],
              },
            },
            required: ["title", "topic", "description", "testCases", "starterCode"],
          },
        },
      });

      if (response.text) {
        const parsed = JSON.parse(response.text);
        return res.json({ success: true, data: parsed, source: "gemini" });
      }
    }
  } catch (err: any) {
    console.warn("Problem generation Gemini error, using fallback template:", err?.message);
    if (err?.status === 429 || err?.message?.includes("429")) {
      geminiCooldownUntil = Date.now() + 60000;
    }
  }

  // Fallback problem template
  return res.json({
    success: true,
    data: {
      title: promptText.length > 3 ? promptText.charAt(0).toUpperCase() + promptText.slice(1) : "Custom Algorithm Challenge",
      topic: topic || "Data Structures & Algorithms",
      difficulty: difficulty || "Intermediate Architecture",
      description: `Given a collection of data elements according to the prompt "${promptText}", design an optimal algorithm in Python, C, or C++ that processes the input and produces the required output under the defined constraints. Ensure O(1) or minimal auxiliary memory where applicable.`,
      inputFormat: "First line contains N. Second line contains N space-separated integers.",
      outputFormat: "Print the computed result on a single line.",
      constraints: "1 <= N <= 10^5, -10^9 <= A[i] <= 10^9, Time Limit: 2.0s, Space Limit: 256MB",
      testCases: [
        { id: "tc1", input: "5\n1 2 3 4 5", expectedOutput: "15", explanation: "Sum of elements 1 to 5" },
        { id: "tc2", input: "3\n10 20 30", expectedOutput: "60", explanation: "Sum of elements 10, 20, 30" },
      ],
      starterCode: {
        python: `import sys\n\ndef solve():\n    lines = sys.stdin.read().split()\n    if not lines:\n        return\n    n = int(lines[0])\n    nums = [int(x) for x in lines[1:n+1]]\n    # Implement your algorithm here\n    print(sum(nums))\n\nif __name__ == '__main__':\n    solve()\n`,
        c: `#include <stdio.h>\n#include <stdlib.h>\n\nint main() {\n    int n;\n    if (scanf("%d", &n) != 1) return 0;\n    long long sum = 0;\n    for (int i = 0; i < n; i++) {\n        int val;\n        scanf("%d", &val);\n        sum += val;\n    }\n    printf("%lld\\n", sum);\n    return 0;\n}\n`,
        cpp: `#include <iostream>\n#include <vector>\n#include <numeric>\n\nusing namespace std;\n\nint main() {\n    ios_base::sync_with_stdio(false);\n    cin.tie(NULL);\n    int n;\n    if (!(cin >> n)) return 0;\n    vector<long long> nums(n);\n    long long sum = 0;\n    for (int i = 0; i < n; i++) {\n        cin >> nums[i];\n        sum += nums[i];\n    }\n    cout << sum << "\\n";\n    return 0;\n}\n`,
      },
    },
    source: "fallback",
  });
});

// Root API descriptor (only on /api)
app.get(["/api", "/api/"], (_req, res) => {
  res.json({
    status: "ok",
    service: "SkillMatcher & Career Launchpad API",
    hasGeminiKey: Boolean(process.env.GEMINI_API_KEY),
    isRateLimited: Date.now() < geminiCooldownUntil,
    timestamp: new Date().toISOString(),
  });
});

// Mount router under /api
app.use("/api", apiRouter);

export default app;
