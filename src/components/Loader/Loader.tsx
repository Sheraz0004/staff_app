import React from 'react';
import { DotIndicator } from 'react-native-indicators';
import Spinner from 'react-native-loading-spinner-overlay';
import { Colors } from '../../../constants/Colors';

interface LoaderProps {
  isLoading: boolean;
  type?: 'activity' | 'wave' | undefined;
  indicatorColor?: string;
}

const Loader: React.FC<LoaderProps> = React.memo(
  ({ isLoading, type = 'wave', indicatorColor = '#AE6F28' }) => {
    return (
      <Spinner
        animation="none"
        size="large"
        color={'transparent'}
        visible={isLoading}
        overlayColor="rgba(77, 77, 77,0.40)"
        customIndicator={
          isLoading ? (
            <DotIndicator
              count={3}
              size={17}
              color={indicatorColor}
              animating={isLoading}
              hidesWhenStopped
            />
          ) : null
        }
      />
    );
  },
);

export default Loader;
