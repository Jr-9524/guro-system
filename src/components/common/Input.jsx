import { forwardRef } from "react";
import { guroInput, guroLabel } from "../../styles/guroStyles";

const Input = forwardRef(
  ({ label, error, helperText, icon: Icon, className = "", wrapperClassName = "", ...props }, ref) => (
    <div className={`w-full ${wrapperClassName}`}>
      {label && <label className={guroLabel}>{label}{props.required && <span className="ml-1 text-base-content">*</span>}</label>}
      <div className="relative">
        {Icon && <Icon className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-base-content/40" />}
        <input ref={ref} className={`${guroInput} ${error ? "border-error focus:border-error focus:ring-error/10" : ""} ${Icon ? "pl-10" : ""} ${className}`} {...props} />
      </div>
      {error ? <p className="mt-1.5 text-xs font-medium text-base-content">{error}</p> : helperText && <p className="mt-1.5 text-xs leading-5 text-base-content/55">{helperText}</p>}
    </div>
  ),
);
Input.displayName = "Input";
export default Input;