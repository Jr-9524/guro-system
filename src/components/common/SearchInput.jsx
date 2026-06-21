import { Search } from "lucide-react";
import { guroInput } from "../../styles/guroStyles";

const SearchInput = ({ value, onChange, placeholder, autoFocus = false }) => (
  <label className="relative block w-full">
    <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-base-content/45" />
    <input
      type="search"
      className={`${guroInput} pl-10`}
      value={value}
      onChange={(event) => onChange(event.target.value)}
      placeholder={placeholder}
      autoFocus={autoFocus}
    />
  </label>
);
export default SearchInput;
