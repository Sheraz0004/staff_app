import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  ScrollView,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Modal,
  ActivityIndicator,
} from "react-native";
import ProfileImageComponent from "../../components/ProfileImage";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { useDispatch, useSelector } from "react-redux";
import {
  getUser,
  userAuthToken,
  logout,
  setUser,
  loginSuccess,
} from "../../redux/reducers/userReducer";
import { resetDashboard } from "../../redux/reducers/dashboardReducer";
import { clearUserSession } from "../../utils/clearUserSession";
import SvgIcons from "../../components/SvgIcons";
import * as ImagePicker from "expo-image-picker";
import { AUTH_SERVICES } from "../../services/AuthService";
import { useApi } from "../../services/useApi";
import Loader from "../../components/Loader/Loader";
import { showSuccessToast, showErrorToast } from "../../components/Toast";
import { styles } from "./index.styles";

interface ProfileImage {
  uri: string;
  mimeType: string;
}

const ProfileScreen: React.FC = () => {
  const navigation = useNavigation();
  const dispatch = useDispatch();
  const insets = useSafeAreaInsets();
  const topPadding = Platform.OS === "android" ? 24 : insets.top;
  const currentUser = useSelector(getUser);
  const authToken = useSelector(userAuthToken);
  console.log("currentUser--->", currentUser);

  const [profileImage, setProfileImage] = useState<ProfileImage | null>(null);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [hasChanges, setHasChanges] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  useEffect(() => {
    if (currentUser) {
      setFirstName(currentUser.firstName ?? currentUser.first_name ?? "");
      setLastName(currentUser.lastName ?? currentUser.last_name ?? "");
    }
  }, [currentUser]);

  const { loading: saveLoading, requestCall: saveProfile } = useApi(
    AUTH_SERVICES.updateProfile,
    false,
    true,
  );

  const refreshProfileInRedux = async (): Promise<void> => {
    try {
      const profileResponse = await AUTH_SERVICES.fetchUserProfile();
      const apiBody = profileResponse?.data;
      const userData = apiBody?.data ?? apiBody;
      dispatch(setUser({ user: userData }));
      dispatch(loginSuccess({ token: authToken, user: userData }));
    } catch (err: any) {
      console.log("refreshProfile error:", err?.response?.data);
    }
  };

  const onFirstNameChange = (val: string) => {
    setFirstName(val);
    setHasChanges(true);
  };

  const onLastNameChange = (val: string) => {
    setLastName(val);
    setHasChanges(true);
  };

  const pickImage = async (): Promise<void> => {
    try {
      const { status } =
        await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== "granted") {
        showErrorToast("Please grant permission to access your photos");
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 1,
      });
      if (!result.canceled && result.assets?.length > 0) {
        const asset = result.assets[0];
        setProfileImage({
          uri: asset.uri,
          mimeType: asset.mimeType || "image/jpeg",
        });
        setHasChanges(true);
      }
    } catch (_) {
      showErrorToast("Failed to pick image. Please try again.");
    }
  };

  const handleSave = async (): Promise<void> => {
    setIsSaving(true);
    try {
      let profileImageUrl: string | undefined;

      if (profileImage) {
        const mimeType = profileImage.mimeType || "image/jpeg";
        const ext = mimeType.split("/")[1] || "jpg";
        const fileName = `profile-${Date.now()}.${ext}`;

        // Step 1: get pre-signed upload URL
        const uploadRequestRes = await AUTH_SERVICES.getUploadRequest(fileName);
        const { accessUrl, uploadUrl } = uploadRequestRes.data;

        // Step 2: PUT file binary to S3
        await AUTH_SERVICES.uploadImageToS3(
          uploadUrl,
          profileImage.uri,
          mimeType,
        );

        profileImageUrl = accessUrl;
      }

      // Step 3: PATCH profile with access URL + name fields
      const body: {
        profileImage?: string;
        firstName?: string;
        lastName?: string;
      } = {
        firstName,
        lastName,
      };
      if (profileImageUrl) {
        body.profileImage = profileImageUrl;
      }

      const res = await saveProfile(body);

      if (res) {
        showSuccessToast("Profile updated successfully.");
        setHasChanges(false);
        await refreshProfileInRedux();
        setProfileImage(null);
      }
    } catch (_) {
    } finally {
      setIsSaving(false);
    }
  };

  const [logoutConfirmVisible, setLogoutConfirmVisible] = useState(false);
  const [logoutLoading, setLogoutLoading] = useState(false);

  const handleLogoutConfirm = async (): Promise<void> => {
    setLogoutLoading(true);
    try {
      await AUTH_SERVICES.logout();
      dispatch(resetDashboard());
      dispatch(logout());
      await clearUserSession();
    } catch (_) {
      console.log("_---->",_?.response?.data)
      showErrorToast("Failed to log out. Please try again.");
      setLogoutLoading(false);
      setLogoutConfirmVisible(false);
    }
  };

  const savedAvatarUri = currentUser?.profileImage ?? currentUser?.profile_image ?? null;

  const displayName =
    firstName || lastName
      ? `${firstName} ${lastName}`.trim()
      : (currentUser?.displayName ??
        currentUser?.display_name ??
        currentUser?.phoneNumber ??
        currentUser?.phone_number ??
        "User");

  const phoneNumber =
    currentUser?.phoneNumber ?? currentUser?.phone_number ?? null;
  const email = currentUser?.email ?? null;

  return (
    <View style={styles.container}>
      <Loader isLoading={isSaving || saveLoading} />
      <View style={[styles.header, { paddingTop: topPadding }]}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <SvgIcons.backArrow />
        </TouchableOpacity>
        <Text style={styles.screenTitle}>Edit Profile</Text>
        <View style={styles.backButton} />
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContainer}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.profileSection}>
            <View style={styles.avatarWrapper}>
              <TouchableOpacity
                style={styles.avatarContainer}
                onPress={pickImage}
              >
                {profileImage?.uri ? (
                  <Image
                    source={{ uri: profileImage.uri }}
                    style={styles.avatar}
                    resizeMode="cover"
                  />
                ) : savedAvatarUri ? (
                  <ProfileImageComponent
                    uri={savedAvatarUri}
                    style={styles.avatar}
                    resizeMode="cover"
                  />
                ) : (
                  <SvgIcons.placeholderImage width={100} height={100} />
                )}
              </TouchableOpacity>
              <View style={styles.cameraIconContainer}>
                <TouchableOpacity onPress={pickImage} activeOpacity={0.7}>
                  <SvgIcons.profileCameraIcon width={32} height={32} />
                </TouchableOpacity>
              </View>
            </View>
            {/* <Text style={styles.userName}>{displayName}</Text> */}
          </View>

          <View style={styles.formSection}>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>First Name</Text>
              <TextInput
                style={styles.textInput}
                value={firstName}
                onChangeText={onFirstNameChange}
                placeholder="Enter first name"
                placeholderTextColor="#B0B0B0"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Last Name</Text>
              <TextInput
                style={styles.textInput}
                value={lastName}
                onChangeText={onLastNameChange}
                placeholder="Enter last name"
                placeholderTextColor="#B0B0B0"
              />
            </View>

            {phoneNumber ? (
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Phone Number</Text>
                <View style={[styles.textInput, styles.readOnlyInput]}>
                  <Text style={styles.readOnlyText}>{phoneNumber}</Text>
                </View>
              </View>
            ) : null}

            {email ? (
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Email</Text>
                <View style={[styles.textInput, styles.readOnlyInput]}>
                  <Text style={styles.readOnlyText}>{email}</Text>
                </View>
              </View>
            ) : null}
          </View>

          <View style={styles.menuSection}>
            <TouchableOpacity
              style={styles.logoutButton}
              onPress={() => setLogoutConfirmVisible(true)}
            >
              <SvgIcons.logoutMenuIcon width={24} height={24} />
              <Text style={styles.logoutText}>Log Out</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {hasChanges && (
        <TouchableOpacity
          style={[styles.saveButton, { marginBottom: insets.bottom + 16 }]}
          onPress={handleSave}
          activeOpacity={0.8}
        >
          <Text style={styles.saveButtonText}>Save Changes</Text>
        </TouchableOpacity>
      )}

      <Modal
        visible={logoutConfirmVisible}
        transparent
        animationType="slide"
        onRequestClose={() => !logoutLoading && setLogoutConfirmVisible(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => !logoutLoading && setLogoutConfirmVisible(false)}
        >
          <View style={[styles.logoutSheet, { paddingBottom: insets.bottom + 1 }]}>
            <View style={styles.sheetHandle} />
            <Text style={styles.sheetTitle}>Log Out</Text>
            <Text style={styles.sheetSubtitle}>Are you sure you want to log out?</Text>
            <View style={styles.sheetButtonRow}>
              <TouchableOpacity
                style={styles.sheetCancelButton}
                onPress={() => setLogoutConfirmVisible(false)}
                activeOpacity={0.7}
                disabled={logoutLoading}
              >
                <Text style={styles.sheetCancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.sheetLogoutButton}
                onPress={handleLogoutConfirm}
                activeOpacity={0.85}
                disabled={logoutLoading}
              >
                {logoutLoading ? (
                  <ActivityIndicator color="#FFF6DF" size="small" />
                ) : (
                  <Text style={styles.sheetLogoutButtonText}>Log Out</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
};

export default ProfileScreen;
