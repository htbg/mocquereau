import { useState, useMemo, useEffect } from 'react';
import { syllabifyText, HyphenationMode } from '../lib/syllabify';
import { useProject } from '../hooks/useProject';
import { createNewProject } from '../hooks/useProject';
import { SyllableBar } from './SyllableBar';
import { SectionPanel } from './SectionPanel';
import type { GuerangerExport } from '../lib/models';

interface ScreenProps {
  onNext: () => void;
  onPrev: () => void;
  canGoNext: boolean;
  canGoPrev: boolean;
}

const MODE_LABELS: Record<HyphenationMode, string> = {
  liturgical: 'Litúrgico',
  classical: 'Clássico',
  modern: 'Moderno',
  manual: 'Manual',
};

const MODES: HyphenationMode[] = ['liturgical', 'classical', 'modern', 'manual'];

export function ProjectSetup({ onNext, canGoNext }: ScreenProps) {
  const { state, dispatch } = useProject();

  // ── Local state ────────────────────────────────────────────────────────────
  const [rawText, setRawText] = useState<string>(
    () => state.project?.text.raw ?? ''
  );
  const [debouncedText, setDebouncedText] = useState<string>(rawText);
  const [hyphenationMode, setHyphenationMode] = useState<HyphenationMode>(
    () => state.project?.text.hyphenationMode ?? 'liturgical'
  );
  const [hasManualEdits, setHasManualEdits] = useState(false);
  const [title, setTitle] = useState<string>(
    () => state.project?.meta.title ?? ''
  );
  const [author, setAuthor] = useState<string>(
    () => state.project?.meta.author ?? ''
  );

  // ── Debounce ───────────────────────────────────────────────────────────────
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedText(rawText), 300);
    return () => clearTimeout(timer);
  }, [rawText]);

  const syllabifiedWords = useMemo(
    () => syllabifyText(debouncedText, hyphenationMode),
    [debouncedText, hyphenationMode]
  );

  // Dispatch SET_TEXT after debounce settles — only when a project exists
  useEffect(() => {
    if (!state.project) return;
    dispatch({
      type: 'SET_TEXT',
      payload: {
        raw: debouncedText,
        words: syllabifiedWords,
        hyphenationMode,
      },
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [syllabifiedWords]);

  // ── Mode change ────────────────────────────────────────────────────────────
  function handleModeChange(newMode: HyphenationMode) {
    if (hasManualEdits && newMode !== 'manual') {
      const ok = window.confirm('Trocar modo vai descartar edições manuais. Continuar?');
      if (!ok) return;
      setHasManualEdits(false);
    }
    setHyphenationMode(newMode);
    // Re-syllabify immediately (do not wait for debounce)
    const words = syllabifyText(rawText, newMode);
    if (state.project) {
      dispatch({
        type: 'SET_TEXT',
        payload: { raw: rawText, words, hyphenationMode: newMode },
      });
    }
  }

  // ── Join handler ───────────────────────────────────────────────────────────
  function handleJoin(wordIdx: number, sylIdx: number) {
    const words = [...(state.project?.text.words ?? [])];
    const word = { ...words[wordIdx] };
    const merged = word.syllables[sylIdx] + word.syllables[sylIdx + 1];
    word.syllables = [
      ...word.syllables.slice(0, sylIdx),
      merged,
      ...word.syllables.slice(sylIdx + 2),
    ];
    words[wordIdx] = word;
    dispatch({ type: 'EDIT_SYLLABLES', payload: words });
    setHasManualEdits(true);
  }

  // ── Split handler ──────────────────────────────────────────────────────────
  function handleSplit(wordIdx: number, sylIdx: number, text: string) {
    const parts = text.split('-').filter(Boolean);
    if (parts.length < 1) return;
    const words = [...(state.project?.text.words ?? [])];
    const word = { ...words[wordIdx] };
    word.syllables = [
      ...word.syllables.slice(0, sylIdx),
      ...parts,
      ...word.syllables.slice(sylIdx + 1),
    ];
    words[wordIdx] = word;
    dispatch({ type: 'EDIT_SYLLABLES', payload: words });
    setHasManualEdits(true);
  }

  // ── Save ───────────────────────────────────────────────────────────────────
  async function handleSave() {
    if (!state.project) return;
    const updated = {
      ...state.project,
      meta: { ...state.project.meta, updatedAt: new Date().toISOString() },
    };
    const result = await window.mocquereau.saveProject(updated);
    if (result) dispatch({ type: 'SAVE_SUCCESS' });
  }

  // ── Open ───────────────────────────────────────────────────────────────────
  async function handleOpen() {
    const result = await window.mocquereau.openProject();
    if (!result) return;
    dispatch({ type: 'SET_PROJECT', payload: result.project });
    setRawText(result.project.text.raw);
    setHyphenationMode(result.project.text.hyphenationMode);
    setTitle(result.project.meta.title);
    setAuthor(result.project.meta.author);
    setHasManualEdits(false);
  }

  // ── Import Gueranger ───────────────────────────────────────────────────────
  async function handleImportGueranger() {
    const result: GuerangerExport | null = await window.mocquereau.importGueranger();
    if (!result) return;
    if (!rawText.trim() && result.manuscripts[0]?.incipit) {
      setRawText(result.manuscripts[0].incipit);
    }
  }

  // ── Create / Next ──────────────────────────────────────────────────────────
  function handleCreateOrNext() {
    if (state.project) {
      onNext();
      return;
    }
    if (!title.trim()) {
      alert('O título é obrigatório.');
      return;
    }
    const newProject = createNewProject(title, author);
    const withText = {
      ...newProject,
      text: { raw: rawText, words: syllabifiedWords, hyphenationMode },
    };
    dispatch({ type: 'SET_PROJECT', payload: withText });
    onNext();
  }

  // ── Render ─────────────────────────────────────────────────────────────────
  const projectExists = state.project !== null;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <div className="flex-1 max-w-4xl mx-auto w-full px-4 py-8 space-y-6">

        {/* Metadata card */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">
            Informações do projeto
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Título do projeto
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Ex.: Sanctus XVII"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Autor
              </label>
              <input
                type="text"
                value={author}
                onChange={(e) => setAuthor(e.target.value)}
                placeholder="Ex.: João da Silva"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              />
            </div>
          </div>
        </div>

        {/* Text input card */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-2">
            Texto litúrgico (latim)
          </h2>
          <textarea
            rows={6}
            value={rawText}
            onChange={(e) => setRawText(e.target.value)}
            placeholder="Digite ou cole o texto litúrgico em latim aqui..."
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none resize-none"
          />

          {/* Mode selector */}
          <div className="flex items-center gap-2 mt-3">
            <span className="text-sm text-gray-500 mr-1">Modo:</span>
            {MODES.map((mode) => (
              <button
                key={mode}
                onClick={() => handleModeChange(mode)}
                className={[
                  'px-3 py-1 rounded text-sm font-medium transition-colors',
                  hyphenationMode === mode
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50',
                ].join(' ')}
              >
                {MODE_LABELS[mode]}
              </button>
            ))}
          </div>
        </div>

        {/* Syllabification card */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-2">
            Silabificação
          </h2>
          <SyllableBar
            words={
              projectExists
                ? (state.project?.text.words ?? syllabifiedWords)
                : syllabifiedWords
            }
            onJoin={handleJoin}
            onSplit={handleSplit}
            sections={state.project?.sections}
          />
        </div>

        {/* Section panel card */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <SectionPanel
            words={state.project?.text.words ?? syllabifiedWords}
            sections={state.project?.sections ?? []}
            onAdd={(s) => dispatch({ type: 'ADD_SECTION', payload: s })}
            onRemove={(id) => dispatch({ type: 'REMOVE_SECTION', payload: id })}
            onUpdate={(s) => dispatch({ type: 'UPDATE_SECTION', payload: s })}
          />
        </div>
      </div>

      {/* Bottom action bar */}
      <div className="sticky bottom-0 bg-white border-t border-gray-200 px-4 py-3">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          {/* Left: open / import */}
          <div className="flex gap-2">
            <button
              onClick={handleOpen}
              className="px-4 py-2 text-sm text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Abrir
            </button>
            <button
              onClick={handleImportGueranger}
              className="px-4 py-2 text-sm text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Importar Gueranger
            </button>
          </div>

          {/* Right: save / create/next */}
          <div className="flex gap-2">
            <button
              onClick={handleSave}
              disabled={!projectExists}
              className="px-4 py-2 text-sm text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-40"
            >
              Salvar
            </button>
            <button
              onClick={handleCreateOrNext}
              disabled={!canGoNext && projectExists}
              className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-40"
            >
              {projectExists ? 'Próximo →' : 'Criar projeto'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
