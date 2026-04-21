import React from "react";
import { SafeAreaView, ScrollView, Text, View } from "react-native";
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

const TicketScanned: React.FC<{ route: any }> = ({ route }) => {
  const {
    scanResponse,
    eventUuid,
    eventInfo: legacyEventInfo,
    note,
    eventId,
  } = route.params;

  const displayedNote = note || scanResponse?.note || "No note added";

  const eventInfoCache = useSelector(
    (state: RootState) => state.manualCheckin.eventInfoCache,
  );

  // Resolve the event uuid from new or legacy params
  const resolvedUuid =
    eventUuid || eventId || legacyEventInfo?.eventUuid || legacyEventInfo?.uuid;
  const cached = resolvedUuid ? eventInfoCache[String(resolvedUuid)] : null;

  // console.log("scanResponse--->",scanResponse)

  // Prefer Redux cache, fall back to legacy eventInfo param
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

  const scannedByName =
    scanResponse?.scannedBy?.email ||
    scanResponse?.scannedBy?.name ||
    "No Record";
  const scannedByStaffId = scanResponse?.scannedBy?.staffId || "No Record";
  const scannedOn = scanResponse?.scannedBy?.scannedOn !=="No Record"
    ? formatDateTime(scanResponse.scannedBy.scannedOn)
    : "No Record";

  return (
    <SafeAreaView style={styles.container}>
      <Header eventInfo={headerEventInfo} />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.wrapper}>
          {/* TOP CARD */}
          <View style={styles.popUp}>
            <Text style={styles.labeltickets}>
              {scanResponse?.message || "No Record"}
            </Text>

            <SvgIcons.successBrownSVG
              width={81}
              height={80}
              fill="transparent"
              style={styles.successImageIcon}
            />

            <Text style={styles.userName}>
              {scanResponse?.ticketHolder || "No Record"}
            </Text>

            <Text style={styles.userEmail}>
              {scanResponse?.ticketHolderEmail || "No Record"}
            </Text>

            <Text style={styles.userPurchaseDate}>
              Purchase Date: {scanResponse?.formattedCreatedAt || "No Record"}
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
                  {scanResponse?.ticketCategory || "No Record"}
                </Typography>

                <Text style={[styles.values, styles.marginTop10]}>Class</Text>
                <Typography style={[styles.value, styles.marginTop10]}>
                  {scanResponse?.ticketClass || "No Record"}
                </Typography>

                <Text style={[styles.values, styles.marginTop10]}>
                  Ticket ID
                </Text>
                <Text style={[styles.ticketNumber, styles.marginTop10]}>
                  {scanResponse?.ticketNumber || "No Record"}
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
                  {scannedByStaffId || "No Record"}
                </Text>

                <Text style={[styles.values, styles.marginTop10]}>Price</Text>
                <Text style={[styles.value, styles.marginTop10]}>
                  {scanResponse?.currency || "GHS"}{" "}
                  {scanResponse?.ticketPrice || "No Record"}
                </Text>

                <Text style={[styles.values, styles.marginTop10]}>
                  Scan Count
                </Text>
                <Text style={[styles.valueScanCount, styles.marginTop9]}>
                  {scanResponse?.scanCount || "No Record"}
                </Text>
              </View>
            </View>
          </View>

          {/* NOTE CARD */}
          <View style={styles.noteContainer}>
            <Text style={styles.LabelNote}>Note</Text>
            <Text style={styles.noteDescription}>{displayedNote}</Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default TicketScanned;
