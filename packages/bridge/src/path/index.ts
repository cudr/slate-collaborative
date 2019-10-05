import { SyncDoc, Path } from '../model'
import { NodeJSON } from 'slate'

export const isTree = (node: NodeJSON): any => node.object !== 'text'

export const getTarget = (doc: SyncDoc, path: Path) => {
  const iterate = (current: any, idx: number) => {
    if (!isTree(current) || !current.nodes) {
      throw new TypeError(
        `path ${path.toString()} does not match tree ${JSON.stringify(current)}`
      )
    }

    return current.nodes[idx]
  }

  return path.reduce(iterate, doc.document)
}

export const getParentPath = (
  path: Path,
  level: number = 1
): [number, Path] => {
  if (level > path.size) {
    throw new TypeError('requested ancestor is higher than root')
  }

  return [path.get(path.size - level), path.slice(0, path.size - level) as Path]
}

export const getParent = (
  doc: SyncDoc,
  path: Path,
  level = 1
): [NodeJSON, number] => {
  const [idx, parentPath] = getParentPath(path, level)
  return [getTarget(doc, parentPath), idx]
}
