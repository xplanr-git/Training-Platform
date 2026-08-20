'use client';

import { useEffect, useRef, useState } from 'react';
import { Mic, Square } from 'lucide-react';
import { cn } from '@/components/ui/utils';

/**
 * A normal textarea with an OPTIONAL voice-to-text mic — for onsite / mobile use
 * where speaking beats typing. Uses the browser's built-in Web Speech API
 * (SpeechRecognition); no transcription service, and the app never handles or
 * stores raw audio — the API returns text, which is the only saved record. Voice
 * is a progressive enhancement: the mic only appears where the browser supports
 * it, and typing always works. The learner reviews/edits the transcript and
 * submits explicitly — nothing auto-submits.
 */

type SpeechResultList = ArrayLike<ArrayLike<{ transcript: string }>>;
type SpeechRec = {
  lang: string;
  interimResults: boolean;
  continuous: boolean;
  onresult: ((e: { results: SpeechResultList }) => void) | null;
  onend: (() => void) | null;
  onerror: (() => void) | null;
  start: () => void;
  stop: () => void;
};
type SpeechCtor = new () => SpeechRec;

function getCtor(): SpeechCtor | null {
  if (typeof window === 'undefined') return null;
  const w = window as unknown as {
    SpeechRecognition?: SpeechCtor;
    webkitSpeechRecognition?: SpeechCtor;
  };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

export function VoiceTextarea({
  value,
  onChange,
  placeholder,
  label,
  rows = 3,
  maxLength = 4000,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  label: string;
  rows?: number;
  maxLength?: number;
}) {
  const [supported, setSupported] = useState(false);
  const [recording, setRecording] = useState(false);
  const recRef = useRef<SpeechRec | null>(null);
  const baseRef = useRef('');

  useEffect(() => {
    setSupported(!!getCtor());
    return () => {
      try {
        recRef.current?.stop();
      } catch {
        /* nothing to stop */
      }
    };
  }, []);

  function start() {
    const Ctor = getCtor();
    if (!Ctor) return;
    const rec = new Ctor();
    rec.lang = 'en-AU';
    rec.interimResults = true;
    rec.continuous = true;
    baseRef.current = value ? value.replace(/\s+$/, '') + ' ' : '';
    rec.onresult = (e) => {
      let txt = '';
      for (let i = 0; i < e.results.length; i++) txt += e.results[i][0]?.transcript ?? '';
      onChange((baseRef.current + txt).slice(0, maxLength));
    };
    rec.onend = () => setRecording(false);
    rec.onerror = () => setRecording(false);
    recRef.current = rec;
    try {
      rec.start();
      setRecording(true);
    } catch {
      setRecording(false);
    }
  }

  function stop() {
    try {
      recRef.current?.stop();
    } catch {
      /* already stopped */
    }
    setRecording(false);
  }

  return (
    <div>
      <div className="relative">
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          rows={rows}
          maxLength={maxLength}
          aria-label={label}
          placeholder={placeholder}
          className={cn(
            'border-input bg-surface w-full rounded-sm border px-3 py-2 text-sm',
            supported && 'pr-11',
          )}
        />
        {supported && (
          <button
            type="button"
            onClick={recording ? stop : start}
            aria-label={recording ? 'Stop recording' : 'Start voice input'}
            className={cn(
              'absolute right-2 top-2 inline-flex h-8 w-8 items-center justify-center rounded-sm border transition-colors',
              recording
                ? 'border-foreground bg-sunken'
                : 'border-input text-foreground-2 hover:text-foreground',
            )}
          >
            {recording ? (
              <Square aria-hidden="true" className="h-3.5 w-3.5" />
            ) : (
              <Mic aria-hidden="true" className="h-4 w-4" />
            )}
          </button>
        )}
      </div>
      {recording && (
        <p className="text-foreground-2 mt-1.5 text-meta" aria-live="polite">
          Recording… speak, then stop. You can edit the text before sending.
        </p>
      )}
    </div>
  );
}
