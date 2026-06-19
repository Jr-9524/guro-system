import { Moon, Palette, Sun } from "lucide-react";
import useThemeStore from "../../stores/themeStore";
import { themeOptions } from "../../styles/themes";

const ThemeSwitcher = () => {
  const { currentTheme, setTheme } = useThemeStore();
  const currentIndex = themeOptions.findIndex(({ id }) => id === currentTheme);
  const currentOption = themeOptions[currentIndex] || themeOptions[0];
  const nextOption = themeOptions[(currentIndex + 1) % themeOptions.length];
  const Icon = currentOption.mode === "dark" ? Moon : Sun;

  return (
    <button
      type="button"
      className="btn btn-ghost btn-sm btn-square rounded-xl"
      onClick={() => setTheme(nextOption.id)}
      aria-label={`Use ${nextOption.label} theme`}
      title={`Theme: ${currentOption.label}`}
    >
      <span className="relative">
        <Palette className="h-5 w-5" />
        <Icon className="absolute -bottom-1 -right-1 h-3 w-3 rounded-full bg-base-100" />
      </span>
    </button>
  );
};

export default ThemeSwitcher;
