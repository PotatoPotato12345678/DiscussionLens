import { useTheme } from "next-themes";
import { Sun, Moon } from "lucide-react";

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  return (
    <button
      onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
      title="Toggle theme"
      className="flex items-center justify-center rounded-md p-1.5 text-muted-foreground border border-border hover:text-foreground hover:bg-accent active:scale-95 transition-all"
    >
      {theme === "dark" ? <Sun size={14} /> : <Moon size={14} />}
    </button>
  );
}
