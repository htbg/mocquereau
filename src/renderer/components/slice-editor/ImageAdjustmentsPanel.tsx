// src/renderer/components/slice-editor/ImageAdjustmentsPanel.tsx
//
// Painel flutuante de ajustes de imagem (Mirador-like) para o SliceEditor.
// Componente puro/controlado: recebe `adjustments` atual e reporta mudanças
// via `onUpdate(Partial<ImageAdjustments>)`. Sem estado próprio dos campos
// — a fonte de verdade fica no reducer do projeto (action
// UPDATE_LINE_ADJUSTMENTS). Phase 10 / IMG-06.

import { SlidersHorizontal, RotateCcw, RotateCw, X } from "lucide-react";
import type { ImageAdjustments } from "../../lib/models";
import {
  IMAGE_ADJUSTMENTS_DEFAULT,
  isDefaultAdjustments,
} from "../../lib/image-adjustments";

interface Props {
  adjustments?: ImageAdjustments;
  onUpdate: (partial: Partial<ImageAdjustments>) => void;
  onClose: () => void;
}

export function ImageAdjustmentsPanel({ adjustments, onUpdate, onClose }: Props) {
  const adj = adjustments ?? IMAGE_ADJUSTMENTS_DEFAULT;
  const isDefault = isDefaultAdjustments(adjustments);

  const rotate = (delta: 90 | -90) => {
    const next = ((adj.rotation + 360 + delta) % 360) as 0 | 90 | 180 | 270;
    onUpdate({ rotation: next });
  };

  return (
    <div
      className="absolute top-2 right-2 z-10 w-72 bg-white border border-gray-300 rounded shadow-lg p-3 space-y-3"
      data-image-adjustments-panel
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-800 flex items-center gap-1.5">
          <SlidersHorizontal size={14} />
          Ajustes de imagem
        </h3>
        <button
          type="button"
          onClick={onClose}
          className="text-gray-400 hover:text-gray-700"
          aria-label="Fechar"
        >
          <X size={14} />
        </button>
      </div>

      {/* Cor section */}
      <section>
        <h4 className="text-xs font-medium text-gray-500 uppercase mb-1">Cor</h4>

        {/* Brilho */}
        <div className="flex items-center gap-2 text-xs">
          <label className="w-20 text-gray-700">Brilho</label>
          <input
            type="range"
            min={0}
            max={200}
            step={1}
            value={adj.brightness}
            onChange={(e) => {
              const v = Number(e.target.value);
              if (!Number.isNaN(v)) onUpdate({ brightness: v });
            }}
            className="flex-1 accent-blue-600"
          />
          <span className="w-10 text-right text-gray-600 tabular-nums">
            {adj.brightness}%
          </span>
          <button
            type="button"
            onClick={() =>
              onUpdate({ brightness: IMAGE_ADJUSTMENTS_DEFAULT.brightness })
            }
            className="text-gray-400 hover:text-gray-700"
            aria-label="Resetar brilho"
          >
            ×
          </button>
        </div>

        {/* Contraste */}
        <div className="flex items-center gap-2 text-xs">
          <label className="w-20 text-gray-700">Contraste</label>
          <input
            type="range"
            min={0}
            max={200}
            step={1}
            value={adj.contrast}
            onChange={(e) => {
              const v = Number(e.target.value);
              if (!Number.isNaN(v)) onUpdate({ contrast: v });
            }}
            className="flex-1 accent-blue-600"
          />
          <span className="w-10 text-right text-gray-600 tabular-nums">
            {adj.contrast}%
          </span>
          <button
            type="button"
            onClick={() =>
              onUpdate({ contrast: IMAGE_ADJUSTMENTS_DEFAULT.contrast })
            }
            className="text-gray-400 hover:text-gray-700"
            aria-label="Resetar contraste"
          >
            ×
          </button>
        </div>

        {/* Saturação */}
        <div className="flex items-center gap-2 text-xs">
          <label className="w-20 text-gray-700">Saturação</label>
          <input
            type="range"
            min={0}
            max={200}
            step={1}
            value={adj.saturation}
            onChange={(e) => {
              const v = Number(e.target.value);
              if (!Number.isNaN(v)) onUpdate({ saturation: v });
            }}
            className="flex-1 accent-blue-600"
          />
          <span className="w-10 text-right text-gray-600 tabular-nums">
            {adj.saturation}%
          </span>
          <button
            type="button"
            onClick={() =>
              onUpdate({ saturation: IMAGE_ADJUSTMENTS_DEFAULT.saturation })
            }
            className="text-gray-400 hover:text-gray-700"
            aria-label="Resetar saturação"
          >
            ×
          </button>
        </div>

        {/* Grayscale */}
        <div className="flex items-center gap-2 text-xs">
          <label className="w-20 text-gray-700">Grayscale</label>
          <input
            type="range"
            min={0}
            max={100}
            step={1}
            value={adj.grayscale}
            onChange={(e) => {
              const v = Number(e.target.value);
              if (!Number.isNaN(v)) onUpdate({ grayscale: v });
            }}
            className="flex-1 accent-blue-600"
          />
          <span className="w-10 text-right text-gray-600 tabular-nums">
            {adj.grayscale}%
          </span>
          <button
            type="button"
            onClick={() =>
              onUpdate({ grayscale: IMAGE_ADJUSTMENTS_DEFAULT.grayscale })
            }
            className="text-gray-400 hover:text-gray-700"
            aria-label="Resetar grayscale"
          >
            ×
          </button>
        </div>

        {/* Negativo */}
        <label className="flex items-center gap-2 text-xs text-gray-700 mt-1">
          <input
            type="checkbox"
            checked={adj.invert}
            onChange={(e) => onUpdate({ invert: e.target.checked })}
            className="w-4 h-4 accent-blue-600"
          />
          Negativo
        </label>
      </section>

      {/* Geometria section */}
      <section>
        <h4 className="text-xs font-medium text-gray-500 uppercase mb-1">
          Geometria
        </h4>

        <div className="flex items-center gap-2 text-xs">
          <label className="w-20 text-gray-700">Girar</label>
          <button
            type="button"
            onClick={() => rotate(-90)}
            className="px-1.5 py-1 border border-gray-300 rounded hover:bg-gray-100"
            aria-label="Girar 90° anti-horário"
            title="Girar 90° ←"
          >
            <RotateCcw size={12} />
          </button>
          <span className="tabular-nums text-gray-600 w-10 text-center">
            {adj.rotation}°
          </span>
          <button
            type="button"
            onClick={() => rotate(90)}
            className="px-1.5 py-1 border border-gray-300 rounded hover:bg-gray-100"
            aria-label="Girar 90° horário"
            title="Girar 90° →"
          >
            <RotateCw size={12} />
          </button>
        </div>

        <label className="flex items-center gap-2 text-xs text-gray-700 mt-1">
          <input
            type="checkbox"
            checked={adj.flipH}
            onChange={(e) => onUpdate({ flipH: e.target.checked })}
            className="w-4 h-4 accent-blue-600"
          />
          Espelhar horizontal
        </label>

        <label className="flex items-center gap-2 text-xs text-gray-700">
          <input
            type="checkbox"
            checked={adj.flipV}
            onChange={(e) => onUpdate({ flipV: e.target.checked })}
            className="w-4 h-4 accent-blue-600"
          />
          Espelhar vertical
        </label>
      </section>

      {/* Reset button */}
      <button
        type="button"
        onClick={() => onUpdate({ ...IMAGE_ADJUSTMENTS_DEFAULT })}
        disabled={isDefault}
        className="w-full px-2 py-1.5 text-xs bg-gray-100 hover:bg-gray-200 border border-gray-300 rounded disabled:opacity-40 disabled:cursor-not-allowed"
      >
        Resetar ajustes
      </button>
    </div>
  );
}

export default ImageAdjustmentsPanel;
