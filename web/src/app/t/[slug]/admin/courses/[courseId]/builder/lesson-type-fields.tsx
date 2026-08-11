'use client';

import { useState } from 'react';
import { Input } from '@/components/ui/input';

const SELECT_BASE = 'rounded-md border border-input bg-transparent px-3 text-sm shadow-sm';

/**
 * Lesson type picker that reveals ONLY the field the chosen type uses: a "Text
 * body" for text, a "PDF URL" for pdf, and nothing for video (attached via the
 * Bunny widget) or quiz (built on its own page).
 *
 * The forms used to render every field for every non-quiz lesson, so an author
 * editing a video saw irrelevant "Text body" and "PDF URL" boxes and could type
 * into the wrong one. contentFor already keys off the type and ignores the other
 * fields, so hiding them changes only what the author sees, never what is stored.
 */
export function LessonTypeFields({
  allowQuiz = false,
  defaultType = 'text',
  defaultBody = '',
  defaultUrl = '',
  compact = false,
}: {
  allowQuiz?: boolean;
  defaultType?: string;
  defaultBody?: string;
  defaultUrl?: string;
  compact?: boolean;
}) {
  const [type, setType] = useState(defaultType);
  const h = compact ? 'h-8' : 'h-9';
  const field = `${h} w-40`;

  return (
    <>
      <select
        name="type"
        aria-label="Lesson type"
        value={type}
        onChange={(e) => setType(e.target.value)}
        className={`${SELECT_BASE} ${h}`}
      >
        <option value="text">Text</option>
        <option value="video">Video</option>
        <option value="pdf">PDF</option>
        {allowQuiz && <option value="quiz">Quiz</option>}
      </select>
      {type === 'text' && (
        <Input
          name="body"
          aria-label="Text body"
          defaultValue={defaultBody}
          placeholder="Text body"
          className={field}
        />
      )}
      {type === 'pdf' && (
        <Input
          name="url"
          aria-label="PDF URL"
          defaultValue={defaultUrl}
          placeholder="PDF URL"
          className={field}
        />
      )}
    </>
  );
}
