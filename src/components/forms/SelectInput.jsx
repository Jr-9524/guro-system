import FormField from "./FormField";
import BaseSelect from "../common/BaseSelect";

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
}) => {
  return (
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
        className={`select h-full w-full cursor-pointer border border-gray-300 px-2.5 py-2 text-base [&>option]:text-base [&>option]:py-2 ${
          error ? "select-error" : ""
        }`}
      />
      {error && <span className="label text-sm text-error">{error}</span>}
    </FormField>
  );
};

export default SelectInput;
