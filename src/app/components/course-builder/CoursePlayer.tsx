import React from 'react';
import { Save, Info, ChevronRight } from 'lucide-react';
import { CoursePlayerSettings, SkinId, defaultPlayerSettings } from './coursePlayerSettings';

// ─── Mini CSS skin preview mockups ───────────────────────────────────────────

function SkinPreviewColoured({ large = false }: { large?: boolean }) {
  const sw = large ? 110 : 38;
  return (
    <div className="bg-gray-100 rounded overflow-hidden border border-gray-200 flex h-full w-full">
      <div className="bg-teal-600 flex flex-col flex-shrink-0" style={{ width: sw }}>
        <div className="bg-teal-700 px-1 py-1">
          <div className="bg-white/30 rounded mb-0.5" style={{ height: 4, width: '75%' }} />
          <div className="bg-white/20 rounded" style={{ height: 3, width: '50%' }} />
        </div>
        <div className="flex gap-1 px-1 py-0.5 border-b border-teal-500">
          {['Path', 'Disc'].map(t => (
            <span key={t} className="text-white/80" style={{ fontSize: large ? 7 : 4 }}>{t}</span>
          ))}
        </div>
        <div className="flex-1 overflow-hidden px-1 py-0.5 space-y-0.5">
          {Array.from({ length: large ? 6 : 4 }).map((_, i) => (
            <div key={i} className={`rounded flex items-center gap-0.5 px-0.5 py-0.5 ${i === 0 ? 'bg-white/20' : ''}`}>
              <div className="rounded-full bg-white/50 flex-shrink-0" style={{ width: large ? 5 : 3, height: large ? 5 : 3 }} />
              <div className="bg-white/40 rounded flex-1" style={{ height: large ? 4 : 2 }} />
            </div>
          ))}
        </div>
      </div>
      <div className="flex-1 flex flex-col bg-white min-w-0">
        <div className="bg-gray-800 flex-1 relative">
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="rounded-full bg-white/20 flex items-center justify-center" style={{ width: large ? 22 : 9, height: large ? 22 : 9 }}>
              <div className="border-transparent border-l-white border-solid" style={{ borderWidth: large ? '5px 0 5px 9px' : '2px 0 2px 4px', marginLeft: large ? 2 : 1 }} />
            </div>
          </div>
        </div>
        {large && (
          <div className="flex justify-between px-2 py-1 border-t border-gray-200">
            <div className="bg-gray-200 rounded" style={{ height: 10, width: 48 }} />
            <div className="bg-teal-500 rounded" style={{ height: 10, width: 48 }} />
          </div>
        )}
      </div>
    </div>
  );
}

function SkinPreviewClassic({ large = false }: { large?: boolean }) {
  const sw = large ? 110 : 38;
  return (
    <div className="bg-gray-100 rounded overflow-hidden border border-gray-200 flex h-full w-full">
      <div className="bg-gray-900 flex flex-col flex-shrink-0" style={{ width: sw }}>
        <div className="bg-gray-800 px-1 py-1">
          <div className="bg-white/20 rounded mb-0.5" style={{ height: 4, width: '75%' }} />
        </div>
        <div className="flex-1 overflow-hidden px-1 py-0.5 space-y-0.5">
          {Array.from({ length: large ? 6 : 4 }).map((_, i) => (
            <div key={i} className="rounded flex items-center gap-0.5 px-0.5 py-0.5">
              <div className="rounded-full bg-white/30 flex-shrink-0" style={{ width: large ? 5 : 3, height: large ? 5 : 3 }} />
              <div className="bg-white/20 rounded flex-1" style={{ height: large ? 4 : 2 }} />
            </div>
          ))}
        </div>
      </div>
      <div className="flex-1 flex flex-col bg-white min-w-0">
        <div className="bg-gray-700 flex-1 relative">
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="rounded-full bg-white/20 flex items-center justify-center" style={{ width: large ? 22 : 9, height: large ? 22 : 9 }}>
              <div className="border-transparent border-l-white border-solid" style={{ borderWidth: large ? '5px 0 5px 9px' : '2px 0 2px 4px', marginLeft: large ? 2 : 1 }} />
            </div>
          </div>
        </div>
        {large && (
          <div className="flex justify-between px-2 py-1 border-t border-gray-200">
            <div className="bg-gray-200 rounded" style={{ height: 10, width: 48 }} />
            <div className="bg-gray-800 rounded" style={{ height: 10, width: 48 }} />
          </div>
        )}
      </div>
    </div>
  );
}

function SkinPreviewMinimal({ large = false }: { large?: boolean }) {
  const sw = large ? 110 : 38;
  return (
    <div className="bg-white rounded overflow-hidden border border-gray-200 flex h-full w-full">
      <div className="bg-gray-50 border-r border-gray-200 flex flex-col flex-shrink-0" style={{ width: sw }}>
        <div className="border-b border-gray-200 px-1 py-1">
          <div className="bg-gray-300 rounded" style={{ height: 4, width: '75%' }} />
        </div>
        <div className="flex-1 overflow-hidden px-1 py-0.5 space-y-0.5">
          {Array.from({ length: large ? 6 : 4 }).map((_, i) => (
            <div key={i} className="rounded flex items-center gap-0.5 px-0.5 py-0.5">
              <div className="rounded-full bg-gray-300 flex-shrink-0" style={{ width: large ? 5 : 3, height: large ? 5 : 3 }} />
              <div className="bg-gray-200 rounded flex-1" style={{ height: large ? 4 : 2 }} />
            </div>
          ))}
        </div>
      </div>
      <div className="flex-1 flex flex-col bg-white min-w-0">
        <div className="bg-gray-200 flex-1 relative">
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="rounded-full bg-gray-400/40 flex items-center justify-center" style={{ width: large ? 22 : 9, height: large ? 22 : 9 }}>
              <div className="border-transparent border-l-gray-600 border-solid" style={{ borderWidth: large ? '5px 0 5px 9px' : '2px 0 2px 4px', marginLeft: large ? 2 : 1 }} />
            </div>
          </div>
        </div>
        {large && (
          <div className="flex justify-between px-2 py-1 border-t border-gray-200">
            <div className="bg-gray-200 rounded" style={{ height: 10, width: 48 }} />
            <div className="bg-gray-400 rounded" style={{ height: 10, width: 48 }} />
          </div>
        )}
      </div>
    </div>
  );
}

function SkinPreviewOneActivityMinimal({ large = false }: { large?: boolean }) {
  return (
    <div className="bg-white rounded overflow-hidden border border-gray-200 flex flex-col h-full w-full">
      <div className="bg-gray-100 border-b border-gray-200 flex items-center gap-1 px-1 py-0.5">
        <div className="bg-gray-300 rounded flex-1" style={{ height: 5 }} />
        <div className="bg-gray-300 rounded" style={{ height: 5, width: 20 }} />
      </div>
      <div className="flex-1 bg-gray-200 relative">
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="rounded-full bg-gray-400/40 flex items-center justify-center" style={{ width: large ? 22 : 9, height: large ? 22 : 9 }}>
            <div className="border-transparent border-l-gray-600 border-solid" style={{ borderWidth: large ? '5px 0 5px 9px' : '2px 0 2px 4px', marginLeft: large ? 2 : 1 }} />
          </div>
        </div>
      </div>
      {large && (
        <div className="flex justify-between px-2 py-1 border-t border-gray-200">
          <div className="bg-gray-200 rounded" style={{ height: 10, width: 48 }} />
          <div className="bg-gray-400 rounded" style={{ height: 10, width: 48 }} />
        </div>
      )}
    </div>
  );
}

function SkinPreviewOneActivityDark({ large = false }: { large?: boolean }) {
  return (
    <div className="bg-gray-900 rounded overflow-hidden border border-gray-700 flex flex-col h-full w-full">
      <div className="bg-gray-800 border-b border-gray-700 flex items-center gap-1 px-1 py-0.5">
        <div className="bg-gray-600 rounded flex-1" style={{ height: 5 }} />
        <div className="bg-gray-600 rounded" style={{ height: 5, width: 20 }} />
      </div>
      <div className="flex-1 bg-gray-700 relative">
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="rounded-full bg-white/20 flex items-center justify-center" style={{ width: large ? 22 : 9, height: large ? 22 : 9 }}>
            <div className="border-transparent border-l-white border-solid" style={{ borderWidth: large ? '5px 0 5px 9px' : '2px 0 2px 4px', marginLeft: large ? 2 : 1 }} />
          </div>
        </div>
      </div>
      {large && (
        <div className="flex justify-between px-2 py-1 border-t border-gray-700">
          <div className="bg-gray-700 rounded" style={{ height: 10, width: 48 }} />
          <div className="bg-gray-500 rounded" style={{ height: 10, width: 48 }} />
        </div>
      )}
    </div>
  );
}

const SKIN_PREVIEWS: Record<SkinId, React.ComponentType<{ large?: boolean }>> = {
  'coloured-minimal': SkinPreviewColoured,
  'classic': SkinPreviewClassic,
  'minimal': SkinPreviewMinimal,
  'one-activity-minimal': SkinPreviewOneActivityMinimal,
  'one-activity-dark': SkinPreviewOneActivityDark,
};

const SKIN_LABELS: Record<SkinId, string> = {
  'coloured-minimal': 'Coloured Minimal',
  'classic': 'Classic',
  'minimal': 'Minimal',
  'one-activity-minimal': 'Course with one activity - Minimal',
  'one-activity-dark': 'Course with one activity - Dark',
};

const SKIN_ORDER: SkinId[] = ['coloured-minimal', 'classic', 'minimal', 'one-activity-minimal', 'one-activity-dark'];

// ─── Reusable layout pieces ──────────────────────────────────────────────────

function SeeWhatChanging() {
  return (
    <button className="flex items-center gap-0.5 text-teal-600 text-sm mt-1.5 hover:underline">
      <ChevronRight className="size-3" />
      See what you are changing
    </button>
  );
}

function SettingCheckbox({
  checked, onChange, label, description, seeWhat = true, disabled = false,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
  description?: string;
  seeWhat?: boolean;
  disabled?: boolean;
}) {
  return (
    <div className={`mb-5 ${disabled ? 'opacity-40' : ''}`}>
      <label className="flex items-start gap-2 cursor-pointer select-none">
        <input
          type="checkbox"
          checked={checked}
          disabled={disabled}
          onChange={e => onChange(e.target.checked)}
          className="mt-0.5 rounded border-gray-300 text-teal-600 focus:ring-teal-500"
        />
        <span className="font-medium text-gray-800 text-sm leading-snug">{label}</span>
      </label>
      {description && <p className="text-sm text-gray-500 mt-1 ml-5 leading-relaxed">{description}</p>}
      {seeWhat && <div className="ml-5"><SeeWhatChanging /></div>}
    </div>
  );
}

function SettingRadio({
  value, current, onChange, label, description, disabled = false, children,
}: {
  value: string;
  current: string;
  onChange: (v: string) => void;
  label: string;
  description?: string;
  disabled?: boolean;
  children?: React.ReactNode;
}) {
  return (
    <div className={`mb-3 ${disabled ? 'opacity-40' : ''}`}>
      <label className="flex items-start gap-2 cursor-pointer select-none">
        <input
          type="radio"
          checked={current === value}
          disabled={disabled}
          onChange={() => { if (!disabled) onChange(value); }}
          className="mt-0.5 text-teal-600 focus:ring-teal-500"
        />
        <span className={`text-sm leading-snug ${current === value ? 'font-semibold text-gray-900' : 'text-gray-700'}`}>{label}</span>
      </label>
      {description && (
        <p className={`text-sm mt-0.5 ml-5 leading-relaxed ${disabled ? 'text-gray-400' : 'text-gray-500'}`}>{description}</p>
      )}
      {children}
    </div>
  );
}

function WarningBox({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-2 bg-yellow-50 border border-yellow-200 rounded p-3 my-2">
      <span className="text-yellow-500 text-sm mt-0.5">💡</span>
      <p className="text-sm text-gray-700 leading-relaxed">{children}</p>
    </div>
  );
}

function SectionCard({ children }: { children: React.ReactNode }) {
  return <div className="border border-gray-200 rounded-lg bg-white overflow-hidden mb-4">{children}</div>;
}

function TwoColRow({ left, right }: { left: React.ReactNode; right: React.ReactNode }) {
  return (
    <div className="grid grid-cols-[240px_1fr] divide-x divide-gray-100">
      <div className="p-6">{left}</div>
      <div className="p-6">{right}</div>
    </div>
  );
}

function RowLabel({ title, description }: { title: string; description: string }) {
  return (
    <>
      <h3 className="font-semibold text-gray-900 mb-1.5 leading-snug">{title}</h3>
      <p className="text-sm text-gray-500 leading-relaxed">{description}</p>
    </>
  );
}

// ─── Main export ─────────────────────────────────────────────────────────────

export function CoursePlayer({
  settings = defaultPlayerSettings,
  onUpdate,
}: {
  settings?: CoursePlayerSettings;
  onUpdate?: (s: CoursePlayerSettings) => void;
}) {
  // Helper: update a single key in settings
  function upd(patch: Partial<CoursePlayerSettings>) {
    onUpdate?.({ ...settings, ...patch });
  }

  const SelectedPreview = SKIN_PREVIEWS[settings.selectedSkin];

  return (
    <div className="space-y-0">

      {/* ── Course player skin ─────────────────────────────────────────── */}
      <SectionCard>
        <div className="px-6 pt-5 pb-4 border-b border-gray-100">
          <h3 className="font-semibold text-gray-900 mb-0.5">Course player skin</h3>
          <p className="text-sm text-gray-500">Select the feel and look of the course player.</p>
        </div>
        <div className="p-6 grid grid-cols-[1fr_2fr] gap-6">
          <div className="flex flex-col gap-3">
            <div className="rounded-lg overflow-hidden border-2 border-teal-500" style={{ height: 190 }}>
              <SelectedPreview large />
            </div>
            <div className="flex items-start gap-2 bg-yellow-50 border border-yellow-200 rounded p-3">
              <span className="text-yellow-500 text-sm">💡</span>
              <p className="text-xs text-gray-700 leading-relaxed">
                We recommend that you match your Video player skin with the Course player skin.
              </p>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            {SKIN_ORDER.map(id => {
              const Preview = SKIN_PREVIEWS[id];
              const isSelected = settings.selectedSkin === id;
              const hasInfo = id.startsWith('one-activity');
              return (
                <button
                  key={id}
                  onClick={() => upd({ selectedSkin: id })}
                  className={`rounded-lg overflow-hidden border-2 transition-all focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2 text-left ${
                    isSelected ? 'border-teal-500' : 'border-gray-200 hover:border-gray-400'
                  }`}
                >
                  <div className="relative bg-gray-100" style={{ height: 85 }}>
                    <Preview />
                    {isSelected && (
                      <div className="absolute top-1.5 right-1.5 bg-teal-500 rounded-full flex items-center justify-center shadow" style={{ width: 18, height: 18 }}>
                        <svg viewBox="0 0 12 12" className="text-white" style={{ width: 10, height: 10 }}>
                          <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="1.8" fill="none" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      </div>
                    )}
                  </div>
                  <div className="px-2 py-1.5 bg-white flex items-start gap-1">
                    <span className="text-xs text-gray-700 leading-tight flex-1">{SKIN_LABELS[id]}</span>
                    {hasInfo && <Info className="size-3 text-gray-400 flex-shrink-0 mt-0.5" />}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </SectionCard>

      {/* ── Customize the path player ──────────────────────────────────── */}
      <SectionCard>
        <TwoColRow
          left={
            <RowLabel
              title="Customize the path player"
              description="Show or hide the left path player in your students' course player. If enabled, you can customize the displayed information and style to your preferences."
            />
          }
          right={
            <div>
              <SettingCheckbox
                checked={settings.hideLeftPlayer}
                onChange={v => upd({ hideLeftPlayer: v })}
                label="Hide the left path player"
                description="If you activate this setting, the left path player in your students course player will be removed."
              />
              <SettingCheckbox
                checked={settings.showCourseName}
                onChange={v => upd({ showCourseName: v })}
                label="Show the course name"
                description="You can include the course title at the top of your course player. This can increase student engagement with the course content and the learning process."
              />
              <SettingCheckbox
                checked={settings.showProgressBar}
                onChange={v => upd({ showProgressBar: v })}
                label="Show progress bar"
                description="You can include a progress bar for students to keep track of their progress percentage in the course."
              />
              <SettingCheckbox
                checked={settings.showAllLearners}
                onChange={v => upd({ showAllLearners: v })}
                label="Show all course learners"
                description='The "Learners" tab shows up next to the "Path" tab and presents a list of all the course learners, which can motivate them to interact with each other.'
              />
              <SettingCheckbox
                checked={settings.showDiscussion}
                onChange={v => upd({ showDiscussion: v })}
                label="Show the course discussion tab"
                description='The "Discussion" tab enables learners to discuss the course topics with each other and the instructor.'
              />
              <SettingCheckbox
                checked={settings.expandSections}
                onChange={v => upd({ expandSections: v })}
                label="Expand course sections on course load"
                description="You can select whether to expand the course sections when students visit the course player."
              />
              <SettingCheckbox
                checked={settings.numberSections}
                onChange={v => upd({ numberSections: v })}
                label="Number sections automatically"
                description="You can select whether the course sections will be automatically numbered."
              />
              <SettingCheckbox
                checked={settings.startFrom00}
                onChange={v => upd({ startFrom00: v })}
                label="Start section numbering from 00"
                description="By default, course sections are numbered starting from 01. You can enable this setting to start section numbering from 00."
              />
              <SettingCheckbox
                checked={settings.showCompleteSectionTitles}
                onChange={v => upd({ showCompleteSectionTitles: v })}
                label="Show complete section titles"
                description="If you enable this option, section titles will wrap onto multiple lines when needed. If deactivated, titles will be displayed on a single line with an ellipsis (...)."
              />
              <SettingCheckbox
                checked={settings.showCompleteActivityTitles}
                onChange={v => upd({ showCompleteActivityTitles: v })}
                label="Show complete learning activity titles"
                description="If you enable this option, activity titles will wrap onto multiple lines when needed. If deactivated, titles will be displayed on a single line with an ellipsis (...)."
              />
              <SettingCheckbox
                checked={settings.showEbookReading}
                onChange={v => upd({ showEbookReading: v })}
                label="Display the estimated reading for Ebooks"
                description="The estimated reading time for Ebooks is automatically calculated based on word-count."
                seeWhat={false}
              />
            </div>
          }
        />
      </SectionCard>

      {/* ── Navigation bar ─────────────────────────────────────────────── */}
      <SectionCard>
        <TwoColRow
          left={<RowLabel title="Navigation bar" description="Select whether to display the navigation bar at the top or bottom of the course player or hide it completely." />}
          right={
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Select navigation bar position</p>
              <SettingRadio value="top"    current={settings.navBarPosition} onChange={v => upd({ navBarPosition: v as 'top' | 'bottom' | 'hidden' })} label="At the top" />
              <SettingRadio value="bottom" current={settings.navBarPosition} onChange={v => upd({ navBarPosition: v as 'top' | 'bottom' | 'hidden' })} label="At the bottom" />
              <SettingRadio value="hidden" current={settings.navBarPosition} onChange={v => upd({ navBarPosition: v as 'top' | 'bottom' | 'hidden' })} label="Don't show navigation buttons" />
              <SeeWhatChanging />
            </div>
          }
        />
        <div className="border-t border-gray-100">
          <TwoColRow
            left={<RowLabel title="Navigation buttons" description="You may change the text of the navigation buttons." />}
            right={
              <div className="grid grid-cols-2 gap-8">
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Previous</p>
                  <input
                    type="text"
                    defaultValue={settings.prevText}
                    onChange={e => upd({ prevText: e.target.value })}
                    className="w-full border-0 border-b border-gray-300 pb-1 text-sm text-gray-800 bg-transparent focus:outline-none focus:border-teal-500 cursor-text"
                  />
                </div>
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Next</p>
                  <input
                    type="text"
                    defaultValue={settings.nextText}
                    onChange={e => upd({ nextText: e.target.value })}
                    className="w-full border-0 border-b border-gray-300 pb-1 text-sm text-gray-800 bg-transparent focus:outline-none focus:border-teal-500 cursor-text"
                  />
                </div>
              </div>
            }
          />
        </div>
      </SectionCard>

      {/* ── Course player back button ──────────────────────────────────── */}
      <SectionCard>
        <TwoColRow
          left={<RowLabel title='Course player "back" button' description="Allow students to navigate away from the course player." />}
          right={
            <div>
              <SettingRadio value="none"         current={settings.backButton} onChange={v => upd({ backButton: v as CoursePlayerSettings['backButton'] })} label="No button" />
              <SettingRadio value="course-layout" current={settings.backButton} onChange={v => upd({ backButton: v as CoursePlayerSettings['backButton'] })}
                label="Course layout page"
                description="An easy way for students to find their way back to the course description page."
              />
              <SettingRadio value="after-login"  current={settings.backButton} onChange={v => upd({ backButton: v as CoursePlayerSettings['backButton'] })}
                label="After login"
                description="Takes students back to their after login page."
              />
              <SettingRadio value="another-page" current={settings.backButton} onChange={v => upd({ backButton: v as CoursePlayerSettings['backButton'] })} label="Another page">
                {settings.backButton === 'another-page' && (
                  <div className="ml-5 mt-2 space-y-2">
                    <p className="text-sm text-gray-500">Choose one of your school's pages.</p>
                    <select
                      value={settings.backPage}
                      onChange={e => upd({ backPage: e.target.value })}
                      className="border border-gray-300 rounded px-3 py-1.5 text-sm text-gray-700 w-52 focus:outline-none focus:ring-2 focus:ring-teal-500"
                    >
                      <option value="start-courses">Start: Courses</option>
                      <option value="start-home">Start: Home</option>
                      <option value="dashboard">Dashboard</option>
                    </select>
                  </div>
                )}
              </SettingRadio>
              <SettingRadio value="specific-url" current={settings.backButton} onChange={v => upd({ backButton: v as CoursePlayerSettings['backButton'] })} label="Specific URL">
                {settings.backButton === 'specific-url' && (
                  <div className="ml-5 mt-2 space-y-2">
                    <p className="text-sm text-gray-500">Paste a URL of your choice.</p>
                    <input
                      type="url"
                      value={settings.backUrl}
                      onChange={e => upd({ backUrl: e.target.value })}
                      placeholder="https://"
                      className="border border-gray-300 rounded px-3 py-1.5 text-sm text-gray-700 w-64 focus:outline-none focus:ring-2 focus:ring-teal-500"
                    />
                  </div>
                )}
              </SettingRadio>
              <SeeWhatChanging />
            </div>
          }
        />
      </SectionCard>

      {/* ── Course video auto-progress ─────────────────────────────────── */}
      <SectionCard>
        <TwoColRow
          left={<RowLabel title="Course video auto-progress" description="When the video ends, the next learning activity will automatically be loaded." />}
          right={
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Enable / Disable Auto-Progress</p>
              <button
                onClick={() => upd({ autoProgress: !settings.autoProgress })}
                className={`relative inline-flex h-7 w-14 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2 ${settings.autoProgress ? 'bg-teal-500' : 'bg-gray-300'}`}
              >
                <span className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform ${settings.autoProgress ? 'translate-x-8' : 'translate-x-1'}`} />
                <span className={`absolute text-[10px] font-bold pointer-events-none ${settings.autoProgress ? 'left-2 text-white' : 'right-1.5 text-gray-500'}`}>
                  {settings.autoProgress ? 'ON' : 'OFF'}
                </span>
              </button>
            </div>
          }
        />
      </SectionCard>

      {/* ── Course navigation ──────────────────────────────────────────── */}
      <SectionCard>
        <TwoColRow
          left={<RowLabel title="Course navigation" description="Specify whether learners can navigate freely among the course learning activities or have to comply with specific restrictions." />}
          right={
            <div>
              <SettingRadio value="free"         current={settings.courseNav} onChange={v => upd({ courseNav: v as 'free' | 'sequential' | 'prerequisites' })}
                label="Free navigation"
                description="Students can navigate among the course learning activities without any restrictions."
              />
              <SettingRadio value="sequential"   current={settings.courseNav} onChange={v => upd({ courseNav: v as 'free' | 'sequential' | 'prerequisites' })}
                label="Sequential navigation"
                description="Students have to complete each learning activity before moving on to the next one."
              />
              <SettingRadio value="prerequisites" current={settings.courseNav} onChange={v => upd({ courseNav: v as 'free' | 'sequential' | 'prerequisites' })}
                label="Navigation with prerequisites"
                description="Students need to complete specific prerequisite learning activities to access the following ones."
              />
              <SeeWhatChanging />
            </div>
          }
        />
      </SectionCard>

      {/* ── Course completion rule ─────────────────────────────────────── */}
      <SectionCard>
        <TwoColRow
          left={<RowLabel title="Course completion rule" description="When should the course be considered as completed?" />}
          right={
            <div>
              <SettingRadio value="all-activities" current={settings.completionRule} onChange={v => upd({ completionRule: v })}
                label="When the learner completes all learning activities."
                description="Keep in mind that this setting depends on the learning activity completion rules set in the User Progress section."
              />

              <div className={settings.completionRule !== 'all-exams' ? 'opacity-40' : ''}>
                <label className="flex items-start gap-2 cursor-pointer select-none mb-1">
                  <input
                    type="radio"
                    checked={settings.completionRule === 'all-exams'}
                    onChange={() => upd({ completionRule: 'all-exams' })}
                    className="mt-0.5 text-teal-600 focus:ring-teal-500"
                  />
                  <span className="text-sm text-gray-700">When the learner passes all exams and certificates.</span>
                </label>
                <p className="text-sm text-gray-400 ml-5 mb-1">Students can complete the course by passing all course exams without having to visit all learning activities.</p>
                <div className="ml-5">
                  <WarningBox>
                    The course you are editing doesn't have exams and/or certificates. Consider adding one.
                  </WarningBox>
                </div>
              </div>

              <div className="mt-3 opacity-40">
                <label className="flex items-start gap-2 cursor-pointer select-none mb-1">
                  <input
                    type="radio"
                    checked={settings.completionRule === 'specific-exam'}
                    disabled
                    onChange={() => {}}
                    className="mt-0.5 text-teal-600 focus:ring-teal-500"
                  />
                  <span className="text-sm text-gray-700">When the learner passes a specific exam or certificate.</span>
                </label>
                <div className="ml-5">
                  <WarningBox>
                    The course you are editing doesn't have an exam or certificate yet.
                  </WarningBox>
                  <select disabled className="border border-gray-200 rounded px-3 py-1.5 text-sm text-gray-400 w-56 bg-gray-50 cursor-not-allowed">
                    <option>No exams or certificates found</option>
                  </select>
                </div>
              </div>

              <div className="mt-3">
                <SettingRadio value="specific-cert" current={settings.completionRule} onChange={v => upd({ completionRule: v })}
                  label="When the learner claims a specific certificate of completion."
                  description="Students will need to claim a specific certificate of completion for the course to be considered completed."
                >
                  {settings.completionRule === 'specific-cert' && (
                    <div className="ml-5 mt-2">
                      <select
                        value={settings.specificCert}
                        onChange={e => upd({ specificCert: e.target.value })}
                        className="border border-gray-300 rounded px-3 py-1.5 text-sm text-gray-700 w-56 focus:outline-none focus:ring-2 focus:ring-teal-500"
                      >
                        <option value="">Select a certificate of completion</option>
                      </select>
                    </div>
                  )}
                </SettingRadio>
              </div>
            </div>
          }
        />
      </SectionCard>

      {/* ── Apply to all courses ───────────────────────────────────────── */}
      <SectionCard>
        <TwoColRow
          left={<RowLabel title="Apply the Course Player settings to all courses" description="You can populate this course's course player settings to all school courses." />}
          right={
            <div>
              <div className="space-y-3 mb-5">
                {[
                  { field: 'applySkin' as const,              label: 'Apply the same course player skin to all courses' },
                  { field: 'applyAppearance' as const,        label: 'Apply the course player appearance settings to all courses' },
                  { field: 'applyNavigation' as const,        label: 'Apply the course navigation settings to all courses' },
                  { field: 'applyActivityCompletion' as const, label: 'Apply the learning activity completion rules to all courses' },
                  { field: 'applyCourseCompletion' as const,  label: 'Apply the Course Completion settings to all courses' },
                ].map(({ field, label }) => (
                  <label key={field} className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={settings[field] as boolean}
                      onChange={e => upd({ [field]: e.target.checked })}
                      className="rounded border-gray-300 text-teal-600 focus:ring-teal-500"
                    />
                    <span className="text-sm text-gray-700">{label}</span>
                  </label>
                ))}
              </div>
              <button className="px-4 py-1.5 border border-teal-500 text-teal-600 text-sm rounded hover:bg-teal-50 transition-colors focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2">
                Apply to all Courses
              </button>
            </div>
          }
        />
      </SectionCard>

      {/* Bottom Save */}
      <div className="flex justify-end pt-2 pb-6">
        <button className="flex items-center gap-2 px-5 py-2 bg-teal-600 text-white text-sm font-medium rounded-lg hover:bg-teal-700 transition-colors focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2">
          <Save className="size-4" />
          Save
        </button>
      </div>

    </div>
  );
}