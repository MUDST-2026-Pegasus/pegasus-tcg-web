import { Shield } from "lucide-react";
import { useEffect } from "react";

const sections = [
  {
    id: "01",
    title: "Information We Collect",
    content: (
      <p>
        We collect information you provide directly, including your name, email address, shipping address, and payment details. We may also collect device and usage data such as IP address and browser type.
      </p>
    ),
  },
  {
    id: "02",
    title: "How We Use Your Information",
    content: (
      <div className="space-y-2">
        <p>We use your information to:</p>
        <ul className="list-inside space-y-1 text-muted-foreground">
          <li>• Process and fulfill orders</li>
          <li>• Communicate purchase and account updates</li>
          <li>• Improve our services and user experience</li>
          <li>• Prevent fraud and protect system security</li>
        </ul>
      </div>
    ),
  },
  {
    id: "03",
    title: "Information Sharing",
    content: (
      <p>
        We do not sell personal data. We share information only with trusted providers, such as payment gateways and shipping partners, when required to deliver our services.
      </p>
    ),
  },
  {
    id: "04",
    title: "Data Security",
    content: (
      <p>
        We use industry-standard safeguards to protect personal information. No internet transmission or electronic storage method is completely secure, so absolute security cannot be guaranteed.
      </p>
    ),
  },
  {
    id: "05",
    title: "Your Rights",
    content: (
      <p>
        Depending on your location, you may request access to, correction of, or deletion of your personal data. Contact our support team to exercise these rights.
      </p>
    ),
  },
  {
    id: "06",
    title: "Contact Us",
    content: (
      <p>
        Questions about this Privacy Policy? Contact us at support@pegasus-store.com.
      </p>
    ),
  },
];

export function PrivacyPolicyPage() {
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "auto" });
  }, []);

  const handleScrollToSection = (id: string) => {
    const element = document.getElementById(`section-${id}`);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <div className="min-h-screen bg-muted/30 pb-16 pt-8">
      <div className="mx-auto max-w-[1100px] px-6 md:px-12">
        {/* Header */}
        <div className="rounded-xl border border-border/50 bg-background p-8 md:p-10 shadow-sm">
          <div className="flex w-fit items-center gap-2 rounded-md bg-muted px-2.5 py-1 text-xs font-semibold tracking-wider text-foreground">
            <Shield className="size-4" />
            LEGAL CENTER
          </div>
          <h1 className="mt-6 text-4xl font-bold tracking-tight text-foreground md:text-5xl">
            Privacy Policy
          </h1>
          <p className="mt-4 text-lg text-muted-foreground">
            How PEGASUS collects, uses, protects, and respects your personal information.
          </p>
          <div className="mt-8 text-sm text-muted-foreground">
            Last updated <span className="font-semibold text-primary">August 29, 2026</span>
          </div>
        </div>

        {/* Content Section */}
        <div className="mt-6 flex flex-col items-start gap-6 lg:flex-row">
          {/* Sidebar */}
          <aside className="sticky top-24 w-full shrink-0 lg:w-[280px]">
            <div className="rounded-xl border border-border/50 bg-background p-6 shadow-sm">
              <h3 className="font-semibold text-foreground">On this page</h3>
              <ul className="mt-5 space-y-4 text-sm">
                {sections.map((section) => (
                  <li key={section.id}>
                    <button
                      onClick={() => handleScrollToSection(section.id)}
                      className="flex items-center gap-3 text-left transition-colors hover:text-foreground text-muted-foreground data-[active=true]:text-foreground data-[active=true]:font-medium"
                      data-active={section.id === "01"}
                    >
                      <span className="font-semibold text-primary">{section.id}</span>
                      {section.title}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          </aside>

          {/* Main Content */}
          <main className="flex-1 rounded-xl border border-border/50 bg-background p-8 shadow-sm md:p-10">
            <div className="space-y-10">
              {sections.map((section, index) => (
                <div key={section.id} id={`section-${section.id}`}>
                  <h2 className="flex items-center gap-3 text-xl font-bold text-foreground">
                    <span className="text-[15px] font-semibold text-primary">{section.id}</span>
                    {section.title}
                  </h2>
                  <div className="mt-4 leading-relaxed text-muted-foreground">
                    {section.content}
                  </div>
                  {index < sections.length - 1 && (
                    <hr className="mt-10 border-border/60" />
                  )}
                </div>
              ))}
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
