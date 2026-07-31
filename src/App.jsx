import React, { useContext } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import Home from './Pages/Home'
import SignUp from './Pages/SignUp'
import Login from './Pages/Login'
import { userDataContext } from './Context/UserContext'
import Network from './Pages/Network'
import ViewProfile from './Pages/ViewProfile'
import Notification from './Pages/Notification'
import Messaging from './Pages/messaging'

function App() {
  const { userData } = useContext(userDataContext);
  return (
    <Routes>
      <Route path='/' element={userData ? <Home /> : <Navigate to="/login" />} />
      <Route path='/signUp' element={userData ? <Navigate to="/" /> : <SignUp />} />  
      <Route path='/login' element={userData ? <Navigate to="/" /> : <Login />} />
      <Route path='/network' element={userData ? <Network /> : <Navigate to="/login" />} />
      <Route path='/viewProfile' element={userData ? <ViewProfile /> : <Navigate to="/login" />} />
      <Route path='/notification' element={userData ? <Notification /> : <Navigate to="/login" />} />
      <Route path='/messaging' element={userData ? <Messaging /> : <Navigate to="/login" />} />
    </Routes>
  )
}

export default App