import React, { createContext } from 'react'

export const authData = createContext();
function AuthContext({children}) {
    const serverUrl = "linkedin-backend-production-2e3f.up.railway.app";
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
