import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { MoreHorizontal } from "lucide-react";
import Tooltip from "./Tooltip";

const ActionMenu = ({
  items,
  label = "More actions",
  className = "",
  menuClassName = "",
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    if (!isOpen) return undefined;

    const closeOnOutsideClick = (event) => {
      if (!menuRef.current?.contains(event.target)) setIsOpen(false);
    };
    const closeOnEscape = (event) => {
      if (event.key === "Escape") setIsOpen(false);
    };

    document.addEventListener("pointerdown", closeOnOutsideClick);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("pointerdown", closeOnOutsideClick);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [isOpen]);

  return (
    <div ref={menuRef} className={"relative inline-flex " + className}>
      <Tooltip label={label} position="left" disabled={isOpen}>
        <button
          type="button"
          className="btn btn-ghost btn-sm btn-square rounded-xl border border-base-300 text-base-content/70 hover:bg-base-200 hover:text-base-content"
          aria-label={label}
          aria-expanded={isOpen}
          aria-haspopup="menu"
          onClick={() => setIsOpen((open) => !open)}
        >
          <MoreHorizontal className="h-4 w-4" aria-hidden="true" />
        </button>
      </Tooltip>
      {isOpen && (
        <ul
          role="menu"
          className={"menu absolute right-0 top-full z-30 mt-1 w-48 rounded-xl border border-base-300 bg-base-100 p-1.5 text-sm text-base-content shadow-xl " + menuClassName}
        >
          {items.map(
            ({
              id,
              label: itemLabel,
              icon: Icon,
              to,
              onClick,
              danger = false,
              disabled = false,
            }) => {
              const content = (
                <>
                  {Icon && (
                    <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
                  )}
                  <span className="min-w-0 flex-1">{itemLabel}</span>
                </>
              );
              const itemClass =
                "flex w-full items-center justify-start gap-2 rounded-lg px-3 py-2 text-left " +
                (danger
                  ? "text-error hover:bg-error/10"
                  : "text-base-content hover:bg-base-200");

              return (
                <li key={id || itemLabel} role="none" className="w-full">
                  {to ? (
                    <Link
                      to={to}
                      className={itemClass}
                      role="menuitem"
                      onClick={() => setIsOpen(false)}
                      aria-disabled={disabled || undefined}
                    >
                      {content}
                    </Link>
                  ) : (
                    <button
                      type="button"
                      className={itemClass}
                      role="menuitem"
                      disabled={disabled}
                      onClick={() => {
                        setIsOpen(false);
                        onClick?.();
                      }}
                    >
                      {content}
                    </button>
                  )}
                </li>
              );
            },
          )}
        </ul>
      )}
    </div>
  );
};

export default ActionMenu;
