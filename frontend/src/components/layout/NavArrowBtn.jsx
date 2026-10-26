import React, { forwardRef } from "react";

/**
 * Standardized navigation arrow button (Left / Right)
 * Used across Collections, Materials slider, and Notes.
 * direction: "left" | "right"
 */
const NavArrowBtn = forwardRef(({
  direction = "left",
  onClick,
  disabled = false,
  className = "",
  title,
  ariaLabel,
  ...props
}, ref) => {
  const isLeft = direction === "left";

  return (
    <button
      ref={ref}
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={ariaLabel || (isLeft ? "Previous" : "Next")}
      title={title || (isLeft ? "Poprzednie" : "Następne")}
      className={`w-10 h-10 flex-shrink-0 flex items-center justify-center rounded-full bg-white/95 dark:bg-slate-800/95 border border-slate-200/90 dark:border-slate-700 text-slate-750 dark:text-slate-200 hover:bg-white dark:hover:bg-slate-750 hover:text-slate-900 dark:hover:text-white hover:border-slate-350 dark:hover:border-slate-600 shadow-md hover:shadow-lg transition-all duration-200 active:scale-95 disabled:opacity-30 disabled:pointer-events-none cursor-pointer backdrop-blur-sm select-none ${className}`}
      {...props}
    >
      {isLeft ? (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="w-5 h-5"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2.2}
          aria-hidden="true"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
        </svg>
      ) : (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="w-5 h-5"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2.2}
          aria-hidden="true"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
        </svg>
      )}
    </button>
  );
});

NavArrowBtn.displayName = "NavArrowBtn";

export default NavArrowBtn;
