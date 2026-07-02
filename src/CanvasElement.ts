import {element} from './dom.js'
import Canvas from './Canvas.js'

export interface CanvasElementExport {
  type: 'CanvasElement' | string
}

export default class CanvasElement {
  public element: HTMLDivElement
  public canvas: Canvas
  private _id: string = null!

  constructor() {
    this.canvas = null!
    this.element = element('div')
  }

  get id(): string {
    if (!this._id) this._id = crypto.randomUUID()
    return this._id
  }

  attachToCanvas(canvas: Canvas) {
    this.canvas = canvas
    canvas.attach(this)
  }

  delete() {
    this.canvas.detach(this)
  }

  toJSON(): CanvasElementExport {
    return {
      type: 'CanvasElement'
    }
  }

  static fromJSON(_json: CanvasElementExport) {
    return new CanvasElement()
  }
}
