"use strict";

import { layoutAngle, layoutRoot, updateNodeDirection } from '../helper'

import go from 'gojs'

let lastParent = null
let $ = go.GraphObject.make

function findAreaParts(diagram, area, excludeKey) {
  return diagram.findObjectsIn(area,
    (object) => object.part,
    (part) => part instanceof go.Node && (part.category === 'TreeNode' || part.category === 'TreeTitle' || part.category === 'TreeSubtitle' || part.category === 'TreeFree') && part.key !== excludeKey, true)
}

function findNearParts(diagram, currentPart) {
  var parts = null
  var currentKey = currentPart.key
  var distance = 20
  var bounds = currentPart.locationObject.getDocumentBounds()
  var { width, height, x, y } = bounds
  var part = null
  var parent = null
  var directions = ['top', 'bottom', 'left', 'right',]
  var areas = [
    new go.Rect(x, y - distance - 20, width, height),
    new go.Rect(x, y, width, height + distance + 20),
    new go.Rect(x - distance, y, width, height),
    new go.Rect(x, y, width + distance, height)
  ]
  var direction = null

  areas.some((area, index) => {
    parts = findAreaParts(diagram, area, currentKey)

    if (parts.size > 0) {
      direction = directions[index]
      return true
    }
  })

  if (parts.size > 0) {
    part = parts.first()

    if (direction == 'left' || direction === 'right') {
      // hor as parent
      parent = part
    } else {
      // ver.parent as parent
      parent = diagram.findNodeForKey(part.data.parent)
    }
  }

  return {
    part,
    direction,
    parent,
  }
}

function hideHolder(diagram) {
  var nodeData = getHolderData(diagram)

  diagram.model.removeNodeData(nodeData)
}

function getHolderData(diagram) {
  var result = null

  diagram.model.nodeDataArray.some(nodeData => {
    if (nodeData.category === 'TreeHolder') {
      result = nodeData
      return true
    }
  })

  return result
}

function getHolderNode(diagram) {
  var result = null

  diagram.model.nodeDataArray.some(nodeData => {
    if (nodeData.category === 'TreeHolder') {
      result = diagram.findNodeForKey(nodeData.key)
      return true
    }
  })

  return result
}

/*
*  Copyright (C) 1998-2019 by Northwoods Software Corporation. All Rights Reserved.
*/

/**
* @constructor
* @extends DraggingTool
* @class
* This draggingTool class makes guidelines visible as the parts are dragged around a diagram
* when the selected part is nearly aligned with another part.
*/
function DraggingNodeTool() {
  go.DraggingTool.call(this);
}
go.Diagram.inherit(DraggingNodeTool, go.DraggingTool);



DraggingNodeTool.prototype.doMouseMove = function () {
  go.DraggingTool.prototype.doMouseMove.call(this)
  var firstSelection = this.diagram.selection.first()
  let { part, parent, direction } = findNearParts(this.diagram, firstSelection)
  var dir = null
  var holderData = null
  var holderNode = null

  if (parent && (firstSelection.part.category === 'TreeNode' || firstSelection.part.category === 'TreeFree')) {
    if (parent.data.dir) {
      dir = parent.data.dir
    } else {
      var bounds = firstSelection.getDocumentBounds()
      dir = bounds.x > parent.getDocumentBounds().x ? 'right' : 'left'
    }

    if (!lastParent || parent.key !== lastParent.key) {
      hideHolder(this.diagram)

      holderData = {
        category: 'TreeHolder',
        dir: dir,
        parent: parent.key,
      }

      this.diagram.model.addNodeData(holderData)
      holderNode = this.diagram.findNodeForData(holderData)

      var topNode = holderNode.findTreeRoot()
      updateNodeDirection(this.diagram, topNode, dir)
      layoutRoot(topNode, this.diagram)
    }

    lastParent = parent
  } else {
    hideHolder(this.diagram)
    lastParent = null
  }
}

DraggingNodeTool.prototype.doActivate = function () {
  go.DraggingTool.prototype.doActivate.call(this)
  var it = this.diagram.selection.iterator

  while (it.next()) {
    it.value.setProperties({
      isTreeExpanded: false
    })

    this.diagram.model.setDataProperty(it.value.data, "parent", null)
  }
}


/**
* Calls the base method from {@link DraggingTool#doDeactivate}
* and removes the guidelines from the graph.
* @this {DraggingNodeTool}
*/
DraggingNodeTool.prototype.doDeactivate = function () {

  go.DraggingTool.prototype.doDeactivate.call(this)

  var holderNode = getHolderNode(this.diagram)
  var holdData = holderNode ? holderNode.part.data : null
  var root = holderNode ? holderNode.findTreeRoot() : null

  var it = this.diagram.selection.iterator

  hideHolder(this.diagram)

  if (holdData) {
    var { category: parentCategory, parent, dir, loc } = holdData


    while (it.next()) {
      this.diagram.commandHandler.expandTree(it.value)

      if (it.value.data) {
        this.diagram.model.setDataProperty(it.value.data, 'parent', parent)
        this.diagram.model.setDataProperty(it.value.data, 'dir', dir)
        this.diagram.model.setCategoryForNodeData(it.value.data, 'TreeNode')

        if (it.value.data.dir !== dir) {
          updateNodeDirection(this.diagram, it.value, dir)
        }
      }
    }

    layoutRoot(root, this.diagram)
  } else {
    while (it.next()) {
      var part = it.value

      if (part.category === 'TreeFree' || part.category === 'TreeNode') {
        this.diagram.commandHandler.expandTree(part)

        if (part.data) {
          this.diagram.model.setCategoryForNodeData(part.data, 'TreeFree')

          layoutRoot(part, this.diagram)
        }
      }
    }
  }
}

DraggingNodeTool.prototype.doDragOver = function (pt, obj) {

  go.DraggingTool.prototype.doDragOver.call(this);

}

/**
* On a mouse-up, snaps the selected part to the nearest guideline.
* If not snapping, the part remains at its position.
* This calls {@link #guidelineSnap}.
* @this {DraggingNodeTool}
*/
DraggingNodeTool.prototype.doDropOnto = function (pt, obj) {
  go.DraggingTool.prototype.doDropOnto.call(this)
}


export default DraggingNodeTool