import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  TextInput,
  Dimensions,
  Modal,
  ActivityIndicator,
} from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
// import { boxofficetablist } from '../../constants/boxofficetablist';
import { Ionicons } from "@expo/vector-icons";
import { color } from "../../color/color";
import { Formik } from "formik";
import * as Yup from "yup";
import {
  useNavigation,
  useRoute,
  useFocusEffect,
} from "@react-navigation/native";
import SvgIcons from "../../components/SvgIcons";
import { formatDateWithMonthName } from "../../constants/dateAndTime";
import ErrorPopup from "../../constants/ErrorPopup";
import { logger } from "../../utils/logger";
import { useApi } from "../../services/useApi";
import { CHECK_IN_SERVICES } from "../../services/CheckInService";
import { styles } from "./index.styles";

interface BoxOfficeTabProps {
  eventInfo: any;
  onScanCountUpdate: any;
  selectedTab: any;
}

const toLegacyTickets = (tickets: any[], buyerName: string, buyerEmail: string) => {
  const nameParts = buyerName.split(' ');
  const firstName = nameParts[0] || '';
  const lastName = nameParts.slice(1).join(' ') || '';
  return tickets.map((t: any) => ({
    code: t.code,
    uuid: String(t.id || t.ticketNumber || ''),
    ticket_number: t.ticketNumber,
    ticket_type: t.ticketType,
    ticket_class: t.ticketClass,
    ticket_price: t.ticketPrice,
    checkin_status: t.checkinStatus || 'UNSCANNED',
    scan_count: t.scanCount || 0,
    note: t.note,
    message: t.message,
    category: t.category,
    currency: t.currency,
    formatted_date: t.formattedDate,
    user_first_name: t.userFirstName || firstName,
    user_last_name: t.userLastName || lastName,
    user_email: t.userEmail || buyerEmail,
    user_phone: t.userPhone,
    ticket_holder: t.ticketHolder,
    scanned_by: t.scannedBy ? {
      name: t.scannedBy.name,
      staff_id: t.scannedBy.staffId,
      scanned_on: t.scannedBy.scannedOn,
    } : null,
    last_scanned_on: t.scannedBy?.scannedOn ?? null,
    last_scanned_by_name: t.scannedBy?.name ?? null,
  }));
};

const BoxOfficeTab: React.FC<BoxOfficeTabProps> = ({
  eventInfo,
  onScanCountUpdate,
  selectedTab,
}) => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const ticketUuid = route.params?.ticketUuid;
  const { requestCall: requestFetchStats } = useApi(
    CHECK_IN_SERVICES.fetchTicketPricingStats,
    false,
    false,
  );
  const { requestCall: requestFetchPricing } = useApi(
    CHECK_IN_SERVICES.fetchTicketPricing,
    false,
    false,
  );
  const { requestCall: doBoxOfficeGetTicket } = useApi(
    CHECK_IN_SERVICES.boxOfficeGetTicket,
    false,
    false,
  );
  const [selectedTabState, setSelectedTabState] = useState<string>("");
  const [name, setName] = useState<string>("");
  const [email, setEmail] = useState<string>("");
  const [purchaseCode, setPurchaseCode] = useState<string>("");
  const [paymentOption, setPaymentOption] = useState<string>("");
  const [isPinModalVisible, setPinModalVisible] = useState<boolean>(false);
  const [cashPinModal, setCashPinModal] = useState<string>("");
  const [cashPin, setCashPin] = useState<string>("");
  const [cashPinError, setCashPinError] = useState<string>("");
  const [isPOSModalVisible, setPOSModalVisible] = useState<boolean>(false);
  const [isPurchaseCodeModalVisible, setPurchaseCodeModalVisible] =
    useState<boolean>(false);
  const [transactionNumber, setTransactionNumber] = useState<string>("");
  const [purchaseCodeModal, setPurchaseCodeModal] = useState<string>("");
  const [ticketPricing, setTicketPricing] = useState<any[]>([]);
  const [pricingCategories, setPricingCategories] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [selectedTickets, setSelectedTickets] = useState<any[]>([]);
  const { width } = Dimensions.get("window");
  const [nameError, setNameError] = useState<string>("");
  const [transactionError, setTransactionError] = useState<string>("");
  const [emailError, setEmailError] = useState<string>("");
  const [purchaseError, setPurchaseError] = useState<string>("");
  const [wrongPurchaseCodeError, setWrongPurchaseCodeError] =
    useState<string>("");
  const [paymentError, setPaymentError] = useState<string>("");
  const [ticketError, setTicketError] = useState<string>("");
  const [showError, setShowError] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showErrorPopup, setShowErrorPopup] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const isValidEmailOrPhone = (value: string): boolean => {
    if (!value) {
      return false;
    }
    const trimmed = value.trim();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const phoneRegex = /^[0-9]{7,15}$/;
    return emailRegex.test(trimmed) || phoneRegex.test(trimmed);
  };

  // Helper function to check if any ticket is selected
  const hasSelectedTicket = (): boolean => {
    return selectedTickets.some((ticket) => ticket.quantity > 0);
  };

  // Helper function to check if name and email are filled
  const isNameAndEmailFilled = (): boolean => {
    return !!(name.trim() && isValidEmailOrPhone(email));
  };

  // Helper function to check if payment section should be enabled
  const isPaymentSectionEnabled = (): boolean => {
    return hasSelectedTicket() && isNameAndEmailFilled();
  };

  // Helper function to check if form fields should be enabled
  const isFormFieldsEnabled = (): boolean => {
    return hasSelectedTicket();
  };

  // Helper function to get border color for input fields
  const getInputBorderColor = (): string => {
    if (!isFormFieldsEnabled()) {
      return color.brown_766F6A; // Placeholder color when disabled
    }
    return color.borderBrown_CEBCA0; // Normal border color when enabled
  };

  // Helper function to get border color for payment options
  const getPaymentBorderColor = (isSelected: boolean): string => {
    if (!isPaymentSectionEnabled()) {
      return color.brown_766F6A; // Placeholder color when disabled
    }
    if (isSelected) {
      return color.btnBrown_AE6F28; // Selected color
    }
    return color.borderBrown_CEBCA0; // Normal border color
  };

  const resetData = (): void => {
    setSelectedTabState("");
    setName("");
    setEmail("");
    setPurchaseCode("");
    setPaymentOption("");
    setPOSModalVisible(false);
    setPinModalVisible(false);
    setPurchaseCodeModalVisible(false);
    setTransactionNumber("");
    setCashPinModal("");
    setCashPin("");
    setPurchaseCodeModal("");
    setTicketPricing([]);
    setPricingCategories([]);
    setSelectedTickets([]);
    setIsLoading(true);
    setNameError("");
    setTransactionError("");
    setEmailError("");
    setPurchaseError("");
    setWrongPurchaseCodeError("");
    setPaymentError("");
    setTicketError("");
    setCashPinError("");
    setCashPinError("");
  };

  const fetchData = async (): Promise<void> => {
    try {
      if (!eventInfo?.eventUuid) {
        return;
      }

      // Fetch pricing categories
      const statsRes = await requestFetchStats(eventInfo.eventUuid);
      // console.log("statsRes--->",statsRes)
      const pricingStatsResponse = statsRes?.data;
      if (pricingStatsResponse?.data) {
        const categories = pricingStatsResponse.data.map(
          (item: any) => item.alias,
        );
        setPricingCategories(categories);

        // Set initial selected tab based on selectedTab prop or prioritize Early Bird
        if (selectedTab && categories.includes(selectedTab)) {
          setSelectedTabState(selectedTab);
        } else if (categories.length > 0) {
          // Prioritize Early Bird as default, fallback to first category
          const earlyBirdIndex = categories.findIndex(
            (cat: any) => cat === "Early Bird",
          );
          if (earlyBirdIndex !== -1) {
            setSelectedTabState("Early Bird");
          } else {
            setSelectedTabState(categories[0]);
          }
        }
      }

      // Fetch ticket pricing
      const pricingRes = await requestFetchPricing(eventInfo?.eventUuid);
      // console.log("pricingRes--->",pricingRes?.data)
      const pricingData = pricingRes?.data;

      if (!pricingData) {
        return;
      }

      // Derive categories from pricing response
      const derivedCategories = [
        ...new Set(
          (pricingData.pricingTypeOptions || [])
            .map((opt: any) => opt.type?.alias)
            .filter(Boolean),
        ),
      ] as string[];
      if (derivedCategories.length > 0) {
        setPricingCategories(derivedCategories);
        if (selectedTab && derivedCategories.includes(selectedTab)) {
          setSelectedTabState(selectedTab);
        } else {
          const earlyBirdIdx = derivedCategories.findIndex(
            (c) => c === "Early Bird",
          );
          setSelectedTabState(
            earlyBirdIdx !== -1
              ? derivedCategories[earlyBirdIdx]
              : derivedCategories[0],
          );
        }
      }

      const categories = (pricingData.pricingTypeOptions || []).reduce(
        (acc: any[], option: any) => {
          const categoryTitle = option.type?.alias;
          const existingCategory = acc.find(
            (category: any) => category.title === categoryTitle,
          );

          const ticket = {
            name: option.className,
            id: option.id,
            price: option.previousPrice ?? option.price,
            discount_price: option.price,
            quantity: option.quantity,
            remaining: pricingData.ticketsRemainingQuantity
              ? option.quantity
              : 0,
            purchase_limit: option.purchaseLimit,
            currency:
              option.currency?.symbol || option.currency?.threeLetter || "",
            sale_end_date_time: pricingData.saleEndDateTime,
            description: option.description,
          };

          // If ticketUuid is provided, only include tickets that match
          if (ticketUuid && ticket.id !== ticketUuid) {
            return acc;
          }

          if (existingCategory) {
            existingCategory.tickets.push(ticket);
          } else {
            acc.push({
              title: categoryTitle,
              tickets: [ticket],
            });
          }

          return acc;
        },
        [],
      );

      setTicketPricing(categories);
      let targetCategory: any;
      if (
        selectedTab &&
        categories.find((cat: any) => cat.title === selectedTab)
      ) {
        targetCategory = categories.find(
          (cat: any) => cat.title === selectedTab,
        );
      } else {
        // Prioritize Early Bird as default, fallback to first category
        const earlyBirdCategory = categories.find(
          (cat: any) => cat.title === "Early Bird",
        );
        targetCategory = earlyBirdCategory || categories[0];
      }

      if (targetCategory) {
        // logger.log('BoxOfficeTab: Processing category:', targetCategory);
        const initialTickets = targetCategory.tickets.map((ticket: any) => ({
          type: ticket.name,
          id: ticket.id,
          price: ticket.price,
          discountPrice: ticket.discount_price,
          quantity: 0,
          remaining: ticket.remaining,
          purchase_limit: ticket.purchase_limit,
          currency: ticket.currency,
          sale_end_date_time: ticket.sale_end_date_time,
          description: ticket.description,
        }));
        // logger.log('BoxOfficeTab: Initial tickets created:', initialTickets);
        setSelectedTickets(initialTickets);
      }
    } catch (error) {
      logger.error("BoxOfficeTab: Error processing ticket pricing:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Reset data when screen comes into focus and fetch data
  useFocusEffect(
    React.useCallback(() => {
      resetData();
      fetchData();
    }, [eventInfo?.eventUuid, ticketUuid]),
  );

  // Handle selectedTab prop changes
  useEffect(() => {
    if (
      selectedTab &&
      pricingCategories.includes(selectedTab) &&
      ticketPricing.length > 0
    ) {
      setSelectedTabState(selectedTab);

      // Clear all form fields when switching tabs
      setName("");
      setEmail("");
      setPurchaseCode("");
      setPaymentOption("");
      setTransactionNumber("");
      setPurchaseCodeModal("");
      setPurchaseError("");
      setWrongPurchaseCodeError("");
      setNameError("");
      setTransactionError("");
      setEmailError("");
      setPaymentError("");
      setTicketError("");
      setPOSModalVisible(false);
      setPurchaseCodeModalVisible(false);
      setPinModalVisible(false);
      setCashPinModal("");
      setCashPin("");
      setCashPinError("");

      // Update selected tickets for the new tab
      const category = ticketPricing.find(
        (cat: any) => cat.title === selectedTab,
      );
      if (category) {
        logger.log(
          "BoxOfficeTab: Processing selectedTab change for category:",
          category,
        );
        const updatedTickets = category.tickets.map((ticket: any) => ({
          type: ticket.name,
          id: ticket.id,
          price: ticket.price,
          discountPrice: ticket.discount_price,
          quantity: 0,
          remaining: ticket.remaining,
          purchase_limit: ticket.purchase_limit,
          currency: ticket.currency,
          sale_end_date_time: ticket.sale_end_date_time,
          description: ticket.description,
        }));
        logger.log(
          "BoxOfficeTab: Updated tickets for selectedTab:",
          updatedTickets,
        );
        setSelectedTickets(updatedTickets);
      }
    }
  }, [selectedTab, pricingCategories, ticketPricing]);

  // Initial data fetch
  useEffect(() => {
    fetchData();
  }, [eventInfo?.eventUuid, ticketUuid]);

  const totalQuantity = selectedTickets.reduce(
    (sum: number, ticket: any) => sum + ticket.quantity,
    0,
  );

  const handleTabPress = (tab: string): void => {
    logger.log("BoxOfficeTab: Tab pressed:", tab);
    setSelectedTabState(tab);

    // Clear all form fields when switching tabs
    setName("");
    setEmail("");
    setPurchaseCode("");
    setPaymentOption("");
    setTransactionNumber("");
    setPurchaseCodeModal("");
    setPurchaseError("");
    setWrongPurchaseCodeError("");
    setNameError("");
    setTransactionError("");
    setEmailError("");
    setPaymentError("");
    setTicketError("");
    setPOSModalVisible(false);
    setPurchaseCodeModalVisible(false);
    setPinModalVisible(false);
    setCashPinModal("");
    setCashPin("");
    setCashPinError("");

    const category = ticketPricing.find((cat: any) => cat.title === tab);
    logger.log("BoxOfficeTab: Found category:", category);

    if (category) {
      const updatedTickets = category.tickets.map((ticket: any) => ({
        type: ticket.name,
        id: ticket.id,
        price: ticket.price,
        discountPrice: ticket.discount_price,
        quantity: 0,
        remaining: ticket.remaining,
        purchase_limit: ticket.purchase_limit,
        currency: ticket.currency,
        sale_end_date_time: ticket.sale_end_date_time,
        description: ticket.description,
      }));
      logger.log("BoxOfficeTab: Updated tickets for category:", updatedTickets);
      setSelectedTickets(updatedTickets);
    }
  };

  const navigateToCheckInAllTicketsScreen = async (): Promise<void> => {
    setNameError("");
    setTransactionError("");
    setEmailError("");
    setPurchaseError("");
    setWrongPurchaseCodeError("");
    setPaymentError("");
    setTicketError("");

    if (!name.trim()) {
      setNameError("Please enter a valid name.");
      return;
    }

    if (!email) {
      setEmailError("Please enter a valid email or phone number.");
      return;
    }

    if (!paymentOption) {
      setPaymentError("Please select a payment option.");
      return;
    }

    if (paymentOption === "CASH" && !(cashOtp as any).trim()) {
      setCashPinError("Please enter a valid PIN.");
      setPinModalVisible(true);
      return;
    }

    // Check if purchase code is required for Members tab
    if (selectedTabState === "Members" && !purchaseCode.trim()) {
      setPurchaseError("Please enter a valid Purchase code.");
      return;
    }

    try {
      const items = selectedTickets
        .filter((ticket: any) => ticket.quantity > 0)
        .map((ticket: any) => ({
          ticketTypeId: ticket.id,
          quantity: ticket.quantity,
        }));

      if (items.length === 0) {
        setTicketError("Please select at least one ticket.");
        return;
      }

      setIsSubmitting(true);
      // Generate a unique transaction ID for non-POS payments
      const transactionId =
        paymentOption === "P.O.S"
          ? null
          : paymentOption === "CASH"
            ? (cashOtp as any).trim()
            : `TXN-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

      const boxRes = await doBoxOfficeGetTicket(
        eventInfo.eventUuid,
        items,
        email,
        paymentOption.toUpperCase(),
        transactionId,
        name.trim(),
        selectedTabState === "Members" ? purchaseCode : undefined,
      );
      const response = boxRes?.data;
      console.log("response -->", response);

      // Extract order number from response
      const rawTickets: any[] = response?.data || [];
      const orderNumber = rawTickets[0]?.orderNumber;
      const preloadedTickets = toLegacyTickets(rawTickets, name.trim(), email);
      const ticketEventUuid = rawTickets[0]?.eventId || eventInfo.eventUuid;
      navigation.navigate("ManualCheckInAllTickets", {
        orderNumber,
        eventUuid: ticketEventUuid,
        total: totalQuantity,
        eventInfo,
        preloadedTickets,
        onScanCountUpdate,
      });
    } catch (error: any) {
      logger.error("BoxOffice get ticket Error:", error?.response?.data);
      const errorMsg =
        error?.response?.data?.message ||
        error?.message ||
        "We couldn't process your request. Please try again or contact support.";
      setErrorMessage(errorMsg);
      setShowErrorPopup(true);
      if (error.isPurchaseCodeError) {
        setWrongPurchaseCodeError("Please enter a valid purchase code");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePOSPayment = async (): Promise<void> => {
    // Clear previous errors
    setNameError("");
    setTransactionError("");
    setEmailError("");
    setPurchaseError("");
    setWrongPurchaseCodeError("");
    setPaymentError("");
    setTicketError("");

    if (!name.trim()) {
      setNameError("Please enter a valid name.");
      return;
    }

    if (!transactionNumber.trim()) {
      setTransactionError("Please enter a valid transaction number.");
      return;
    }

    if (!email) {
      setEmailError("Please enter a valid email or phone number.");
      return;
    }

    try {
      const items = selectedTickets
        .filter((ticket: any) => ticket.quantity > 0)
        .map((ticket: any) => ({
          ticketTypeId: ticket.id,
          quantity: ticket.quantity,
        }));

      if (items.length === 0) {
        setTicketError("Please select at least one ticket.");
        return;
      }

      setIsSubmitting(true);
      const posRes = await doBoxOfficeGetTicket(
        eventInfo.eventUuid,
        items,
        email,
        "POS",
        transactionNumber.trim(),
        name.trim(),
        selectedTabState === "Members" ? purchaseCode : undefined,
      );
      const response = posRes?.data;
      const posRawTickets: any[] = response?.data || [];
      const orderNumber = posRawTickets[0]?.orderNumber;
      const posPreloadedTickets = toLegacyTickets(posRawTickets, name.trim(), email);
      const posTicketEventUuid = posRawTickets[0]?.eventId || eventInfo.eventUuid;
      setPOSModalVisible(false);
      navigation.navigate("ManualCheckInAllTickets", {
        orderNumber,
        eventUuid: posTicketEventUuid,
        total: totalQuantity,
        eventInfo,
        preloadedTickets: posPreloadedTickets,
        onScanCountUpdate,
      });
    } catch (error: any) {
      logger.error("BoxOffice POS payment Error:", error?.response?.data);
      const errorMsg =
        error?.response?.data?.message ||
        error?.message ||
        "We couldn't process your request. Please try again or contact support.";
      setErrorMessage(errorMsg);
      setShowErrorPopup(true);
      if (error.isPurchaseCodeError) {
        setWrongPurchaseCodeError("Please enter a valid purchase code");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderTab = ({ item }: { item: string }) => {
    return (
      <TouchableOpacity
        style={[
          styles.tabButton,
          selectedTabState === item && styles.selectedTabButton,
        ]}
        onPress={() => handleTabPress(item)}
      >
        <Text
          style={[
            styles.tabButtonText,
            selectedTabState === item && styles.selectedTabButtonText,
          ]}
        >
          {item}
        </Text>
      </TouchableOpacity>
    );
  };

  const validationSchema = Yup.object().shape({
    name: Yup.string().required("Name is required"),
    email: Yup.string()
      .test(
        "emailOrPhone",
        "Invalid email or phone number",
        (value) =>
          /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value ?? "") ||
          /^[0-9]{7,15}$/.test(value ?? ""),
      )
      .required("Required"),
  });

  const QuantitySelector = ({
    quantity,
    onIncrease,
    onDecrease,
  }: {
    quantity: number;
    onIncrease: () => void;
    onDecrease: () => void;
  }) => {
    return (
      <View style={styles.quantitySelectorContainer}>
        <TouchableOpacity onPress={onDecrease} style={styles.quantityButton}>
          <Ionicons name="remove" size={24} color="#544B45" />
        </TouchableOpacity>
        <View style={styles.quantityCountContainer}>
          <Text style={styles.quantityText}>{quantity}</Text>
        </View>
        <TouchableOpacity onPress={onIncrease} style={styles.quantityButton}>
          <Ionicons name="add" size={24} color="#544B45" />
        </TouchableOpacity>
      </View>
    );
  };

  const calculateTotal = (): number => {
    return selectedTickets.reduce(
      (total: number, ticket: any) =>
        total + ticket.quantity * ticket.discountPrice,
      0,
    );
  };

  const handleQuantityChange = (index: number, newQuantity: number): void => {
    const updatedTickets = [...selectedTickets];
    if (newQuantity >= 0) {
      updatedTickets[index].quantity = newQuantity;
      setSelectedTickets(updatedTickets);
      // Clear ticket error when user changes quantity
      if (ticketError) {
        setTicketError("");
      }
    }
  };

  const renderTicketItem = ({ item, index }: { item: any; index: number }) => (
    <View style={styles.ticketCard}>
      <View style={styles.ticketRow}>
        <View style={styles.leftColumn}>
          <Text style={styles.ticketType}>{item.type}</Text>
          {item.discountPrice < item.price && (
            <Text style={styles.discountText}>Early Bird Discount</Text>
          )}
          {/* <Text style={styles.descriptionText}>{item.description}</Text> */}
          <View style={styles.validTillContainer}>
            <Text style={styles.validTillText}>valid until</Text>
            <Text style={styles.dateText}>
              {formatDateWithMonthName(item.sale_end_date_time)}
            </Text>
          </View>
          <Text style={styles.descriptionText}>
            Join the excitement and be{"\n"}part of the crowd at our event!
          </Text>
        </View>
        <View style={styles.rightColumn}>
          <View style={styles.priceContainer}>
            <Text style={styles.discountPrice}>
              {item.currency} {item.price}
            </Text>
            {/* <Text style={styles.originalPrice}>{item.currency} {item.discountPrice}</Text> */}
          </View>
          <View style={styles.quantitySelectorContainer}>
            <TouchableOpacity
              style={styles.quantityButton}
              onPress={() => handleQuantityChange(index, item.quantity - 1)}
              disabled={item.quantity <= 0}
            >
              {item.quantity <= 0 ? (
                <SvgIcons.removeIcon width={12} height={12} />
              ) : (
                <SvgIcons.removeIcon width={12} height={12} />
              )}
            </TouchableOpacity>
            <View style={styles.quantityCountContainer}>
              <Text style={styles.quantityText}>{item.quantity}</Text>
            </View>
            <TouchableOpacity
              style={styles.quantityButton}
              onPress={() => handleQuantityChange(index, item.quantity + 1)}
              disabled={item.quantity >= item.purchase_limit}
            >
              {item.quantity >= item.purchase_limit ? (
                <SvgIcons.addIcon width={12} height={12} />
              ) : (
                <SvgIcons.addIcon width={12} height={12} />
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </View>
  );

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={color.btnBrown_AE6F28} />
      </View>
    );
  }

  if (pricingCategories.length === 0) {
    return (
      <View style={styles.fullEmptyContainer}>
        <Ionicons name="ticket-outline" size={72} color={color.btnBrown_AE6F28} style={{ opacity: 0.45 }} />
        <Text style={styles.emptyTitle}>No Box Office Options</Text>
        <Text style={styles.emptySubtitle}>
          There are no ticket options configured for this event. Please contact the event organizer for more information.
        </Text>
      </View>
    );
  }

  const dismissError = (): void => {
    setShowError(false);
    setWrongPurchaseCodeError("");
  };

  const handleCloseErrorPopup = (): void => {
    setShowErrorPopup(false);
    setErrorMessage(null);
  };

  return (
    <>
      <KeyboardAwareScrollView
        style={styles.container}
        contentContainerStyle={styles.scrollContent}
        enableOnAndroid
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.tabContainer}>
          <FlatList
            horizontal
            data={pricingCategories}
            renderItem={renderTab}
            keyExtractor={(item) => item}
            showsHorizontalScrollIndicator={false}
          />
        </View>

        <FlatList
          data={selectedTickets}
          renderItem={renderTicketItem}
          keyExtractor={(item: any, index: number) => index.toString()}
          contentContainerStyle={(styles as any).listContent}
          scrollEnabled={false}
          ListEmptyComponent={
            <View style={styles.listEmptyContainer}>
              <Ionicons name="ticket-outline" size={52} color={color.btnBrown_AE6F28} style={{ opacity: 0.45 }} />
              <Text style={styles.emptyTitle}>No Tickets Available</Text>
              <Text style={styles.emptySubtitle}>
                No tickets are available for this category at the moment.
              </Text>
            </View>
          }
        />

        <View style={(styles as any).footer}>
          {/* <View style={styles.lineView}></View> */}
          <View style={styles.totalamount}>
            <View style={styles.totalContainer}>
              <Text style={styles.totalText}>Total Tickets</Text>
              <Text style={[styles.totalValue, { textAlign: "left" }]}>
                {totalQuantity}
              </Text>
            </View>
            <View style={styles.totalContainer}>
              <Text style={styles.totalText}>Total Amount</Text>
              <Text style={[styles.totalValue, { textAlign: "left" }]}>
                GHS {calculateTotal()}
              </Text>
            </View>
          </View>
          {ticketError && <Text style={styles.errorText}>{ticketError}</Text>}

          {/* <View style={styles.lineView2}></View> */}
          <Formik
            key={selectedTabState} // Force form reset when tab changes
            initialValues={{ name: "", email: "" }}
            validationSchema={validationSchema}
            context={{ selectedTab: selectedTabState }}
            onSubmit={() => {}}
          >
            {({
              handleChange,
              handleBlur,
              handleSubmit,
              values,
              errors,
              touched,
            }) => (
              <View style={{ width: "100%" }}>
                {/* <Text style={styles.inputHeading}>Name</Text> */}
                <View style={styles.whitebg}>
                  <TextInput
                    style={[
                      styles.input,
                      touched.name && errors.name ? styles.inputError : null,
                      values.name
                        ? styles.inputWithText
                        : styles.inputPlaceholder,
                      { borderColor: getInputBorderColor() },
                      !isFormFieldsEnabled() && { opacity: 0.5 },
                    ]}
                    placeholder="Enter Name"
                    placeholderTextColor={color.brown_766F6A}
                    onChangeText={(text: string) => {
                      handleChange("name")(text);
                      setName(text);
                      // Clear name error when user starts typing
                      if (nameError) {
                        setNameError("");
                      }
                    }}
                    onBlur={handleBlur("name")}
                    value={values.name}
                    keyboardType="default"
                    selectionColor={color.selectField_CEBCA0}
                    editable={isFormFieldsEnabled()}
                  />
                  {touched.name && errors.name && (
                    <Text style={styles.errorText}>{errors.name}</Text>
                  )}
                  {nameError && (
                    <Text style={styles.errorText}>{nameError}</Text>
                  )}

                  {/* <Text style={styles.inputHeading}>Email or Phone Number</Text> */}
                  <TextInput
                    style={[
                      styles.input,
                      touched.email && errors.email ? styles.inputError : null,
                      values.email
                        ? styles.inputWithText
                        : styles.inputPlaceholder,
                      { borderColor: getInputBorderColor() },
                      !isFormFieldsEnabled() && { opacity: 0.6 },
                    ]}
                    placeholder="Email or Phone Number"
                    placeholderTextColor={color.brown_766F6A}
                    onChangeText={(text: string) => {
                      handleChange("email")(text);
                      setEmail(text);
                      // Clear email error when user starts typing
                      if (emailError) {
                        setEmailError("");
                      }
                    }}
                    onBlur={handleBlur("email")}
                    value={values.email}
                    keyboardType="email-address"
                    selectionColor={color.selectField_CEBCA0}
                    editable={isFormFieldsEnabled()}
                  />
                  {touched.email && errors.email && (
                    <Text style={styles.errorText}>{errors.email}</Text>
                  )}
                  {emailError && (
                    <Text style={styles.errorText}>{emailError}</Text>
                  )}
                </View>
              </View>
            )}
          </Formik>
          <View style={(styles as any).lineView3}></View>
          <View style={styles.whitebgPayment}>
            {/* <View style={styles.Paylabel}>
              <Text>Pay With</Text>
            </View> */}

            <View style={styles.paymentOptions}>
              {/* Cash Button */}
              <TouchableOpacity
                style={[
                  styles.paymentOption,
                  {
                    borderColor: getPaymentBorderColor(
                      paymentOption === "CASH",
                    ),
                  },
                  !isPaymentSectionEnabled() && { opacity: 0.5 },
                ]}
                onPress={() => {
                  if (!isPaymentSectionEnabled()) return;
                  setPaymentOption("CASH");
                  setCashPin("");
                  setCashPinModal("");
                  setPinModalVisible(true);
                  // Clear any previous errors when opening modal
                  setWrongPurchaseCodeError("");
                  setPurchaseError("");
                  if (paymentError) {
                    setPaymentError("");
                  }
                  if (cashPinError) {
                    setCashPinError("");
                  }
                }}
                disabled={!isPaymentSectionEnabled()}
              >
                {paymentOption === "CASH" ? (
                  <SvgIcons.cameraIconActive width={24} height={24} />
                ) : (
                  <SvgIcons.cameraIconInActive width={24} height={24} />
                )}
                <Text
                  style={[
                    styles.paymentOptionText,
                    paymentOption === "CASH" && { color: "#5A2F0E" },
                  ]}
                >
                  Cash
                </Text>
              </TouchableOpacity>

              {/* Debit/Credit Card Button */}
              <TouchableOpacity
                style={[
                  styles.paymentOption,
                  {
                    borderColor: getPaymentBorderColor(
                      paymentOption === "BANK",
                    ),
                  },
                  !isPaymentSectionEnabled() && { opacity: 0.5 },
                ]}
                onPress={() => {
                  if (!isPaymentSectionEnabled()) return;
                  if (selectedTabState === "Members") {
                    setPaymentOption("BANK");
                    // Clear any previous errors when opening modal
                    setWrongPurchaseCodeError("");
                    setPurchaseError("");
                    setPurchaseCodeModalVisible(true);
                  } else {
                    setPaymentOption("BANK");
                  }
                  if (paymentError) {
                    setPaymentError("");
                  }
                  if (cashPinError) {
                    setCashPinError("");
                  }
                  setPinModalVisible(false);
                  setCashPin("");
                }}
                // disabled={!isPaymentSectionEnabled()}
                disabled={true}
              >
                {paymentOption === "BANK" ? (
                  <SvgIcons.cardIconActive width={24} height={24} />
                ) : (
                  <SvgIcons.cardIconInActive width={24} height={24} />
                )}
                <Text
                  style={[
                    styles.paymentOptionText,
                    paymentOption === "BANK" && { color: "#5A2F0E" },
                  ]}
                >
                  Bank Card
                </Text>
              </TouchableOpacity>
            </View>
            <View style={styles.paymentOptionsPOS}>
              <TouchableOpacity
                style={[
                  styles.paymentOption,
                  {
                    borderColor: getPaymentBorderColor(
                      paymentOption === "P.O.S",
                    ),
                  },
                  !isPaymentSectionEnabled() && { opacity: 0.5 },
                ]}
                onPress={() => {
                  if (!isPaymentSectionEnabled()) return;
                  // Validate that tickets are selected and form is completed
                  if (
                    !selectedTickets.some((ticket: any) => ticket.quantity > 0)
                  ) {
                    setTicketError("Please select at least one ticket.");
                    return;
                  }
                  if (!name.trim()) {
                    setNameError("Please enter a valid name.");
                    return;
                  }
                  if (!email) {
                    setEmailError(
                      "Please enter a valid email or phone number.",
                    );
                    return;
                  }

                  if (selectedTabState === "Members") {
                    setPaymentOption("P.O.S");
                    // Clear any previous errors when opening modal
                    setWrongPurchaseCodeError("");
                    setPurchaseError("");
                    setPurchaseCodeModalVisible(true);
                  } else {
                    setPaymentOption("P.O.S");
                    setPOSModalVisible(true);
                  }
                  if (paymentError) {
                    setPaymentError("");
                  }
                  if (cashPinError) {
                    setCashPinError("");
                  }
                  setPinModalVisible(false);
                }}
                disabled={!isPaymentSectionEnabled()}
              >
                {paymentOption === "P.O.S" ? (
                  <SvgIcons.mobMoneyIconActive width={24} height={24} />
                ) : (
                  <SvgIcons.mobMoneyIconActive width={24} height={24} />
                )}
                <Text
                  style={[
                    styles.paymentOptionText,
                    paymentOption === "P.O.S" && { color: "#5A2F0E" },
                  ]}
                >
                  P.O.S.
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.paymentOption,
                  {
                    borderColor: getPaymentBorderColor(
                      paymentOption === "MOBILE_MONEY",
                    ),
                  },
                  !isPaymentSectionEnabled() && { opacity: 0.5 },
                ]}
                onPress={() => {
                  if (!isPaymentSectionEnabled()) return;
                  if (selectedTabState === "Members") {
                    setPaymentOption("MOBILE_MONEY");
                    // Clear any previous errors when opening modal
                    setWrongPurchaseCodeError("");
                    setPurchaseError("");
                    setPurchaseCodeModalVisible(true);
                  } else {
                    setPaymentOption("MOBILE_MONEY");
                  }
                  if (paymentError) {
                    setPaymentError("");
                  }
                  if (cashPinError) {
                    setCashPinError("");
                  }
                  setPinModalVisible(false);
                  setCashPin("");
                }}
                // disabled={!isPaymentSectionEnabled()}
                disabled={true}
              >
                {paymentOption === "MOBILE_MONEY" ? (
                  <SvgIcons.mobMoneyIconActive width={24} height={24} />
                ) : (
                  <SvgIcons.mobMoneyIconInActive width={24} height={24} />
                )}
                <Text
                  style={[
                    styles.paymentOptionText,
                    paymentOption === "MOBILE_MONEY" && { color: "#5A2F0E" },
                  ]}
                >
                  Mobile Money
                </Text>
              </TouchableOpacity>
            </View>
          </View>
          {paymentError && <Text style={styles.errorText}>{paymentError}</Text>}
          {cashPinError && <Text style={styles.errorText}>{cashPinError}</Text>}
          {paymentOption && paymentOption !== "P.O.S" && (
            <TouchableOpacity
              style={[
                styles.getTicketsButton,
                (!selectedTickets.some((ticket: any) => ticket.quantity > 0) || isSubmitting) && {
                  backgroundColor: "#AE6F28A0",
                },
              ]}
              onPress={navigateToCheckInAllTicketsScreen}
              disabled={!selectedTickets.some((ticket: any) => ticket.quantity > 0) || isSubmitting}
            >
              {isSubmitting ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={styles.getTicketsButtonText}>Get Ticket(s)</Text>
              )}
            </TouchableOpacity>
          )}
        </View>
        <Modal visible={isPOSModalVisible} transparent animationType="slide">
          <View style={styles.modalContainer}>
            <View style={styles.modalContent}>
              <View style={styles.modalTitleContainer}>
                <Text style={styles.modalTitle}>POS Payment</Text>
              </View>
              <TextInput
                style={[
                  styles.inputTransaction,
                  transactionError ? styles.inputError : null,
                ]}
                placeholder="Transaction / Receipt ID"
                placeholderTextColor={color.brown_766F6A}
                value={transactionNumber}
                onChangeText={(text: string) => {
                  setTransactionNumber(text);
                  // Clear transaction error when user starts typing
                  if (transactionError) {
                    setTransactionError("");
                  }
                }}
                keyboardType="default"
              />
              {transactionError && (
                <Text style={styles.errorTextTransaction}>
                  {transactionError}
                </Text>
              )}
              <TouchableOpacity
                style={[
                  styles.getTicketsButtonPOS,
                  (!selectedTickets.some((ticket: any) => ticket.quantity > 0) ||
                    !transactionNumber.trim() ||
                    isSubmitting) && { backgroundColor: "#AE6F28A0" },
                ]}
                onPress={handlePOSPayment}
                disabled={
                  !selectedTickets.some((ticket: any) => ticket.quantity > 0) ||
                  !transactionNumber.trim() ||
                  isSubmitting
                }
              >
                {isSubmitting ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.getTicketsButtonTextPOS}>Get Ticket(s)</Text>
                )}
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setPOSModalVisible(false)}
                style={styles.cancelButtonContainer}
              >
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

        <Modal visible={isPinModalVisible} transparent animationType="slide">
          <View style={styles.modalContainer}>
            <View style={styles.modalContent}>
              <View style={styles.modalTitleContainer}>
                <Text style={styles.modalTitle}>Enter PIN</Text>
              </View>
              <TextInput
                style={[
                  styles.inputTransaction,
                  cashPinError ? styles.inputError : null,
                ]}
                placeholder="Enter PIN"
                placeholderTextColor={color.brown_766F6A}
                value={cashPinModal}
                onChangeText={(text: string) => {
                  setCashPinModal(text);
                  if (cashPinError) {
                    setCashPinError("");
                  }
                }}
                keyboardType="default"
                selectionColor={color.selectField_CEBCA0}
              />
              {cashPinError && (
                <Text style={styles.errorTextTransaction}>{cashPinError}</Text>
              )}
              <TouchableOpacity
                style={[styles.getTicketsButtonPOS, styles.disabledButton]}
                disabled
              >
                <Text style={styles.getTicketsButtonTextPOS}>Continue</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => {
                  setPinModalVisible(false);
                  setPaymentOption("");
                  setCashPinModal("");
                  setCashPin("");
                  setCashPinError("");
                }}
                style={styles.cancelButtonContainer}
              >
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

        {/* Purchase Code Modal */}
        <Modal
          visible={isPurchaseCodeModalVisible}
          transparent
          animationType="slide"
        >
          <View style={styles.modalContainer}>
            <View style={styles.modalContent}>
              <View style={styles.modalTitleContainer}>
                <Text style={styles.modalTitle}>Purchase Code</Text>
              </View>
              <TextInput
                style={[
                  styles.inputTransaction,
                  transactionError || wrongPurchaseCodeError
                    ? styles.inputError
                    : null,
                ]}
                placeholder="Enter Code"
                placeholderTextColor={color.brown_766F6A}
                value={purchaseCodeModal}
                onChangeText={(text: string) => {
                  setPurchaseCodeModal(text);
                  // Clear purchase errors when user starts typing
                  if (purchaseError) {
                    setPurchaseError("");
                  }
                  if (wrongPurchaseCodeError) {
                    setWrongPurchaseCodeError("");
                  }
                }}
                keyboardType="default"
              />
              {purchaseError && (
                <Text style={styles.errorTextTransaction}>{purchaseError}</Text>
              )}
              {wrongPurchaseCodeError && (
                <View style={styles.wrongPurchaseCodeErrorContainer}>
                  <TouchableOpacity onPress={dismissError}>
                    <SvgIcons.crossIconRed
                      width={20}
                      height={20}
                      fill={color.red_FF3B30}
                    />
                  </TouchableOpacity>
                  <Text style={styles.wrongPurchaseCodeErrorText}>
                    {wrongPurchaseCodeError}
                  </Text>
                </View>
              )}
              <TouchableOpacity
                style={[
                  styles.getTicketsButtonPOS,
                  (!purchaseCodeModal.trim() || isSubmitting) && { backgroundColor: "#AE6F28A0" },
                ]}
                onPress={async () => {
                  if (!purchaseCodeModal.trim()) {
                    setPurchaseError("Please enter a valid purchase code.");
                    return;
                  }

                  try {
                    // Validate purchase code with backend
                    const items = selectedTickets
                      .filter((ticket: any) => ticket.quantity > 0)
                      .map((ticket: any) => ({
                        ticketTypeId: ticket.id,
                        quantity: ticket.quantity,
                      }));

                    if (items.length === 0) {
                      setTicketError("Please select at least one ticket.");
                      return;
                    }

                    // Generate transaction ID for non-POS payments
                    const transactionId =
                      paymentOption === "P.O.S"
                        ? null
                        : `TXN-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

                    setIsSubmitting(true);
                    const codeRes = await doBoxOfficeGetTicket(
                      eventInfo.eventUuid,
                      items,
                      email,
                      paymentOption.toUpperCase(),
                      transactionId,
                      name.trim(),
                      purchaseCodeModal.trim(),
                    );
                    const response = codeRes?.data;

                    setPurchaseCode(purchaseCodeModal);
                    setPurchaseCodeModalVisible(false);

                    if (paymentOption === "P.O.S") {
                      setPOSModalVisible(true);
                    } else {
                      const codeRawTickets: any[] = response?.data || [];
                      const orderNumber = codeRawTickets[0]?.orderNumber;
                      const codePreloadedTickets = toLegacyTickets(codeRawTickets, name.trim(), email);
                      const codeTicketEventUuid = codeRawTickets[0]?.eventId || eventInfo.eventUuid;
                      navigation.navigate("ManualCheckInAllTickets", {
                        orderNumber,
                        eventUuid: codeTicketEventUuid,
                        total: totalQuantity,
                        eventInfo,
                        preloadedTickets: codePreloadedTickets,
                        onScanCountUpdate,
                      });
                    }
                  } catch (error: any) {
                    logger.error("BoxOffice purchase code Error:", error);
                    const errorMsg =
                      error?.response?.data?.message ||
                      error?.message ||
                      "We couldn't process your request. Please try again or contact support.";
                    setErrorMessage(errorMsg);
                    setShowErrorPopup(true);
                    if (error.isPurchaseCodeError) {
                      setWrongPurchaseCodeError(
                        "Please enter a valid purchase code",
                      );
                    }
                  } finally {
                    setIsSubmitting(false);
                  }
                }}
                disabled={!purchaseCodeModal.trim() || isSubmitting}
              >
                {isSubmitting ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.getTicketsButtonTextPOS}>
                    {paymentOption === "P.O.S" ? "Continue" : "Get Ticket(s)"}
                  </Text>
                )}
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setPurchaseCodeModalVisible(false)}
                style={styles.cancelButtonContainer}
              >
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      </KeyboardAwareScrollView>
      <ErrorPopup
        visible={showErrorPopup}
        onClose={handleCloseErrorPopup}
        title="Error"
        subtitle={
          errorMessage ||
          "We couldn't process your request. Please try again or contact support."
        }
      />
    </>
  );
};

export default BoxOfficeTab;
