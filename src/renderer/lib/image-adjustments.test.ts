// src/renderer/lib/image-adjustments.test.ts
//
// Testes exaustivos para os helpers de Phase 10 / IMG-06.
// Inclui round-trip invariant `invert ∘ apply = identity` para as 16
// combinações (rotation × flipH × flipV) em 5 sample points.
import { describe, it, expect } from "vitest";
import type { ImageAdjustments, SyllableBox } from "./models";
import {
  IMAGE_ADJUSTMENTS_DEFAULT,
  isDefaultAdjustments,
  buildImageFilter,
  buildImageTransform,
  applyGeometricTransform,
  invertGeometricTransform,
} from "./image-adjustments";

const TOL = 9; // casas decimais para toBeCloseTo (≈ 1e-9)

/**
 * Aplica a transformação geométrica a um ponto (em vez de um box) usando
 * um box degenerado w=h=0, que retorna x/y já transformados.
 */
function applyPointForTest(
  pt: { xFrac: number; yFrac: number },
  adj: ImageAdjustments,
): { xFrac: number; yFrac: number } {
  const out = applyGeometricTransform(
    { x: pt.xFrac, y: pt.yFrac, w: 0, h: 0 },
    adj,
  );
  return { xFrac: out.x, yFrac: out.y };
}

describe("isDefaultAdjustments", () => {
  it("retorna true para undefined", () => {
    expect(isDefaultAdjustments(undefined)).toBe(true);
  });
  it("retorna true para valor all-default", () => {
    expect(isDefaultAdjustments(IMAGE_ADJUSTMENTS_DEFAULT)).toBe(true);
  });
  it("retorna true para cópia all-default", () => {
    expect(isDefaultAdjustments({ ...IMAGE_ADJUSTMENTS_DEFAULT })).toBe(true);
  });
  it("retorna false se brightness diferente", () => {
    expect(
      isDefaultAdjustments({ ...IMAGE_ADJUSTMENTS_DEFAULT, brightness: 150 }),
    ).toBe(false);
  });
  it("retorna false se contrast diferente", () => {
    expect(
      isDefaultAdjustments({ ...IMAGE_ADJUSTMENTS_DEFAULT, contrast: 80 }),
    ).toBe(false);
  });
  it("retorna false se saturation diferente", () => {
    expect(
      isDefaultAdjustments({ ...IMAGE_ADJUSTMENTS_DEFAULT, saturation: 0 }),
    ).toBe(false);
  });
  it("retorna false se grayscale diferente", () => {
    expect(
      isDefaultAdjustments({ ...IMAGE_ADJUSTMENTS_DEFAULT, grayscale: 50 }),
    ).toBe(false);
  });
  it("retorna false se invert=true", () => {
    expect(
      isDefaultAdjustments({ ...IMAGE_ADJUSTMENTS_DEFAULT, invert: true }),
    ).toBe(false);
  });
  it("retorna false se rotation=90", () => {
    expect(
      isDefaultAdjustments({ ...IMAGE_ADJUSTMENTS_DEFAULT, rotation: 90 }),
    ).toBe(false);
  });
  it("retorna false se flipH=true", () => {
    expect(
      isDefaultAdjustments({ ...IMAGE_ADJUSTMENTS_DEFAULT, flipH: true }),
    ).toBe(false);
  });
  it("retorna false se flipV=true", () => {
    expect(
      isDefaultAdjustments({ ...IMAGE_ADJUSTMENTS_DEFAULT, flipV: true }),
    ).toBe(false);
  });
});

describe("buildImageFilter", () => {
  it("retorna undefined para undefined", () => {
    expect(buildImageFilter(undefined)).toBeUndefined();
  });
  it("retorna undefined para all-default", () => {
    expect(buildImageFilter(IMAGE_ADJUSTMENTS_DEFAULT)).toBeUndefined();
  });
  it("retorna undefined quando só geometria está alterada (cor default)", () => {
    expect(
      buildImageFilter({
        ...IMAGE_ADJUSTMENTS_DEFAULT,
        rotation: 90,
        flipH: true,
      }),
    ).toBeUndefined();
  });
  it("começa com brightness quando brightness=150", () => {
    const s = buildImageFilter({ ...IMAGE_ADJUSTMENTS_DEFAULT, brightness: 150 });
    expect(s).toBeDefined();
    expect(s!.startsWith("brightness(150%)")).toBe(true);
  });
  it("inclui invert(1) quando invert=true", () => {
    const s = buildImageFilter({ ...IMAGE_ADJUSTMENTS_DEFAULT, invert: true });
    expect(s).toBeDefined();
    expect(s).toContain("invert(1)");
  });
  it("inclui invert(0) quando invert=false (mas outra cor mudou)", () => {
    const s = buildImageFilter({ ...IMAGE_ADJUSTMENTS_DEFAULT, contrast: 120 });
    expect(s).toBeDefined();
    expect(s).toContain("invert(0)");
  });
  it("contém os 5 componentes quando qualquer cor muda", () => {
    const s = buildImageFilter({ ...IMAGE_ADJUSTMENTS_DEFAULT, grayscale: 50 })!;
    expect(s).toContain("brightness(100%)");
    expect(s).toContain("contrast(100%)");
    expect(s).toContain("saturate(100%)");
    expect(s).toContain("grayscale(50%)");
    expect(s).toContain("invert(0)");
  });
});

describe("buildImageTransform", () => {
  it("retorna undefined para undefined", () => {
    expect(buildImageTransform(undefined)).toBeUndefined();
  });
  it("retorna undefined para all-default", () => {
    expect(buildImageTransform(IMAGE_ADJUSTMENTS_DEFAULT)).toBeUndefined();
  });
  it("retorna undefined quando só cor mudou (geometria default)", () => {
    expect(
      buildImageTransform({
        ...IMAGE_ADJUSTMENTS_DEFAULT,
        brightness: 150,
        invert: true,
      }),
    ).toBeUndefined();
  });
  it("retorna rotate(90deg) scaleX(1) scaleY(1) para rotation=90", () => {
    expect(
      buildImageTransform({ ...IMAGE_ADJUSTMENTS_DEFAULT, rotation: 90 }),
    ).toBe("rotate(90deg) scaleX(1) scaleY(1)");
  });
  it("usa scaleX(-1) para flipH=true", () => {
    const s = buildImageTransform({ ...IMAGE_ADJUSTMENTS_DEFAULT, flipH: true })!;
    expect(s).toContain("scaleX(-1)");
    expect(s).toContain("scaleY(1)");
  });
  it("usa scaleY(-1) para flipV=true", () => {
    const s = buildImageTransform({ ...IMAGE_ADJUSTMENTS_DEFAULT, flipV: true })!;
    expect(s).toContain("scaleY(-1)");
    expect(s).toContain("scaleX(1)");
  });
  it("combina rotation=180 + flipH corretamente", () => {
    const s = buildImageTransform({
      ...IMAGE_ADJUSTMENTS_DEFAULT,
      rotation: 180,
      flipH: true,
    })!;
    expect(s).toContain("rotate(180deg)");
    expect(s).toContain("scaleX(-1)");
    expect(s).toContain("scaleY(1)");
  });
  it("mantém ordem consistente rotate → scaleX → scaleY", () => {
    const s = buildImageTransform({
      ...IMAGE_ADJUSTMENTS_DEFAULT,
      rotation: 270,
      flipH: true,
      flipV: true,
    })!;
    expect(s).toBe("rotate(270deg) scaleX(-1) scaleY(-1)");
  });
});

describe("applyGeometricTransform (box)", () => {
  it("é identidade para default", () => {
    const box: SyllableBox = { x: 0.1, y: 0.2, w: 0.3, h: 0.4 };
    expect(applyGeometricTransform(box, IMAGE_ADJUSTMENTS_DEFAULT)).toEqual(box);
  });
  it("é identidade para undefined", () => {
    const box: SyllableBox = { x: 0.1, y: 0.2, w: 0.3, h: 0.4 };
    expect(applyGeometricTransform(box, undefined)).toEqual(box);
  });
  it("rotation=90 troca w/h (horizontal → vertical)", () => {
    const box: SyllableBox = { x: 0, y: 0, w: 0.5, h: 0.2 };
    const out = applyGeometricTransform(box, {
      ...IMAGE_ADJUSTMENTS_DEFAULT,
      rotation: 90,
    });
    expect(out.w).toBeCloseTo(0.2, TOL);
    expect(out.h).toBeCloseTo(0.5, TOL);
  });
  it("rotation=180 preserva w/h mas espelha posição", () => {
    const box: SyllableBox = { x: 0.1, y: 0.2, w: 0.3, h: 0.4 };
    const out = applyGeometricTransform(box, {
      ...IMAGE_ADJUSTMENTS_DEFAULT,
      rotation: 180,
    });
    expect(out.w).toBeCloseTo(0.3, TOL);
    expect(out.h).toBeCloseTo(0.4, TOL);
    // canto (0.1, 0.2) passa a (1 - 0.1 - 0.3, 1 - 0.2 - 0.4) = (0.6, 0.4)
    expect(out.x).toBeCloseTo(0.6, TOL);
    expect(out.y).toBeCloseTo(0.4, TOL);
  });
  it("flipH espelha horizontalmente mantendo dimensões", () => {
    const box: SyllableBox = { x: 0.1, y: 0.2, w: 0.3, h: 0.4 };
    const out = applyGeometricTransform(box, {
      ...IMAGE_ADJUSTMENTS_DEFAULT,
      flipH: true,
    });
    expect(out.w).toBeCloseTo(0.3, TOL);
    expect(out.h).toBeCloseTo(0.4, TOL);
    expect(out.x).toBeCloseTo(1 - 0.1 - 0.3, TOL); // 0.6
    expect(out.y).toBeCloseTo(0.2, TOL);
  });
});

describe("invertGeometricTransform (point)", () => {
  it("é identidade para default", () => {
    const pt = { xFrac: 0.3, yFrac: 0.7 };
    expect(invertGeometricTransform(pt, IMAGE_ADJUSTMENTS_DEFAULT)).toEqual(pt);
  });
  it("é identidade para undefined", () => {
    const pt = { xFrac: 0.3, yFrac: 0.7 };
    expect(invertGeometricTransform(pt, undefined)).toEqual(pt);
  });
});

describe("round-trip: invertGeometricTransform ∘ applyPoint = identity (16 combos)", () => {
  const rotations: Array<0 | 90 | 180 | 270> = [0, 90, 180, 270];
  const flips = [false, true];
  const samples: Array<{ xFrac: number; yFrac: number }> = [
    { xFrac: 0, yFrac: 0 },
    { xFrac: 1, yFrac: 1 },
    { xFrac: 0.5, yFrac: 0.5 },
    { xFrac: 0.3, yFrac: 0.7 },
    { xFrac: 0.25, yFrac: 0.8 },
  ];
  for (const rotation of rotations) {
    for (const flipH of flips) {
      for (const flipV of flips) {
        const adj: ImageAdjustments = {
          ...IMAGE_ADJUSTMENTS_DEFAULT,
          rotation,
          flipH,
          flipV,
        };
        it(`rotation=${rotation} flipH=${flipH} flipV=${flipV}`, () => {
          for (const pt of samples) {
            const visual = applyPointForTest(pt, adj);
            const back = invertGeometricTransform(visual, adj);
            expect(back.xFrac).toBeCloseTo(pt.xFrac, TOL);
            expect(back.yFrac).toBeCloseTo(pt.yFrac, TOL);
          }
        });
      }
    }
  }
});

describe("round-trip: applyPoint ∘ invertGeometricTransform = identity (reverse direction)", () => {
  // Sanidade adicional: a direção reversa (partir de visual, passar pelo
  // invert, reaplicar) também deve fechar.
  const rotations: Array<0 | 90 | 180 | 270> = [0, 90, 180, 270];
  const flips = [false, true];
  const samples: Array<{ xFrac: number; yFrac: number }> = [
    { xFrac: 0.2, yFrac: 0.9 },
    { xFrac: 0.75, yFrac: 0.15 },
  ];
  for (const rotation of rotations) {
    for (const flipH of flips) {
      for (const flipV of flips) {
        const adj: ImageAdjustments = {
          ...IMAGE_ADJUSTMENTS_DEFAULT,
          rotation,
          flipH,
          flipV,
        };
        it(`reverse rotation=${rotation} flipH=${flipH} flipV=${flipV}`, () => {
          for (const visual of samples) {
            const canonical = invertGeometricTransform(visual, adj);
            const forward = applyPointForTest(canonical, adj);
            expect(forward.xFrac).toBeCloseTo(visual.xFrac, TOL);
            expect(forward.yFrac).toBeCloseTo(visual.yFrac, TOL);
          }
        });
      }
    }
  }
});
