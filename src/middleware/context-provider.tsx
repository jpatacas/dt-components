import {
  createContext,
  type FC,
  type PropsWithChildren,
  useContext,
  useReducer,
} from "react";
import { initialState, type State } from "./state";
import { executeCore } from "./core-handler";
import { ActionList, type Action } from "./actions";
import { reducer } from "./state-handler";
import { Authenticator } from "./authenticator";
import { Events } from "./event-handler";

const appContext = createContext<[State, React.Dispatch<Action>]>([
  initialState,
  () => {},
]);

export const ContextProvider: FC<PropsWithChildren> = ({ children }) => {
  const [state, setState] = useReducer(reducer, initialState);

  const events = new Events();
    for (const type of ActionList) {
      events.on(type, (payload : any) => {
        setState({type, payload})
  })
}

  const dispatch = (value: Action) => {
    setState(value);
    executeCore(value, events);
  };

  return (
    <appContext.Provider value={[state, dispatch]}>
      <Authenticator />
      {children}
    </appContext.Provider>
  );
};

export const useAppContext = () => {
  return useContext(appContext);
};
