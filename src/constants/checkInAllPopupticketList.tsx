import React, { useState } from "react";
import {
  Text,
  View,
  FlatList,
  TouchableOpacity,
  Alert,
  ListRenderItemInfo,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { useDispatch, useSelector } from "react-redux";
import { manualCheckinTicketThunk } from "../redux/reducers/manualCheckinSlice";
import { AppDispatch } from "../redux/store";
import { RootState } from "../redux/reducers/rootReducer";
import SuccessPopup from "./SuccessPopup";
import ErrorPopup from "./ErrorPopup";
import { logger } from "../utils/logger";
import { styles } from "./checkInAllPopupticketList.styles";

// ─── Types ────────────────────────────────────────────────────────────────────

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
}

// ─── Component ────────────────────────────────────────────────────────────────

const CheckInAllPopup: React.FC<CheckInAllPopupProps> = ({ ticketslist }) => {

  const navigation = useNavigation<any>();
  const dispatch = useDispatch<AppDispatch>();
  const checkingInCode = useSelector(
    (state: RootState) => state.manualCheckin.checkingInCode,
  );

  const [showSuccessPopup, setShowSuccessPopup] = useState(false);
  const [showErrorPopup, setShowErrorPopup] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleStatusChange = async (ticket: TicketItem) => {
    try {
      logger.log("Sending:", ticket.eventUuid, ticket.code);
      await dispatch(
        manualCheckinTicketThunk({
          eventUuid: ticket.eventUuid!,
          code: ticket.code!,
        }),
      ).unwrap();
      setShowSuccessPopup(true);
    } catch (error: any) {
      const msg =
        error?.message ||
        "We couldn't check in this ticket. Please try again or contact support.";
      setErrorMessage(msg);
      setShowErrorPopup(true);
    }
  };

  const handleItemPress = (item: TicketItem) => {
    const scanResponse = {
      message:
        item.message ||
        (item.status === "SCANNED" ? "Ticket Scanned" : "Ticket Unscanned"),
      ticketHolder:
        item.ticketHolder || item.ticket_holder || item.name || "No Record",
      ticketHolderEmail: item.ticket_holder_email || "No Record",
      formattedCreatedAt: item.date || "No Record",
      ticketCategory: item.category || "No Record",
      ticketClass: item.ticketClass || "No Record",
      ticketNumber: item.ticket_number || item.order_number || "No Record",
      scannedBy: {
        name: item.scanned_by?.name ,
        email: item.scanned_by?.email ,
        staffId:
          (typeof item.scanned_by === "object" && item.scanned_by?.staff_id) ||
          "No Record",
        scannedOn: item?.scanned_by?.scanned_on || "No Record",
      },

      currency: item.currency || "GHS",
      ticketPrice: item.price || item.ticket_price || "No Record",
      scanCount: item.scanCount || item.scan_count || 0,
      note: item.note || "No note added",
    };

    //  console.log("scanResponse-->",scanResponse)

    navigation.navigate("TicketScanned", {
      scanResponse,
      eventUuid: item.eventUuid,
      note: item.note || "No note added",
    });
  };

  const renderItem = ({ item }: ListRenderItemInfo<TicketItem>) => {
    const isLoadingThis = checkingInCode === item.code;

    return (
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
            disabled={isLoadingThis}
            onPress={() => {
              if (item.status !== "SCANNED") {
                handleStatusChange(item);
              } else {
                Alert.alert("Already Scanned.");
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
              {isLoadingThis
                ? "..."
                : item.status === "SCANNED"
                ? "Scanned"
                : "Check-in"}
            </Text>
          </TouchableOpacity>
          <Text style={styles.ticketDateheading}>Class</Text>
          <Text style={styles.ticketId}>{item.ticketClass}</Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <>
      <FlatList
        data={ticketslist}
        renderItem={renderItem}
        keyExtractor={(item) => item.uuid}
      />

      <SuccessPopup
        visible={showSuccessPopup}
        onClose={() => setShowSuccessPopup(false)}
        title="Check-In Successful"
        subtitle="Ticket checked in successfully"
      />

      <ErrorPopup
        visible={showErrorPopup}
        onClose={() => {
          setShowErrorPopup(false);
          setErrorMessage(null);
        }}
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
