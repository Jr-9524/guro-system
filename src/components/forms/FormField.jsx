const FormField = ({ label, children, helperText, required = false }) => (
  <fieldset className="fieldset w-full">
    <legend className="fieldset-legend text-sm font-medium mb-1.5 ">
      {label}
      {required && <span className="text-error ml-1">*</span>}
    </legend>

    {children}

    {helperText && <span className="label text-sm">{helperText}</span>}
  </fieldset>
);

export default FormField;
