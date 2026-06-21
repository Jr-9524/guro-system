import Select from "react-select";
import CreatableSelect from "react-select/creatable";
import FormField from "./FormField";

const DEFAULT_HELPER = "Select an option or type to add a custom one.";

const normalizeOption = (option) => {
  if (typeof option === "string") return { value: option, label: option };
  const value = option?.value ?? option?.label ?? "";
  return {
    ...option,
    value: String(value),
    label: option?.label ?? String(value),
  };
};

const normalizeValues = (value, isMulti) => {
  if (isMulti) {
    if (Array.isArray(value)) return value.filter(Boolean).map(String);
    return value ? [String(value)] : [];
  }
  if (Array.isArray(value)) return value[0] ? String(value[0]) : "";
  return value ? String(value) : "";
};

const CreatableSelectInput = ({
  label,
  value,
  onChange,
  options = [],
  placeholder = "Select or type...",
  helperText = DEFAULT_HELPER,
  isMulti = false,
  allowCreate = true,
  closeMenuOnSelect = !isMulti,
  required = false,
  disabled = false,
  error,
  className = "",
  styles,
  isClearable = true,
}) => {
  const selectOptions = options
    .map(normalizeOption)
    .filter((option) => option.value);
  const normalizedValue = normalizeValues(value, isMulti);
  const toSelectedOption = (item) =>
    selectOptions.find((option) => option.value === item) || {
      value: item,
      label: item,
    };
  const selectedValue = isMulti
    ? normalizedValue.map(toSelectedOption)
    : normalizedValue
      ? toSelectedOption(normalizedValue)
      : null;

  const themeStyles = {
    control: (base, state) => ({
      ...base,
      minHeight: "2.75rem",
      borderRadius: "0.75rem",
      borderColor: error
        ? "var(--color-error)"
        : state.isFocused
          ? "var(--color-primary)"
          : "var(--color-base-300)",
      backgroundColor: "var(--color-base-100)",
      color: "var(--color-base-content)",
      boxShadow: state.isFocused
        ? "0 0 0 3px color-mix(in srgb, var(--color-primary) 18%, transparent)"
        : "none",
      "&:hover": { borderColor: "var(--color-primary)" },
    }),
    input: (base) => ({ ...base, color: "var(--color-base-content)" }),
    singleValue: (base) => ({
      ...base,
      color: "var(--color-base-content)",
      fontWeight: 600,
    }),
    menu: (base) => ({
      ...base,
      zIndex: 40,
      border: "1px solid var(--color-base-300)",
      backgroundColor: "var(--color-base-100)",
    }),
    menuList: (base) => ({ ...base, padding: "0.25rem" }),
    option: (base, state) => ({
      ...base,
      borderRadius: "0.5rem",
      backgroundColor: state.isSelected
        ? "var(--color-primary)"
        : state.isFocused
          ? "var(--color-base-200)"
          : "var(--color-base-100)",
      color: state.isSelected
        ? "var(--color-primary-content)"
        : "var(--color-base-content)",
    }),
    multiValue: (base) => ({
      ...base,
      borderRadius: "0.5rem",
      backgroundColor: "var(--color-primary)",
    }),
    multiValueLabel: (base) => ({
      ...base,
      padding: "0.2rem 0.35rem",
      color: "var(--color-primary-content)",
      fontWeight: 600,
    }),
    multiValueRemove: (base) => ({
      ...base,
      color: "var(--color-primary-content)",
      "&:hover": {
        backgroundColor: "color-mix(in srgb, var(--color-primary) 72%, black)",
        color: "var(--color-primary-content)",
      },
    }),
    ...styles,
  };

  const SelectComponent = allowCreate ? CreatableSelect : Select;

  return (
    <FormField
      label={label}
      helperText={error ? undefined : helperText}
      required={required}
    >
      <SelectComponent
        className={className}
        styles={themeStyles}
        isMulti={isMulti}
        closeMenuOnSelect={closeMenuOnSelect}
        hideSelectedOptions={false}
        isDisabled={disabled}
        isClearable={isClearable}
        options={selectOptions}
        value={selectedValue}
        onChange={(selected) =>
          onChange(
            isMulti
              ? (selected || []).map((option) => String(option.value))
              : selected
                ? String(selected.value)
                : "",
          )
        }
        placeholder={placeholder}
        formatCreateLabel={(inputValue) => "Add: " + inputValue}
      />
      {error && <p className="mt-1.5 text-xs text-base-content">{error}</p>}
    </FormField>
  );
};

export default CreatableSelectInput;