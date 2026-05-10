import React, { useRef, useEffect } from 'react';

interface EditableContentProps {
  html: string;
  tagName?: string;
  className?: string;
  isSelected: boolean;
  onSelect: () => void;
  onChange: (html: string) => void;
  style?: React.CSSProperties;
}

export const EditableContent = ({ html, tagName = 'div', className, isSelected, onSelect, onChange, style }: EditableContentProps) => {
  const contentEditableRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (isSelected && contentEditableRef.current) {
      contentEditableRef.current.focus();
    }
  }, [isSelected]);

  const handleBlur = (e: React.FocusEvent<HTMLElement>) => {
    // Only update if content changed
    if (e.currentTarget.innerHTML !== html) {
      onChange(e.currentTarget.innerHTML);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Optional: Stop propagation to prevent drag/drop interference
    e.stopPropagation();
  };

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onSelect();
  };
  
  const Tag = tagName as any;

  return (
    <Tag
      ref={contentEditableRef}
      className={`${className} ${isSelected ? 'outline-none ring-2 ring-teal-500 rounded p-1 cursor-text min-w-[1px] min-h-[1em]' : 'cursor-text'}`}
      onClick={handleClick}
      onBlur={handleBlur}
      onKeyDown={handleKeyDown}
      contentEditable={isSelected}
      suppressContentEditableWarning={true}
      dangerouslySetInnerHTML={{ __html: html }}
      style={style}
    />
  );
};
