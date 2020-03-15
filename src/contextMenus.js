

import go from 'gojs'

import { layoutAll, startEditText } from './helper'
function addTreeNode (parentNode, beforeCreateCommit) {
  var adorn = parentNode.part
  var oldData = adorn.data
  var diagram = adorn.diagram
  var category = 'TreeNode'
  diagram.startTransaction("Add Node");


  if (adorn) {
    var parentCategory = adorn.data.category
    if (parentCategory === 'TreeTitle') {
      category = 'TreeSubtitle'
    } else if (parentCategory === 'TreeSubtitle') {
      category = 'TreeNode'
    }
  }

  // copy the brush and direction to the new node data
  var newdata = { brush: oldData.brush, dir: oldData.dir, parent: oldData.key, category: category }
  diagram.model.addNodeData(newdata)
  if (beforeCreateCommit) {
    beforeCreateCommit(newdata)
  }

  layoutAll(parentNode.diagram);
  diagram.commitTransaction("Add Node");

  // if the new node is off-screen, scroll the diagram to show the new node
  var newNode = diagram.findNodeForData(newdata);
  if (newNode !== null) {
    diagram.scrollToRect(newNode.actualBounds)
    startEditText(newNode)
  }

  return newNode
}

function getTreeChildCategory (parentCategory) {
  var result = 'TreeTitle'

  switch (parentCategory) {
    case 'TreeTitle':
      result = 'TreeSubtitle'
      break;

    case 'TreeSubtitle':
      result = 'TreeNode'
      break;

    case 'TreeNode':
      result = 'TreeNode'
      break;
  }

  return result
}

const { GraphObject } = go
const { make: $ } = GraphObject
const createMenuItem = (text, cickHandler) => {
  return $("ContextMenuButton",
    $(go.TextBlock, text),
    {
      minSize: new go.Size(80, 30),
      background: '#fff',
      click: ((e, shape) => {
        if (cickHandler) {
          cickHandler(e, shape)
        }
      })
    })
}


export default {
  moveUp () {
    return createMenuItem('上移', (event, shape) => {
      shape.diagram.commandHandler.moveUp()
    })
  },
  moveDown () {
    return createMenuItem('下移', (event, shape) => {
      shape.diagram.commandHandler.moveDown()
    })
  },
  remove () {
    return createMenuItem('删除', (event, shape) => {
      shape.diagram.commandHandler.deleteSelection()
    })
  },
  setGroup () {
    return createMenuItem('合并一组', (event, shape) => {
      shape.diagram.commandHandler.setGroup(shape)
    })
  },
  insertChild () {
    return createMenuItem('添加子节点', (event, shape) => {
      shape.diagram.commandHandler.insertChild(shape)
    })
  },
  insertBrother () {
    return createMenuItem('添加同级节点', (event, shape) => {
      shape.diagram.commandHandler.insertBrother(shape)
    })
  },
  insertParent () {
    return createMenuItem('添加父节点', (event, shape) => {
      shape.diagram.commandHandler.insertParent(shape)
    })
  }
}