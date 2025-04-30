import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useState, useEffect, useCallback } from "react";

import Navbar from "./components/Navbar";
import Phone from "./components/Phone";
import NavbarUser from "./components/NavbarUser";
import Chat from "./components/Chat";
import News from "./components/News";
import HomePage from "./components/HomePage";
import GroupChat from "./components/GrpupChat";

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(
    () => !!localStorage.getItem("token")
  );

  const checkAuth = useCallback(() => {
    setIsLoggedIn(!!localStorage.getItem("token"));
  }, []);

  useEffect(() => {
    window.addEventListener("storage", checkAuth);
    return () => window.removeEventListener("storage", checkAuth);
  }, [checkAuth]);

  return (
    <BrowserRouter>
      {isLoggedIn ? (
        <NavbarUser setIsLoggedIn={setIsLoggedIn} />
      ) : (
        <Navbar setIsLoggedIn={setIsLoggedIn} />
      )}

      <Routes>
        {isLoggedIn ? (
          <>
            <Route
              path="/home"
              element={<HomePage setIsLoggedIn={setIsLoggedIn} />}
            />
            <Route
              path="/chat"
              element={<Chat setIsLoggedIn={setIsLoggedIn} />}
            />
            <Route
              path="/group-chat"
              element={<GroupChat setIsLoggedIn={setIsLoggedIn} />}
            />
            <Route path="/news*" element={<News />} />
            <Route path="*" element={<Navigate to="/home" replace />} />
          </>
        ) : (
          <>
            <Route path="/" element={<Phone setIsLoggedIn={setIsLoggedIn} />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </>
        )}
      </Routes>
    </BrowserRouter>
  );
}

export default App;
