import { Link } from "react-router-dom";

const FOOTER_LINKS = [
  [
    { label: "Terms of Service", href: "/terms-of-service" },
    { label: "Privacy Policy", href: "/privacy-policy" },
  ],
  [
    { label: "Shipping Info", href: "/about" },
    { label: "Authenticity Guarantee", href: "/about" },
  ],
  [
    { label: "Contact Us", href: "/about" },
  ],
] as const;

export function Footer() {
  return (
    <footer className="border-t border-border bg-background">
      <div className="mx-auto max-w-[1440px] px-12 py-8">
        <p className="text-xl font-black text-primary">PEGASUS</p>
        <div className="mt-8 grid grid-cols-2 gap-8 sm:grid-cols-4">
          {FOOTER_LINKS.map((column, idx) => (
            <div key={idx} className="flex flex-col gap-4">
              {column.map((link) => (
                <Link
                  key={link.label}
                  to={link.href}
                  className="text-sm text-foreground transition-colors hover:text-primary"
                >
                  {link.label}
                </Link>
              ))}
            </div>
          ))}
        </div>
        <div className="mt-8 border-t border-border pt-6 text-center text-[10px] font-semibold text-foreground">
          &copy; 2026 PEGASUS TCG. ALL RIGHTS RESERVED.
        </div>
      </div>
    </footer>
  );
}
