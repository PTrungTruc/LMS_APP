import { useState } from "react";
import { MessageCircle, X } from "lucide-react";

export default function BubbleChat() {
  const [open, setOpen] = useState(false);

  return (
    <>
      {/* Floating Bubble */}
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-6 right-6 z-[9999] w-16 h-16 
                   rounded-full bg-blue-600 text-white 
                   shadow-xl flex items-center justify-center 
                   hover:scale-110 transition"
      >
        <MessageCircle size={28} />
      </button>

      {/* Overlay Full Screen */}
      {open && (
        <div className="fixed inset-0 z-[10000] bg-black/40 backdrop-blur-sm flex justify-center items-center">
          
          {/* Close button */}
          <button
            onClick={() => setOpen(false)}
            className="absolute top-6 right-6 bg-white rounded-full p-2 shadow-lg"
          >
            <X />
          </button>

          {/* Web container */}
          <div className="w-[90%] h-[90%] bg-white rounded-0 shadow-2xl overflow-hidden ">
            <iframe
              src="http://localhost:3000/embed_chat"
              title="Chat App"
              className="w-full h-full border-0"
            />
          </div>
        </div>
      )}
    </>
  );
}