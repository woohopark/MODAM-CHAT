export function element<T extends HTMLElement>(id: string, type: { new (): T }): T {
  const target = document.getElementById(id);
  if (!(target instanceof type)) throw new Error(`Missing or invalid element: ${id}`);
  return target;
}

export function icon(name: string): SVGSVGElement {
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  const use = document.createElementNS('http://www.w3.org/2000/svg', 'use');
  use.setAttribute('href', `#${name}`);
  svg.append(use);
  return svg;
}
