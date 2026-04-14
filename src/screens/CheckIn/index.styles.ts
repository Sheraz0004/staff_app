import { StyleSheet, Dimensions } from 'react-native';
import { color } from '../../color/color';

const { width, height } = Dimensions.get('window');

export const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
  },
  darkBackground: {
    flex: 1,
    backgroundColor: color.btnBrown_AE6F28,
  },
  darkBackgroundAdmin: {
    flex: 1,
    backgroundColor: '#000000',
  },
  cameraContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cameraWrapper: {
    justifyContent: 'center',
    alignItems: 'center',
    width: width * 0.8,
    height: height * 0.4,
    borderRadius: 10,
    overflow: 'hidden',
    backgroundColor: 'black',
    marginHorizontal: width * 0.1,
    marginVertical: height * 0.1,
  },
  camera: {
    width: '100%',
    height: '100%',
  },
  containerstatus: {
    backgroundColor: 'white',
    paddingRight: 16,
    position: 'absolute',
    bottom: 0,
    width: '100%',
    shadowColor: 'black',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 10,
  },
  scanResultContainer: {
    position: 'absolute',
    top: 0,
    width: '100%',
    zIndex: 10,
    alignItems: 'center',
    height: 30,
  },
  scanResultsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    justifyContent: 'space-between',
  },
  scanResults: {
    flexDirection: 'column',
    left: 10,
    gap: 5,
  },
  scaniconresult: {
    width: 50,
    height: 50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonsContainer: {
    flexDirection: 'row',
    gap: 10,
    justifyContent: 'flex-end',
    flex: 1,
  },
  detailButton: {
    backgroundColor: '#AE6F28',
    borderRadius: 4,
    width: 66,
    height: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  noteButton: {
    backgroundColor: '#2F251D',
    borderRadius: 4,
    width: 66,
    height: 30,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  redCircle: {
    position: 'absolute',
    top: 5,
    right: 5,
    width: 15,
    height: 15,
    borderRadius: 10,
    backgroundColor: '#FF2F61',
    justifyContent: 'center',
    alignItems: 'center',
  },
  greyCircle: {
    position: 'absolute',
    top: -10,
    right: -10,
    width: 25,
    height: 25,
    borderRadius: 20,
    backgroundColor: '#F6F6FA',
    justifyContent: 'center',
    alignItems: 'center',
  },
  redCircleText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
  },
  detailColor: {
    color: '#FFF6DF',
  },
  noteColor: {
    color: '#FFF6DF',
  },
  timeColor: {
    color: '#766F6A',
    fontSize: 12,
  },
  animatedBar: {
    position: 'absolute',
    left: 0,
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  animatedText: {
    color: color.white_FFFFFF,
    fontWeight: '500',
    textAlign: 'center',
    padding: 5,
    fontSize: 14,
  },
  offlineBanner: {
    backgroundColor: '#FFA500',
    padding: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  offlineText: {
    color: '#000',
    fontSize: 12,
    fontWeight: '500',
  },
  container: {
    flex: 1,
  },
});
