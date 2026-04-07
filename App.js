import React, { useCallback, useEffect, useState } from "react";
import { LogBox, View } from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import { Provider } from "react-redux";
import { PersistGate } from "redux-persist/integration/react";
import Navigation from "./src/navigation/navigation";
import * as SplashScreen from "expo-splash-screen";
import { useOfflineSync } from "./src/hooks/useOfflineSync";
import store, { persistor } from "./src/redux/store";
import { GlobalToastProvider } from "./src/components/Toast";
import { SafeAreaProvider } from "react-native-safe-area-context";

SplashScreen.preventAutoHideAsync().catch(() => {});

function App() {
  const [isAppReady, setIsAppReady] = useState(false);
  useOfflineSync();

  useEffect(() => {
    let timeoutId;

    const prepare = async () => {
      try {
        timeoutId = setTimeout(() => {
          setIsAppReady(true);
        }, 5000);
      } catch (error) {
        console.warn("Error during splash delay", error);
        setIsAppReady(true);
      }
    };

    prepare();

    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, []);

  const handleLayout = useCallback(async () => {
    if (isAppReady) {
      await SplashScreen.hideAsync();
    }
  }, [isAppReady]);

  if (!isAppReady) {
    return null;
  }

  return (
    <Provider store={store}>
      <PersistGate persistor={persistor}>
        <SafeAreaProvider>
        <GlobalToastProvider>
          <View style={{ flex: 1 }} onLayout={handleLayout}>
            <NavigationContainer>
              <Navigation />
            </NavigationContainer>
          </View>
        </GlobalToastProvider>
        </SafeAreaProvider>
      </PersistGate>
    </Provider>
  );
}

export default App;
LogBox.ignoreAllLogs();
