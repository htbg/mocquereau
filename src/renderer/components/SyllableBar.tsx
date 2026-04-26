import React, { useState } from 'react';
import { SyllabifiedWord, Section } from '../lib/models';
import { SyllableChip } from './SyllableChip';
import { useTranslation } from 'react-i18next';

interface SyllableBarProps {
  /** Array of syllabified words to render */
  words: SyllabifiedWord[];
  /** Called when user clicks join boundary between syllable [sylIdx] and [sylIdx+1] in word [wordIdx] */
  onJoin: (wordIdx: number, sylIdx: number) => void;
  /** Called when user splits syllable [sylIdx] in word [wordIdx] using the typed text */
  onSplit: (wordIdx: number, sylIdx: number, text: string) => void;
  /** Optional sections to visually highlight word ranges */
  sections?: Section[];
  /** If true, all interactions are disabled (read-only display) */
  readOnly?: boolean;
}

// Section background colors (cycling through a set of subtle tints)
const SECTION_COLORS = [
  'border-l-2 border-blue-300 bg-blue-50/40',
  'border-l-2 border-amber-300 bg-amber-50/40',
  'border-l-2 border-green-300 bg-green-50/40',
  'border-l-2 border-purple-300 bg-purple-50/40',
  'border-l-2 border-rose-300 bg-rose-50/40',
];

interface WordGroupProps {
  word: SyllabifiedWord;
  wordIdx: number;
  editingKey: string | null;
  setEditingKey: (key: string | null) => void;
  onJoin: (wordIdx: number, sylIdx: number) => void;
  onSplit: (wordIdx: number, sylIdx: number, text: string) => void;
  readOnly: boolean;
  sectionColorClass: string | null;
}

function WordGroup({
  word,
  wordIdx,
  editingKey,
  setEditingKey,
  onJoin,
  onSplit,
  readOnly,
  sectionColorClass,
}: WordGroupProps) {
  const { t } = useTranslation();
  return (
    <div
      className={[
        'group flex items-center gap-x-0.5 px-1 rounded',
        sectionColorClass ?? '',
      ]
        .filter(Boolean)
        .join(' ')}
    >
      {word.syllables.map((syl, i) => (
        <React.Fragment key={i}>
          {/* Join boundary button between syllable i-1 and i */}
          {i > 0 && !readOnly && (
            <button
              className="w-3 h-6 flex items-center justify-center text-blue-400 opacity-0 group-hover:opacity-100 transition-opacity rounded hover:bg-blue-100 text-xs"
              onClick={() => onJoin(wordIdx, i - 1)}
              aria-label={t('syllableBar.joinAriaLabel', { previous: word.syllables[i - 1], current: syl })}
              title={t('syllableBar.joinTitle')}
            >
              ·
            </button>
          )}
          <SyllableChip
            syllable={syl}
            isEditing={editingKey === `${wordIdx}-${i}`}
            onEnterEdit={() => {
              if (!readOnly) setEditingKey(`${wordIdx}-${i}`);
            }}
            onCommitEdit={(val) => {
              setEditingKey(null);
              if (!readOnly) onSplit(wordIdx, i, val);
            }}
            onCancelEdit={() => setEditingKey(null)}
          />
        </React.Fragment>
      ))}
    </div>
  );
}

export function SyllableBar({
  words,
  onJoin,
  onSplit,
  sections,
  readOnly = false,
}: SyllableBarProps) {
  const { t } = useTranslation();
  const [editingKey, setEditingKey] = useState<string | null>(null);

  if (words.length === 0) {
    return (
      <div className="py-2 px-1">
        <span className="text-gray-400 text-sm italic">
          {t('syllableBar.empty')}
        </span>
      </div>
    );
  }

  return (
    <div className="flex flex-wrap gap-x-4 gap-y-2 overflow-x-auto py-2 px-1">
      {words.map((word, wordIdx) => {
        // Find which section (if any) this word belongs to
        const sectionIdx = sections
          ? sections.findIndex(
              (s) => wordIdx >= s.wordRange[0] && wordIdx <= s.wordRange[1]
            )
          : -1;
        const sectionColorClass =
          sectionIdx >= 0
            ? SECTION_COLORS[sectionIdx % SECTION_COLORS.length]
            : null;

        return (
          <WordGroup
            key={wordIdx}
            word={word}
            wordIdx={wordIdx}
            editingKey={editingKey}
            setEditingKey={setEditingKey}
            onJoin={onJoin}
            onSplit={onSplit}
            readOnly={readOnly}
            sectionColorClass={sectionColorClass}
          />
        );
      })}
    </div>
  );
}
