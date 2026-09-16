import { SkillTutorChallenge } from '../types';

export const SKILL_TUTOR_CHALLENGES: SkillTutorChallenge[] = [
  {
    id: 'tutor_challenge_1',
    title: 'Two Pointers vs Hash Map in Continuous Sorted Streams',
    topic: 'Algorithmic Invariants & Pointers',
    difficulty: 'Conceptual Foundational',
    relatedRole: 'Software Engineer Intern',
    conceptualScenario:
      'You are given an infinite or high-throughput ordered stream of numeric sensor readings and need to find pairs that sum to a calibrated baseline T. Storing a growing hash table introduces unbounded O(N) memory overhead and garbage-collection spikes.',
    promptQuestion:
      'Explain conceptually why a two-pointer convergent invariant works on sorted inputs with O(1) auxiliary space. Describe the exact invariant logic: why can the left pointer only move right, and why can the right pointer only move left without missing any valid pair?',
    keyPrinciples: [
      'Monotonicity of ordered sums',
      'Exclusion principle (why crossed-out pairs are guaranteed impossible)',
      'O(1) memory bound vs O(N) hash overhead',
    ],
    exampleThoughtPrompt:
      'Begin by addressing what happens if sum(L, R) > T. Which element must be discarded, and why is testing any pair containing that discarded element mathematically redundant?',
  },
  {
    id: 'tutor_challenge_2',
    title: 'Sliding Window Maximum & Monotonic Queue Invariant',
    topic: 'Data Structures & Big-O',
    difficulty: 'Intermediate Architecture',
    relatedRole: 'Backend Engineer',
    conceptualScenario:
      'A financial telemetry pipeline processes stock ticks in a sliding window of size K. Computing the maximum in each window using a naive scan requires O(K) work per tick, which chokes the event loop during market open spikes.',
    promptQuestion:
      'How does maintaining a monotonically decreasing double-ended queue achieve amortized O(1) time per sliding step? Conceptually explain why older elements that are smaller than a newly arrived element are completely obsolete and can be evicted immediately.',
    keyPrinciples: [
      'Amortized analysis (each element added and evicted at most once)',
      'Monotonic invariant property',
      'Window expiration versus value obsolescence',
    ],
    exampleThoughtPrompt:
      'If element A entered before element B, and A < B, can element A ever be the maximum in any future window that contains B?',
  },
  {
    id: 'tutor_challenge_3',
    title: 'Composite SQL Index Ordering: Equality vs Range Filtering',
    topic: 'Database Internals & SQL',
    difficulty: 'Intermediate Architecture',
    relatedRole: 'Full Stack & Database Engineer',
    conceptualScenario:
      'A high-traffic marketplace query filters active listings by status (e.g. `status = "ACTIVE"`) and date range (`created_at >= "2025-01-01"`), sorted by `created_at DESC`. The team is debating whether a composite B-Tree index on `(created_at, status)` or `(status, created_at)` is superior.',
    promptQuestion:
      'Explain using B-Tree traversal mechanics why the order of columns in a composite index is critical. Why does placing the range-filtered column BEFORE the equality-filtered column destroy the index scan efficiency for subsequent columns?',
    keyPrinciples: [
      'Leftmost prefix matching in B-Trees',
      'Range predicates terminating composite scan equality',
      'Index-only scans and avoidance of file sorts',
    ],
    exampleThoughtPrompt:
      'Visualize how telephone directory listings are organized by (LastName, FirstName). What happens if you search for everyone whose last name starts between C and M and whose first name is John?',
  },
  {
    id: 'tutor_challenge_4',
    title: 'Rate Limiter Architecture: Token Bucket vs Sliding Window Log',
    topic: 'System Design & High Scale',
    difficulty: 'Advanced Trade-offs',
    relatedRole: 'Infrastructure & Cloud Engineer',
    conceptualScenario:
      'An API gateway protects microservices from sudden traffic bursts. You must choose between a Token Bucket algorithm and a Sliding Window Log in Redis. Memory consumption is a strict constraint because you track 5 million distinct API keys.',
    promptQuestion:
      'Compare the memory footprint and accuracy trade-offs of Token Bucket versus Sliding Window Log. Why does Token Bucket require only O(1) storage per client regardless of request volume, while Sliding Window Log scales with traffic density?',
    keyPrinciples: [
      'Refill rate computation via timestamp difference without background timers',
      'Memory amplification under burst traffic',
      'Smooth vs strictly hard bounded rate limits',
    ],
    exampleThoughtPrompt:
      'Instead of recording every timestamp in a sorted set, how does storing only `last_refill_time` and `current_token_count` reconstruct current capacity upon each incoming request?',
  },
  {
    id: 'tutor_challenge_5',
    title: 'Cache Invalidation & Race Conditions: Cache-Aside vs Write-Through',
    topic: 'Distributed Systems & Concurrency',
    difficulty: 'Advanced Trade-offs',
    relatedRole: 'Senior Software Engineer Candidate',
    conceptualScenario:
      'Under heavy concurrent read and write operations, developers notice stale data lingering in Redis even after a database row was updated. The code was using "Update DB, then Update Cache".',
    promptQuestion:
      'Explain the race condition that occurs when two concurrent writes update the DB and the cache simultaneously. Why is "Update DB, then Delete (Evict) Cache" statistically much safer than trying to update cache values in-place?',
    keyPrinciples: [
      'Concurrent interleaving of DB commit and cache writes',
      'Cache eviction vs in-place cache mutation',
      'Eventual consistency and time-to-live (TTL) safety nets',
    ],
    exampleThoughtPrompt:
      'Trace two concurrent threads (Thread A and Thread B) writing different values: what happens if Thread A updates the DB first, but Thread B updates the cache first?',
  },
];
