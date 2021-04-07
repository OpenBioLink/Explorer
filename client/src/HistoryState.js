import React, { useState, useEffect } from 'react';
import { useHistory } from "react-router-dom";

export function useHistoryState(key, initialValue) {
  const history = useHistory();
  const [rawState, rawSetState] = useState(() => {
    const value = (history.location.state)?.[key];
    return value ?? initialValue;
  });
  function setState(value) {
    history.replace({
      ...history.location,
      state: {
        ...history.location.state,
        [key]: value
      }
    });
    rawSetState(value);
  }
  return [rawState, setState];
}