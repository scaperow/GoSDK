import go from 'gojs'
import _ from 'lodash'
import './extentions/Shape'

const $ = go.GraphObject.make
const colors = ['#FFFFFF', '#E91E63', '#9C27B0', '#673AB7', '#3F51B5', '#2196F3', '#03A9F4', '#00BCD4', '#009688', '#4CAF50', '#8BC34A', '#CDDC39', '#FFEB3B', '#FFC107', '#FF9800', '#FF5722', '#795548', '#607D8B']

var selectionAdornmentTemplate =
  $(go.Adornment, "Spot", {
    cursor: 'move',
    mouseEnter(event, shape) {
      if (!event.diagram.isReadOnly) {
        showPorts(shape)
      }
    },
    mouseLeave(event, shape) {
      if (!event.diagram.isReadOnly) {
        showPorts(shape, false)
      }
    },
    doubleClick(event, node) {
      if (node.diagram && !node.diagram.isReadOnly) {
        var text = node.part.findObject('TEXT');
        if (text) {
          node.diagram.commandHandler.editTextBlock(text);
        }
      }
    }
  },
    $(go.Panel, "Auto",
      $(go.Shape, 'RoundedRectangle',
        { fill: null, stroke: "#2196F3cc", strokeWidth: 1, alignment: go.Spot.Center },
        new go.Binding("stroke", "color"),
        new go.Binding("strokeDashArray", "strokeDashArray")),
      $(go.Placeholder, { padding: 2, alignment: go.Spot.Center })
    )

  )

var rotateAdornmentTemplate =
  $(go.Adornment,
    { locationSpot: go.Spot.Center, locationObjectName: "CONTAINER", cursor: 'pointer' },
    $(go.Shape, "Diamond", { desiredSize: new go.Size(12, 12), fill: "white", stroke: "#2196F3" }),
    $(go.Shape, { geometryString: "M6 12 L6 45", isGeometryPositioned: true, stroke: "#2196F3", strokeWidth: 1.5, strokeDashArray: [4, 2] })
  )

var resizeAdornmentTemplate =
  $(go.Adornment, "Spot",
    { locationSpot: go.Spot.Center },
    $(go.Placeholder),
    $(go.Shape, { alignment: go.Spot.TopLeft, alignmentFocus: go.Spot.BottomRight, cursor: "nw-resize", desiredSize: new go.Size(9, 9), fill: "white", stroke: "#2196F3" }),
    $(go.Shape, { alignment: go.Spot.Top, alignmentFocus: go.Spot.Bottom, cursor: "n-resize", desiredSize: new go.Size(9, 9), fill: "white", stroke: "#2196F3" }),
    $(go.Shape, { alignment: go.Spot.TopRight, alignmentFocus: go.Spot.BottomLeft, cursor: "ne-resize", desiredSize: new go.Size(9, 9), fill: "white", stroke: "#2196F3" }),
    $(go.Shape, { alignment: go.Spot.Left, alignmentFocus: go.Spot.Right, cursor: "w-resize", desiredSize: new go.Size(9, 9), fill: "white", stroke: "#2196F3" }),
    $(go.Shape, { alignment: go.Spot.Right, alignmentFocus: go.Spot.Left, cursor: "e-resize", desiredSize: new go.Size(9, 9), fill: "white", stroke: "#2196F3" }),
    $(go.Shape, { alignment: go.Spot.BottomLeft, alignmentFocus: go.Spot.TopRight, cursor: "se-resize", desiredSize: new go.Size(9, 9), fill: "white", stroke: "#2196F3" }),
    $(go.Shape, { alignment: go.Spot.Bottom, alignmentFocus: go.Spot.Top, cursor: "s-resize", desiredSize: new go.Size(9, 9), fill: "white", stroke: "#2196F3" }),
    $(go.Shape, { alignment: go.Spot.BottomRight, alignmentFocus: go.Spot.TopLeft, cursor: "sw-resize", desiredSize: new go.Size(9, 9), fill: "white", stroke: "#2196F3" })
  );

const colorMenus = $('ContextMenu',
  $(go.Panel, 'Horizontal',
    {
      background: '#fff',
      padding: 12
    },
    $(go.Panel, 'Auto',
      {
        width: 24, height: 24, padding: 2, cursor: 'pointer', click(e, shape) {
          e.diagram.startTransaction("删除图标")
          e.diagram.model.removeArrayItem(shape.part.adornedPart.data.icons, shape.part.adornedObject.itemIndex)
          e.diagram.commitTransaction("删除图标")
        }
      },
      $(go.Shape, 'Circle', {
        fill: 'red', strokeWidth: 0,
      }),
      $(go.Shape, 'XLine',
        {
          stroke: '#fff',
        })),

    $(go.Shape, 'LineV', { stroke: '#3333', height: 28, width: 6 }),
    colors.map(color => {
      return $(go.Shape, 'Circle', {
        cursor: 'pointer', stroke: '#c3c3c3', strokeWidth: 1, width: 18, height: 18, fill: color, margin: 2,
        click(e, shape) {
          e.diagram.startTransaction("改变图标颜色")
          shape.part.adornedObject.data.stroke = shape.fill
          shape.part.adornedObject.updateTargetBindings()
          e.diagram.commitTransaction("改变图标颜色")
        }
      })
    })
  )
)

function createSelectionTemplate(...opt) {
  return $(go.Adornment, "Spot", {
    cursor: 'move',
    mouseEnter(event, shape) {
      if (!event.diagram.isReadOnly) {
        showPorts(shape)
      }
    },
    mouseLeave(event, shape) {
      if (!event.diagram.isReadOnly) {
        showPorts(shape, false)
      }
    },
    doubleClick(event, node) {
      if (node.diagram && !node.diagram.isReadOnly) {
        var text = node.part.findObject('TEXT');
        if (text) {
          node.diagram.commandHandler.editTextBlock(text);
        }
      }
    }
  },
    $(go.Panel, "Auto",
      $(go.Shape, 'RoundedRectangle',
        { fill: null, stroke: "#2196F3cc", strokeWidth: 1, alignment: go.Spot.Center },
        new go.Binding("stroke", "color"),
        new go.Binding("strokeDashArray", "strokeDashArray")),
      $(go.Placeholder, { padding: 2, alignment: go.Spot.Center })
    ),
    opt
  )
}

function getBindingFromName(name, prepend = '', customer) {
  var binding = null

  switch (name) {
    case 'fontColor':
      binding = new go.Binding('stroke', prepend + 'fontColor', customer)
      break;

    case 'radius':
      binding = new go.Binding('parameter1', prepend + 'radius', customer)
      break;

    case 'smallWidth':
      binding = new go.Binding('width', prepend + 'smallWidth', customer)
      break;

    case 'smallHeight':
      binding = new go.Binding('height', prepend + 'smallHeight', customer)
      break;

    case 'location':
      binding = new go.Binding('loc', prepend + 'location', customer)
      break;

    default:
      binding = new go.Binding(name, prepend + name, customer)
  }

  return binding
}

function makeStyleBinding(rootName, names, {
  separator = '_'
} = {}) {
  if (!(_.isArray(rootName) || _.isString(rootName)) || !_.isArray(names)) {
    throw new Error('rootName should be string or array,names should be array ')
  }

  if (_.isArray(rootName)) {
    rootName = rootName.join(separator)
  }

  return _.map(names, (name) => {
    name = _.toLower(name)
    var binding = getBindingFromName(name, rootName + separator, (value, part) => {
      return part.data[name] || value

    })
    binding = binding.ofModel()
    return binding
  })
}

function combinStyleName(name, { separator = '_' } = {}) {
  if (!_.isArray(name) || !_.isString(separator)) {
    throw new Error('name must be an array and  separator should be a string')
  }

  return _.toLower(name.join(separator))
}

function makeDataBinding(isTwoway, ...names) {
  if (!_.isBoolean(isTwoway)) {
    throw new Error('isTwoway must be a boolean')

  }
  return _.map(names, (name) => {
    //name = _.toLower(name)

    var binding = getBindingFromName(name)
    if (isTwoway && binding) {
      binding = binding.makeTwoWay()
    }

    return binding
  })
}

function makeTextEditable(textBlockName = 'TEXT') {
  return {
    doubleClick(event, object) {
      if (object.diagram && !object.diagram.isReadOnly) {
        var text = object.part.findObject(textBlockName)

        if (text) {
          object.diagram.commandHandler.editTextBlock(text)
        }
      }
    }
  }
}

function createTextBlock(rootName, style, text = '', ...props) {
  if (_.isString(rootName)) {
    rootName = [rootName]
  }

  if (!_.isArray(rootName)) {
    throw new Error('rootName should be an array')
  }

  var
    {
      fontColor,
      fontFamily,
      fontSize,
      fontItalic,
      fontBold,
      isUnderline,
      isStrikethrough,
      verticalAlignment,
      alignment,
      stretch,
      margin,
    } = _.defaults(style, {
      fontColor: '#333',
      fontFamily: 'arial,sans-serif',
      fontSize: 14,
      fontItalic: false,
      fontBold: false,
      isUnderline: false,
      isStrikethrough: false,
      textAlign: 'center',
      verticalAlignment: go.Spot.Center,
      alignment: go.Spot.Center,
      stretch: go.GraphObject.Horizontal,
      margin: new go.Margin(12),
      overflow: go.TextBlock.OverflowClip
    })

  var properties = {
    name: 'TEXT',
    textAlign: "center",
    text,
    font: createFontString({
      fontFamily,
      fontSize,
      fontItalic,
      fontBold
    }),
    isUnderline,
    isStrikethrough,
    margin,
    overflow: go.TextBlock.WrapBreakAll,
    wrap: go.TextBlock.WrapDesiredSize,
    stroke: fontColor,
    verticalAlignment,
    stretch,
    alignment
  }

  return $(go.TextBlock, properties,
    new go.Binding('stroke', 'fontColor').ofModel(),
    new go.Binding('font', combinStyleName([...rootName, 'fontFamily']), (value, control) => createFontString({ ...control.part.data, fontFamily: value })).ofModel(),
    new go.Binding('font', combinStyleName([...rootName, 'fontSize']), (value, control) => createFontString({ ...control.part.data, fontSize: value })).ofModel(),
    new go.Binding('font', combinStyleName([...rootName, 'fontItalic']), (value, control) => createFontString({ ...control.part.data, fontItalic: value })).ofModel(),
    new go.Binding('font', combinStyleName([...rootName, 'fontBold']), (value, control) => createFontString({ ...control.part.data, fontBold: value })).ofModel(),

    new go.Binding('stroke', 'fontColor'),
    new go.Binding('font', 'fontFamily', (value, control) => createFontString({ ...control.part.data, fontFamily: value })),
    new go.Binding('font', 'fontSize', (value, control) => createFontString({ ...control.part.data, fontSize: value })),
    new go.Binding('font', 'fontItalic', (value, control) => createFontString({ ...control.part.data, fontItalic: value })),
    new go.Binding('font', 'fontBold', (value, control) => createFontString({ ...control.part.data, fontBold: value })),
    ...makeDataBinding(true, 'text', 'isUnderline', 'isStrikethrough'),
    ...props
  )
}

function makeEmptyChildBinding(...names) {
  return _.map(names, (name) => {
    return new go.Binding(name, name, (value, part) => {
      part.itemArray.forEach(item => {
        item[name] = value
      })
    }).makeTwoWay()
  })
}

function getNodeStyle(nodeCategory, style, collectionName = 'parts') {
  return _.find(_.get(style, collectionName), { category: nodeCategory })
}

function getMaxKey(canvas) {
  var key = null
  canvas.nodes.each((part) => {
    if (key === null) {
      key = part.key
    } else {
      if (key < part.key) {
        key = part.key
      }
    }
  })

  return key
}

/**
 * 生成 css Font (font-style font-variant font-weight font-size font-family)
 * @param {*} { fontFamily, fontSize, fontItalic, fontBold } 
 */
function createFontString({ fontFamily = 'arial,sans-serif', fontSize = "14px", fontItalic, fontBold }) {
  return `${fontItalic ? 'italic' : ''} ${fontBold ? 'bold' : ''}  ${parseInt(fontSize)}px/${parseInt(fontSize) + 6}px ${fontFamily || ''} `
}

function layoutAngle(parts, angle) {
  var layout = go.GraphObject.make(go.TreeLayout,
    {
      angle: angle,
      arrangement: go.TreeLayout.ArrangementFixedRoots,
      nodeSpacing: 2,
      layerSpacing: 35,
      setsPortSpot: false, // don't set port spots since we're managing them with our spotConverter function
      setsChildPortSpot: false
    });
  layout.doLayout(parts);
}

function updateNodeDirection(diagram, node, dir) {
  diagram.model.setDataProperty(node.data, "dir", dir)

  var chl = node.findTreeChildrenNodes()
  while (chl.next()) {
    updateNodeDirection(chl.value.diagram, chl.value, dir)
  }
}

function startEditText(object) {
  var canvas = object.diagram

  if (canvas && !canvas.isReadOnly) {
    var text = object.part.findObject('TEXT')
    if (text) {
      canvas.commandHandler.editTextBlock(text)
    }
  }
}


function layoutRoot(root) {
  if (root) {
    var diagram = root.diagram

    diagram.startTransaction("Layout")
    // split the nodes and links into two collections
    var rightward = new go.Set(/*go.Part*/);
    var leftward = new go.Set(/*go.Part*/);
    root.findLinksConnected().each(function (link) {
      var child = link.toNode;

      updateNodeDirection(child.diagram, child, child.data.dir)
      if (child.data.dir === "left") {
        leftward.add(root);  // the root node is in both collections
        leftward.add(link);
        leftward.addAll(child.findTreeParts());
      } else {
        rightward.add(root);  // the root node is in both collections
        rightward.add(link);
        rightward.addAll(child.findTreeParts());
      }
    })

    // do one layout and then the other without moving the shared root node
    layoutAngle(rightward, 0);
    layoutAngle(leftward, 180);
    diagram.commitTransaction("Layout");
  }
}

function layoutFamily(object) {
  var parentNode = null
  var list = new go.Set(/*go.Part*/)
  var { dir, parent } = object.part.data

  parentNode = object.diagram.findNodeForKey(parent)
  if (parentNode) {
    layoutRoot(parentNode.part, parentNode.diagram)
  }

  //list.add(object.part)
  // array.splice(0, 0, object.part)



  // while (true) {
  //   parentNode = object.diagram.findNodeForKey(parent)
  //   if (parentNode && parentNode.findTreeLevel() !== 1) {
  //     array.splice(0, 0, parentNode.part)
  //     parent = parentNode.parent
  //     continue
  //   }

  //   break
  // }

  // list.addAll(array)
  layoutAngle(list, dir === 'left' ? 180 : 0)
}

function createNameToolTip(text) {
  return $("ToolTip", { name: 'NAME_TOOLTIP' },
    $(go.Panel,
      $(go.TextBlock, { margin: 4, text }, new go.Binding('text', 'name'))))
}


function createSizeToolTip() {
  var textBlock =
    $(go.TextBlock, { isMultiline: true, name: 'TEXT', margin: 4, font: 'small-caps bold 14px sans-serif;' },
      new go.Binding('text', 'position', (size, object) => getSizeTipString(object)).ofObject())

  var toolTip = $("ToolTip", { name: 'SIZE_TOOLTIP' },
    $(go.Panel, textBlock)
  )

  // go.TextBlock.setUnderline(() => {
  //   return 20
  // })

  return toolTip
}

function makeToolTip() {
  return {
    //toolTip: createSizeToolTip()
  }
}

function getSizeTipString(object) {
  var { width, height, angle = 0 } = object.part.data
  var { x, y } = go.Point.parse(object.part.data.loc || {})


  // var { width, height, angle } = object.part
  return `X:${x.toFixed(2)} X:${y.toFixed(2)} \n W:${parseInt(width)}px H:${parseInt(height)}px \n R${angle}°`
}


function createIconHolder(properties, bindingName = 'icons') {
  return $(go.Panel, 'Horizontal',
    {
      stretch: go.GraphObject.Horizontal,
      itemTemplate: createIconTemplate(properties),
    },
    new go.Binding('itemArray', bindingName))
}

function createIconTemplate({ fontSize } = { fontSize: 32 }) {
  return $(go.Panel, 'Auto',
    {
      contextMenu: colorMenus,
      padding: 2,
      cursor: 'pointer',
      mouseEnter(e, shape) {
        shape.findObject('ICON_CONTAINER').stroke = '#3333'
      },
      mouseLeave(e, shape) {
        shape.findObject('ICON_CONTAINER').stroke = 'transparent'
      },
      click(e, shape) {
        e.diagram.commandHandler.showContextMenu(shape)
      }
    },
    $(go.Shape, {
      fill: 'transparent',
      stroke: 'transparent',
      strokeWidth: 1,
      name: 'ICON_CONTAINER',
    }),
    $(go.TextBlock, {
      name: 'ICON',
      margin: 0,
      stroke: '#666',
      font: `${fontSize}px 'Material Design Icons'`,
      editable: false,
      isMultiline: false
    }, ...makeDataBinding(false, 'stroke'),
      new go.Binding('text', 'text', (text) => {
        return String.fromCodePoint(parseInt(text, 16))
      }))
  )
}

function makeRotatable(rotateObjectName = 'NODE', adornmentTemplate = rotateAdornmentTemplate) {
  return {
    rotatable: true,
    rotateObjectName,
    rotateAdornmentTemplate: adornmentTemplate
  }
}

function makeResizable(resizeObjectName = 'NODE', adornmentTemplate = resizeAdornmentTemplate) {
  return {
    resizable: true,
    resizeObjectName,
    resizeAdornmentTemplate: adornmentTemplate
  }
}

function makeSelectable(selectionObjectName = 'NODE', adornmentTemplate = selectionAdornmentTemplate) {
  return {
    selectable: true,
    selectionObjectName,
    selectionAdornmentTemplate: adornmentTemplate
  }
}

function makePortable() {
  return [{
    itemTemplate:
      $(go.Panel, 'Auto',
        $(go.Shape, 'Circle',
          {
            opacity: 0,
            name: 'PORT',
            fromLinkable: true,
            toLinkable: true,  // declare whether the user may draw links to/from here
            fill: '#2196F3',  // not seen, by default; set to a translucent gray by showSmallPorts, defined below
            stroke: null,
            desiredSize: new go.Size(10, 10),
            cursor: "pointer",  // show a different cursor to indicate potential link point
            // mouseEnter: function (e, port) {  // the PORT argument will be this Shape
            //   if (!e.diagram.isReadOnly) port.fill = "rgba(255,0,255,0.5)";
            // },
            // mouseLeave: function (e, port) {
            //   port.fill = "transparent";
            // }
          },
          new go.Binding('fromSpot', 'align', go.Spot.parse),
          new go.Binding('toSpot', 'align', go.Spot.parse),
          new go.Binding('portId', 'id')
        ),
        new go.Binding('alignment', 'align', go.Spot.parse),
        new go.Binding('alignmentFocus', 'align', go.Spot.parse)
      ),
  },
  new go.Binding("itemArray", "ports")
  ]
}

function createPort(portId, alignment = null, alignmentFocus = null) {
  if (!portId) {
    throw new Error('portId should be not empty')
  }

  if (!alignment) {
    throw new Error('alignment should be not null')
  }

  return $(go.Shape,
    {
      name: 'PORT',
      // fromSpot: spot,  // declare where links may connect at this port
      fromLinkable: true,  // declare whether the user may draw links from here
      // toSpot: spot,  // declare where links may connect at this port
      toLinkable: true,  // declare whether the user may draw links to here
      figure: 'Circle',
      fill: "transparent",  // changed to a color in the mouseEn0,
      stroke: 'transparent',
      strokeWidth: 1,
      width: 12,  // if not stretching horizont0,
      height: 12,  // if not stretching vertic0,
      alignment,  // align the port 0, 
      alignmentFocus: alignmentFocus || alignment,
      portId,  // declare this obje0,
      cursor: "pointer",  // show a different cursor to indicate pot0,
    });
}

function createPorts({ spot, alignment, alignmentFocus } = {}, ...names) {
  if (!spot) {
    console.error('spot must be value')
    return []
  }

  if (!alignment) {
    console.error('aligment must be value')
    return []
  }

  return names.map(name => {
    return $(go.Shape,
      {
        isActionable: true,
        fromSpot: spot,  // declare where links may connect at this port
        fromLinkable: true,  // declare whether the user may draw links from here
        toSpot: spot,  // declare where links may connect at this port
        toLinkable: true,  // declare whether the user may draw links to here
        figure: 'Circle',
        fill: "transparent",  // changed to a color in the mouseEn0,
        stroke: 'transparent',
        strokeWidth: 1,
        width: 14,  // if not stretching horizont0,
        height: 14,  // if not stretching vertic0,
        alignment,  // align the port 0,
        alignmentFocus,
        portId: name,  // declare this obje0,
        cursor: "pointer",  // show a different cursor to indicate pot0,
      })
  })
}

function showPorts(shape, visible = true) {
  var part = null

  // var container = shape.part.findObject('PORT_CONTAINER')

  // container && (container.opacity = visible ? 1 : 0)
  if (shape instanceof go.Adornment) {
    part = shape.adornedObject.part
  } else {
    part = shape.part
  }

  part.ports.each(port => {
    if (port.name === 'PORT') {
      //port.fill = visible ? '#FFC10799' : 'transparent'; port.stroke = visible ? '#3338' : 'transparent'
      port.opacity = visible ? 0.6 : 0
    }
  })
}

function makeModelBinding(src, target) {
  var [value, ...vs] = target.split('.')
  return new go.Binding(src, value, (value) => _.get(value, vs)).ofModel()
}

const createMenuItem = (text, properties) => {
  return $("ContextMenuButton",
    $(go.TextBlock, text,
      {
        verticalAlignment: go.Spot.Center,
        stroke: '#333',
        minSize: new go.Size(80, 30),
        background: '#fff',
        font: '14px sans-serif',
        ...properties,
      })
  )
}

function makeContextMenu(actionList, allowAction) {
  var actions = actionList.searchAction(...allowAction)
  return { contextMenu: createContextMenu(actions) }

}

function createContextMenu(actions) {
  var menus = []
  actions.forEach(action => {
    if (action) {
      let menu = createMenuItem(action.label,
        {
          click: ((e) => {
            action.execute(e.diagram.selection.first())
          })
        })

      action.onChangeStatus = (value) => {
        menu.visible = value
      }

      menus.push(menu)
    }
  })

  if (menus.length > 0) {
    return $("ContextMenu",
      ...menus
    )
  }

  return null
}

function getTreeDirection(node) {
  var { dir } = node.part.data
  var lefts = 0, rights = 0

  if (dir) {
    return dir
  } else {
    var it = node.findTreeChildrenNodes().iterator
    while (it.next()) {
      if (it.value.part.data.dir === 'left') {
        lefts++
      } else if (it.value.part.data.dir === 'right') {
        rights++
      }
    }

    return lefts >= rights ? 'right' : 'left'
  }
}

function getColor(key) {
  return colors[Math.abs(key) % colors.length]
}

function getPartDargging(diagram, usePalatte = true) {
  return ((usePalatte && diagram.toolManager.draggingTool.copiedParts && diagram.toolManager.draggingTool.copiedParts.iteratorKeys)
    ||
    (diagram.selection))
    .first()
}

function getPartsDargging(diagram, usePalatte = true) {
  return ((usePalatte && diagram.toolManager.draggingTool.copiedParts && diagram.toolManager.draggingTool.copiedParts.iteratorKeys)
    ||
    (diagram.selection))
}

function makeNodeDragable(itemArrayName, allowCategorys, {
  denyCategories,
  afterSuccess,
  removeOnSuccess
} = {
    denyCategories: [],
    afterSuccess,
    transactionName: '拖动',
    removeOnSuccess: true
  }) {

  allowCategorys = _.pull(allowCategorys, denyCategories)

  return {
    mouseDragEnter(e, thisObj, ) {
      var draggingNodes = getPartsDargging(e.diagram)
      var it = draggingNodes.iterator
      while (it.next()) {
        var category = it.value.part.category
        if (denyCategories.indexOf(category) < 0 && (allowCategorys[0] === '*' || allowCategorys.indexOf(category) > -1)) {
          thisObj.part.isHighlighted = true
          break;
        }
      }
    },
    mouseDragLeave(e, thisObj) {
      thisObj.isHighlighted = false
    },
    mouseDrop(e, thisObj) {
      thisObj.isHighlighted = false
      var draggingNodes = getPartsDargging(e.diagram)
      var it = draggingNodes.iterator
      e.diagram.model.commit(($) => {

        var members = new go.List()
        while (it.next()) {
          var { text, stroke } = it.value.data
          var category = it.value.part.category
          if (denyCategories.indexOf(category) < 0 && (allowCategorys[0] === '*' || allowCategorys.indexOf(category) > -1)) {
            if (!thisObj.part.data[itemArrayName]) {
              $.set(thisObj.part.data, itemArrayName, [])
            }

            $.addArrayItem(thisObj.part.data[itemArrayName], {
              text,
              stroke
            })
          }


          if (removeOnSuccess) {
            e.diagram.remove(it.value)
          }

          //thisObj.part.updateTargetBindings()
        }

        if (afterSuccess) {
          afterSuccess(thisObj, members)
        }

      })
    }
  }
}


function makeGroupDragable(allowCategorys = [], {
  denyCategories = [],
  afterSuccess,
} = {
    excludeCategorys: [],
    afterSuccess: null,
    transactionName: '拖动',
    removeOnSuccess: true
  }, ) {

  allowCategorys = _.pull(allowCategorys, denyCategories)

  return {
    mouseDragEnter(e, thisObj) {
      var draggingNodes = getPartsDargging(e.diagram)
      var it = draggingNodes.iterator

      while (it.next()) {
        var category = it.value.part.category
        if (denyCategories.indexOf(category) < 0 && (allowCategorys[0] === '*' || allowCategorys.indexOf(category) > -1)) {
          thisObj.part.isHighlighted = true
          break;
        }
      }
    },
    mouseDragLeave(e, thisObj) {
      thisObj.part.isHighlighted = false
    },
    mouseDrop(e, thisObj) {
      thisObj.part.isHighlighted = false
      var draggingNodes = getPartsDargging(e.diagram)
      var it = draggingNodes.iterator
      //e.diagram.model.commit(($) => {

      var members = new go.List()
      while (it.next()) {
        var { category } = it.value
        if (denyCategories.indexOf(category) < 0 && (allowCategorys[0] === '*' || allowCategorys.indexOf(category) > -1)) {
          members.add(it.value)
        }
      }

      thisObj.part.addMembers(members, true)

      if (afterSuccess) {
        afterSuccess(thisObj, members)
      }
      //}, transactionName)
    }
  }
}

function convertStyleModelData(styleModel, separator = '_') {

  var flatten = function (object, parentKey, result) {
    return _.reduce(object, (result, value, key) => {
      var index = (_.isEmpty(parentKey) ? '' : parentKey + separator) + key

      if (_.isObject(value)) {
        flatten(value, index, result)
      } else {
        result[index] = value
      }

      return result
    }, result)
  }

  return flatten(styleModel, '', {})
}

export {
  makeTextEditable,
  getPartsDargging,
  getPartDargging,
  colors,
  makeDataBinding,
  makeEmptyChildBinding,
  getMaxKey,
  layoutAngle,
  getNodeStyle,
  updateNodeDirection,
  startEditText,
  createFontString,
  createTextBlock,
  createPort,
  showPorts,
  createContextMenu,
  createMenuItem,
  createPorts,
  layoutRoot,
  getTreeDirection,
  getColor,
  createIconHolder,
  layoutFamily,
  createNameToolTip,
  createSizeToolTip,
  makeNodeDragable,
  makeGroupDragable,
  resizeAdornmentTemplate,
  selectionAdornmentTemplate,
  rotateAdornmentTemplate,
  makeContextMenu, makeToolTip,
  makeSelectable,
  makeResizable,
  makeRotatable, makeModelBinding,
  makeStyleBinding,
  makePortable,
  combinStyleName, convertStyleModelData, createSelectionTemplate


}
