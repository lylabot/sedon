import Menu from '../Menu.js'
import Sedon from '../Sedon.js'
import GraphNode from '../GraphNode.js'
import {element, sedonClassPrefix} from '../dom.js'
import {ChangeSignal} from '../Wire.js'
import {Document} from 'flexsearch'
import {Position} from '../Scrollable'

interface Class<T> {
  label: string
  id?: string
  keywords?: string[]

  new(...args: unknown[]): T
}

export default class AddMenu extends Menu {
  private search: Document
  private idElementMap: Map<string, HTMLLIElement>
  private localSectionForSearch: HTMLLIElement
  private closeSearch: () => void

  constructor(sedon: Sedon) {
    super(sedon)
    this.element.classList.add(`${sedonClassPrefix}add-menu`)
    this.keyboardShortcut = {
      key: 'a',
      metaKey: true,
    }
    this.localSectionForSearch = this.addSection('')
    this.localSectionForSearch.remove()
    this.idElementMap = new Map()
    this.search = new Document({
      document: {
        id: 'id',
        store: ['label'],
        index: [{
          field: 'label',
          tokenize: 'full',
        }, {
          field: 'keywords',
          tokenize: 'full',
        }]
      }
    })
    const searchItem = this.addItem(['SearchOutline', 'Search'])
    this.createListSeparator()
    this.closeSearch = () => 0
    const activateSearch = () => {
      const label = searchItem.querySelector(`span`) as HTMLSpanElement | null
      if (!label) return
      const searchBar = element('input', {
        type: 'search',
        className: ['label', 'input']
      })
      label.replaceWith(searchBar)
      searchBar.focus()
      const originalItems = Array.from(this.list.children).slice(2) as HTMLLIElement[]
      for (const originalItem of originalItems) originalItem.remove()
      let searchResultItems: HTMLLIElement[] = []
      this.closeSearch = () => {
        searchBar.replaceWith(label)
        searchBar.remove()
        for (const searchItem of searchResultItems) searchItem.remove()
        this.list.append(...originalItems)
      }
      searchBar.addEventListener('input', () => {
        const results = this.search.search({
          query: searchBar.value,
          limit: 10,
          merge: true,
        })
        for (const searchItem of searchResultItems) searchItem.remove()
        searchResultItems = results
          .map(item => this.idElementMap.get(String(item.id)))
          .filter(item => item !== undefined)
        this.list.append(...searchResultItems)
      })
    }
    searchItem.addEventListener('click', () => activateSearch())
    // todo support just starting to type
  }

  show(position: Position) {
    super.show(position)
    this.closeSearch()
  }

  addNodeType(nodeData: Class<GraphNode>, section: HTMLLIElement) {
    const menuItemElement = this.createListItem(nodeData.label, section, false)
    const menuItemElementForSearch = this.createListItem(nodeData.label, this.localSectionForSearch, false)
    const onClick = (e: MouseEvent) => {
      const canvasPosition = this.sedon.canvas.element.getBoundingClientRect()
      const node = new nodeData()
      node.setPosition(
        (e.clientX - canvasPosition.x) / this.sedon.canvas.scale,
        (e.clientY - canvasPosition.y) / this.sedon.canvas.scale
      )
      node.attachToCanvas(this.sedon.canvas)
      this.sedon.wire.dispatch(new ChangeSignal()) // todo: tree change signal
      this.hide()
    }
    menuItemElement.addEventListener('click', onClick)
    menuItemElementForSearch.addEventListener('click', onClick)
    this.idElementMap.set(nodeData.id as string, menuItemElementForSearch)
    this.search.add({
      id: nodeData.id as string,
      label: nodeData.label,
      keywords: nodeData.keywords?.join(' ') ?? '',
    })
    return menuItemElement
  }
}
