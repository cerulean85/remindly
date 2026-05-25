declare module "d3-force-3d" {
  interface PositioningForce {
    strength(s: number): PositioningForce
    x?(accessor: number | ((d: unknown) => number)): PositioningForce
    y?(accessor: number | ((d: unknown) => number)): PositioningForce
    (alpha: number): void
  }
  interface CollideForce<N> {
    radius(r: number | ((d: N) => number)): CollideForce<N>
    strength(s: number): CollideForce<N>
    iterations(n: number): CollideForce<N>
    (alpha: number): void
  }
  export function forceX(x?: number | ((d: unknown) => number)): PositioningForce
  export function forceY(y?: number | ((d: unknown) => number)): PositioningForce
  export function forceCollide<N = unknown>(
    radius?: number | ((d: N) => number),
  ): CollideForce<N>
}
