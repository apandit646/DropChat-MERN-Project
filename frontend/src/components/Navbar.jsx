import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Menu, X, MessageCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const Navbar = ({ setIsLoggedIn }) => {
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();

  // Close dropdown when clicking outside

  const handleLogout = () => {
    // Add your logout logic here
    localStorage.removeItem("token");
    if (setIsLoggedIn) {
      setIsLoggedIn(false);
    }
    navigate("/login");
  };

  return (
    <motion.nav
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ type: "spring", stiffness: 120, damping: 20 }}
      className="bg-gradient-to-r from-indigo-600 via-violet-600 to-purple-600 text-white shadow-lg"
    >
      <div className="container mx-auto">
        <div className="relative">
          {/* Decorative curved shapes */}
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute -left-20 -top-20 w-64 h-64 rounded-full bg-white opacity-5"></div>
            <div className="absolute right-20 top-10 w-32 h-32 rounded-full bg-white opacity-5"></div>
            <div className="absolute left-1/4 -bottom-10 w-48 h-48 rounded-full bg-white opacity-5"></div>
          </div>

          {/* Main Navigation Content */}
          <div className="relative flex justify-between items-center p-4">
            <Link to="/" className="flex items-center group">
              <motion.div
                whileHover={{ rotate: 15 }}
                transition={{ type: "spring", stiffness: 400, damping: 10 }}
              >
                <MessageCircle
                  size={32}
                  className="mr-2 text-white group-hover:text-pink-300 transition-colors duration-300"
                />
              </motion.div>
              <span className="hidden md:inline text-2xl font-bold bg-gradient-to-r from-white to-purple-200 bg-clip-text text-transparent">
                DropChat
              </span>
            </Link>

            {/* Mobile Menu Button */}
            <div className="md:hidden">
              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={() => setIsOpen(!isOpen)}
                className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors duration-300"
              >
                {isOpen ? <X size={24} /> : <Menu size={24} />}
              </motion.button>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden md:flex md:items-center md:space-x-1"></div>
          </div>
        </div>
      </div>

      {/* Mobile Navigation Menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="md:hidden bg-purple-700/80 backdrop-blur-sm overflow-hidden"
          >
            <div className="p-3">
              <div className="mt-4 border-t border-white/10 pt-2">
                <div
                  onClick={handleLogout}
                  className="flex items-center py-3 px-2 rounded-lg hover:bg-white/10 transition-colors duration-300 cursor-pointer"
                >
                  <span className="w-8 text-center">🚪</span>
                  <span className="ml-2">Logout</span>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.nav>
  );
};

export default Navbar;
