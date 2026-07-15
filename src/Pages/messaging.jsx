import React, { useContext, useEffect, useRef, useState } from 'react'
import Nav from '../Components/Nav'
import axios from 'axios'
import moment from 'moment'
import { authData } from '../Context/AuthContext'
import { socket, userDataContext } from '../Context/UserContext'
import empty_profile from '../assets/empty_profile.png'
import { IoSend, IoCheckmark, IoCheckmarkDone } from "react-icons/io5"
import { FaRegImage } from "react-icons/fa6"
import { RxCross2 } from "react-icons/rx"
import { IoChatbubbleEllipsesOutline, IoArrowBack } from "react-icons/io5"
import { GoSearch } from "react-icons/go"

function Messaging() {
    const { serverUrl } = useContext(authData);
    const { userData, onlineUsers, refreshUnreadMessageCount } = useContext(userDataContext);

    const [conversations, setConversations] = useState([]);
    const [conversationsLoading, setConversationsLoading] = useState(true);
    const [searchInput, setSearchInput] = useState("");

    const [selectedUser, setSelectedUser] = useState(null);
    const [messages, setMessages] = useState([]);
    const [messagesLoading, setMessagesLoading] = useState(false);

    const [text, setText] = useState("");
    const [frontendImage, setFrontendImage] = useState("");
    const [backendImage, setBackendImage] = useState(null);
    const [sending, setSending] = useState(false);

    const imageInputRef = useRef();
    const bottomRef = useRef();
    const selectedUserRef = useRef(null); // always holds the latest selectedUser, safe to read inside socket callbacks

    useEffect(() => {
        selectedUserRef.current = selectedUser;
    }, [selectedUser]);

    const getConversations = async (silent = false) => {
        try {
            if (!silent) setConversationsLoading(true);
            let res = await axios.get(serverUrl + "/api/message/conversations", { withCredentials: true });
            setConversations(res.data);
        } catch (error) {
            console.log("getConversations: ", error);
        } finally {
            if (!silent) setConversationsLoading(false);
        }
    }

    const openConversation = async (user) => {
        setSelectedUser(user);
        setMessages([]);
        try {
            setMessagesLoading(true);
            let res = await axios.get(serverUrl + `/api/message/get/${user._id}`, { withCredentials: true });
            setMessages(res.data);

            // this chat is now "read" — clear its badge locally and resync the global count
            setConversations((prev) => prev.map((c) => c.user._id === user._id ? { ...c, unreadCount: 0 } : c));
            refreshUnreadMessageCount();
        } catch (error) {
            console.log("openConversation: ", error);
        } finally {
            setMessagesLoading(false);
        }
    }

    const handleImagePick = (e) => {
        let file = e.target.files[0];
        if (!file) return;
        setBackendImage(file);
        setFrontendImage(URL.createObjectURL(file));
    }

    const handleSend = async (e) => {
        e.preventDefault();
        if (!text.trim() && !backendImage) return;
        if (!selectedUser) return;

        try {
            setSending(true);
            let formData = new FormData();
            formData.append("text", text);
            if (backendImage) formData.append("image", backendImage);

            let res = await axios.post(serverUrl + `/api/message/send/${selectedUser._id}`, formData, { withCredentials: true });

            setMessages((prev) => [...prev, res.data]);
            setConversations((prev) => {
                let updated = prev.map((c) => c.user._id === selectedUser._id ? { ...c, lastMessage: res.data } : c);
                updated.sort((a, b) => {
                    let aTime = a.lastMessage ? new Date(a.lastMessage.createdAt) : new Date(0);
                    let bTime = b.lastMessage ? new Date(b.lastMessage.createdAt) : new Date(0);
                    return bTime - aTime;
                });
                return updated;
            });

            setText("");
            setFrontendImage("");
            setBackendImage(null);
        } catch (error) {
            console.log("handleSend: ", error);
        } finally {
            setSending(false);
        }
    }

    // Safety net: sockets can momentarily drop (server restarts, wifi blips, etc).
    // While a chat is open, quietly re-check for new messages every few seconds
    // so nothing is ever stuck waiting for a manual refresh.
    useEffect(() => {
        if (!selectedUser) return;

        const interval = setInterval(async () => {
            try {
                let res = await axios.get(serverUrl + `/api/message/get/${selectedUser._id}`, { withCredentials: true });
                setMessages((prev) => {
                    if (prev.length === res.data.length &&
                        prev.every((m, i) => m._id === res.data[i]._id && m.status === res.data[i].status)) {
                        return prev; // nothing changed, skip re-render
                    }
                    return res.data;
                });
            } catch (error) {
                // silent — this is just a background safety check
            }
        }, 3000);

        return () => clearInterval(interval);
    }, [selectedUser, serverUrl]);

    // Same idea for the conversation list — catches a missed "newMessage" push
    // for chats that aren't currently open, without needing a page refresh.
    useEffect(() => {
        getConversations();
        const interval = setInterval(() => {
            getConversations(true);
        }, 8000);
        return () => clearInterval(interval);
    }, []);

    // auto scroll to newest message
    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    useEffect(() => {
        const handleNewMessage = async (message) => {
            const currentlyOpen = selectedUserRef.current;

            if (currentlyOpen && message.sender._id === currentlyOpen._id) {
                // chat is open right now — refetch so it's immediately marked "seen" on the server too
                try {
                    let res = await axios.get(serverUrl + `/api/message/get/${currentlyOpen._id}`, { withCredentials: true });
                    setMessages(res.data);
                } catch (error) {
                    setMessages((prev) => [...prev, message]);
                }
            } else {
                setConversations((prev) => {
                    let exists = prev.some((c) => c.user._id === message.sender._id);
                    let updated = exists
                        ? prev.map((c) => c.user._id === message.sender._id
                            ? { ...c, lastMessage: message, unreadCount: (c.unreadCount || 0) + 1 }
                            : c)
                        : prev;
                    updated.sort((a, b) => {
                        let aTime = a.lastMessage ? new Date(a.lastMessage.createdAt) : new Date(0);
                        let bTime = b.lastMessage ? new Date(b.lastMessage.createdAt) : new Date(0);
                        return bTime - aTime;
                    });
                    return updated;
                });
            }
        };

        const handleStatusUpdate = ({ messageId, status }) => {
            setMessages((prev) => prev.map((m) => m._id === messageId ? { ...m, status } : m));
        };

        const handleMessagesSeen = ({ messageIds }) => {
            setMessages((prev) => prev.map((m) => messageIds.includes(m._id) ? { ...m, status: "seen" } : m));
        };

        socket.on("newMessage", handleNewMessage);
        socket.on("messageStatusUpdate", handleStatusUpdate);
        socket.on("messagesSeen", handleMessagesSeen);

        return () => {
            socket.off("newMessage", handleNewMessage);
            socket.off("messageStatusUpdate", handleStatusUpdate);
            socket.off("messagesSeen", handleMessagesSeen);
        };
    }, [serverUrl]);

    const filteredConversations = conversations.filter((c) =>
        `${c.user.firstName} ${c.user.lastName}`.toLowerCase().includes(searchInput.toLowerCase())
    );

    const renderTicks = (status) => {
        if (status === "seen") return <IoCheckmarkDone className='text-[15px] text-[#53bdeb]' />;
        if (status === "delivered") return <IoCheckmarkDone className='text-[15px] text-white/70' />;
        return <IoCheckmark className='text-[15px] text-white/70' />;
    }

    return (
        <div className='w-full h-screen bg-[#f4f2ee] flex flex-col'>
            <Nav />
            <div className='flex-1 max-w-[1128px] w-full mx-auto flex border-x border-gray-200 bg-white overflow-hidden'>

                {/* Conversation list */}
                <div className={`w-full md:w-[340px] shrink-0 border-r border-gray-200 flex flex-col ${selectedUser ? "hidden md:flex" : "flex"}`}>
                    <div className='p-4 border-b border-gray-200'>
                        <h1 className='text-xl font-bold text-gray-900 mb-3'>Messaging</h1>
                        <div className='relative'>
                            <GoSearch className='absolute left-3 top-1/2 -translate-y-1/2 text-gray-400' />
                            <input
                                type="text"
                                placeholder='Search connections...'
                                className='w-full h-[38px] pl-9 pr-3 rounded-full bg-[#eef3f8] outline-none text-[14px] focus:bg-white focus:ring-2 focus:ring-[#0a66c2]/30 border border-transparent focus:border-[#0a66c2]/30 transition-all'
                                value={searchInput}
                                onChange={(e) => setSearchInput(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className='flex-1 overflow-y-auto'>
                        {conversationsLoading ? (
                            [...Array(5)].map((_, i) => (
                                <div key={i} className='flex items-center gap-3 p-3 animate-pulse'>
                                    <div className='rounded-full w-[52px] h-[52px] bg-gray-200 shrink-0'></div>
                                    <div className='flex-1 space-y-2'>
                                        <div className='h-3 bg-gray-200 rounded w-2/3'></div>
                                        <div className='h-2.5 bg-gray-200 rounded w-1/2'></div>
                                    </div>
                                </div>
                            ))
                        ) : filteredConversations.length === 0 ? (
                            <div className='flex flex-col items-center text-center py-14 px-6'>
                                <IoChatbubbleEllipsesOutline className='text-4xl text-gray-300 mb-2' />
                                <h2 className='font-semibold text-gray-800'>No conversations yet</h2>
                                <p className='text-gray-500 text-sm mt-1'>You can message people once you're connected with them.</p>
                            </div>
                        ) : (
                            filteredConversations.map((conv) => {
                                const isOnline = onlineUsers.includes(conv.user._id);
                                const isSelected = selectedUser?._id === conv.user._id;
                                return (
                                    <div
                                        key={conv.user._id}
                                        className={`flex items-center gap-3 p-3 cursor-pointer transition-colors border-l-4 ${isSelected ? "bg-[#0a66c2]/5 border-[#0a66c2]" : "border-transparent hover:bg-gray-50"}`}
                                        onClick={() => openConversation(conv.user)}
                                    >
                                        <div className='relative shrink-0'>
                                            <div className='rounded-full w-[52px] h-[52px] overflow-hidden bg-gray-100'>
                                                <img src={conv.user.profileImage || empty_profile} alt="" className='w-full h-full object-cover' />
                                            </div>
                                            {isOnline && <span className='absolute bottom-0 right-0 w-3 h-3 rounded-full bg-green-500 ring-2 ring-white'></span>}
                                        </div>
                                        <div className='min-w-0 flex-1'>
                                            <div className='flex justify-between items-center'>
                                                <h1 className={`text-[15px] truncate ${conv.unreadCount > 0 ? "font-bold text-gray-900" : "font-semibold text-gray-800"}`}>
                                                    {conv.user.firstName} {conv.user.lastName}
                                                </h1>
                                                {conv.lastMessage &&
                                                    <span className='text-[11px] text-gray-400 shrink-0 ml-2'>{moment(conv.lastMessage.createdAt).fromNow(true)}</span>
                                                }
                                            </div>
                                            <div className='flex justify-between items-center mt-0.5'>
                                                <p className={`text-[13px] truncate ${conv.unreadCount > 0 ? "text-gray-900 font-medium" : "text-gray-500"}`}>
                                                    {conv.lastMessage
                                                        ? (conv.lastMessage.image && !conv.lastMessage.text ? "📷 Photo" : conv.lastMessage.text)
                                                        : "Say hello 👋"}
                                                </p>
                                                {conv.unreadCount > 0 &&
                                                    <span className='bg-[#0a66c2] text-white text-[11px] font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1 shrink-0 ml-2'>
                                                        {conv.unreadCount > 9 ? "9+" : conv.unreadCount}
                                                    </span>
                                                }
                                            </div>
                                        </div>
                                    </div>
                                )
                            })
                        )}
                    </div>
                </div>

                {/* Chat window */}
                <div className={`flex-1 flex-col ${selectedUser ? "flex" : "hidden md:flex"}`}>
                    {!selectedUser ? (
                        <div className='flex-1 flex flex-col items-center justify-center text-center px-6'>
                            <IoChatbubbleEllipsesOutline className='text-6xl text-gray-200 mb-3' />
                            <h2 className='font-semibold text-gray-700 text-lg'>Your messages</h2>
                            <p className='text-gray-400 text-sm mt-1'>Pick a conversation from the left to start chatting.</p>
                        </div>
                    ) : (
                        <>
                            {/* Chat header */}
                            <div className='flex items-center gap-3 p-3 border-b border-gray-200 shrink-0'>
                                <IoArrowBack className='text-2xl text-gray-600 cursor-pointer md:hidden' onClick={() => setSelectedUser(null)} />
                                <div className='relative shrink-0'>
                                    <div className='rounded-full w-[42px] h-[42px] overflow-hidden bg-gray-100'>
                                        <img src={selectedUser.profileImage || empty_profile} alt="" className='w-full h-full object-cover' />
                                    </div>
                                    {onlineUsers.includes(selectedUser._id) && <span className='absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-green-500 ring-2 ring-white'></span>}
                                </div>
                                <div className='min-w-0'>
                                    <h1 className='font-semibold text-[15px] text-gray-900 truncate'>{selectedUser.firstName} {selectedUser.lastName}</h1>
                                    <p className='text-[12px] text-gray-500'>{onlineUsers.includes(selectedUser._id) ? "Online" : "Offline"}</p>
                                </div>
                            </div>

                            {/* Messages */}
                            <div className='flex-1 overflow-y-auto p-4 space-y-2 bg-[#f4f2ee]'>
                                {messagesLoading ? (
                                    <div className='flex items-center justify-center h-full'>
                                        <span className='w-6 h-6 border-2 border-gray-300 border-t-[#0a66c2] rounded-full animate-spin'></span>
                                    </div>
                                ) : messages.length === 0 ? (
                                    <div className='flex flex-col items-center justify-center h-full text-center'>
                                        <p className='text-gray-400 text-sm'>No messages yet. Say hi to {selectedUser.firstName}! 👋</p>
                                    </div>
                                ) : (
                                    messages.map((msg) => {
                                        const isMine = msg.sender === userData._id || msg.sender._id === userData._id;
                                        return (
                                            <div key={msg._id} className={`flex ${isMine ? "justify-end" : "justify-start"}`}>
                                                <div className={`max-w-[70%] rounded-2xl px-3 py-2 ${isMine ? "bg-[#0a66c2] text-white rounded-br-md" : "bg-white text-gray-900 rounded-bl-md shadow-sm"}`}>
                                                    {msg.image &&
                                                        <img
                                                            src={msg.image}
                                                            alt=""
                                                            className='rounded-lg mb-1 max-w-[240px] max-h-[240px] w-auto h-auto object-cover cursor-pointer'
                                                            onClick={() => window.open(msg.image, "_blank")}
                                                        />
                                                    }
                                                    {msg.text && <p className='text-[14px] whitespace-pre-line break-words'>{msg.text}</p>}
                                                    <div className={`flex items-center justify-end gap-1 mt-0.5 ${isMine ? "text-white/70" : "text-gray-400"}`}>
                                                        <span className='text-[10px]'>{moment(msg.createdAt).format("h:mm A")}</span>
                                                        {isMine && renderTicks(msg.status)}
                                                    </div>
                                                </div>
                                            </div>
                                        )
                                    })
                                )}
                                <div ref={bottomRef}></div>
                            </div>

                            {/* Composer */}
                            <div className='p-3 border-t border-gray-200 shrink-0'>
                                {frontendImage &&
                                    <div className='relative w-fit mb-2'>
                                        <img src={frontendImage} alt="" className='h-[80px] rounded-lg border border-gray-200' />
                                        <RxCross2
                                            className='absolute -top-2 -right-2 bg-gray-800 text-white rounded-full p-1 text-lg cursor-pointer'
                                            onClick={() => { setFrontendImage(""); setBackendImage(null); }}
                                        />
                                    </div>
                                }
                                <form className='flex items-center gap-2' onSubmit={handleSend}>
                                    <input type="file" hidden accept='image/*' ref={imageInputRef} onChange={handleImagePick} />
                                    <FaRegImage
                                        className='text-2xl text-gray-500 hover:text-[#0a66c2] cursor-pointer transition-colors shrink-0'
                                        onClick={() => imageInputRef.current.click()}
                                    />
                                    <input
                                        type="text"
                                        className='flex-1 h-[42px] rounded-full bg-[#eef3f8] px-4 outline-none text-[14px] focus:bg-white focus:ring-2 focus:ring-[#0a66c2]/30 border border-transparent focus:border-[#0a66c2]/30 transition-all'
                                        placeholder='Write a message...'
                                        value={text}
                                        onChange={(e) => setText(e.target.value)}
                                    />
                                    <button
                                        type="submit"
                                        disabled={sending || (!text.trim() && !backendImage)}
                                        className='w-[42px] h-[42px] rounded-full bg-[#0a66c2] disabled:bg-gray-300 flex items-center justify-center shrink-0 transition-colors'
                                    >
                                        <IoSend className='text-white text-[18px]' />
                                    </button>
                                </form>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    )
}

export default Messaging