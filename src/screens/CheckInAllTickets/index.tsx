import { View, Text, TouchableOpacity, SafeAreaView } from 'react-native';
import React, { useState } from 'react';
import Header from '../../components/header';
import { color } from '../../color/color';
import CheckInAllPopUp from '../../constants/checkInAllPopupticketList';
import SvgIcons from '../../components/SvgIcons';
import { useApi } from '../../services/useApi';
import { CHECK_IN_SERVICES } from '../../services/CheckInService';
import { useNavigation } from '@react-navigation/native';
import SuccessPopup from '../../constants/SuccessPopup';
import ErrorPopup from '../../constants/ErrorPopup';
import Typography from '../../components/Typography';
import { formatDateTime } from '../../constants/dateAndTime';
import { truncateStaffName } from '../../utils/stringUtils';
import { logger } from '../../utils/logger';
import { styles } from './index.styles';

interface CheckInAllTicketsProps {
    route: any;
}

const CheckInAllTickets: React.FC<CheckInAllTicketsProps> = ({ route }) => {
    const { totalTickets, email, orderData, eventInfo, name } = route.params;
    const initialTickets = orderData?.tickets || [];
    const [tickets, setTickets] = useState<any[]>(initialTickets);
    const [isCheckingIn, setIsCheckingIn] = useState<boolean>(false);
    const [checkInSuccess, setCheckInSuccess] = useState<boolean>(false);
    const navigation = useNavigation<any>();
    const [error, setError] = useState<string | null>(null);
    const [showSuccessPopup, setShowSuccessPopup] = useState<boolean>(false);
    const [showErrorPopup, setShowErrorPopup] = useState<boolean>(false);
    const [fallbackStaffName, setFallbackStaffName] = useState<string | null>(null);
    const [fallbackStaffId, setFallbackStaffId] = useState<string | null>(null);
    const { requestCall: doSingleCheckin } = useApi(CHECK_IN_SERVICES.manualCheckin, false, false);
    const { requestCall: doCheckinAll } = useApi(CHECK_IN_SERVICES.boxOfficeCheckinAll, false, false);
    const extractResponse = tickets[0];
    const code = extractResponse?.code;
    const eventUuid = extractResponse?.eventId;
    const orderNumber = extractResponse?.orderNumber;
    const ticketNumber = extractResponse?.ticketNumber;

    const handleSingleCheckIn = async () => {
        if (totalTickets === 1) {
            setIsCheckingIn(true);
            setError(null);
            try {
                const res = await doSingleCheckin(eventUuid, code);
                const response = res?.data;
                logger.log('Single Ticket Check-in Response:', response);

                const checkinStatus = response?.data?.checkinStatus || response?.data?.status;
                if (checkinStatus === 'SCANNED') {
                    setCheckInSuccess(true);
                    setShowSuccessPopup(true);

                    const scannedByFromResponse = response?.data?.scannedBy || response?.data?.scanned_by;
                    logger.log('Single Ticket Check-in - scannedBy from response:', scannedByFromResponse);

                    const updatedTicket: any = {
                        ...tickets[0],
                        checkinStatus: 'SCANNED',
                        status: 'SCANNED',
                    };

                    if (scannedByFromResponse) {
                        updatedTicket.scannedBy = {
                            name: scannedByFromResponse.name || 'No Record',
                            staffId: scannedByFromResponse.staffId || scannedByFromResponse.staff_id || 'No Record',
                            scannedOn: scannedByFromResponse.scannedAt || scannedByFromResponse.scannedOn || scannedByFromResponse.scanned_on || 'No Record',
                        };
                    }

                    if (response?.data?.scanCount !== undefined) {
                        updatedTicket.scanCount = response.data.scanCount;
                    }

                    setTickets([updatedTicket]);

                    // Update scan count when ticket is successfully checked in
                    if (route.params?.onScanCountUpdate) {
                        route.params.onScanCountUpdate();
                    }
                } else {
                    setShowErrorPopup(true);
                }
            } catch (err: any) {
                logger.error('Single Ticket Check-in Error:', err);
                setError(err.message || 'Failed to check in ticket.');
                setShowErrorPopup(true);
            } finally {
                setIsCheckingIn(false);
            }
        }
    };

    const handleCheckInAll = async () => {
        if (totalTickets > 1) {
            setIsCheckingIn(true);
            setError(null);
            try {
                const res = await doCheckinAll(eventUuid, orderNumber);
                const response = res?.data;
                logger.log('Check-in All Response:', response);

                if (res?.status === 200) {
                    setCheckInSuccess(true);
                    setShowSuccessPopup(true);

                    const scannedByFromResponse = response?.data?.scannedBy || response?.scannedBy
                        || response?.data?.scanned_by || response?.scanned_by;
                    logger.log('Check-in All - scannedBy from response:', scannedByFromResponse);

                    const responseTickets = response?.data?.tickets || response?.tickets
                        || response?.data?.data || null;

                    const updatedTickets = tickets.map((ticket: any, index: number) => {
                        const updatedTicket: any = {
                            ...ticket,
                            checkinStatus: 'SCANNED',
                            status: 'SCANNED',
                        };

                        const responseTicket = responseTickets?.find(
                            (t: any) => t.code === ticket.code || t.id === ticket.id
                        ) || (responseTickets && responseTickets[index]);

                        const ticketScannedBy = responseTicket?.scannedBy || responseTicket?.scanned_by;
                        if (ticketScannedBy) {
                            updatedTicket.scannedBy = {
                                name: ticketScannedBy.name || 'No Record',
                                staffId: ticketScannedBy.staffId || ticketScannedBy.staff_id || 'No Record',
                                scannedOn: ticketScannedBy.scannedAt || ticketScannedBy.scannedOn || ticketScannedBy.scanned_on || 'No Record',
                            };
                        } else if (scannedByFromResponse) {
                            updatedTicket.scannedBy = {
                                name: scannedByFromResponse.name || ticket?.scannedBy?.name || 'No Record',
                                staffId: scannedByFromResponse.staffId || scannedByFromResponse.staff_id || ticket?.scannedBy?.staffId || 'No Record',
                                scannedOn: scannedByFromResponse.scannedAt || scannedByFromResponse.scannedOn || scannedByFromResponse.scanned_on || ticket?.scannedBy?.scannedOn || 'No Record',
                            };
                        }

                        return updatedTicket;
                    });

                    setTickets(updatedTickets);

                    // Update scan count when tickets are successfully checked in
                    if (route.params?.onScanCountUpdate) {
                        route.params.onScanCountUpdate();
                    }
                } else {
                    setShowErrorPopup(true);
                }
            } catch (err: any) {
                logger.error('Check-in All Error:', err);
                setError(err.message || 'Failed to check in all tickets.');
                setShowErrorPopup(true);
            } finally {
                setIsCheckingIn(false);
            }
        }
    };

    const handleTicketStatusChange = (ticketUuid: string, newStatus: string, scannedByInfo: any = null) => {
        setTickets(prevTickets =>
            prevTickets.map(ticket =>
                (ticket.id?.toString() === ticketUuid || ticket.code === ticketUuid)
                    ? {
                        ...ticket,
                        status: newStatus,
                        checkinStatus: newStatus,
                        scannedBy: scannedByInfo ? {
                            name: scannedByInfo.name || ticket.scannedBy?.name || 'No Record',
                            staffId: scannedByInfo.staffId || scannedByInfo.staff_id || ticket.scannedBy?.staffId || 'No Record',
                            scannedOn: scannedByInfo.scannedAt || scannedByInfo.scannedOn || scannedByInfo.scanned_on || ticket.scannedBy?.scannedOn || 'No Record',
                        } : ticket.scannedBy,
                    }
                    : ticket
            )
        );
    };

    const handleCloseSuccessPopup = () => {
        setShowSuccessPopup(false);
    };

    const handleCloseErrorPopup = () => {
        setShowErrorPopup(false);
    };

    return (
        <SafeAreaView style={styles.container}>

            <Header eventInfo={eventInfo} />
            <View style={styles.wrapper}>
                <View style={styles.popUp}>
                    {totalTickets > 1 && <Text style={styles.labeltickets}>Ticket(s) Purchased</Text>}
                    <SvgIcons.successBrownSVG width={81} height={80} fill="transparent" style={styles.successImageIcon} />
                    {/* <Text style={styles.ticketHolder}>Ticket Holder</Text> */}
                    {/* <Text style={styles.ticketOrderNum}>Order Number. {orderNumber}</Text> */}
                    <Text style={styles.userName}>{name}</Text>
                    <Text style={styles.ticketEmail}>{email}</Text>
                    <Text style={styles.ticketHolder}>Purchase Date: {tickets[0]?.formattedDate}</Text>


                    <TouchableOpacity
                        style={[styles.button, checkInSuccess && styles.button]}
                        onPress={totalTickets === 1 ? handleSingleCheckIn : handleCheckInAll}
                        disabled={isCheckingIn || checkInSuccess}
                    >
                        <Text style={styles.buttonText}>
                            {checkInSuccess ? 'Scanned' :
                                totalTickets === 1 ? 'Check-In' : 'Check-In All'}
                        </Text>
                    </TouchableOpacity>
                </View>

                {/* Show ticket details for single ticket */}
                {totalTickets === 1 && tickets.length === 1 && (
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
                                    {tickets[0]?.category || 'No Record'}
                                </Typography>
                                <Text style={[styles.values, styles.marginTop10]}>Class</Text>
                                <Typography
                                    style={[styles.value, styles.marginTop10]}
                                    weight="400"
                                    size={14}
                                    color={color.brown_3C200A}
                                >
                                    {tickets[0]?.ticketClass || 'No Record'}
                                </Typography>
                                <Text style={[styles.values, styles.marginTop10]}>Ticket ID</Text>
                                <Text style={[styles.ticketNumber, styles.marginTop10]}>{tickets[0]?.ticketNumber || 'No Record'}</Text>
                                <Text style={[styles.values]}>Last Scanned On</Text>
                                <Text style={[styles.valueScanCount, styles.marginTop10]}>{formatDateTime(tickets[0]?.scannedBy?.scannedOn) || 'No Record'}</Text>
                            </View>
                            <View style={styles.rightColumnContent}>
                                <Text style={styles.values}>Scanned By</Text>
                                <Text style={[styles.valueScanCount, styles.marginTop10]}>
                                    {truncateStaffName(tickets[0]?.scannedBy?.name) || 'No Record'}
                                </Text>
                                <Text style={[styles.values, styles.marginTop10]}>Staff ID</Text>
                                <Text style={[styles.valueScanCount, styles.marginTop8]}>
                                    {tickets[0]?.scannedBy?.staffId || 'No Record'}
                                </Text>
                                <Text style={[styles.values, styles.marginTop10]}>Price</Text>
                                <Text style={[styles.value, styles.marginTop10]}>
                                    {tickets[0]?.currency || 'GHS'} {tickets[0]?.ticketPrice || 'No Record'}
                                </Text>
                                <Text style={[styles.values, styles.marginTop10]}>Scan Count</Text>
                                <Text style={[styles.valueScanCount, styles.marginTop9]}>{tickets[0]?.scanCount || 'No Record'}</Text>
                            </View>
                        </View>
                    </View>
                )}

                {/* Note section for single ticket */}
                {totalTickets === 1 && tickets.length === 1 && (
                    <View style={styles.noteContainer}>
                        <Text style={styles.LabelNote}>Note</Text>
                        <Text style={styles.noteDescription}>{tickets[0]?.note || 'No note added'}</Text>
                    </View>
                )}

                {/* Ticket List Section */}
                {totalTickets > 1 && (
                    <View style={styles.ticketsList}>
                        <CheckInAllPopUp
                            ticketslist={tickets.map((ticket: any) => ({
                                order_number: ticket.orderNumber,
                                type: ticket.ticketType,
                                price: ticket.ticketPrice,
                                date: ticket.formattedDate,
                                status: ticket.status || ticket.checkinStatus,
                                code: ticket.code,
                                note: ticket.note,
                                uuid: ticket.id?.toString() || ticket.code,
                                eventUuid: eventInfo.eventUuid,
                                message: ticket.message,
                                last_scanned_on: ticket.scannedBy?.scannedOn,
                                scanCount: ticket.scanCount,
                                ticketHolder: ticket.ticketHolder,
                                lastScannedByName: ticket.scannedBy?.name,
                                currency: ticket.currency,
                                eventInfo: eventInfo,
                                ticket_number: ticket.ticketNumber,
                                category: ticket.category || 'No Record',
                                ticketClass: ticket.ticketClass || 'No Record',
                                name: name || 'No Record',
                                email: email || 'No Record',
                                scanned_by: ticket.scannedBy ? {
                                    name: ticket.scannedBy.name,
                                    staff_id: ticket.scannedBy.staffId,
                                    scanned_on: ticket.scannedBy.scannedOn,
                                } : null,
                                scanned_on: ticket.scannedBy?.scannedOn,
                                staff_id: ticket.scannedBy?.staffId,
                            }))}
                            onTicketStatusChange={handleTicketStatusChange}
                            onScanCountUpdate={route.params?.onScanCountUpdate}
                            userEmail={email}
                        />
                    </View>
                )}
            </View>

            <SuccessPopup
                visible={showSuccessPopup}
                onClose={handleCloseSuccessPopup}
                title="Check-In Successful"
                subtitle={totalTickets === 1 ? 'Ticket checked in successfully' : 'Tickets checked in successfully'}
            />
            <ErrorPopup
                visible={showErrorPopup}
                onClose={handleCloseErrorPopup}
                title="Check-In Failed"
                subtitle="We couldn't check in this ticket. Please try again
or contact support."
            />
        </SafeAreaView>
    );
};

export default CheckInAllTickets;
