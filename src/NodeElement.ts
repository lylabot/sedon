import {sedonClassPrefix} from './dom.js'
import Wire, {ChangeSignal} from './Wire.js'
import type GraphNode from './GraphNode.js'
import type {ConnectorSignals} from './Connector.js'

export interface NodeElementExport {
  id: string,
  type: 'NodeElement' | string
}

export abstract class NodeElement {
  private readonly _element: HTMLLIElement
  public wire: Wire<ConnectorSignals | ChangeSignal>
  public parent: GraphNode | null
  private _id: string = null!
  private _active: boolean = true

  constructor(label: string) {
    this._element = document.createElement('li')
    const labelEl = document.createElement('span')
    labelEl.classList.add(`${sedonClassPrefix}element-label`)
    labelEl.innerText = label
    this._element.append(labelEl)
    this.wire = new Wire()
    this.parent = null
  }

  setLabel(label: string) {
    const labelEl = this._element.getElementsByClassName(`${sedonClassPrefix}element-label`)[0] as HTMLSpanElement
    if (labelEl) labelEl.innerText = label
  }

  get id(): string {
    if (!this._id) this._id = crypto.randomUUID()
    return this._id
  }

  setParent(parent: GraphNode) {
    this.parent = parent
  }

  get element() {
    return this._element
  }

  activate() {
    if (this._active) return false
    this._element.style.display = ''
    this._active = true
    return true
  }

  deactivate() {
    if (!this._active) return false
    this._element.style.display = 'none'
    this._active = false
    return true
  }

  onMount() {
    return
  }

  toJSON(): NodeElementExport {
    return {
      id: this.id,
      type: 'NodeElement',
    }
  }

  applyJSON(json: NodeElementExport) {
    this._id = json.id
  }
}
