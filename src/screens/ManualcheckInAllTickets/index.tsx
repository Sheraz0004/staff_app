import {
  View,
  Text,
  TouchableOpacity,
  SafeAreaView,
  ActivityIndicator,
  ScrollView,
} from "react-native";
import React, { useState, useEffect } from "react";
import Header from "../../components/header";
import { color } from "../../color/color";
import SvgIcons from "../../components/SvgIcons";
import { useRoute } from "@react-navigation/native";
import CheckInAllPopup from "../../constants/checkInAllPopupticketList";
import SuccessPopup from "../../constants/SuccessPopup";
import ErrorPopup from "../../constants/ErrorPopup";
import Typography from "../../components/Typography";
import {
  formatDateTime,
  formatDateWithMonthName,
} from "../../constants/dateAndTime";
import { truncateStaffName } from "../../utils/stringUtils";
import OfflineIndicator from "../../components/OfflineIndicator";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "../../redux/reducers/rootReducer";
import { AppDispatch } from "../../redux/store";
import {
  fetchTicketDetailsThunk,
  fetchEventInfoThunk,
  manualCheckinTicketThunk,
  checkinAllTicketsThunk,
} from "../../redux/reducers/manualCheckinSlice";
import { styles } from "./index.styles";

const ManualCheckInAllTickets: React.FC = () => {
  const route = useRoute<any>();
  const { orderNumber, eventUuid } = route.params;
  const dispatch = useDispatch<AppDispatch>();

  const {
    ticketDetails,
    ticketDetailsLoading,
    ticketDetailsError,
    currentOrderNumber,
    checkingInCode,
    checkingInAll,
    eventInfoCache,
  } = useSelector((state: RootState) => state.manualCheckin);

  console.log("ticketDetails--->",ticketDetails)

  const [showSuccessPopup, setShowSuccessPopup] = useState(false);
  const [showErrorPopup, setShowErrorPopup] = useState(false);
  const [isCheckInAll, setIsCheckInAll] = useState(false);

  const eventInfo = eventInfoCache[String(eventUuid)] ?? null;

  useEffect(() => {
    dispatch(fetchEventInfoThunk(String(eventUuid)));
    // Skip fetch if data was already preloaded from the search screen for this order
    const alreadyLoaded =
      currentOrderNumber === String(orderNumber) && ticketDetails.length > 0;
    if (!alreadyLoaded) {
      dispatch(fetchTicketDetailsThunk({ orderNumber, eventUuid }));
    }
  }, [orderNumber, eventUuid]);

  // Derived state — no useState needed
  const first = ticketDetails[0];
  const userDetails = first
    ? {
        purchaseDate: first.formatted_date,
        name:
          `${first.user_first_name || ""} ${first.user_last_name || ""}`.trim() ||
          "No Record",
        email: first.user_email || "No Record",
      }
    : null;

  const total = ticketDetails.length;
  const checkInSuccess = ticketDetails.some(
    (t) => t.checkin_status === "SCANNED",
  );
  const allCheckedIn =
    total > 0 && ticketDetails.every((t) => t.checkin_status === "SCANNED");

  const handleSingleCheckIn = async () => {
    if (total !== 1) return;
    try {
      await dispatch(
        manualCheckinTicketThunk({ eventUuid, code: ticketDetails[0].code }),
      ).unwrap();
      setIsCheckInAll(false);
      setShowSuccessPopup(true);
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
    } catch {
      setShowErrorPopup(true);
    }
  };

  if (ticketDetailsLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <Header eventInfo={eventInfo} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={color.btnBrown_AE6F28} />
        </View>
      </SafeAreaView>
    );
  }

  if (ticketDetailsError) {
    return (
      <SafeAreaView style={styles.container}>
        <Header eventInfo={eventInfo} />
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>
            Failed to load tickets. Please go back and try again.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (ticketDetails.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <Header eventInfo={eventInfo} />
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>
            No ticket details found for this order.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  const isCheckingIn = checkingInCode === ticketDetails[0]?.code;

  return (
    <SafeAreaView style={styles.container}>
      <Header eventInfo={eventInfo} />
      <OfflineIndicator />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.wrapper}>
          {/* TOP CARD */}
          <View style={styles.popUp}>
            <SvgIcons.successBrownSVG
              width={81}
              height={80}
              fill="transparent"
              style={styles.successImageIcon}
            />
            <Text style={styles.userName}>{userDetails?.name}</Text>
            <Text style={styles.ticketHolder}>{userDetails?.email}</Text>
            <Text style={styles.ticketPurchaseDate}>
              Purchase Date: {userDetails?.purchaseDate}
            </Text>

            {total === 1 && (
              <TouchableOpacity
                style={[styles.button, checkInSuccess && styles.buttonQueued]}
                onPress={handleSingleCheckIn}
                disabled={isCheckingIn || checkInSuccess}
              >
                {isCheckingIn ? (
                  <ActivityIndicator color={color.btnTxt_FFF6DF} />
                ) : (
                  <Text style={styles.buttonText}>
                    {checkInSuccess ? "Scanned" : "Check-In"}
                  </Text>
                )}
              </TouchableOpacity>
            )}

            {total > 1 && (
              <TouchableOpacity
                style={[styles.button, allCheckedIn && styles.buttonQueued]}
                onPress={handleCheckInAll}
                disabled={checkingInAll || allCheckedIn}
              >
                {checkingInAll ? (
                  <ActivityIndicator color={color.btnTxt_FFF6DF} />
                ) : (
                  <Text style={styles.buttonText}>
                    {allCheckedIn ? "All Scanned" : "Check-In All"}
                  </Text>
                )}
              </TouchableOpacity>
            )}
          </View>

          {/* EVENT DETAILS CARD */}
          {(eventInfo?.event_title || eventInfo?.date) && (
            <View style={styles.ticketContainer}>
              <View style={styles.row}>
                <View style={styles.leftColumnContent}>
                  <Text style={styles.values}>Event</Text>
                  <Text style={[styles.valueScanCount, styles.marginTop10]}>
                    {eventInfo?.event_title || "No Record"}
                  </Text>
                  {eventInfo?.cityName && (
                    <>
                      <Text style={[styles.values, styles.marginTop10]}>
                        Location
                      </Text>
                      <Text style={[styles.valueScanCount, styles.marginTop10]}>
                        {eventInfo.cityName}
                      </Text>
                    </>
                  )}
                </View>
                <View style={styles.rightColumnContent}>
                  <Text style={styles.values}>Date</Text>
                  <Text style={[styles.valueScanCount, styles.marginTop8]}>
                    {formatDateWithMonthName(eventInfo?.date) || "No Record"}
                  </Text>
                  <Text style={[styles.values, styles.marginTop10]}>Time</Text>
                  <Text style={[styles.valueScanCount, styles.marginTop8]}>
                    {eventInfo?.time || "No Record"}
                  </Text>
                </View>
              </View>
            </View>
          )}

          {/* SINGLE TICKET DETAILS */}
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
                    {ticketDetails[0]?.category || "No Record"}
                  </Typography>
                  <Text style={[styles.values, styles.marginTop10]}>Class</Text>
                  <Typography
                    style={[styles.value, styles.marginTop10]}
                    weight="400"
                    size={14}
                    color={color.brown_3C200A}
                  >
                    {ticketDetails[0]?.ticket_class || "No Record"}
                  </Typography>
                  <Text style={[styles.values, styles.marginTop10]}>
                    Ticket ID
                  </Text>
                  <Text style={[styles.ticketNumber, styles.marginTop10]}>
                    {ticketDetails[0]?.ticket_number || "No Record"}
                  </Text>
                  <Text style={styles.values}>Last Scanned On</Text>
                  <Text style={[styles.valueScanCount, styles.marginTop10]}>
                    {formatDateTime(
                      ticketDetails[0]?.scanned_by?.scanned_on ?? "",
                    ) || "No Record"}
                  </Text>
                </View>
                <View style={styles.rightColumnContent}>
                  <Text style={styles.values}>Scanned By</Text>
                  <Text style={[styles.valueScanCount, styles.marginTop8]}>
                    {truncateStaffName(ticketDetails[0]?.scanned_by?.email) ||
                      "No Record"}
                  </Text>
                  <Text style={[styles.values, styles.marginTop10]}>
                    Staff ID
                  </Text>
                  <Text style={[styles.valueScanCount, styles.marginTop8]}>
                    {ticketDetails[0]?.scanned_by?.staff_id || "No Record"}
                  </Text>
                  <Text style={[styles.values, styles.marginTop10]}>Price</Text>
                  <Text style={[styles.value, styles.marginTop10]}>
                    {ticketDetails[0]?.currency || "GHS"}{" "}
                    {ticketDetails[0]?.ticket_price || "No Record"}
                  </Text>
                  <Text style={[styles.values, styles.marginTop10]}>
                    Scan Count
                  </Text>
                  <Text style={[styles.valueScanCount, styles.marginTop9]}>
                    {ticketDetails[0]?.scan_count || "No Record"}
                  </Text>
                </View>
              </View>
            </View>
          )}

          {/* NOTE — single ticket only */}
          {total === 1 && (
            <View style={styles.noteContainer}>
              <Text style={styles.LabelNote}>Note</Text>
              <Text style={styles.noteDescription}>
                {ticketDetails[0]?.note || "No note added"}
              </Text>
            </View>
          )}

          {/* MULTI-TICKET LIST */}
          {total > 1 && (
            <View style={styles.ticketsList}>
              <CheckInAllPopup
                ticketslist={ticketDetails.map((ticket) => ({
                  order_number: ticket.ticket_number,
                  type: ticket.ticket_type,
                  price: ticket.ticket_price,
                  date: ticket.formatted_date,
                  status: ticket.checkin_status,
                  code: ticket.code,
                  note: ticket.note ?? undefined,
                  uuid: ticket.uuid,
                  eventUuid: eventUuid,
                  message: ticket.message ?? undefined,
                  last_scanned_on: ticket.last_scanned_on,
                  scanCount: ticket.scan_count,
                  ticketHolder: ticket.ticket_holder,
                  lastScannedByName: ticket.last_scanned_by_name ?? undefined,
                  currency: ticket.currency,
                  ticket_number: ticket.ticket_number,
                  name:
                    `${ticket.user_first_name || ""} ${ticket.user_last_name || ""}`.trim() ||
                    "No Record",
                  category: ticket.category || "No Record",
                  ticketClass: ticket.ticket_class || "No Record",
                  scanned_by: ticket.scanned_by,
                    // ? {
                    //     name: ticket.scanned_by.name,
                    //     staff_id: String(ticket.scanned_by.staff_id),
                    //     scanned_on: ticket.scanned_by.scanned_on,
                    //     email: ticket.scanned_by.email,
                    //   }
                    // : null,
                  // scanned_on: ticket.scanned_by?.scanned_on || "No Record",
                  ticket_holder_email:ticket?.user_email
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
      </ScrollView>
    </SafeAreaView>
  );
};

export default ManualCheckInAllTickets;
