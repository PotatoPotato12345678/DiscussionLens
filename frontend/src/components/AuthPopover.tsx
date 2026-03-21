import { useState, useRef, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

type Mode = "login" | "signup";

interface Props {
  mode: Mode;
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  anchorRef: React.RefObject<HTMLButtonElement>;
}

export function AuthPopover({ mode, open, onClose, onSuccess, anchorRef }: Props) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const popRef = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (
        popRef.current && !popRef.current.contains(e.target as Node) &&
        anchorRef.current && !anchorRef.current.contains(e.target as Node)
      ) {
        onClose();
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open, onClose, anchorRef]);

  if (!open) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (mode === "login") {
        // Login uses username as email (username@app.local convention)
        const { error: err } = await supabase.auth.signInWithPassword({
          email: `${username}@mindmap.app`,
          password,
        });
        if (err) throw err;
      } else {
        const { error: err } = await supabase.auth.signUp({
          email: `${username}@mindmap.app`,
          password,
          options: { data: { username } },
        });
        if (err) throw err;
      }
      onSuccess();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const isLogin = mode === "login";

  return (
    <div
      ref={popRef}
      className="absolute right-0 top-full mt-2 z-50"
      style={{ minWidth: 260 }}
    >
      {/* Arrow */}
      <div className="flex justify-end pr-4">
        <div
          style={{
            width: 0,
            height: 0,
            borderLeft: "8px solid transparent",
            borderRight: "8px solid transparent",
            borderBottom: "8px solid hsl(var(--border))",
          }}
        />
      </div>

      <div
        className="rounded-xl border border-border shadow-xl p-5"
        style={{ background: "hsl(var(--card))" }}
      >
        <p className="text-sm font-semibold text-foreground mb-4">
          {isLogin ? "Sign in" : "Create account"}
        </p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <div className="flex flex-col gap-1">
            <label className="text-xs text-muted-foreground">Username</label>
            <input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="your_username"
              required
              autoComplete="username"
              className="rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs text-muted-foreground">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              autoComplete={isLogin ? "current-password" : "new-password"}
              className="rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>

          {error && (
            <p className="text-xs text-destructive leading-snug">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="mt-1 rounded-md px-4 py-2 text-sm font-medium text-primary-foreground bg-primary hover:bg-primary/90 active:scale-[0.98] transition-all disabled:opacity-50"
          >
            {loading ? "…" : isLogin ? "Log in" : "Create account"}
          </button>
        </form>
      </div>
    </div>
  );
}
