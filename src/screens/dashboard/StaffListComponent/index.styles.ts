import { StyleSheet } from 'react-native';
import { color } from '../../../color/color';

export const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
    //backgroundColor: color.btnBrown_AE6F28,
  },
  contentContainer: {
    flex: 1,
    //backgroundColor: color.white_FFFFFF,
  },
  searchContainer: {
    backgroundColor: color.white_FFFFFF,
    borderRadius: 10,
    paddingHorizontal: 15,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    borderColor: color.borderBrown_CEBCA0,
    borderWidth: 1,
    height: 45,
    marginHorizontal: 16,
  },
  searchContainerFocused: {
    borderColor: color.placeholderTxt_24282C,
  },
  searchInputPlaceholder: {
    color: color.brown_766F6A,
    fontWeight: '200',
    fontSize: 13,
  },
  searchInputWithText: {
    color: color.black_544B45,
    fontWeight: '400',
    fontSize: 13,
  },
  searchBar: {
    flex: 1,
    paddingVertical: 10,
  },
  ticketCard: {
    backgroundColor: color.white_FFFFFF,
    borderRadius: 10,
    padding: 20,
    marginBottom: 15,
    marginHorizontal: 16,
  },
  ticketRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    width: '100%',
  },
  column: {
    flex: 1,
    alignItems: 'flex-start',
    paddingHorizontal: 5,
  },
  columnHeader: {
    fontSize: 14,
    color: color.placeholderTxt_24282C,
    fontWeight: '500',
    marginBottom: 8,
  },
  columnData: {
    fontSize: 14,
    color: color.placeholderTxt_24282C,
    fontWeight: '400',
  },
  flatListContent: {
    paddingBottom: 20,
    marginTop: 2,
  },
  emptyText: {
    textAlign: 'center',
    color: '#999999',
    marginTop: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    color: 'red',
    textAlign: 'center',
    fontSize: 16,
  }
});
