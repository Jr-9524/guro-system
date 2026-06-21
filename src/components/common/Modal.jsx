import { useEffect } from "react";
import { X } from "lucide-react";

const Modal = ({ isOpen, onClose, title, children, size = "md" }) => {
  useEffect(() => {
    const handleEsc = (event) => event.key === "Escape" && onClose();
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [onClose]);
  if (!isOpen) return null;
  const sizes = { sm: "max-w-sm", md: "max-w-md", lg: "max-w-lg", xl: "max-w-xl", "2xl": "max-w-3xl w-[94vw]" };
  return <div className="modal modal-open bg-slate-950/45 backdrop-blur-sm" onClick={onClose}><div className={`modal-box max-h-[92vh] overflow-y-auto rounded-xl border border-base-300 bg-base-100 p-0 shadow-2xl ${sizes[size]}`} onClick={(event) => event.stopPropagation()}><div className="sticky top-0 z-10 flex items-center justify-between border-b border-base-300 bg-base-100 px-5 py-4"><h3 className="text-lg font-bold">{title}</h3><button type="button" onClick={onClose} className="btn btn-ghost btn-sm btn-square" aria-label="Close modal"><X className="h-4 w-4" /></button></div><div className="p-5">{children}</div></div></div>;
};
export default Modal;