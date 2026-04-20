import React, { useState } from "react";
import {
  Text,
  View,
  FlatList,
  TouchableOpacity,
  Alert,
  ListRenderItemInfo,
} from "react-native";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import { color } from "../color/color";
import { useApi } from "../services/useApi";
import { CHECK_IN_SERVICES } from "../services/CheckInService";
import SuccessPopup from "./SuccessPopup";
import ErrorPopup from "./ErrorPopup";
import { logger } from "../utils/logger";
import { networkService } from "../utils/network";
import { styles } from "./checkInAllPopupticketList.styles";

interface ScannedBy {
  name: string;
  staff_id: string;
  scanned_on: string;
}

interface TicketItem {
  uuid: string;
  ticket_number: string;
  category: string;
  status: string;
  ticketClass?: string;
  eventUuid?: string;
  code?: string;
  ticket_holder?: string;
  ticketHolder?: string;
  ticket_type?: string;
  type?: string;
  currency?: string;
  ticket_price?: number | string;
  price?: number | string;
  last_scan?: string;
  last_scanned_on?: string;
  scanned_by?: ScannedBy | string;
  staff_id?: string;
  scan_count?: number;
  scanCount?: number;
  note?: string;
  event_uuid?: string;
  scanned_by_email?: string;
  ticket_holder_email?: string;
  name?: string;
  date?: string;
  email?: string;
  scanned_on?: string;
}

interface CheckInAllPopupProps {
  ticketslist: TicketItem[];
  onTicketStatusChange?: (
    uuid: string,
    status: string,
    scannedBy: ScannedBy | null,
  ) => void;
  onScanCountUpdate?: () => void;
  userEmail?: string;
}

const CheckInAllPopup: React.FC<CheckInAllPopupProps> = ({
  ticketslist,
  onTicketStatusChange,
  onScanCountUpdate,
  userEmail,
}) => {
  const route = useRoute<any>();
  const { eventInfo } = route.params;
  const navigation = useNavigation<any>();
  const [showSuccessPopup, setShowSuccessPopup] = useState(false);
  const [showErrorPopup, setShowErrorPopup] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isQueued, setIsQueued] = useState(false);

  const { requestCall: doCheckin } = useApi(
    CHECK_IN_SERVICES.manualCheckin,
    false,
    false,
  );

  const handleStatusChange = async (ticketToCheckIn: TicketItem) => {
    // logger.log("Check-in ticket data:", ticketToCheckIn);
    try {
      logger.log("Sending:", ticketToCheckIn.eventUuid, ticketToCheckIn.code);
      const checkinRes = await doCheckin(
        ticketToCheckIn.eventUuid!,
        ticketToCheckIn.code!,
      );
      const response = checkinRes?.data;
      logger.log("API Response:", response);

      setIsQueued(false);

      if (response?.data?.status === "SCANNED") {
        const scannedByFromResponse = response?.data?.scanned_by;
        logger.log(
          "CheckInAllPopup - scanned_by from response:",
          scannedByFromResponse,
        );
        if (onTicketStatusChange) {
          onTicketStatusChange(
            ticketToCheckIn.uuid,
            "SCANNED",
            scannedByFromResponse
              ? {
                  name: scannedByFromResponse.name,
                  staff_id: scannedByFromResponse.staff_id,
                  scanned_on: scannedByFromResponse.scanned_on,
                }
              : null,
          );
        }

        if (onScanCountUpdate) onScanCountUpdate();
        setShowSuccessPopup(true);
      } else {
        const errorMsg =
          response?.data?.message ||
          response?.message ||
          "We couldn't check in this ticket. Please try again or contact support.";
        setErrorMessage(errorMsg);
        setShowErrorPopup(true);
      }
    } catch (error: any) {
      logger.error("Check-in error:", error.response.data);

      if (
        networkService.isNetworkError(error) &&
        !networkService.isConnected()
      ) {
        logger.log("Network error - check-in will be queued");
        setIsQueued(true);
        if (onTicketStatusChange) {
          onTicketStatusChange(ticketToCheckIn.uuid, "SCANNED", {
            name: "Queued for sync",
            staff_id: "N/A",
            scanned_on: new Date().toISOString(),
          });
        }
        if (onScanCountUpdate) onScanCountUpdate();
        setShowSuccessPopup(true);
      } else {
        const errorMsg =
          error?.response?.data?.message ||
          error?.message ||
          "We couldn't check in this ticket. Please try again or contact support.";
        setErrorMessage(errorMsg);
        setShowErrorPopup(true);
      }
    }
  };

  const handleCloseSuccessPopup = () => setShowSuccessPopup(false);
  const handleCloseErrorPopup = () => {
    setShowErrorPopup(false);
    setErrorMessage(null);
  };

  const handleItemPress = (item: TicketItem) => {
    const scanResponse = {
      message:
        item.status === "SCANNED" ? "Ticket Scanned" : "Ticket Unscanned",
      ticket_holder: item.ticket_holder || item.ticketHolder || "No Record",
      ticket: item.ticket_type || item.type,
      currency: item.currency,
      ticket_price: item.ticket_price || item.price,
      last_scan: item.last_scan || item.last_scanned_on,
      scanned_by:
        typeof item.scanned_by === "object"
          ? item.scanned_by?.name
          : item.scanned_by || "No Record",
      staff_id:
        typeof item.scanned_by === "object"
          ? item.scanned_by?.staff_id
          : item.staff_id || "No Record",
      ticket_number: item.ticket_number,
      scan_count: item.scan_count || item.scanCount || 0,
      note: item.note || "No note added",
      event_uuid: item.event_uuid || item.eventUuid,
      scanned_by_email: item.scanned_by_email || "No Record",
      ticket_holder_email: item.ticket_holder_email || "No Record",
      status: item.status || "UNSCANNED",
      name: item.name || "No Record",
      date: item.date,
      user_email: item.email || userEmail || "No Record",
      category: item.category || "No Record",
      ticketClass: item.ticketClass || "No Record",
      scanned_on: item?.scanned_on || "No Record",
    };

    navigation.navigate("TicketScanned", { scanResponse, eventInfo });
  };

  const renderItem = ({ item }: ListRenderItemInfo<TicketItem>) => (
    <TouchableOpacity
      style={styles.ticketContainer}
      onPress={() => handleItemPress(item)}
    >
      <View>
        <Text style={styles.ticketheading}>Ticket ID</Text>
        <Text style={styles.ticketId}>{item.ticket_number}</Text>
        <Text style={styles.ticketType}>Category</Text>
        <Text style={styles.ticketId}>{item.category}</Text>
      </View>
      <View style={styles.statusAndDateContainer}>
        <TouchableOpacity
          style={[
            styles.statusButton,
            item.status === "SCANNED" && styles.scannedButton,
            item.status !== "SCANNED" && styles.checkInButton,
          ]}
          onPress={() => {
            if (item.status !== "SCANNED") {
              handleStatusChange(item);
            } else {
              Alert.alert("Already Scanned.");
              logger.log("Ticket is already scanned.");
            }
          }}
        >
          <Text
            style={[
              styles.statusButtonText,
              item.status === "SCANNED" && styles.scannedText,
              item.status !== "SCANNED" && styles.checkInText,
            ]}
          >
            {item.status === "SCANNED" ? "Scanned" : "Check-in"}
          </Text>
        </TouchableOpacity>
        <Text style={styles.ticketDateheading}>Class</Text>
        <Text style={styles.ticketId}>{item.ticketClass}</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <>
      <FlatList
        data={ticketslist}
        renderItem={renderItem}
        keyExtractor={(item) => item.uuid}
      />

      <SuccessPopup
        visible={showSuccessPopup}
        onClose={handleCloseSuccessPopup}
        title={isQueued ? "Check-In Queued" : "Check-In Successful"}
        subtitle={
          isQueued
            ? "Check-in will sync when you're back online"
            : "Ticket checked in successfully"
        }
      />

      <ErrorPopup
        visible={showErrorPopup}
        onClose={handleCloseErrorPopup}
        title="Check-In Failed"
        subtitle={
          errorMessage ||
          "We couldn't check in this ticket. Please try again or contact support."
        }
      />
    </>
  );
};

export default CheckInAllPopup;
