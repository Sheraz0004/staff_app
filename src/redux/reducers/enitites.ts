import { combineReducers } from 'redux';
import userReducer from './userReducer';
import dashboardReducer from './dashboardReducer';
import eventsReducer from './eventsReducer';

export default combineReducers({
  user: userReducer,
  dashboard: dashboardReducer,
  events: eventsReducer,
});
