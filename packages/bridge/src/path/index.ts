import { Node, Path } from 'slate'

import { SyncDoc } from '../model'

export const isTree = (node: Node): boolean => Boolean(node?.children)

export const getTarget = (doc: SyncDoc, path: Path) => {
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
  doc: SyncDoc,
  path: Path,
  level = 1
): [any, number] => {
  const [idx, parentPath] = getParentPath(path, level)

  return [getTarget(doc, parentPath), idx]
}
