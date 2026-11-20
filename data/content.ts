/**
 * Single source of truth for all portfolio copy and data.
 * Populated strictly from Shivam Prasad's resume (resume.pdf) and verified project details.
 * Unknown values are left empty with a TODO and omitted from the UI rather than fabricated.
 */

export type ProjectWindowId =
  | 'project-orchestratorflow'
  | 'project-gwen'
  | 'project-minigpt'
  | 'project-textile-defect'
  | 'project-yolov8';

export type ProjectIconType = 'agent' | 'rag' | 'transformer' | 'vision' | 'detector';

export interface ProjectItem {
  id: ProjectWindowId;
  slug: string;
  fileName: string;
  windowTitle: string;
  windowKind: 'program' | 'document';
  iconType: ProjectIconType;
  headline: string;
  problem: string;
  built: string;
  stack: string[];
  /** Leave empty if not yet verified; UI hides result row when empty */
  resultMetric: string;
  resultDetail: string;
  /** Leave empty until git commit date (YYYY-MM-DD) is provided; UI hides modified date when empty */
  modifiedDate: string;
  links: {
    /** Leave empty if no dedicated repo URL exists; UI hides GitHub button when empty */
    github: string;
    githubLabel: string;
    /** Leave empty if no live URL exists; UI hides demo button when empty */
    demo: string;
    demoLabel: string;
  };
  /** Verified structured facts displayed inside ProjectDetailWindow */
  specs: Array<{ label: string; value: string }>;
}

export interface ExperienceItem {
  role: string;
  company: string;
  period: string;
  grade?: string;
  summary: string;
  bullets: string[];
}

export interface PublicationItem {
  title: string;
  venue: string;
}

export interface HackathonItem {
  name: string;
  description: string;
}

export interface CertificateItem {
  id: string;
  fileName: string;
  title: string;
  issuer: string;
  period: string;
  grade?: string;
  summary: string;
}

export interface SkillGroup {
  category: string;
  items: Array<{ name: string; usage: string }>;
}

export interface TrashFile {
  id: string;
  name: string;
  size: string;
  deletedAt: string;
  note: string;
}

export const SITE_META = {
  osName: 'ShivamOS',
  osVersion: '7.96',
  ownerName: 'Shivam Prasad',
  role: 'AI/ML Engineer',
  degree: 'B.Tech Computer Science (AI & ML), NITRA Technical Campus, AKTU (2022 – 2026)',
  location: 'Ghaziabad, India',
  availability: 'Immediate · Remote · EST overlap',
  languages: 'English, Hindi (Native)',
  email: 'shivamprasad1001@gmail.com',
  websiteUrl: 'https://shivamprasad1001.in',
  websiteLabel: 'shivamprasad1001.in',
  githubUrl: 'https://github.com/shivamprasad1001',
  linkedinUrl: 'https://www.linkedin.com/in/shivamprasad1001/',
  resumePdfUrl: 'https://github.com/shivamprasad1001/shivamprasad1001/blob/main/public/public/resume.pdf',
};

export const BOOT_SEQUENCE_LINES = [
  'SHIVAM-BIOS (C) 1996-2026 GHAZIABAD WORKSTATION',
  'CHECKING MODULES: OrchestratorFlow (5-Agent LangGraph) ... OK',
  'CHECKING MODULES: Gwen RAG (Pinecone / MongoDB / Groq) ... OK',
  'CHECKING MODULES: MiniGPT (1.2M params) + CV Models ... OK',
  'LOADING DESKTOP SHELL: ShivamOS 7.96',
  'READY. STARTING WINDOW MANAGER...',
];

export const ABOUT_CONTENT = {
  windowTitle: 'About Me — README.TXT',
  heading: 'Shivam Prasad',
  subline: 'AI/ML Engineer · B.Tech CSE (AI & ML), NITRA Technical Campus, AKTU (2022 – 2026)',
  paragraphs: [
    'AI Engineer with hands-on experience designing multi-agent LLM systems, RAG pipelines, end-to-end automation workflows, and custom ML/CV models from scratch.',
    'During my traineeship at Campaigning Source Pvt. Ltd. (Sep 2025 – Mar 2026), I deployed LLM automation pipelines with n8n that cut manual processing time by 40% and built guardrails delivering 95%+ deterministic output reliability.',
    'Featured work includes OrchestratorFlow (5-agent LangGraph code generation system, 88% task success rate, published at NGAISL2026), Gwen (live production RAG chatbot with hybrid search, reranking, and Groq fallback), MiniGPT (1.2M-parameter transformer from scratch), Textile Defect Detection (ResNet-50 + Grad-CAM, 94% accuracy), and yolo-custom-trainer.',
  ],
  highlights: [
    {
      label: 'Education',
      value: 'B.Tech Computer Science (AI & ML), NITRA Technical Campus, AKTU (2022 – 2026)',
    },
    {
      label: 'Experience',
      value: 'AI/ML Engineer Trainee, Campaigning Source Pvt. Ltd. (Sep 2025 – Mar 2026)',
    },
    { label: 'Availability', value: 'Immediate · Remote · EST overlap · Ghaziabad, India' },
  ],
};

export const PROJECTS: ProjectItem[] = [
  {
    id: 'project-orchestratorflow',
    slug: 'orchestratorflow',
    fileName: 'OrchestratorFlow.app',
    windowTitle: 'OrchestratorFlow — Multi-Agent Code Gen',
    windowKind: 'program',
    iconType: 'agent',
    headline: 'OrchestratorFlow — Multi-Agent LLM Code Generation System',
    problem:
      'Single-prompt LLM code generation frequently fails silently or hits runtime errors without structured state transitions and specialist-agent verification.',
    built:
      'Architected a five-agent framework using LangGraph to define explicit state machines with LangSmith tracing, and implemented dynamic routing based on agent evaluation. Published and presented at NGAISL2026, NITRA Technical Campus.',
    stack: ['Python', 'LangGraph', 'LangSmith', 'Multi-Agent LLMs'],
    resultMetric: '88% success rate · 73.5% fewer runtime errors',
    resultDetail: 'Published and presented at NGAISL2026, NITRA Technical Campus.',
    // TODO: Add git commit modified date (YYYY-MM-DD) when provided
    modifiedDate: '',
    links: {
      github: 'https://github.com/shivamprasad1001/orchestratorflow',
      githubLabel: 'View GitHub Repo',
      demo: '',
      demoLabel: '',
    },
    specs: [
      { label: 'Architecture', value: '5-agent LangGraph state machine' },
      { label: 'Reliability', value: '88% task success · -73.5% runtime errors' },
      { label: 'Publication', value: 'NGAISL2026, NITRA Technical Campus' },
    ],
  },
  {
    id: 'project-gwen',
    slug: 'gwen',
    fileName: 'gwen_rag.exe',
    windowTitle: 'Gwen — Production RAG Chatbot',
    windowKind: 'program',
    iconType: 'rag',
    headline: 'Gwen — Production RAG Chatbot',
    problem:
      'A personal AI digital twin that answers questions about my background accurately from my own knowledge base in production.',
    built:
      'Built and deployed a full-stack RAG chatbot engineered with hybrid search, reranking, and semantic caching for low latency. Questions are embedded with Google text-embedding-004, retrieved from Pinecone, answered by Gemini with Groq LLaMA 3.3 70B fallback for 10x faster fallback inference, logged in MongoDB Atlas, and deployed on VPS with Docker + Nginx.',
    stack: ['FastAPI', 'React', 'Pinecone', 'MongoDB Atlas', 'Gemini', 'Groq', 'Docker', 'Nginx'],
    resultMetric: 'Live in production · 10x faster Groq fallback',
    resultDetail: 'Deployed live at gwen.shivamprasad1001.in (gwen-xi.vercel.app).',
    // TODO: Add git commit modified date (YYYY-MM-DD) when provided
    modifiedDate: '',
    links: {
      github: 'https://github.com/shivamprasad1001/gwen',
      githubLabel: 'View GitHub Repo',
      demo: 'https://gwen.shivamprasad1001.in/',
      demoLabel: 'Open Live App',
    },
    specs: [
      { label: 'Retrieval', value: 'Hybrid search, reranking & semantic caching' },
      { label: 'Models', value: 'Gemini + Groq LLaMA 3.3 70B (10x faster fallback)' },
      { label: 'Deployment', value: 'VPS (Docker + Nginx) · MongoDB Atlas' },
    ],
  },
  {
    id: 'project-minigpt',
    slug: 'minigpt',
    fileName: 'MiniGPT.py',
    windowTitle: 'MiniGPT — Decoder-Only Transformer',
    windowKind: 'document',
    iconType: 'transformer',
    headline: 'Mini-GPT: Decoder-Only Transformer',
    problem: 'Understand transformers from first principles by building one in PyTorch rather than calling an API.',
    built:
      'Built a 1.2M-parameter decoder-only transformer from scratch in PyTorch with multi-head self-attention and layer normalization across a five-file modular codebase. Moved from Wikitext-2 to TinyStories and optimized training loss curves.',
    stack: ['Python', 'PyTorch'],
    // TODO: Add final val loss and a sample output when provided
    resultMetric: '1.2M parameters · trained on TinyStories',
    resultDetail: 'Optimized loss curves in a five-file modular PyTorch codebase.',
    // TODO: Add git commit modified date (YYYY-MM-DD) when provided
    modifiedDate: '',
    links: {
      github: 'https://github.com/shivamprasad1001/MiniGPT',
      githubLabel: 'View GitHub Repo',
      demo: '',
      demoLabel: '',
    },
    specs: [
      { label: 'Parameters', value: '1.2M (from scratch in PyTorch)' },
      { label: 'Architecture', value: 'Multi-head self-attention + LayerNorm' },
      { label: 'Training Data', value: 'TinyStories (switched from Wikitext-2)' },
    ],
  },
  {
    id: 'project-textile-defect',
    slug: 'textile-defect-detection',
    fileName: 'textile_defect.app',
    windowTitle: 'Textile Defect Detection — ResNet-50',
    windowKind: 'document',
    iconType: 'vision',
    headline: 'Textile Defect Detection (ResNet-50 + Grad-CAM)',
    problem: 'Automated fabric defect classification with visual explainability for textile inspection.',
    built:
      'Fine-tuned ResNet-50 on the AITEX textile defect dataset and applied Grad-CAM to highlight defect regions for explainability. Published at NITRA Conference 2026.',
    stack: ['Python', 'PyTorch', 'ResNet-50', 'Grad-CAM', 'OpenCV'],
    resultMetric: '94% accuracy · NITRA Conference 2026',
    resultDetail: 'Fine-tuned on the AITEX Dataset with Grad-CAM explainability.',
    // TODO: Add git commit modified date (YYYY-MM-DD) when provided
    modifiedDate: '',
    links: {
      // TODO: Add dedicated GitHub repository URL if published separately
      github: '',
      githubLabel: '',
      demo: '',
      demoLabel: '',
    },
    specs: [
      { label: 'Backbone', value: 'Fine-tuned ResNet-50' },
      { label: 'Explainability', value: 'Grad-CAM visual heatmaps' },
      { label: 'Dataset & Paper', value: 'AITEX Dataset · NITRA Conference 2026' },
    ],
  },
  {
    id: 'project-yolov8',
    slug: 'yolo-custom-trainer',
    fileName: 'yolo-custom-trainer.app',
    windowTitle: 'yolo-custom-trainer — YOLOv8 Detector',
    windowKind: 'program',
    iconType: 'detector',
    headline: 'yolo-custom-trainer (YOLOv8 Custom Object Detection)',
    problem: 'Detect custom objects with no ready-made dataset.',
    built:
      'Collected images on my smartphone, annotated in Label Studio (YOLO format), fine-tuned YOLOv8, and added webcam/video inference plus a Telegram bot for live detection.',
    stack: ['Python', 'PyTorch', 'Ultralytics YOLOv8', 'OpenCV', 'Label Studio'],
    resultMetric: '90%+ accuracy · 10 GitHub stars',
    resultDetail: 'Measured on my own custom dataset.',
    // TODO: Add git commit modified date (YYYY-MM-DD) when provided
    modifiedDate: '',
    // TODO: Add dataset size, class count, and mAP only when provided
    links: {
      github: 'https://github.com/shivamprasad1001/yolo-custom-trainer',
      githubLabel: 'View GitHub Repo',
      demo: '',
      demoLabel: '',
    },
    specs: [
      { label: 'Annotation', value: 'Label Studio (YOLO format)' },
      { label: 'Inference', value: 'Webcam, video & Telegram bot' },
      { label: 'Community', value: '10 GitHub stars' },
    ],
  },
];

export const SKILLS_DATA: SkillGroup[] = [
  {
    category: 'AI & LLMs',
    items: [
      {
        name: 'LangChain & LangGraph',
        usage: 'Multi-agent state machines, dynamic routing, and OrchestratorFlow (88% success rate)',
      },
      {
        name: 'LangSmith',
        usage: 'Agentic tracing, evaluation-driven routing, and debugging multi-agent runs',
      },
      {
        name: 'OpenAI / Anthropic / Gemini APIs',
        usage: 'Production LLM integration, multi-step CoT prompt chains, and deterministic guardrails',
      },
      {
        name: 'Groq & Ollama',
        usage: 'Low-latency inference (10x faster Groq fallback in Gwen) and local model experimentation',
      },
      {
        name: 'RAG (Hybrid / Reranking)',
        usage: 'Hybrid search, reranking, and semantic caching for production RAG pipelines',
      },
    ],
  },
  {
    category: 'Automation & Infrastructure',
    items: [
      {
        name: 'n8n & Zapier',
        usage: 'End-to-end LLM task orchestration, automated context injection, and workflow automation',
      },
      {
        name: 'FastAPI, REST APIs & Webhooks',
        usage: 'Production AI service backends and event-driven business workflow integrations',
      },
      {
        name: 'Docker, VPS & Linux',
        usage: 'Self-hosted production deployments with Docker and Nginx reverse proxies',
      },
    ],
  },
  {
    category: 'ML & Computer Vision',
    items: [
      {
        name: 'PyTorch & HuggingFace',
        usage: 'Decoder-only transformer from scratch (MiniGPT) and custom model fine-tuning',
      },
      {
        name: 'YOLOv8 & OpenCV',
        usage: 'Custom object detection (90%+ accuracy), webcam/video inference, and Telegram bot pipelines',
      },
      {
        name: 'ResNet-50 & Grad-CAM',
        usage: 'Fine-tuned textile defect classification (94% accuracy on AITEX) with explainability heatmaps',
      },
      {
        name: 'Scikit-learn & Label Studio',
        usage: 'Classical ML evaluation and manual YOLO bounding-box dataset annotation',
      },
    ],
  },
  {
    category: 'Stack & Databases',
    items: [
      {
        name: 'Python, Node.js & JavaScript',
        usage: 'Core AI/ML engineering, backend services, automation scripts, and web apps',
      },
      {
        name: 'React',
        usage: 'Frontend interfaces for Gwen RAG chatbot and interactive web tools',
      },
      {
        name: 'Pinecone, MongoDB, PostgreSQL & Supabase',
        usage: 'Vector indexing, chat session logging (MongoDB Atlas), and relational persistence',
      },
      {
        name: 'Git',
        usage: 'Version control across modular ML repositories and production deployments',
      },
    ],
  },
];

export const RESUME_DATA = {
  fileName: 'SHIVAM_PRASAD_CV_2026.TXT',
  header: {
    name: 'SHIVAM PRASAD',
    title: 'AI / Machine Learning Engineer',
    location: SITE_META.location,
    email: SITE_META.email,
    website: SITE_META.websiteUrl,
    websiteLabel: SITE_META.websiteLabel,
    github: SITE_META.githubUrl,
    linkedin: SITE_META.linkedinUrl,
    resumePdfUrl: SITE_META.resumePdfUrl,
  },
  summary:
    'AI Engineer with hands-on experience designing multi-agent LLM systems, RAG pipelines, and end-to-end automation workflows. Built OrchestratorFlow, a five-agent code generation system with 88% success rate (published at NGAISL2026), and Gwen, a production RAG chatbot live at gwen-xi.vercel.app. Proven ability to convert complex business workflows into reliable, measurable, and scalable AI-powered systems.',
  education: [
    {
      degree: 'B.Tech Computer Science (AI & ML)',
      institution: 'NITRA Technical Campus, AKTU',
      period: '2022 – 2026',
      coursework: 'Machine Learning, Deep Learning, NLP, Computer Vision, DSA',
    },
  ],
  experience: [
    {
      role: 'AI/ML Engineer Trainee',
      company: 'Campaigning Source Pvt. Ltd.',
      period: 'Sep 2025 – Mar 2026',
      grade: 'Grade A',
      summary:
        'Deployed LLM automation pipelines with n8n, CoT reasoning chains, and deterministic production guardrails.',
      bullets: [
        'Deployed AI automation pipelines integrating LLMs with business workflows, reducing manual processing time by 40%.',
        'Built multi-step prompt chains with CoT reasoning to eliminate hallucinations in client-facing outputs.',
        'Integrated LLM APIs with n8n for end-to-end task orchestration and automated context injection.',
        'Developed guardrails ensuring 95%+ deterministic output reliability in production environments.',
      ],
    },
  ] as ExperienceItem[],
  publications: [
    {
      title: '"OrchestratorFlow: Multi-Agent LLM Code Generation System"',
      venue: 'NGAISL2026',
    },
    {
      title: '"Textile Defect Detection using ResNet-50 & Grad-CAM"',
      venue: 'NITRA Conference 2026',
    },
  ] as PublicationItem[],
  hackathons: [
    {
      name: 'Hacknovate 5.0',
      description:
        'Developed a weather forecasting dashboard, collaborating with a team of 4 to deliver a scalable solution.',
    },
    {
      name: 'EDU Chain',
      description:
        'Built an NFT marketplace on blockchain, demonstrating rapid prototyping and team collaboration within 24 hours.',
    },
  ] as HackathonItem[],
  additional: {
    languages: SITE_META.languages,
    availability: SITE_META.availability,
  },
};

export const CERTIFICATES_DATA: CertificateItem[] = [
  {
    id: 'cert-campaigning-source',
    fileName: 'Campaigning_Source_Traineeship.crt',
    title: 'AI/ML Engineer Trainee — Campaigning Source Pvt. Ltd.',
    issuer: 'Campaigning Source Pvt. Ltd.',
    period: 'Sep 2025 – Mar 2026',
    grade: 'Grade A',
    summary:
      'Deployed LLM automation pipelines reducing manual processing time by 40%, integrated n8n task orchestration, and developed guardrails with 95%+ deterministic output reliability.',
  },
  {
    id: 'pub-ngaisl-2026',
    fileName: 'OrchestratorFlow_NGAISL2026.pub',
    title: 'OrchestratorFlow: Multi-Agent LLM Code Generation System',
    issuer: 'NGAISL2026, NITRA Technical Campus',
    period: '2026',
    summary:
      'Published and presented a five-agent LangGraph code generation system achieving 88% task success rate and 73.5% fewer runtime errors.',
  },
  {
    id: 'pub-nitra-2026',
    fileName: 'Textile_Defect_NITRA2026.pub',
    title: 'Textile Defect Detection using ResNet-50 & Grad-CAM',
    issuer: 'NITRA Conference 2026',
    period: '2026',
    summary:
      'Published research fine-tuning ResNet-50 on the AITEX textile defect dataset (94% accuracy) with Grad-CAM explainability.',
  },
];

export const TRASH_FILES: TrashFile[] = [
  {
    id: 'trash-1',
    name: 'thin_api_wrapper_startup.txt',
    size: '4 KB',
    deletedAt: '1999-12-31',
    note: 'Discarded. A prompt glued to an API with no training, evaluation, or guardrails.',
  },
  {
    id: 'trash-2',
    name: 'wikitext2_incoherent_samples.txt',
    size: '12 KB',
    deletedAt: '2025-11-04',
    note: 'Early MiniGPT outputs on Wikitext-2 before switching to TinyStories.',
  },
  {
    id: 'trash-3',
    name: 'resume_buzzwords_draft.doc',
    size: '8 KB',
    deletedAt: '2026-01-09',
    note: 'Contained "passionate", "synergistic", and "next-gen". Moved to Trash.',
  },
];

export const BSOD_CONTENT = {
  header: 'SHIVAM_OS',
  headline: 'A fatal exception 0x4D4C has occurred at 0028:C001C0DE in VXD TORCH(01).',
  lines: [
    'The current session encountered a shortage of AI engineers who evaluate and ship reliable systems.',
    '* Press the Resume button below to inspect Shivam Prasad’s resume directly.',
    '* Press Esc or click Reboot to return to ShivamOS Desktop.',
  ],
  errorCode: 'STOP: 0x00000096 (CUDA_OUT_OF_WRAPPER_EXCUSES)',
};

export const DESKTOP_ICON_LABELS = {
  about: 'About Me',
  projects: 'Projects',
  resume: 'Resume',
  skills: 'Skills',
  contact: 'Contact',
  terminal: 'terminal.exe',
  games: 'Games',
  paint: 'Paint.app',
  notes: 'Notes.txt',
  trash: 'Trash',
} as const;

export const WINDOW_MANAGER_COPY = {
  loadingWindow: 'Loading module...',
  switcherTitle: 'WINDOW SWITCHER',
  switcherHint: 'Tab / Arrows to select · Release Alt or Enter to switch · Esc to cancel',
  switcherEmpty: 'No open windows.',
  minimizedTag: 'MIN',
  snapLeftLabel: 'SNAP LEFT HALF',
  snapRightLabel: 'SNAP RIGHT HALF',
  closeShortcutLabel: 'Ctrl+W',
  switcherShortcutLabel: 'Alt+Tab',
  iconDoubleClickHint: 'Double-click or press Enter to open',
} as const;

export const SYSTEM_CHROME_COPY = {
  taskbar: {
    startLabel: 'Start',
    noOpenWindows: 'Desktop idle',
    wifiDecorativeLabel: 'Wi-Fi indicator (decorative pixel art — not real telemetry)',
    batteryDecorativeLabel: 'Battery indicator (decorative pixel art — not real telemetry)',
    decorativeTag: 'Decorative',
  },
  startMenu: {
    bannerTitle: 'SHIVAMOS 7.96',
    bannerUser: 'Guest Session',
    appsHeading: 'Applications',
    recentHeading: 'Recent Items',
    recentEmpty: 'No recent items yet.',
    lockAction: 'Lock Screen',
    restartAction: 'Restart',
    shutDownAction: 'Shut Down',
    explorerLabel: 'File Explorer',
    settingsLabel: 'Settings',
  },
  contextMenu: {
    open: 'Open',
    rename: 'Rename',
    properties: 'Properties',
    deleteFolder: 'Delete Folder',
    refresh: 'Refresh',
    changeWallpaper: 'Change Wallpaper',
    newFolder: 'New Folder',
    openExplorer: 'Open File Explorer',
    openSettings: 'Display Settings...',
    cascadeWindows: 'Cascade Windows',
    tileWindows: 'Tile Windows',
    resetLayout: 'Reset Desktop Layout',
  },
  toasts: {
    copiedToClipboard: 'Copied to clipboard',
    resumeDownloaded: 'Resume downloaded',
    desktopRefreshed: 'Desktop refreshed',
    wallpaperChangedPrefix: 'Wallpaper:',
    folderCreatedPrefix: 'Created',
    folderDeletedPrefix: 'Removed',
    iconRenamedPrefix: 'Renamed to',
    settingsSaved: 'Settings saved',
    noteQueued: 'Note saved to local Outbox',
    customFolderEmpty: 'Folder is empty (visual desktop folder)',
  },
  lockScreen: {
    badge: 'LOCKED SESSION',
    guestAccount: 'Guest Account',
    prompt: 'Click to log in as guest',
    skipHint: 'Press any key or click anywhere to unlock',
  },
  powerScreen: {
    shuttingDownTitle: 'SHIVAMOS IS SHUTTING DOWN...',
    shuttingDownDetail: 'Saving session preferences and parking desktop windows.',
    safeHeadline: 'It is now safe to close this tab.',
    safeSubline: 'ShivamOS 7.96 has halted cleanly.',
    powerOnButton: 'Power On',
    powerOnHint: 'Click Power On or press Enter to boot again.',
  },
  properties: {
    titleSuffix: 'Properties',
    nameLabel: 'Name',
    typeLabel: 'Type',
    locationLabel: 'Location',
    modifiedLabel: 'Modified',
    repoLabel: 'Repository',
    stackLabel: 'Stack',
    statusLabel: 'Result / Status',
    summaryLabel: 'Notes',
    closeButton: 'OK',
  },
  explorer: {
    windowTitle: 'File Explorer — C:\\SHIVAM',
    treeHeading: 'Folders',
    pathLabel: 'Path',
    openAction: 'Open',
    propertiesAction: 'Properties',
    emptyMessage: 'No items in this directory.',
    footerHint: 'Use Arrow keys to navigate, Enter to open',
    nodes: {
      projects: { label: 'Projects', path: 'C:\\SHIVAM\\PROJECTS' },
      resume: { label: 'Resume', path: 'C:\\SHIVAM\\RESUME' },
      contact: { label: 'Contact', path: 'C:\\SHIVAM\\CONTACT' },
      certificates: { label: 'Certificates', path: 'C:\\SHIVAM\\CERTIFICATES' },
    },
  },
  settings: {
    windowTitle: 'Settings — Control Panel',
    subtitle: 'System preferences are saved locally in your browser.',
    wallpaperHeading: 'Wallpaper Pattern',
    displayHeading: 'Display & Effects',
    audioHeading: 'Audio',
    crtLabel: 'CRT Scanlines',
    crtDesc: 'Toggle retro horizontal scanline overlay.',
    soundLabel: 'UI Sound Effects',
    soundDesc: 'Retro click, window open/close, and chime tones.',
    reduceMotionLabel: 'Reduce Motion',
    reduceMotionDesc: 'Disable stepped open/close and toast animations.',
    resetButton: 'Restore Default Settings',
    wallpapers: [
      { id: 'dither', label: 'Dither' },
      { id: 'dots', label: 'Dots' },
      { id: 'grid', label: 'Grid' },
      { id: 'diagonal', label: 'Diagonal' },
    ] as const,
  },
  pwa: {
    installShort: 'INSTALL',
    installButton: 'Install ShivamOS App',
    installIosButton: 'Install on iOS',
    installedBadge: 'INSTALLED (STANDALONE)',
    sectionHeading: 'Progressive Web App (PWA)',
    readyDesc: 'Install ShivamOS to your home screen or desktop for offline access and standalone mode.',
    installedDesc: 'ShivamOS is currently running in standalone installed mode.',
    iosDesc: 'Add ShivamOS to your iPhone or iPad Home Screen via Safari Share menu.',
    manualDesc:
      'Use your browser address bar or menu ("Install app" / "Add to Home Screen") to install ShivamOS for offline use.',
    iosModalTitle: 'Install ShivamOS on iPhone / iPad',
    iosStep1: '1. Tap the Share button in the Safari toolbar.',
    iosStep2: '2. Scroll down and tap "Add to Home Screen".',
    iosStep3: '3. Tap "Add" to launch ShivamOS in standalone emulator mode.',
    offlineBanner: 'OFFLINE MODE — CACHED SHIVAMOS ACTIVE',
  },
  emulator: {
    brandLabel: 'SHIVAM WIN-EMU',
    padButton: 'PAD',
    deskAction: 'DESK',
    altTabAction: 'ALT+TAB',
    termAction: 'TERM',
    gamesAction: 'GAMES',
    windowedLabel: 'WIN',
    fitLabel: 'FIT',
    exitDesktopLabel: 'DESKTOP',
    padFooterLabel: 'WIN-EMU VIRTUAL CONTROLLER',
  },
} as const;

export function generatePlainTextResume(): string {
  const contactParts = [RESUME_DATA.header.location];
  if (RESUME_DATA.header.email) {
    contactParts.push(RESUME_DATA.header.email);
  }
  if (RESUME_DATA.header.websiteLabel) {
    contactParts.push(RESUME_DATA.header.websiteLabel);
  }

  const experienceLines = RESUME_DATA.experience.map((exp) => {
    const header = `${exp.role} — ${exp.company} (${exp.period})`;
    const bullets = exp.bullets.map((b) => `  • ${b}`).join('\n');
    return `${header}\n${bullets}\n`;
  });

  const projectLines = PROJECTS.map((p) => {
    const lines = [
      `${p.headline.toUpperCase()}`,
      `  Problem: ${p.problem}`,
      `  Built:   ${p.built}`,
    ];
    if (p.resultMetric) {
      lines.push(`  Result:  ${p.resultMetric}${p.resultDetail ? ` — ${p.resultDetail}` : ''}`);
    }
    lines.push(`  Stack:   ${p.stack.join(', ')}`);
    if (p.links.github) {
      lines.push(`  Code:    ${p.links.github}`);
    }
    if (p.links.demo) {
      lines.push(`  Live:    ${p.links.demo}`);
    }
    return lines.join('\n') + '\n';
  }).join('\n');

  const publicationLines = RESUME_DATA.publications.map(
    (pub) => `• ${pub.title}, ${pub.venue}.`
  );

  const hackathonLines = RESUME_DATA.hackathons.map(
    (hack) => `• ${hack.name}: ${hack.description}`
  );

  const skillLines = SKILLS_DATA.map(
    (g) => `${g.category}: ${g.items.map((i) => i.name).join(', ')}`
  ).join('\n');

  return [
    `${RESUME_DATA.header.name} — ${RESUME_DATA.header.title}`,
    contactParts.join(' | '),
    `GitHub: ${RESUME_DATA.header.github} | LinkedIn: ${RESUME_DATA.header.linkedin}`,
    '====================================================================',
    '',
    'SUMMARY',
    RESUME_DATA.summary,
    '',
    'TECHNICAL SKILLS',
    skillLines,
    '',
    'EXPERIENCE',
    ...experienceLines,
    'PROJECTS',
    projectLines,
    'PUBLICATIONS & RESEARCH',
    ...publicationLines,
    '',
    'COMPETITIONS & HACKATHONS',
    ...hackathonLines,
    '',
    'EDUCATION',
    ...RESUME_DATA.education.map(
      (e) =>
        `${e.degree} — ${e.institution} (${e.period})\n  Relevant: ${e.coursework}`
    ),
    '',
    'ADDITIONAL',
    `Languages: ${RESUME_DATA.additional.languages} | Availability: ${RESUME_DATA.additional.availability}`,
    '',
  ].join('\n');
}
