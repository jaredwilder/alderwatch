// Shared deterministic terrain contract, independent of rendering and physics.
export const roadX = (z: number) => Math.sin(z * .045) * 4;
export function height(x: number, z: number) {
  // The old 300 m rim made the original 768 m terrain feel intentionally
  // enclosed. The expanded March keeps that terrain vocabulary but moves the
  // natural high-country wall far beyond the new outer regions.
  const rim=Math.max(0,(Math.max(Math.abs(x),Math.abs(z))-630)/105);
  const outer=1.1*Math.sin(x*.012)*Math.cos(z*.014)+.55*Math.sin((x-z)*.021);
  return rim*rim*34+outer+.6*Math.sin(x*.058)+.8*Math.cos(z*.057)+.48*Math.sin((x+z)*.1)
    +3.8*Math.exp(-Math.pow((z-20)/23,2))-3*Math.exp(-Math.pow((x+31)/14,2)-Math.pow((z+12)/31,2))
    +Math.max(0,Math.abs(x)-63)*.026;
}
