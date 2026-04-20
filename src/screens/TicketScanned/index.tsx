import React from "react";
import { Text, View, SafeAreaView } from "react-native";
import { color } from "../../color/color";
import Header from "../../components/header";
import SvgIcons from "../../components/SvgIcons";
import { useNavigation } from "@react-navigation/native";
import { formatDateTime } from "../../constants/dateAndTime";
import Typography from "../../components/Typography";
import { truncateStaffName } from "../../utils/stringUtils";
import { styles } from "./index.styles";

interface TicketScannedProps {
  route: any;
}

const TicketScanned: React.FC<TicketScannedProps> = ({ route }) => {
  const {
    scanResponse,
    eventInfo,
    note,
  }: { scanResponse: any; eventInfo: any; note: any } = route.params;
  const navigation = useNavigation();
  const displayedNote = note || scanResponse?.note || "No note added";
  // Safely extract scanned by data
  const scannedByName: any =
    scanResponse?.scannedBy?.name || scanResponse?.scannedBy?.email || "No Record";

  const scannedByStaffId: any = scanResponse?.scannedBy?.staffId || "No Record";

  const scannedOn: any = scanResponse?.scannedBy?.scannedOn
    ? formatDateTime(scanResponse?.scannedBy?.scannedOn)
    : "No Record";

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
