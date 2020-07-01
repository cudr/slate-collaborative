import { Element, Node, Path } from 'slate'

import { SyncValue } from '../model'

export const isTree = (node: Node): boolean => Boolean(node?.children)

export const getTarget = (doc: SyncValue | Element, path: Path) => {
  const iterate = (current: any, idx: number) => {
    if (!(isTree(current) || current[idx])) {
      throw new TypeError(
        `path ${path.toString()} does not match tree ${JSON.stringify(current)}`
      )
    }

    return current[idx] || current?.children[idx]
  }

  return path.reduce(iterate, doc)
}

export const getParentPath = (
  path: Path,
  level: number = 1
): [number, Path] => {
  if (level > path.length) {
    throw new TypeError('requested ancestor is higher than root')
  }

  return [path[path.length - level], path.slice(0, path.length - level)]
}

export const getParent = (
  doc: SyncValue | Element,
  path: Path,
  level = 1
): [any, number] => {
  const [idx, parentPath] = getParentPath(path, level)

  return [getTarget(doc, parentPath), idx]
}

export const getChildren = (node: any) => node.children || node
