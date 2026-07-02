import {element} from './dom.js'

export interface Position {
  x: number
  y: number
}

export default class Scrollable {
  public element: HTMLElement
  public container: HTMLElement
  public position: Position
  public size: number
  public scale: number

  constructor(attachTo: HTMLElement) {
    this.element = element('div', {}, attachTo)
    if (!this.element.parentElement) throw new Error('Scrollable couldn\'t be attached to element')
    this.container = this.element.parentElement

    this.size = 0
    this.position = {x: 0, y: 0}
    this.scale = 1

    setTimeout(() => {
      this.size = Math.min(this.element.getBoundingClientRect().width, this.element.getBoundingClientRect().height)
      this.setPositionToOrigin()
    })

    let previousDimensions = this.container.getBoundingClientRect()
    new ResizeObserver(() => {
      window?.requestAnimationFrame(() => {
        const currentDimensions = this.container.getBoundingClientRect()
        this.position.x = this.position.x - previousDimensions.width / 2 + currentDimensions.width / 2
        this.position.y = this.position.y - previousDimensions.height / 2 + currentDimensions.height / 2
        previousDimensions = currentDimensions
        this.clippedScroll()
      })
    }).observe(this.container)

    // trackpad panning and pinching
    this.element.addEventListener('wheel', e => {
      e.preventDefault();
      window?.requestAnimationFrame(() => {
        const speed = 1
        const currentPosition = this.position
        const currentScale = this.scale
        if (e.ctrlKey) {
          const containerBounding = this.container.getBoundingClientRect()
          const normalisedCursor = {
            x: e.clientX - containerBounding.x,
            y: e.clientY - containerBounding.y,
          }
          const zeroCursorDelta = {
            x: normalisedCursor.x - currentPosition.x,
            y: normalisedCursor.y - currentPosition.y
          }
          this.setScale(currentScale - e.deltaY * .02)
          const newScale = this.scale
          const factor = newScale / currentScale
          this.setPosition(
            normalisedCursor.x - (zeroCursorDelta.x * factor),
            normalisedCursor.y - (zeroCursorDelta.y * factor),
          )
        } else {
          this.setPosition(
            currentPosition.x - e.deltaX * speed,
            currentPosition.y - e.deltaY * speed
          )
        }
      })
    })

    // todo: scaling with mousewheel

    // per click
    this.element.addEventListener('mousedown', e => { // todo test with mouse
      if (!e.altKey) return
      document.onselectstart = function () {
        return false
      }
      document.body.style.cursor = 'move';

      const startPosition = {x: e.clientX, y: e.clientY},
        currentPosition = this.position

      const drag = (e: MouseEvent) => {
        window?.requestAnimationFrame(() => {
          const newPosition = {x: e.clientX, y: e.clientY}
          this.setPosition(
            currentPosition.x - (startPosition.x - newPosition.x),
            currentPosition.y - (startPosition.y - newPosition.y)
          )
        })
      }

      const stop = () => {
        this.element.removeEventListener('mousemove', drag)
        this.element.removeEventListener('mouseup', stop)
        document.body.style.cursor = ''
      }

      this.element.addEventListener('mousemove', drag)
      this.element.addEventListener('mouseup', stop)
    })
  }

  setPosition(x: number, y: number) {
    this.position.x = x
    this.position.y = y
    this.clippedScroll()
  }

  setScale(scale: number) {
    this.scale = Math.min(2, Math.max(0.2, scale))
    this.clippedScroll()
  }

  updateTransform() {
    this.element.style.transform = `translate(${this.position.x}px, ${this.position.y}px) scale(${this.scale})`
  }

  setPositionToOrigin() {
    const containerBounding = this.container.getBoundingClientRect()
    const x = this.size / -2 + containerBounding.width / 2
    const y = this.size / -2 + containerBounding.height / 2
    this.setPosition(x, y)
  }

  private clippedScroll() {
    const elementBounding = this.element.getBoundingClientRect()
    const containerBounding = this.container.getBoundingClientRect()
    const currentPosition = this.position

    // const unscaledContainerHeight = elementBounding.height / this.scale

    currentPosition.x = Math.min(currentPosition.x, 0)
    currentPosition.x = Math.max(currentPosition.x, containerBounding.width - elementBounding.width)
    currentPosition.y = Math.min(currentPosition.y, 0)
    currentPosition.y = Math.max(currentPosition.y, containerBounding.height - elementBounding.height)
    // currentPosition.y = Math.min(currentPosition.y, ((elementBounding.height - unscaledContainerHeight) / 2))
    // currentPosition.y = Math.max(currentPosition.y, containerBounding.height - ((unscaledContainerHeight + elementBounding.height) / 2)) // yea, idk

    this.updateTransform()
  }
}
