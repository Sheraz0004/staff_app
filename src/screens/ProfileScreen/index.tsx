import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  ScrollView,
  SafeAreaView,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useDispatch } from 'react-redux';
import { logout } from '../../redux/reducers/userReducer';
import { color } from '../../color/color';
import SvgIcons from '../../components/SvgIcons';
import * as ImagePicker from 'expo-image-picker';
import { AUTH_SERVICES } from '../../services/AuthService';
import { useApi } from '../../services/useApi';
import Loader from '../../components/Loader/Loader';
import { showSuccessToast, showErrorToast } from '../../components/Toast';
import { styles } from './index.styles';

interface ProfileImage {
  uri: string;
  mimeType: string;
}

const ProfileScreen: React.FC = () => {
  const navigation = useNavigation();
  const dispatch = useDispatch();
  const route = useRoute();
  const userRole = (route?.params as any)?.userRole;

  const [profileImage, setProfileImage] = useState<ProfileImage | null>(null);
  const [userData, setUserData] = useState<any | null>(null);
  const [hasChanges, setHasChanges] = useState<boolean>(false);

  const { loading: fetchLoading, requestCall: getProfile } = useApi(AUTH_SERVICES.fetchUserProfile, false, true);
  const { loading: saveLoading, requestCall: saveProfile } = useApi(AUTH_SERVICES.updateProfile, false, true);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async (): Promise<void> => {
    try {
      const res = await getProfile();
      if (res?.data) setUserData(res.data);
    } catch (_) {
      // error toast already shown by useApi
    }
  };

  const pickImage = async (): Promise<void> => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        showErrorToast('Please grant permission to access your photos');
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 1,
      });
      if (!result.canceled && result.assets?.length > 0) {
        const asset = result.assets[0];
        setProfileImage({ uri: asset.uri, mimeType: asset.mimeType || 'image/jpeg' });
        setHasChanges(true);
      }
    } catch (_) {
      showErrorToast('Failed to pick image. Please try again.');
    }
  };

  const handleSave = async (): Promise<void> => {
    if (!profileImage) {
      showErrorToast('Please select an image to update your profile.');
      return;
    }

    try {
      const fileType = profileImage.mimeType || 'image/jpeg';
      const ext = fileType.split('/')[1] || 'jpg';
      const formData = new FormData();
      formData.append('profile_image', {
        uri: profileImage.uri,
        name: `profile.${ext}`,
        type: fileType,
      } as any);

      const res = await saveProfile(formData);
      if (res) {
        showSuccessToast('Profile image updated successfully.');
        await fetchProfile();
        setProfileImage(null);
        setHasChanges(false);
      }
    } catch (_) {
      // error toast already shown by useApi
    }
  };

  const handleLogout = (): void => {
    dispatch(logout());
  };

  return (
    <SafeAreaView style={styles.container}>
      <Loader isLoading={fetchLoading || saveLoading} />
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        {(userRole === 'ADMIN' || userRole === 'ORGANIZER')&& (
          <View style={styles.backRow}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
              <SvgIcons.backArrow />
            </TouchableOpacity>
          </View>
        )}
        <View style={styles.profileSection}>
          <View style={styles.avatarWrapper}>
            <TouchableOpacity style={styles.avatarContainer} onPress={pickImage}>
              {profileImage ? (
                <Image source={profileImage} style={styles.avatar} resizeMode="cover" />
              ) : userData?.profileImage ? (
                <Image source={{ uri: userData.profileImage }} style={styles.avatar} resizeMode="cover" />
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
          <Text style={styles.userName}>
            {userData
              ? userData.firstName || userData.lastName
                ? `${userData.firstName ?? ''} ${userData.lastName ?? ''}`.trim()
                : userData.displayName || userData.phoneNumber || 'User'
              : ''}
          </Text>
        </View>

        <View style={styles.menuSection}>
          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <SvgIcons.logoutMenuIcon width={24} height={24} />
            <Text style={styles.logoutText}>Log Out</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
      {hasChanges && (
        <TouchableOpacity
          style={styles.saveButton}
          onPress={handleSave}
          disabled={!profileImage}
          activeOpacity={0.8}
        >
          <Text style={styles.saveButtonText}>Save</Text>
        </TouchableOpacity>
      )}
    </SafeAreaView>
  );
};

export default ProfileScreen;
