import { useAuth } from '@/hooks/useAuth';
import { ArrowLeft, Crown, ShieldCheck, Ban, Star, Zap } from 'lucide-react';
import { SEOHead } from '@/components/SEOHead';

const PLANS = [
  { id: '1_week', label: '1 Week', price: '$0.99', period: '/week', popular: false },
  { id: '1_month', label: '1 Month', price: '$1.99', period: '/month', popular: true },
  { id: '3_months', label: '3 Months', price: '$4.99', period: '/3 months', popular: false },
  { id: '1_year', label: '1 Year', price: '$17.99', period: '/year', popular: false },
];

const BENEFITS = [
  { icon: Ban, label: 'No ads on the entire website' },
  { icon: Crown, label: 'VIP badge on your profile & comments' },
  { icon: Star, label: 'VIP role in our Discord server' },
  { icon: Zap, label: 'Priority support via tickets' },
];

export default function VipPage() {
  const { user, isVip } = useAuth();

  return (
    <div className="min-h-screen bg-background">
      <SEOHead
        title="VIP Membership - Ancient Blood"
        description="Get VIP membership for ad-free browsing, exclusive badge, and Discord VIP role."
        canonical="https://ancientblood.online/vip"
      />

      <nav className="border-b border-border sticky top-0 z-50 bg-background/80 backdrop-blur-xl">
        <div className="max-w-5xl mx-auto px-6 h-14 flex items-center">
          <a href="/" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="w-4 h-4" />
            Back to drops
          </a>
        </div>
      </nav>

      <div className="max-w-5xl mx-auto px-6 py-16 text-center">
        <div className="inline-flex items-center gap-2 bg-amber-500/10 text-amber-600 text-xs font-bold px-3 py-1.5 rounded-full mb-6">
          <Crown className="w-3.5 h-3.5" />
          VIP MEMBERSHIP
        </div>
        <h1 className="text-4xl sm:text-5xl font-bold text-foreground mb-4">
          Go <span className="text-amber-500">VIP</span>
        </h1>
        <p className="text-muted-foreground text-lg max-w-lg mx-auto mb-12">
          Enjoy an ad-free experience, stand out with a VIP badge, and get exclusive perks.
        </p>

        {isVip && (
          <div className="mb-10 inline-flex items-center gap-2 bg-amber-500/10 border border-amber-500/20 text-amber-600 font-semibold px-5 py-3 rounded-xl">
            <ShieldCheck className="w-5 h-5" />
            You're a VIP member! Enjoy your perks.
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-16">
          {PLANS.map(plan => (
            <div
              key={plan.id}
              className={`relative bg-card border rounded-2xl p-6 text-center transition-all hover:shadow-lg ${
                plan.popular ? 'border-amber-500 shadow-amber-500/10 shadow-md' : 'border-border'
              }`}
            >
              {plan.popular && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-amber-500 text-white text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                  Most Popular
                </span>
              )}
              <h3 className="text-sm font-semibold text-muted-foreground mb-3">{plan.label}</h3>
              <div className="mb-4">
                <span className="text-3xl font-bold text-foreground">{plan.price}</span>
                <span className="text-sm text-muted-foreground">{plan.period}</span>
              </div>
              <a
                href="#how-to-buy"
                className={`block w-full py-2.5 rounded-xl font-semibold text-sm transition-opacity hover:opacity-90 ${
                  plan.popular
                    ? 'bg-amber-500 text-white'
                    : 'bg-muted text-foreground'
                }`}
              >
                Get VIP
              </a>
            </div>
          ))}
        </div>

        <div className="max-w-md mx-auto mb-16">
          <h2 className="text-xl font-bold text-foreground mb-6">What you get</h2>
          <div className="space-y-4 text-left">
            {BENEFITS.map((benefit, i) => (
              <div key={i} className="flex items-center gap-3 p-3 bg-card border border-border rounded-xl">
                <div className="w-9 h-9 rounded-lg bg-amber-500/10 flex items-center justify-center shrink-0">
                  <benefit.icon className="w-4 h-4 text-amber-500" />
                </div>
                <span className="text-sm font-medium text-foreground">{benefit.label}</span>
              </div>
            ))}
          </div>
        </div>

        <div id="how-to-buy" className="max-w-md mx-auto bg-card border border-border rounded-2xl p-8 text-left">
          <h2 className="text-xl font-bold text-foreground mb-2 flex items-center gap-2">
            <Crown className="w-5 h-5 text-amber-500" />
            How to purchase
          </h2>
          <p className="text-sm text-muted-foreground mb-6">
            VIP is handled manually to keep things simple and affordable. Follow these steps:
          </p>
          <ol className="space-y-4 text-sm text-foreground">
            <li className="flex gap-3">
              <span className="w-6 h-6 rounded-full bg-amber-500/10 text-amber-600 font-bold text-xs flex items-center justify-center shrink-0">1</span>
              <span>Join our Discord server and open a ticket in the <strong>#buy-vip</strong> channel</span>
            </li>
            <li className="flex gap-3">
              <span className="w-6 h-6 rounded-full bg-amber-500/10 text-amber-600 font-bold text-xs flex items-center justify-center shrink-0">2</span>
              <span>Tell us which plan you'd like and your <strong>website username</strong></span>
            </li>
            <li className="flex gap-3">
              <span className="w-6 h-6 rounded-full bg-amber-500/10 text-amber-600 font-bold text-xs flex items-center justify-center shrink-0">3</span>
              <span>We'll share payment methods (PayPal, Crypto, etc.) in the ticket</span>
            </li>
            <li className="flex gap-3">
              <span className="w-6 h-6 rounded-full bg-amber-500/10 text-amber-600 font-bold text-xs flex items-center justify-center shrink-0">4</span>
              <span>Once confirmed, your VIP badge and ad-free experience activate instantly!</span>
            </li>
          </ol>
          <a
            href="https://discord.gg/4ex6ezB79N"
            target="_blank"
            rel="noopener noreferrer"
            data-allow-external="true"
            className="mt-6 block w-full text-center py-3 rounded-xl bg-amber-500 text-white font-semibold text-sm hover:opacity-90 transition-opacity"
          >
            Open Ticket on Discord
          </a>
        </div>
      </div>
    </div>
  );
}
