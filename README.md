<div align="center">
    <img width="100%" src="banner.svg" alt="Sedon banner"/>
    <h1>Sedon</h1>
</div>

An open-source graph node system that is fully customizable. Build your own nodes with built-in or custom-made controls
and data types. You can even add your own styles!

> [!WARNING]  
> This package is still in the earlier stages of development. Some features are missing or not fleshed out. There may be
> severe bugs and performance issues. APIs are subject to change

<!-- todo: disallow self connection (allow option as class prop\) -->
<!-- todo: connection loop detection -->
<!-- todo: connection type mismatch detection -->
<!-- todo: snap to grid -->
<!-- todo: connection direction indicator for push -->
<!-- todo: connector direction indicator -->
<!-- todo: array types -->
<!-- todo: array types for differing in/out dimensions -->
<!-- todo: copy, paste, cut -->

## Basic Usage

Install this package with

```shell
npm i lylabot/sedon
```

You will need a `<div>` somewhere in your DOM structure, which will be the root element for Sedon. Sedon will add
elements as siblings to this root for various (context) menus as well.

```typescript
const root = document.querySelector('#sedon')
const sedon = new Sedon(root)
sedon.registerPack(myPack)
```

Sedon does not come with any nodes out of the box, so you have to create your own nodes. You register nodes in a group,
called a pack.

## `Sedon` API

**```new Sedon(rootElement)```**

| Method                          | Description                                                              |
|:--------------------------------|:-------------------------------------------------------------------------|
| `registerPack(pack: SedonPack)` | see [SedonPack](#sedonpack)                                              |
| `save()`                        | see [Exporting / Importing Node Trees](#exporting--importing-node-trees) |
| `load(data: SedonStateExport)`  | see [Exporting / Importing Node Trees](#exporting--importing-node-trees) |

## `SedonPack`

`new SedonPack(options, nodes)`

Each pack of nodes should be a group of thematically equal nodes. For example a math pack with a node that does math
operations on two numbers, one that creates vectors, one that maybe does vector transformations, and so on.

In the add menu, each pack is its own section, all nodes of that pack appear in a submenu. For grouping within the
submenu, use the `group` of [`GraphNode`](#graphnode). Also see the `groupsAsSubmenus` option here.

These are the `options` you can pass:

| Option                        | Type                            | Description                                                                                                                                                                                                                                                                                  |
|:------------------------------|:--------------------------------|:---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| `name`                        | `string`                        | This is shown in the add menu.                                                                                                                                                                                                                                                               |
| `id`                          | `string`                        | Recommended to use the format `[<tld>.]<domain>.<pack_name>`                                                                                                                                                                                                                                 |
| `author` *optional*           | `string`                        |                                                                                                                                                                                                                                                                                              |
| `semver` *optional*           | `${number}.${number}.${number}` | Semantic versioning number of the pack. When loading node trees, Sedon will check compatibility with registered packs based on `semver` and `id` and raise errors if no compatible pack was registered before loading a node tree. When `semver` is not specified, compatibility is assumed. |
| `versionName` *optional*      | `string`                        | Version code name or development stage. Has no impact on loading or saving node trees.                                                                                                                                                                                                       |
| `groupsAsSubmenus` *optional* | `boolean`                       | Show nodes with the same `group` in a submenu (within the packs' submenu) instead of under a group separator.                                                                                                                                                                                |

The `nodes` parameter must be an array of `GraphNode`s

## `GraphNode`

This class is the scaffold for your nodes. It is `abstract`, so it cannot be instanced, but instead is meant to be
extended for each type of node you program.

```typescript
import {GraphNode, Input, Output} from 'sedon'

class MyNode extends GraphNode {
  public static label = 'My Node'

  constructor() {
    super()
    this.addElement('out', Output.Number('Result'))
    this.addElement('a', Input.Number('Value A'))
    this.addElement('b', Input.Number('Value B'))
  }

  process(input: { a: Decimal, b: Decimal }) {
    return {c: input.a.add(input.b)}
  }
}
```

> [!NOTE]  
> Sedon uses the `Decimal` class of the decimal.js package for number processing to mitigate floating-point errors.

There are a couple `static` properties you can define in your node's class:

| Property                                | Type       | Description                                                                                                                                                                        |
|:----------------------------------------|:-----------|:-----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| `label`                                 | `string`   | This is shown at the top of the node in the graph node editor.                                                                                                                     |
| `id` *optional, but highly recommended* | `string`   | ID for this type of node. When not defined, its generated value is that of `label` converted to kebab-case.                                                                        |
| `group` *optional*                      | `string`   | Nodes with equal `group` values are grouped together as a section in the add menu. If `groupsAsSubmenus` of the `SedonPack` is set to `true` the group will be shown as a submenu. |
| `keywords` *optional*                   | `string[]` | Terms for which this node should show up for the search function of the add menu. (In addition to the node's `label` and `group` value)                                            |
| `push` *optional*                       | `boolean`  | Whether this node actively pushes its output values to connected nodes when they change. Default `false`. Also see [Data Processing](#data-processing).                            |
| `pull` *optional*                       | `boolean`  | Whether this node actively pulls values of connected nodes' outputs when they change. Default `false`. Also see [Data Processing](#data-processing).                               |

### Node Elements

As you can see in the example each input and output is defined as a keyed element and added using `GraphNode`s
`addElement` method. These elements must be instances of `NodeElement`, which like `GraphNode` is `abstract` and must be
extended first to create a node element.

**```new Input(type, label)```**
**```new Output(type, label[, showInput])```**

Sedon comes with two such node element types already: `Input` and `Output`. These are exactly as they say, the classic
inputs and outputs on a graph node. Both `Input` and `Output` must be instantiated with an associated data type, which
is shorthanded for you with factories as static properties for each [built-in data type](#datatypes):
`Input.<data_type>(label[, props])` and `Output.<data_type>(label[, props[, showInput]])`. `props` are here the
properties for the given data type and are simply passed on.

Both `Input` and `Output` can show user input elements defined by the data type when they are not connected. For
`Output` you can configure this with the `showInput` parameter, which defaults to `false`.

#### Creating Custom Node Elements

> For creating your own data type, see [Creating Custom Data Types](#creating-custom-data-types)

### Data Processing

#### Arrays and Matrices

## `DataType`s

#### Creating Custom Data Types

### `Number` and `NumberNoEval`

## Exporting / Importing Node Trees

## Styles

### The Base Stylesheet

### Creating Custom Styles
