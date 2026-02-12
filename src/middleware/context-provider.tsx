import {
  createContext,
  type FC,
  PropsWithChildren,
  useContext,
  useReducer,
} from "react";
import { initialState, type State } from "./state";
import { executeCore } from "./core-handler";
import type { Action } from "./actions";
import { reducer } from "./state-handler";
import { Authenticator } from "./authenticator";

const appContext = createContext<[State, React.Dispatch<Action>]>([
  initialState,
  () => {},
]);

export const ContextProvider: FC<PropsWithChildren> = ({ children }) => {
  const [state, setState] = useReducer(reducer, initialState);

  const dispatch = (value: Action) => {
    setState(value);
    executeCore(value);
  };

  return (
    <appContext.Provider value={[state, dispatch]}>
        <Authenticator/>
      {children}
    </appContext.Provider>
  );
};

export const useAppContext = () => {
  return useContext(appContext);
};
