// src/components/common/Input.jsx - Updated with daisyUI
import { forwardRef } from "react";

const Input = forwardRef(
  (
    {
      label,
      error,
      helperText,
      icon: Icon,
      className = "",
      wrapperClassName = "",
      ...props
    },
    ref,
  ) => {
    return (
      <div className={`form-control w-full ${wrapperClassName}`}>
        {label && (
          <label className="font-bold">
            <span className="label-text mb-2">
              {label}
              {props.required && <span className="text-error ml-1">*</span>}
            </span>
          </label>
        )}

        <div className="relative">
          {Icon && (
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Icon className="h-5 w-5 text-base-content/40" />
            </div>
          )}

          <input
            ref={ref}
            className={`
            input input-bordered w-full p-2  border border-gray-300 focus:border-default focus:outline-none
            ${error ? "input-error" : ""}
            ${Icon ? "pl-10" : ""}
            ${className}
          `}
            {...props}
          />
        </div>

        {error && (
          <label className="label">
            <span className="label-text-alt text-error">{error}</span>
          </label>
        )}

        {helperText && !error && (
          <label className="label">
            <span className="label-text-alt text-base-content/60">
              {helperText}
            </span>
          </label>
        )}
      </div>
    );
  },
);

Input.displayName = "Input";
export default Input;
