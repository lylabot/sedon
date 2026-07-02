import {element, nodeIsThisOrAnyParent, sedonClassPrefix} from './dom.js'
import Sedon from './Sedon.js'
import {Position} from './Scrollable.js'

export interface KeyboardShort {
  key: string,
  shiftKey?: boolean
  ctrlKey?: boolean
  altKey?: boolean
  metaKey?: boolean
}

// Grace area mechanism from kobalte
// https://github.com/kobaltedev/kobalte/blob/main/packages/core/src/menu/menu.tsx#L185
// https://github.com/kobaltedev/kobalte/blob/main/packages/core/src/menu/utils.ts

type Polygon = Position[]

export default abstract class Menu {
  public sedon: Sedon
  public element: HTMLDivElement
  public list: HTMLUListElement
  public keyboardShortcut: KeyboardShort | null
  readonly subMenuDirection = 'right'
  public graceArea: Polygon | null

  protected constructor(sedon: Sedon) {
    this.sedon = sedon
    this.list = element('ul')
    this.element = element('div', {className: 'menu', children: this.list}, this.sedon.rootElement.parentNode as ParentNode)
    this.keyboardShortcut = null
    this.graceArea = null

    let cursorPosition: Position = {x: 0, y: 0}
    let pointerDirection: 'right' | 'left' = null!

    const hoveredClass = `${sedonClassPrefix}hovered`

    window?.addEventListener('mousemove', e => {
      if (e.clientX !== cursorPosition.x) {
        pointerDirection = e.clientX > cursorPosition.x ? 'right' : 'left'
      }
      cursorPosition = {x: e.clientX, y: e.clientY}
      const isMovingTowards = pointerDirection === this.subMenuDirection
      const hoveredElement = document.elementFromPoint(cursorPosition.x, cursorPosition.y)
      if (isMovingTowards && this.isInGraceArea(cursorPosition)) {
        const hoveredItem = this.list.querySelector(`li.${hoveredClass}`)
        const isPointerOverSubMenu = !!hoveredElement && !!hoveredItem && !!nodeIsThisOrAnyParent(hoveredElement, hoveredItem)
        if (isPointerOverSubMenu) {
          this.graceArea = null
        } else return
      }
      const items = this.list.querySelectorAll('li')
      const hoveredElementIsItem = hoveredElement && nodeIsThisOrAnyParent(hoveredElement, items)
      const hoveredItem = (hoveredElementIsItem === true ? hoveredElement : hoveredElementIsItem) ?? false
      let subMenu = null
      if (hoveredItem instanceof HTMLElement) {
        hoveredItem.classList.add(hoveredClass)
        subMenu = hoveredItem.querySelector('ul')
      }
      for (const item of items) {
        if (item === hoveredItem) continue
        item.classList.remove(hoveredClass)
      }
      if (subMenu) {
        this.graceArea = []
        this.graceArea.push({x: cursorPosition.x - 5, y: cursorPosition.y})
        const contentRect = subMenu.getBoundingClientRect()
        this.graceArea.push({x: contentRect.left, y: contentRect.top})
        this.graceArea.push({x: contentRect.right, y: contentRect.top})
        this.graceArea.push({x: contentRect.right, y: contentRect.bottom})
        this.graceArea.push({x: contentRect.left, y: contentRect.bottom})
      } else this.graceArea = null
    })

    window?.addEventListener('mousedown', e => {
      if (!nodeIsThisOrAnyParent((e.target as HTMLDivElement), this.element))
        this.hide()
    })

    window?.addEventListener('keydown', e => {
      if (!this.keyboardShortcut) return
      const elementUnderCursor = document.elementFromPoint(cursorPosition.x, cursorPosition.y)
      if (!elementUnderCursor || !nodeIsThisOrAnyParent(elementUnderCursor, this.sedon.rootElement)) return
      for (const _prop in this.keyboardShortcut) {
        const prop = _prop as keyof KeyboardShort
        if (e[prop] !== (this.keyboardShortcut[prop] ?? false)) return
      }
      e.preventDefault()
      this.show({
        x: cursorPosition.x - 20 /* padding of container */,
        y: cursorPosition.y - 20
      })
    })
  }

  isInGraceArea(point: Position) {
    if (!this.graceArea || this.graceArea.length < 3) return false
    let inside = false

    let areaVertex0 = this.graceArea[0]
    let areaVertex1

    for (let i = 1; i <= this.graceArea.length; i++) {
      areaVertex1 = this.graceArea[i % this.graceArea.length]

      if (
        point.y > Math.min(areaVertex0.y, areaVertex1.y) &&
        point.y <= Math.max(areaVertex0.y, areaVertex1.y) &&
        point.x <= Math.max(areaVertex0.x, areaVertex1.x)
      ) {
        if (areaVertex0.x === areaVertex1.x) inside = !inside
        else {
          const x_intersection = ((point.y - areaVertex0.y) * (areaVertex1.x - areaVertex0.x)) / (areaVertex1.y - areaVertex0.y) + areaVertex0.x
          if (point.x <= x_intersection) inside = !inside
        }
      }

      areaVertex0 = areaVertex1
    }

    return inside
  }

  show(position: Position) {
    this.element.style.left = position.x + 'px'
    this.element.style.top = position.y + 'px'
    this.element.classList.add(`${sedonClassPrefix}visible`)
  }

  hide() {
    this.element.classList.remove(`${sedonClassPrefix}visible`)
  }

  addSection(label: string | [SVGElement, string], section?: HTMLLIElement) {
    return this.createListItem(label, section, true)
  }

  addItem(label: string | [SVGElement, string], section?: HTMLLIElement) {
    return this.createListItem(label, section, false)
  }

  createListItem = (label: string | [SVGElement, string], section?: HTMLLIElement, isParent?: boolean) => {
    let icon: SVGElement | null = null
    if (Array.isArray(label))
      [icon, label] = label
    const data: Record<string, any> = {
      className: label.toLowerCase().replace(/\s/g, '-'),
    }
    if (icon) {
      if (!data.children) {
        data.children = []
      } else if (!Array.isArray(data.children)) {
        data.children = [data.children]
      }
      data.children.push(icon)
      data.children.push(element('span', {innerText: label}))
    } else {
      data.innerText = label
    }
    const li = element('li', data, section?.querySelector('ul') ?? this.list)
    if (isParent) element('ul', {}, li)
    return li
  }

  createListSeparator = (label?: string, section?: HTMLLIElement) => {
    return element('li', {
      className: sedonClassPrefix + 'separator',
      children: [
        label && element('span', {innerText: label}),
        element('hr')
      ].filter(v => !!v)
    }, section?.querySelector('ul') ?? this.list)
  }
}
