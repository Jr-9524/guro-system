import BaseSelect from "../common/BaseSelect";

const SelectFilter = ({ icon: Icon, value, onChange, options }) => (
  <label className="flex items-center gap-2">
    {Icon && <Icon className="h-5 w-5 opacity-60" />}

    <BaseSelect
      value={value}
      onChange={onChange}
      options={options}
      className="select h-full w-full cursor-pointer border border-gray-300 px-2.5 py-2 text-base [&>option]:text-base [&>option]:py-2"
    />
  </label>
);

export default SelectFilter;
