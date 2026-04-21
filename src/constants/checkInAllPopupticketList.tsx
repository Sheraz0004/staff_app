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
  order_number?: string;
  category: string;
  status: string;
  message?: string;
  ticketClass?: string;
  eventUuid?: number | string;
  code?: string;
  ticket_holder?: string;
  ticketHolder?: string;
  ticket_type?: string;
  type?: string;
  currency?: string;
  ticket_price?: number | string;
  price?: number | string;
  last_scan?: string | null;
  last_scanned_on?: string | null;
  lastScannedByName?: string | null;
  scanned_by?: ScannedBy | string | null;
  staff_id?: string;
  scan_count?: number;
  scanCount?: number;
  note?: string | null;
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
      setIsQueued(false);
      if (response?.status === "SCANNED") {
        const scannedByFromResponse = response?.scanned_by;
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
      message: item.message || (item.status === "SCANNED" ? "Ticket Scanned" : "Ticket Unscanned"),
      ticketHolder: item.ticketHolder || item.ticket_holder || item.name || "No Record",
      ticketHolderEmail: item.ticket_holder_email || "No Record",
      formattedCreatedAt: item.date || "No Record",
      ticketCategory: item.category || "No Record",
      ticketClass: item.ticketClass || "No Record",
      ticketNumber: item.ticket_number || item.order_number || "No Record",
      scannedBy: {
        name: item.lastScannedByName || "No Record",
        email: item.scanned_by_email || "No Record",
        staffId: "No Record",
        scannedOn: item.last_scanned_on || "No Record",
      },
      currency: item.currency || "GHS",
      ticketPrice: item.price || item.ticket_price || "No Record",
      scanCount: item.scanCount || item.scan_count || 0,
      note: item.note || "No note added",
    };
    console.log({item})

    navigation.navigate("TicketScanned", {
      scanResponse,
      eventInfo,
      note: item.note || "No note added",
    });
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
