import React, { useContext, useEffect, useState } from 'react'
import Nav from '../Components/Nav'
import axios from 'axios';
import { authData } from '../Context/AuthContext';
import { socket, userDataContext } from '../Context/UserContext';
import empty_profile from '../assets/empty_profile.png';
import { RxCross2 } from "react-icons/rx";
import { IoMdNotificationsOutline } from "react-icons/io";

function Notification() {
    const [notificationData, setNotificationData] = useState([]);
    const [loading, setLoading] = useState(true);
    const { serverUrl } = useContext(authData);
    const { setNotificationCount } = useContext(userDataContext);

    const handleGetNotification = async () => {
        try {
            setLoading(true);
            let result = await axios.get(`${serverUrl}/api/notification/get/`, { withCredentials: true });
            setNotificationData(result.data)
        } catch (error) {
            console.log(error);
        } finally {
            setLoading(false);
        }
    }

    const handleDeleteNotification = async (id) => {
        try {
            await axios.delete(`${serverUrl}/api/notification/deleteOne/${id}`, { withCredentials: true });
            await handleGetNotification();
        } catch (error) {
            console.log(error);
        }
    }

    const handleClearAllNotification = async () => {
        try {
            await axios.delete(`${serverUrl}/api/notification`, { withCredentials: true });
            await handleGetNotification();
        } catch (error) {
            console.log(error);
        }
    }

    useEffect(() => {
        handleGetNotification();
        // opening this page means the user has "seen" their alerts
        setNotificationCount(0);

        const handleNewNotification = (notification) => {
            setNotificationData((prev) => [notification, ...prev]);
        };
        socket.on("newNotification", handleNewNotification);

        return () => {
            socket.off("newNotification", handleNewNotification);
        };
    }, []);

    const handleMessage = (type) => {
        if (type == "like") {
            return "liked your post"
        } else if (type == "comment") {
            return "commented on your post"
        } else {
            return "accepted your connection"
        }
    }

    return (
        <div className='w-full min-h-screen bg-[#f4f2ee]'>
            <Nav />
            <div className='w-full max-w-[700px] mx-auto mt-5 px-4 pb-10'>

                <div className='w-full flex justify-between items-center px-4 shadow-sm border border-gray-200 font-semibold rounded-xl h-[64px] bg-white text-gray-900 text-[17px]'>
                    <span>Notifications {notificationData.length > 0 && `(${notificationData.length})`}</span>
                    {notificationData.length > 0 &&
                        <button
                            className='border border-red-300 rounded-full px-4 h-[34px] text-red-500 font-semibold text-sm hover:bg-red-50 transition-colors'
                            onClick={handleClearAllNotification}
                        >
                            Clear all
                        </button>
                    }
                </div>

                <div className='mt-4 space-y-3'>
                    {loading ? (
                        [...Array(3)].map((_, i) => (
                            <div key={i} className='w-full px-4 py-4 border border-gray-200 rounded-xl bg-white animate-pulse flex items-center gap-3'>
                                <div className='rounded-full w-[52px] h-[52px] bg-gray-200'></div>
                                <div className='h-3 w-40 bg-gray-200 rounded'></div>
                            </div>
                        ))
                    ) : notificationData.length === 0 ? (
                        <div className='w-full flex flex-col items-center justify-center px-4 shadow-sm border border-gray-200 rounded-xl py-12 bg-white text-center'>
                            <IoMdNotificationsOutline className='text-4xl text-gray-300 mb-2' />
                            <h2 className='font-semibold text-gray-800'>No notifications yet</h2>
                            <p className='text-gray-500 text-sm mt-1'>Likes, comments, and connections will show up here.</p>
                        </div>
                    ) : (
                        notificationData.map((noti) => (
                            <div key={noti._id} className='w-full border border-gray-200 rounded-xl p-4 bg-white shadow-sm'>
                                <div className='flex justify-between items-start gap-2'>
                                    <div className='flex items-center gap-3 min-w-0'>
                                        <div className='rounded-full w-[48px] h-[48px] shrink-0 overflow-hidden bg-gray-100'>
                                            <img src={noti.relatedUser.profileImage || empty_profile} alt="" className='w-full h-full object-cover' />
                                        </div>
                                        <div className='min-w-0 text-[14px] text-gray-800'>
                                            <span className='font-semibold text-gray-900'>{noti.relatedUser.firstName} {noti.relatedUser.lastName}</span>
                                            {" "}{handleMessage(noti.type)}
                                        </div>
                                    </div>
                                    <RxCross2
                                        className='text-[20px] text-gray-400 hover:text-red-500 cursor-pointer transition-colors shrink-0'
                                        onClick={() => handleDeleteNotification(noti._id)}
                                    />
                                </div>

                                {noti.relatedPost &&
                                    <div className='mt-3 ml-[60px] flex gap-3 items-center bg-gray-50 rounded-lg p-2'>
                                        {noti.relatedPost.image &&
                                            <div className='w-[56px] h-[56px] rounded-md overflow-hidden shrink-0'>
                                                <img src={noti.relatedPost.image} alt="" className='w-full h-full object-cover' />
                                            </div>
                                        }
                                        <p className='text-[13px] text-gray-600 line-clamp-2'>{noti.relatedPost.description}</p>
                                    </div>
                                }
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    )
}

export default Notification