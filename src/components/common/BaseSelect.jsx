const BaseSelect = ({
  value,
  onChange,
  options = [],
  placeholder,
  disabled = false,
  className = "",
}) => (
  <select
    value={value}
    disabled={disabled}
    onChange={(e) => onChange(e.target.value)}
    className={className}
  >
    {placeholder && <option value="">{placeholder}</option>}

    {options.map((option) => {
      const optionValue = typeof option === "object" ? option.value : option;

      const optionLabel = typeof option === "object" ? option.label : option;

      return (
        <option key={optionValue} value={optionValue}>
          {optionLabel}
        </option>
      );
    })}
  </select>
);

export default BaseSelect;
