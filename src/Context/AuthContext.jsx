import React, { createContext } from 'react'

export const authData = createContext();
function AuthContext({children}) {
    const serverUrl = "https://linkedin-backend-henna.vercel.app";
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
