import FormField from "./FormField";
import { guroInput } from "../../styles/guroStyles";

const TextAreaInput = ({ label, value, onChange, placeholder = "", rows = 3, required = false, helperText }) => (
  <FormField label={label} required={required} helperText={helperText}>
    <textarea className={`${guroInput} min-h-24 resize-y leading-6`} rows={rows} value={value} placeholder={placeholder} required={required} onChange={(event) => onChange(event.target.value)} />
  </FormField>
);
export default TextAreaInput;