import React, { useContext, useEffect, useState } from 'react'
import Nav from '../Components/Nav'
import axios from 'axios';
import { authData } from '../Context/AuthContext';
import { socket } from '../Context/UserContext';
import empty_profile from '../assets/empty_profile.png';
import { MdOutlineCancel } from "react-icons/md";
import { IoIosCheckmarkCircleOutline } from "react-icons/io";
import { HiUsers } from "react-icons/hi2";

function Network() {
    const { serverUrl } = useContext(authData);
    const [connections, setConnections] = useState([]);
    const [loading, setLoading] = useState(true);

    const handleGetRequests = async () => {
        try {
            setLoading(true);
            let result = await axios.get(`${serverUrl}/api/connection/requests/`, { withCredentials: true })
            setConnections(result.data)
        } catch (error) {
            console.log(error);
        } finally {
            setLoading(false);
        }
    }

    const handleAcceptConnection = async (requestId) => {
        try {
            await axios.put(`${serverUrl}/api/connection/accept/${requestId}`, {}, { withCredentials: true })
            setConnections(connections.filter((con) => con._id !== requestId));
        } catch (error) {
            console.log(error);
        }
    }

    const handleRejectConnection = async (requestId) => {
        try {
            await axios.put(`${serverUrl}/api/connection/reject/${requestId}`, {}, { withCredentials: true })
            setConnections(connections.filter((con) => con._id !== requestId));
        } catch (error) {
            console.log(error);
        }
    }

    useEffect(() => {
        handleGetRequests();

        const handleNewRequest = (newRequest) => {
            setConnections((prev) => {
                if (prev.some((c) => c._id === newRequest._id)) return prev;
                return [newRequest, ...prev];
            });
        };
        socket.on("newConnectionRequest", handleNewRequest);

        return () => {
            socket.off("newConnectionRequest", handleNewRequest);
        };
    }, []);

    return (
        <div className='w-full min-h-screen bg-[#f4f2ee]'>
            <Nav />
            <div className='w-full max-w-[700px] mx-auto mt-5 px-4 pb-10'>

                <div className='w-full flex items-center px-4 shadow-sm border border-gray-200 font-semibold mt-0 rounded-xl h-[64px] bg-white text-gray-900 text-[17px]'>
                    Invitations {connections.length > 0 && `(${connections.length})`}
                </div>

                <div className='mt-4 space-y-3'>
                    {loading ? (
                        [...Array(3)].map((_, i) => (
                            <div key={i} className='w-full flex justify-between items-center px-4 shadow-sm border border-gray-200 rounded-xl h-[80px] bg-white animate-pulse'>
                                <div className='flex items-center gap-3'>
                                    <div className='rounded-full w-[52px] h-[52px] bg-gray-200'></div>
                                    <div className='h-3 w-32 bg-gray-200 rounded'></div>
                                </div>
                            </div>
                        ))
                    ) : connections.length === 0 ? (
                        <div className='w-full flex flex-col items-center justify-center px-4 shadow-sm border border-gray-200 rounded-xl py-12 bg-white text-center'>
                            <HiUsers className='text-4xl text-gray-300 mb-2' />
                            <h2 className='font-semibold text-gray-800'>No pending invitations</h2>
                            <p className='text-gray-500 text-sm mt-1'>New connection requests will show up here.</p>
                        </div>
                    ) : (
                        connections.map((connection) => (
                            <div key={connection._id} className='w-full px-4 flex justify-between items-center shadow-sm border border-gray-200 rounded-xl h-[80px] bg-white'>
                                <div className='flex items-center gap-3 min-w-0'>
                                    <div className='rounded-full w-[52px] h-[52px] shrink-0 overflow-hidden bg-gray-100'>
                                        <img src={connection.sender.profileImage || empty_profile} alt="" className='w-full h-full object-cover' />
                                    </div>
                                    <div className='min-w-0'>
                                        <h1 className='font-semibold text-[16px] text-gray-900 truncate'>{connection.sender.firstName} {connection.sender.lastName}</h1>
                                        <p className='text-[13px] text-gray-500 truncate'>{connection.sender.headline}</p>
                                    </div>
                                </div>
                                <div className='flex gap-3 shrink-0 ml-2'>
                                    <IoIosCheckmarkCircleOutline
                                        className='text-[34px] text-[#0a66c2] cursor-pointer hover:scale-110 transition-transform'
                                        onClick={() => handleAcceptConnection(connection._id)}
                                        title="Accept"
                                    />
                                    <MdOutlineCancel
                                        className='text-[34px] text-gray-400 hover:text-red-500 cursor-pointer hover:scale-110 transition-transform'
                                        onClick={() => handleRejectConnection(connection._id)}
                                        title="Reject"
                                    />
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    )
}

export default Network