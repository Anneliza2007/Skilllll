import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

app.use(express.json({ limit: "5mb" }));

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

// Health check endpoint
app.get("/api/health", (_req, res) => {
  res.json({
    status: "ok",
    hasGeminiKey: Boolean(process.env.GEMINI_API_KEY),
    timestamp: new Date().toISOString(),
  });
});

// Endpoint: Personalized Quiz Generator for Weak Topics
app.post("/api/gemini/quiz", async (req, res) => {
  const { topic, weakSkills = [], studentLevel = "intermediate", count = 4 } = req.body;
  const targetTopic = topic || (weakSkills.length > 0 ? weakSkills[0] : "Web Development & Algorithms");

  const ai = getGeminiClient();
  if (ai) {
    try {
      const prompt = `Generate a ${count}-question diagnostic multiple-choice quiz targeted for a college student who identified "${targetTopic}" as their weak area (related weak skills: ${weakSkills.join(", ") || "general"}).
Student experience level: ${studentLevel}.
Requirements:
- Questions must be practical, testing real-world understanding or debugging code, not trivial trivia.
- Exactly 4 options per question with 1 correct option.
- Detailed explanation for WHY the correct answer is right and why common misconceptions are wrong.
- A "quickFixTip" (1-2 sentence golden takeaway to solidify this concept immediately).
`;

      const response = await ai.models.generateContent({
        model: "gemini-3.8-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
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
          },
        },
      });

      if (response.text) {
        const parsed = JSON.parse(response.text);
        return res.json({ success: true, data: parsed, source: "gemini" });
      }
    } catch (err: any) {
      console.warn("Gemini quiz generation fallback triggered:", err?.message);
    }
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
app.post("/api/gemini/optimize-profile", async (req, res) => {
  const {
    currentBullets = [],
    skills = [],
    targetRole = "Software Engineering Intern",
    experienceSummary = "",
    targetCompanyType = "Tech Startups & Top Companies",
  } = req.body;

  const ai = getGeminiClient();
  if (ai) {
    try {
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

      const response = await ai.models.generateContent({
        model: "gemini-3.8-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
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
          },
        },
      });

      if (response.text) {
        const parsed = JSON.parse(response.text);
        return res.json({ success: true, data: parsed, source: "gemini" });
      }
    } catch (err: any) {
      console.warn("Gemini profile optimization fallback triggered:", err?.message);
    }
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

// Endpoint: Project Ideas for Strong Skills
app.post("/api/gemini/generate-projects", async (req, res) => {
  const { strongSkills = [], interests = [], targetRole = "Software Engineer" } = req.body;
  const skillsList = strongSkills.length > 0 ? strongSkills : ["React", "TypeScript", "Python", "SQL"];

  const ai = getGeminiClient();
  if (ai) {
    try {
      const prompt = `Create 3 impressive, standout portfolio project ideas tailored for a student's strongest skills: ${skillsList.join(", ")}.
Student career interests: ${interests.join(", ") || targetRole}.
Target role: ${targetRole}.
Requirements for each project:
- Must NOT be generic tutorials (no basic ToDo apps or generic weather apps).
- Must solve a real problem or simulate industry-grade challenges (e.g. rate limiters, caching layers, real-time analytics, AI workflow automation).
- Include: title, tagline, estimatedTime, difficulty, techStack array, problemSolved, 3-step milestone roadmap, and exact resume pitch bullet point.
`;

      const response = await ai.models.generateContent({
        model: "gemini-3.8-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
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
          },
        },
      });

      if (response.text) {
        const parsed = JSON.parse(response.text);
        return res.json({ success: true, data: parsed.projects, source: "gemini" });
      }
    } catch (err: any) {
      console.warn("Gemini project generator fallback triggered:", err?.message);
    }
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
app.post("/api/gemini/match-internships", async (req, res) => {
  const { studentSkills = [], interests = [], experience = "", internships = [] } = req.body;

  const ai = getGeminiClient();
  if (ai && internships.length > 0) {
    try {
      const prompt = `You are an AI Internship Matchmaker. Given this student's profile and a list of available internships, evaluate each internship and provide a match score (0-100), match reasons, missing skills to learn, and custom interview prep tip.
Student Profile:
- Skills: ${studentSkills.map((s: any) => `${s.name} (${s.level})`).join(", ")}
- Interests: ${interests.join(", ")}
- Experience/Projects: ${experience || "College student with coursework and projects"}

Internships to score:
${internships.map((job: any) => `ID: ${job.id} | Role: ${job.title} at ${job.company} | Required: ${job.requiredSkills.join(", ")} | Description: ${job.description}`).join("\n\n")}
`;

      const response = await ai.models.generateContent({
        model: "gemini-3.8-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
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
          },
        },
      });

      if (response.text) {
        const parsed = JSON.parse(response.text);
        return res.json({ success: true, data: parsed.matches, source: "gemini" });
      }
    } catch (err: any) {
      console.warn("Gemini internship matcher fallback triggered:", err?.message);
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

    // Check interest overlap
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

// Vite & Static Asset Handling
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`🚀 SkillMatcher server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
