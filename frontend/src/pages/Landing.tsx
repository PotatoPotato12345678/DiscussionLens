import { useRef, useState } from "react";
import { AuthPopover } from "@/components/AuthPopover";
import { useNavigate } from "react-router-dom";
import polrityLogo from "@/assets/polrity-logo.svg";

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
      className="flex flex-col min-h-screen"
      style={{ background: "hsl(var(--background))" }}
    >
      {/* Navbar */}
      <nav
        className="flex items-center justify-between px-8 border-b border-border"
        style={{ height: "var(--navbar-h)", background: "hsl(var(--card))" }}
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
      <main className="flex flex-1 flex-col items-center justify-center px-6 text-center gap-8">
        <div className="flex flex-col items-center gap-4 max-w-2xl">
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

