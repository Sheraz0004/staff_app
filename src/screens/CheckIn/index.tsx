import { CameraView, useCameraPermissions } from 'expo-camera';
import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Text,
  TouchableOpacity,
  View,
  Dimensions,
  Animated,
} from 'react-native';
import CameraOverlay from '../../components/CameraOverlay';
import Header from '../../components/header';
import { color } from '../../color/color';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { getFormatDate } from '../../constants/currentdateandtime';
import NoteModal from '../../constants/noteModal';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { logger } from '../../utils/logger';
import { useOfflineSync } from '../../hooks/useOfflineSync';
import { useApi } from '../../services/useApi';
import { CHECK_IN_SERVICES } from '../../services/CheckInService';
import { styles } from './index.styles';

const { width } = Dimensions.get('window');

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
  const [facing, setFacing] = useState<'back' | 'front'>('back');
  const [permission, requestPermission] = useCameraPermissions();
  const [scannedData, setScannedData] = useState<string | null>(null);
  const [scanResult, setScanResult] = useState<ScanResult | null>(null);
  const [scanning, setScanning] = useState<boolean>(false);
  const [scanTime, setScanTime] = useState<string | null>(null);
  const [linePosition, setLinePosition] = useState<number>(0);
  const [movingDown, setMovingDown] = useState<boolean>(true);
  const [noteModalVisible, setNoteModalVisible] = useState<boolean>(false);
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [noteCount, setNoteCount] = useState<number>(0);
  const [noteToEdit, setNoteToEdit] = useState<string | null>(null);
  const animatedWidth = useRef(new Animated.Value(0)).current;
  const [showAnimation, setShowAnimation] = useState<boolean>(false);
  const [scanResponse, setScanResponse] = useState<any>(null);
  const { isOnline } = useOfflineSync(false);

  useFocusEffect(
    useCallback(() => {
      setScanning(false);
    }, []),
  );

  useFocusEffect(
    useCallback(() => {
      if (onHeaderTabChange) {
        onHeaderTabChange('Auto');
      }
    }, [onHeaderTabChange]),
  );

  useEffect(() => {
    requestPermission();
  }, []);

  useEffect(() => {
    setNoteCount(Object.keys(notes).length);
  }, [notes]);

  useEffect(() => {
    const intervalId = setInterval(() => {
      setLinePosition((prevPosition) => {
        if (movingDown && prevPosition >= 225) {
          setMovingDown(false);
          return prevPosition - 2;
        } else if (!movingDown && prevPosition <= 0) {
          setMovingDown(true);
          return prevPosition + 2;
        }
        return movingDown ? prevPosition + 2 : prevPosition - 2;
      });
    }, 2);

    return () => clearInterval(intervalId);
  }, [movingDown]);

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

  function toggleCameraFacing() {
    setFacing((current) => (current === 'back' ? 'front' : 'back'));
  }

  const handleBarCodeScanned = async ({ data }: { data: string }) => {
    if (scanning) return;

    setScanning(true);
    setScannedData(data);
    setScanTime(getFormatDate());
    console.log("data-->",data)

    try {
      const note = notes[data] || '';
      const res = await requestScan(data, note);
      const scanData = res?.data;

      setScanResponse(scanData?.data);

      let scanResult: ScanResult = {
        text: 'Scan Successful',
        color: '#4BB543',
        icon: 'check',
      };

      if (scanData?.offline || scanData?.queued) {
        scanResult = {
          text: scanData?.queued
            ? 'Queued for Sync'
            : 'Scan Successful (Offline)',
          color: '#FFA500',
          icon: 'check',
        };
      } else if (scanData?.data?.scan_count > 1) {
        scanResult = {
          text: 'Scanned Already',
          color: '#D8A236',
          icon: 'close',
        };
      } else if (
        scanData?.data?.status === 'error' ||
        scanData?.data?.status === 'invalid'
      ) {
        scanResult = {
          text: 'Scan Unsuccessful',
          color: '#ED4337',
          icon: 'close',
        };
      } else {
        if (onScanCountUpdate) onScanCountUpdate();
      }

      setScanResult(scanResult);
      animateProgressBar();
      setShowAnimation(true);
    } catch (error: any) {
        console.log('error--->', error.response.data);

      let errorMessage = 'Scan Unsuccessful';
      let errorColor = '#ED4337';

      if (
        error.response?.data?.non_field_errors?.includes('Scan limit reached.')
      ) {
        errorMessage = 'Scan Limit Reached';
        errorColor = '#D8A236';
      }

      setScanResult({ text: errorMessage, color: errorColor, icon: 'close' });
      animateProgressBar();
      setShowAnimation(true);
    }

    setTimeout(() => {
      setScanning(false);
      setShowAnimation(false);
    }, 2000);
  };

  const animateProgressBar = () => {
    animatedWidth.setValue(0);
    Animated.timing(animatedWidth, {
      toValue: width,
      duration: 1000,
      useNativeDriver: false,
    }).start();
  };

  const handleAddNote = async (newNote: string) => {
    if (!scannedData) return;

    const parts = scannedData.split('/');
    const ticketCode = parts[parts.length - 2];
    const currentEventUuid = eventInfo?.eventUuid;

    try {
      if (newNote.trim().length > 0) {
        await requestUpdateNote(ticketCode, newNote, currentEventUuid);
        setNotes((prevNotes) => ({ ...prevNotes, [scannedData]: newNote }));
      }
    } catch (error: any) {
      logger.error('Failed to update ticket note:', error.message);
    }

    setNoteModalVisible(false);
  };

  const handleNoteButtonPress = () => {
    if (noteCount === 1) {
      navigation.navigate('TicketScanned', {
        scanResponse,
        eventInfo,
        note: notes[scannedData!] || 'No note added',
      });
    } else {
      setNoteToEdit(notes[scannedData!] || '');
      setNoteModalVisible(true);
    }
  };

  const handleEditNote = (editedNote: string) => {
    setNotes((prevNotes) => ({ ...prevNotes, [scannedData!]: editedNote }));
    setNoteModalVisible(false);
  };

  const handleDetailButtonPress = () => {
    navigation.navigate('TicketScanned', {
      scanResponse,
      eventInfo,
      note: notes[scannedData!] || 'No note added',
    });
  };

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
          userRole === 'ADMIN'
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
            <CameraView
              style={styles.camera}
              facing={facing}
              onBarcodeScanned={scanning ? undefined : handleBarCodeScanned}
            />
            <CameraOverlay
              linePosition={linePosition}
              scannedData={scanResult ? scanResult.color : '#AE6F28'}
            />
          </View>
        </View>

        {scanResult && (
          <View style={styles.containerstatus}>
            <View style={styles.scanResultsContainer}>
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
                {scanResult.text === 'Scanned Already' && (
                  <TouchableOpacity
                    style={styles.noteButton}
                    onPress={handleNoteButtonPress}
                  >
                    <Text style={styles.noteColor}>Note</Text>
                    {Object.keys(notes).length > 0 && (
                      <View style={styles.greyCircle}>
                        <View style={styles.redCircle}>
                          <Text style={styles.redCircleText}>
                            {Object.keys(notes).length}
                          </Text>
                        </View>
                      </View>
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
