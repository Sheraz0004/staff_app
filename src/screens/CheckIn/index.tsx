import { CameraView, useCameraPermissions } from "expo-camera";
import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  Text,
  TouchableOpacity,
  View,
  Dimensions,
  Animated,
  ActivityIndicator,
} from "react-native";
import CameraOverlay from "../../components/CameraOverlay";
import Header from "../../components/header";
import MaterialIcons from "react-native-vector-icons/MaterialIcons";
import { getFormatDate } from "../../constants/currentdateandtime";
import NoteModal from "../../constants/noteModal";
import {
  useNavigation,
  useFocusEffect,
  useIsFocused,
} from "@react-navigation/native";
import { logger } from "../../utils/logger";
import { useOfflineSync } from "../../hooks/useOfflineSync";
import { useApi } from "../../services/useApi";
import { CHECK_IN_SERVICES } from "../../services/CheckInService";
import { styles } from "./index.styles";

const { width } = Dimensions.get("window");

interface HomeScreenProps {
  eventInfo: any;
  onScanCountUpdate?: () => void;
  activeHeaderTab?: any;
  onHeaderTabChange?: (tab: string) => void;
  userRole?: string;
}

interface ScanResult {
  text: string;
  color: string;
  icon: string;
}

const HomeScreen: React.FC<HomeScreenProps> = ({
  eventInfo,
  onScanCountUpdate,
  activeHeaderTab,
  onHeaderTabChange,
  userRole,
}) => {
  const navigation = useNavigation<any>();
  const isFocused = useIsFocused();
  const { requestCall: requestScan } = useApi(
    CHECK_IN_SERVICES.scanTicket,
    false,
    false,
  );
  const { requestCall: requestUpdateNote } = useApi(
    CHECK_IN_SERVICES.updateTicketNote,
    false,
    false,
  );

  const [permission, requestPermission] = useCameraPermissions();
  const [scannedData, setScannedData] = useState<string | null>(null);

  const [scanResult, setScanResult] = useState<ScanResult | null>(null);
  const [scanTime, setScanTime] = useState<string | null>(null);
  const [showAnimation, setShowAnimation] = useState<boolean>(false);
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [noteToEdit, setNoteToEdit] = useState<string | null>(null);
  const [noteModalVisible, setNoteModalVisible] = useState<boolean>(false);
  const [noteUpdating, setNoteUpdating] = useState<boolean>(false);
  const [isDuplicateScan, setIsDuplicateScan] = useState<boolean>(false);

  const animatedWidth = useRef(new Animated.Value(0)).current;
  const scanningRef = useRef(false);
  const scanResponseRef = useRef<any>(null);
  const notesRef = useRef(notes);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const { isOnline } = useOfflineSync(false);

  useEffect(() => {
    notesRef.current = notes;
  }, [notes]);

  useEffect(() => {
    requestPermission();
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  useFocusEffect(
    useCallback(() => {
      scanningRef.current = false;
      onHeaderTabChange?.("Auto");
    }, [onHeaderTabChange]),
  );

  const animateProgressBar = useCallback(() => {
    animatedWidth.setValue(0);
    Animated.timing(animatedWidth, {
      toValue: width,
      duration: 1000,
      useNativeDriver: false,
    }).start();
  }, [animatedWidth]);

  const handleBarCodeScanned = useCallback(
    async ({ data }: { data: string }) => {
      if (scanningRef.current) return;
      scanningRef.current = true;

      setScannedData(data);
      setScanTime(getFormatDate());
      setIsDuplicateScan(false);

      try {
        const note = notesRef.current[data] || "";
        const res = await requestScan(data, note);
        const scanData = res?.data;
        console.log("scanData->", scanData);
        scanResponseRef.current = scanData;

        if (scanData?.note) {
          setNotes((prev) => ({ ...prev, [data]: scanData.note }));
        }

        let result: ScanResult = {
          text: "Scan Successful",
          color: "#4BB543",
          icon: "check",
        };

        if (scanData?.offline || scanData?.queued) {
          result = {
            text: scanData?.queued
              ? "Queued for Sync"
              : "Scan Successful (Offline)",
            color: "#FFA500",
            icon: "check",
          };
        } else if (scanData?.scanCount > 1) {
          result = { text: "Scanned Already", color: "#D8A236", icon: "close" };
          setIsDuplicateScan(true);
        } else if (
          scanData?.status === "error" ||
          scanData?.status === "invalid"
        ) {
          result = {
            text: "Scan Unsuccessful",
            color: "#ED4337",
            icon: "close",
          };
        } else {
          onScanCountUpdate?.();
        }

        setScanResult(result);
      } catch (error: any) {
        const isScanLimit = error.response?.data?.non_field_errors?.includes(
          "Scan limit reached.",
        );
        setScanResult({
          text: isScanLimit ? "Scan Limit Reached" : "Scan Unsuccessful",
          color: isScanLimit ? "#D8A236" : "#ED4337",
          icon: "close",
        });
      } finally {
        animateProgressBar();
        setShowAnimation(true);

        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        timeoutRef.current = setTimeout(() => {
          scanningRef.current = false;
          setShowAnimation(false);
        }, 2000);
      }
    },
    [requestScan, onScanCountUpdate, animateProgressBar],
  );

  const handleAddNote = useCallback(
    async (newNote: string) => {
      if (!scannedData) return;

      const [eventId, ticketCode] = scannedData.split(":");

      setNoteModalVisible(false);

      if (newNote.trim().length > 0) {
        setNoteUpdating(true);
        try {
          await requestUpdateNote(ticketCode, newNote, eventId);
          setNotes((prev) => ({ ...prev, [scannedData]: newNote }));
        } catch (error: any) {
          logger.error("Failed to update ticket note:", error.response?.data);
        } finally {
          setNoteUpdating(false);
        }
      }
    },
    [scannedData, requestUpdateNote],
  );

  const handleNoteButtonPress = useCallback(() => {
    setNoteToEdit(notes[scannedData!] || "");
    setNoteModalVisible(true);
  }, [notes, scannedData]);

  const handleDismissResult = useCallback(() => {
    setScanResult(null);
    setIsDuplicateScan(false);
  }, []);

  const handleDetailButtonPress = useCallback(() => {
    navigation.navigate("TicketScanned", {
      scanResponse: scanResponseRef.current,
      eventInfo,
      note: notes[scannedData!] || "No note added",
    });
  }, [navigation, eventInfo, notes, scannedData]);

  if (!permission) return <View />;
  if (!permission.granted) {
    return (
      <View style={styles.container}>
        <Header
          eventInfo={eventInfo}
          activeTab={activeHeaderTab}
          onTabChange={onHeaderTabChange}
          userRole={userRole}
        />
      </View>
    );
  }

  return (
    <View style={styles.mainContainer}>
      {!isOnline && (
        <View style={styles.offlineBanner}>
          <Text style={styles.offlineText}>
            Offline Mode - Scans will be queued for sync
          </Text>
        </View>
      )}
      <Header
        eventInfo={eventInfo}
        activeTab={activeHeaderTab}
        onTabChange={onHeaderTabChange}
        userRole={userRole}
      />
      <View
        style={
          userRole === "ADMIN"
            ? styles.darkBackgroundAdmin
            : styles.darkBackground
        }
      >
        {scanResult && (
          <View style={styles.scanResultContainer}>
            {showAnimation && (
              <Animated.View
                style={[
                  styles.animatedBar,
                  { backgroundColor: scanResult.color, width: animatedWidth },
                ]}
              />
            )}
            {showAnimation && (
              <Text style={styles.animatedText}>{scanResult.text}</Text>
            )}
          </View>
        )}
        <View style={styles.cameraContainer}>
          <View style={styles.cameraWrapper}>
            {isFocused && (
              <CameraView
                style={styles.camera}
                facing="back"
                onBarcodeScanned={handleBarCodeScanned}
              />
            )}
            <CameraOverlay
              scannedData={scanResult ? scanResult.color : "#AE6F28"}
            />
          </View>
        </View>

        {scanResult && (
          <View style={styles.containerstatus}>
            <View style={styles.scanResultsContainer}>
              {isDuplicateScan ? (
                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={handleDismissResult}
                  style={[
                    styles.scaniconresult,
                    { backgroundColor: scanResult.color },
                  ]}
                >
                  <MaterialIcons
                    name={scanResult.icon}
                    size={24}
                    color="white"
                    style={{ margin: 13 }}
                  />
                </TouchableOpacity>
              ) : (
                <View
                  style={[
                    styles.scaniconresult,
                    { backgroundColor: scanResult.color },
                  ]}
                >
                  <MaterialIcons
                    name={scanResult.icon}
                    size={24}
                    color="white"
                    style={{ margin: 13 }}
                  />
                </View>
              )}
              <View style={styles.scanResults}>
                <Text style={{ color: scanResult.color }}>
                  {scanResult.text}
                </Text>
                <Text style={styles.timeColor}>{scanTime}</Text>
              </View>
              <View style={styles.buttonsContainer}>
                <TouchableOpacity
                  style={styles.detailButton}
                  onPress={handleDetailButtonPress}
                >
                  <Text style={styles.detailColor}>Details</Text>
                </TouchableOpacity>
                {isDuplicateScan && (
                  <TouchableOpacity
                    style={styles.noteButton}
                    onPress={handleNoteButtonPress}
                    disabled={noteUpdating}
                  >
                    {noteUpdating ? (
                      <ActivityIndicator
                        size="small"
                        color={styles.noteColor.color}
                      />
                    ) : (
                      <>
                        <Text style={styles.noteColor}>Note</Text>
                        {!!notes[scannedData!] && (
                          <View style={styles.greyCircle}>
                            <View style={styles.redCircle}>
                              <Text style={styles.redCircleText}>1</Text>
                            </View>
                          </View>
                        )}
                      </>
                    )}
                  </TouchableOpacity>
                )}
              </View>
            </View>
          </View>
        )}
      </View>
      {noteModalVisible && (
        <NoteModal
          visible={noteModalVisible}
          onAddNote={handleAddNote}
          onCancel={() => setNoteModalVisible(false)}
          initialNote={noteToEdit}
          scannedData={scannedData}
        />
      )}
    </View>
  );
};

export default HomeScreen;
