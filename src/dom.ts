export const sedonClassPrefix = 'sedon-'

export function nodeListContains(nodeList: NodeList, node: Node) {
  for (let i = 0; nodeList.length > i; i++) {
    if (nodeList.item(i) === node) return node
  }
  return false
}

export function nodeIsAnyParent(node: Node, parent: ParentNode | NodeList) {
  if (!parent) throw new Error('`parent` must be a Node or a NodeList')
  let _node: Node | null = node
  while (!!_node) {
    _node = _node.parentNode
    if ('nodeType' in parent && parent.nodeType && _node === parent) return true
    if (parent instanceof NodeList && _node && nodeListContains(parent, _node)) return _node
  }
  return false
}

export function nodeIsThisOrAnyParent(node: Node, parent: ParentNode | NodeList) {
  if (parent instanceof NodeList) {
    if (nodeListContains(parent, node)) return node
    return nodeIsAnyParent(node, parent)
  }
  return node === parent || nodeIsAnyParent(node, parent)
}

type Children = Array<Node | Element> | NodeList | HTMLCollection | Node | Element

const isMultipleNodes = (children: Children): children is (Array<Node | Element> | NodeList | HTMLCollection) =>
  Array.isArray(children) || children instanceof NodeList || children instanceof HTMLCollection
const isSingleNode = (children: Children): children is (Node | Element) =>
  children instanceof Node || children instanceof Element

type HTMLAndSVGElementTagNameMap<T> = T extends keyof HTMLElementTagNameMap ? HTMLElementTagNameMap[T] : (T extends keyof SVGElementTagNameMap ? SVGElementTagNameMap[T] : never)

const svgTags = ['svg', 'path', 'marker', 'defs']

export function element<T extends keyof (HTMLElementTagNameMap & SVGElementTagNameMap)>(tag: T, attributes?: Record<string, any>, appendTo?: Node): HTMLAndSVGElementTagNameMap<T> {
  const isSvg = svgTags.includes(tag)

  const el = (isSvg
    ? document?.createElementNS('http://www.w3.org/2000/svg', tag)
    : document?.createElement(tag)) as HTMLAndSVGElementTagNameMap<T>

  if (attributes) for (const key in attributes) {
    if (!attributes.hasOwnProperty(key)) continue

    if (key === 'innerText') {
      if (el instanceof HTMLElement) el.innerText = attributes.innerText
    } else if (key === 'innerHTML') {
      el.innerHTML = attributes.innerHTML
    } else if (key === 'children') {
      if (isMultipleNodes(attributes.children)) {
        Array.from(attributes.children).forEach(child => el.appendChild(child))
      } else if (isSingleNode(attributes.children)) {
        el.appendChild(attributes.children)
      }
    } else if (key === 'className') {
      const cls = (Array.isArray(attributes[key]) ? attributes[key].filter(v => v) : attributes[key].split(' ') as string[])
        .map(cl => sedonClassPrefix + cl)
      el.classList.add(...cls)
    } else {
      if (isSvg) {
        el.setAttributeNS(null, key, attributes[key])
      } else {
        el.setAttribute(key, attributes[key])
      }
    }
  }

  if (appendTo) appendTo.appendChild(el)
  return el;
}
