// src/renderer/components/slice-editor/ImageCanvas.tsx

import React, { useRef, useState } from 'react';
import { StoredImage, SyllabifiedWord, SyllableBox } from '../../lib/models';
import { EditorAction } from './editorReducer';
import { SyllableBoxOverlay } from './SyllableBoxOverlay';

interface ImageCanvasProps {
  image: StoredImage | null;
  syllableBoxes: Record<number, SyllableBox | null>;  // added
  activeSyllableIdx: number | null;                   // added
  syllableRange: { start: number; end: number } | null;
  gaps: number[];
  hoveredSyllableIdx: number | null;
  zoom: number;
  panOffset: { x: number; y: number };
  dispatch: React.Dispatch<EditorAction>;
  words?: SyllabifiedWord[];
}

export function ImageCanvas({
  image,
  syllableBoxes,
  activeSyllableIdx,
  syllableRange,
  gaps,
  hoveredSyllableIdx,
  zoom,
  panOffset,
  dispatch,
  words,
}: ImageCanvasProps) {
  const imageWrapperRef = useRef<HTMLDivElement>(null);

  // ── Draw-new-box state ─────────────────────────────────────────────────────
  const drawState = useRef<{
    startX: number;  // fraction
    startY: number;  // fraction
    live: SyllableBox | null;
  } | null>(null);
  const [liveDrawBox, setLiveDrawBox] = useState<SyllableBox | null>(null);

  // ── Compute syllable labels ────────────────────────────────────────────────
  function computeSliceLabels(): Array<{
    text: string;
    isLastOfWord: boolean;
    globalIdx: number;
    isGap: boolean;
  }> {
    if (!words || !syllableRange) return [];
    const gapSet = new Set(gaps);
    const labels: Array<{
      text: string;
      isLastOfWord: boolean;
      globalIdx: number;
      isGap: boolean;
    }> = [];
    let globalIdx = 0;
    for (let wi = 0; wi < words.length; wi++) {
      const word = words[wi];
      for (let si = 0; si < word.syllables.length; si++) {
        if (globalIdx >= syllableRange.start && globalIdx <= syllableRange.end) {
          const isLast = si === word.syllables.length - 1;
          labels.push({
            text: isLast ? word.syllables[si] : word.syllables[si] + '-',
            isLastOfWord: isLast,
            globalIdx,
            isGap: gapSet.has(globalIdx),
          });
        }
        globalIdx++;
      }
    }
    return labels;
  }

  // ── Zoom via scroll ────────────────────────────────────────────────────────
  function handleWheel(e: React.WheelEvent<HTMLDivElement>) {
    e.preventDefault();
    const delta = -e.deltaY * 0.001;
    const newZoom = Math.max(0.5, Math.min(4, zoom * (1 + delta)));
    dispatch({ type: 'SET_ZOOM', payload: newZoom });
  }

  // ── Draw-new-box pointer handlers ─────────────────────────────────────────
  function handleImagePointerDown(e: React.PointerEvent<HTMLDivElement>) {
    if (activeSyllableIdx === null) return;
    const hasBox =
      activeSyllableIdx in syllableBoxes && syllableBoxes[activeSyllableIdx] !== null;
    if (hasBox) return;  // SyllableBoxOverlay handles its own pointer events
    e.preventDefault();
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    const rect = imageWrapperRef.current!.getBoundingClientRect();
    const startX = (e.clientX - rect.left) / rect.width;
    const startY = (e.clientY - rect.top) / rect.height;
    drawState.current = { startX, startY, live: null };
    setLiveDrawBox(null);
  }

  function handleImagePointerMove(e: React.PointerEvent<HTMLDivElement>) {
    if (!drawState.current) return;
    const rect = imageWrapperRef.current!.getBoundingClientRect();
    const curX = (e.clientX - rect.left) / rect.width;
    const curY = (e.clientY - rect.top) / rect.height;
    const { startX, startY } = drawState.current;
    const x = Math.min(startX, curX);
    const y = Math.min(startY, curY);
    const w = Math.max(0.01, Math.abs(curX - startX));
    const h = Math.max(0.01, Math.abs(curY - startY));
    const box: SyllableBox = { x, y, w, h };
    drawState.current.live = box;
    setLiveDrawBox(box);
  }

  function handleImagePointerUp(e: React.PointerEvent<HTMLDivElement>) {
    if (!drawState.current || !drawState.current.live || activeSyllableIdx === null) {
      drawState.current = null;
      setLiveDrawBox(null);
      return;
    }
    (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
    const box = drawState.current.live;
    // Only commit if box is big enough (at least 2% in both dimensions)
    if (box.w >= 0.02 && box.h >= 0.02) {
      dispatch({ type: 'SET_BOX', payload: { syllableIdx: activeSyllableIdx, box } });
    }
    drawState.current = null;
    setLiveDrawBox(null);
  }

  if (!image) {
    return (
      <div className="flex items-center justify-center h-full text-gray-400">
        Nenhuma imagem carregada
      </div>
    );
  }

  const sliceLabels = computeSliceLabels();
  const totalLabels = sliceLabels.length;

  return (
    <div className="flex flex-col h-full bg-gray-100" onWheel={handleWheel}>
      {/* Labels row — clickable syllable labels at top */}
      <div className="h-8 bg-white border-b border-gray-300 flex-shrink-0 overflow-hidden">
        <div
          className="relative h-full"
          style={{ width: `${100 * zoom}%`, minWidth: '100%' }}
        >
          {sliceLabels.map((label, i) => {
            const isActive =
              activeSyllableIdx !== null && label.globalIdx === activeSyllableIdx;
            const isHovered =
              !isActive &&
              hoveredSyllableIdx !== null &&
              label.globalIdx === hoveredSyllableIdx;
            return (
              <div
                key={label.globalIdx}
                className={[
                  'absolute top-0 bottom-0 flex items-center justify-center text-sm font-medium truncate px-1 cursor-pointer',
                  label.isLastOfWord
                    ? 'border-r-2 border-gray-700'
                    : 'border-r border-gray-300',
                  isActive
                    ? 'bg-blue-500 text-white'
                    : isHovered
                    ? 'bg-yellow-200 text-yellow-900'
                    : label.isGap
                    ? 'text-gray-400 line-through hover:bg-gray-50'
                    : 'text-gray-800 hover:bg-gray-50',
                ].join(' ')}
                style={{
                  left: `${(i / totalLabels) * 100}%`,
                  width: `${(1 / totalLabels) * 100}%`,
                }}
                onClick={() =>
                  dispatch({ type: 'SET_ACTIVE_SYLLABLE', payload: label.globalIdx })
                }
                onMouseEnter={() =>
                  dispatch({ type: 'SET_HOVER', payload: label.globalIdx })
                }
                onMouseLeave={() => dispatch({ type: 'SET_HOVER', payload: null })}
              >
                {label.text}
              </div>
            );
          })}
        </div>
      </div>

      {/* Image + boxes area */}
      <div className="relative flex-1 min-h-0 overflow-auto">
        {/* Inner wrapper sized to fit width; boxes positioned relative to this */}
        <div
          ref={imageWrapperRef}
          className={[
            'relative inline-block',
            activeSyllableIdx !== null &&
            !(
              activeSyllableIdx in syllableBoxes &&
              syllableBoxes[activeSyllableIdx] !== null
            )
              ? 'cursor-crosshair'
              : 'cursor-default',
          ].join(' ')}
          style={{
            width: `${100 * zoom}%`,
            minWidth: '100%',
            transform: `translate(${panOffset.x}px, ${panOffset.y}px)`,
          }}
          onPointerDown={handleImagePointerDown}
          onPointerMove={handleImagePointerMove}
          onPointerUp={handleImagePointerUp}
        >
          <img
            src={image.dataUrl}
            alt="Manuscript"
            className="block w-full h-auto select-none pointer-events-none"
            draggable={false}
          />

          {/* SyllableBoxOverlay for active syllable that has a box */}
          {activeSyllableIdx !== null && syllableBoxes[activeSyllableIdx] != null && (
            <SyllableBoxOverlay
              box={syllableBoxes[activeSyllableIdx] as SyllableBox}
              containerRef={imageWrapperRef}
              onBoxChange={(newBox) => {
                dispatch({ type: 'SET_BOX', payload: { syllableIdx: activeSyllableIdx, box: newBox } });
              }}
              onBoxCommit={(newBox) => {
                dispatch({ type: 'SET_BOX', payload: { syllableIdx: activeSyllableIdx, box: newBox } });
              }}
              onDeleteBox={() => {
                dispatch({ type: 'DELETE_BOX', payload: { syllableIdx: activeSyllableIdx } });
              }}
            />
          )}

          {/* Live rubber-band preview while drawing */}
          {liveDrawBox && (
            <div
              className="absolute border-2 border-dashed border-blue-400 bg-blue-200/20 pointer-events-none"
              style={{
                left:   `${liveDrawBox.x * 100}%`,
                top:    `${liveDrawBox.y * 100}%`,
                width:  `${liveDrawBox.w * 100}%`,
                height: `${liveDrawBox.h * 100}%`,
              }}
            />
          )}
        </div>
      </div>
    </div>
  );
}
