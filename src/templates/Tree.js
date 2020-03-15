import { createTextBlock, getPartDargging, makeSelectable, makeTextEditable, layoutRoot, updateNodeDirection, createIconHolder } from '../helper'

// class TreeTitle {
//   category = 'TreeTitle'
//   styleNames = ['fill', 'stroke', 'strokeWidth', 'text', 'fontFamily', 'fontColor', 'fontSize', 'fontBold', 'fontItalic', 'isUnderline', 'isStrikethrough']
//   actions = ['delete', 'insertChild']
//   style
//   onStartDrag = onStartDrag
//   onDragging = onDragging
//   onStopDrag = onStopDrag

//   constructor(style = {}, actionList) {
//     this.style = style
//     this.actionList = actionList
//   }

//   /**
//    * 
//    * @return {GraphObject}
//    */
//   createTemplate () {
//     return createTreeNode('主题', { ...this.style, fontSize: '24px' }, this.actionList.searchAction(...this.actions), {
//       deletable: false
//     })
//   }
// }

// class TreeSubtitle {
//   category = 'TreeSubtitle'
//   styleNames = ['fill', 'stroke', 'strokeWidth', 'text', 'fontColor', 'fontFamily', 'fontSize', 'fontBold', 'fontItalic', 'isUnderline', 'isStrikethrough']
//   actions = ['delete', 'insertChild', 'insertBrother', 'insertParent']
//   style
//   onStartDrag = onStartDrag
//   onDragging = onDragging
//   onStopDrag = onStopDrag

//   constructor(style = {}, actionList) {
//     this.style = style
//     this.actionList = actionList
//   }
//   /**
//    * 
//    * @return {GraphObject}
//    */
//   createTemplate () {
//     return createTreeNode('子主题', { ...this.style, fontSize: '18px' }, this.actionList.searchAction(...this.actions))
//   }
// }

let lastParent = null
import go from 'gojs'
const $ = go.GraphObject.make

const onChangeStyle = function (graphObject, styleName, styleValue) {
  var links = graphObject.findLinksInto()

  if (styleName === 'stroke') {
    while (links.next()) {
      links.value.findObject('LINE').stroke = styleValue
    }
  }
}

const onStartDrag = function (firstSelection, diagram) {
  var it = diagram.selection.iterator

  while (it.next()) {
    it.value.setProperties({
      isTreeExpanded: false
    })

    diagram.model.setDataProperty(it.value.data, "parent", null)
  }
}

const onDragging = function (firstSelection, diagram) {
  let { parent } = findNearParts(diagram, firstSelection)
  var dir = null
  var holderData = null
  var holderNode = null


  if (parent) {
    if (parent.findTreeLevel() !== 0) {
      dir = parent.data.dir
    } else {
      var bounds = firstSelection.getDocumentBounds()
      dir = bounds.x > parent.getDocumentBounds().x ? 'right' : 'left'
    }

    if (!lastParent || parent.key !== lastParent.key) {
      hideHolder(diagram)

      holderData = {
        category: 'TreeHolder',
        dir: dir,
        parent: parent.key,
      }

      diagram.model.addNodeData(holderData)
      holderNode = diagram.findNodeForData(holderData)

      var topNode = holderNode.findTreeRoot()
      layoutRoot(topNode, diagram)
    }

    lastParent = parent
  } else {
    hideHolder(diagram)
    lastParent = null
  }
}

const onStopDrag = function (firstSelection, diagram) {
  var holderNode = getHolderNode(diagram)
  var holdData = holderNode ? holderNode.part.data : null
  var root = holderNode ? holderNode.findTreeRoot() : null

  var it = diagram.selection.iterator

  hideHolder(diagram)

  if (holdData) {
    var { category: parent, dir } = holdData
    var category = 'TreeNode'

    while (it.next()) {
      diagram.commandHandler.expandTree(it.value)

      if (it.value.data) {
        diagram.model.commit($ => {
          $.setDataProperty(it.value.data, 'parent', parent)
          $.setDataProperty(it.value.data, 'dir', dir)
          $.setCategoryForNodeData(it.value.data, category)
        })


        if (it.value.data.dir !== dir) {
          updateNodeDirection(diagram, it.value, dir)
        }
      }
    }

    layoutRoot(root, diagram)
  } else {
    while (it.next()) {
      diagram.commandHandler.expandTree(it.value)

      diagram.model.commit($ => {
        $.setCategoryForNodeData(it.value.data, 'TreeFree')

        layoutRoot(it.value, diagram)
      })
    }
  }
}

const onMouseDragEnter = function (e, thisObj) {

  var { category } = getPartDargging(e.diagram)
  if (category === 'FontIcon') {
    thisObj.isHighlighted = true
  }
}

const onMouseDragLeave = function (e, thisObj) {
  thisObj.isHighlighted = false
}

const onMouseDrop = function (e, thisObj) {
  thisObj.isHighlighted = false
  var iconNode = getPartDargging(e.diagram)
  var { category, data: iconModel } = iconNode
  var { text, stroke } = iconModel

  if (category === 'FontIcon') {
    e.diagram.startTransaction("添加图标")

    if (!(thisObj.part.data.icons instanceof Array)) {
      thisObj.part.data.icons = []
    }

    e.diagram.model.addArrayItem(thisObj.part.data.icons, {
      text, stroke
    })

    thisObj.part.updateTargetBindings()

    layoutRoot(thisObj.findTreeRoot())

    e.diagram.remove(iconNode)

    e.diagram.commitTransaction("添加图标")

  }
}

function findAreaParts(diagram, area, excludeKey) {
  return diagram.findObjectsIn(area,
    (object) => object.part,
    (part) => part instanceof go.Node && (part.category === 'TreeNode' || part.category === 'TreeFree') && part.key !== excludeKey, true)
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

function spotConverter(dir, from) {
  if (dir === "left") {
    return (from ? go.Spot.LeftCenter : go.Spot.RightCenter);
  } else {
    return (from ? go.Spot.RightCenter : go.Spot.LeftCenter);
  }
}



const TreeNode = {
  name: 'treeNode',
  style: { fontColor: '#333', fontFamily: 'arial,sans-serif', fontSize: 14, isItalic: false, isStrikethrough: false },
  actions: ['delete', 'insertChild', 'insertBrother', 'insertParent'],
  onStartDrag,
  onDragging,
  onStopDrag,
  onChangeStyle,

  // createPreview() {
  //   return $(go.Node, 'Vertical',
  //     { stretch: go.GraphObject.Horizontal, width: 60 },
  //     makeSelectable(),
  //     $(go.TextBlock, '子节点'),
  //     $(go.Shape, 'LineH', {
  //       height: 2
  //     })
  //   )
  // },

  /**
   * 
   * @return {GraphObject}
   */
  createTemplate(opts) {
    // var { height, fontColor } = style

    var element = [
      $(go.Panel, 'Vertical', {
        name: 'NODE',
        padding: 2,
        alignment: go.Spot.Center
      },
        new go.Binding('position', 'pos').makeTwoWay(),
        $(go.Panel, 'Horizontal',
          $(go.Panel, 'Auto',
            {
              name: 'EXPANDER',
              visible: true,
              alignment: go.Spot.Left,
              alignmentFocus: go.Spot.Right
            },
            new go.Binding('opacity', 'isTreeLeaf', (isTreeLeaf) => !isTreeLeaf).ofObject(),
            new go.Binding('visible', 'dir', (dir) => dir === 'left'),
            $('TreeExpanderButton')
          ),
          createIconHolder(),
          createTextBlock(this.name, { ...this.style, fontSize: '14px' }, '子主题', {
            margin: new go.Margin(2, 6, 2, 6),
            alignment: go.Spot.Default,
            stretch: go.GraphObject.Default,
            textEdited: (textBlock) => layoutRoot(textBlock.part.findTreeRoot(), textBlock.part.diagram)
          }),
          $(go.Panel, 'Auto',
            {
              name: 'EXPANDER',
              visible: true,
              alignment: go.Spot.Right,
              alignmentFocus: go.Spot.Left
            },
            new go.Binding('opacity', 'isTreeLeaf', (isTreeLeaf) => !isTreeLeaf).ofObject(),
            new go.Binding('visible', 'dir', (dir) => dir === 'right'),
            $('TreeExpanderButton')
          ),
          new go.Binding('background', 'isHighlighted', (isHighlighted) => isHighlighted ? '#FFC107' : 'transparent').ofObject()
        ),

        $(go.Shape, "LineH",
          {
            name: 'LINE',
            height: 1,
            stroke: 'red',
            fromShortLength: 6,
            toShortLength: 6,
            stretch: go.GraphObject.Horizontal,
            strokeWidth: 1,
            portId: "",
            fromSpot: go.Spot.LeftRightSides,
            toSpot: go.Spot.LeftRightSides
          },
          new go.Binding("stroke"),

          // make sure links come in from the proper direction and go out appropriately
          new go.Binding("fromSpot", "dir", function (d) { return spotConverter(d, true); }),
          new go.Binding("toSpot", "dir", function (d) { return spotConverter(d, false); })
        )),

    ]



    return $(go.Node, 'Spot', {
      locationObjectName: 'LINE',
      locationSpot: go.Spot.Right,
      mouseDragEnter: onMouseDragEnter,
      mouseDragLeave: onMouseDragLeave,
      mouseDrop: onMouseDrop,
      margin: 2,
      padding: 2
    },
      new go.Binding("location", "loc", go.Point.parse).makeTwoWay(go.Point.stringify),
      element,
      makeSelectable(),
      makeTextEditable(),
      
      opts
      //makeContextMenu(actionList, this.actions)
    )
  },

  /**
   * 
   * @param {*} part 
   */
  onDeleteing(part) {
    var root = part.findTreeRoot()
    setTimeout(() => {
      layoutRoot(root)
    }, 0)
  }
}


const TreeFree = {
  name: 'treeFree',
  onStartDrag,
  onDragging,
  onStopDrag,
  style: { fill: '#CFD8DC', fontColor: '#333', fontFamily: 'arial,sans-serif', fontSize: 14, isItalic: false, isStrikethrough: false },
  actions: ['delete', 'insertChild'],

  /**
   * 
   * @return {GraphObject}
   */
  createTemplate(opts) {
    var { fill } = this.style
    var element = [
      $(go.Panel, 'ViewBox',

        $(go.Panel, 'Auto',
          {
            stretch: go.GraphObject.Fill,
          },
          $(go.Shape, "RoundedRectangle",
            {
              name: 'NODE',
              strokeWidth: 0,
              fill: '#CFD8DC'
            },
            new go.Binding('fill', 'isHighlighted', (isHighlighted, object) => {
              return isHighlighted ? '#FFC107' : object.part.data.fill || fill
            }).ofObject()
          ),
          $(go.Shape, 'LineH', {
            stretch: go.GraphObject.Horizontal,
            name: 'PORT',
            margin: new go.Margin(0, -5, 0, -5),
            stroke: 'transparent',
            height: 1,
            portId: "",
            fromSpot: go.Spot.LeftRightSides,
            toSpot: go.Spot.LeftRightSides,
          })
        )
      ),
      $(go.Panel, 'Horizontal',
        createIconHolder(),
        createTextBlock(this.name, this.style, '主题', {
          textEdited: (textBlock) => layoutRoot(textBlock.part.findTreeRoot(), textBlock.diagram)
        }),
      ),

      // new go.Binding('fromSpot', 'dir', (dir) => spotConverter(dir, true)),
      // new go.Binding('toSpot', 'dir', (dir) => spotConverter(dir, true))
    ]


    return $(go.Node, 'Auto', {
      padding: 0,
      margin: 0,
      locationObjectName: 'PORT',
      mouseDragEnter: onMouseDragEnter,
      mouseDragLeave: onMouseDragLeave,
      mouseDrop: onMouseDrop,
    },
      element,
      new go.Binding("location", "loc", go.Point.parse).makeTwoWay(go.Point.stringify),
      makeTextEditable(),
      makeSelectable(),
      
      opts
      //makeContextMenu(actionList, this.actions)
    )
  }
}


const TreeHolder = {
  name: 'treeHolder',
  styleNames: [],
  actions: [],

  /**
   * 
   * @return {GraphObject}
   */
  createTemplate(opts) {
    var element =
      $(go.Node, 'Vertical',
        {
          name: 'CONTAINER',
          padding: 2
        }, 'Vertical',
        $(go.Shape, 'RoundedRectangle', {
          fill: '#FFC107',
          name: 'NODE',
          width: 60,
          height: 25,
          stroke: '#FFC107'
        }),
        $(go.Shape, "LineH",
          {
            stroke: '#FFC107',
            name: 'LINE',
            height: 1,
            stretch: go.GraphObject.Horizontal,
            strokeWidth: 1,
            portId: "",
            fromSpot: go.Spot.LeftRightSides,
            toSpot: go.Spot.LeftRightSides
          },
          new go.Binding("stroke"),
          new go.Binding("fromSpot", "dir", function (d) { return spotConverter(d, true); }),
          new go.Binding("toSpot", "dir", function (d) { return spotConverter(d, false); })
        ), opts)



    return element
  }
}


export default { TreeNode, TreeHolder, TreeFree }