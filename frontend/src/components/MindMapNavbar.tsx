import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { LogOut, Crown } from "lucide-react";
import polrityLogo from "@/assets/polrity-logo.svg";

interface MeetingInfo {
  meeting: { title: string };
  speakers: string[];
  colorMap: Record<string, string>;
}

interface Props {
  allColorMaps: Record<string, string>;
  meetings: MeetingInfo[];
}

export function MindMapNavbar({ allColorMaps, meetings }: Props) {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  // Collect unique speakers across all active meetings
  const allSpeakers = meetings.flatMap((m) => m.speakers);
  const uniqueSpeakers = Array.from(new Set(allSpeakers));

  return (
    <nav
      className="flex items-center justify-between px-6 border-b border-border"
      style={{ height: "var(--navbar-h)", background: "hsl(var(--card))" }}
    >
      {/* Logo */}
      <div className="flex items-center gap-2">
        <img src={polrityLogo} alt="Polarity" className="h-5 w-auto object-contain" />
        <span className="text-sm font-semibold tracking-tight text-foreground">
          Polarity
        </span>
      </div>

      {/* Speaker legend */}
      <div className="flex items-center gap-5 overflow-hidden">
        {uniqueSpeakers.map((name) => (
          <div key={name} className="flex items-center gap-1.5 shrink-0">
            <span
              className="inline-block rounded-full"
              style={{
                width: 8,
                height: 8,
                background: allColorMaps[name] ?? "#888",
                boxShadow: `0 0 6px 1px ${allColorMaps[name] ?? "#888"}88`,
              }}
            />
            <span className="text-xs text-muted-foreground font-medium truncate max-w-[120px]">{name}</span>
          </div>
        ))}
      </div>

      {/* User + logout */}
      <div className="flex items-center gap-3">
        {user && (
          <span className="text-xs text-muted-foreground hidden sm:block">
            {user.user_metadata?.username ?? user.email?.split("@")[0]}
          </span>
        )}
        <button
          onClick={handleSignOut}
          title="Sign out"
          className="flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs text-muted-foreground border border-border hover:text-foreground hover:bg-accent active:scale-95 transition-all"
        >
          <LogOut size={13} />
          <span>Sign out</span>
        </button>
        <button
          className="flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold bg-primary text-primary-foreground hover:bg-primary/90 active:scale-95 transition-all"
        >
          <Crown size={12} />
          Upgrade
        </button>
      </div>
    </nav>
  );
}
