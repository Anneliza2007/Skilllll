export interface CareerPrompt {
  id: string;
  title: string;
  category: 'Quizzes' | 'Resume & LinkedIn' | 'Strong Projects' | 'Comfort Zone' | 'Daily Routine';
  targetAudience: string;
  description: string;
  variables: { name: string; description: string; example: string }[];
  promptTemplate: string;
}

export const CAREER_PROMPTS: CareerPrompt[] = [
  {
    id: 'prompt-diagnostic-quiz',
    title: 'Diagnostic Weak-Skill Quiz Generator',
    category: 'Quizzes',
    targetAudience: 'Students with identified knowledge blind spots in specific frameworks or languages',
    description: 'Generates practical, debugging-focused multiple choice questions testing real-world traps rather than rote trivia.',
    variables: [
      { name: 'TARGET_TOPIC', description: 'The weak skill to diagnose', example: 'SQL Indexing & Joins' },
      { name: 'STUDENT_LEVEL', description: 'Current proficiency', example: 'Intermediate' },
      { name: 'QUESTION_COUNT', description: 'Number of diagnostic questions', example: '4' },
    ],
    promptTemplate: `Act as a principal software engineer conducting a technical diagnostic for an intern candidate.
The candidate has identified "{TARGET_TOPIC}" as their weakest subject. Their general experience level is {STUDENT_LEVEL}.

Generate {QUESTION_COUNT} diagnostic questions designed to surface underlying misconceptions.
For each question:
1. Provide a realistic scenario or short code snippet containing an edge case or subtle bug.
2. Present 4 plausible options where incorrect answers reflect common junior misconceptions (e.g. confusing WHERE vs HAVING, shallow copy vs deep copy, O(N^2) hidden re-renders).
3. Identify the exact correct answer.
4. Give a clear technical explanation why the other choices fail.
5. Provide a "Quick Fix Rule": a single memorable rule of thumb the student can apply immediately in an interview.`,
  },
  {
    id: 'prompt-strong-project',
    title: 'Standout Portfolio Project Architect (Strong Topics)',
    category: 'Strong Projects',
    targetAudience: 'Students wanting to showcase their absolute strongest skills through enterprise-grade architecture',
    description: 'Translates high proficiency skills into a complex, multi-milestone system that impresses engineering hiring managers.',
    variables: [
      { name: 'STRONG_SKILLS', description: 'Your top 2-4 strongest skills', example: 'React, TypeScript, WebSocket, Tailwind' },
      { name: 'TARGET_ROLE', description: 'Desired internship or full-time title', example: 'Frontend Platform Engineer' },
      { name: 'DOMAIN_INTEREST', description: 'Industry or technical niche', example: 'Financial Trading Terminals or DevTools' },
    ],
    promptTemplate: `Act as a Staff Software Architect at a top tier tech company.
I am a college student whose strongest technical skills are: {STRONG_SKILLS}.
My target role is: {TARGET_ROLE} in the {DOMAIN_INTEREST} space.

I want to build a portfolio project that immediately differentiates me from the thousands of generic todo apps and clone tutorials.
Design 1 standout project specification that:
1. Solves a non-trivial problem involving concurrency, high-throughput data streams, or custom protocol parsing.
2. Leverages my strongest skills at an advanced level (e.g., custom hooks, virtualized rendering, memory leak prevention).
3. Breaks down into 3 incremental milestones that can be completed over 2-3 weeks.
4. Provides the exact resume pitch bullet written in Google XYZ format: "Accomplished [X], as measured by [Y], by doing [Z]".
5. Highlights 2 specific architectural trade-offs to discuss during technical interviews.`,
  },
  {
    id: 'prompt-resume-xyz',
    title: 'Google XYZ Resume & LinkedIn Headline Polisher',
    category: 'Resume & LinkedIn',
    targetAudience: 'Students whose resume bullets are duty-focused rather than quantified impact',
    description: 'Transforms passive job description bullets into high-impact metrics-driven achievement statements with ATS keyword matching.',
    variables: [
      { name: 'RAW_BULLET', description: 'Draft resume line', example: 'Built a search feature for user documents using Python and Elasticsearch' },
      { name: 'TARGET_COMPANY_TYPE', description: 'Type of employer', example: 'Series B Tech Startups & Big Tech' },
      { name: 'KEY_SKILLS', description: 'Skills you want to highlight', example: 'Python, Elasticsearch, Docker, Redis' },
    ],
    promptTemplate: `Act as a senior tech recruiter who has reviewed 10,000+ software engineering resumes.
Here is my current draft bullet point:
"{RAW_BULLET}"

My target employer type is: {TARGET_COMPANY_TYPE}.
Skills to highlight: {KEY_SKILLS}.

Please provide:
1. Three rewritten versions strictly using the Google XYZ formula: "Accomplished [X] as measured by [Y], by doing [Z]".
   - Version A: Optimized for Performance & Latency Metrics (e.g. % speedup, ms response time).
   - Version B: Optimized for Scale & Volume Metrics (e.g. requests/sec, data throughput).
   - Version C: Optimized for Business/User Impact (e.g. adoption rate, error rate reduction).
2. Two high-converting LinkedIn headlines that balance student identity with technical authority.
3. A punchy 3-sentence LinkedIn "About" pitch that positions me as a proactive, high-velocity builder.
4. Five high-priority ATS keywords to weave in for maximum recruiter search visibility.`,
  },
  {
    id: 'prompt-comfort-zone',
    title: 'Out-of-Comfort-Zone Practice Platform Scout',
    category: 'Comfort Zone',
    targetAudience: 'Students stuck in LeetCode/W3Schools tutorial hell who need real engineering scars',
    description: 'Finds niche, challenging practice platforms tailored to shock you out of passive learning into active problem-solving.',
    variables: [
      { name: 'COMFORT_STACK', description: 'What you currently feel comfortable in', example: 'MERN stack (React, Node, Express, MongoDB)' },
      { name: 'INTIMIDATING_TOPIC', description: 'What intimidates you', example: 'Low-level Linux memory management and broken production incidents' },
    ],
    promptTemplate: `Act as a software engineering mentor who believes in learning by breaking things in real environments.
My current comfort zone is: {COMFORT_STACK}.
The technical area that most intimidates me is: {INTIMIDATING_TOPIC}.

Please recommend 3 unconventional, hands-on practice platforms outside the standard LeetCode and tutorial video ecosystem.
For each platform:
1. Explain specifically what artificial comfort it strips away (e.g. no GUI, real terminal SSH, byte-level wire protocols).
2. Give 1 specific starter challenge on that platform that takes under 45 minutes to complete.
3. Outline the permanent mental model shift I will experience after solving that starter challenge.
4. Provide a 3-step action plan to tackle it without quitting out of frustration.`,
  },
  {
    id: 'prompt-streak-routine',
    title: 'Daily Streak & Action Checklist Routine Generator',
    category: 'Daily Routine',
    targetAudience: 'Students struggling with consistency or feeling overwhelmed by vast syllabi',
    description: 'Designs a micro-habit 45-minute daily checklist that ensures consistent progress without burnout.',
    variables: [
      { name: 'AVAILABLE_DAILY_MINUTES', description: 'Daily focused time', example: '45' },
      { name: 'PRIMARY_GOAL', description: 'Goal for the month', example: 'Land a Summer 2026 Software Engineer Internship' },
    ],
    promptTemplate: `Act as an executive performance coach for computer science students.
I have {AVAILABLE_DAILY_MINUTES} minutes of focused study time per day.
My primary goal: {PRIMARY_GOAL}.

Create a 5-item daily checklist (todo list) that balances:
1. 1 quick diagnostic check on a weak skill (10 mins)
2. 1 incremental push on a standout strong-skill project (20 mins)
3. 1 career asset polish (resume bullet, LinkedIn interaction, or outreach) (10 mins)
4. 1 comfort-zone breaking probe (5 mins)
5. A streak checkpoint reflection rule to protect psychological momentum.

Include an emergency "Streak Freeze" rule for days when university midterms or exams hit.`,
  },
];
