import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MessageCircle, X, Phone, Users } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

const WA_GREEN = "#25D366";
const PRE_MSG = encodeURIComponent("Hello SunCity FC Management, I have a question regarding...");

const WhatsAppFAB = () => {
  const [open, setOpen] = useState(false);
  const { user } = useAuth();
  const isLoggedIn = !!user;

  return (
    <div className="fixed bottom-20 right-4 z-50 flex flex-col items-end gap-2">
      <AnimatePresence>
        {open && (
          <>
            {/* Coach WhatsApp — always visible */}
            <motion.a
              initial={{ opacity: 0, y: 10, scale: 0.8 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.8 }}
              transition={{ delay: 0.05 }}
              href={`https://wa.me/254753310940?text=${PRE_MSG}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-4 py-2.5 rounded-full shadow-lg text-white text-sm font-body font-medium hover:brightness-110 transition-all"
              style={{ backgroundColor: WA_GREEN }}
            >
              <Phone className="w-4 h-4" /> Coach
            </motion.a>

            {/* Manager WhatsApp — always visible */}
            <motion.a
              initial={{ opacity: 0, y: 10, scale: 0.8 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.8 }}
              transition={{ delay: 0.1 }}
              href={`https://wa.me/254112563036?text=${PRE_MSG}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-4 py-2.5 rounded-full shadow-lg text-white text-sm font-body font-medium hover:brightness-110 transition-all"
              style={{ backgroundColor: WA_GREEN }}
            >
              <Phone className="w-4 h-4" /> Manager
            </motion.a>

            {/* Team Group — only for logged-in members */}
            {isLoggedIn && (
              <motion.a
                initial={{ opacity: 0, y: 10, scale: 0.8 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.8 }}
                transition={{ delay: 0.15 }}
                href="https://chat.whatsapp.com/FF9oZ8H8oXPA1jny5Kacs2"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-4 py-2.5 rounded-full shadow-lg text-white text-sm font-body font-medium hover:brightness-110 transition-all"
                style={{ backgroundColor: WA_GREEN }}
              >
                <Users className="w-4 h-4" /> Team Group
              </motion.a>
            )}
          </>
        )}
      </AnimatePresence>

      {/* Main FAB toggle */}
      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setOpen(!open)}
        className="w-14 h-14 rounded-full shadow-xl flex items-center justify-center text-white transition-all"
        style={{ backgroundColor: WA_GREEN }}
      >
        {open ? <X className="w-6 h-6" /> : <MessageCircle className="w-6 h-6" />}
      </motion.button>
    </div>
  );
};

export default WhatsAppFAB;
