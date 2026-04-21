import {
  View,
  Text,
  TouchableOpacity,
  SafeAreaView,
  ActivityIndicator,
} from "react-native";
import React, { useEffect, useState } from "react";
import Header from "../../components/header";
import { color } from "../../color/color";
import CheckInAllPopUp from "../../constants/checkInAllPopupticketList";
import SvgIcons from "../../components/SvgIcons";
import { useNavigation } from "@react-navigation/native";
import SuccessPopup from "../../constants/SuccessPopup";
import ErrorPopup from "../../constants/ErrorPopup";
import Typography from "../../components/Typography";
import { formatDateTime } from "../../constants/dateAndTime";
import { truncateStaffName } from "../../utils/stringUtils";
import { styles } from "./index.styles";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "../../redux/reducers/rootReducer";
import { AppDispatch } from "../../redux/store";
import {
  preloadFromLookup,
  manualCheckinTicketThunk,
  checkinAllTicketsThunk,
} from "../../redux/reducers/manualCheckinSlice";

interface CheckInAllTicketsProps {
  route: any;
}

const CheckInAllTickets: React.FC<CheckInAllTicketsProps> = ({ route }) => {
  const { totalTickets, email, orderData, eventInfo, name } = route.params;
  const navigation = useNavigation<any>();
  const dispatch = useDispatch<AppDispatch>();

  const { ticketDetails, checkingInCode, checkingInAll } = useSelector(
    (state: RootState) => state.manualCheckin,
  );
console.log("ticketDetails--->",ticketDetails)
  const [showSuccessPopup, setShowSuccessPopup] = useState<boolean>(false);
  const [showErrorPopup, setShowErrorPopup] = useState<boolean>(false);
  const [isCheckInAll, setIsCheckInAll] = useState(false);

  const initialTickets: any[] = orderData?.tickets || [];
  const eventUuid = initialTickets[0]?.eventId;
  const orderNumber = initialTickets[0]?.orderNumber;

  useEffect(() => {
    if (initialTickets.length > 0) {
      dispatch(
        preloadFromLookup({
          tickets: initialTickets,
          orderNumber: String(orderNumber || ""),
          eventUuid: String(eventUuid || ""),
        }),
      );
    }
  }, []);

  const first = ticketDetails[0];
  const total = ticketDetails.length;
  const singleScanned = ticketDetails[0]?.checkin_status === "SCANNED";
  const allCheckedIn =
    total > 0 && ticketDetails.every((t) => t.checkin_status === "SCANNED");
  const isCheckingIn = checkingInCode === ticketDetails[0]?.code;

  const handleSingleCheckIn = async () => {
    if (total !== 1) return;
    try {
      await dispatch(
        manualCheckinTicketThunk({ eventUuid, code: ticketDetails[0].code }),
      ).unwrap();
      setIsCheckInAll(false);
      setShowSuccessPopup(true);
      if (route.params?.onScanCountUpdate) route.params.onScanCountUpdate();
    } catch {
      setShowErrorPopup(true);
    }
  };

  const handleCheckInAll = async () => {
    try {
      await dispatch(
        checkinAllTicketsThunk({ eventUuid, orderNumber }),
      ).unwrap();
      setIsCheckInAll(true);
      setShowSuccessPopup(true);
      if (route.params?.onScanCountUpdate) route.params.onScanCountUpdate();
    } catch {
      setShowErrorPopup(true);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <Header eventInfo={eventInfo} />
      <View style={styles.wrapper}>
        <View style={styles.popUp}>
          {totalTickets > 1 && (
            <Text style={styles.labeltickets}>Ticket(s) Purchased</Text>
          )}
          <SvgIcons.successBrownSVG
            width={81}
            height={80}
            fill="transparent"
            style={styles.successImageIcon}
          />
          <Text style={styles.userName}>{name}</Text>
          <Text style={styles.ticketEmail}>{email}</Text>
          <Text style={styles.ticketHolder}>
            Purchase Date: {first?.formatted_date}
          </Text>

          <TouchableOpacity
            style={styles.button}
            onPress={
              totalTickets === 1 ? handleSingleCheckIn : handleCheckInAll
            }
            disabled={
              totalTickets === 1
                ? isCheckingIn || singleScanned
                : checkingInAll || allCheckedIn
            }
          >
            {(totalTickets === 1 ? isCheckingIn : checkingInAll) ? (
              <ActivityIndicator color={color.btnTxt_FFF6DF} />
            ) : (
              <Text style={styles.buttonText}>
                {totalTickets === 1
                  ? singleScanned
                    ? "Scanned"
                    : "Check-In"
                  : allCheckedIn
                    ? "All Scanned"
                    : "Check-In All"}
              </Text>
            )}
          </TouchableOpacity>
        </View>

        {/* Single ticket details */}
        {total === 1 && (
          <View style={styles.ticketContainer}>
            <View style={styles.row}>
              <View style={styles.leftColumnContent}>
                <Text style={styles.values}>Category</Text>
                <Typography
                  style={[styles.value, styles.marginTop10]}
                  weight="400"
                  size={14}
                  color={color.brown_3C200A}
                >
                  {first?.category || "No Record"}
                </Typography>
                <Text style={[styles.values, styles.marginTop10]}>Class</Text>
                <Typography
                  style={[styles.value, styles.marginTop10]}
                  weight="400"
                  size={14}
                  color={color.brown_3C200A}
                >
                  {first?.ticket_class || "No Record"}
                </Typography>
                <Text style={[styles.values, styles.marginTop10]}>
                  Ticket ID
                </Text>
                <Text style={[styles.ticketNumber, styles.marginTop10]}>
                  {first?.ticket_number || "No Record"}
                </Text>
                <Text style={[styles.values]}>Last Scanned On</Text>
                <Text style={[styles.valueScanCount, styles.marginTop10]}>
                  {formatDateTime(first?.scanned_by?.scanned_on ?? "") ||
                    "No Record"}
                </Text>
              </View>
              <View style={styles.rightColumnContent}>
                <Text style={styles.values}>Scanned By</Text>
                <Text style={[styles.valueScanCount, styles.marginTop10]}>
                  {truncateStaffName(first?.scanned_by?.name ?? "") || "No Record"}
                </Text>
                <Text style={[styles.values, styles.marginTop10]}>
                  Staff ID
                </Text>
                <Text style={[styles.valueScanCount, styles.marginTop8]}>
                  {first?.scanned_by?.staff_id || "No Record"}
                </Text>
                <Text style={[styles.values, styles.marginTop10]}>Price</Text>
                <Text style={[styles.value, styles.marginTop10]}>
                  {first?.currency || "GHS"}{" "}
                  {first?.ticket_price || "No Record"}
                </Text>
                <Text style={[styles.values, styles.marginTop10]}>
                  Scan Count
                </Text>
                <Text style={[styles.valueScanCount, styles.marginTop9]}>
                  {first?.scan_count || "No Record"}
                </Text>
              </View>
            </View>
          </View>
        )}

        {/* Note — single ticket only */}
        {total === 1 && (
          <View style={styles.noteContainer}>
            <Text style={styles.LabelNote}>Note</Text>
            <Text style={styles.noteDescription}>
              {first?.note || "No note added"}
            </Text>
          </View>
        )}

        {/* Multi-ticket list */}
        {total > 1 && (
          <View style={styles.ticketsList}>
            <CheckInAllPopUp
              ticketslist={ticketDetails.map((ticket) => ({
                id: Number(ticket.uuid) || 0,
                userEmail: ticket.user_email,
                userPhone: ticket.user_phone,
                userFirstName: ticket.user_first_name,
                userLastName: ticket.user_last_name,
                ticketPrice: ticket.ticket_price,
                ticketNumber: ticket.ticket_number,
                ticketClass: ticket.ticket_class,
                code: ticket.code,
                checkinStatus: ticket.checkin_status,
                note: ticket.note,
                orderNumber: String(orderNumber || ""),
                ticketType: ticket.ticket_type,
                category: ticket.category,
                eventId: Number(eventUuid),
                scanCount: ticket.scan_count,
                ticketHolder: ticket.ticket_holder,
                message: ticket.message || "",
                currency: ticket.currency,
                scannedBy: ticket.scanned_by
                  ? {
                      email: "",
                      name: ticket.scanned_by.name,
                      scannedOn: ticket.scanned_by.scanned_on,
                      staffId: String(ticket.scanned_by.staff_id),
                    }
                  : null,
                formattedDate: ticket.formatted_date,
              }))}
            />
          </View>
        )}
      </View>

      <SuccessPopup
        visible={showSuccessPopup}
        onClose={() => setShowSuccessPopup(false)}
        title="Check-In Successful"
        subtitle={
          isCheckInAll
            ? "Tickets checked in successfully"
            : "Ticket checked in successfully"
        }
      />
      <ErrorPopup
        visible={showErrorPopup}
        onClose={() => setShowErrorPopup(false)}
        title="Check-In Failed"
        subtitle="We couldn't check in this ticket. Please try again or contact support."
      />
    </SafeAreaView>
  );
};

export default CheckInAllTickets;
