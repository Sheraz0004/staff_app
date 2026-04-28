import { useNavigation, useRoute } from "@react-navigation/native";
import React, { useRef, useState } from "react";
import {
  Platform,
  SafeAreaView,
  ScrollView,
  StatusBar,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { color } from "../../../color/color";
import SvgIcons from "../../../components/SvgIcons";
import EventsModal from "../../../components/EventsModal";
import { admindashboardterminaltab as originalAdminTabs } from "../../../constants/admindashboardterminaltab";
import { formatDateWithMonthName } from "../../../constants/dateAndTime";
import { logger } from "../../../utils/logger";
import { truncateEventName } from "../../../utils/stringUtils";
import AdminAllEventsDashboard from "../AdminAllEventsDashboard/adminAllEventsDashboard";
import { styles } from "../index.styles";
import StaffListComponent from "../StaffListComponent";
import TerminalsComponent from "../TerminalsComponent";
import OverallStatistics from "../OverallStatistics";
import AdminOverallStatistics from "../AdminOverallStatistics";
import StaffDashboard from "../StaffDashboard";

const admindashboardterminaltab = [...originalAdminTabs, "Staff"];

interface DashboardDetailProps {
  eventInfo?: any;
  onScanCountUpdate?: any;
  onEventChange?: any;
  showEventDashboard?: any;
}

const DashboardDetail: React.FC<DashboardDetailProps> = ({
  eventInfo: propEventInfo,
  onScanCountUpdate,
  onEventChange,
  showEventDashboard,
}) => {
  const navigation = useNavigation();
  const route = useRoute();
  const insets = useSafeAreaInsets();
  const scrollViewRef = useRef<any>(null);

  const isFromRootStack = route?.name === "DashboardDetail";
  const initialEventInfo = isFromRootStack
    ? (route.params as any)?.eventInfo || propEventInfo
    : propEventInfo;
  const [localEventInfo, setLocalEventInfo] = useState<any>(null);
  const eventInfo =
    localEventInfo || (isFromRootStack ? initialEventInfo : propEventInfo);

  const topPadding =
    Platform.OS === "android" ? StatusBar.currentHeight || 0 : insets.top;

  const [selectedAdminTab, setSelectedAdminTab] = useState(
    admindashboardterminaltab[0],
  );
  const [eventsModalVisible, setEventsModalVisible] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<any>(null);

  const shouldShowBackButton = isFromRootStack;

  const handleBackPress = () => {
    navigation.goBack();
  };

  const handleAdminTabPress = (tab: string) => {
    setSelectedAdminTab(tab);
  };

  const handleEventSelect = (event: any) => {
    setSelectedEvent(event);
    logger.log("Selected event:", event);

    if (event.uuid !== eventInfo?.eventUuid) {
      const eventUuid = event.uuid || event.eventUuid;
      setLocalEventInfo({
        ...eventInfo,
        eventUuid: eventUuid,
        event_title: event.title || event.event_title || event.name,
        cityName: event.cityName || event.location?.city || eventInfo?.cityName,
        date: event.start_date || event.date || eventInfo?.date,
        time: event.start_time || event.time || eventInfo?.time,
      });

      if (onEventChange) {
        onEventChange(event);
      }

      setEventsModalVisible(false);
    }
  };

  return (
    <View style={styles.mainContainer}>
      <SafeAreaView style={[{ paddingTop: topPadding }]}>
        <View style={styles.header}>
          {shouldShowBackButton && (
            <TouchableOpacity
              onPress={handleBackPress}
              style={styles.headerBackButton}
            >
              <SvgIcons.whiteArrow />
            </TouchableOpacity>
          )}
          <View style={styles.headerContent}>
            <View style={styles.headerLeft}>
              <Text
                style={styles.eventName}
                numberOfLines={1}
                ellipsizeMode="tail"
              >
                {truncateEventName(eventInfo?.event_title) || "OUTMOSPHERE"}
              </Text>
              <TouchableOpacity
                style={styles.dropdownButton}
                onPress={() => setEventsModalVisible(true)}
              >
                <SvgIcons.downArrowWhite
                  width={12}
                  height={12}
                  fill={color.white_FFFFFF}
                  stroke={color.white_FFFFFF}
                  strokeWidth={0}
                />
              </TouchableOpacity>
            </View>
            <View style={styles.headerSpacer} />
            <Text style={styles.date} numberOfLines={1} ellipsizeMode="tail">
              {formatDateWithMonthName(eventInfo?.date) || "30 Oct 2025"}
            </Text>
            <Text style={styles.separator}>at</Text>
            <Text style={styles.time} numberOfLines={1} ellipsizeMode="tail">
              {eventInfo?.time || "7:00 PM"}
            </Text>
          </View>
        </View>
      </SafeAreaView>

      <View style={styles.adminTabContainer}>
        <View style={styles.adminTabRow}>
          {admindashboardterminaltab.map((item) => (
            <TouchableOpacity
              key={item}
              style={[
                styles.adminTabButton,
                selectedAdminTab === item && styles.selectedAdminTabButton,
              ]}
              onPress={() => handleAdminTabPress(item)}
            >
              <Text
                style={[
                  styles.adminTabButtonText,
                  selectedAdminTab === item && styles.selectedAdminTabButtonText,
                ]}
              >
                {item}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {selectedAdminTab === "Terminals" ? (
        <TerminalsComponent
          eventInfo={eventInfo}
          onEventChange={onEventChange}
        />
      ) : selectedAdminTab === "Staff" ? (
        <StaffListComponent
          eventInfo={eventInfo}
          onEventChange={onEventChange}
        />
      ) : (
        <ScrollView
          contentContainerStyle={styles.scrollContainer}
          ref={scrollViewRef}
        >
          <AdminOverallStatistics />
        
          
        </ScrollView>
      )}

      <EventsModal
        visible={eventsModalVisible}
        onClose={() => setEventsModalVisible(false)}
        onEventSelect={handleEventSelect}
        currentEventUuid={eventInfo?.eventUuid}
      />
    </View>
  );
};

export default DashboardDetail;
