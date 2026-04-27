import { StyleSheet } from 'react-native';
import { color } from '../../color/color';

export const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  wrapper: {
    paddingHorizontal: 10,
  },
  scrollContent:{
    flexGrow: 1,
    paddingBottom: 60,
  },

  popUp: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    backgroundColor: 'white',
    borderRadius: 15,
    width: '100%',
    marginTop: 16,
  },

  labeltickets: {
    fontWeight: '600',
    fontSize: 20,
    color: color.placeholderTxt_24282C,
  },

  userName: {
    color: color.placeholderTxt_24282C,
    fontSize: 16,
    marginTop: 10,
    fontWeight: '500',
  },

  userEmail: {
    color: color.placeholderTxt_24282C,
    fontSize: 14,
    marginTop: 10,
  },

  userPurchaseDate: {
    color: color.black_544B45,
    fontSize: 14,
    marginTop: 10,
  },

  successImageIcon: {
    marginTop: 20,
  },

  ticketContainer: {
    borderWidth: 1,
    borderColor: color.white_FFFFFF,
    borderRadius: 10,
    backgroundColor: color.white_FFFFFF,
    padding: 16,
    marginTop: 15,
  },

  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },

  leftColumnContent: {
    width: '58%',
  },

  rightColumnContent: {
    width: '50%',
    paddingLeft: 50,
  },

  values: {
    fontSize: 14,
    fontWeight: '500',
    color: color.black_2F251D,
  },

  value: {
    color: color.placeholderTxt_24282C,
  },

  valueScanCount: {
    fontSize: 14,
    color: color.black_544B45,
  },

  ticketNumber: {
    fontSize: 14,
    color: color.black_544B45,
    marginBottom: 10,
  },

  marginTop10: {
    marginTop: 10,
  },

  marginTop9: {
    marginTop: 9,
  },

  marginTop8: {
    marginTop: 8,
  },

  noteContainer: {
    borderWidth: 1,
    borderColor: color.brown_F7E4B6,
    borderRadius: 10,
    backgroundColor: color.brown_F7E4B6,
    paddingHorizontal: 16,
    paddingVertical: 5,
    marginTop: 10,
  },

  LabelNote: {
    fontSize: 14,
    fontWeight: '500',
    color: color.black_2F251D,
  },

  noteDescription: {
    fontSize: 14,
    color: color.brown_766F6A,
    opacity: 0.7,
    marginTop: 5,
  },
});
