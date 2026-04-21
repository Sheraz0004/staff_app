import React, { useState, useEffect } from "react";
import { SafeAreaView, Text, View } from "react-native";
import Header from "../../components/header";
import SvgIcons from "../../components/SvgIcons";
import Typography from "../../components/Typography";
import { formatDateTime, formatDateWithMonthName } from "../../constants/dateAndTime";
import { truncateStaffName } from "../../utils/stringUtils";
import { useApi } from "../../services/useApi";
import { EVENT_SERVICES } from "../../services/EventService";
import { styles } from "./index.styles";

interface TicketScannedProps {
  route: any;
}

const TicketScanned: React.FC<TicketScannedProps> = ({ route }) => {
  const {
    scanResponse,
    eventInfo,
    note,
    eventId,
  }: { scanResponse: any; eventInfo: any; note: any; eventId?: string } = route.params;
  const displayedNote = note || scanResponse?.note || "No note added";

  const { requestCall: requestEventInfo } = useApi(EVENT_SERVICES.fetchEventInfo, false, false);
  const [fetchedEvent, setFetchedEvent] = useState<any>(null);

  useEffect(() => {
    const id = eventId || eventInfo?.eventUuid;
    if (!id) return;
    requestEventInfo(String(id))
      .then((res: any) => {
        const info = res?.data;
        if (info) {
          setFetchedEvent({
            title: info?.eventTitle || info?.event_title,
            date: info?.startDate || info?.start_date,
            time: info?.startTime || info?.start_time,
            city: info?.location?.city,
          });
        }
      })
      .catch(() => {});
  }, [eventId]);

  const eventTitle = fetchedEvent?.title || eventInfo?.event_title;
  const eventDate = fetchedEvent?.date || eventInfo?.date;
  const eventTime = fetchedEvent?.time || eventInfo?.time;
  const eventCity = fetchedEvent?.city || eventInfo?.cityName;
  // Safely extract scanned by data
  const scannedByName: any =
    scanResponse?.scannedBy?.name ||
    scanResponse?.scannedBy?.email ||
    "No Record";

  const scannedByStaffId: any = scanResponse?.scannedBy?.staffId || "No Record";

  const scannedOn: any = scanResponse?.scannedBy?.scannedOn
    ? formatDateTime(scanResponse?.scannedBy?.scannedOn)
    : "No Record";

  console.log("route---->", route.params);

  return (
    <SafeAreaView style={styles.container}>
      <Header eventInfo={eventInfo} />

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
                    <Text style={[styles.values, styles.marginTop10]}>Location</Text>
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
            {/* LEFT COLUMN */}
            <View style={styles.leftColumnContent}>
              <Text style={styles.values}>Category</Text>
              <Typography style={[styles.value, styles.marginTop10]}>
                {scanResponse?.ticketCategory || "No Record"}
              </Typography>

              <Text style={[styles.values, styles.marginTop10]}>Class</Text>
              <Typography style={[styles.value, styles.marginTop10]}>
                {scanResponse?.ticketClass || "No Record"}
              </Typography>

              <Text style={[styles.values, styles.marginTop10]}>Ticket ID</Text>
              <Text style={[styles.ticketNumber, styles.marginTop10]}>
                {scanResponse?.ticketNumber || "No Record"}
              </Text>

              <Text style={[styles.values]}>Last Scanned On</Text>
              <Text style={[styles.valueScanCount, styles.marginTop10]}>
                {scannedOn}
              </Text>
            </View>

            {/* RIGHT COLUMN */}
            <View style={styles.rightColumnContent}>
              <Text style={styles.values}>Scanned By</Text>
              <Text style={[styles.valueScanCount, styles.marginTop8]}>
                {truncateStaffName(scannedByName) || "No Record"}
              </Text>

              <Text style={[styles.values, styles.marginTop10]}>Staff ID</Text>
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
    </SafeAreaView>
  );
};

export default TicketScanned;
