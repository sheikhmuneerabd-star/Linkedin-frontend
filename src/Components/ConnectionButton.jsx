import axios from 'axios'
import React, { useContext, useEffect, useState } from 'react'
import { authData } from '../Context/AuthContext'
import { userDataContext } from '../Context/UserContext'
import { io } from 'socket.io-client'
import { useNavigate } from 'react-router-dom'
import { FiUserPlus, FiClock, FiUserCheck, FiUserX } from "react-icons/fi";

const socket = io("https://linkedinbackend-ruddy.vercel.app");

function ConnectionButton({ userId }) {
    const { serverUrl } = useContext(authData);
    const { userData, setUserData } = useContext(userDataContext);
    const navigate = useNavigate();

    const [status, setStatus] = useState("");
    const [loading, setLoading] = useState(false);
    const [hovering, setHovering] = useState(false);

    const handleSendConnection = async () => {
        // optimistic update so the sender sees "Pending" immediately
        setStatus("pending");
        try {
            setLoading(true);
            await axios.post(`${serverUrl}/api/connection/send/${userId}`, {}, { withCredentials: true })
        } catch (error) {
            setStatus(""); // revert on failure
            console.log(error);
        } finally {
            setLoading(false);
        }
    }

    const handleRemoveConnection = async () => {
        const prevStatus = status;
        setStatus(""); // optimistic
        try {
            setLoading(true);
            await axios.delete(`${serverUrl}/api/connection/remove/${userId}`, { withCredentials: true })
        } catch (error) {
            setStatus(prevStatus); // revert on failure
            console.log(error);
        } finally {
            setLoading(false);
        }
    }

    const handleGetConnectionStatus = async () => {
        try {
            let result = await axios.get(`${serverUrl}/api/connection/getStatus/${userId}`, { withCredentials: true });
            setStatus(result.data.status)
        } catch (error) {
            console.log(error);
        }
    }

    useEffect(() => {
        socket.emit("register", userData._id)
        handleGetConnectionStatus();

        socket.on("statusUpdate", ({ updatedUserId, newStatus }) => {
            if (updatedUserId == userId) {
                setStatus(newStatus)
            }
        })

        return () => {
            socket.off("statusUpdate")
        }
    }, [userId])

    const handleClick = async () => {
        if (loading) return;
        if (status == "disconnect") {
            await handleRemoveConnection();
        } else if (status == "received") {
            navigate("/network");
        } else if (status == "pending") {
            return; // no-op, waiting on the other person
        } else {
            await handleSendConnection();
        }
    }

    // Decide label, icon, and styling per status
    const getButtonContent = () => {
        if (loading) {
            return {
                label: "Please wait...",
                icon: <span className='w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin' />,
                className: 'border-gray-300 text-gray-400 cursor-not-allowed'
            }
        }
        switch (status) {
            case "pending":
                return {
                    label: "Pending",
                    icon: <FiClock size={16} />,
                    className: 'border-gray-300 text-gray-500 cursor-not-allowed'
                }
            case "received":
                return {
                    label: "Respond",
                    icon: <FiUserCheck size={16} />,
                    className: 'border-[#0a66c2] text-white bg-[#0a66c2] hover:bg-[#004182]'
                }
            case "disconnect":
                return hovering
                    ? { label: "Remove", icon: <FiUserX size={16} />, className: 'border-red-400 text-red-500 hover:bg-red-50' }
                    : { label: "Connected", icon: <FiUserCheck size={16} />, className: 'border-[#0a66c2] text-[#0a66c2] hover:bg-[#0a66c2]/5' }
            default:
                return {
                    label: "Connect",
                    icon: <FiUserPlus size={16} />,
                    className: 'border-[#0a66c2] text-[#0a66c2] hover:bg-[#0a66c2] hover:text-white'
                }
        }
    }

    const { label, icon, className } = getButtonContent();

    return (
        <button
            className={`border-2 rounded-full flex gap-2 items-center justify-center min-w-[120px] px-4 h-[38px] font-semibold text-sm transition-colors ${className}`}
            disabled={status == "pending" || loading}
            onClick={handleClick}
            onMouseEnter={() => setHovering(true)}
            onMouseLeave={() => setHovering(false)}
        >
            {icon}
            {label}
        </button>
    )
}

export default ConnectionButton
