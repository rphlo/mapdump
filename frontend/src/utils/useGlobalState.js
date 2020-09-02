import React from 'react'
import { createContext, useReducer, useContext } from 'react';

/* Action Types */
const SET_USER = 'SET_USER';

/* Define a context and a reducer for updating the context */
const GlobalStateContext = createContext();

const initialState = {
  user: JSON.parse(window.localStorage.getItem('drawmyroute_user'))
};

const globalStateReducer = (state, action) => {
  switch (action.type) {
    case SET_USER:
      window.localStorage.setItem('drawmyroute_user', JSON.stringify({ ...action.payload }))
      return {
        ...state,
        user: { ...action.payload },
      };

    default:
      return state;
  }
};

/* Export a component to provide the context to its children. This is used in our _app.js file */

export const GlobalStateProvider = ({ children }) => {
  const [state, dispatch] = useReducer(
    globalStateReducer, 
    initialState
  );

  return (
    <GlobalStateContext.Provider value={[state, dispatch]}>
      {children}
    </GlobalStateContext.Provider>
  );
};

/* 
Default export is a hook that provides a simple API for updating the global state. 
This also allows us to keep all of this state logic in this one file
*/

const useGlobalState = () => {
  const [state, dispatch] = useContext(GlobalStateContext);

  const setUser = ({ username, api_token }) => {
    dispatch({ 
      type: SET_USER, 
      payload: { 
        username,
        api_token,
      } 
    });
  };

  return {
    setUser,
    user: { ...state.user },
  };
};

export default useGlobalState;