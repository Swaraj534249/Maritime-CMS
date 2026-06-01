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
  ["/dashboard", "Dashboard"],
  ["/profile", "Profile"],
  ["/agent/onboarding", "Complete your profile"],
  ["/propose", "Proposed Contracts"],
  ["/selecte", "Selected Contracts"],
];

export function getPageTitleFromPath(pathname = "") {
  const match = ROUTE_TITLES.find(([prefix]) => pathname.startsWith(prefix));
  return match ? match[1] : "";
}
