'use client';
import React, { createContext, ReactNode, useContext, useReducer } from 'react';

interface State {}

interface Action {
  type: string;
  payload: any;
}

const initialState: State = {
  sessionEmail: null,
  unverifiedEmail: null,
};

const reducer = (state: State, action: Action): State => {
  switch (action.type) {
    case 'SET_SESSION_EMAIL':
      return { ...state, sessionEmail: action.payload };
    case 'SET_UNVERIFIED_EMAIL':
      return { ...state, unverifiedEmail: action.payload };
    default:
      return state;
  }
};

const GlobalContext = createContext<
  | {
      state: State;
      dispatch: React.Dispatch<Action>;
    }
  | undefined
>(undefined);

export const GlobalProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [state, dispatch] = useReducer(reducer, initialState);

  return (
    <GlobalContext.Provider value={{ state, dispatch }}>
      {children}
    </GlobalContext.Provider>
  );
};

export const useGlobalContext = () => {
  const context = useContext(GlobalContext);
  if (!context) {
    throw new Error('useGlobalContext must be used within a GlobalProvider');
  }
  return context;
};
