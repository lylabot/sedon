export const LeftClick = toSVGElement(`
<svg
  xmlns="http://www.w3.org/2000/svg"
  width="24"
  height="24"
  viewBox="0 0 24 24"
  fill="none"
  stroke="currentColor"
  stroke-width="2"
  stroke-linecap="round"
  stroke-linejoin="round"
  class="icon icon-tabler icons-tabler-outline icon-tabler-arrows-move"
>
<path d="M5 7C5 4.23858 7.23858 2 10 2V2C11.1046 2 12 2.89543 12 4V9C12 10.1046 11.1046 11 10 11H7C5.89543 11 5 10.1046 5 9V7Z" fill="currentColor" /><path d="M14 3C15.0609 3 16.0783 3.42143 16.8284 4.17157C17.5786 4.92172 18 5.93913 18 7V11V17C18 18.0609 17.5786 19.0783 16.8284 19.8284C16.0783 20.5786 15.0609 21 14 21H10C8.93913 21 7.92172 20.5786 7.17157 19.8284C6.42143 19.0783 6 18.0609 6 17V13" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" /><path d="M14 10L18 10" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
</svg>
`)

export const RightClick = toSVGElement(`
<svg
  xmlns="http://www.w3.org/2000/svg"
  width="24"
  height="24"
  viewBox="0 0 24 24"
  fill="none"
  stroke="currentColor"
  stroke-width="2"
  stroke-linecap="round"
  stroke-linejoin="round"
  class="icon icon-tabler icons-tabler-outline icon-tabler-arrows-move"
>
<path d="M18 7C18 4.23858 15.7614 2 13 2V2C11.8954 2 11 2.89543 11 4V9C11 10.1046 11.8954 11 13 11H16C17.1046 11 18 10.1046 18 9V7Z" fill="currentColor"/><path d="M9 3C7.93913 3 6.92172 3.42143 6.17157 4.17157C5.42143 4.92172 5 5.93913 5 7V11V17C5 18.0609 5.42143 19.0783 6.17157 19.8284C6.92172 20.5786 7.93913 21 9 21H13C14.0609 21 15.0783 20.5786 15.8284 19.8284C16.5786 19.0783 17 18.0609 17 17V13" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><path d="M9 10L5 10" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
</svg>
`)

export function toSVGElement(svgString: string): SVGElement {
  const div = document.createElement('div')
  div.innerHTML = svgString
  return div.firstChild as SVGElement
}
