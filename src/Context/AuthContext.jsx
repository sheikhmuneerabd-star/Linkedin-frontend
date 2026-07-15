import React, { createContext } from 'react'

export const authData = createContext();
function AuthContext({children}) {
    const serverUrl = "http://localhost:8000";
    const data = {
        serverUrl
    }
  return (
    <authData.Provider value={data}>
        {children}
    </authData.Provider>
  )
}

export default AuthContext
