import FormField from "./FormField";

const TextAreaInput = ({
  label,
  value,
  onChange,
  placeholder = "",
  rows = 3,
  required = false,
}) => (
  <FormField label={label}>
    <textarea
      className="textarea w-full border border-gray-300 text-base px-2.5 py-2"
      rows={rows}
      value={value}
      placeholder={placeholder}
      required={required}
      onChange={(event) => onChange(event.target.value)}
    />
  </FormField>
);

export default TextAreaInput;
