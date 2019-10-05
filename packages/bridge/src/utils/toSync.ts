import * as Automerge from 'automerge'

const toSync = (node: any): any => {
  if (!node) {
    return
  }

  if (node.hasOwnProperty('text')) {
    return {
      ...node,
      text: new Automerge.Text(node.text)
    }
  } else if (node.nodes) {
    return {
      ...node,
      nodes: node.nodes.map(toSync)
    }
  } else if (node.leaves) {
    return {
      ...node,
      leaves: node.leaves.map(toSync)
    }
  } else if (node.document) {
    return {
      ...node,
      document: toSync(node.document)
    }
  }

  return node
}

export default toSync
