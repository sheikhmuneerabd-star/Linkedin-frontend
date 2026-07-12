import logo2 from '../assets/logo2.png';
import { GoSearch } from "react-icons/go";
import { TiHome } from "react-icons/ti";
import { HiUsers } from "react-icons/hi2";
import { IoMdNotifications } from "react-icons/io";
import empty_profile from '../assets/empty_profile.png'
import { useContext, useEffect, useRef, useState } from 'react';
import { authData } from '../Context/AuthContext';
import axios from 'axios'
import { RxCross2 } from "react-icons/rx";
import { useNavigate, useLocation } from 'react-router-dom';
import { userDataContext } from '../Context/UserContext';

function Nav() {
    const { userData, setUserData, handleGetProfile, notificationCount, setNotificationCount } = useContext(userDataContext);
    const { serverUrl } = useContext(authData);
    let navigate = useNavigate();
    let location = useLocation();
    const [showPopup, setShowPopup] = useState(false);
    const [searchInput, setSearchInput] = useState("");
    const [searchData, setSearchData] = useState([]);
    const [searchLoading, setSearchLoading] = useState(false);
    const [searchFocused, setSearchFocused] = useState(false);
    const popupRef = useRef();
    const searchRef = useRef();
    const searchInputRef = useRef();

    const handleSignOut = async () => {
        try {
            let res = await axios.get(serverUrl + "/api/auth/logout", { withCredentials: true });
            setUserData(null);
            navigate("/login");
        } catch (error) {
            console.log("Sign Out: ", error);
        }
    }

    const handleSearch = async () => {
        try {
            setSearchLoading(true);
            let res = await axios.get(serverUrl + `/api/user/search?query=${searchInput}`, { withCredentials: true });
            setSearchData(res.data);
        } catch (error) {
            setSearchData([]);
            console.log("handleSearch: ", error);
        } finally {
            setSearchLoading(false);
        }
    }

    useEffect(() => {
        if (!searchInput.trim()) {
            setSearchData([]);
            setSearchLoading(false);
            return;
        }
        setSearchLoading(true);
        const debounce = setTimeout(() => handleSearch(), 300);
        return () => clearTimeout(debounce);
    }, [searchInput]);

    const clearSearch = () => {
        setSearchInput("");
        setSearchData([]);
        searchInputRef.current?.focus();
    }

    // Close popup / search dropdown when clicking outside, close search on Escape
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (popupRef.current && !popupRef.current.contains(e.target)) {
                setShowPopup(false);
            }
            if (searchRef.current && !searchRef.current.contains(e.target)) {
                setSearchFocused(false);
            }
        };
        const handleEscape = (e) => {
            if (e.key === "Escape") {
                setSearchFocused(false);
                searchInputRef.current?.blur();
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        document.addEventListener("keydown", handleEscape);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
            document.removeEventListener("keydown", handleEscape);
        };
    }, []);

    const showDropdown = searchFocused && searchInput.trim().length > 0;

    const navItem = (path) => location.pathname === path;

    return (
        <div className='bg-white w-full h-[60px] flex items-center justify-between px-4 lg:px-8 shadow-sm sticky top-0 z-30 border-b border-gray-200'>
            <div className='flex items-center gap-2 flex-1'>
                <div className='w-[42px] shrink-0 cursor-pointer hover:opacity-80 transition-opacity' onClick={() => navigate("/")}>
                    <img src={logo2} alt="logo" />
                </div>
                <form className='relative w-full max-w-[350px]' ref={searchRef} onSubmit={(e) => e.preventDefault()}>
                    <GoSearch className='absolute top-1/2 -translate-y-1/2 left-3 text-lg text-gray-500' />
                    <input
                        ref={searchInputRef}
                        type="text"
                        placeholder='Search people, posts...'
                        className='pl-10 pr-9 outline-none bg-[#eef3f8] focus:bg-white focus:ring-2 focus:ring-[#0a66c2]/30 border border-transparent focus:border-[#0a66c2]/30 rounded-full w-full h-[38px] transition-all text-[14px]'
                        value={searchInput}
                        onChange={(e) => setSearchInput(e.target.value)}
                        onFocus={() => setSearchFocused(true)}
                    />
                    {searchInput &&
                        <RxCross2
                            className='absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700 cursor-pointer transition-colors'
                            onClick={clearSearch}
                        />
                    }

                    {showDropdown &&
                        <div className='absolute left-0 top-[46px] shadow-lg border border-gray-100 bg-white w-full min-w-[320px] max-h-[320px] overflow-auto z-40 rounded-lg animate-[fadeIn_0.15s_ease-out]'>
                            {searchLoading ? (
                                <div className='space-y-1 p-2'>
                                    {[...Array(3)].map((_, i) => (
                                        <div key={i} className='flex items-center gap-3 p-2 animate-pulse'>
                                            <div className='rounded-full w-[42px] h-[42px] bg-gray-200'></div>
                                            <div className='flex-1 space-y-2'>
                                                <div className='h-3 bg-gray-200 rounded w-2/3'></div>
                                                <div className='h-2.5 bg-gray-200 rounded w-1/2'></div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : searchData.length === 0 ? (
                                <div className='text-center py-8 px-4'>
                                    <p className='text-gray-600 font-medium text-sm'>No results for "{searchInput}"</p>
                                    <p className='text-gray-400 text-xs mt-1'>Try searching a different name or username.</p>
                                </div>
                            ) : (
                                <div className='space-y-1 p-2'>
                                    {searchData.map((search) => (
                                        <div key={search._id || search.userName} className='flex items-center gap-3 cursor-pointer hover:bg-gray-100 rounded-md p-2 transition-colors' onClick={() => { handleGetProfile(search.userName); clearSearch(); setSearchFocused(false); }}>
                                            <div className='rounded-full w-[42px] h-[42px] shrink-0 overflow-hidden bg-gray-100'>
                                                <img src={search.profileImage || empty_profile} alt="" className='w-full h-full object-cover' />
                                            </div>
                                            <div className='min-w-0'>
                                                <h1 className='font-semibold text-[15px] text-gray-900 truncate'>{search.firstName} {search.lastName}</h1>
                                                <p className='text-[13px] text-gray-500 truncate'>{search.headline}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>}
                </form>
            </div>

            <div className='flex items-center gap-1 lg:gap-5 shrink-0'>
                <div
                    className={`lg:flex flex-col justify-center items-center cursor-pointer hidden px-3 py-1 rounded-md transition-colors ${navItem("/") ? "text-[#0a66c2]" : "text-gray-600 hover:bg-gray-100"}`}
                    onClick={() => navigate("/")}
                >
                    <TiHome className='text-[22px]' />
                    <span className='font-medium text-[12px] mt-0.5'>Home</span>
                </div>
                <div
                    className={`md:flex hidden flex-col justify-center items-center cursor-pointer px-3 py-1 rounded-md transition-colors ${navItem("/network") ? "text-[#0a66c2]" : "text-gray-600 hover:bg-gray-100"}`}
                    onClick={() => navigate("/network")}
                >
                    <HiUsers className='text-[22px]' />
                    <span className='font-medium text-[12px] mt-0.5'>Network</span>
                </div>
                <div
                    className={`md:flex hidden flex-col justify-center items-center cursor-pointer px-3 py-1 rounded-md transition-colors relative ${navItem("/notification") ? "text-[#0a66c2]" : "text-gray-600 hover:bg-gray-100"}`}
                    onClick={() => { navigate("/notification"); setNotificationCount(0); }}
                >
                    <span className='relative'>
                        <IoMdNotifications className='text-[22px]' />
                        {notificationCount > 0 &&
                            <span className='absolute -top-1.5 -right-2 bg-red-500 text-white text-[10px] font-bold rounded-full min-w-[16px] h-[16px] flex items-center justify-center px-1 animate-[fadeIn_0.15s_ease-out]'>
                                {notificationCount > 9 ? "9+" : notificationCount}
                            </span>
                        }
                    </span>
                    <span className='font-medium text-[12px] mt-0.5'>Alerts</span>
                </div>

                <div className='relative' ref={popupRef}>
                    <div className='rounded-full w-[38px] h-[38px] overflow-hidden cursor-pointer ring-2 ring-transparent hover:ring-[#0a66c2]/40 transition-all' onClick={() => setShowPopup(prev => !prev)}>
                        <img src={userData?.profileImage || empty_profile} alt="profile" className='w-full h-full object-cover' />
                    </div>
                    {showPopup &&
                        <div className='bg-white z-50 w-[240px] p-4 shadow-xl border border-gray-100 absolute top-[52px] right-0 rounded-lg animate-[fadeIn_0.15s_ease-out]'>
                            <div className='flex flex-col items-center text-center pb-3'>
                                <div className='rounded-full w-[60px] h-[60px] overflow-hidden ring-2 ring-gray-100'>
                                    <img src={userData?.profileImage || empty_profile} alt="profile" className='w-full h-full object-cover' />
                                </div>
                                <p className='text-[17px] font-semibold mt-2 text-gray-900'>{userData?.firstName} {userData?.lastName}</p>
                                <p className='text-[13px] text-gray-500 truncate max-w-full'>{userData?.headline}</p>
                                <button
                                    className='mt-3 border border-[#0a66c2] rounded-full w-full h-[36px] text-[#0a66c2] font-semibold text-sm hover:bg-[#0a66c2]/5 transition-colors'
                                    onClick={() => { handleGetProfile(userData.userName); setShowPopup(false); }}
                                >
                                    View Profile
                                </button>
                            </div>
                            <div className='w-full h-[1px] bg-gray-200'></div>
                            <div
                                className='flex gap-3 items-center cursor-pointer text-gray-700 hover:bg-gray-100 rounded-md p-2 mt-2 transition-colors'
                                onClick={() => { navigate("/network"); setShowPopup(false); }}
                            >
                                <HiUsers className='text-xl' />
                                <span className='font-medium text-sm'>My Network</span>
                            </div>
                            <button
                                className='mt-2 border border-red-300 rounded-full w-full h-[36px] text-red-500 font-semibold text-sm hover:bg-red-50 transition-colors'
                                onClick={handleSignOut}
                            >
                                Sign Out
                            </button>
                        </div>}
                </div>
            </div>
        </div>
    )
}

export default Nav