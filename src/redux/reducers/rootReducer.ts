import { combineReducers } from "redux";
import entitiesReducer from "./enitites";
import manualCheckinReducer from "./manualCheckinSlice";

const rootReducer = combineReducers({
  entities: entitiesReducer,
  manualCheckin: manualCheckinReducer,
});

export type RootState = ReturnType<typeof rootReducer>;
export default rootReducer;
