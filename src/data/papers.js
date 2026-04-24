export const papers = [
  {
    id: '01',
    category: 'Memory & retention',
    title: 'Ebbinghaus Forgetting Curve',
    authorLine: 'Hermann Ebbinghaus · 1885 · Replicated 2015 (PLOS ONE)',
    description: 'Ebbinghaus tested himself memorising lists of nonsense words and found that without any review, humans forget roughly half of new information within 24 hours and about 80% within a week. He discovered that reviewing information at the right moment — just before you forget it — permanently extends how long you remember it.',
    implementation: 'We use this to calculate when each concept should appear again for review. The forgetting curve is the foundation of our entire spaced repetition engine.',
    links: [
      { text: 'Full text', url: 'https://psychclassics.yorku.ca/Ebbinghaus/index.htm' },
      { text: 'Replication PDF', url: 'https://journals.plos.org/plosone/article?id=10.1371/journal.pone.0120644' }
    ]
  },
  {
    id: '02',
    category: 'Memory & retention',
    title: 'Half-Life Regression',
    authorLine: 'Settles & Meeder · Duolingo Research · 2016 · ACL Anthology',
    description: 'Researchers at Duolingo found that every word or concept a student learns has its own personal half-life — the number of days before they forget 50% of it. The half-life updates after every attempt: get it right and the half-life doubles, get it wrong and it resets to one day.',
    implementation: 'This is the exact formula we use in our spaced repetition engine to calculate when each concept\'s review reminder is scheduled.',
    links: [
      { text: 'PDF', url: 'https://research.duolingo.com/papers/settles.acl16.pdf' },
      { text: 'ACL page', url: 'https://aclanthology.org/P16-1174/' },
      { text: 'GitHub', url: 'https://github.com/duolingo/halflife-regression' }
    ]
  },
  {
    id: '03',
    category: 'Assessment',
    title: 'Test-Enhanced Learning',
    authorLine: 'Roediger & Karpicke · 2006 · Journal of Memory and Language',
    description: 'Students who were tested during learning scored dramatically higher one week later compared to students who simply re-read the same material. The act of retrieving information from memory is not just a way to check learning — it IS the learning.',
    implementation: 'This is why Gurukul AI asks you questions during the teaching phase, not only at the end. Active retrieval is built into every session.',
    links: [
      { text: 'Free PDF', url: 'https://learninglab.psych.purdue.edu/downloads/2007/2007_Karpicke_Roediger_JML.pdf' },
      { text: 'PubMed', url: 'https://pubmed.ncbi.nlm.nih.gov/16507066/' }
    ]
  },
  {
    id: '04',
    category: 'Assessment',
    title: 'Bloom\'s Taxonomy of Educational Objectives',
    authorLine: 'Bloom et al. · 1956 · US Dept. of Education',
    description: 'Bloom categorised learning into six levels: remembering a fact, understanding it, applying it, analysing it, evaluating it, and creating something new with it. Most school tests only reach Level 1 and 2. Genuine understanding means reaching at least Level 3.',
    implementation: 'We use this to decide what type of question to ask at each stage and to track how deeply you have understood each concept before marking it mastered.',
    links: [
      { text: 'Free PDF', url: 'https://ies.ed.gov/ncee/rel/regions/northeast/onlinetraining/ResourcesTools/Bloom\'s%20Taxonomy.pdf' }
    ]
  },
  {
    id: '05',
    category: 'Cognition & load',
    title: 'Cognitive Load Theory & Worked Example Effect',
    authorLine: 'Sweller · 1988 · Cognitive Science',
    description: 'Human working memory can only hold about 4 items at once. When a beginner solves a problem from scratch, all working memory is spent finding the answer, leaving nothing available for actual learning. Showing a fully worked-out example first uses far less working memory and produces much better results.',
    implementation: 'Gurukul AI always shows you a fully solved example before asking you to answer any questions — especially for new or difficult concepts.',
    links: [
      { text: 'Free PDF', url: 'https://andymatuschak.org/files/papers/Sweller%20-%201988%20-%20Cognitive%20load%20during%20problem%20solving.pdf' }
    ]
  },
  {
    id: '06',
    category: 'Cognition & load',
    title: 'Conceptual Change Theory',
    authorLine: 'Posner, Strike, Hewson & Gertzog · 1982 · Science Education',
    description: 'You cannot fix a misconception by simply telling a student the correct fact. The student nods and then continues to believe the wrong thing. For genuine change, the student must first see their current belief fail a prediction, then find the correct idea understandable, plausible, and useful.',
    implementation: 'Our three-step misconception correction protocol: first we surface your current belief, then show it failing a prediction, then introduce the correct concept.',
    links: [
      { text: 'Free PDF', url: 'https://faculty.weber.edu/eamsel/Classes/Practicum/TA%20Practicum/papers/Posner%20et%20al.%20(1982).PDF' }
    ]
  },
  {
    id: '07',
    category: 'Assessment',
    title: 'Inside the Black Box: Formative Assessment',
    authorLine: 'Black & Wiliam · 1998 · Michigan Dept. of Education',
    description: 'A review of 580 research articles found that diagnosing what students know before teaching them is the single highest-impact educational intervention ever documented — more impactful than any specific teaching technique, class size reduction, or curriculum change. Effect sizes reached 0.7, which is considered very large in education research.',
    implementation: 'This is the scientific justification for our diagnostic assessment before creating your personalised roadmap. We map what you know before we teach.',
    links: [
      { text: 'Free PDF', url: 'https://www.michigan.gov/-/media/Project/Websites/mde/2017/09/18/Inside_The_Black_Box_-_Black_and_William.pdf' }
    ]
  },
  {
    id: '08',
    category: 'Cognition & load',
    title: 'Zone of Proximal Development',
    authorLine: 'Vygotsky · 1934 · Stanford Encyclopedia of Philosophy',
    description: 'A person has two learning levels at any moment: what they can do completely alone, and what they can do with a small amount of help. The gap between these is the Zone of Proximal Development — the only zone where actual learning happens. Too easy means no growth; too hard means the student gives up.',
    implementation: 'Gurukul AI starts every concept at a harder question level and progressively simplifies until it finds the exact level where you can succeed with effort.',
    links: [
      { text: 'Overview', url: 'https://plato.stanford.edu/entries/vygotsky/' },
      { text: 'Simple explanation', url: 'https://www.simplypsychology.org/Zone-of-Proximal-Development.html' }
    ]
  },
  {
    id: '09',
    category: 'Assessment',
    title: 'Elaborative Interrogation',
    authorLine: 'Pressley et al. · 1992 · ResearchGate',
    description: 'Students who answered WHY questions — why does photosynthesis require sunlight, why does the formula work this way — retained material 23% better than students who answered WHAT questions. WHY questions force the student to connect new concepts to things they already know, creating richer memory traces.',
    implementation: 'Gurukul AI automatically switches from WHAT to WHY questions once you pass Bloom\'s Level 2, pushing you toward deeper understanding.',
    links: [
      { text: 'ResearchGate', url: 'https://www.researchgate.net/publication/232487581_Elaborative_interrogation_and_facilitated_learning' }
    ]
  },
  {
    id: '10',
    category: 'Cognition & load',
    title: 'Self-Explanation Effect',
    authorLine: 'Chi, Bassok, Lewis, Reimann & Glaser · 1989 · Carnegie Mellon',
    description: 'Students who explain material to themselves in their own words while studying learn significantly more deeply than students who passively read the same material. This is the cognitive science behind the Feynman Technique — explaining a concept simply is the ultimate test of whether you truly understand it.',
    implementation: 'Before a concept is marked as mastered, you must explain it in your own words while Gurukul AI plays the role of a confused student asking follow-up questions.',
    links: [
      { text: 'Free PDF', url: 'https://www.cs.cmu.edu/~bmclaren/pubs/Chi-etal-CogSci1989.pdf' }
    ]
  },
  {
    id: '11',
    category: 'Memory & retention',
    title: 'Desirable Difficulties & Interleaving',
    authorLine: 'Bjork · 1994 · UCLA Bjork Learning Lab',
    description: 'Conditions that make learning feel harder in the short term produce stronger long-term memory. The most important of these "desirable difficulties" is interleaving — mixing multiple topics in a single session rather than finishing one completely before starting the next. Research consistently shows this improves exam scores by 40 to 50 percent.',
    implementation: 'Our final consolidation session deliberately mixes questions from all concepts you have studied — even though it feels harder.',
    links: [
      { text: 'Overview paper', url: 'https://bjorklab.psych.ucla.edu/wp-content/uploads/sites/13/2016/07/RBjork_1994.pdf' }
    ]
  },
  {
    id: '12',
    category: 'Motivation',
    title: 'Self-Determination Theory',
    authorLine: 'Deci & Ryan · 1987 · selfdeterminationtheory.org',
    description: 'Three basic psychological needs determine whether a person stays motivated: autonomy (feeling in control), competence (feeling capable), and relatedness (feeling connected). Students who feel genuine control over their learning plan are significantly more motivated, more persistent through difficulty, and achieve better outcomes.',
    implementation: 'Gurukul AI shows you the full learning roadmap and lets you agree, modify, or reorder it — rather than forcing a fixed sequence on you.',
    links: [
      { text: 'Free PDF', url: 'https://selfdeterminationtheory.org/SDT/documents/1985_DeciRyan_IntrinsicMotivationAndSelfDetermination.pdf' }
    ]
  },
  {
    id: '13',
    category: 'Memory & retention',
    title: 'Distributed Practice (Spacing Effect)',
    authorLine: 'Cepeda, Pashler et al. · 2006 · Psychological Bulletin',
    description: 'The optimal first review interval depends on how long you want to remember something. For one-month retention, review after one day. For six-month retention, review after 11 days. The review gap should be roughly 10–20% of the desired retention duration.',
    implementation: 'These findings set the initial review interval for every concept and determine when your calendar review reminders are scheduled.',
    links: [
      { text: 'Free PDF', url: 'https://laplab.ucsd.edu/articles/Cepeda%20et%20al%202006%20PsychBull.pdf' }
    ]
  },
  {
    id: '14',
    category: 'Metacognition',
    title: 'Metacognition Theory',
    authorLine: 'Flavell · 1979 · SJSU',
    description: "Students who accurately know what they understand and what they don't perform significantly better academically than students with the same knowledge but poor self-awareness. Overconfident students are most at risk — they stop studying things they think they know but actually don't.",
    implementation: 'Our confidence calibration feature asks you to rate your confidence before each answer and tracks whether your confidence matches your actual accuracy over time.',
    links: [
      { text: 'Free PDF', url: 'https://www.sjsu.edu/people/peter.beyond/courses/EdD-polaris/s3/Flavell_1979.pdf' }
    ]
  }
];
