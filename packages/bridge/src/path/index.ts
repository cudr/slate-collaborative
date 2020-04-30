import { Node, Path, Editor } from 'slate'

export const isTree = (node: Node): boolean => Boolean(node && node.children)

export const getTarget = (doc: Editor, path: Path) => {
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
  doc: Editor,
  path: Path,
  level = 1
): [any, number] => {
  const [idx, parentPath] = getParentPath(path, level)

  return [getTarget(doc, parentPath), idx]
}
