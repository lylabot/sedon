import {element} from './dom'
import {getPlatform, Platform} from './platform'
import ArrowsMove from '@tabler/icons/outline/arrows-move.svg'
import Command from '@tabler/icons/outline/command.svg'
import LetterASmall from '@tabler/icons/outline/letter-a-small.svg'
import LetterCSmall from '@tabler/icons/outline/letter-c-small.svg'
import LetterLSmall from '@tabler/icons/outline/letter-l-small.svg'
import LetterRSmall from '@tabler/icons/outline/letter-r-small.svg'
import LetterTSmall from '@tabler/icons/outline/letter-t-small.svg'
import Mouse from '@tabler/icons/outline/mouse.svg'
import Option from '@tabler/icons/outline/option.svg'
import SquareLetterA from '@tabler/icons/outline/square-letter-a.svg'
import {LeftClick, toSVGElement} from './icons'

export interface Interaction {
  icons: (SVGElement | SVGElement[])[],
  hint: string,
}

export class InteractionHints {
  public element: HTMLDivElement

  constructor(interactions: Interaction[]) {
    this.element = element('div', {className: 'interaction-hints'})

    for (const interaction of interactions) {
      element('div', {
        className: 'hint',
        children: [
          ...interaction.icons.map(icon => {
            if (Array.isArray(icon)) {
              return element('div', {className: 'subgroup', children: icon})
            } else return icon
          }),
          element('span', {innerText: interaction.hint})
        ]
      }, this.element)
    }
    requestAnimationFrame(() => {
      this.element.querySelectorAll('svg').forEach(svg => {
        const bbox = svg.getBBox()
        svg.setAttributeNS(null, 'viewBox', `${Math.max(0, bbox.x - 1)} 0 ${Math.min(bbox.width + 2, 24)} 24`)
      })
    })
  }
}

const cmd: Interaction['icons'][number] = getPlatform() === Platform.MAC
  ? toSVGElement(Command)
  : [toSVGElement(LetterCSmall), toSVGElement(LetterTSmall), toSVGElement(LetterRSmall), toSVGElement(LetterLSmall)]
const alt: Interaction['icons'][number] = getPlatform() === Platform.MAC
  ? toSVGElement(Option)
  : [toSVGElement(LetterASmall), toSVGElement(LetterLSmall), toSVGElement(LetterTSmall)]

export const SedonMainHints: Interaction[] = [{
  icons: [LeftClick, toSVGElement(ArrowsMove)],
  hint: 'Pan View',
}, {
  icons: [toSVGElement(Mouse)],
  hint: 'Zoom',
}, {
  icons: [alt, LeftClick],
  hint: 'Remove Connection',
}, {
  icons: [cmd, toSVGElement(SquareLetterA)],
  hint: 'Add Node',
}]
