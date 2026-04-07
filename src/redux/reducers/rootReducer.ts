import { combineReducers } from "redux";
import entitiesReducer from "./enitites";

const rootReducer = combineReducers({
  entities: entitiesReducer,
});

export type RootState = ReturnType<typeof rootReducer>;
export default rootReducer;
