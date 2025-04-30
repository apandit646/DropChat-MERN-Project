import { useState, useEffect, useRef, useCallback } from "react";
import ReactPlayer from "react-player";
import {
  Send,
  Users,
  MessageCircle,
  Search,
  ArrowLeft,
  Video,
  EllipsisVertical,
  X,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import io from "socket.io-client";
import image from "../img/avatar.jpg";
import axios from "axios";
import ReactLinkify from "react-linkify";
import peer from "../service/peer";
import IncomingCallModal from "../common/IncomingCallModal.jsx";
import DeleteMessage from "../common/DeleteMessage.jsx";
import DeleteMessageReciver from "../common/DeleteMessageReciver.jsx";

const token = localStorage.getItem("token");
const userId = localStorage.getItem("userId");
const userName = localStorage.getItem("name");
const profileUrl = localStorage.getItem("photo") || image;

const Chat = ({ setIsLoggedIn }) => {
  const [socket, setSocket] = useState(null);
  const [selectedFriend, setSelectedFriend] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [friends, setFriends] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isMobileView, setIsMobileView] = useState(false);
  const [showSidebar, setShowSidebar] = useState(true);
  const messagesEndRef = useRef(null);
  const [showVideoCall, setShowVideoCall] = useState(false);
  const [remoteSocketId, setRemoteSocketId] = useState(null);
  const [myStream, setMyStream] = useState();
  const [remoteStream, setRemoteStream] = useState();
  const [callData, setCallData] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState("disconnected");
  const [messageToDelete, setMessageToDelete] = useState(null);
  const [messageToDeleteReciever, setMessageToDeleteReciever] = useState(null);
  const [refrenceMessage, setRefrenceMessage] = useState();
  const [showReferenceMessagePop, setShowReferenceMessagePop] = useState(false);
  const [refrenceMessageId, setRefrenceMessageId] = useState(null);

  // Authentication check
  useEffect(() => {
    if (!token) {
      setIsLoggedIn(false);
    } else {
      setIsLoggedIn(true);
    }
  }, [setIsLoggedIn]);

  // Fetch Friends List
  const getFriendsList = useCallback(async () => {
    try {
      const res = await fetch("http://127.0.0.1:5000/getFriendList", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await res.json();
      if (Array.isArray(data)) {
        setFriends(data);
      }
    } catch (error) {
      console.error("Error fetching friends:", error);
    }
  }, []);

  // Call once on component mount or when token changes
  useEffect(() => {
    if (token) {
      getFriendsList();
    }
  }, [getFriendsList]);

  // Initialize Socket Connection with proper cleanup
  useEffect(() => {
    if (!token) return;

    const newSocket = io("http://127.0.0.1:5000", {
      auth: { token },
      transports: ["websocket"],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      withCredentials: true,
    });

    setSocket(newSocket);
    setConnectionStatus("connecting");

    // Connection event handlers
    newSocket.on("connect", () => {
      console.log("Connected to WebSocket server");
      setConnectionStatus("connected");
    });

    newSocket.on("disconnect", (reason) => {
      console.log("Disconnected from WebSocket server:", reason);
      setConnectionStatus("disconnected");
      if (reason === "io server disconnect") {
        // Try to reconnect manually if server disconnects us
        newSocket.connect();
      }
    });

    newSocket.on("connect_error", (err) => {
      console.error("WebSocket connection error:", err.message);
      setConnectionStatus("error");
    });

    newSocket.on("res_hello", (data) => {
      console.log("Server hello:", data);
    });

    // Cleanup function
    return () => {
      if (newSocket) {
        newSocket.off("connect");
        newSocket.off("disconnect");
        newSocket.off("connect_error");
        newSocket.off("res_hello");
        newSocket.disconnect();
      }
    };
  }, []);

  // Handle responsive view
  useEffect(() => {
    const handleResize = () => {
      setIsMobileView(window.innerWidth < 768);
      setShowSidebar(window.innerWidth >= 768);
    };

    handleResize();
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Listen for Incoming Messages via Socket
  useEffect(() => {
    if (!socket) return;

    const messageHandler = async (serverMsg) => {
      console.log("Received message:", serverMsg);
      await getFriendsList();
      const replymessage =
        serverMsg.replyId === null ? null : serverMsg.replyId.message;

      const transformedMsg = {
        text: serverMsg.message,
        sender: serverMsg.sender._id,
        status: serverMsg.status,
        replyId: replymessage,
        resProfileUrl: serverMsg.sender.photo,
        timestamp: new Date(serverMsg.createdAt).toLocaleTimeString(),
        _id: serverMsg._id,
      };
      console.log("transformedMsg", transformedMsg);
      setMessages((prev) => [...prev, transformedMsg]);

      // If this is a message from the currently selected friend, mark as read
      if (selectedFriend && serverMsg.sender._id === selectedFriend._id) {
        socket.emit("markAsRead", {
          unreadMessages: [serverMsg._id],
        });
      }
    };

    socket.on("message", messageHandler);

    return () => {
      socket.off("message", messageHandler);
    };
  }, [socket, getFriendsList, selectedFriend]);

  // Count delivered messages for a specific friend
  const countDeliveredMessages = (friendId) => {
    const friend = friends.find((f) => f._id === friendId);
    return friend?.deliveredMessageCount || 0;
  };

  // Fetch Chat Messages when Friend is Selected
  const getChatMessages = useCallback(
    async (friend) => {
      setSelectedFriend(friend);
      if (isMobileView) setShowSidebar(false);

      try {
        const res = await fetch(
          `http://127.0.0.1:5000/chatMessages?receiver=${friend._id}`,
          {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (!res.ok) throw new Error("Failed to fetch messages");

        const data = await res.json();
        console.log("Messages:", data);
        console.log(data.replyId, "<><><><><>");

        const transformedMessages = data.map((msg) => ({
          text: msg.message,
          sender: msg.sender._id,
          status: msg.status,
          replyId: msg.replyId?.message ?? null,
          resProfileUrl: msg.sender.photo,
          timestamp: new Date(msg.createdAt).toLocaleTimeString(),
          _id: msg._id,
        }));

        setMessages(transformedMessages);

        const unreadMessages = transformedMessages.filter(
          (msg) => msg.sender === friend._id && msg.status === "delivered"
        );

        if (unreadMessages.length > 0) {
          socket.emit("markAsRead", {
            unreadMessages: unreadMessages.map((msg) => msg._id),
          });
        }

        // Reset unread count
        setFriends((prev) =>
          prev.map((f) =>
            f._id === friend._id ? { ...f, deliveredMessageCount: 0 } : f
          )
        );
      } catch (error) {
        console.error("Error fetching messages:", error);
      }
    },
    [isMobileView, socket]
  );

  // Send Message with error handling
  const handleSendMessage = useCallback(async () => {
    if (!newMessage.trim() || !selectedFriend || !socket) return;

    try {
      // Optimistically add the message to the UI
      // const tempId = Date.now().toString();
      // const optimisticMessage = {
      //   text: newMessage,
      //   sender: userId,
      //   status: "pending",
      //   resProfileUrl: profileUrl,
      //   timestamp: new Date().toLocaleTimeString(),
      //   _id: tempId,
      // };

      // setMessages((prev) => [...prev, optimisticMessage]);
      setNewMessage("");

      console.log("ssssssssssssssss", refrenceMessageId);
      // Emit the message to the server
      socket.emit("sendMessage", {
        receiver: selectedFriend._id,
        sender: userId,
        message: newMessage,
        replyId: refrenceMessageId,
      });
      setRefrenceMessage(null);

      // Refresh friends list to update unread counts
      await getFriendsList();
    } catch (error) {
      console.error("Error sending message:", error);
    }
  }, [newMessage, selectedFriend, socket, refrenceMessageId, getFriendsList]);

  const handleKeyPress = (e) => {
    if (e.key === "Enter") {
      handleSendMessage();
    }
  };

  // Filter friends based on search query
  const filteredFriends = friends.filter((friend) =>
    friend.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Format time for message timestamps
  const formatTimestamp = (timestamp) => {
    return (
      timestamp ||
      new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    );
  };

  // Delete the message
  const handleDeleteMessage = useCallback(async (id) => {
    console.log("Deleting message with ID:", id);
    try {
      if (!id) return;

      const res = await axios.delete(
        "http://localhost:5000/chat/deleteMessage",
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          data: {
            messageId: id,
          },
        }
      );

      console.log("Delete response:", res.data);

      if (res.data.success) {
        setMessages((prev) => prev.filter((msg) => msg._id !== id));
      } else {
        console.error("Error deleting message:", res.data.message);
      }
    } catch (error) {
      console.error("Error deleting message:", error);
    }
  }, []);
  // detete message from me
  const handleDeleteFromMe = useCallback(async (id) => {
    console.log("Deleting message with ID:", id);
    try {
      if (!id) return;
      const res = await axios.put(
        "http://localhost:5000/chat/deleteMessageFromMe",
        { messageId: id }, // <-- Correctly pass data here
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );
      console.log("Delete response:", res.data);
      if (res.data.success) {
        setMessages((prev) => prev.filter((msg) => msg._id !== id));
      } else {
        console.error("Error deleting message:", res.data.message);
      }
    } catch (error) {
      console.error("Error deleting message:", error);
    }
  }, []); // Add 'token' to dependencies if you're using it inside

  // Video call functions
  const generateRandomFiveDigitString = () =>
    Math.floor(10000 + Math.random() * 90000).toString();

  const handleVideoCall = (friend) => {
    const roomNum = generateRandomFiveDigitString();
    try {
      socket.emit("room:join", {
        user: userId,
        room: roomNum,
        recUserId: friend._id,
      });
      setShowVideoCall(true);
      console.log("Joining room:", roomNum);
    } catch (error) {
      console.error("Error handling video call:", error);
    }
  };

  const handleIncomingCall = useCallback(({ from, room }) => {
    setCallData({ from, room });
    console.log("Incoming call from:", from, "room:", room);
    setModalVisible(true);
  }, []);

  const userJoinedhandel = useCallback(
    async ({ userId, id }) => {
      setRemoteSocketId(id);
      console.log("user joined:", userId);
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: true,
          video: true,
        });
        const offer = await peer.getOffer();
        socket.emit("user:call", { to: id, offer });
        setMyStream(stream);
      } catch (error) {
        console.error("Error getting user media:", error);
      }
    },
    [socket]
  );

  const handleIncommingCalls = useCallback(
    async ({ from, offer }) => {
      setRemoteSocketId(from);
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: true,
          video: true,
        });
        setMyStream(stream);
        console.log(`Incoming Call`, from, offer);
        const ans = await peer.getAnswer(offer);
        socket.emit("call:accepted", { to: from, ans });
      } catch (error) {
        console.error("Error handling incoming call:", error);
      }
    },
    [socket]
  );

  const sendStreams = useCallback(() => {
    if (myStream) {
      myStream.getTracks().forEach((track) => {
        peer.peer.addTrack(track, myStream);
      });
    }
  }, [myStream]);

  const handleCallAccepted = useCallback(
    ({ from, ans }) => {
      peer.setLocalDescription(ans);
      console.log("Call Accepted!");
      sendStreams();
    },
    [sendStreams]
  );

  const handleNegoNeeded = useCallback(async () => {
    try {
      const offer = await peer.getOffer();
      socket.emit("peer:nego:needed", { offer, to: remoteSocketId });
    } catch (error) {
      console.error("Negotiation error:", error);
    }
  }, [remoteSocketId, socket]);

  const handleNegoNeedIncomming = useCallback(
    async ({ from, offer }) => {
      try {
        const ans = await peer.getAnswer(offer);
        socket.emit("peer:nego:done", { to: from, ans });
      } catch (error) {
        console.error("Negotiation incoming error:", error);
      }
    },
    [socket]
  );

  const handleNegoNeedFinal = useCallback(async ({ ans }) => {
    try {
      await peer.setLocalDescription(ans);
    } catch (error) {
      console.error("Negotiation final error:", error);
    }
  }, []);

  useEffect(() => {
    peer.peer.addEventListener("negotiationneeded", handleNegoNeeded);
    return () => {
      peer.peer.removeEventListener("negotiationneeded", handleNegoNeeded);
    };
  }, [handleNegoNeeded]);

  useEffect(() => {
    const trackHandler = (event) => {
      const remoteStream = event.streams[0];
      console.log("Receiving remote stream!");
      setRemoteStream(remoteStream);
    };

    peer.peer.addEventListener("track", trackHandler);

    return () => {
      peer.peer.removeEventListener("track", trackHandler);
    };
  }, []);

  // Socket event listeners with proper cleanup
  useEffect(() => {
    if (!socket) return;

    socket.on("incoming-call", handleIncomingCall);
    socket.on("user:joined", userJoinedhandel);
    socket.on("incomming:calls", handleIncommingCalls);
    socket.on("call:accepted", handleCallAccepted);
    socket.on("peer:nego:needed", handleNegoNeedIncomming);
    socket.on("peer:nego:final", handleNegoNeedFinal);

    return () => {
      socket.off("incoming-call", handleIncomingCall);
      socket.off("user:joined", userJoinedhandel);
      socket.off("incomming:calls", handleIncommingCalls);
      socket.off("call:accepted", handleCallAccepted);
      socket.off("peer:nego:needed", handleNegoNeedIncomming);
      socket.off("peer:nego:final", handleNegoNeedFinal);
    };
  }, [
    handleCallAccepted,
    handleIncomingCall,
    handleIncommingCalls,
    handleNegoNeedFinal,
    handleNegoNeedIncomming,
    socket,
    userJoinedhandel,
  ]);

  const handleAccept = () => {
    socket.emit("room:join", {
      room: callData.room,
      user: userId,
    });
    setShowVideoCall(true);
    setModalVisible(false);
  };

  const handleReject = () => {
    socket.emit("call:reject", {
      from: callData.from,
    });
    setModalVisible(false);
  };
  const endcall = useCallback(() => {
    if (myStream) {
      myStream.getTracks().forEach((track) => track.stop());
    }

    if (remoteStream) {
      remoteStream.getTracks().forEach((track) => track.stop());
    }
    setMyStream(null);
    setRemoteStream(null);
    setShowVideoCall(false);
  }, [myStream, remoteStream, setMyStream, setRemoteStream, setShowVideoCall]);
  // Cleanup function for ending the call
  const handleDeleteButtonClick = useCallback((messageId) => {
    setMessageToDelete(messageId);
  }, []);
  // Close the delete popup
  const closeDeletePopup = useCallback(() => {
    setMessageToDelete(null);
  }, []);

  const handleDeleteButtonClickReciver = (messageId) => {
    setMessageToDeleteReciever(messageId);
  };
  const closeDeletePopupReciever = useCallback(() => {
    setMessageToDeleteReciever(null);
  }, []);
  const handleReferanceMessage = useCallback((message) => {
    setRefrenceMessage(message.text);
    setRefrenceMessageId(message._id); // Assuming you meant to use message.id here
    setShowReferenceMessagePop(true);
  }, []);
  const handeCloseReferenceMessagePop = useCallback(async () => {
    await setRefrenceMessage(null);
    await setRefrenceMessageId(null);
    setShowReferenceMessagePop(false);
  }, []);

  return (
    <div className="flex h-screen bg-gradient-to-br from-indigo-50 to-purple-50 overflow-hidden">
      {/* Connection status indicator */}
      <div
        className={`fixed top-2 right-2 px-3 py-1 rounded-full text-xs font-medium z-50 ${
          connectionStatus === "connected"
            ? "bg-green-100 text-green-800"
            : connectionStatus === "connecting"
            ? "bg-yellow-100 text-yellow-800"
            : connectionStatus === "error"
            ? "bg-red-100 text-red-800"
            : "bg-gray-100 text-gray-800"
        }`}
      >
        {connectionStatus === "connected"
          ? "Connected"
          : connectionStatus === "connecting"
          ? "Connecting..."
          : connectionStatus === "error"
          ? "Connection Error"
          : "Disconnected"}
      </div>

      {/* Incoming call modal */}
      <IncomingCallModal
        visible={modalVisible}
        from={callData?.from}
        onAccept={handleAccept}
        onReject={handleReject}
      />

      {/* Video Call UI */}
      {showVideoCall && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-xl shadow-lg p-4 w-full max-w-4xl relative">
            <div className="flex flex-col items-center">
              <h2 className="text-xl font-semibold mb-4 text-gray-700">
                Video Call
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full h-96">
                <div className="bg-gray-200 rounded-lg flex flex-col items-center justify-center">
                  <p className="mb-2">You</p>
                  {myStream ? (
                    <ReactPlayer
                      playing
                      muted
                      height="100%"
                      width="100%"
                      url={myStream}
                    />
                  ) : (
                    <p className="text-gray-500">Waiting for your video...</p>
                  )}
                </div>

                <div className="bg-gray-200 rounded-lg flex flex-col items-center justify-center">
                  <p className="mb-2">Remote</p>
                  {remoteStream ? (
                    <ReactPlayer
                      playing
                      height="100%"
                      width="100%"
                      url={remoteStream}
                    />
                  ) : (
                    <p className="text-gray-500">Waiting for remote video...</p>
                  )}
                </div>
              </div>
            </div>
            <div>
              <button
                onClick={() => {
                  endcall();
                }}
                className="absolute top-2 right-2 text-gray-500 hover:text-red-500 line-clamp-1"
              >
                END CALL
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Sidebar */}
      <AnimatePresence>
        {showSidebar && (
          <motion.div
            initial={isMobileView ? { x: -300 } : { x: 0 }}
            animate={{ x: 0 }}
            exit={{ x: -300 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className={`${
              isMobileView ? "absolute z-10 h-full" : "relative"
            } w-80 bg-white shadow-lg flex flex-col`}
          >
            <div className="p-4 border-b border-gray-200 bg-gradient-to-r from-indigo-500 to-purple-600 text-white">
              <div className="flex justify-between items-center">
                <div className="flex items-center space-x-3">
                  <div className="relative">
                    <img
                      src={profileUrl}
                      alt="Your Profile"
                      className="w-10 h-10 rounded-full border-2 border-white"
                    />
                    <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-400 border-2 border-white rounded-full"></span>
                  </div>
                  <h2 className="font-bold">{userName || "Your Name"}</h2>
                </div>
                {isMobileView && (
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => setShowSidebar(false)}
                    className="p-1 rounded-full hover:bg-white hover:bg-opacity-20"
                  >
                    <ArrowLeft size={18} />
                  </motion.button>
                )}
              </div>
            </div>

            <div className="p-4 border-b border-gray-200">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search friends..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full p-2 pl-10 bg-gray-100 border border-transparent rounded-lg focus:outline-none focus:border-indigo-300 focus:bg-white transition-colors"
                />
                <Search
                  className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                  size={18}
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto">
              <div className="p-3 border-b border-gray-200 bg-indigo-50">
                <div className="flex items-center space-x-2">
                  <Users className="h-4 w-4 text-indigo-600" />
                  <h3 className="font-medium text-indigo-700 text-sm">
                    FRIENDS ({filteredFriends.length})
                  </h3>
                </div>
              </div>

              {filteredFriends.length === 0 ? (
                <div className="p-4 text-center text-gray-500">
                  No friends found
                </div>
              ) : (
                <div>
                  {filteredFriends.map((friend) => (
                    <div
                      key={friend._id}
                      onClick={() => getChatMessages(friend)}
                      className={`flex items-center space-x-3 p-3 cursor-pointer hover:bg-indigo-50 transition-colors border-l-4 ${
                        selectedFriend?._id === friend._id
                          ? "border-l-indigo-500 bg-indigo-50"
                          : "border-l-transparent"
                      }`}
                    >
                      <div className="relative">
                        <img
                          src={friend.photo || image}
                          alt={friend.name}
                          className="w-12 h-12 rounded-full object-cover border border-gray-200"
                        />
                        <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-400 border-2 border-white rounded-full"></span>
                      </div>
                      <div className="flex-1">
                        <div className="flex justify-between items-start">
                          <h3 className="font-medium text-gray-800">
                            {friend.name}
                          </h3>
                          <span className="text-xs text-gray-400">
                            12:30 PM
                          </span>
                        </div>
                        <div className="flex justify-between items-end">
                          <p className="text-sm text-gray-500 truncate w-48">
                            {messages.find((m) => m.sender === friend._id)
                              ?.text || "No messages yet"}
                          </p>
                          {countDeliveredMessages(friend._id) > 0 && (
                            <span className="inline-flex items-center justify-center w-5 h-5 text-xs font-bold text-white bg-indigo-500 rounded-full">
                              {countDeliveredMessages(friend._id)}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col relative">
        {selectedFriend ? (
          <>
            <div className="p-4 border-b border-gray-200 bg-white shadow-sm flex justify-between items-center">
              <div className="flex items-center space-x-3">
                {isMobileView && !showSidebar && (
                  <button
                    onClick={() => setShowSidebar(true)}
                    className="p-1 rounded-full text-indigo-600 hover:bg-indigo-50"
                  >
                    <ArrowLeft size={20} />
                  </button>
                )}

                <div className="relative">
                  <img
                    src={selectedFriend.photo || image}
                    alt={selectedFriend.name}
                    className="w-10 h-10 rounded-full object-cover border border-gray-200"
                  />
                  <span className="absolute bottom-0 right-0 w-2 h-2 bg-green-400 border border-white rounded-full"></span>
                </div>
                <div>
                  <h2 className="font-semibold text-gray-800">
                    {selectedFriend.name}
                  </h2>
                  <span className="text-xs text-green-500">Online</span>
                </div>
              </div>

              <button
                onClick={() => handleVideoCall(selectedFriend)}
                className="p-2 rounded-full text-indigo-600 hover:bg-indigo-50 transition"
                title="Start Video Call"
              >
                <Video size={22} />
              </button>
            </div>

            <div
              className="flex-1 overflow-y-auto p-4 space-y-4 bg-gradient-to-br from-indigo-50 to-purple-50"
              id="message-container"
            >
              {messages.map((message, index) => (
                <div
                  key={message._id || index}
                  className={`flex ${
                    message.sender === userId ? "justify-end" : "justify-start"
                  }`}
                >
                  {message.sender !== userId && (
                    <img
                      src={message.resProfileUrl || image}
                      alt={selectedFriend.name}
                      className="w-8 h-8 rounded-full mr-2 self-end mb-2"
                    />
                  )}

                  <div
                    className={`relative max-w-[70%] rounded-2xl p-3 shadow-sm ${
                      message.sender === userId
                        ? "bg-gradient-to-r from-indigo-500 to-purple-600 text-white"
                        : "bg-white text-gray-800"
                    }`}
                  >
                    {message.replyId && (
                      <div
                        className={`mb-2 p-2 rounded-lg border-l-4 ${
                          message.sender === userId
                            ? "bg-indigo-400/20 border-indigo-300 text-indigo-100"
                            : "bg-gray-100 border-gray-400 text-gray-700"
                        }`}
                      >
                        <p className="text-xs font-semibold mb-1">
                          Replying to:
                        </p>
                        <p className="text-sm italic line-clamp-2">
                          {message.replyId}
                        </p>
                      </div>
                    )}
                    <ReactLinkify
                      componentDecorator={(
                        decoratedHref,
                        decoratedText,
                        key
                      ) => (
                        <a
                          target="_blank"
                          rel="noopener noreferrer"
                          href={decoratedHref}
                          key={key}
                          className="text-blue-300 underline hover:text-blue-100"
                        >
                          {decoratedText}
                        </a>
                      )}
                    >
                      <p className="break-words">{message.text}</p>
                    </ReactLinkify>

                    <div className="flex justify-between items-center mt-1">
                      <p
                        className={`text-xs ${
                          message.sender === userId
                            ? "text-indigo-100"
                            : "text-gray-400"
                        }`}
                      >
                        {formatTimestamp(message.timestamp)}
                      </p>
                      {message.sender === userId && (
                        <button
                          onClick={() => handleDeleteButtonClick(message._id)}
                          className="ml-2 text-xs text-red-300 hover:text-red-500"
                          title="Delete message"
                        >
                          <EllipsisVertical size={16} />
                        </button>
                      )}
                      {message.sender != userId && (
                        <button
                          onClick={() =>
                            handleDeleteButtonClickReciver(message._id)
                          }
                          className="ml-2 text-xs text-red-300 hover:text-red-500"
                          title="Delete message"
                        >
                          <EllipsisVertical size={16} />
                        </button>
                      )}

                      {/* Only show DeleteMessage for the specific message */}

                      {messageToDelete === message._id && (
                        <DeleteMessage
                          visible={true}
                          deleteFromMe={() => {
                            alert("Delete for me");
                            handleDeleteFromMe(message._id);
                            closeDeletePopup();
                          }}
                          deleteFromEveryone={() => {
                            alert("Delete for everyone");
                            handleDeleteMessage(message._id);
                            closeDeletePopup();
                          }}
                          onReply={() => {
                            handleReferanceMessage(message);

                            closeDeletePopup();
                          }}
                          onClose={closeDeletePopup}
                          position={{
                            top: "1.5rem",
                            right: message.sender === userId ? "1rem" : "-8rem",
                          }}
                        />
                      )}

                      {messageToDeleteReciever === message._id && (
                        <DeleteMessageReciver
                          visible={true}
                          deleteFromMe={() => {
                            alert("Delete for me");
                            handleDeleteFromMe(message._id);
                            closeDeletePopupReciever();
                          }}
                          onReply={() => {
                            handleReferanceMessage(message);
                            closeDeletePopup();
                          }}
                          onClose={closeDeletePopupReciever}
                          position={{
                            top: "1.5rem",
                            right: message.sender === userId ? "1rem" : "-8rem",
                          }}
                        />
                      )}
                    </div>
                  </div>

                  {message.sender === userId && (
                    <img
                      src={profileUrl || image}
                      alt="You"
                      className="w-8 h-8 rounded-full ml-2 self-end mb-2"
                    />
                  )}
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            <div className="p-4 bg-white border-t border-gray-200 shadow-md">
              {showReferenceMessagePop && refrenceMessage && (
                <div className="mb-3 p-3 rounded-lg bg-indigo-100 dark:bg-indigo-950 text-gray-800 dark:text-gray-100 relative shadow-sm border border-indigo-200 dark:border-indigo-700">
                  <div className="text-sm font-medium leading-snug">
                    {refrenceMessage}
                  </div>
                  <button
                    onClick={handeCloseReferenceMessagePop}
                    className="absolute top-1 right-1 text-gray-500 hover:text-gray-800 dark:hover:text-gray-300 transition-colors"
                    aria-label="Close reference"
                  >
                    <X size={14} />
                  </button>
                </div>
              )}

              <div className="flex items-center space-x-2">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Type a message..."
                  className="flex-1 p-3 bg-gray-100 border border-transparent rounded-full focus:outline-none focus:border-indigo-300 focus:bg-white transition-colors"
                />
                <button
                  onClick={handleSendMessage}
                  disabled={
                    !newMessage.trim() || connectionStatus !== "connected"
                  }
                  className={`p-3 rounded-full shadow-md transition-shadow ${
                    !newMessage.trim() || connectionStatus !== "connected"
                      ? "bg-gray-400 cursor-not-allowed"
                      : "bg-gradient-to-r from-indigo-500 to-purple-600 text-white hover:shadow-lg"
                  }`}
                >
                  <Send className="h-5 w-5" />
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center p-8 rounded-xl bg-white bg-opacity-60 backdrop-blur-sm shadow-lg">
              <div className="w-24 h-24 mx-auto mb-4 flex items-center justify-center">
                <MessageCircle className="h-12 w-12 text-indigo-600" />
              </div>
              <h2 className="text-xl font-bold text-indigo-700 mb-2">
                Start Chatting
              </h2>
              <p className="text-gray-600 max-w-xs mx-auto">
                Select a friend from the list to start a conversation
              </p>

              {isMobileView && !showSidebar && (
                <button
                  onClick={() => setShowSidebar(true)}
                  className="mt-6 px-6 py-2 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-full shadow-md hover:shadow-lg"
                >
                  View Friends List
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Chat;
