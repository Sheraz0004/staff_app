import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  TextInput,
  Modal,
  ActivityIndicator,
} from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import { Ionicons } from "@expo/vector-icons";
import { color } from "../../color/color";
import { Formik } from "formik";
import * as Yup from "yup";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import SvgIcons from "../../components/SvgIcons";
import { formatDateWithMonthName } from "../../constants/dateAndTime";
import ErrorPopup from "../../constants/ErrorPopup";
import { logger } from "../../utils/logger";
import { useApi } from "../../services/useApi";
import { CHECK_IN_SERVICES } from "../../services/CheckInService";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch } from "../../redux/store";
import {
  fetchBoxOfficeDataThunk,
  setBoxOfficeActiveTab,
  updateTicketQuantity,
  resetBoxOffice,
  selectBoxOfficePricingCategories,
  selectBoxOfficeActiveTab,
  selectBoxOfficeSelectedTickets,
  selectBoxOfficeLoading,
  selectBoxOfficeError,
  BoxOfficeTicket,
} from "../../redux/reducers/boxOfficeSlice";
import { selectSellSelectedEvent } from "../../redux/reducers/sellCheckinSlice";
import { useToast } from "../../components/Toast/ToastContext";
import { styles } from "./index.styles";
import Loader from "@/src/components/Loader/Loader";

const toLegacyTickets = (
  tickets: any[],
  buyerName: string,
  buyerEmail: string,
) => {
  const [firstName = "", ...rest] = buyerName.split(" ");
  const lastName = rest.join(" ");
  return tickets.map((t: any) => ({
    code: t.code,
    uuid: String(t.id || t.ticketNumber || ""),
    ticket_number: t.ticketNumber,
    ticket_type: t.ticketType,
    ticket_class: t.ticketClass,
    ticket_price: t.ticketPrice,
    checkin_status: t.checkinStatus || "UNSCANNED",
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
    scanned_by: t.scannedBy
      ? {
          name: t.scannedBy.name,
          staff_id: t.scannedBy.staffId,
          scanned_on: t.scannedBy.scannedOn,
        }
      : null,
    last_scanned_on: t.scannedBy?.scannedOn ?? null,
    last_scanned_by_name: t.scannedBy?.name ?? null,
  }));
};

interface BoxOfficeTabProps {
  onScanCountUpdate?: any;
}

const validationSchema = Yup.object().shape({
  name: Yup.string().required("Name is required"),
  email: Yup.string()
    .test(
      "emailOrPhone",
      "Invalid email or phone number",
      (v) =>
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v ?? "") ||
        /^[0-9]{7,15}$/.test(v ?? ""),
    )
    .required("Required"),
});

const BoxOfficeTab: React.FC<BoxOfficeTabProps> = ({ onScanCountUpdate }) => {
  const dispatch = useDispatch<AppDispatch>();
  const navigation = useNavigation<any>();
  const { showErrorToast } = useToast();

  const selectedEvent = useSelector(selectSellSelectedEvent);
  const pricingCategories = useSelector(selectBoxOfficePricingCategories);
  const activeTab = useSelector(selectBoxOfficeActiveTab);
  const selectedTickets = useSelector(selectBoxOfficeSelectedTickets);
  const isLoading = useSelector(selectBoxOfficeLoading);
  const error = useSelector(selectBoxOfficeError);

  const { requestCall: doBoxOfficeGetTicket } = useApi(
    CHECK_IN_SERVICES.boxOfficeGetTicket,
    false,
    false,
  );

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [purchaseCode, setPurchaseCode] = useState("");
  const [paymentOption, setPaymentOption] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [isPinModalVisible, setPinModalVisible] = useState(false);
  const [cashPinModal, setCashPinModal] = useState("");
  const [cashPinError, setCashPinError] = useState("");

  const [isPOSModalVisible, setPOSModalVisible] = useState(false);
  const [transactionNumber, setTransactionNumber] = useState("");
  const [transactionError, setTransactionError] = useState("");

  const [isPurchaseCodeModalVisible, setPurchaseCodeModalVisible] =
    useState(false);
  const [purchaseCodeModal, setPurchaseCodeModal] = useState("");

  const [nameError, setNameError] = useState("");
  const [emailError, setEmailError] = useState("");
  const [purchaseError, setPurchaseError] = useState("");
  const [wrongPurchaseCodeError, setWrongPurchaseCodeError] = useState("");
  const [paymentError, setPaymentError] = useState("");
  const [ticketError, setTicketError] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showErrorPopup, setShowErrorPopup] = useState(false);

  const resetForm = () => {
    setName("");
    setEmail("");
    setPurchaseCode("");
    setPaymentOption("");
    setTransactionNumber("");
    setPurchaseCodeModal("");
    setCashPinModal("");
    setCashPinError("");
    setNameError("");
    setEmailError("");
    setPurchaseError("");
    setWrongPurchaseCodeError("");
    setPaymentError("");
    setTicketError("");
    setTransactionError("");
    setPOSModalVisible(false);
    setPinModalVisible(false);
    setPurchaseCodeModalVisible(false);
  };

  useEffect(() => {
    if (error) showErrorToast(error, 'Failed to load box office');
  }, [error]);

  useFocusEffect(
    React.useCallback(() => {
      dispatch(resetBoxOffice());
      resetForm();
      const uuid = selectedEvent?.eventUuid;
      if (!uuid) return;
      dispatch(fetchBoxOfficeDataThunk({ eventUuid: uuid }));
    }, [selectedEvent?.eventUuid]),
  );

  const hasSelectedTicket = () => selectedTickets.some((t) => t.quantity > 0);
  const isNameAndEmailFilled = () =>
    !!(
      name.trim() &&
      (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || /^[0-9]{7,15}$/.test(email))
    );
  const isPaymentEnabled = () => hasSelectedTicket() && isNameAndEmailFilled();
  const isFormEnabled = () => hasSelectedTicket();

  const getInputBorderColor = () =>
    isFormEnabled() ? color.borderBrown_CEBCA0 : color.brown_766F6A;
  const getPaymentBorderColor = (selected: boolean) => {
    if (!isPaymentEnabled()) return color.brown_766F6A;
    return selected ? color.btnBrown_AE6F28 : color.borderBrown_CEBCA0;
  };

  const totalQuantity = selectedTickets.reduce((s, t) => s + t.quantity, 0);
  const calculateTotal = () =>
    selectedTickets.reduce((s, t) => s + t.quantity * t.discountPrice, 0);

  const buildItems = () =>
    selectedTickets
      .filter((t) => t.quantity > 0)
      .map((t) => ({ ticketTypeId: t.id, quantity: t.quantity }));

  const clearErrors = () => {
    setNameError("");
    setEmailError("");
    setPurchaseError("");
    setWrongPurchaseCodeError("");
    setPaymentError("");
    setTicketError("");
    setTransactionError("");
  };

  const submitOrder = async (
    paymentMethod: string,
    transactionId: string | null,
    code?: string,
  ) => {
    const items = buildItems();
    if (items.length === 0) {
      setTicketError("Please select at least one ticket.");
      return false;
    }
    setIsSubmitting(true);
    try {
      const res = await doBoxOfficeGetTicket(
        selectedEvent!.eventUuid,
        items,
        email,
        paymentMethod,
        transactionId,
        name.trim(),
        code,
      );
      const rawTickets: any[] = res?.data?.data || [];
      const orderNumber = rawTickets[0]?.orderNumber;
      navigation.navigate("ManualCheckInAllTickets", {
        orderNumber,
        eventUuid: rawTickets[0]?.eventId || selectedEvent?.eventUuid,
        total: totalQuantity,
        eventInfo: selectedEvent,
        preloadedTickets: toLegacyTickets(rawTickets, name.trim(), email),
        onScanCountUpdate,
      });
      return true;
    } catch (err: any) {
      logger.error("BoxOffice submit error:", err?.response);
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        "Could not process request. Try again.";
      setErrorMessage(msg);
      setShowErrorPopup(true);
      if (err.isPurchaseCodeError)
        setWrongPurchaseCodeError("Please enter a valid purchase code");
      return false;
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGetTickets = async () => {
    clearErrors();
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
    const transactionId = `TXN-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    await submitOrder(
      paymentOption.toUpperCase(),
      transactionId,
      activeTab === "Members" ? purchaseCode : undefined,
    );
  };

  const handleCashPinSubmit = async () => {
    if (!cashPinModal.trim()) return;
    const transactionId = `TXN-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const success = await submitOrder(
      "CASH",
      transactionId,
      activeTab === "Members" ? purchaseCode : undefined,
    );
    if (success) setPinModalVisible(false);
  };

  const handlePOSPayment = async () => {
    clearErrors();
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
    const success = await submitOrder(
      "POS",
      transactionNumber.trim(),
      activeTab === "Members" ? purchaseCode : undefined,
    );
    if (success) setPOSModalVisible(false);
  };

  const handlePurchaseCodeSubmit = async () => {
    if (!purchaseCodeModal.trim()) {
      setPurchaseError("Please enter a valid purchase code.");
      return;
    }
    const transactionId =
      paymentOption === "P.O.S"
        ? null
        : `TXN-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const items = buildItems();
    if (items.length === 0) {
      setTicketError("Please select at least one ticket.");
      return;
    }
    setIsSubmitting(true);
    try {
      const res = await doBoxOfficeGetTicket(
        selectedEvent!.eventUuid,
        items,
        email,
        paymentOption.toUpperCase(),
        transactionId,
        name.trim(),
        purchaseCodeModal.trim(),
      );
      setPurchaseCode(purchaseCodeModal);
      setPurchaseCodeModalVisible(false);
      if (paymentOption === "P.O.S") {
        setPOSModalVisible(true);
      } else {
        const rawTickets: any[] = res?.data?.data || [];
        navigation.navigate("ManualCheckInAllTickets", {
          orderNumber: rawTickets[0]?.orderNumber,
          eventUuid: rawTickets[0]?.eventId || selectedEvent?.eventUuid,
          total: totalQuantity,
          eventInfo: selectedEvent,
          preloadedTickets: toLegacyTickets(rawTickets, name.trim(), email),
          onScanCountUpdate,
        });
      }
    } catch (err: any) {
      logger.error("BoxOffice purchase code error:", err);
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        "Could not process request.";
      setErrorMessage(msg);
      setShowErrorPopup(true);
      if (err.isPurchaseCodeError)
        setWrongPurchaseCodeError("Please enter a valid purchase code");
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderTab = ({ item }: { item: string }) => (
    <TouchableOpacity
      style={[styles.tabButton, activeTab === item && styles.selectedTabButton]}
      onPress={() => dispatch(setBoxOfficeActiveTab(item))}
    >
      <Text
        style={[
          styles.tabButtonText,
          activeTab === item && styles.selectedTabButtonText,
        ]}
      >
        {item}
      </Text>
    </TouchableOpacity>
  );

  const renderTicketItem = ({
    item,
    index,
  }: {
    item: BoxOfficeTicket;
    index: number;
  }) => (
    <View style={styles.ticketCard}>
      <View style={styles.ticketRow}>
        <View style={styles.leftColumn}>
          <Text style={styles.ticketType}>{item.type}</Text>
          {item.discountPrice < item.price && (
            <Text style={styles.discountText}>Early Bird Discount</Text>
          )}
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
          </View>
          <View style={styles.quantitySelectorContainer}>
            <TouchableOpacity
              style={styles.quantityButton}
              onPress={() =>
                dispatch(
                  updateTicketQuantity({ index, quantity: item.quantity - 1 }),
                )
              }
              disabled={item.quantity <= 0}
            >
              <SvgIcons.removeIcon width={12} height={12} />
            </TouchableOpacity>
            <View style={styles.quantityCountContainer}>
              <Text style={styles.quantityText}>{item.quantity}</Text>
            </View>
            <TouchableOpacity
              style={styles.quantityButton}
              onPress={() =>
                dispatch(
                  updateTicketQuantity({ index, quantity: item.quantity + 1 }),
                )
              }
              disabled={item.quantity >= item.purchase_limit}
            >
              <SvgIcons.addIcon width={12} height={12} />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </View>
  );

  if (isLoading) {
    return (
      <Loader isLoading={isLoading} />
      // <View style={styles.loadingContainer}>
      //   <ActivityIndicator size="large" color={color.btnBrown_AE6F28} />
      // </View>
    );
  }

  if (pricingCategories.length === 0) {
    return (
      <View style={styles.fullEmptyContainer}>
        <Ionicons
          name="ticket-outline"
          size={72}
          color={color.btnBrown_AE6F28}
          style={{ opacity: 0.45 }}
        />
        <Text style={styles.emptyTitle}>No Box Office Options</Text>
        <Text style={styles.emptySubtitle}>
          There are no ticket options configured for this event. Please contact
          the event organizer.
        </Text>
      </View>
    );
  }

  return (
    <>
      <KeyboardAwareScrollView
        style={styles.container}
        contentContainerStyle={styles.scrollContent}
        enableOnAndroid
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        extraScrollHeight={40}
        enableResetScrollToCoords={false}
        automaticallyAdjustContentInsets={false}
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
          keyExtractor={(_, index) => index.toString()}
          contentContainerStyle={(styles as any).listContent}
          scrollEnabled={false}
          ListEmptyComponent={
            <View style={styles.listEmptyContainer}>
              <Ionicons
                name="ticket-outline"
                size={52}
                color={color.btnBrown_AE6F28}
                style={{ opacity: 0.45 }}
              />
              <Text style={styles.emptyTitle}>No Tickets Available</Text>
              <Text style={styles.emptySubtitle}>
                No tickets are available for this category.
              </Text>
            </View>
          }
        />

        <View style={(styles as any).footer}>
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

          <Formik
            key={activeTab}
            initialValues={{ name: "", email: "" }}
            validationSchema={validationSchema}
            onSubmit={() => {}}
          >
            {({ handleChange, handleBlur, values, errors, touched }) => (
              <View style={{ width: "100%" }}>
                <View style={styles.whitebg}>
                  <TextInput
                    style={[
                      styles.input,
                      touched.name && errors.name ? styles.inputError : null,
                      values.name
                        ? styles.inputWithText
                        : styles.inputPlaceholder,
                      { borderColor: getInputBorderColor() },
                      !isFormEnabled() && { opacity: 0.5 },
                    ]}
                    placeholder="Enter Name"
                    placeholderTextColor={color.brown_766F6A}
                    onChangeText={(t) => {
                      handleChange("name")(t);
                      setName(t);
                      if (nameError) setNameError("");
                    }}
                    onBlur={handleBlur("name")}
                    value={values.name}
                    selectionColor={color.selectField_CEBCA0}
                    editable={isFormEnabled()}
                  />
                  {touched.name && errors.name && (
                    <Text style={styles.errorText}>{errors.name}</Text>
                  )}
                  {nameError && (
                    <Text style={styles.errorText}>{nameError}</Text>
                  )}

                  <TextInput
                    style={[
                      styles.input,
                      touched.email && errors.email ? styles.inputError : null,
                      values.email
                        ? styles.inputWithText
                        : styles.inputPlaceholder,
                      { borderColor: getInputBorderColor() },
                      !isFormEnabled() && { opacity: 0.6 },
                    ]}
                    placeholder="Email or Phone Number"
                    placeholderTextColor={color.brown_766F6A}
                    onChangeText={(t) => {
                      handleChange("email")(t);
                      setEmail(t);
                      if (emailError) setEmailError("");
                    }}
                    onBlur={handleBlur("email")}
                    value={values.email}
                    keyboardType="email-address"
                    selectionColor={color.selectField_CEBCA0}
                    editable={isFormEnabled()}
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

          <View style={(styles as any).lineView3} />
          <View style={styles.whitebgPayment}>
            <View style={styles.paymentOptions}>
              <TouchableOpacity
                style={[
                  styles.paymentOption,
                  {
                    borderColor: getPaymentBorderColor(
                      paymentOption === "CASH",
                    ),
                  },
                  !isPaymentEnabled() && { opacity: 0.5 },
                ]}
                onPress={() => {
                  if (!isPaymentEnabled()) return;
                  setPaymentOption("CASH");
                  setCashPinModal("");
                  setPinModalVisible(true);
                  if (paymentError) setPaymentError("");
                }}
                disabled={!isPaymentEnabled()}
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

              <TouchableOpacity
                style={[
                  styles.paymentOption,
                  {
                    borderColor: getPaymentBorderColor(
                      paymentOption === "BANK",
                    ),
                  },
                  { opacity: 0.35 },
                ]}
                onPress={() => {}}
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
                  !isPaymentEnabled() && { opacity: 0.5 },
                ]}
                onPress={() => {
                  if (!isPaymentEnabled()) return;
                  if (!hasSelectedTicket()) {
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
                  setPaymentOption("P.O.S");
                  if (activeTab === "Members") {
                    setWrongPurchaseCodeError("");
                    setPurchaseError("");
                    setPurchaseCodeModalVisible(true);
                  } else {
                    setPOSModalVisible(true);
                  }
                  if (paymentError) setPaymentError("");
                  setPinModalVisible(false);
                }}
                disabled={!isPaymentEnabled()}
              >
                <SvgIcons.mobMoneyIconActive width={24} height={24} />
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
                  !isPaymentEnabled() && { opacity: 0.5 },
                ]}
                onPress={() => {
                  if (!isPaymentEnabled()) return;
                  setPaymentOption("MOBILE_MONEY");
                  if (activeTab === "Members") {
                    setWrongPurchaseCodeError("");
                    setPurchaseError("");
                    setPurchaseCodeModalVisible(true);
                  }
                  if (paymentError) setPaymentError("");
                  setPinModalVisible(false);
                  setCashPinModal("");
                }}
                disabled={!isPaymentEnabled()}
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
                (!hasSelectedTicket() || isSubmitting) && {
                  backgroundColor: "#AE6F28A0",
                },
              ]}
              onPress={handleGetTickets}
              disabled={!hasSelectedTicket() || isSubmitting}
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
                onChangeText={(t) => {
                  setTransactionNumber(t);
                  if (transactionError) setTransactionError("");
                }}
              />
              {transactionError && (
                <Text style={styles.errorTextTransaction}>
                  {transactionError}
                </Text>
              )}
              <TouchableOpacity
                style={[
                  styles.getTicketsButtonPOS,
                  (!hasSelectedTicket() ||
                    !transactionNumber.trim() ||
                    isSubmitting) && { backgroundColor: "#AE6F28A0" },
                ]}
                onPress={handlePOSPayment}
                disabled={
                  !hasSelectedTicket() ||
                  !transactionNumber.trim() ||
                  isSubmitting
                }
              >
                {isSubmitting ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.getTicketsButtonTextPOS}>
                    Get Ticket(s)
                  </Text>
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
                onChangeText={(t) => {
                  setCashPinModal(t);
                  if (cashPinError) setCashPinError("");
                }}
                selectionColor={color.selectField_CEBCA0}
              />
              {cashPinError && (
                <Text style={styles.errorTextTransaction}>{cashPinError}</Text>
              )}
              <TouchableOpacity
                style={[
                  styles.getTicketsButtonPOS,
                  (!cashPinModal.trim() || isSubmitting) && {
                    backgroundColor: "#AE6F28A0",
                  },
                ]}
                onPress={handleCashPinSubmit}
                disabled={!cashPinModal.trim() || isSubmitting}
              >
                {isSubmitting ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.getTicketsButtonTextPOS}>Continue</Text>
                )}
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => {
                  setPinModalVisible(false);
                  setPaymentOption("");
                  setCashPinModal("");
                  setCashPinError("");
                }}
                style={styles.cancelButtonContainer}
              >
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

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
                onChangeText={(t) => {
                  setPurchaseCodeModal(t);
                  if (purchaseError) setPurchaseError("");
                  if (wrongPurchaseCodeError) setWrongPurchaseCodeError("");
                }}
              />
              {purchaseError && (
                <Text style={styles.errorTextTransaction}>{purchaseError}</Text>
              )}
              {wrongPurchaseCodeError && (
                <View style={styles.wrongPurchaseCodeErrorContainer}>
                  <TouchableOpacity
                    onPress={() => {
                      setWrongPurchaseCodeError("");
                    }}
                  >
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
                  (!purchaseCodeModal.trim() || isSubmitting) && {
                    backgroundColor: "#AE6F28A0",
                  },
                ]}
                onPress={handlePurchaseCodeSubmit}
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
        onClose={() => {
          setShowErrorPopup(false);
          setErrorMessage(null);
        }}
        title="Error"
        subtitle={
          errorMessage || "We couldn't process your request. Please try again."
        }
      />
    </>
  );
};

export default BoxOfficeTab;
