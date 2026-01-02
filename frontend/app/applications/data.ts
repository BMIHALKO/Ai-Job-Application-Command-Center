export type ApplicationStatus = 
    | "draft"
    | "applied"
    | "screen"
    | "interview"
    | "offer"
    | "rejected"
    | "withdrawn"
    | "ghosted";

export type ApplicationRow = {
    application_id: string;
    company_name: string;
    role_title: string;
    status: ApplicationStatus;
    priority: number;
    applied_at: string | null;
    last_touch_at: string | null;
    next_action_at: string | null;
    next_action_label: string | null;
    location: string | null;
    work_mode: string | null;
    notes?: string | null;
};

export const MOCK_APPLICATIONS: ApplicationRow[] = [
  {
    application_id: "1",
    company_name: "IBM",
    role_title: "Entry Level Software Engineer 2026",
    status: "rejected",
    priority: 1,
    applied_at: "2025-12-29",
    last_touch_at: "2025-12-31T15:47:00Z",
    next_action_at: null,
    next_action_label: null,
    location: "Poughkeepsie, NY / Austin, TX",
    work_mode: "hybrid",
    notes: "Applied Dec 29, rejected two days later. Entry Level EDA-focused role within IBM Systems.",
  },
  {
    application_id: "2",
    company_name: "Another Corp",
    role_title: "Frontend Engineer",
    status: "screen",
    priority: 1,
    applied_at: "2025-12-10",
    last_touch_at: "2025-12-18T16:00:00Z",
    next_action_at: "2026-01-02T08:19:00Z",
    next_action_label: "Recruiter screen",
    location: "Remote",
    work_mode: "remote",
    notes: `Recruiter call went well.
    Asked about team structure.

    Follow up:
    - Send thank-you email
    - Ask about next steps`,
  },
  {
    application_id: "3",
    company_name: "No Response LLC",
    role_title: "Backend Engineer",
    status: "ghosted",
    priority: 3,
    applied_at: "2025-11-30",
    last_touch_at: "2025-12-02T18:00:00Z",
    next_action_at: "2025-12-20T12:00:00Z",
    next_action_label: null,
    location: "Charlotte, NC",
    work_mode: "onsite",
    notes: "Followed up on 12/31.\nRecruiter said next steps soon.\nPrep system design.",
  },
]