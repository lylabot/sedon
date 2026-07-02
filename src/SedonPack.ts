import {kebabCase} from 'change-case'
import GraphNode from './GraphNode.js'

export interface SedonPackOptions {
  name: string
  id: string
  author?: string
  /** @description Sedon will check compatibility when loading export data created with different versions of the same pack */
  semver?: `${number}.${number}.${number}`
  versionName?: string
  groupsAsSubmenus?: boolean
}

export interface GraphNodeConstructor<T extends GraphNode = GraphNode> {
  new(): T;

  id?: string
  label: string
  group?: string
}

export type GraphNodeConstructorWithPack<T extends GraphNode = GraphNode> =
  GraphNodeConstructor<T> & { _pack: SedonPack }

export class SedonPack {
  public readonly name: SedonPackOptions['name']
  public readonly id: SedonPackOptions['id']
  public readonly author: SedonPackOptions['author']
  public readonly semver: SedonPackOptions['semver']
  public readonly versionName: SedonPackOptions['versionName']
  public readonly groupsAsSubmenus: Exclude<SedonPackOptions['groupsAsSubmenus'], undefined>
  public readonly nodes: Map<string, GraphNodeConstructorWithPack>

  constructor(options: SedonPackOptions, nodes: GraphNodeConstructor[]) {
    this.name = options.name
    this.id = options.id
    if (options.author) this.author = options.author
    if (options.semver) this.semver = options.semver
    if (options.versionName) this.versionName = options.versionName
    this.groupsAsSubmenus = !!options.groupsAsSubmenus
    this.nodes = new Map()
    nodes.forEach(node => {
      node.id ??= kebabCase(node.label)
      const nodeWithPack = Object.assign(node, {_pack: this})
      this.nodes.set(node.id, nodeWithPack)
    })
  }
}
