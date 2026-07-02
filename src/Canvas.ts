import {element, sedonClassPrefix} from './dom.js'
import type Sedon from './Sedon.js'
import Scrollable from './Scrollable.js'
import type CanvasElement from './CanvasElement.js'
import Draggable from './Draggable'

export default class Canvas extends Scrollable {
  public sedon: Sedon
  public svgLayer: SVGElement
  public attached: CanvasElement[]

  constructor(sedon: Sedon) {
    super(sedon.rootElement)
    this.sedon = sedon
    this.element.classList.add(`${sedonClassPrefix}canvas`)
    this.svgLayer = element('svg', {
      className: 'connections',
      height: 0, width: 0,
      viewBox: `0 0 0 0`
    }, this.element)
    this.attached = []
    const defs = element('defs', {}, this.svgLayer)
    const arrowHead = element('marker', {
      id: sedonClassPrefix + 'arrow-head',
      viewBox: `0 0 24 24`,
      refX: 24,
      refY: 12,
      markerWidth: 12,
      markerHeight: 12,
      orient: 'auto-start-reverse',
    }, defs)
    const arrowHeadPath = element('path', {}, arrowHead)
    setTimeout(() => {
      this.svgLayer.setAttributeNS(null, 'height', String(this.size))
      this.svgLayer.setAttributeNS(null, 'width', String(this.size))
      this.svgLayer.setAttributeNS(null, 'viewBox', `0 0 ${this.size} ${this.size}`)
      arrowHeadPath.setAttributeNS(null, 'd',
        getComputedStyle(arrowHead).getPropertyValue('--content').replace(/['"]/g, '')
      )
    })
  }

  setPositionToFitAll() {
    const dimensions = this.attached.reduce((acc, element) => {
      if (!('position' in element)) return acc
      const draggable = element as Draggable
      const bb = draggable.element.getBoundingClientRect()
      acc.minX = Math.min(acc.minX, draggable.position.x)
      acc.maxX = Math.max(acc.maxX, draggable.position.x + bb.width)
      acc.minY = Math.min(acc.minY, draggable.position.y)
      acc.maxY = Math.max(acc.maxY, draggable.position.y + bb.height)
      return acc
    }, {
      minX: Infinity,
      maxX: 0,
      minY: Infinity,
      maxY: 0,
    })

    if (dimensions.maxX < dimensions.minX || dimensions.maxY < dimensions.minY) return
    const padding = 50
    dimensions.minX -= padding
    dimensions.maxX += padding
    dimensions.minY -= padding
    dimensions.maxY += padding

    const containerBounding = this.container.getBoundingClientRect()
    const targetWidth = dimensions.maxX - dimensions.minX
    const targetHeight = dimensions.maxY - dimensions.minY
    const tagetScale = Math.min(
      containerBounding.width / targetWidth,
      containerBounding.height / targetHeight,
    )
    this.setScale(tagetScale)
    // todo put this in the middle
    this.setPosition(-dimensions.minX * tagetScale, -dimensions.minY * tagetScale)
  }

  attach(element: CanvasElement) {
    this.attached.push(element)
    this.element.append(element.element)
  }

  detach(element: CanvasElement) {
    const index = this.attached.indexOf(element)
    if (index !== -1) {
      this.attached.splice(index, 1)
      element.element.remove()
    }
  }
}
