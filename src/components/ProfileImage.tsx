import React, { useState } from "react";
import {
  ActivityIndicator,
  ImageStyle,
  StyleProp,
  StyleSheet,
  View,
} from "react-native";
import { useSelector } from "react-redux";
import { userAuthToken } from "../redux/reducers/userReducer";
import { Image, ImageContentFit } from "expo-image";

interface Props {
  uri: string | null | undefined;
  style?: StyleProp<ImageStyle>;
  resizeMode?: "cover" | "contain" | "stretch" | "center";
}

const ProfileImage: React.FC<Props> = ({
  uri,
  style,
  resizeMode = "cover",
}) => {
  const token = useSelector(userAuthToken);
  const [loading, setLoading] = useState(true);

  if (!uri) return null;
  const isApiUrl = uri.startsWith("http") && !uri.includes("s3.amazonaws.com");
  const secureUri = isApiUrl ? uri.replace(/^http:\/\//, "https://") : uri;

  return (
    <View style={[style as any, { overflow: "hidden" }]}>
      <Image
        source={{
          uri: secureUri,
          ...(isApiUrl && token
            ? { headers: { Authorization: `Bearer ${token}` } }
            : {}),
        }}
        style={StyleSheet.absoluteFill}
        contentFit={resizeMode as ImageContentFit}
        onLoadStart={() => setLoading(true)}
        onLoadEnd={() => setLoading(false)}
      />
      {loading && (
        <ActivityIndicator
          style={StyleSheet.absoluteFill}
          size="small"
          color="#AE6F28"
        />
      )}
    </View>
  );
};

export default ProfileImage;
