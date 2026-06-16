import { DashboardList } from "../features/dashboard/components/DashboardList";
import { usePageTitle } from "../features/navigation/PageTitleContext";

export function DashboardPage() {
  usePageTitle("Dashboard");
  return <DashboardList />;
}
