import React from 'react';

interface PricingSettings {
  pricingModel: string;
  price: number;
  currency: string;
  discountEnabled: boolean;
  discountPrice: number;
}

interface PricingSettingsProps {
  settings: PricingSettings;
  onUpdate: (settings: PricingSettings) => void;
}

export function PricingSettings({ settings, onUpdate }: PricingSettingsProps) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Pricing Options</h3>
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Pricing Model</label>
          <select
            value={settings.pricingModel}
            onChange={(e) => onUpdate({...settings, pricingModel: e.target.value})}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
          >
            <option value="free">Free</option>
            <option value="paid">Paid (One-time payment)</option>
            <option value="subscription">Subscription</option>
          </select>
        </div>
        
        {settings.pricingModel !== 'free' && (
          <>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Price</label>
                <input
                  type="number"
                  value={settings.price}
                  onChange={(e) => onUpdate({...settings, price: parseFloat(e.target.value)})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Currency</label>
                <select
                  value={settings.currency}
                  onChange={(e) => onUpdate({...settings, currency: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                >
                  <option value="USD">USD ($)</option>
                  <option value="EUR">EUR (€)</option>
                  <option value="GBP">GBP (£)</option>
                </select>
              </div>
            </div>
            
            <div>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={settings.discountEnabled}
                  onChange={(e) => onUpdate({...settings, discountEnabled: e.target.checked})}
                  className="rounded"
                />
                <span className="text-sm text-gray-700">Enable discount pricing</span>
              </label>
            </div>
            
            {settings.discountEnabled && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Discounted Price</label>
                <input
                  type="number"
                  value={settings.discountPrice}
                  onChange={(e) => onUpdate({...settings, discountPrice: parseFloat(e.target.value)})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                />
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}