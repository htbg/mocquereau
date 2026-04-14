import { useState } from "react";
import type { ManuscriptSource } from "../lib/models";

// ── Types ─────────────────────────────────────────────────────────────────────

interface SourceModalProps {
  source: ManuscriptSource;
  onSave: (updated: ManuscriptSource) => void;
  onClose: () => void;
}

// ── Constants ─────────────────────────────────────────────────────────────────

const NOTATION_OPTIONS: { value: ManuscriptSource["metadata"]["notation"]; label: string }[] = [
  { value: "adiastematic", label: "Adiastemática" },
  { value: "diastematic", label: "Diastemática" },
  { value: "square", label: "Quadrada" },
  { value: "modern", label: "Moderna" },
  { value: "other", label: "Outra" },
];

// ── Component ─────────────────────────────────────────────────────────────────

export function SourceModal({ source, onSave, onClose }: SourceModalProps) {
  const [draft, setDraft] = useState<ManuscriptSource["metadata"]>(() => ({
    ...source.metadata,
  }));

  function handleSave() {
    onSave({ ...source, metadata: draft });
  }

  function update(patch: Partial<ManuscriptSource["metadata"]>) {
    setDraft((prev) => ({ ...prev, ...patch }));
  }

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-lg mx-4">
        <h2 className="text-base font-semibold text-gray-900 mb-5">
          Editar metadados da fonte
        </h2>

        <div className="space-y-4">
          {/* Sigla */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Sigla
            </label>
            <input
              type="text"
              value={draft.siglum}
              onChange={(e) => update({ siglum: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none font-mono"
              placeholder="Ex.: C, Ma, Vat"
            />
          </div>

          {/* Biblioteca */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Biblioteca
            </label>
            <input
              type="text"
              value={draft.library}
              onChange={(e) => update({ library: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              placeholder="Ex.: Biblioteca Apostolica Vaticana"
            />
          </div>

          {/* Cidade */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Cidade
            </label>
            <input
              type="text"
              value={draft.city}
              onChange={(e) => update({ city: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              placeholder="Ex.: Roma"
            />
          </div>

          {/* Século */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Século
            </label>
            <input
              type="text"
              value={draft.century}
              onChange={(e) => update({ century: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              placeholder="Ex.: XII, XIII-XIV"
            />
          </div>

          {/* Fólio */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Fólio
            </label>
            <input
              type="text"
              value={draft.folio}
              onChange={(e) => update({ folio: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              placeholder="Ex.: 14v"
            />
          </div>

          {/* Cantus ID */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Cantus ID
            </label>
            <input
              type="text"
              value={draft.cantusId ?? ""}
              onChange={(e) =>
                update({ cantusId: e.target.value || undefined })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none font-mono"
              placeholder="Ex.: g01234"
            />
          </div>

          {/* URL da fonte */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              URL da fonte
            </label>
            <input
              type="text"
              value={draft.sourceUrl ?? ""}
              onChange={(e) =>
                update({ sourceUrl: e.target.value || undefined })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              placeholder="https://..."
            />
          </div>

          {/* Manifesto IIIF */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Manifesto IIIF
            </label>
            <input
              type="text"
              value={draft.iiifManifest ?? ""}
              onChange={(e) =>
                update({ iiifManifest: e.target.value || undefined })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              placeholder="https://...manifest.json"
            />
            <p className="text-xs text-gray-400 mt-1">
              Cole a URL do manifesto IIIF (pode incluir #canvas=)
            </p>
          </div>

          {/* Notação */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Notação
            </label>
            <select
              value={draft.notation}
              onChange={(e) =>
                update({
                  notation: e.target.value as ManuscriptSource["metadata"]["notation"],
                })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none bg-white"
            >
              {NOTATION_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Footer buttons */}
        <div className="flex justify-end gap-2 mt-6 pt-4 border-t border-gray-100">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Salvar
          </button>
        </div>
      </div>
    </div>
  );
}
