import { combineReducers } from "redux";
import entitiesReducer from "./enitites";
import manualCheckinReducer from "./manualCheckinSlice";
import sellCheckinReducer from "./sellCheckinSlice";
import ticketsTabReducer from "./ticketsTabSlice";
import boxOfficeReducer from "./boxOfficeSlice";

const rootReducer = combineReducers({
  entities: entitiesReducer,
  manualCheckin: manualCheckinReducer,
  sellCheckin: sellCheckinReducer,
  ticketsTab: ticketsTabReducer,
  boxOffice: boxOfficeReducer,
});

export type RootState = ReturnType<typeof rootReducer>;
export default rootReducer;
