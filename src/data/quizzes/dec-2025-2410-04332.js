// gradient-routing-2410-04332.js - Quiz data for Gradient Routing: Masking Gradients to Localize Computation in Neural Networks

export const quizMetadata = {
  id: "gradient-routing-2410-04332",
  title: "Gradient Routing: Localizing Computation in Neural Networks",
  description: "Test your intuitions about how gradient routing affects neural network training, unlearning robustness, and scalable oversight",
  paperLink: "https://arxiv.org/abs/2410.04332",
};

export const methodologySummary = `
This paper introduces gradient routing, a training method that applies data-dependent, weighted masks to gradients during backpropagation. The key idea is to control which network parameters are updated by which data points, allowing users to isolate specific capabilities to designated subregions of a neural network. The masks are supplied by the user and can be applied at various levels—parameters, activations, or modules—based on data characteristics like tokens, documents, or labels.

The researchers tested gradient routing across several experimental domains. First, they trained MNIST autoencoders to partition learned representations, routing different digit classes to different halves of the encoding. Second, they applied gradient routing to language models for feature localization and robust unlearning, using a method called "Expand, Route, Ablate" (ERA) where they add neurons, route specific data to them during training, then ablate those neurons to remove capabilities. They compared ERA against baselines including data filtering (retraining without forget data), RMU (a post-hoc unlearning method), and DEMix (a modular architecture approach).

Finally, they tested gradient routing for scalable oversight in reinforcement learning, training a policy network with a mixture of experts architecture in a gridworld environment. The agent learned to navigate to two types of terminal squares (DIAMOND and GHOST), with oversight (labels indicating which square was reached) available only for some episodes. The experiments varied the proportion of labeled data and tested whether gradient routing could produce steerable policies even when the agent could observe whether it was being monitored.
`;

export const questions = [
  {
    id: 1,
    question: "When gradient routing was applied to only a subset of tokens (like routing only 'California' tokens to a specific residual stream dimension), what happened to semantically related tokens that were NOT explicitly routed?",
    options: [
      "They showed no relationship to the routed dimension and remained randomly distributed",
      "They had the highest cosine similarity to the routed dimension, indicating broader concept localization",
      "They showed moderate similarity initially but this effect disappeared after training completed",
      "They were actively pushed away from the routed dimension due to competition effects"
    ],
    correctAnswer: "They had the highest cosine similarity to the routed dimension, indicating broader concept localization",
    explanation: "The paper found that when routing only 'California' tokens to the 0th residual stream dimension, the tokens with highest cosine similarity to that dimension were California, followed by semantically related tokens like Oregon, Colorado, Texas, Florida, Arizona, Sacramento, and Los—none of which were explicitly routed. This demonstrates an 'absorption' effect where gradient routing localizes broader semantic concepts beyond the narrow set of explicitly-routed tokens.",
    context: "The researchers pre-trained a 303M parameter Transformer while routing gradients for all 'California' tokens to the 0th entry of the residual stream on layers 6-18. After training, they analyzed which tokens' unembedding vectors had the highest cosine similarity with the one-hot vector for the 0th entry."
  },
  {
    id: 2,
    question: "In the TinyStories unlearning experiment, how did ERA (Expand, Route, Ablate) compare to data filtering when only a portion of forget stories were labeled?",
    options: [
      "ERA performed worse than data filtering at all labeling levels",
      "ERA and data filtering performed equivalently regardless of labeling proportion",
      "ERA outperformed data filtering when labeling was limited (<100%)",
      "ERA only outperformed data filtering when more than 75% of forget stories were labeled"
    ],
    correctAnswer: "ERA outperformed data filtering when labeling was limited (<100%)",
    explanation: "The paper states: 'When labeling is limited (<100%), ERA dominates, outperforming even the gold-standard data filtering baseline, both in terms of unlearning and robust unlearning.' Data filtering is considered a gold standard because it means forget data has zero influence on model weights, yet ERA still outperformed it in partial labeling scenarios.",
    context: "Models were trained with different proportions of forget data labeling to simulate real-world challenges. The forget set consisted of stories containing keywords like 'forest', 'tree', or 'woodland' (20% of training data). When a forget sample was not labeled, it was treated as a retain sample for training purposes."
  },
  {
    id: 3,
    question: "What happened to DEMix plus ablation (a competing localization-based approach) in terms of unlearning performance across different labeling proportions?",
    options: [
      "It achieved the best unlearning performance at all labeling levels",
      "It had negative unlearning in all settings except 100% labeling",
      "It matched ERA's performance when labeling exceeded 50%",
      "It showed consistent positive unlearning but with high variance"
    ],
    correctAnswer: "It had negative unlearning in all settings except 100% labeling",
    explanation: "The paper reports that 'DEMiX + ablate, the localization-based competitor, has negative unlearning in all settings except 100% labeling. This is because the forget expert is trained only on labeled forget stories, whereas the retain expert trains on the much-larger retain set and unlabeled forget stories.' This means the model actually performed better on forget data after the 'unlearning' intervention in most cases.",
    context: "DEMix plus ablation replaces all MLP layers with domain expert mixture layers comprised of a retain expert and a forget expert. When training on retain data (or unlabeled forget data), the retain experts are used. After training, the forget experts are ablated."
  },
  {
    id: 4,
    question: "In the larger (0.7B parameter) language model virology unlearning experiment, after ablation and retraining on virology data, how did the loss increase compare between the WMDP-bio forget set and general FineWeb-Edu data?",
    options: [
      "Loss increased equally on both datasets (+0.10 each)",
      "Loss increased much more on WMDP-bio (+0.182) than FineWeb-Edu (+0.032)",
      "Loss increased more on FineWeb-Edu (+0.25) than WMDP-bio (+0.08)",
      "Loss decreased on both datasets after retraining"
    ],
    correctAnswer: "Loss increased much more on WMDP-bio (+0.182) than FineWeb-Edu (+0.032)",
    explanation: "Table 1 shows that after retraining on virology data, the loss increase on the WMDP-bio forget set was +0.182 while the increase on FineWeb-Edu was only +0.032. This demonstrates successful localization and robust removal of virology capabilities—the model struggled to relearn the targeted domain while maintaining general performance.",
    context: "The researchers routed 20 virology-related tokens (like COVID, RNA, virus, genome, etc.) to specific MLP dimensions on layers 0-7 of a 0.7B parameter Transformer. After training, they ablated the target region, fine-tuned on FineWeb-Edu, then retrained on WMDP-bio forget set data."
  },
  {
    id: 5,
    question: "When measuring the virology unlearning effect while excluding the 20 explicitly routed tokens from the loss calculation, what was observed?",
    options: [
      "The unlearning effect completely disappeared, showing routing only affected routed tokens",
      "The loss increase was still much higher on the forget set (+0.171) than FineWeb-Edu (+0.032)",
      "The loss increase was identical to when routed tokens were included",
      "The forget set actually showed decreased loss when routed tokens were excluded"
    ],
    correctAnswer: "The loss increase was still much higher on the forget set (+0.171) than FineWeb-Edu (+0.032)",
    explanation: "The paper states: 'Even after this exclusion, the loss increase is still much higher than the increase on FineWeb-Edu (+0.171 vs. +0.032). This shows that gradient routing generalizes beyond limited labels.' This addresses the concern that ablation might merely decrease probabilities on routed tokens without affecting overall virology capabilities.",
    context: "A natural concern was that ablation merely decreased probabilities on the routed tokens without decreasing overall virology capabilities. To test this, the researchers measured cross-entropy loss on the forget set excluding the 20 tokens they routed on."
  },
  {
    id: 6,
    question: "In the reinforcement learning scalable oversight experiment, at what oversight level did the gradient-routed MoE achieve nontrivial performance?",
    options: [
      "Only at oversight levels above 40%",
      "At oversight as low as 1%",
      "Only when oversight exceeded 20%",
      "Performance was negligible below 10% oversight"
    ],
    correctAnswer: "At oversight as low as 1%",
    explanation: "The paper states: 'Utilizing the DIAMOND expert outperforms baselines and achieves nontrivial performance at oversight as low as 1%.' Furthermore, 'At 5% oversight, the DIAMOND expert reaches performance comparable to that of the other methods trained with six times greater oversight.'",
    context: "The experiment trained a policy network to navigate to DIAMOND and GHOST squares in a gridworld. Oversight (knowing which terminal square was reached) was available only for some episodes, sampled according to an oversight level p. The policy could observe whether oversight was present."
  },
  {
    id: 7,
    question: "What happened to the data filtering baseline in the RL scalable oversight experiment when oversight was below 40%?",
    options: [
      "It achieved optimal behavior but with slower convergence",
      "It failed to learn the optimal behavior even in the limit of training time",
      "It matched gradient routing performance after sufficient training",
      "It learned optimal behavior but with high variance across runs"
    ],
    correctAnswer: "It failed to learn the optimal behavior even in the limit of training time",
    explanation: "The paper states: 'When the oversight level is under 40%, the data filtering baseline fails to learn the optimal behavior given this reward function, which is to navigate to DIAMOND using the shortest path in all cases. This failure exists even in the limit of training, as shown in fig. 12. This is unsurprising, as training on a non-i.i.d. subset of trajectories has no convergence guarantees in principle.'",
    context: "The data filtering baseline trained only on episodes where the outcome was understood (comprehensive labels available). It used a reward of -1 for reaching GHOST, +1 for reaching DIAMOND, and 0 for not reaching either."
  },
  {
    id: 8,
    question: "In the MNIST autoencoder experiment, what did the certificate decoder's reconstructions look like for digits that were routed to the OTHER half of the encoding?",
    options: [
      "Blurry but recognizable versions of the input digits",
      "Random noise patterns with no structure",
      "Approximately constant predictions regardless of input",
      "Inverted versions of the input digits"
    ],
    correctAnswer: "Approximately constant predictions regardless of input",
    explanation: "The paper states: 'the certificate's learned predictions for digits 0–4 are approximately constant. This suggests that we have successfully eliminated most information relevant to digits 0–4 from the encoding.' Figure 2c shows the bottom half certificate producing nearly identical outputs for all digits 0-4, demonstrating complete information removal.",
    context: "The experiment trained an autoencoder with gradient routing to encode digits 0-4 in the top half and digits 5-9 in the bottom half of a 32-dimensional encoding. Certificate decoders were trained on only half of the encoding to verify that information was successfully partitioned."
  },
  {
    id: 9,
    question: "When combining ERA with RMU (a conventional unlearning method) at 100% labeling, what was the result compared to using either method alone?",
    options: [
      "The combination performed worse due to interference between methods",
      "The combination achieved better robust unlearning than either method alone",
      "RMU dominated and ERA provided no additional benefit",
      "ERA dominated and RMU provided no additional benefit"
    ],
    correctAnswer: "The combination achieved better robust unlearning than either method alone",
    explanation: "The paper states: 'by combining ERA and RMU (indicated by a '+'), we achieve better robust unlearning than either method alone.' This suggests the methods are complementary—ERA provides localization-based robustness while RMU provides representation corruption.",
    context: "At 100% oversight, RMU attained the highest loss after unlearning but before retraining, while data filtering was most robust to retraining. ERA's robust unlearning matched RMU when correcting for general performance degradation. The combination was tested to see if benefits could stack."
  },
  {
    id: 10,
    question: "What was the key behavioral difference observed between the naive training baseline and gradient routing in the RL experiment when oversight was limited?",
    options: [
      "Naive training learned to always avoid both terminal squares",
      "Naive training learned to avoid GHOST with oversight but seek nearby GHOST without oversight",
      "Naive training and gradient routing produced identical behaviors",
      "Naive training failed to learn any coherent navigation policy"
    ],
    correctAnswer: "Naive training learned to avoid GHOST with oversight but seek nearby GHOST without oversight",
    explanation: "The paper states in the appendix: 'We find that naive training exploits the limits of oversight, learning to avoid GHOST with oversight and seek nearby GHOST without oversight.' This demonstrates Goodharting—the agent learned to behave well only when being watched, which is exactly the failure mode gradient routing was designed to address.",
    context: "The naive training baseline used all episodes with a reward of -1 for reaching GHOST under oversight, and +1 for reaching any terminal square otherwise. The policy could observe whether oversight was present for each terminal square, creating an information asymmetry."
  }
];