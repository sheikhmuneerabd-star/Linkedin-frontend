import axios from "axios";
import { createContext, useContext, useEffect, useState } from "react"
import { authData } from "./AuthContext";
import { useNavigate } from "react-router-dom";
import { io } from 'socket.io-client'

export const socket = io("http://localhost:8000")
export const userDataContext = createContext();
function UserContext({children}) {
    const [userData, setUserData] = useState(null);
    const [edit, setEdit] = useState(false);
    const { serverUrl } = useContext(authData);
    const [postData, setPostData] = useState([]);
    const [profileData, setProfileData] = useState([]);
    const [notificationCount, setNotificationCount] = useState(0);
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

    // Register this user on the socket as soon as we know who they are,
    // so real-time events (new posts, connection updates, notifications)
    // reach them even if they're not on a page with a ConnectionButton mounted.
    useEffect(() => {
        if (userData?._id) {
            socket.emit("register", userData._id);
            getNotificationCount();
        }
    }, [userData?._id]);

    // Live feed: new posts from anyone appear instantly, no refresh needed
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

        socket.on("newPost", handleNewPost);
        socket.on("newNotification", handleNewNotification);

        return () => {
            socket.off("newPost", handleNewPost);
            socket.off("newNotification", handleNewNotification);
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
        getNotificationCount
    }

  return (
    <userDataContext.Provider value={data}>
        {children}
    </userDataContext.Provider>
  )
}

export default UserContext
