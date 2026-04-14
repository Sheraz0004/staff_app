import { StyleSheet } from 'react-native';
import { color } from '../color/color';

export const styles = StyleSheet.create({
  container: {
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  appName: {
    marginBottom: 8,
  },
  maskedContactText: {
    marginBottom: 20,
    textAlign: 'center',
  },
  otpContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '92%',
    marginBottom: 20,
    gap: 8,
  },
  otpInput: {
    width: 43,
    height: 43,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: color.borderBrown_CEBCA0,
    textAlign: 'center',
    fontSize: 16,
    color: color.white_FFFFFF,
  },
  rowContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    width: '100%',
    marginBottom: 10,
    alignItems: 'center',
  },
  timerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  resendOtpButton: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 20,
  },
});
