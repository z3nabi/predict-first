// dec-2025-2512-09882.js - Quiz data for AI Agents vs Cybersecurity Professionals in Penetration Testing

export const quizMetadata = {
  id: "dec-2025-2512-09882",
  title: "AI Agents vs Cybersecurity Professionals in Real-World Penetration Testing",
  description: "Test your intuitions about how AI agents compare to human cybersecurity professionals when conducting penetration tests on live enterprise networks",
  paperLink: "https://arxiv.org/abs/2512.09882",
};

export const methodologySummary = `
This study presents the first comprehensive comparison between AI agents and human cybersecurity professionals conducting penetration testing on a live enterprise environment. The researchers evaluated 10 cybersecurity professionals alongside multiple AI agent frameworks, including their novel multi-agent system called ARTEMIS, on a large university network consisting of approximately 8,000 hosts across 12 subnets. The target environment was heterogeneous, containing Unix-based systems, IoT devices, Windows machines, and embedded systems.

Human participants were recruited based on professional qualifications including industry certifications (such as OSCP, CRTO, and others) and prior CVE discoveries. Each participant was compensated $2,000 and asked to commit at least 10 working hours to the engagement. They were provided with standardized Kali Linux virtual machines and given student-level network credentials. AI agents tested included existing frameworks like OpenAI's Codex, CyAgent, Claude Code, Incalmo, and MAPTA, as well as two configurations of ARTEMIS (one using GPT-5 throughout, another using an ensemble of models).

The researchers developed a unified scoring framework that combined technical complexity scores (detection and exploit complexity) with business impact weighting based on vulnerability severity. Vulnerabilities were categorized from Informational to Critical, with higher severity findings receiving disproportionately higher scores to mirror industry bug bounty structures. The study tracked metrics including total valid findings, false positive rates, submission quality, and operational costs.
`;

export const questions = [
  {
    id: 1,
    question: "How did the best-performing ARTEMIS configuration rank compared to the 10 human cybersecurity professionals on the overall leaderboard?",
    options: [
      "First place, outperforming all human participants",
      "Second place, outperforming 9 of 10 human participants",
      "Fifth place, performing at the median of human participants",
      "Last place, underperforming all human participants"
    ],
    correctAnswer: "Second place, outperforming 9 of 10 human participants",
    explanation: "ARTEMIS placed second overall on the leaderboard, discovering 9 valid vulnerabilities with an 82% valid submission rate and outperforming 9 of 10 human participants. Only participant P1 scored higher with a total score of 111.4 compared to ARTEMIS's 95.2.",
    context: "The study ranked all participants (human and AI) using a unified scoring metric that combined technical complexity scores with business impact weighting. Scores were calculated based on the detection complexity, exploit complexity, and severity of discovered vulnerabilities."
  },
  {
    id: 2,
    question: "What was the valid submission rate (percentage of submissions that were actual vulnerabilities) for the best-performing ARTEMIS configuration compared to the top human performers?",
    options: [
      "ARTEMIS had 95% validity while top humans had around 75%",
      "ARTEMIS had 82% validity while several top humans achieved 100%",
      "ARTEMIS had 55% validity while top humans had around 80%",
      "ARTEMIS had 100% validity, matching the top human performers"
    ],
    correctAnswer: "ARTEMIS had 82% validity while several top humans achieved 100%",
    explanation: "The best ARTEMIS configuration (A2) achieved an 82% valid submission rate, while participants P1, P2, P4, P5, P3, P8, P10, and P7 all achieved 100% validity on their submissions. This indicates that ARTEMIS submitted more false positives than the top human performers.",
    context: "Submissions were validated by the research team working with IT staff to determine whether reported vulnerabilities were genuine security issues. Invalid submissions included false positives, duplicates, and out-of-scope findings."
  },
  {
    id: 3,
    question: "How did existing agent scaffolds like Codex and CyAgent perform compared to human participants?",
    options: [
      "They outperformed most human participants, placing in the top 5",
      "They performed comparably to the median human participant",
      "They underperformed relative to most human participants, with some frameworks producing zero findings",
      "They matched the performance of the top human participant"
    ],
    correctAnswer: "They underperformed relative to most human participants, with some frameworks producing zero findings",
    explanation: "Existing scaffolds significantly underperformed. Claude Code and MAPTA refused the task entirely, producing 0 findings. Incalmo stalled at early reconnaissance due to its rigid task graph, also resulting in 0 findings. Codex with GPT-5 and CyAgent with various models scored in the bottom portion of the leaderboard, with CyAgent using GPT-5 being outperformed by all other participants.",
    context: "The study compared ARTEMIS against multiple existing AI agent frameworks including OpenAI's Codex, Claude Code, CyAgent, Incalmo, and MAPTA. All agents were given the same instructions and operated on identical virtual machines as human participants."
  },
  {
    id: 4,
    question: "What was the hourly operational cost of the cheaper ARTEMIS configuration compared to the average cost of professional penetration testers?",
    options: [
      "$45/hour for ARTEMIS vs $60/hour for professionals",
      "$18/hour for ARTEMIS vs $60/hour for professionals",
      "$60/hour for ARTEMIS vs $125/hour for professionals",
      "$5/hour for ARTEMIS vs $30/hour for professionals"
    ],
    correctAnswer: "$18/hour for ARTEMIS vs $60/hour for professionals",
    explanation: "The A1 ARTEMIS configuration (using GPT-5 throughout) cost $291.47 for 16 hours of operation, which equals $18.21/hour or approximately $37,876 annualized at 40 hours/week. The paper notes that professional penetration testers earn an average of $125,034/year, and the $60/hour figure represents typical professional rates.",
    context: "The researchers tracked API costs for each ARTEMIS configuration using dedicated API keys. They ran ARTEMIS for 16 hours total (8 hours across two working days) to understand long-horizon performance and cost characteristics."
  },
  {
    id: 5,
    question: "What percentage of human participants found a remote code execution vulnerability accessible via TinyPilot (a KVM device), and how did ARTEMIS perform on this same vulnerability?",
    options: [
      "20% of humans found it; ARTEMIS found it immediately without hints",
      "80% of humans found it; ARTEMIS struggled and only found it with medium or high-level hints",
      "50% of humans found it; ARTEMIS found it without any hints",
      "100% of humans found it; ARTEMIS also found it without hints"
    ],
    correctAnswer: "80% of humans found it; ARTEMIS struggled and only found it with medium or high-level hints",
    explanation: "While 80% of human participants found the remote code execution vulnerability on Windows machines accessible via TinyPilot, ARTEMIS struggled with the GUI-based interaction required. In elicitation trials, ARTEMIS only found this RCE under medium and high-hint conditions, failing at lower hint levels. Instead of finding the critical RCE, ARTEMIS found and submitted lower-severity misconfigurations like CORS wildcards and cookie flags.",
    context: "TinyPilot is a KVM (keyboard-video-mouse) device that provides remote access to machines. The vulnerability allowed unauthenticated remote console access to Windows systems. The researchers conducted elicitation trials where they gave ARTEMIS varying levels of hints about specific vulnerabilities to test whether the agent was technically capable of finding them."
  },
  {
    id: 6,
    question: "How did ARTEMIS perform on a vulnerability in an older IDRAC server with an outdated HTTPS cipher suite that modern browsers refused to load?",
    options: [
      "ARTEMIS failed to find it, just like all human participants",
      "ARTEMIS found it using curl to bypass SSL verification, while no humans found it",
      "Both ARTEMIS and 60% of humans found this vulnerability",
      "ARTEMIS refused to test it due to the invalid SSL certificate"
    ],
    correctAnswer: "ARTEMIS found it using curl to bypass SSL verification, while no humans found it",
    explanation: "60% of human participants found a vulnerability in an IDRAC server with a modern web interface, but no humans found the same vulnerability in an older IDRAC server with an outdated HTTPS cipher suite that modern browsers refused to load. Both ARTEMIS configurations (A1 and A2) successfully exploited this older server using 'curl -k' to bypass SSL certificate verification, while humans gave up when their browsers failed to connect.",
    context: "IDRAC (Integrated Dell Remote Access Controller) servers provide out-of-band management for Dell servers. The study found that ARTEMIS's CLI-based approach could be advantageous in situations where GUI-based tools fail, as the agent parses code-like input and output well."
  },
  {
    id: 7,
    question: "How many concurrent sub-agents did ARTEMIS typically run during its penetration testing sessions?",
    options: [
      "Always exactly 1 sub-agent at a time",
      "An average of 2.82 concurrent sub-agents, with a peak of 8",
      "An average of 10-15 concurrent sub-agents, with a peak of 50",
      "No sub-agents; ARTEMIS used a single-agent architecture"
    ],
    correctAnswer: "An average of 2.82 concurrent sub-agents, with a peak of 8",
    explanation: "ARTEMIS reached a peak of 8 active sub-agents running in parallel, averaging 2.82 concurrent sub-agents per supervisor iteration. This parallelism is a key architectural feature that distinguishes ARTEMIS from human testers, who cannot probe multiple targets simultaneously.",
    context: "ARTEMIS uses a multi-agent architecture with a supervisor managing the workflow and spawning sub-agents for specific tasks. When the supervisor finds something noteworthy from a scan, it immediately launches a sub-agent to probe that target in the background."
  },
  {
    id: 8,
    question: "What was the distribution of vulnerability findings across participants - were most vulnerabilities found by many participants or by just one or two?",
    options: [
      "Most vulnerabilities were found by 7+ participants, showing high overlap",
      "Two specific vulnerabilities were found by most participants, but remaining findings were highly dispersed with most found by only one or two participants",
      "Each participant found completely unique vulnerabilities with zero overlap",
      "All participants found exactly the same set of vulnerabilities"
    ],
    correctAnswer: "Two specific vulnerabilities were found by most participants, but remaining findings were highly dispersed with most found by only one or two participants",
    explanation: "While two specific vulnerabilities were discovered by most of the participants, the remaining findings were highly dispersed. Most other vulnerabilities were found by only one or two participants, suggesting diverse approaches across the cohort as well as the substantial scope of the target environment.",
    context: "The human participant cohort discovered 49 total validated unique vulnerabilities, with the number of valid findings per participant ranging from 3 to 13. All participants discovered at least one critical vulnerability providing system or administrator-level access."
  },
  {
    id: 9,
    question: "How did the more expensive ARTEMIS configuration (A2, using an ensemble of models at $59/hour) compare to the cheaper configuration (A1, using GPT-5 at $18/hour) in terms of vulnerability count?",
    options: [
      "A2 found 3x more vulnerabilities than A1, justifying the higher cost",
      "Both configurations submitted the same number of vulnerabilities (11 each)",
      "A1 found significantly more vulnerabilities than A2",
      "A2 found no vulnerabilities due to model refusals"
    ],
    correctAnswer: "Both configurations submitted the same number of vulnerabilities (11 each)",
    explanation: "While both ARTEMIS variants submitted the same number of vulnerabilities (11 each), their performance differed significantly in terms of quality scores. A1 achieved a total score of 53.2 while A2 achieved 95.2, demonstrating gaps in cybersecurity knowledge between Claude Sonnet 4 (used in A2) and GPT-5 (used in A1). A1 achieved similar vulnerability counts at roughly a quarter the cost of A2.",
    context: "A1 used GPT-5 for both supervisor and sub-agents, while A2 used an ensemble of supervisor models (Claude Sonnet 4, OpenAI o3, Claude Opus 4, Gemini 2.5 Pro, and OpenAI o3 Pro) with Claude Sonnet 4 for sub-agents. Both ran for 16 hours total."
  },
  {
    id: 10,
    question: "When ARTEMIS was given specific hints about vulnerabilities that humans found but ARTEMIS missed, what did the elicitation trials reveal about ARTEMIS's capabilities?",
    options: [
      "ARTEMIS could not find any of the target vulnerabilities even with detailed hints",
      "All four tested vulnerabilities were found at least once with elicitation, suggesting bottlenecks lie in identifying vulnerability patterns rather than technical execution",
      "ARTEMIS found all vulnerabilities without any hints, showing the original runs were just unlucky",
      "ARTEMIS required nation-state level hints to find even basic vulnerabilities"
    ],
    correctAnswer: "All four tested vulnerabilities were found at least once with elicitation, suggesting bottlenecks lie in identifying vulnerability patterns rather than technical execution",
    explanation: "The researchers tested four vulnerabilities (Email Spoofing, SQL Injection, Stored XSS, and Unauthenticated Remote Console) with five hint levels. All four vulnerabilities were found at least once with elicitation, suggesting ARTEMIS's bottlenecks lie in identifying vulnerability patterns rather than technical execution. More submissions correlated with failing to find the target—likely because ARTEMIS moves on after finding other vulnerabilities on a host.",
    context: "The elicitation trials gave ARTEMIS varying levels of hints (high, medium, low, informational only, host only) with a two-hour maximum per level. This tested whether the agent was technically capable of finding specific vulnerabilities that humans discovered but ARTEMIS missed in the main evaluation."
  }
];