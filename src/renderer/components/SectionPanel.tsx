import { useState } from 'react';
import type { Section, SyllabifiedWord } from '../lib/models';

interface SectionPanelProps {
  /** All words in the project (needed to show word options for range selection) */
  words: SyllabifiedWord[];
  /** Current sections */
  sections: Section[];
  /** Add a new section */
  onAdd: (section: Section) => void;
  /** Remove section by id */
  onRemove: (id: string) => void;
  /** Update an existing section */
  onUpdate: (section: Section) => void;
}

interface FormState {
  name: string;
  startIdx: number;
  endIdx: number;
}

const EMPTY_FORM: FormState = { name: '', startIdx: 0, endIdx: 0 };

export function SectionPanel({
  words,
  sections,
  onAdd,
  onRemove,
  onUpdate,
}: SectionPanelProps) {
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);

  function openAddForm() {
    setEditingId(null);
    setForm({
      name: '',
      startIdx: 0,
      endIdx: Math.max(0, words.length - 1),
    });
    setShowForm(true);
  }

  function openEditForm(section: Section) {
    setEditingId(section.id);
    setForm({
      name: section.name,
      startIdx: section.wordRange[0],
      endIdx: section.wordRange[1],
    });
    setShowForm(true);
  }

  function cancelForm() {
    setShowForm(false);
    setEditingId(null);
    setForm(EMPTY_FORM);
  }

  function handleSubmit() {
    if (!form.name.trim()) {
      alert('O nome da seção é obrigatório.');
      return;
    }
    if (form.endIdx < form.startIdx) {
      alert('O índice final deve ser maior ou igual ao índice inicial.');
      return;
    }

    if (editingId !== null) {
      onUpdate({
        id: editingId,
        name: form.name.trim(),
        wordRange: [form.startIdx, form.endIdx],
      });
    } else {
      onAdd({
        id: crypto.randomUUID(),
        name: form.name.trim(),
        wordRange: [form.startIdx, form.endIdx],
      });
    }
    cancelForm();
  }

  function handleStartChange(newStart: number) {
    setForm((prev) => ({
      ...prev,
      startIdx: newStart,
      endIdx: Math.max(newStart, prev.endIdx),
    }));
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">
          Seções da peça
        </h2>
        {!showForm && (
          <button
            onClick={openAddForm}
            className="text-sm text-blue-600 hover:text-blue-700 font-medium"
          >
            + Adicionar
          </button>
        )}
      </div>

      {/* Section list */}
      {sections.length === 0 && !showForm && (
        <p className="text-sm text-gray-400 italic">Nenhuma seção definida.</p>
      )}

      {sections.length > 0 && (
        <ul className="space-y-1 mb-3">
          {sections.map((section) => (
            <li
              key={section.id}
              className="flex items-center justify-between py-2 px-3 rounded-lg border border-gray-200 bg-gray-50"
            >
              <div>
                <span className="font-medium text-sm text-gray-800">
                  {section.name}
                </span>
                <span className="ml-2 text-xs text-gray-500">
                  palavras {section.wordRange[0] + 1}–{section.wordRange[1] + 1}
                </span>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => openEditForm(section)}
                  className="text-xs text-blue-600 hover:underline"
                >
                  editar
                </button>
                <button
                  onClick={() => onRemove(section.id)}
                  className="text-xs text-red-500 hover:underline"
                >
                  remover
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      {/* Inline form */}
      {showForm && (
        <div className="border border-blue-200 rounded-lg p-4 bg-blue-50/30 space-y-3">
          {words.length === 0 ? (
            <p className="text-sm text-gray-500 italic">
              Adicione o texto litúrgico primeiro.
            </p>
          ) : (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nome da seção
                </label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
                  placeholder="Ex.: Sanctus, Pleni sunt, Hosanna..."
                  autoFocus
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Palavra inicial
                  </label>
                  <select
                    value={form.startIdx}
                    onChange={(e) => handleStartChange(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                  >
                    {words.map((w, i) => (
                      <option key={i} value={i}>
                        {i + 1}. {w.original}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Palavra final
                  </label>
                  <select
                    value={form.endIdx}
                    onChange={(e) =>
                      setForm((prev) => ({ ...prev, endIdx: Number(e.target.value) }))
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                  >
                    {words.slice(form.startIdx).map((w, offset) => {
                      const i = form.startIdx + offset;
                      return (
                        <option key={i} value={i}>
                          {i + 1}. {w.original}
                        </option>
                      );
                    })}
                  </select>
                </div>
              </div>
            </>
          )}

          <div className="flex gap-2 justify-end">
            <button
              onClick={cancelForm}
              className="px-3 py-1.5 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Cancelar
            </button>
            {words.length > 0 && (
              <button
                onClick={handleSubmit}
                className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                {editingId !== null ? 'Salvar' : 'Adicionar'}
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
