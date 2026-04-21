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
  selectSellSelectedEvent,
  selectSellEventDetail,
  selectSellActiveView,
  selectSellActiveHeaderTab,
} from "../../redux/reducers/sellCheckinSlice";
import { setTicketsSelectedTab, resetTicketsTab } from "../../redux/reducers/ticketsTabSlice";
import { resetBoxOffice } from "../../redux/reducers/boxOfficeSlice";
import { AppDispatch } from "../../redux/store";
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
