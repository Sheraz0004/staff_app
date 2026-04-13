import { StyleSheet } from 'react-native';
import { color } from '../../../color/color';

export const styles = StyleSheet.create({
  card: {
    backgroundColor: color.white_FFFFFF,
    borderRadius: 16,
    marginVertical: 8,
    marginHorizontal: 16,
  },
  headerContainer: {
    padding: 15,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 15,
  },
  headerText: {
    fontSize: 14,
    fontWeight: '400',
    color: color.black_544B45,
  },
  headerValue: {
    fontSize: 14,
    fontWeight: '500',
    color: color.brown_3C200A,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    padding: 15,
  },
  subRow: {
    marginLeft: 0,
    backgroundColor: "transparent",
  },
  subRowBg: {
    backgroundColor: '#F7E4B660',
    borderRadius: 0,
    marginLeft: 0,
    marginRight: 0,
    marginVertical: 0,
    paddingVertical: 0,
    paddingHorizontal: 0,
  },
  textContainer: {
    marginLeft: 16,
    flex: 1,
    marginBottom: 2,
  },
  label: {
    fontSize: 15,
    color: color.black_544B45,
    fontWeight: "400",
  },
  value: {
    fontSize: 14,
    fontWeight: "500",
    color: color.placeholderTxt_24282C,
  },
  chevronContainer: {
    padding: 8,
    marginRight: 5,
    justifyContent: 'center',
    alignItems: 'center',
  },
  subitembg: {
    backgroundColor: '#F7E4B660',
  }
});
