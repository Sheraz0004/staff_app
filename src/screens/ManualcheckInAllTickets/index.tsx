import {
  View,
  Text,
  TouchableOpacity,
  SafeAreaView,
  ActivityIndicator,
} from "react-native";
import React, { useState, useEffect } from "react";
import Header from "../../components/header";
import { color } from "../../color/color";
import SvgIcons from "../../components/SvgIcons";
import { useNavigation, useRoute } from "@react-navigation/native";
import CheckInAllPopup from "../../constants/checkInAllPopupticketList"; // Correct import path
import SuccessPopup from "../../constants/SuccessPopup";
import ErrorPopup from "../../constants/ErrorPopup";
import Typography from "../../components/Typography";
import { formatDateTime, formatDateWithMonthName } from "../../constants/dateAndTime";
import { truncateStaffName } from "../../utils/stringUtils";
import { logger } from "../../utils/logger";
import { useOfflineSync } from "../../hooks/useOfflineSync";
import { networkService } from "../../utils/network";
import { syncService } from "../../utils/syncService";
import { offlineStorage } from "../../utils/offlineStorage";
import OfflineIndicator from "../../components/OfflineIndicator";
import { useApi } from "../../services/useApi";
import { CHECK_IN_SERVICES } from "../../services/CheckInService";
import { EVENT_SERVICES } from "../../services/EventService";
import { styles } from "./index.styles";

const ManualCheckInAllTickets: React.FC = () => {
  const route = useRoute<any>();
  const { orderNumber, eventUuid, total, eventInfo, preloadedTickets } =
    route.params;
  const navigation = useNavigation<any>();
  const { requestCall: fetchDetails } = useApi(
    CHECK_IN_SERVICES.fetchTicketOrderDetails,
    false,
    false,
  );
  // console.log("params--->",eventUuid)
  const { requestCall: requestEventInfo } = useApi(
    EVENT_SERVICES.fetchEventInfo,
    false,
    false,
  );
  const { loading: isCheckingIn, requestCall: doCheckin } = useApi(
    CHECK_IN_SERVICES.manualCheckin,
    false,
    false,
  );
  const [dynamicEventInfo, setDynamicEventInfo] = useState<any>(null);
  const { loading: isCheckingInAll, requestCall: doCheckinAll } = useApi(
    CHECK_IN_SERVICES.boxOfficeCheckinAll,
    false,
    true,
  );
  const [ticketDetails, setTicketDetails] = useState<any[]>([]);
  console.log({ticketDetails})
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [userDetails, setUserDetails] = useState<any>(null);
  const [checkInSuccess, setCheckInSuccess] = useState<boolean>(false); // State to show success
  const [showSuccessPopup, setShowSuccessPopup] = useState<boolean>(false); // State to control success popup
  const [showErrorPopup, setShowErrorPopup] = useState<boolean>(false); // State to control error popup
  const [isOffline, setIsOffline] = useState<boolean>(false);
  const [isQueued, setIsQueued] = useState<boolean>(false);
  const { isOnline, queueSize, triggerSync } = useOfflineSync();

  useEffect(() => {
    if (!eventUuid) return;
    requestEventInfo(String(eventUuid))
      .then((infoRes: any) => {
        const info = infoRes?.data;
        if (info) {
          setDynamicEventInfo({
            ...(eventInfo || {}),
            event_title: info?.eventTitle || info?.event_title,
            date: info?.startDate || info?.start_date,
            time: info?.startTime || info?.start_time,
            staff_name: info?.staff_name,
            scanCount: info?.scanCount ?? info?.scan_count,
            event_uuid: info?.location?.uuid,
            eventUuid: String(eventUuid),
            cityName: info?.location?.city,
          });
        }
      })
      .catch(() => {});
  }, [eventUuid]);

  // Function to refresh ticket details
  const fetchTicketDetails = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetchDetails(orderNumber, eventUuid);
      const response = res?.data;
      
      logger.log("Ticket Details Response:", JSON.stringify(response, null, 2));

      // Check if response is from offline cache
      if (response?.offline) {
        setIsOffline(true);
        logger.log("Using offline cached ticket details");
      } else {
        setIsOffline(false);
        // If we got fresh data and were queued, clear queued state
        if (isQueued) {
          setIsQueued(false);
        }
      }

      if (
        response?.data &&
        Array.isArray(response.data) &&
        response.data.length > 0
      ) {
        logger.log("📋First ticket data:", response.data[0]);
        logger.log("📋Scanned by:", response.data[0]?.scanned_by);
        setTicketDetails(response.data);

        // Check if the first ticket is already scanned, and set the success state accordingly
        const isScanned = response.data.some(
          (ticket: any) => ticket.checkin_status === "SCANNED",
        );
        setCheckInSuccess(isScanned);

        setUserDetails({
          purchaseDate: response.data[0]?.formatted_date,
          name:
            `${response.data[0]?.user_first_name || ""} ${response.data[0]?.user_last_name || ""}`.trim() ||
            "No Record",
          email: response.data[0]?.user_email || "No Record",
          firstName: response.data[0]?.user_first_name || "",
          lastName: response.data[0]?.user_last_name || "",
          fullName:
            `${response.data[0]?.user_first_name || ""} ${response.data[0]?.user_last_name || ""}`.trim() ||
            "No Record",
          category: response.data[0]?.category || "No Record",
          ticketClass: response.data[0]?.ticket_class || "No Record",
          scannedBy: response.data[0]?.scanned_by?.name || "No Record",
          staffId: response.data[0]?.scanned_by?.staff_id || "No Record",
          scannedOn: response.data[0]?.scanned_by?.scanned_on || "No Record",
        });
      } else if (
        response?.data &&
        Array.isArray(response.data) &&
        response.data.length === 0
      ) {
        //setError('No tickets found for this order.');
        setTicketDetails([]);
        setUserDetails(null);
        setShowErrorPopup(true);
      } else {
        //setError('Invalid ticket details response.');
        setTicketDetails(null as any);
        setUserDetails(null);
        setShowErrorPopup(true);
      }
    } catch (err: any) {
      //setError(err.message || 'Failed to fetch ticket details.');
      setShowErrorPopup(true);
      logger.error("Error fetching ticket details:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Monitor network status
    const isOnline = networkService.isConnected();
    setIsOffline(!isOnline);

    // When coming back online, refresh data and trigger sync
    if (isOnline && isQueued) {
      logger.log("Back online - will sync and refresh ticket details");
      // Sync will happen automatically via useOfflineSync hook
      // The sync listener will handle refreshing the data
    }
  }, [isOnline]);

  // Listen for sync completion
  useEffect(() => {
    const unsubscribe = syncService.addListener(async (syncResult: any) => {
                fetchTicketDetails();
      // if (syncResult.success && syncResult.synced > 0) {
      //   logger.log("Sync completed - refreshing ticket details");
      //   // Clear cached order details to force fresh fetch from server
      //   await offlineStorage.clearOrderDetails(orderNumber, eventUuid);
      //   // Clear queued state since sync completed
      //   setIsQueued(false);
      //   // Refresh ticket details after successful sync
      //   setTimeout(() => {
      //     fetchTicketDetails();
      //   }, 1000); // Give sync a moment to complete
      // }
    });

    return () => {
      unsubscribe();
    };
  }, [orderNumber, eventUuid]);

  useEffect(() => {
    if (preloadedTickets?.length) {
      // Data already fetched by the search screen — use it directly
      setTicketDetails(preloadedTickets);
      const first = preloadedTickets[0];
      setUserDetails({
        purchaseDate: first?.formatted_date,
        name:
          `${first?.user_first_name || ""} ${first?.user_last_name || ""}`.trim() ||
          "No Record",
        email: first?.user_email || "No Record",
        firstName: first?.user_first_name || "",
        lastName: first?.user_last_name || "",
        fullName:
          `${first?.user_first_name || ""} ${first?.user_last_name || ""}`.trim() ||
          "No Record",
        category: first?.category || "No Record",
        ticketClass: first?.ticket_class || "No Record",
        scannedBy: first?.scanned_by?.name || "No Record",
        staffId: first?.scanned_by?.staff_id || "No Record",
        scannedOn: first?.scanned_by?.scanned_on || "No Record",
      });
      setCheckInSuccess(
        preloadedTickets.some((t: any) => t.checkin_status === "SCANNED"),
      );
      setLoading(false);
    } else if (orderNumber && eventUuid) {
      fetchTicketDetails();
    } else {
      setLoading(false);
      setShowErrorPopup(true);
    }
  }, [orderNumber, eventUuid]);

  const handleSingleCheckIn = async () => {
    if (total === 1 && ticketDetails.length === 1) {
      setError(null);
      const ticket = ticketDetails[0];
      logger.log(
        "Attempting to check-in ticket with UUID:",
        eventInfo.eventUuid,
        "and Code:",
        ticket.code,
      );
      try {
        const checkinRes = await doCheckin(eventUuid, ticket.code);
        const response = checkinRes?.data;
        logger.log(
          "Full Single Ticket Check-in Response:",
          JSON.stringify(response, null, 2),
        ); // Log the entire response

        // Check if check-in was queued (offline mode)
        if (response?.offline && response?.queued) {
          setIsQueued(true);
          setIsOffline(true);
          logger.log("Check-in queued for offline sync");

          // Show success but indicate it's queued
          setCheckInSuccess(true);
          setShowSuccessPopup(true);

          // Update ticket locally to show as scanned (will sync later)
          const updatedTicket = {
            ...ticket,
            checkin_status: "SCANNED",
            scan_count: (ticket.scan_count || 0) + 1,
            last_scanned_on: new Date().toISOString(),
            last_scanned_by_name: "Queued for sync",
            scanned_by: {
              name: "Queued for sync",
              staff_id: "N/A",
              scanned_on: new Date().toISOString(),
            },
          };
          setTicketDetails([updatedTicket]);

          // IMPORTANT: Update cached order details so it persists when screen remounts
          try {
            const currentCachedDetails = await offlineStorage.getOrderDetails(
              orderNumber,
              eventUuid,
            );
            if (currentCachedDetails && Array.isArray(currentCachedDetails)) {
              // Update the ticket in cached details
              const updatedCachedDetails = currentCachedDetails.map((t: any) =>
                t.uuid === ticket.uuid ? updatedTicket : t,
              );
              await offlineStorage.saveOrderDetails(
                orderNumber,
                eventUuid,
                updatedCachedDetails,
              );
              logger.log("Updated cached order details after offline check-in");
            }
          } catch (cacheError: any) {
            logger.error("Error updating cached order details:", cacheError);
          }

          // IMPORTANT: Also update the cached tickets list
          try {
            await offlineStorage.updateTicketInCache(
              eventInfo.eventUuid,
              ticket.code,
              {
                checkin_status: "SCANNED",
                scan_count: updatedTicket.scan_count,
                last_scanned_on: updatedTicket.last_scanned_on,
                last_scanned_by_name: updatedTicket.last_scanned_by_name,
                scanned_by: updatedTicket.scanned_by,
              },
            );
            logger.log(
              "Updated ticket in cached tickets list after offline check-in",
            );
          } catch (cacheError: any) {
            logger.error("Error updating ticket in tickets cache:", cacheError);
          }

          // Update scan count callback
          if (route.params?.onScanCountUpdate) {
            route.params.onScanCountUpdate();
          }

          return; // Exit early for queued check-in
        }

        if (response?.data?.status === "SCANNED") {
          // Adjust based on your actual response structure
          logger.log("Check-in successful according to response.");
          logger.log("Response scanned_by:", response?.data?.scanned_by);
          logger.log(
            "Response scanned_by.name:",
            response?.data?.scanned_by?.name,
          );
          logger.log(
            "Response scanned_by.staff_id:",
            response?.data?.scanned_by?.staff_id,
          );
          logger.log("Response scan_count:", response?.data?.scan_count);
          logger.log(
            "Response last_scanned_on:",
            response?.data?.last_scanned_on,
          );
          logger.log(
            "Response last_scanned_by_name:",
            response?.data?.last_scanned_by_name,
          );
          logger.log(
            "Full response.data keys:",
            Object.keys(response?.data || {}),
          );
          logger.log(
            "Response scanned_by.scanned_on:",
            response?.data?.scanned_by?.scanned_on,
          );

          setCheckInSuccess(true);
          setShowSuccessPopup(true);

          // Extract scanned_by information from check-in response
          const scannedByFromResponse = response?.data?.scanned_by;
          logger.log(
            "Manual Check-in - scanned_by from response:",
            scannedByFromResponse,
          );

          // Update ticket details with all relevant fields from the response
          const updatedTicket: any = {
            ...ticket,
            checkin_status: "SCANNED",
            scan_count:
              response?.data?.scan_count ||
              (ticket.scan_count ? ticket.scan_count + 1 : 1),
            last_scanned_on:
              scannedByFromResponse?.scanned_on ||
              response?.data?.last_scanned_on ||
              new Date().toISOString(),
            last_scanned_by_name:
              scannedByFromResponse?.name || ticket.last_scanned_by_name,
            scanned_on: scannedByFromResponse?.scanned_on || "No Record",
          };

          // Map scanned_by object from response (full object with name and staff_id)
          if (scannedByFromResponse) {
            updatedTicket.scanned_by = {
              name: scannedByFromResponse.name || "No Record",
              staff_id: scannedByFromResponse.staff_id || "No Record",
              scanned_on: scannedByFromResponse?.scanned_on || "No Record",
            };
          }

          setTicketDetails([updatedTicket]);

          // IMPORTANT: Update cached order details immediately with the updated ticket
          try {
            const currentCachedDetails = await offlineStorage.getOrderDetails(
              orderNumber,
              eventUuid,
            );
            if (currentCachedDetails && Array.isArray(currentCachedDetails)) {
              // Update the ticket in cached details
              const updatedCachedDetails = currentCachedDetails.map((t: any) =>
                t.uuid === ticket.uuid ? updatedTicket : t,
              );
              await offlineStorage.saveOrderDetails(
                orderNumber,
                eventUuid,
                updatedCachedDetails,
              );
              logger.log("Updated cached order details after online check-in");
            }
          } catch (cacheError: any) {
            logger.error("Error updating cached order details:", cacheError);
          }

          // IMPORTANT: Also update the cached tickets list
          try {
            await offlineStorage.updateTicketInCache(
              eventInfo.eventUuid,
              ticket.code,
              {
                checkin_status: "SCANNED",
                scan_count: updatedTicket.scan_count,
                last_scanned_on: updatedTicket.last_scanned_on,
                last_scanned_by_name: updatedTicket.last_scanned_by_name,
                scanned_by: updatedTicket.scanned_by,
              },
            );
            logger.log(
              "Updated ticket in cached tickets list after online check-in",
            );
          } catch (cacheError: any) {
            logger.error("Error updating ticket in tickets cache:", cacheError);
          }

          // Update scan count when ticket is successfully checked in
          if (route.params?.onScanCountUpdate) {
            route.params.onScanCountUpdate();
          }

          // Silently refetch to get the latest server state (no loading UI)
          try {
            const refetchRes = await fetchDetails(orderNumber, eventUuid);
            const updatedResponse = refetchRes?.data;
            if (
              updatedResponse?.data &&
              Array.isArray(updatedResponse.data) &&
              updatedResponse.data.length > 0
            ) {
              logger.log(
                " Refetched ticket data after check-in:",
                updatedResponse.data[0],
              );
              setTicketDetails(updatedResponse.data);
              const isScanned = updatedResponse.data.some(
                (ticket: any) => ticket.checkin_status === "SCANNED",
              );
              setCheckInSuccess(isScanned);
              if (updatedResponse.data[0]?.scanned_by) {
                setUserDetails((prev: any) => ({
                  ...prev,
                  scannedBy:
                    updatedResponse.data[0].scanned_by?.name || prev.scannedBy,
                  staffId:
                    updatedResponse.data[0].scanned_by?.staff_id ||
                    prev.staffId,
                  scannedOn:
                    updatedResponse.data[0].scanned_by?.scanned_on ||
                    prev.scannedOn,
                }));
              }
            }
          } catch (refetchError: any) {
            logger.warn("Could not refetch ticket details:", refetchError);
          }
        } else {
          logger.log(
            "Check-in failed according to response. Status:",
            response?.data?.status,
          );
          setShowErrorPopup(true);
        }
      } catch (err: any) {
        logger.error("Single Ticket Check-in Error:", err);
        setShowErrorPopup(true);
      }
    }
  };

  const allCheckedIn =
    ticketDetails.length > 0 &&
    ticketDetails.every((t: any) => t.checkin_status === "SCANNED");

  const handleCheckInAll = async () => {
    try {
      await doCheckinAll(eventUuid, orderNumber);
      const updatedTickets = ticketDetails.map((t: any) => ({
        ...t,
        checkin_status: "SCANNED",
        scan_count: (t.scan_count || 0) + 1,
      }));
      setTicketDetails(updatedTickets);
      setCheckInSuccess(true);
      setShowSuccessPopup(true);
      if (route.params?.onScanCountUpdate) route.params.onScanCountUpdate();
    } catch (error) {
              logger.error("Check-in error:", error.response.data);
        
      setShowErrorPopup(true);
    }
  };

  // Add handleTicketStatusChange function
  const handleTicketStatusChange = async (
    ticketUuid: string,
    newStatus: string,
    scannedByInfo: any = null,
  ) => {
    const updatedTickets = ticketDetails.map((ticket: any) =>
      ticket.uuid === ticketUuid
        ? {
            ...ticket,
            checkin_status: newStatus,
            scan_count:
              newStatus === "SCANNED"
                ? (ticket.scan_count || 0) + 1
                : ticket.scan_count,
            last_scanned_on:
              scannedByInfo?.scanned_on || new Date().toISOString(),
            last_scanned_by_name:
              scannedByInfo?.name || ticket.last_scanned_by_name,
            scanned_by: scannedByInfo
              ? {
                  name:
                    scannedByInfo.name ||
                    ticket.scanned_by?.name ||
                    "No Record",
                  staff_id:
                    scannedByInfo.staff_id ||
                    ticket.scanned_by?.staff_id ||
                    "No Record",
                  scanned_on:
                    scannedByInfo?.scanned_on ||
                    ticket.scanned_by?.scanned_on ||
                    "No Record",
                }
              : ticket.scanned_by,
          }
        : ticket,
    );

    setTicketDetails(updatedTickets);

    // IMPORTANT: Update cached order details so it persists when screen remounts
    try {
      await offlineStorage.saveOrderDetails(
        orderNumber,
        eventUuid,
        updatedTickets,
      );
      logger.log("Updated cached order details after ticket status change");
    } catch (cacheError: any) {
      logger.error("Error updating cached order details:", cacheError);
    }

    // IMPORTANT: Also update the cached tickets list for each updated ticket
    if (newStatus === "SCANNED") {
      try {
        const updatedTicket = updatedTickets.find(
          (t: any) => t.uuid === ticketUuid,
        );
        if (updatedTicket) {
          await offlineStorage.updateTicketInCache(
            eventInfo.eventUuid,
            updatedTicket.code,
            {
              checkin_status: "SCANNED",
              scan_count: updatedTicket.scan_count,
              last_scanned_on: updatedTicket.last_scanned_on,
              last_scanned_by_name: updatedTicket.last_scanned_by_name,
              scanned_by: updatedTicket.scanned_by,
            },
          );
          logger.log(
            "Updated ticket in cached tickets list after status change",
          );
        }
      } catch (cacheError: any) {
        logger.error("Error updating ticket in tickets cache:", cacheError);
      }
    }
  };

  const handleCloseSuccessPopup = () => {
    setShowSuccessPopup(false);
  };

  const handleCloseErrorPopup = () => {
    setShowErrorPopup(false);
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <Header eventInfo={dynamicEventInfo || eventInfo} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={color.btnBrown_AE6F28} />
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.container}>
        <Header eventInfo={dynamicEventInfo || eventInfo} />
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!ticketDetails || ticketDetails.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <Header eventInfo={dynamicEventInfo || eventInfo} />
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>
            No ticket details found for this order.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Header eventInfo={dynamicEventInfo || eventInfo} />
      <OfflineIndicator />
      {isQueued && (
        <View style={styles.queuedBanner}>
          <Text style={styles.queuedText}>
            ⚠️ Check-in queued for sync when online
          </Text>
        </View>
      )}
      <View style={styles.wrapper}>
        <View style={styles.popUp}>
          <SvgIcons.successBrownSVG
            width={81}
            height={80}
            fill="transparent"
            style={styles.successImageIcon}
          />
          <Text style={styles.userName}>{userDetails?.name}</Text>
          {/* <Text style={styles.ticketHolder}>Ticket Holder</Text> */}
          <Text style={styles.ticketHolder}>{userDetails?.email}</Text>
          <Text style={styles.ticketPurchaseDate}>
            Purchase Date: {userDetails?.purchaseDate}
          </Text>
          {total === 1 && (
            <TouchableOpacity
              style={[
                styles.button,
                isOffline && !checkInSuccess && styles.buttonOffline,
                isQueued && styles.buttonQueued,
              ]}
              onPress={handleSingleCheckIn}
              disabled={isCheckingIn || checkInSuccess}
            >
              {isCheckingIn ? (
                <ActivityIndicator color={color.btnTxt_FFF6DF} />
              ) : checkInSuccess ? (
                <Text style={styles.buttonText}>
                  {isQueued ? "Queued" : "Scanned"}
                </Text>
              ) : (
                <Text style={styles.buttonText}>
                  {isOffline ? "Check-In (Offline)" : "Check-In"}
                </Text>
              )}
            </TouchableOpacity>
          )}

          {total > 1 && (
            <TouchableOpacity
              style={[styles.button, allCheckedIn && styles.buttonQueued]}
              onPress={handleCheckInAll}
              disabled={isCheckingInAll || allCheckedIn}
            >
              {isCheckingInAll ? (
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
        {((dynamicEventInfo || eventInfo)?.event_title || (dynamicEventInfo || eventInfo)?.date) && (
          <View style={styles.ticketContainer}>
            <View style={styles.row}>
              <View style={styles.leftColumnContent}>
                <Text style={styles.values}>Event</Text>
                <Text style={[styles.valueScanCount, styles.marginTop10]}>
                  {(dynamicEventInfo || eventInfo)?.event_title || "No Record"}
                </Text>
                {(dynamicEventInfo || eventInfo)?.cityName && (
                  <>
                    <Text style={[styles.values, styles.marginTop10]}>Location</Text>
                    <Text style={[styles.valueScanCount, styles.marginTop10]}>
                      {(dynamicEventInfo || eventInfo)?.cityName}
                    </Text>
                  </>
                )}
              </View>
              <View style={styles.rightColumnContent}>
                <Text style={styles.values}>Date</Text>
                <Text style={[styles.valueScanCount, styles.marginTop8]}>
                  {formatDateWithMonthName((dynamicEventInfo || eventInfo)?.date) || "No Record"}
                </Text>
                <Text style={[styles.values, styles.marginTop10]}>Time</Text>
                <Text style={[styles.valueScanCount, styles.marginTop8]}>
                  {(dynamicEventInfo || eventInfo)?.time || "No Record"}
                </Text>
              </View>
            </View>
          </View>
        )}

        {total === 1 && ticketDetails.length === 1 && (
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
                <Text style={[styles.values]}>Last Scanned On</Text>
                <Text style={[styles.valueScanCount, styles.marginTop10]}>
                  {formatDateTime(ticketDetails[0]?.scanned_by?.scanned_on) ||
                    "No Record"}
                </Text>
              </View>
              <View style={styles.rightColumnContent}>
                <Text style={styles.values}>Scanned By</Text>
                <Text style={[styles.valueScanCount, styles.marginTop8]}>
                  {truncateStaffName(ticketDetails[0]?.scanned_by?.name) ||
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

        {/* Note section for single ticket */}
        {total === 1 && ticketDetails.length === 1 && (
          <View style={styles.noteContainer}>
            <Text style={styles.LabelNote}>Note</Text>
            <Text style={styles.noteDescription}>
              {ticketDetails[0]?.note || "No note added"}
            </Text>
          </View>
        )}

        {total > 1 && ticketDetails.length > 0 && (
          <View style={styles.ticketsList}>
            <CheckInAllPopup
              ticketslist={ticketDetails?.map((ticket: any) => ({
                order_number: ticket.ticket_number,
                type: ticket.ticket_type,
                price: ticket.ticket_price,
                date: ticket.formatted_date,
                status: ticket.checkin_status,
                code: ticket.code,
                note: ticket.note,
                uuid: ticket.uuid,
                eventUuid: eventUuid,
                message: ticket.message,
                last_scanned_on: ticket.last_scanned_on,
                scanCount: ticket.scan_count,
                ticketHolder: ticket.ticket_holder,
                lastScannedByName: ticket.last_scanned_by_name,
                currency: ticket.currency,
                eventInfo: eventInfo,
                ticket_number: ticket.ticket_number,
                name:
                  `${ticket.user_first_name || ""} ${ticket.user_last_name || ""}`.trim() ||
                  "No Record",
                category: ticket.category || "No Record",
                ticketClass: ticket.ticket_class || "No Record",
                scanned_by: ticket.scanned_by,
                scanned_on: ticket.scanned_by?.scanned_on || "No Record",
              }))}
              onTicketStatusChange={handleTicketStatusChange}
              onScanCountUpdate={route.params?.onScanCountUpdate}
              userEmail={userDetails?.email}
            />
          </View>
        )}
      </View>
      <SuccessPopup
        visible={showSuccessPopup}
        onClose={handleCloseSuccessPopup}
        title={isQueued ? "Check-In Queued" : "Check-In Successful"}
        subtitle={
          isQueued
            ? "Check-in will sync when you're back online"
            : total === 1
              ? "Ticket checked in successfully"
              : "Tickets checked in successfully"
        }
      />
      <ErrorPopup
        visible={showErrorPopup}
        onClose={handleCloseErrorPopup}
        title="Check-In Failed"
        subtitle={
          isOffline
            ? "Cannot check in while offline. Please connect to internet and try again."
            : "We couldn't check in this ticket. Please try again or contact support."
        }
      />
    </SafeAreaView>
  );
};

export default ManualCheckInAllTickets;
