import CreatableSelect from "react-select/creatable";
import FormField from "./FormField";

const CreatableSelectInput = ({
  label,
  value,
  onChange,
  options = [],
  placeholder = "Select or type...",
  styles,
  className = "",
  isClearable = true,
}) => {
  const selectOptions = options.map((option) => ({
    value: option,
    label: option,
  }));

  return (
    <FormField label={label}>
      <CreatableSelect
        className={className}
        styles={styles}
        isClearable={isClearable}
        options={selectOptions}
        value={
          value
            ? {
                value,
                label: value,
              }
            : null
        }
        onChange={(opt) => onChange(opt ? opt.value : "")}
        onCreateOption={onChange}
        placeholder={placeholder}
      />
    </FormField>
  );
};

export default CreatableSelectInput;
