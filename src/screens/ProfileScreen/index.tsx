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
} from "react-native";
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

  const [profileImage, setProfileImage] = useState<ProfileImage | null>(null);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [hasChanges, setHasChanges] = useState(false);
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
      const userData = profileResponse?.data;
      console.log("userData--->",userData);
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
    try {
      const formData = new FormData();

      if (profileImage) {
        const fileType = profileImage.mimeType || "image/jpeg";
        const ext = fileType.split("/")[1] || "jpg";
        formData.append("profile_image", {
          uri: profileImage.uri,
          name: `profile.${ext}`,
          type: fileType,
        } as any);
      }

      const reduxFirstName =
        currentUser?.firstName ?? currentUser?.firstName ?? "";
      const reduxLastName =
        currentUser?.lastName ?? currentUser?.lastName ?? "";

      // if (firstName !== reduxFirstName) {
        formData.append("firstName", firstName);
      // }
      // if (lastName !== reduxLastName) {
        formData.append("lastName", lastName);
      // }

      console.log("formData--->",formData)
      const res = await saveProfile(formData);

      if (res) {
        showSuccessToast("Profile updated successfully.");
        setProfileImage(null);
        setHasChanges(false);
        await refreshProfileInRedux();
      }
    } catch (_) {}
  };

  const handleLogout = async (): Promise<void> => {
    dispatch(logout());
    await clearUserSession();
  };

  const avatarUri =
    profileImage?.uri ??
    currentUser?.profileImage ??
    currentUser?.profile_image ??
    null;

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
      <Loader isLoading={saveLoading} />
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
                {avatarUri ? (
                  <Image
                    source={{ uri: avatarUri }}
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
              onPress={handleLogout}
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
    </View>
  );
};

export default ProfileScreen;
