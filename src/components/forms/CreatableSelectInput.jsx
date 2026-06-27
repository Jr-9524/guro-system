import Select from "react-select";
import CreatableSelect from "react-select/creatable";
import { X } from "lucide-react";
import FormField from "./FormField";

const DEFAULT_HELPER = "Select an option or type a custom value.";

const normalizeOption = (option) => {
  if (typeof option === "string") return { value: option, label: option };
  const value = option?.value ?? option?.label ?? "";
  return {
    ...option,
    value: String(value),
    label: option?.label ?? String(value),
  };
};

const normalizeValue = (value) => {
  if (value && typeof value === "object") {
    return String(value.value ?? value.label ?? "");
  }
  return value ? String(value) : "";
};

const normalizeValues = (value, isMulti) => {
  if (isMulti) {
    if (Array.isArray(value)) return value.map(normalizeValue).filter(Boolean);
    const normalized = normalizeValue(value);
    return normalized ? [normalized] : [];
  }
  if (Array.isArray(value)) return normalizeValue(value[0]);
  return normalizeValue(value);
};

const CreatableSelectInput = ({
  label,
  value,
  onChange,
  options = [],
  placeholder = "Select or type to add",
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
  displaySelectedAsList = false,
  menuPortalTarget =
    typeof document !== "undefined" ? document.body : undefined,
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
      borderRadius: "0.25rem",
      borderColor: error
        ? "var(--color-error)"
        : state.isFocused
          ? "var(--color-primary)"
          : "var(--color-base-300)",
      backgroundColor: "var(--color-base-100)",
      color: "var(--color-base-content)",
      boxShadow: "none",
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
    menuPortal: (base) => ({ ...base, zIndex: 9999 }),
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
        classNamePrefix="guro-creatable-select"
        styles={themeStyles}
        isMulti={isMulti}
        closeMenuOnSelect={closeMenuOnSelect}
        hideSelectedOptions={false}
        isDisabled={disabled}
        isClearable={isClearable}
        options={selectOptions}
        value={selectedValue}
        controlShouldRenderValue={!displaySelectedAsList}
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
        menuPortalTarget={menuPortalTarget}
        menuPosition={menuPortalTarget ? "fixed" : "absolute"}
        formatCreateLabel={(inputValue) => "Add: " + inputValue}
      />
      {isMulti && displaySelectedAsList && normalizedValue.length > 0 && (
        <div className="mt-3 overflow-hidden rounded-xl border border-base-300 bg-base-100">
          <div className="flex items-center justify-between border-b border-base-300 bg-base-200/60 px-3 py-2">
            <span className="text-xs font-semibold uppercase tracking-wide text-base-content/60">
              Selected items
            </span>
            <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary">
              {normalizedValue.length}
            </span>
          </div>
          <ul className="grid max-h-56 grid-cols-1 gap-2 overflow-y-auto p-2 sm:grid-cols-2">
            {normalizedValue.map((item) => {
              const itemLabel = toSelectedOption(item).label;

              return (
                <li
                  key={item}
                  className="flex min-w-0 items-start justify-between gap-2 rounded-lg border border-base-300 bg-base-100 px-3 py-2 shadow-sm"
                >
                  <span className="min-w-0 break-words text-sm leading-5 text-base-content">
                    {itemLabel}
                  </span>
                  <button
                    type="button"
                    className="btn btn-ghost btn-circle btn-xs shrink-0 text-base-content/55 hover:bg-error/10 hover:text-error"
                    onClick={() =>
                      onChange(normalizedValue.filter((value) => value !== item))
                    }
                    aria-label={"Remove " + itemLabel}
                    title={"Remove " + itemLabel}
                  >
                    <X size={14} aria-hidden="true" />
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      )}
      {error && <p className="mt-1.5 text-xs font-medium text-error">{error}</p>}
    </FormField>
  );
};

export default CreatableSelectInput;
