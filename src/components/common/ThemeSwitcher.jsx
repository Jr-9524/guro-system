import { Moon, Sun } from "lucide-react";
import useThemeStore from "../../stores/themeStore";

const ThemeSwitcher = () => {
  const { currentTheme, setTheme } = useThemeStore();
  const isDark = currentTheme === "dark";

  return (
    <label className="swap swap-rotate btn btn-ghost btn-sm btn-square">
      <input
        type="checkbox"
        className="theme-controller"
        value="dark"
        checked={isDark}
        onChange={(event) => setTheme(event.target.checked ? "dark" : "light")}
        aria-label="Toggle dark mode"
      />

      <Sun className="swap-off h-5 w-5" />
      <Moon className="swap-on h-5 w-5" />
    </label>
  );
};

export default ThemeSwitcher;
