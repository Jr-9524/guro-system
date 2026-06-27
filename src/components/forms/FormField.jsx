import { guroLabel } from "../../styles/guroStyles";

const FormField = ({ label, children, helperText, required = false }) => (
  <fieldset className="w-full">
    <legend className={guroLabel}>{label}{required && <span className="ml-1 text-error">*</span>}</legend>
    {children}
    {helperText && <p className="mt-1.5 text-xs leading-5 text-base-content/55">{helperText}</p>}
  </fieldset>
);
export default FormField;