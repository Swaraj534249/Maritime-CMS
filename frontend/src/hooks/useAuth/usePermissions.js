import { useSelector } from "react-redux";
import { selectUserRole } from "../../features/auth/AuthSlice";

export const usePermissions = () => {
  const userRole = useSelector(selectUserRole);
  
  return {
    canManageAgents: ['AGENCY_ADMIN', 'SUPER_ADMIN'].includes(userRole),
    canManageAgencies: userRole === 'SUPER_ADMIN',
    canViewVessels: ['AGENT', 'AGENCY_ADMIN'].includes(userRole),
  };
};