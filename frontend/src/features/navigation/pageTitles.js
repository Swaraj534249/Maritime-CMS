/** Default page titles by route (longest prefix wins). */
const ROUTE_TITLES = [
  ["/candidates/add", "Add Candidate"],
  ["/candidates/edit/", "Edit Candidate"],
  ["/candidates", "Candidates"],
  ["/vessel-owners", "Vessel Owners"],
  ["/vessels/", "Vessels"],
  ["/agency/agents", "Agent Management"],
  ["/super-admin/agencies/", "Agency Agents"],
  ["/super-admin/feedbacks", "Feedbacks"],
  ["/super-admin/agencies", "Agency Management"],
  ["/feedbacks", "Our Feedbacks"],
  ["/assets", "Assets"],
  ["/vacancies", "Vacancies"],
  ["/proposed", "Proposed Candidates"],
  ["/dashboard", "Dashboard"],
  ["/profile", "Profile"],
  ["/agent/onboarding", "Complete your profile"],
];

export function getPageTitleFromPath(pathname = "") {
  const match = ROUTE_TITLES.find(([prefix]) => pathname.startsWith(prefix));
  return match ? match[1] : "";
}
