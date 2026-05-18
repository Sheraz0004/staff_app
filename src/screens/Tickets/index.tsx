import { useNavigation, useRoute } from "@react-navigation/native";
import React, { useEffect } from "react";
import { TouchableOpacity, View, Text } from "react-native";
import { useDispatch, useSelector } from "react-redux";
import Header from "../../components/header";
import BoxOfficeTab from "../BoxOfficeTab";
import TicketsTab from "../TicketsTab";
import {
  fetchEventDetailThunk,
  setActiveView,
  setActiveHeaderTab,
  setSelectedEvent,
  selectSellSelectedEvent,
  selectSellEventDetail,
  selectSellActiveView,
  selectSellActiveHeaderTab,
} from "../../redux/reducers/sellCheckinSlice";
import { setTicketsSelectedTab, resetTicketsTab } from "../../redux/reducers/ticketsTabSlice";
import { resetBoxOffice } from "../../redux/reducers/boxOfficeSlice";
import { AppDispatch } from "../../redux/store";
import { DASHBOARD_SERVICES } from "../../services/DashboardService";
import { logger } from "../../utils/logger";
import { styles } from "./index.styles";

interface SettingsScreenProps {
  navigation?: any;
  route?: any;
  onScanCountUpdate?: (...args: any[]) => void;
  userRole?: any;
}

const SettingsScreen = (props: SettingsScreenProps) => {
  const dispatch = useDispatch<AppDispatch>();
  const routeFromHook = useRoute();
  const navigationFromHook = useNavigation();
  const route = props.route || routeFromHook;
  const navigation = props.navigation || navigationFromHook;
  const routeParams = route?.params || {};
  const { onScanCountUpdate, userRole } = props;

  const selectedEvent = useSelector(selectSellSelectedEvent);
  const eventDetail = useSelector(selectSellEventDetail);
  const activeView = useSelector(selectSellActiveView);
  const activeHeaderTab = useSelector(selectSellActiveHeaderTab);

  const eventInfo = eventDetail
    ? { ...selectedEvent, ...eventDetail }
    : selectedEvent;

  const isFromRootStack = route?.name === "TicketsDetail";

  useEffect(() => {
    if (userRole !== 'STAFF' || selectedEvent) return;
    DASHBOARD_SERVICES.fetchMyEventsForStaff()
      .then((res: any) => {
        const raw: any[] = res?.data?.events ?? res?.data ?? [];
        const first = raw[0];
        if (!first) return;
        const eventUuid = first.uuid ?? String(first.id ?? '');
        dispatch(setSelectedEvent({
          uuid: eventUuid,
          eventUuid,
          title: first.title ?? first.event_title ?? first.name ?? '',
          event_title: first.title ?? first.event_title ?? first.name ?? '',
          cityName: first.location?.city ?? first.cityName,
          date: first.startDate ?? first.start_date ?? first.date,
          time: first.startTime ?? first.start_time ?? first.time,
        }));
      })
      .catch((err: any) => {
        logger.error('[Tickets] my-events error:', err?.response);
      });
  }, [userRole, selectedEvent]);

  useEffect(() => {
    const uuid = selectedEvent?.eventUuid;
    if (uuid) dispatch(fetchEventDetailThunk(uuid));
  }, [selectedEvent?.eventUuid]);

  useEffect(() => {
    if (routeParams?.initialTab === "Scanned") {
      dispatch(setActiveView("TicketsTab"));
      dispatch(setTicketsSelectedTab("Scanned"));
    }
  }, [routeParams?.initialTab]);

  useEffect(() => {
    if (routeParams?.screen === "BoxOfficeTab" || routeParams?.openBoxOffice) {
      dispatch(setActiveView("BoxOfficeTab"));
      dispatch(setActiveHeaderTab("Sell"));
    }
  }, [routeParams?.screen, routeParams?.openBoxOffice]);

  useEffect(() => {
    return () => {
      dispatch(resetTicketsTab());
      dispatch(resetBoxOffice());
    };
  }, []);

  const handleBackPress = () => {
    if (navigation?.canGoBack?.()) navigation.goBack();
  };

  const handleViewChange = (view: "TicketsTab" | "BoxOfficeTab") => {
    dispatch(setActiveView(view));
    if (view === "BoxOfficeTab") dispatch(setActiveHeaderTab("Sell"));
  };

  return (
    <View style={styles.mainContainer}>
      <Header
        eventInfo={eventInfo}
        showBackButton={isFromRootStack}
        onBackPress={handleBackPress}
        activeTab={activeHeaderTab}
        onTabChange={(tab) => dispatch(setActiveHeaderTab(tab))}
        userRole={userRole}
      />
      <View style={styles.contentContainer}>
        <View style={styles.tabContainer}>
          <TouchableOpacity
            onPress={() => handleViewChange("TicketsTab")}
            style={[styles.button, activeView === "TicketsTab" && styles.activeButton]}
          >
            <Text style={[styles.buttonText, activeView === "TicketsTab" && styles.activeButtonText]}>
              Tickets
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => handleViewChange("BoxOfficeTab")}
            style={[styles.button, activeView === "BoxOfficeTab" && styles.activeButton]}
          >
            <Text style={[styles.buttonText, activeView === "BoxOfficeTab" && styles.activeButtonText]}>
              Box Office
            </Text>
          </TouchableOpacity>
        </View>

        {activeView === "TicketsTab" && (
          <TicketsTab eventInfo={eventInfo} />
        )}
        {activeView === "BoxOfficeTab" && (
          <BoxOfficeTab onScanCountUpdate={onScanCountUpdate} />
        )}
      </View>
    </View>
  );
};

export default SettingsScreen;
