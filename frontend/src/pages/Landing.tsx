import { useRef, useState } from "react";
import { AuthPopover } from "@/components/AuthPopover";
import { useNavigate } from "react-router-dom";
import polrityLogo from "@/assets/polrity-logo.svg";
import { ThemeToggle } from "@/components/ThemeToggle";

// Faint atmosphere rings — background texture
const BUBBLES = [
  { id: 0,  x: 4,   y: 8,   size: 90,  opacity: 0.07, duration: 22, delay: 0,   anim: "float-a", color: "hsl(221 83% 60%)" },
  { id: 1,  x: 72,  y: 6,   size: 62,  opacity: 0.08, duration: 18, delay: 3,   anim: "float-b", color: "hsl(25 95% 53%)"  },
  { id: 2,  x: 84,  y: 38,  size: 130, opacity: 0.05, duration: 26, delay: 1,   anim: "float-c", color: "hsl(142 71% 45%)" },
  { id: 3,  x: 12,  y: 62,  size: 72,  opacity: 0.07, duration: 20, delay: 5,   anim: "float-d", color: "hsl(292 91% 73%)" },
  { id: 4,  x: 48,  y: 82,  size: 56,  opacity: 0.06, duration: 17, delay: 2,   anim: "float-a", color: "hsl(221 83% 60%)" },
  { id: 5,  x: 28,  y: 18,  size: 105, opacity: 0.05, duration: 24, delay: 7,   anim: "float-b", color: "hsl(25 95% 53%)"  },
  { id: 6,  x: 63,  y: 68,  size: 78,  opacity: 0.07, duration: 19, delay: 4,   anim: "float-c", color: "hsl(142 71% 45%)" },
  { id: 7,  x: 88,  y: 78,  size: 52,  opacity: 0.08, duration: 21, delay: 9,   anim: "float-d", color: "hsl(292 91% 73%)" },
  { id: 8,  x: 18,  y: 84,  size: 88,  opacity: 0.05, duration: 23, delay: 6,   anim: "float-a", color: "hsl(221 83% 60%)" },
  { id: 9,  x: 54,  y: 12,  size: 66,  opacity: 0.07, duration: 16, delay: 8,   anim: "float-b", color: "hsl(25 95% 53%)"  },
];

// Named topic bubbles — the product metaphor made visible
// Budget + Timeline orbit each other; others drift solo
const TOPIC_BUBBLES = [
  { id: "t0", label: "Budget",   x: 5,  y: 44, size: 115, hsl: "221 83% 60%", anim: "orbit-pair-a", duration: 14, delay: 0  },
  { id: "t1", label: "Timeline", x: 13, y: 40, size: 115, hsl: "25 95% 53%",  anim: "orbit-pair-b", duration: 14, delay: 0  },
  { id: "t2", label: "Risk",     x: 78, y: 43, size: 100, hsl: "142 71% 45%", anim: "float-a",       duration: 22, delay: 3  },
  { id: "t3", label: "Scope",    x: 70, y: 11, size: 88,  hsl: "292 91% 73%", anim: "float-d",       duration: 20, delay: 5  },
  { id: "t4", label: "Delivery", x: 40, y: 74, size: 88,  hsl: "25 95% 53%",  anim: "float-b",       duration: 18, delay: 7  },
];

export default function Landing() {
  const navigate = useNavigate();

  const [loginOpen, setLoginOpen] = useState(false);
  const [signupOpen, setSignupOpen] = useState(false);

  const loginRef = useRef<HTMLButtonElement>(null);
  const signupRef = useRef<HTMLButtonElement>(null);

  const toggleLogin = () => {
    setLoginOpen((v) => !v);
    setSignupOpen(false);
  };

  const toggleSignup = () => {
    setSignupOpen((v) => !v);
    setLoginOpen(false);
  };

  const onAuthSuccess = () => {
    setLoginOpen(false);
    setSignupOpen(false);
    navigate("/app");
  };

  return (
    <div
      className="flex flex-col min-h-screen relative"
      style={{ background: "hsl(var(--background))" }}
    >
      {/* Floating bubble layer */}
      <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
        {/* Atmosphere rings */}
        {BUBBLES.map((b) => (
          <div
            key={b.id}
            style={{
              position: "absolute",
              left: `${b.x}%`,
              top: `${b.y}%`,
              width: b.size,
              height: b.size,
              borderRadius: "50%",
              border: `1.5px solid ${b.color}`,
              opacity: b.opacity,
              animation: `${b.anim} ${b.duration}s ease-in-out infinite`,
              animationDelay: `${b.delay}s`,
            }}
          />
        ))}

        {/* Named topic bubbles */}
        {TOPIC_BUBBLES.map((b) => (
          <div
            key={b.id}
            style={{
              position: "absolute",
              left: `${b.x}%`,
              top: `${b.y}%`,
              width: b.size,
              height: b.size,
              borderRadius: "50%",
              background: `hsl(${b.hsl} / 0.10)`,
              border: `1.5px solid hsl(${b.hsl} / 0.50)`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              animation: `${b.anim} ${b.duration}s ease-in-out infinite`,
              animationDelay: `${b.delay}s`,
            }}
          >
            <span style={{ color: `hsl(${b.hsl})`, fontSize: "11px", fontWeight: 600, opacity: 0.75, letterSpacing: "0.03em", userSelect: "none" }}>
              {b.label}
            </span>
          </div>
        ))}

        {/* Second trio: Costs + Rollout orbit each other, then the pair drifts toward Impact */}
        <div style={{ position: "absolute", left: "65%", top: "60%", width: 0, height: 0, animation: "group-drift 20s ease-in-out infinite" }}>
          {[
            { label: "Costs",   hsl: "292 91% 73%", left: 0,   top: 0,   anim: "orbit-pair-a", size: 100 },
            { label: "Rollout", hsl: "221 83% 60%", left: 78,  top: -14, anim: "orbit-pair-b", size: 100 },
          ].map((b) => (
            <div key={b.label} style={{
              position: "absolute",
              left: b.left,
              top: b.top,
              width: b.size,
              height: b.size,
              borderRadius: "50%",
              background: `hsl(${b.hsl} / 0.10)`,
              border: `1.5px solid hsl(${b.hsl} / 0.50)`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              animation: `${b.anim} 12s ease-in-out infinite`,
            }}>
              <span style={{ color: `hsl(${b.hsl})`, fontSize: "11px", fontWeight: 600, opacity: 0.75, letterSpacing: "0.03em", userSelect: "none" }}>
                {b.label}
              </span>
            </div>
          ))}
        </div>

        {/* Impact — solo bubble the pair gravitates toward */}
        <div style={{
          position: "absolute",
          left: "83%",
          top: "67%",
          width: 92,
          height: 92,
          borderRadius: "50%",
          background: "hsl(25 95% 53% / 0.10)",
          border: "1.5px solid hsl(25 95% 53% / 0.50)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          animation: "solo-drift 20s ease-in-out infinite",
        }}>
          <span style={{ color: "hsl(25 95% 53%)", fontSize: "11px", fontWeight: 600, opacity: 0.75, letterSpacing: "0.03em", userSelect: "none" }}>
            Impact
          </span>
        </div>
      </div>

      {/* Navbar */}
      <nav
        className="relative z-50 flex items-center justify-between px-8 border-b border-border"
        style={{ height: "var(--navbar-h)", background: "hsl(var(--card) / 0.85)", backdropFilter: "blur(8px)" }}
      >
        {/* Logo */}
        <div className="flex items-center gap-2">
          <img src={polrityLogo} alt="Polarity" className="h-6 w-auto object-contain" />
          <span className="text-sm font-semibold tracking-tight text-foreground">
            Polarity
          </span>
        </div>

        {/* Auth buttons */}
        <div className="flex items-center gap-3 relative">
          <ThemeToggle />
          {/* Login */}
          <div className="relative">
            <button
              ref={loginRef}
              onClick={toggleLogin}
              className="rounded-md px-4 py-1.5 text-sm font-medium border border-border text-foreground hover:bg-accent active:scale-[0.97] transition-all"
            >
              Log in
            </button>
            <AuthPopover
              mode="login"
              open={loginOpen}
              onClose={() => setLoginOpen(false)}
              onSuccess={onAuthSuccess}
              anchorRef={loginRef}
            />
          </div>

          {/* Sign up */}
          <div className="relative">
            <button
              ref={signupRef}
              onClick={toggleSignup}
              className="rounded-md px-4 py-1.5 text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 active:scale-[0.97] transition-all"
            >
              Create account
            </button>
            <AuthPopover
              mode="signup"
              open={signupOpen}
              onClose={() => setSignupOpen(false)}
              onSuccess={onAuthSuccess}
              anchorRef={signupRef}
            />
          </div>
        </div>
      </nav>

      {/* Hero */}
      <main className="relative z-10 flex flex-1 flex-col items-center justify-center px-6 text-center gap-8">
        {/* Radial vignette — keeps text readable as bubbles drift behind */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: "radial-gradient(ellipse 55% 65% at 50% 50%, hsl(var(--background) / 0.82) 0%, transparent 100%)",
          }}
        />

        <div className="relative flex flex-col items-center gap-4 max-w-2xl">
          <h2 className="text-5xl font-extrabold tracking-tight text-foreground">
            Polarity
          </h2>
          <img
            src={polrityLogo}
            alt="Polarity"
            className="h-14 w-auto object-contain"
            style={{ filter: "drop-shadow(0 0 28px hsl(var(--primary) / 0.45))" }}
          />
          <h1 className="text-2xl font-bold tracking-tight text-foreground leading-snug mt-2" style={{ textWrap: "balance" }}>
            Meetings don't fail from lack of information — they fail from hidden disagreement.
          </h1>
          <p className="text-base text-muted-foreground leading-relaxed max-w-xl" style={{ textWrap: "pretty" }}>
            Polarity captures not just what was said, but who thinks what.
            Visualize perspectives, uncover misalignment, and make better decisions with confidence.
          </p>
          <button
            onClick={toggleSignup}
            className="mt-2 rounded-md px-6 py-2.5 text-sm font-semibold bg-primary text-primary-foreground hover:bg-primary/90 active:scale-[0.98] transition-all"
          >
            Get started
          </button>
        </div>
      </main>
    </div>
  );
}
