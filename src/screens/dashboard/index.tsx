import { useRoute } from "@react-navigation/native";
import React, { useEffect, useState } from "react";
import { userService } from "../../api/apiService";
import { logger } from "../../utils/logger";
import AdminAllEventsDashboard from "./AdminAllEventsDashboard/adminAllEventsDashboard";
import AgentDashboard from "./AgentDashboard/AgentDashboard";
import DashboardDetail from "./DashboardDetail/DashboardDetail";
import TerminalDashboard from "./TerminalDashboardPortal/TerminalDashboard";

interface DashboardScreenProps {
  eventInfo?: any;
  onScanCountUpdate?: any;
  onEventChange?: any;
  showEventDashboard?: any;
}

const DashboardScreen: React.FC<DashboardScreenProps> = ({
  eventInfo,
  onScanCountUpdate,
  onEventChange,
  showEventDashboard,
}) => {
  const route = useRoute();
  const [userRole, setUserRole] = useState<string | null>(null);
  const [userProfileLoading, setUserProfileLoading] = useState(true);

  const shouldShowEventDashboard =
    showEventDashboard ||
    route?.name === "DashboardDetail" ||
    (route.params as any)?.showEventDashboard;

  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        setUserProfileLoading(true);
        const profile = await userService.getProfile();
        const role =
          profile?.role ||
          profile?.user_role ||
          profile?.type ||
          profile?.permission ||
          profile?.user_type ||
          profile?.data?.role ||
          profile?.user?.role;
        logger.log("Final role value:", role);
        setUserRole(role || null);
      } catch (err: any) {
        logger.error("Error fetching user profile:", err);
        setUserRole(null);
      } finally {
        setUserProfileLoading(false);
      }
    };

    fetchUserProfile();
  }, []);

  if (userProfileLoading) return null;

  // if (userRole === "ADMIN") {
  //   return <AdminAllEventsDashboard />;
  // }

  // if (userRole === "AGENT" && !shouldShowEventDashboard) {
  //   return <TerminalDashboard />;
  // }

  // if (userRole === "AGENT" && shouldShowEventDashboard) {
  //   return (
  //     <AgentDashboard
  //       eventInfo={eventInfo}
  //       onScanCountUpdate={onScanCountUpdate}
  //       showEventDashboard={shouldShowEventDashboard}
  //     />
  //   );
  // }

  return (
    <AdminAllEventsDashboard />
    // <AgentDashboard/>
    // <DashboardDetail
    //   eventInfo={eventInfo}
    //   onScanCountUpdate={onScanCountUpdate}
    //   onEventChange={onEventChange}
    //   showEventDashboard={showEventDashboard}
    // />
  );
};

export default DashboardScreen;
