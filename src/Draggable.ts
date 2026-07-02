import CanvasElement, {CanvasElementExport} from './CanvasElement.js'
import {Position} from './Scrollable.js'
import Wire, {ChangeSignal, Signal, TranslateSignal} from './Wire.js'

export interface DraggableExport extends CanvasElementExport {
  type: 'Draggable' | string
  position: Position
}

export default class Draggable extends CanvasElement {
  public position: Position
  public wire: Wire<TranslateSignal | ChangeSignal | Signal>

  constructor() {
    super()

    this.position = {x: 0, y: 0}
    this.wire = new Wire()

    this.element.setAttribute('tabindex', '0')
    this.element.addEventListener('keydown', (e) => {
      if (e.key !== 'Backspace' && e.key !== 'Delete') return
      this.delete()
      this.canvas.sedon.rootElement.focus()
    })
    this.element.addEventListener('mousedown', mouseDownEvent => {
      if (mouseDownEvent.altKey) return
      document.onselectstart = function () {
        return false;
      }

      const initialX = this.position.x
      const initialY = this.position.y

      const drag = (dragEvent: MouseEvent) => {
        window?.requestAnimationFrame(() => {
          if (!this.element.matches(':focus')) return stop()
          this.setPosition(
            initialX + (dragEvent.clientX - mouseDownEvent.clientX) / this.canvas.scale,
            initialY + (dragEvent.clientY - mouseDownEvent.clientY) / this.canvas.scale
          )
          // update connection paths
          this.onDrag()
        })
      }

      const stop = () => {
        this.canvas.element.removeEventListener('mousemove', drag)
        this.canvas.element.removeEventListener('mouseup', stop)
      }

      this.canvas.element.addEventListener('mousemove', drag)
      this.canvas.element.addEventListener('mouseup', stop)
    })
  }

  setPosition(x: number, y: number) {
    this.position.x = x
    this.position.y = y
    this.element.style.transform = `translate(${x}px, ${y}px)`
    this.wire.dispatch(new TranslateSignal(this.position))
  }

  protected onDrag() {
    // do nothing
  }

  toJSON(): DraggableExport {
    return {
      type: 'Draggable',
      position: {...this.position}
    }
  }

  static fromJSON(json: DraggableExport) {
    const draggable = new Draggable()
    draggable.setPosition(json.position.x, json.position.y)
    return draggable
  }
}
