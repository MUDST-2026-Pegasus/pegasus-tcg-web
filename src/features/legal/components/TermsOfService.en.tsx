import { useLegalScrollSpy } from "../use-legal-scroll-spy";

interface TermsSection {
  id: string;
  title: string;
  content: string;
  rules?: string[];
}

const sections: TermsSection[] = [
  {
    id: "01",
    title: "Introduction",
    content: "Welcome to PEGASUS. By accessing or using our website, you agree to these Terms of Service. If you do not agree to these terms, you may not access the website or use our services.",
  },
  {
    id: "02",
    title: "Accounts and Registration",
    content: "Some features require an account. You are responsible for keeping your account credentials confidential and for all activity that occurs under your account.",
  },
  {
    id: "03",
    title: "Products and Pricing",
    content: "Products are subject to availability. We may update prices, discontinue products, or cancel orders affected by pricing errors. Shipping fees and duties are excluded unless stated otherwise.",
  },
  {
    id: "04",
    title: "Payment and Billing",
    content: "By providing a payment method, you confirm that you are authorized to use it. Transactions are handled securely by third-party payment processors.",
  },
  {
    id: "05",
    title: "Shipping and Returns",
    content: "Delivery timelines are estimates and are not guaranteed. If you are not satisfied with a purchase, review our Return Policy for refund and exchange eligibility.",
  },
  {
    id: "06",
    title: "Auctions",
    content: "Auctions on PEGASUS follow these rules:",
    rules: [
      "Bids cannot be withdrawn. You confirm every bid before it is placed.",
      "Extended bidding: a bid in the last 2 minutes resets the timer to 2 minutes, with no limit on extensions.",
      "Buy now: the seller can turn it on or change its price until the first bid. After that, the Buy now option is removed.",
      "The winner must pay within 24 hours through the regular checkout, at the winning price.",
      "If the winner does not pay in time, the order and the auction are cancelled, the card returns to the seller's stock, and the winner receives one non-payment strike.",
      "Three non-payment strikes ban the user from bidding for 30 days. Regular purchases are still allowed.",
    ],
  },
  {
    id: "07",
    title: "Limitation of Liability",
    content: "PEGASUS is not liable for indirect, incidental, or consequential damages arising from use of our services or products purchased through the platform.",
  },
  {
    id: "08",
    title: "Governing Language",
    content: "These Terms of Service are prepared in both Thai and English. In the event of any inconsistency or conflict between the Thai and English versions, the Thai version shall prevail.",
  },
];

const sectionIds = sections.map((s) => s.id);

export function TermsOfServiceEn() {
  const { activeId, handleScrollToSection } = useLegalScrollSpy(sectionIds);

  return (
    <div className="mt-6 flex flex-col items-start gap-6 lg:flex-row">
      {/* Sidebar */}
      <aside className="sticky top-24 w-full shrink-0 lg:w-[280px]">
        <div className="rounded-xl border border-border/50 bg-background p-6 shadow-sm">
          <h3 className="font-semibold text-foreground">On this page</h3>
          <ul className="mt-5 space-y-4 text-sm">
            {sections.map((section) => (
              <li key={section.id}>
                <button
                  type="button"
                  onClick={() => handleScrollToSection(section.id)}
                  className="flex items-center gap-3 text-left transition-colors hover:text-foreground text-muted-foreground data-[active=true]:text-foreground data-[active=true]:font-medium"
                  data-active={section.id === activeId}
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
            <div key={section.id} id={`section-${section.id}`} className="scroll-mt-24">
              <h2 className="flex items-center gap-3 text-xl font-bold text-foreground">
                <span className="text-[15px] font-semibold text-primary">{section.id}</span>
                {section.title}
              </h2>
              <p className="mt-4 leading-relaxed text-muted-foreground">
                {section.content}
              </p>
              {section.rules ? (
                <ol className="mt-3 list-decimal space-y-1.5 pl-5 leading-relaxed text-muted-foreground">
                  {section.rules.map((rule) => (
                    <li key={rule}>{rule}</li>
                  ))}
                </ol>
              ) : null}
              {index < sections.length - 1 && (
                <hr className="mt-10 border-border/60" />
              )}
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}

export default TermsOfServiceEn;
