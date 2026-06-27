import FormField from "./FormField";
import BaseSelect from "../common/BaseSelect";
import { guroInput } from "../../styles/guroStyles";

const SelectInput = ({
  label,
  value,
  onChange,
  options = [],
  placeholder,
  helperText,
  error,
  required = false,
  disabled = false,
}) => (
  <FormField
    label={label}
    helperText={!error ? helperText : undefined}
    required={required}
  >
    <BaseSelect
      value={value}
      onChange={onChange}
      options={options}
      placeholder={placeholder}
      disabled={disabled}
      className={`${guroInput} cursor-pointer ${error ? "border-error" : ""}`}
    />
    {error && <p className="mt-1.5 text-xs font-medium text-error">{error}</p>}
  </FormField>
);
export default SelectInput;
