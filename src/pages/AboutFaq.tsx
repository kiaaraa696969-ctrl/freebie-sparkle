import { SEOHead } from '@/components/SEOHead';
import { HelpCircle, Users, ArrowLeft } from 'lucide-react';

export default function AboutFaq() {
  return (
    <div className="min-h-screen bg-background">
      <SEOHead
        title="About Us & FAQ — Ancient Blood"
        description="Learn about Ancient Blood and find answers to frequently asked questions about free premium account drops."
        canonical="https://ancientblood.online/about"
      />

      <nav className="border-b border-border sticky top-0 z-50 bg-background/80 backdrop-blur-xl">
        <div className="max-w-3xl mx-auto px-6 h-14 flex items-center">
          <a href="/" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="w-4 h-4" />
            Back to Home
          </a>
        </div>
      </nav>

      <div className="max-w-3xl mx-auto px-6 py-16 space-y-16">
        {/* About Us */}
        <section>
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2.5 rounded-xl bg-primary/10">
              <Users className="w-5 h-5 text-primary" />
            </div>
            <h1 className="text-2xl font-bold text-foreground">About Us</h1>
          </div>
          <div className="space-y-4 text-muted-foreground leading-relaxed">
            <p>
              <span className="font-semibold text-foreground">Ancient Blood</span> is a community-based website
              that allows users to find and gain access to shared premium accounts/drops in one place. The idea
              behind the creation of the website was to help users who are not always financially capable of
              affording the luxuries of premium services — including gaming, streaming, music, and more — due
              to financial limitations.
            </p>
            <p>
              The website was founded by <span className="font-semibold text-foreground">Brave</span> (Founder)
              in 2022. After operating the website for a while, the owner decided to take a break in 2023.
              However, the owner decided to restart the website with the motivation to continue working on the
              website for the community in 2024.
            </p>
            <p>
              You may be wondering why we provide these free accounts. Our website collects various external
              sources for the accounts we share with the public. Our intention is to share the accounts with
              the community as easily as possible. Therefore, we do not take any responsibility for the source
              or the future availability of the accounts.
            </p>
            <p>
              In order to keep the site running, we make a small amount of money from advertisements and other
              services like that. It's not a lot of money, but it's enough to keep us afloat.
            </p>
            <p>
              We would like to thank everyone in the community who supports us and helps us grow as a community. ❤️
            </p>
          </div>
        </section>

        {/* FAQ */}
        <section>
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2.5 rounded-xl bg-primary/10">
              <HelpCircle className="w-5 h-5 text-primary" />
            </div>
            <h2 className="text-2xl font-bold text-foreground">Frequently Asked Questions</h2>
          </div>
          <div className="space-y-4">
            {FAQ_ITEMS.map((item, i) => (
              <details
                key={i}
                className="group bg-card border border-border rounded-xl overflow-hidden"
              >
                <summary className="px-5 py-4 cursor-pointer text-sm font-semibold text-foreground hover:bg-muted/50 transition-colors list-none flex items-center justify-between">
                  {item.q}
                  <span className="text-muted-foreground group-open:rotate-45 transition-transform text-lg">+</span>
                </summary>
                <div className="px-5 pb-4 text-sm text-muted-foreground leading-relaxed border-t border-border pt-3">
                  {item.a}
                </div>
              </details>
            ))}
          </div>
        </section>
      </div>

      <footer className="border-t border-border py-8">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <p className="text-sm text-muted-foreground">
            <span className="font-semibold text-foreground">Ancient Blood</span> · New accounts every day
          </p>
        </div>
      </footer>
    </div>
  );
}

const FAQ_ITEMS = [
  {
    q: 'Are these accounts permanent?',
    a: 'No, the accounts we share are temporary. Their duration depends on how responsibly users access them. Some accounts can last 6–7 months, even up to a year. We also drop new accounts daily to ensure availability.',
  },
  {
    q: 'Can I change the email or password?',
    a: 'No. Do not try to change any login information. These are shared accounts. Changing credentials will result in a ban.',
  },
  {
    q: "What do I do if the login isn't working?",
    a: "First, double-check that you copied the username and password correctly. If it's still not working, the account might already be in use or changed. Wait for the next drop — we provide new accounts regularly.",
  },
  {
    q: 'Why does it say "too many login attempts" or "suspicious activity"?',
    a: 'This usually means multiple users are trying to access the account at once. Wait 5–10 minutes and try again later.',
  },
  {
    q: 'Why do I see a "Something went wrong" message?',
    a: "If you see a \"Something went wrong\" message pop up, don't worry! That doesn't mean the account isn't working. The account is fine, but too many people are trying to access it at the same time, which is why the error is showing. Just be patient and try again later.",
  },
  {
    q: 'Can I use the same account on mobile and PC?',
    a: 'Yes, but make sure you are not logged in simultaneously on multiple devices. This can trigger verification or logout issues.',
  },
  {
    q: 'Do you drop accounts daily?',
    a: "Yes, we drop new accounts every day in different categories. Stay active in the server and turn on notifications so you don't miss them.",
  },
  {
    q: 'How can I support the server?',
    a: 'You can support us by staying active, inviting friends, and sharing positive feedback. Monetization from the website also helps us maintain regular drops. You can also support through crypto.',
  },
  {
    q: "Steam Guard is on or it's asking for a code. What should I do?",
    a: "We can't do anything at the moment. Please wait for a new account. And kindly stay away from enabling Steam Guard.",
  },
];
