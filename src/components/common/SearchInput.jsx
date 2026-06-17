import { Search } from "lucide-react";

const SearchInput = ({ value, onChange, placeholder, autoFocus = false }) => (
  <label className="input input-bordered flex items-center gap-2 border border-gray-300">
    <Search className="h-5 w-5 opacity-60" />
    <input
      type="text"
      className="grow"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      autoFocus={autoFocus}
    />
  </label>
);

export default SearchInput;
