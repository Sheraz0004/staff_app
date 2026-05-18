import React, { useCallback, useEffect, useState } from "react";
import { Keyboard, SafeAreaView, ScrollView, Text, View } from "react-native";
import Header from "../../components/header";
import SvgIcons from "../../components/SvgIcons";
import Typography from "../../components/Typography";
import {
  formatDateTime,
  formatDateWithMonthName,
} from "../../constants/dateAndTime";
import { truncateStaffName } from "../../utils/stringUtils";
import { useSelector } from "react-redux";
import { RootState } from "../../redux/reducers/rootReducer";
import { styles } from "./index.styles";
import { TICKET_SERVICES } from "../../services/TicketService";
import { logger } from "../../utils/logger";
import Loader from "@/src/components/Loader/Loader";

interface TicketDetailsResponse {
  ticketHolder?: string;
  ticketHolderEmail?: string | null;
  ticketHolderPhone?: string | null;
  scannedBy?: {
    email?: string;
    name?: string | null;
    scannedOn?: string;
    staffId?: string;
  };
  scanCount?: number;
  ticketNumber?: string;
  eventId?: number;
  ticket?: string;
  ticketClass?: string;
  ticketPrice?: number;
  currency?: string;
  status?: string;
  note?: string | null;
  purchaseDate?: string;
  // legacy fallback fields from paramScanResponse
  message?: string;
  ticketCategory?: string;
  formattedCreatedAt?: string;
}

const TicketScanned: React.FC<{ route: any }> = ({ route }) => {
  const {
    scanResponse: paramScanResponse,
    eventUuid,
    eventInfo: legacyEventInfo,
    note: paramNote,
    eventId,
  } = route.params;

  const [ticketDetails, setTicketDetails] =
    useState<TicketDetailsResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const ticketNumber = paramScanResponse?.ticketNumber;
  console.log("paramScanResponse-->",paramScanResponse)

  const fetchDetails = useCallback(async () => {
    if (!ticketNumber) {
      logger.warn("[TicketScanned] No ticketNumber available — skipping fetch");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      logger.log(
        "[TicketScanned] Fetching details for ticketNumber:",
        ticketNumber,
      );

      const response = await TICKET_SERVICES.fetchTicketDetails(ticketNumber);

      logger.log("[TicketScanned] Raw response:", response);

      // Service returns response.data directly; some endpoints wrap in { data: {...} }
      const data: TicketDetailsResponse = response?.data ?? response;

      setTicketDetails(data);
    } catch (err: any) {
      const message =
        err?.message ||
        err?.response?.data?.message ||
        "Failed to load ticket details.";

      logger.error("[TicketScanned] Error fetching ticket details:", {
        ticketNumber,
        status: err?.response?.status,
        message,
        responseData: err?.response?.data,
      });

      setError(message);
    } finally {
      setLoading(false);
    }
  }, [ticketNumber]);

  useEffect(() => {
    Keyboard.dismiss();
  }, []);

  useEffect(() => {
    fetchDetails();
  }, [fetchDetails]);

  const data: TicketDetailsResponse = ticketDetails ?? paramScanResponse ?? {};
  const displayMessage = data.status
    ? `Ticket ${data.status.charAt(0).toUpperCase()}${data.status.slice(1).toLowerCase()}`
    : data.message || "No Record";
  const displayCategory = data.ticket || data.ticketCategory || "No Record";
  const displayClass = data.ticketClass || "No Record";
  const displayPurchaseDate = data.purchaseDate
    ? formatDateTime(data.purchaseDate)
    : data.formattedCreatedAt || "No Record";
  const displayContact = data.ticketHolderEmail || data.ticketHolderPhone || "No Record";

  const displayNote = paramNote || data.note || "No note added";

  const scannedByName =
    data.scannedBy?.email || data.scannedBy?.name || "No Record";
  const scannedByStaffId = data.scannedBy?.staffId || "No Record";
  const scannedOn =
    data.scannedBy?.scannedOn && data.scannedBy.scannedOn !== "No Record"
      ? formatDateTime(data.scannedBy.scannedOn)
      : "No Record";

  const eventInfoCache = useSelector(
    (state: RootState) => state.manualCheckin.eventInfoCache,
  );

  const resolvedUuid =
    eventUuid || eventId || legacyEventInfo?.eventUuid || legacyEventInfo?.uuid;
  const cached = resolvedUuid ? eventInfoCache[String(resolvedUuid)] : null;

  const eventTitle = cached?.event_title || legacyEventInfo?.event_title;
  const eventDate = cached?.date || legacyEventInfo?.date;
  const eventTime = cached?.time || legacyEventInfo?.time;
  const eventCity = cached?.cityName || legacyEventInfo?.cityName;

  const headerEventInfo = cached
    ? {
        event_title: cached.event_title,
        date: cached.date,
        time: cached.time,
        cityName: cached.cityName,
        eventUuid: cached.eventUuid,
      }
    : legacyEventInfo;

  if (error && !ticketDetails) {
    return (
      <SafeAreaView style={styles.container}>
        <Header eventInfo={headerEventInfo} />
        <View
          style={{
            flex: 1,
            justifyContent: "center",
            alignItems: "center",
            paddingHorizontal: 24,
          }}
        >
          <Text style={{ textAlign: "center", color: "#888", fontSize: 14 }}>
            {error}
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Header eventInfo={headerEventInfo} />
      <Loader isLoading={loading} />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.wrapper}>
          {/* TOP CARD */}
          <View style={styles.popUp}>
            <Text style={styles.labeltickets}>{displayMessage}</Text>

            <SvgIcons.successBrownSVG
              width={81}
              height={80}
              fill="transparent"
              style={styles.successImageIcon}
            />

            <Text style={styles.userName}>
              {data.ticketHolder || "No Record"}
            </Text>

            <Text style={styles.userEmail}>
              {displayContact}
            </Text>

            <Text style={styles.userPurchaseDate}>
              Purchase Date: {displayPurchaseDate}
            </Text>
          </View>

          {/* EVENT DETAILS CARD */}
          {(eventTitle || eventDate) && (
            <View style={styles.ticketContainer}>
              <View style={styles.row}>
                <View style={styles.leftColumnContent}>
                  <Text style={styles.values}>Event</Text>
                  <Typography style={[styles.value, styles.marginTop10]}>
                    {eventTitle || "No Record"}
                  </Typography>
                  {eventCity && (
                    <>
                      <Text style={[styles.values, styles.marginTop10]}>
                        Location
                      </Text>
                      <Text style={[styles.valueScanCount, styles.marginTop10]}>
                        {eventCity}
                      </Text>
                    </>
                  )}
                </View>
                <View style={styles.rightColumnContent}>
                  <Text style={styles.values}>Date</Text>
                  <Text style={[styles.valueScanCount, styles.marginTop8]}>
                    {formatDateWithMonthName(eventDate) || "No Record"}
                  </Text>
                  <Text style={[styles.values, styles.marginTop10]}>Time</Text>
                  <Text style={[styles.valueScanCount, styles.marginTop8]}>
                    {eventTime || "No Record"}
                  </Text>
                </View>
              </View>
            </View>
          )}

          {/* TICKET INFO CARD */}
          <View style={styles.ticketContainer}>
            <View style={styles.row}>
              <View style={styles.leftColumnContent}>
                <Text style={styles.values}>Category</Text>
                <Typography style={[styles.value, styles.marginTop10]}>
                  {displayCategory}
                </Typography>

                <Text style={[styles.values, styles.marginTop10]}>Class</Text>
                <Typography style={[styles.value, styles.marginTop10]}>
                  {displayClass}
                </Typography>

                <Text style={[styles.values, styles.marginTop10]}>
                  Ticket ID
                </Text>
                <Text style={[styles.ticketNumber, styles.marginTop10]}>
                  {data.ticketNumber || "No Record"}
                </Text>

                <Text style={styles.values}>Last Scanned On</Text>
                <Text style={[styles.valueScanCount, styles.marginTop10]}>
                  {scannedOn}
                </Text>
              </View>

              <View style={styles.rightColumnContent}>
                <Text style={styles.values}>Scanned By</Text>
                <Text style={[styles.valueScanCount, styles.marginTop8]}>
                  {truncateStaffName(scannedByName) || "No Record"}
                </Text>

                <Text style={[styles.values, styles.marginTop10]}>
                  Staff ID
                </Text>
                <Text style={[styles.valueScanCount, styles.marginTop8]}>
                  {scannedByStaffId}
                </Text>

                <Text style={[styles.values, styles.marginTop10]}>Price</Text>
                <Text style={[styles.value, styles.marginTop10]}>
                  {data.currency || "GHS"} {data.ticketPrice || "No Record"}
                </Text>

                <Text style={[styles.values, styles.marginTop10]}>
                  Scan Count
                </Text>
                <Text style={[styles.valueScanCount, styles.marginTop9]}>
                  {data.scanCount ?? "No Record"}
                </Text>
              </View>
            </View>
          </View>

          {/* NOTE CARD */}
          <View style={styles.noteContainer}>
            <Text style={styles.LabelNote}>Note</Text>
            <Text style={styles.noteDescription}>{displayNote}</Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default TicketScanned;
