import * as Automerge from 'automerge'

const toSync = (node: any) => {
  if (!node) {
    return
  }

  if (node.hasOwnProperty('text')) {
    return {
      ...node,
      text: new Automerge.Text(node.text)
    }
  } else if (node.children) {
    return {
      ...node,
      children: node.children.map(toSync)
    }
  }

  return node
}

export default toSync
