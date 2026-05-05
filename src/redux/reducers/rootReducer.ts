import { combineReducers, UnknownAction } from "redux";
import entitiesReducer from "./enitites";
import manualCheckinReducer from "./manualCheckinSlice";
import sellCheckinReducer from "./sellCheckinSlice";
import ticketsTabReducer from "./ticketsTabSlice";
import boxOfficeReducer from "./boxOfficeSlice";

const appReducer = combineReducers({
  entities: entitiesReducer,
  manualCheckin: manualCheckinReducer,
  sellCheckin: sellCheckinReducer,
  ticketsTab: ticketsTabReducer,
  boxOffice: boxOfficeReducer,
});

export type RootState = ReturnType<typeof appReducer>;

// On logout, reset all slices to initialState except user preferences
// (userReducer handles logout and preserves rememberMe/credentials)
const rootReducer = (state: RootState | undefined, action: UnknownAction): RootState =>
  appReducer(
    action.type === "user/logout"
      ? ({ entities: { user: state?.entities?.user } } as RootState)
      : state,
    action,
  );

export default rootReducer;
