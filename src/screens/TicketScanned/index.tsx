import React from 'react';
import { Text, View, SafeAreaView } from 'react-native';
import { color } from '../color/color';
import Header from '../components/header';
import SvgIcons from '../components/SvgIcons';
import { useNavigation } from '@react-navigation/native';
import { formatDateTime } from '../constants/dateAndTime';
import Typography from '../components/Typography';
import { truncateStaffName } from '../utils/stringUtils';
import { styles } from './TicketScanned.styles';

interface TicketScannedProps {
  route: any;
}

const TicketScanned: React.FC<TicketScannedProps> = ({ route }) => {
  const { scanResponse, eventInfo, note }: { scanResponse: any; eventInfo: any; note: any } = route.params;
  const navigation = useNavigation();

  const displayedNote = note || scanResponse?.note || 'No note added';

  // Safely extract scanned by data
  const scannedByName: any =
    typeof scanResponse?.scanned_by === 'object'
      ? scanResponse?.scanned_by?.name
      : scanResponse?.scanned_by;

  const scannedByStaffId: any =
    typeof scanResponse?.scanned_by === 'object'
      ? scanResponse?.scanned_by?.staff_id
      : scanResponse?.staff_id;

  const scannedOn: any = scanResponse?.scanned_on
    ? formatDateTime(scanResponse?.scanned_on)
    : 'No Record';

  return (
    <SafeAreaView style={styles.container}>
      <Header eventInfo={eventInfo} />

      <View style={styles.wrapper}>
        {/* TOP CARD */}
        <View style={styles.popUp}>
          <Text style={styles.labeltickets}>
            {scanResponse?.message || 'No Record'}
          </Text>

          <SvgIcons.successBrownSVG
            width={81}
            height={80}
            fill="transparent"
            style={styles.successImageIcon}
          />

          <Text style={styles.userName}>
            {scanResponse?.name || 'No Record'}
          </Text>

          <Text style={styles.userEmail}>
            {scanResponse?.user_email || 'No Record'}
          </Text>

          <Text style={styles.userPurchaseDate}>
            Purchase Date: {scanResponse?.date || 'No Record'}
          </Text>
        </View>

        {/* TICKET INFO CARD */}
        <View style={styles.ticketContainer}>
          <View style={styles.row}>
            {/* LEFT COLUMN */}
            <View style={styles.leftColumnContent}>
              <Text style={styles.values}>Category</Text>
              <Typography style={[styles.value, styles.marginTop10]}>
                {scanResponse?.category || 'No Record'}
              </Typography>

              <Text style={[styles.values, styles.marginTop10]}>Class</Text>
              <Typography style={[styles.value, styles.marginTop10]}>
                {scanResponse?.ticketClass || 'No Record'}
              </Typography>

              <Text style={[styles.values, styles.marginTop10]}>Ticket ID</Text>
              <Text style={[styles.ticketNumber, styles.marginTop10]}>
                {scanResponse?.ticket_number || 'No Record'}
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
                {truncateStaffName(scannedByName) || 'No Record'}
              </Text>

              <Text style={[styles.values, styles.marginTop10]}>
                Staff ID
              </Text>
              <Text style={[styles.valueScanCount, styles.marginTop8]}>
                {scannedByStaffId || 'No Record'}
              </Text>

              <Text style={[styles.values, styles.marginTop10]}>
                Price
              </Text>
              <Text style={[styles.value, styles.marginTop10]}>
                {scanResponse?.currency || 'GHS'}{' '}
                {scanResponse?.ticket_price || 'No Record'}
              </Text>

              <Text style={[styles.values, styles.marginTop10]}>
                Scan Count
              </Text>
              <Text style={[styles.valueScanCount, styles.marginTop9]}>
                {scanResponse?.scan_count || 'No Record'}
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
