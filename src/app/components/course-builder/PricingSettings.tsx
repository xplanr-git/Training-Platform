import { Lightbulb } from 'lucide-react';

interface PricingSettingsData {
  pricingModel: string;
  price: number;
  currency: string;
  discountEnabled: boolean;
  discountPrice: number;
  showCompareAt?: boolean;
  compareAtPrice?: number;
  showEnrollExtended?: boolean;
}

interface PricingSettingsProps {
  settings: PricingSettingsData;
  onUpdate: (settings: PricingSettingsData) => void;
}

const CURRENCIES = [
  { code: 'USD', label: 'US$' },
  { code: 'AUD', label: 'A$' },
  { code: 'EUR', label: '€' },
  { code: 'GBP', label: '£' },
  { code: 'CAD', label: 'C$' },
  { code: 'NZD', label: 'NZ$' },
];

const getCurrencyLabel = (code: string) =>
  CURRENCIES.find(c => c.code === code)?.label ?? code;

// Shared two-column section wrapper
function Section({ children }: { children: React.ReactNode }) {
  return (
    <div className="p-6 grid grid-cols-2 gap-10 items-start">
      {children}
    </div>
  );
}

function SectionLabel({ title, description, children }: {
  title: string;
  description: string;
  children?: React.ReactNode;
}) {
  return (
    <div>
      <h3 className="font-semibold text-gray-900 mb-1">{title}</h3>
      <p className="text-sm text-gray-500 leading-relaxed">{description}</p>
      {children}
    </div>
  );
}

export function PricingSettings({ settings, onUpdate }: PricingSettingsProps) {
  const isFree = settings.pricingModel === 'free';
  const currencyLabel = getCurrencyLabel(settings.currency);

  return (
    <div className="max-w-3xl mx-auto bg-white rounded-lg border border-gray-200 divide-y divide-gray-200">

      {/* ── Course Price ─────────────────────────────── */}
      <Section>
        <SectionLabel
          title="Course price"
          description="Set the current price for this course."
        >
          <div className="flex items-start gap-2 mt-3 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2.5">
            <Lightbulb className="size-4 text-amber-500 shrink-0 mt-0.5" />
            <p className="text-xs text-amber-700 leading-snug">
              Offers always apply to the actual price of a course.
            </p>
          </div>
        </SectionLabel>

        <div className="space-y-4">
          {/* Pricing model */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
              Pricing Model
            </label>
            <select
              value={settings.pricingModel}
              onChange={e => onUpdate({ ...settings, pricingModel: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 focus:border-transparent"
            >
              <option value="free">Free</option>
              <option value="paid">Paid (One-time payment)</option>
              <option value="subscription">Subscription</option>
            </select>
          </div>

          {/* Price input — only when not free */}
          {!isFree && (
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                Set a price
              </label>
              <div className="flex rounded-lg overflow-hidden border border-gray-300 focus-within:ring-2 focus-within:ring-teal-500">
                <select
                  value={settings.currency}
                  onChange={e => onUpdate({ ...settings, currency: e.target.value })}
                  className="px-3 py-2 bg-gray-50 border-r border-gray-300 text-sm text-gray-700 focus:outline-none"
                >
                  {CURRENCIES.map(c => (
                    <option key={c.code} value={c.code}>{c.label}</option>
                  ))}
                </select>
                <input
                  type="number"
                  min={0}
                  step={0.01}
                  value={settings.price}
                  onChange={e => onUpdate({ ...settings, price: parseFloat(e.target.value) || 0 })}
                  className="flex-1 px-3 py-2 text-sm focus:outline-none bg-white"
                />
              </div>
            </div>
          )}
        </div>
      </Section>

      {/* ── Compare-at price ─────────────────────────── */}
      {!isFree && (
        <Section>
          <SectionLabel
            title="Compare-at price"
            description="An optional reference price displayed alongside the course price."
          />

          <div className="space-y-3">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={settings.showCompareAt ?? false}
                onChange={e => onUpdate({ ...settings, showCompareAt: e.target.checked })}
                className="rounded border-gray-300 text-teal-600 focus:ring-teal-500"
              />
              <span className="text-sm text-gray-700">Show a compare-at price</span>
            </label>

            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                Set a compare-at price
              </label>
              <div className={`flex rounded-lg overflow-hidden border transition-colors ${
                settings.showCompareAt
                  ? 'border-gray-300 focus-within:ring-2 focus-within:ring-teal-500'
                  : 'border-gray-200 bg-gray-50 opacity-50 pointer-events-none'
              }`}>
                <span className="px-3 py-2 bg-gray-50 border-r border-gray-300 text-sm text-gray-600 whitespace-nowrap">
                  {currencyLabel}
                </span>
                <input
                  type="number"
                  min={0}
                  step={0.01}
                  disabled={!settings.showCompareAt}
                  value={settings.compareAtPrice ?? 0}
                  onChange={e => onUpdate({ ...settings, compareAtPrice: parseFloat(e.target.value) || 0 })}
                  className="flex-1 px-3 py-2 text-sm focus:outline-none bg-white disabled:bg-gray-50 disabled:text-gray-400"
                />
              </div>
            </div>
          </div>
        </Section>
      )}

      {/* ── Enroll Button ────────────────────────────── */}
      <Section>
        <SectionLabel
          title="Enroll Button"
          description={`Select the display of the "Enroll/Buy" button. Show a simple button or an extended menu presenting all payment options for the course.`}
        />

        <label className="flex items-start gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={settings.showEnrollExtended ?? false}
            onChange={e => onUpdate({ ...settings, showEnrollExtended: e.target.checked })}
            className="mt-0.5 rounded border-gray-300 text-teal-600 focus:ring-teal-500"
          />
          <span className="text-sm text-gray-700">
            Show extended menu with all payment options for the course
          </span>
        </label>
      </Section>

      {/* ── Related learning programs ─────────────────── */}
      <Section>
        <SectionLabel
          title="Related learning programs"
          description="The course is also offered in these learning programs."
        />

        <div className="space-y-3">
          <p className="text-sm text-gray-400 italic">
            The course is not offered through programs yet
          </p>
          <button className="px-4 py-2 bg-teal-600 text-white text-sm font-medium rounded-lg hover:bg-teal-700 transition-colors">
            Manage programs
          </button>
        </div>
      </Section>

      {/* ── Related offers ───────────────────────────── */}
      <Section>
        <SectionLabel
          title="Related offers"
          description="This product is available with these offers."
        />

        <div className="space-y-3">
          <p className="text-sm text-gray-400 italic">No related offers yet</p>
          <button className="px-4 py-2 bg-teal-600 text-white text-sm font-medium rounded-lg hover:bg-teal-700 transition-colors">
            Manage offers
          </button>
        </div>
      </Section>

    </div>
  );
}
