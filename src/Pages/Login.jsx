import { useContext, useState } from 'react';
import logo from '../assets/logo.svg';
import hero from '../assets/hero.png';
import { useNavigate } from 'react-router-dom';
import axios from 'axios'
import { authData } from '../Context/AuthContext';
import { userDataContext } from '../Context/UserContext';
import { FiEye, FiEyeOff, FiMail, FiLock } from "react-icons/fi";

function Login() {
  const [show, setShow] = useState(false);
  let navigate = useNavigate();

  const { serverUrl } = useContext(authData);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const { userData, setUserData } = useContext(userDataContext);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      let res = await axios.post(serverUrl + "/api/auth/login", {
        email,
        password,
      }, { withCredentials: true });
      setUserData(res.data);
      navigate("/");
      setError("");
      setLoading(false);
      setEmail("");
      setPassword("");
    } catch (error) {
      setError(error.response?.data?.message || "Something went wrong. Please try again.");
      setLoading(false);
      console.log("handleLogin Error: ", error);
    }
  }

  return (
    <div className='w-full min-h-screen bg-white flex'>
      {/* Left branding panel - hidden on mobile */}
      <div className='hidden lg:flex lg:w-1/2 bg-gradient-to-br from-[#0a66c2] to-[#004182] flex-col justify-between p-12 relative overflow-hidden'>
        <div className='absolute -right-24 -top-24 w-96 h-96 bg-white/5 rounded-full'></div>
        <div className='absolute -left-16 bottom-0 w-72 h-72 bg-white/5 rounded-full'></div>

        <img className='w-[150px] brightness-0 invert relative z-10' src={logo} alt="logo" />

        <div className='relative z-10 flex flex-col items-center text-center'>
          <img className='max-w-[420px] w-full drop-shadow-2xl' src={hero} alt="Welcome illustration" />
          <h1 className='text-white text-3xl font-bold mt-8 leading-snug'>
            Welcome back to your professional community
          </h1>
          <p className='text-blue-100 mt-3 text-lg max-w-md'>
            Stay connected, grow your network, and never miss an opportunity.
          </p>
        </div>

        <p className='text-blue-100 text-sm relative z-10'>© {new Date().getFullYear()} LinkedClone. All rights reserved.</p>
      </div>

      {/* Right form panel */}
      <div className='w-full lg:w-1/2 flex flex-col items-center justify-center px-6 sm:px-12 py-10'>
        <div className='lg:hidden w-full mb-8'>
          <img className='w-[130px]' src={logo} alt="logo" />
        </div>

        <div className='w-full max-w-[400px]'>
          <h2 className='text-3xl font-bold text-gray-900'>Sign in</h2>
          <p className='text-gray-500 mt-1 mb-8'>Stay updated on your professional world.</p>

          <form className='flex flex-col gap-4' onSubmit={handleLogin}>
            <div className='relative'>
              <FiMail className='absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-lg' />
              <input
                className='border border-gray-300 text-[15px] rounded-lg w-full h-[48px] pl-10 pr-3 outline-none transition-all focus:border-[#0a66c2] focus:ring-2 focus:ring-[#0a66c2]/20'
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder='Email address'
                autoComplete='email'
                required
              />
            </div>

            <div className='relative'>
              <FiLock className='absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-lg' />
              <input
                className='border border-gray-300 text-[15px] rounded-lg w-full h-[48px] pl-10 pr-11 outline-none transition-all focus:border-[#0a66c2] focus:ring-2 focus:ring-[#0a66c2]/20'
                type={show ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder='Password'
                autoComplete='current-password'
                required
              />
              <span
                className='absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-800 cursor-pointer transition-colors'
                onClick={() => setShow(prev => !prev)}
                role="button"
                aria-label={show ? "Hide password" : "Show password"}
              >
                {show ? <FiEyeOff size={19} /> : <FiEye size={19} />}
              </span>
            </div>

            {error &&
              <div className='bg-red-50 border border-red-200 text-red-600 text-sm font-medium rounded-lg px-3 py-2'>
                {error}
              </div>
            }

            <button
              className='bg-[#0a66c2] w-full h-[48px] mt-2 rounded-full text-white font-semibold text-[16px] transition-all hover:bg-[#004182] active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2'
              disabled={loading}
            >
              {loading && <span className='w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin'></span>}
              {loading ? "Signing in..." : "Sign in"}
            </button>
          </form>

          <div className='flex items-center gap-3 my-6'>
            <div className='flex-1 h-[1px] bg-gray-200'></div>
            <span className='text-gray-400 text-sm'>or</span>
            <div className='flex-1 h-[1px] bg-gray-200'></div>
          </div>

          <p className='text-center text-gray-700'>
            New to LinkedClone?{" "}
            <span className='text-[#0a66c2] font-semibold cursor-pointer hover:underline' onClick={() => navigate("/signUp")}>
              Join now
            </span>
          </p>
        </div>
      </div>
    </div>
  )
}

export default Login