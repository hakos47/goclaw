const data = [0, 0, 0, 100, 0, 0];
const max = 100;
function getY(val, max) { return 100 - (val / max) * 85 - 10; }
function getX(i) { return (i / (data.length - 1)) * 100; }
function getControlPoint(current, previous, next, reverse) {
  const p = previous || current;
  const n = next || current;
  const lengthX = n[0] - p[0];
  const lengthY = n[1] - p[1];
  const angle = Math.atan2(lengthY, lengthX);
  const length = Math.sqrt(Math.pow(lengthX, 2) + Math.pow(lengthY, 2)) * 0.15;
  return [current[0] + Math.cos(angle + (reverse ? Math.PI : 0)) * length, current[1] + Math.sin(angle + (reverse ? Math.PI : 0)) * length];
}
const points = data.map((d, i) => [getX(i), getY(d, max)]);
let dStr = `M ${points[0][0]} ${points[0][1]} `;
for (let i = 1; i < points.length; i++) {
  const p = points[i];
  const prev = points[i - 1];
  const cp1 = getControlPoint(prev, points[i - 2], p, false);
  const cp2 = getControlPoint(p, prev, points[i + 1], true);
  dStr += `C ${cp1[0]} ${cp1[1]}, ${cp2[0]} ${cp2[1]}, ${p[0]} ${p[1]} `;
}
console.log(dStr);
