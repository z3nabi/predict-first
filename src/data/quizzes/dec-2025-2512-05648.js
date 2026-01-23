// dec-2025-2512-05648.js - Quiz data for Beyond Data Filtering: Knowledge Localization for Capability Removal in LLMs

export const quizMetadata = {
  id: "dec-2025-2512-05648",
  title: "Knowledge Localization for Capability Removal in LLMs",
  description: "Test your intuitions about how gradient masking techniques compare to data filtering for removing dangerous capabilities from language models",
  paperLink: "https://arxiv.org/abs/2512.05648",
};

export const methodologySummary = `
This paper investigates Selective Gradient Masking (SGTM), a pretraining-time technique for localizing specific knowledge into designated model parameters so it can later be removed. The core idea is to assign certain MLP neurons and attention heads as "forget" parameters, then during training, zero-mask gradients so that examples from the target domain (e.g., biology knowledge) only update these dedicated parameters. After training, the forget parameters are set to zero to remove the targeted capability.

The researchers test SGTM in two experimental setups. First, they train models on a bilingual TinyStories dataset (English and Spanish) with the goal of removing Spanish language capability while retaining English. They artificially vary the "undiscovered forget percentage" - the fraction of Spanish data that is mislabeled as non-Spanish - to simulate realistic labeling errors. Second, they train a 254M parameter model on English Wikipedia, targeting biology knowledge for removal while preserving general knowledge and biology-adjacent domains like medicine and chemistry.

The experiments compare SGTM against data filtering baselines (removing labeled harmful content before training) and a prior Gradient Routing method. Key metrics include retain loss (performance on knowledge to keep), forget loss (higher is better for removed knowledge), robustness to label noise, information leakage from mislabeled samples, and resistance to adversarial fine-tuning that attempts to recover the removed knowledge.
`;

export const questions = [
  {
    id: 1,
    question: "When comparing SGTM to data filtering with 1% mislabeling (99% of forget data correctly filtered), how did SGTM perform on the retain/forget trade-off?",
    options: [
      "SGTM performed worse than 99% filtering on both retain and forget metrics",
      "SGTM achieved higher forget loss at any fixed retain loss value, closely approximating perfect filtering",
      "SGTM matched 99% filtering exactly, showing no advantage from the gradient masking approach",
      "SGTM achieved better retain loss but substantially worse forget loss than 99% filtering"
    ],
    correctAnswer: "SGTM achieved higher forget loss at any fixed retain loss value, closely approximating perfect filtering",
    explanation: "Figure 4(a) shows that SGTM provides a better trade-off than 99% data filtering - achieving higher forget loss at any fixed value of retain loss. The paper states SGTM 'closely approximates forgetting performance of the perfect filter, with almost equivalent forget loss at the end of training.'",
    context: "The researchers compared SGTM against data filtering on a bilingual TinyStories task where 1% of Spanish (forget) data was mislabeled as non-Spanish. They tracked both retain loss (English) and forget loss (Spanish) throughout training to assess the trade-off between preserving general capabilities and removing target knowledge."
  },
  {
    id: 2,
    question: "How did information leakage from undiscovered forget samples change as model size increased from 8M to 64M parameters?",
    options: [
      "Leakage increased substantially with model size, from 0.02 at 8M to 0.15 at 64M parameters",
      "Leakage remained roughly constant across all model sizes, around 0.05-0.08",
      "Leakage decreased with model scale, with the 64M model maintaining leakage below 0.02 for up to 40% undiscovered forget data",
      "Leakage showed a U-shaped pattern, decreasing from 8M to 34M then increasing at 64M"
    ],
    correctAnswer: "Leakage decreased with model scale, with the 64M model maintaining leakage below 0.02 for up to 40% undiscovered forget data",
    explanation: "Figure 5(b) shows a clear inverse relationship between model scale and leakage rates. The paper states: 'Larger models consistently exhibit lower leakage rates, with the 64M model maintaining leakage below 0.02 for up to 40% undiscovered forget data.' This suggests SGTM becomes more effective at larger scales.",
    context: "The researchers measured 'leakage' - how much information from mislabeled forget samples flows into non-forget parameters. They trained models ranging from 8M to 64M parameters with varying rates of undiscovered forget data, then compared the resulting forget loss to baseline models trained with known amounts of forget data."
  },
  {
    id: 3,
    question: "How many fine-tuning steps did SGTM require to recover baseline forget loss compared to RMU (a post-training unlearning method)?",
    options: [
      "SGTM required 50 steps while RMU required 350 steps, showing SGTM is more vulnerable",
      "Both methods required approximately 200 steps, showing similar robustness",
      "SGTM required 350 steps (92M tokens) while RMU required only 50 steps (13M tokens) - a 7× difference",
      "SGTM required 150 steps while RMU required 100 steps, a modest 1.5× improvement"
    ],
    correctAnswer: "SGTM required 350 steps (92M tokens) while RMU required only 50 steps (13M tokens) - a 7× difference",
    explanation: "Figure 6(a) shows RMU quickly recovering baseline forget loss within 50 steps (13M forget tokens), while SGTM required 350 steps (92M forget tokens). The paper explicitly states: 'It takes SGTM 7× more forget tokens in fine-tuning than RMU to achieve the baseline forget loss.'",
    context: "The researchers evaluated robustness to adversarial fine-tuning by performing full-parameter fine-tuning on a 50/50 mixture of forget and retain data after knowledge removal. They measured how quickly each method's forget loss recovered to the baseline level of a model trained without any filtering."
  },
  {
    id: 4,
    question: "When analyzing gradient norms to understand SGTM's self-reinforcing localization, what pattern emerged for unlabeled forget data?",
    options: [
      "Unlabeled forget data updated retain and forget parameters equally, showing no specialization",
      "Unlabeled forget data predominantly updated forget parameters, while retain data predominantly updated retain parameters",
      "Unlabeled forget data primarily updated retain parameters, undermining the localization mechanism",
      "Gradient norms were too noisy to detect any consistent pattern between parameter types"
    ],
    correctAnswer: "Unlabeled forget data predominantly updated forget parameters, while retain data predominantly updated retain parameters",
    explanation: "Figure 4(b) demonstrates clear specialization: 'Forget data predominantly updates forget parameters (top-left), while retain data predominantly updates retain parameters (top-right).' This confirms the 'absorption' mechanism where even unlabeled forget samples naturally gravitate toward using forget parameters.",
    context: "The researchers analyzed relative gradient norms (|∇θ|/|θ|) from a trained SGTM model to understand why the method remains robust to label noise. They compared per-sample gradient norms for forget and retain test examples, treating all samples as unlabeled without applying any masking during the analysis."
  },
  {
    id: 5,
    question: "What compute efficiency penalty did SGTM incur on general knowledge (Culture/Geography/History) compared to the no-filter baseline in the Wikipedia experiment?",
    options: [
      "SGTM showed a 25% compute penalty, requiring substantially more training to match baseline performance",
      "SGTM showed a 5% compute penalty, while data filtering methods showed negative penalties (-10% to -15%)",
      "SGTM showed no compute penalty, matching the baseline exactly",
      "SGTM showed a 15% compute improvement, outperforming the baseline due to better gradient utilization"
    ],
    correctAnswer: "SGTM showed a 5% compute penalty, while data filtering methods showed negative penalties (-10% to -15%)",
    explanation: "Figure 9 shows SGTM incurs a 5% compute penalty on general knowledge, while weak filtering shows -10% and strict filtering shows -15%. The negative values for filtering occur because 'filtering methods operate at a fixed compute budget, replacing removed biology and biology-adjacent data with additional general knowledge examples.'",
    context: "The researchers converted loss values to equivalent compute budgets using scaling laws fitted across multiple model sizes. This allows comparing methods in terms of how much additional training would be needed to achieve equivalent performance on a baseline model."
  },
  {
    id: 6,
    question: "How did SGTM's forget loss distribution compare to data filtering when examining per-token losses on the biology test set?",
    options: [
      "SGTM produced a heavy-tailed distribution with a small number of extreme outlier tokens causing high average loss",
      "SGTM shifted the distribution toward moderately higher loss values across tokens, indicating broad knowledge removal",
      "SGTM and data filtering produced nearly identical per-token loss distributions",
      "SGTM showed lower per-token losses than filtering, contradicting the aggregate loss metrics"
    ],
    correctAnswer: "SGTM shifted the distribution toward moderately higher loss values across tokens, indicating broad knowledge removal",
    explanation: "Figure 6(b) shows that 'SGTM shifts probability mass toward moderately higher loss values relative to baselines, increasing density around the upper-mid range rather than producing a heavy-tailed explosion of extreme outliers.' This confirms genuine knowledge removal rather than selective token failure.",
    context: "The researchers analyzed per-token loss distributions to verify that SGTM's higher aggregate forget loss reflects true capability removal rather than a few tokens with extremely high losses. This addresses the concern that aggregate loss metrics might obscure uneven behavior."
  },
  {
    id: 7,
    question: "On biology-adjacent knowledge (Medicine/Chemistry/Environment), how did SGTM compare to weak and strict data filtering?",
    options: [
      "SGTM performed worse than both filtering methods, showing the highest retain loss",
      "SGTM's retain loss fell between weak and strict filtering, while achieving higher forget loss than both",
      "SGTM matched weak filtering exactly on both retain and forget metrics",
      "SGTM achieved the lowest retain loss of all methods while matching strict filtering's forget loss"
    ],
    correctAnswer: "SGTM's retain loss fell between weak and strict filtering, while achieving higher forget loss than both",
    explanation: "The paper states: 'the final retain loss for SGTM lies between weak and strong data filters, while SGTM's forget loss is higher than both weak and strong filters. This shows that SGTM retained some non-biology knowledge from Medicine/Chemistry/Environment domains (removed by the strict filter), while learning less biology from it than the weak filter.'",
    context: "The Wikipedia experiment evaluated performance on biology-adjacent domains that share knowledge with the target biology category. Strict filtering removes these related categories entirely, while weak filtering only removes biology-labeled articles."
  },
  {
    id: 8,
    question: "How did the original Gradient Routing method (Cloud et al., 2024) compare to SGTM on the bilingual TinyStories task?",
    options: [
      "Gradient Routing achieved better retain loss but worse forget loss than SGTM",
      "SGTM Pareto-dominated Gradient Routing, achieving both lower retain loss and higher forget loss across all discovery rates",
      "Both methods performed identically, as they use the same underlying mechanism",
      "Gradient Routing outperformed SGTM when more than 50% of forget data was correctly labeled"
    ],
    correctAnswer: "SGTM Pareto-dominated Gradient Routing, achieving both lower retain loss and higher forget loss across all discovery rates",
    explanation: "Figure 3 shows that 'SGTM consistently achieves lower retain loss than the Gradient Routing variant of Cloud et al. (2024), while maintaining higher forget loss – Pareto dominating prior Gradient Routing across all discovery rates tested.'",
    context: "The researchers compared SGTM to the original Gradient Routing method, which masks activation gradients rather than parameter gradients. Both methods aim to localize target knowledge to designated parameters, but differ in their masking approach and which layers are affected."
  },
  {
    id: 9,
    question: "When SGTM was configured with relaxed gradient masking (joint embeddings), what happened to pre-ablation and post-ablation performance?",
    options: [
      "Both pre-ablation and post-ablation performance degraded substantially",
      "Pre-ablation biology performance improved dramatically (30% vs 85% compute penalty) while post-ablation forgetting remained strong (88% penalty)",
      "Pre-ablation performance improved but post-ablation forgetting failed completely",
      "The relaxed configuration showed no meaningful difference from the default SGTM settings"
    ],
    correctAnswer: "Pre-ablation biology performance improved dramatically (30% vs 85% compute penalty) while post-ablation forgetting remained strong (88% penalty)",
    explanation: "Figure 10 shows the joint embeddings configuration achieved 30% compute penalty on biology pre-ablation (vs 85% for default SGTM), while post-ablation it still achieved 88% compute penalty on biology forgetting. This enables a 'dual-model' deployment where the pre-ablation model retains target capabilities.",
    context: "The researchers explored whether SGTM could support dual-model deployment: a capable pre-ablation model and a safe post-ablation model from a single training run. They tested configurations with varying degrees of gradient masking strictness."
  },
  {
    id: 10,
    question: "At what rate of undiscovered forget data did data filtering's forget loss begin to drop sharply compared to SGTM?",
    options: [
      "Data filtering maintained high forget loss until 50% undiscovered, then dropped sharply",
      "Data filtering's forget loss dropped quickly when even a few (1-10%) forget samples were not filtered out",
      "Both methods showed similar gradual decline in forget loss as undiscovered rate increased",
      "Data filtering actually improved forget loss as more samples were undiscovered due to regularization effects"
    ],
    correctAnswer: "Data filtering's forget loss dropped quickly when even a few (1-10%) forget samples were not filtered out",
    explanation: "Figure 3(b) shows that 'For data filtering, forget loss drops quickly when even a few forget samples are not filtered out.' In contrast, 'Both knowledge localization methods (SGTM and Gradient Routing) show slower decline in forget loss compared to data filtering as the rate of undiscovered forget data increases.'",
    context: "The researchers varied the 'undiscovered forget percentage' - the fraction of forget data mislabeled as non-forget - from 0% to 100% to simulate realistic labeling errors. This tests each method's robustness to imperfect data classification."
  }
];