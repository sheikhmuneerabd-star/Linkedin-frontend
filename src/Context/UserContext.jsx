import axios from "axios";
import { createContext, useContext, useEffect, useState } from "react"
import { authData } from "./AuthContext";
import { useNavigate } from "react-router-dom";
import { io } from 'socket.io-client'

// Same server URL logic as AuthContext (this file sits outside the
// component tree, so it can't read the context directly).
const SOCKET_URL = import.meta.env.VITE_SERVER_URL || "linkedin-backend-production-2e3f.up.railway.app";
export const socket = io(SOCKET_URL)
export const userDataContext = createContext();
function UserContext({children}) {
    const [userData, setUserData] = useState(null);
    const [edit, setEdit] = useState(false);
    const { serverUrl } = useContext(authData);
    const [postData, setPostData] = useState([]);
    const [profileData, setProfileData] = useState([]);
    const [notificationCount, setNotificationCount] = useState(0);
    const [onlineUsers, setOnlineUsers] = useState([]);
    const [unreadMessageCount, setUnreadMessageCount] = useState(0);
    const navigate = useNavigate();

    const getCurrentUser = async () => {
        try {
            let res = await axios.get(serverUrl + "/api/user/currentUser", {withCredentials: true});
            setUserData(res.data);
        } catch (error) {
            console.log("getCurrentUser: ", error);
            setUserData(null);
        }
    }

    const getPost = async () => {
        try {
            let res = await axios.get(serverUrl + "/api/post/getPost", {withCredentials: true});
            setPostData(res.data);
        } catch (error) {
            console.log("Error get post: ", error);
        }
    }

    const getNotificationCount = async () => {
        try {
            let res = await axios.get(serverUrl + "/api/notification/get", {withCredentials: true});
            setNotificationCount(res.data.length);
        } catch (error) {
            console.log("Error get notification count: ", error);
        }
    }

    // resyncs the messaging badge from the server (called on login and whenever
    // a chat is opened/read, instead of trying to track +1/-1 by hand)
    const refreshUnreadMessageCount = async () => {
        try {
            let res = await axios.get(serverUrl + "/api/message/conversations", {withCredentials: true});
            let total = res.data.reduce((sum, conv) => sum + conv.unreadCount, 0);
            setUnreadMessageCount(total);
        } catch (error) {
            console.log("Error get unread message count: ", error);
        }
    }

    const handleGetProfile = async (userName) => {
        try {
            let res = await axios.get(serverUrl + `/api/user/profile/${userName}`, {withCredentials: true});
            setProfileData(res.data);
            navigate("/viewProfile");
        } catch (error) {
            console.log("Error get profile: ", error);
        }
    }

    useEffect(() => {
        getCurrentUser();
        getPost();
    }, []);

    // Registers presence and pulls in everything that depends on being logged in
    // (posts, notifications, unread messages). This runs again whenever userData
    // changes — crucially including the moment right after Login/SignUp succeeds,
    // since the very first getPost()/getCurrentUser() call above happens before
    // the user is authenticated and will have failed silently at that point.
    // Without this, the feed stays empty right after logging in until a manual
    // page refresh re-runs everything with a valid session.
    useEffect(() => {
        if (userData?._id) {
            socket.emit("register", userData._id);
            getPost();
            getNotificationCount();
            refreshUnreadMessageCount();
        }
    }, [userData?._id]);

    // IMPORTANT: whenever the socket (re)connects — after a backend restart,
    // a dropped wifi connection, the laptop waking up, etc — socket.io gives us
    // a brand new socket.id. The server has no idea who that new socket belongs
    // to until we register again. Without this, messages/notifications/connection
    // updates silently stop arriving in real time until the page is refreshed.
    useEffect(() => {
        const handleConnect = () => {
            if (userData?._id) {
                socket.emit("register", userData._id);
            }
        };
        socket.on("connect", handleConnect);
        return () => socket.off("connect", handleConnect);
    }, [userData?._id]);

    useEffect(() => {
        const handleNewPost = (newPost) => {
            setPostData((prev) => {
                if (prev.some((p) => p._id === newPost._id)) return prev;
                return [newPost, ...prev];
            });
        };

        const handleNewNotification = () => {
            setNotificationCount((prev) => prev + 1);
        };

        // presence: who's online right now
        const handleOnlineUsers = (userIds) => setOnlineUsers(userIds);
        const handleUserOnline = (userId) => setOnlineUsers((prev) => prev.includes(userId) ? prev : [...prev, userId]);
        const handleUserOffline = (userId) => setOnlineUsers((prev) => prev.filter((id) => id !== userId));

        // chat: bump the badge for any new message that arrives anywhere in the app;
        // the Messaging page itself resyncs the exact count once a chat is opened
        const handleNewMessage = () => setUnreadMessageCount((prev) => prev + 1);

        socket.on("newPost", handleNewPost);
        socket.on("newNotification", handleNewNotification);
        socket.on("onlineUsers", handleOnlineUsers);
        socket.on("userOnline", handleUserOnline);
        socket.on("userOffline", handleUserOffline);
        socket.on("newMessage", handleNewMessage);

        return () => {
            socket.off("newPost", handleNewPost);
            socket.off("newNotification", handleNewNotification);
            socket.off("onlineUsers", handleOnlineUsers);
            socket.off("userOnline", handleUserOnline);
            socket.off("userOffline", handleUserOffline);
            socket.off("newMessage", handleNewMessage);
        };
    }, []);

    const data = {
        userData,
        setUserData,
        edit,
        setEdit,
        postData,
        setPostData,
        getPost,
        handleGetProfile,
        profileData,
        setProfileData,
        notificationCount,
        setNotificationCount,
        getNotificationCount,
        onlineUsers,
        unreadMessageCount,
        setUnreadMessageCount,
        refreshUnreadMessageCount
    }

  return (
    <userDataContext.Provider value={data}>
        {children}
    </userDataContext.Provider>
  )
}

export default UserContext
