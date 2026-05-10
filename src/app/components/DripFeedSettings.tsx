import { useState } from 'react';
import { Clock } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/app/components/ui/popover';
import { Switch } from '@/app/components/ui/switch';
import { Label } from '@/app/components/ui/label';
import { Button } from '@/app/components/ui/button';

export function DripFeedSettings() {
  const [enabled, setEnabled] = useState(false);
  const [mode, setMode] = useState('date');
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <button className="flex items-center gap-2 px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
          <Clock className="size-4" />
          Drip Feed
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-[90vw] sm:w-[600px] p-6" align="start">
        <div className="flex flex-col sm:flex-row gap-4 sm:gap-8">
          <div className="w-full sm:w-1/3 shrink-0">
            <h3 className="font-semibold text-gray-900 mb-2">Drip feed</h3>
            <p className="text-sm text-gray-500 leading-relaxed">
              An elegant alternative for expressing "scheduled lesson delivery". Schedule the timely release of your content, setup email reminders.
            </p>
          </div>
          <div className="flex-1 space-y-6">
            <div className="flex items-center gap-3">
              <Switch 
                checked={enabled} 
                onCheckedChange={setEnabled} 
                id="drip-feed-toggle"
                className="data-[state=checked]:bg-[#009689]"
              />
              <Label htmlFor="drip-feed-toggle" className="text-sm font-medium text-gray-700">
                {enabled ? 'ON' : 'OFF'}
              </Label>
            </div>

            <div className={`space-y-4 ${enabled ? '' : 'opacity-50 pointer-events-none'}`}>
              <div 
                className="flex items-start gap-3 cursor-pointer group" 
                onClick={() => enabled && setMode('date')}
              >
                <div className={`flex items-center justify-center w-6 h-6 shrink-0 rounded-full border-2 transition-colors ${
                  mode === 'date' 
                    ? 'border-[#009689]' 
                    : 'border-gray-300 group-hover:border-gray-400'
                }`}>
                  {mode === 'date' && (
                    <div className="w-3 h-3 rounded-full bg-[#009689]" />
                  )}
                </div>
                <div className="space-y-1">
                  <Label className={`text-sm font-medium cursor-pointer ${mode === 'date' ? 'text-[#009689]' : 'text-gray-900'}`}>Drip by date</Label>
                  <p className="text-xs text-gray-500 leading-relaxed cursor-pointer">
                    You can unlock course contents on specific dates regardless of the time students enrolled. All students will acquire access to the learning material at the same time.
                  </p>
                </div>
              </div>

              <div 
                className="flex items-start gap-3 cursor-pointer group"
                onClick={() => enabled && setMode('days')}
              >
                <div className={`flex items-center justify-center w-6 h-6 shrink-0 rounded-full border-2 transition-colors ${
                  mode === 'days' 
                    ? 'border-[#009689]' 
                    : 'border-gray-300 group-hover:border-gray-400'
                }`}>
                  {mode === 'days' && (
                    <div className="w-3 h-3 rounded-full bg-[#009689]" />
                  )}
                </div>
                <div className="space-y-1">
                  <Label className={`text-sm font-medium cursor-pointer ${mode === 'days' ? 'text-[#009689]' : 'text-gray-900'}`}>Drip by days</Label>
                  <p className="text-xs text-gray-500 leading-relaxed cursor-pointer">
                    Unlock course contents based on the date the student enrolled in the course (e.g. 1 week, 2 weeks). Each student will get access to the learning material separately.
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <Button 
                onClick={() => setIsOpen(false)}
                className="bg-[#009689] hover:bg-[#009689]/90 text-white min-w-[80px]"
              >
                Save
              </Button>
              <Button 
                variant="outline" 
                onClick={() => setIsOpen(false)} 
                className="text-[#009689] border-[#009689] hover:bg-[#009689]/10 min-w-[80px]"
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
