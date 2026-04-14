import { StyleSheet } from 'react-native';
import { color } from '../color/color';

export const styles = StyleSheet.create({
  centeredContent: {
    width: '100%',
  },
  inputRow: {
    paddingLeft: 10,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: color.borderBrown_CEBCA0,
    borderRadius: 15,
    overflow: 'hidden',
    backgroundColor: 'transparent',
    marginBottom: 5,
    height: 54,
    marginHorizontal: 20,
  },
  countryCodeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRightWidth: 1,
    borderRightColor: color.borderBrown_CEBCA0,
    backgroundColor: 'transparent',
  },
  flagText: {
    fontSize: 16,
    marginRight: 6,
  },
  countryCodeText: {
    marginRight: 4,
  },
  inputField: {
    flex: 1,
    color: color.grey_DEDCDC,
    fontSize: 14,
    fontWeight: '400',
    height: '100%',
    backgroundColor: 'transparent',
    paddingRight: 10,
  },
  inputFieldWithCountryCode: {
    paddingLeft: 15,
  },
  inputFieldWithoutCountryCode: {
    paddingLeft: 20,
  },
  eyeButton: {
    paddingHorizontal: 14,
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  submitButton: {
    backgroundColor: color.btnBrown_AE6F28,
    marginHorizontal: 20,
    marginTop: 16,
    height: 54,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
  },
  submitButtonDisabled: {
    opacity: 0.5,
  },
  inputError: {
    borderColor: color.red_FF0000,
  },
  errorText: {
    width: '100%',
    marginHorizontal: 20,
  },
  toggleButton: {
    alignItems: 'center',
    marginTop: 8,
    paddingVertical: 6,
  },
});
