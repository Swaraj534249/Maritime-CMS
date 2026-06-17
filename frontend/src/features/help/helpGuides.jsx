import BusinessIcon from "@mui/icons-material/Business";
import DirectionsBoatIcon from "@mui/icons-material/DirectionsBoatOutlined";
import PersonIcon from "@mui/icons-material/Person";
import WorkOutlineIcon from "@mui/icons-material/WorkOutline";
import HowToRegOutlinedIcon from "@mui/icons-material/HowToRegOutlined";
import DescriptionOutlinedIcon from "@mui/icons-material/DescriptionOutlined";
import CategoryOutlinedIcon from "@mui/icons-material/CategoryOutlined";

/**
 * In-app help content. Each guide has sections; each section can include any of:
 *   - body:  intro paragraph
 *   - steps: numbered "how to" list
 *   - tips:  bullet hints
 *   - note:  highlighted callout
 *   - image: screenshot path (optional, rendered when present)
 * Add content here as the app grows — no code changes needed in the page.
 */
export const HELP_GUIDES = [
  {
    key: "vessel-owners",
    title: "Vessel Owners",
    icon: BusinessIcon,
    description: "Add owner companies and the details that matter.",
    ready: true,
    sections: [
      {
        id: "overview",
        heading: "Overview",
        body: "A vessel owner is the company that owns the vessels/rigs you crew. Owners are agency-scoped — you only see and manage owners belonging to your agency.",
      },
      {
        id: "add",
        heading: "Add a vessel owner",
        steps: [
          "Open Vessel Owners from the sidebar.",
          "Click the Add button on the top right.",
          "Fill in the company name and a short name.",
          "Add contact and address details, then Save.",
        ],
        tips: [
          "The short name appears inside vacancy IDs (e.g. SRJA-TDF-0001).",
          "Use a consistent short name you'll recognise on tables and emails.",
        ],
        note: "Short names must be unique within your agency.",
      },
      {
        id: "vessels",
        heading: "Vessels under an owner",
        body: "Each owner can have multiple vessels. Add the owner first, then create its vessels — you'll pick the owner while adding a vessel.",
      },
    ],
  },
  {
    key: "vessels",
    title: "Vessels",
    icon: DirectionsBoatIcon,
    description: "Add vessels, set vessel type, IMO and flag.",
    ready: true,
    sections: [
      {
        id: "add",
        heading: "Add a vessel",
        steps: [
          "Open Vessels (from the owner) and click Add.",
          "Select the owner the vessel belongs to.",
          "Enter the vessel name, type, IMO number and flag.",
          "Save — the vessel is now available when creating vacancies.",
        ],
        tips: ["Vessel type is reused on vacancies, so keep it accurate."],
      },
    ],
  },
  {
    key: "candidates",
    title: "Candidates",
    icon: PersonIcon,
    description: "Add/edit candidates, document parsing and key fields.",
    ready: true,
    sections: [
      {
        id: "add",
        heading: "Add a candidate",
        steps: [
          "Open Candidates and click Add Candidate.",
          "Enter personal details, rank and contact info.",
          "Upload documents (passport, CDC, etc.).",
          "Save to create the candidate profile.",
        ],
      },
      {
        id: "parsing",
        heading: "How document parsing works",
        body: "When you upload a supported document, the system reads key fields (like name, number and dates) to help pre-fill the form. Always review the parsed values before saving — parsing assists you, it doesn't replace a check.",
        tips: ["Clear, high-quality scans parse more accurately."],
      },
      {
        id: "important",
        heading: "What's important",
        tips: [
          "INDOS number identifies the candidate across the system — keep it correct.",
          "Rank must match vacancies for the candidate to appear when proposing.",
          "Current status controls availability: only Available candidates can be proposed.",
        ],
      },
    ],
  },
  {
    key: "vacancies",
    title: "Vacancies",
    icon: WorkOutlineIcon,
    description: "Create a vacancy and propose candidates to it.",
    ready: true,
    sections: [
      {
        id: "create",
        heading: "Create a vacancy",
        steps: [
          "Open Vacancies and click Add Vacancy.",
          "Pick the vessel owner, then the vessel (type and flag auto-fill).",
          "Choose the rank and number of openings.",
          "Enter salary, sign-on date and contract duration, then Save.",
        ],
        note: "One vacancy is for one rank. For multiple ranks on the same vessel, create one vacancy per rank.",
      },
      {
        id: "propose",
        heading: "Propose candidates",
        steps: [
          "On a vacancy row, click Propose.",
          "Pick from the eligible (Available, matching-rank) candidates.",
          "You can propose up to 10 candidates per vacancy.",
        ],
        tips: ["A candidate can be proposed to several vacancies at once."],
      },
    ],
  },
  {
    key: "proposed",
    title: "Proposed & Selection",
    icon: HowToRegOutlinedIcon,
    description: "Review candidates, the checklist, and select & assign.",
    ready: true,
    sections: [
      {
        id: "review",
        heading: "Review & select",
        steps: [
          "Open Proposed and click Review on a candidate.",
          "Complete the checklist (shortlisted, verified, interview).",
          "Assign a documentation agent, then Select & Assign.",
        ],
        note: "Selecting a candidate auto-rejects their other proposals and fills the vacancy slot.",
      },
    ],
  },
  {
    key: "documentation",
    title: "Documentation",
    icon: DescriptionOutlinedIcon,
    description: "Verify documents and approve the contract for sign-on.",
    ready: true,
    sections: [
      {
        id: "verify",
        heading: "Verify documents",
        steps: [
          "Open Documentation and click Verify on a record.",
          "For each document, upload the file, fill the dates and Save & Verify.",
          "For PPE not yet issued, tick No PPE and enter a reason.",
        ],
        tips: ["Passport/CDC re-uploads sync back to the candidate profile."],
      },
      {
        id: "signon",
        heading: "Approve & proceed to sign-on",
        body: "Once all documents are verified, use Proceed to Sign-on to approve the contract. The candidate and agency staff are emailed, and the candidate appears in Sailings.",
      },
    ],
  },
  {
    key: "sailings",
    title: "Sailings",
    icon: DirectionsBoatIcon,
    description: "Track onboard crew, record sign-off and arrival.",
    ready: true,
    sections: [
      {
        id: "signoff",
        heading: "Sign a candidate off",
        steps: [
          "Open Sailings and click the action (eye) icon on a row.",
          "Review the candidate and schedule.",
          "Enter the sign-off date and arrival date, then Confirm Sign-off.",
        ],
        note: "After sign-off, the candidate becomes Available again for new vacancies.",
      },
    ],
  },
  {
    key: "assets",
    title: "Assets",
    icon: CategoryOutlinedIcon,
    description: "Manage shared ranks and vessel types.",
    ready: true,
    sections: [
      {
        id: "manage",
        heading: "Ranks & vessel types",
        body: "Assets are shared lists reused across candidates, vessels and vacancies. Add or deactivate ranks and vessel types from the Assets page.",
        tips: ["Names are title-cased and must be unique (case-insensitive)."],
      },
    ],
  },
];
