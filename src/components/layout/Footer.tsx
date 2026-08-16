const FOOTER_COLUMNS = [
  ["Terms of Service", "Privacy Policy"],
  ["Shipping Info", "Authenticity Guarantee"],
  ["Contact Us"],
] as const;

export function Footer() {
  return (
    <footer className="border-t border-border bg-background">
      <div className="mx-auto max-w-[1440px] px-12 py-8">
        <p className="text-xl font-black text-primary">PEGASUS</p>
        <div className="mt-8 grid grid-cols-2 gap-8 sm:grid-cols-4">
          {FOOTER_COLUMNS.map((links) => (
            <div key={links[0]} className="flex flex-col gap-4">
              {links.map((label) => (
                <a
                  key={label}
                  href="#"
                  className="text-sm text-foreground"
                >
                  {label}
                </a>
              ))}
            </div>
          ))}
        </div>
        <div className="mt-8 border-t border-border pt-6 text-center text-[10px] font-semibold text-foreground">
          © 2026 PEGASUS TCG. ALL RIGHTS RESERVED.
        </div>
      </div>
    </footer>
  );
}
