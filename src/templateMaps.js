import go from 'gojs'
import _ from 'lodash'
import ContextMenus from './contextMenus'
import { makeEmptyBinding, makeEmptyChildBinding } from './helper'
import './extentions/Button'
import Node from './extentions/Node'

const { GraphObject } = go
const { make: $ } = GraphObject


function spotConverter (dir, from) {
  if (dir === "left") {
    return (from ? go.Spot.Left : go.Spot.Right);
  } else {
    return (from ? go.Spot.Right : go.Spot.Left);
  }
}

function updateTreeLink (node) {
  var collection = node.findLinksInto()
  var expander = null
  while (collection.next()) {
    var expander = collection.part.findObject('EXPANDER')
    if (!(expander instanceof go.GraphObject))
      continue

    expander.visible = true
  }
}

function showTreeExpander (node, assertTarget) {
  var isTreeLeaf = node.part.isTreeLeaf
  var direction = node.part.data.dir


  return direction === assertTarget && !isTreeLeaf
}

/**
 * 生成 css Font (font-style font-variant font-weight font-size font-family)
 * @param {*} { fontFamily, fontSize, fontItalic, fontBold } 
 */
function makeFontString ({ fontFamily = 'arial,sans-serif', fontSize = "13px", fontItalic, fontBold }) {


  return `${fontItalic ? 'italic' : ''} ${fontBold ? 'bold' : ''}  ${fontSize || ''} ${fontFamily || ''} `
}

/**
 * 生成通用的 TextBlock
 * @param {String} 默认文本
 */
function commonTextBlock (text) {
  return $(go.TextBlock, { text: text, name: 'TEXT', textAlign: "center", verticalAlignment: go.Spot.Center, alignment: go.Spot.Center },
    new go.Binding('stroke', 'fontColor').makeTwoWay(),
    new go.Binding('font', 'fontFamily', (value, control) => makeFontString({ ...control.part.data, fontFamily: value })),
    new go.Binding('font', 'fontSize', (value, control) => makeFontString({ ...control.part.data, fontSize: value })),
    new go.Binding('font', 'fontItalic', (value, control) => makeFontString({ ...control.part.data, fontItalic: value })),
    new go.Binding('font', 'fontBold', (value, control) => makeFontString({ ...control.part.data, fontBold: value })),
    ...makeEmptyBinding(false, 'text', 'isUnderline', 'isStrikethrough'))
}

/**
 * 用于生成形状模板的类
 */
class TemplateMap {
  mouseDrops = {}
  mouseDragEnters = {}
  mouseDragLeaves = {}
  style = null
  canvas = null
  nodeSelectionAdornmentTemplate =
    $(go.Adornment, "Auto", { cursor: 'move' },
      $(go.Shape, { fill: '#fff', opacity: 0.5, stroke: "deepskyblue", strokeWidth: 1, strokeDashArray: [4, 2] }),
      $(go.Placeholder)
    )

  nodeRotateAdornmentTemplate =
    $(go.Adornment,
      { locationSpot: go.Spot.Center, locationObjectName: "CIRCLE", cursor: 'pointer' },
      $(go.Shape, "Diamond", { cursor: "pointer", desiredSize: new go.Size(12, 12), fill: "white", stroke: "deepskyblue" }),
      $(go.Shape, { geometryString: "M6 12 L6 45", isGeometryPositioned: true, stroke: "deepskyblue", strokeWidth: 1.5, strokeDashArray: [4, 2] })
    )

  nodeResizeAdornmentTemplate =
    $(go.Adornment, "Spot",
      { locationSpot: go.Spot.Right },
      $(go.Placeholder),
      $(go.Shape, { alignment: go.Spot.TopLeft, cursor: "nw-resize", desiredSize: new go.Size(9, 9), fill: "white", stroke: "deepskyblue" }),
      $(go.Shape, { alignment: go.Spot.Top, cursor: "n-resize", desiredSize: new go.Size(9, 9), fill: "white", stroke: "deepskyblue" }),
      $(go.Shape, { alignment: go.Spot.TopRight, cursor: "ne-resize", desiredSize: new go.Size(9, 9), fill: "white", stroke: "deepskyblue" }),

      $(go.Shape, { alignment: go.Spot.Left, cursor: "w-resize", desiredSize: new go.Size(9, 9), fill: "white", stroke: "deepskyblue" }),
      $(go.Shape, { alignment: go.Spot.Right, cursor: "e-resize", desiredSize: new go.Size(9, 9), fill: "white", stroke: "deepskyblue" }),

      $(go.Shape, { alignment: go.Spot.BottomLeft, cursor: "se-resize", desiredSize: new go.Size(9, 9), fill: "white", stroke: "deepskyblue" }),
      $(go.Shape, { alignment: go.Spot.Bottom, cursor: "s-resize", desiredSize: new go.Size(9, 9), fill: "white", stroke: "deepskyblue" }),
      $(go.Shape, { alignment: go.Spot.BottomRight, cursor: "sw-resize", desiredSize: new go.Size(9, 9), fill: "white", stroke: "deepskyblue" })
    );


  constructor(style, canvas) {
    this.style = style
    this.canvas = canvas
  }

  onMouseDrop (e, object) {
    var triggers = _.get(this.mouseDrops, object.part.category) || []
    // switch (object.part.category) {
    //   case 'TreeNode':
    //   case 'TreeSubtitle':
    //     updateTreeLink(object)
    //     break
    // }

    if (!_.isEmpty(triggers)) {
      _.each(triggers, trig => trig(...arguments))
    }
  }

  onMouseDragEnter (e, object, target) {
    var triggers = _.get(this.mouseDragEnters, object.part.category) || []
    if (!_.isEmpty(triggers)) {
      _.each(triggers, trig => trig(...arguments))
    }
  }

  onMouseDragLeave (e, object, target) {
    var triggers = _.get(this.mouseDragLeaves, object.part.category) || []
    if (!_.isEmpty(triggers)) {
      _.each(triggers, trig => trig(...arguments))
    }
  }

  addDropListener (trigger, ...categoryNames) {
    _.each(categoryNames, categoryName => {

      var list = null

      if (!_.has(this.mouseDrops, categoryName)) {
        this.mouseDrops[categoryName] = []
      }

      list = this.mouseDrops[categoryName]
      list.push(trigger)
    })
  }

  addDragEnterListener (trigger, ...categoryNames) {
    _.each(categoryNames, categoryName => {

      var list = null

      if (!_.has(this.mouseDragEnters, categoryName)) {
        this.mouseDragEnters[categoryName] = []
      }

      list = this.mouseDragEnters[categoryName]
      list.push(trigger)
    })
  }

  addDragLeaveListener (trigger, ...categoryNames) {
    _.each(categoryNames, categoryName => {

      var list = null

      if (!_.has(this.mouseDragLeaves, categoryName)) {
        this.mouseDragLeaves[categoryName] = []
      }

      list = this.mouseDragLeaves[categoryName]
      list.push(trigger)
    })
  }

  makeNodeTemplates () {
    var mapping = new go.Map()

    this.makeNode('Shape', mapping, ({ fill, stroke, strokeWidth, opacity, width, height, background, text }) => {
      return this.wrapperNode($(go.Panel, 'Auto',
        {
          alignment: go.Spot.Center,
          width: width || 80,
          height: height || 80,
          name: 'NODE',
          stretch: go.GraphObject.Fill,
          background: background || 'transparent',
        },
        new go.Binding("desiredSize", "size", go.Size.parse).makeTwoWay(go.Size.stringify),
        $(go.Shape, {
          fill: fill || '#fff',
          stroke: stroke || '#999',
          opacity: opacity || 1,
          strokeWidth: strokeWidth || 1,
          cursor: 'move'
        }, ...makeEmptyBinding(false, 'figure', 'fill', 'stroke', 'strokeWidth')),
        $(go.TextBlock, { text: '', name: 'TEXT', textAlign: "center", verticalAlignment: go.Spot.Center, alignment: go.Spot.Center },
          new go.Binding('stroke', 'fontColor').makeTwoWay(),
          ...makeEmptyBinding(false, 'text', 'isisUnderline', 'isStrikethrough'))
      ))
    })

    this.makeNode('Picture', mapping, ({ fill, stroke, strokeWidth, opacity, width, height, background, text }) => {
      return this.wrapperNode($(go.Panel, 'Auto',
        {
          alignment: go.Spot.Center,
          width: width || 80,
          height: height || 80,
          name: 'NODE',
          stretch: go.GraphObject.Fill,
          background: background || 'transparent',
        },
        new go.Binding("desiredSize", "size", go.Size.parse).makeTwoWay(go.Size.stringify),
        $(go.Shape, {
          fill: fill || '#fff',
          stroke: stroke || '#999',
          opacity: opacity || 1,
          strokeWidth: strokeWidth || 1,
          cursor: 'move'
        }, ...makeEmptyBinding(false, 'figure', 'fill', 'stroke', 'strokeWidth')),
        $(go.TextBlock, { text: '', name: 'TEXT', textAlign: "center", verticalAlignment: go.Spot.Center, alignment: go.Spot.Center },
          new go.Binding('stroke', 'fontColor').makeTwoWay(),
          ...makeEmptyBinding(false, 'text'))
      ))
    })

    this.makeNode('Picture', mapping, ({ fill, stroke, strokeWidth, opacity, width, height, background, text }) => {
      return this.wrapperNode($(go.Panel, 'Auto',
        {
          alignment: go.Spot.Center,
          width: width || 80,
          height: height || 80,
          name: 'NODE',
          stretch: go.GraphObject.Fill,
          background: background || 'transparent',
        },
        new go.Binding("desiredSize", "size", go.Size.parse).makeTwoWay(go.Size.stringify),
        $(go.Shape, {
          fill: fill || '#fff',
          stroke: stroke || '#999',
          opacity: opacity || 1,
          strokeWidth: strokeWidth || 1,
          cursor: 'move'
        }, ...makeEmptyBinding(false, 'figure', 'fill', 'stroke', 'strokeWidth')),
        $(go.TextBlock, { text: '', name: 'TEXT', textAlign: "center", verticalAlignment: go.Spot.Center, alignment: go.Spot.Center },
          new go.Binding('stroke', 'fontColor').makeTwoWay(),
          ...makeEmptyBinding(false, 'text'))
      ))
    })

    this.makeNode('MonoCanvas', mapping, ({ fill, stroke, strokeWidth, opacity, width, height, background, text }) => {
      return this.wrapperNode(
        $(go.Panel, "Vertical",
          $(go.Panel, "Viewbox",
            {
              background: background || 'transparent',
              name: 'NODE',
              width: width || 40,
              height: height || 40,
            },
            new go.Binding("desiredSize", "size", go.Size.parse).makeTwoWay(go.Size.stringify),
            $(go.Panel, "Auto",
              {
                width: 1024,
                height: 1024,
                itemTemplate:
                  $(go.Panel,
                    $(go.Shape,
                      {
                        background: 'transparent',
                        name: 'NODE',
                        opacity: opacity,
                        stroke: stroke || '#999',
                        strokeWidth: strokeWidth || 0,
                        fill: fill || 'transparent',
                      },
                      new go.Binding("opacity"),
                      new go.Binding("fill"),
                      new go.Binding("geometryString")
                    )
                  )
              },

              new go.Binding("itemArray").makeTwoWay(),
              ...makeEmptyChildBinding('opacity', 'fill', 'fontColor', 'stroke', 'strokeWidth')
            )),
          $(go.TextBlock, { text: '', name: 'TEXT', textAlign: "center", verticalAlignment: go.Spot.Center, alignment: go.Spot.Center },
            new go.Binding('stroke', 'fontColor').makeTwoWay(),
            ...makeEmptyBinding(false, 'text')),
        ))
    })

    this.makeNode('ColorCanvas', mapping, ({ fill, stroke, strokeWidth, opacity, width, height, background, text }) => {
      return this.wrapperNode(
        $(go.Panel, "Vertical",
          $(go.Panel, "Viewbox",
            {
              background: 'transparent',
              name: 'NODE',
              width: width || 40,
              height: height || 40,
            },
            new go.Binding("desiredSize", "size", go.Size.parse).makeTwoWay(go.Size.stringify),
            $(go.Panel,
              {
                width: 1024,
                height: 1024,
                itemTemplate:
                  $(go.Panel,
                    $(go.Shape,
                      {
                        name: 'NODE',
                        opacity: opacity,
                        stroke: stroke || '#999',
                        strokeWidth: strokeWidth || 0,
                        fill: fill || 'transparent'
                      },
                      new go.Binding("opacity"),
                      new go.Binding("fill"),
                      new go.Binding("geometryString")
                    )
                  )
              },
              new go.Binding("itemArray").makeTwoWay(),
              ...makeEmptyChildBinding('opacity', 'fill')
            )),
          $(go.TextBlock, { text: '', name: 'TEXT', textAlign: "center", verticalAlignment: go.Spot.Center, alignment: go.Spot.Center },
            new go.Binding('stroke', 'fontColor').makeTwoWay(),
            ...makeEmptyBinding(false, 'text'))
        )
      )
    })

    this.makeNode('TreeNode', mapping, ({ fill, stroke, strokeWidth, opacity, fontColor, width, height, background, text }) => {
      return $(go.Node, "Spot",
        {

          name: 'CONTAINER',
          selectionObjectName: "TEXT",
          mouseDragLeave: (e, o, t) => this.onMouseDragLeave(e, o, t),
          mouseDragEnter: (e, o, t) => this.onMouseDragEnter(e, o, t),
          mouseDrop: (e, o) => this.onMouseDrop(e, o),
          contextMenu:
            $("ContextMenu",
              ContextMenus.remove(),
              ContextMenus.insertChild(),
              ContextMenus.insertParent(),
              ContextMenus.insertBrother()
            )
        },
        $(go.TextBlock,
          {
            stretch: go.GraphObject.Fill,
            alignment: go.Spot.Center,
            name: "TEXT",
            text: '子主题',
            minSize: new go.Size(30, 15),
            editable: true
          },
          // remember not only the text string but the scale and the font in the node data
          ...makeEmptyBinding(false, 'text', 'scale', 'fontColor', 'scale')),
        $(go.Shape, "LineH",
          {
            name: 'NODE',
            stroke: fill,
            strokeWidth: 1,
            portId: "",
            alignment: go.Spot.Bottom,
            fromSpot: go.Spot.LeftRightSides,
            toSpot: go.Spot.LeftRightSides,
            stretch: go.GraphObject.Fill
          },
          // make sure links come in from the proper direction and go out appropriately
          new go.Binding("fromSpot", "dir", function (d) { return spotConverter(d, true); }),
          new go.Binding("toSpot", "dir", function (d) { return spotConverter(d, false); })),
        // remember the locations of each node in the node data
        new go.Binding("location", "loc", go.Point.parse).makeTwoWay(go.Point.stringify),
        // make sure text "grows" in the desired direction
        new go.Binding("locationSpot", "dir", function (d) { return spotConverter(d, false); }),
        $('TreeExpanderButton', { visible: false, alignment: go.Spot.Left, alignmentFocus: go.Spot.Right }, new go.Binding('visible', 'dir', (dir, object) => !object.diagram.isReadOnly && dir === 'left')),
        $('TreeExpanderButton', { visible: false, alignment: go.Spot.Right, alignmentFocus: go.Spot.Left }, new go.Binding('visible', 'dir', (dir, object) => !object.diagram.isReadOnly && dir === 'right')),
      )


    })

    this.makeNode('TreeSubtitle', mapping, ({ fill, stroke, strokeWidth, opacity, fontColor, width, height, background, text }) => {
      return $(go.Node, "Spot", {

        mouseDragLeave: (e, o, t) => this.onMouseDragLeave(e, o, t),
        mouseDragEnter: (e, o, t) => this.onMouseDragEnter(e, o, t),
        mouseDrop: (e, o) => this.onMouseDrop(e, o),
        rotatable: false,
        resizable: false,
        name: 'CONTAINER',
        cursor: 'move',
        locationObjectName: "NODE",
        selectable: true,
        selectionAdornmentTemplate: this.nodeSelectionAdornmentTemplate,
        selectionObjectName: 'NODE',
        portId: "", fromSpot: go.Spot.LeftRightSides, toSpot: go.Spot.LeftRightSides,
        contextMenu:
          $("ContextMenu",
            ContextMenus.remove(),
            ContextMenus.insertChild(),
            ContextMenus.insertParent(),
            ContextMenus.insertBrother()
          )
      },
        new go.Binding("desiredSize", "size", go.Size.parse).makeTwoWay(go.Size.stringify),
        new go.Binding("location", "location", go.Point.parse).makeTwoWay(go.Point.stringify),
        $(go.Panel, 'Auto',
          new go.Binding("desiredSize", "size", go.Size.parse).makeTwoWay(go.Size.stringify),
          $(go.Shape, {
            minSize: new go.Size(60, 30),
            figure: 'RoundedRectangle',
            cursor: 'move',
            fill: fill || '#fff',
            stroke: stroke || '#999',
            strokeWidth: strokeWidth || 1,
            alignment: go.Spot.Center,
            name: 'NODE',
            background: background || 'transparent',

          }, ...makeEmptyBinding(false, 'figure', 'fill', 'stroke', 'strokeWidth'),
            new go.Binding("fromSpot", "dir", function (d) { return spotConverter(d, true); }),
            new go.Binding("toSpot", "dir", function (d) { return spotConverter(d, false); }),
            new go.Binding("locationSpot", "dir", function (d) { return spotConverter(d, false); })),
          $(go.TextBlock, {
            editable: true, text: '子主题', stretch: go.GraphObject.Fill, name: 'TEXT', stroke: fontColor, textAlign: "center", verticalAlignment: go.Spot.Center, alignment: go.Spot.Center
          },
            new go.Binding('stroke', 'fontColor', 'dir').makeTwoWay(),
            ...makeEmptyBinding(false, 'text'))),

        $('TreeExpanderButton', { visible: false, alignment: go.Spot.Left }, new go.Binding('visible', 'dir', (dir, object) => !object.diagram.isReadOnly && dir === 'left')),
        $('TreeExpanderButton', { visible: false, alignment: go.Spot.Right }, new go.Binding('visible', 'dir', (dir, object) => !object.diagram.isReadOnly && dir === 'right')),
      )

    })

    this.makeNode('TreeTitle', mapping, ({ fill, stroke, strokeWidth, opacity, width, fontColor, height, background, text }) => {
      return $(Node, "Spot", {
        mouseDragLeave: (e, o, t) => this.onMouseDragLeave(e, o, t),
        mouseDragEnter: (e, o, t) => this.onMouseDragEnter(e, o, t),
        mouseDrop: (e, o) => this.onMouseDrop(e, o),
        keyDown: (e, o) => {
          console.log(e)
        },
        deletable: false,
        rotatable: false,
        resizable: false,
        name: 'CONTAINER',
        cursor: 'move',
        locationObjectName: "NODE",
        selectable: true,
        selectionAdornmentTemplate: this.nodeSelectionAdornmentTemplate,
        selectionObjectName: 'NODE',
        portId: "", fromSpot: go.Spot.LeftRightSides, toSpot: go.Spot.LeftRightSides,
        contextMenu:
          $("ContextMenu",
            ContextMenus.remove(),
            ContextMenus.insertChild()
          )
      },
        new go.Binding("location", "location", go.Point.parse).makeTwoWay(go.Point.stringify),
        $(go.Panel, 'Auto',
          new go.Binding("desiredSize", "size", go.Size.parse).makeTwoWay(go.Size.stringify),
          $(go.Shape, {
            figure: 'RoundedRectangle',
            cursor: 'move',
            fill: fill || '#999',
            stroke: stroke || '#333',
            strokeWidth: strokeWidth || 1,
            alignment: go.Spot.Center,
            width: width || NaN,
            height: height || NaN,
            minSize: new go.Size(80, 40),
            name: 'NODE',
            minSize: new go.Size(80, 40),
            stretch: go.GraphObject.Fill,
            background: background || 'transparent',

          }, ...makeEmptyBinding(false, 'figure', 'fill', 'stroke', 'strokeWidth'),
            new go.Binding("fromSpot", "dir", function (d) { return spotConverter(d, true); }),
            new go.Binding("toSpot", "dir", function (d) { return spotConverter(d, false); }),
            new go.Binding("locationSpot", "dir", function (d) { return spotConverter(d, false); })),
          commonTextBlock('主题'))
      )
    })


    return {
      nodeTemplateMap: mapping
    }
  }

  makeFlowLinkTemplate () {
    return {
      linkTemplate: $(go.Link,
        {
          curve: go.Link.Bezier,
          selectable: true,
          selectionAdornmentTemplate: $(go.Adornment, "Link",
            $(go.Shape,
              { isPanelMain: true, fill: null, stroke: "deepskyblue", strokeWidth: 0 })
          )
        },
        { relinkableFrom: true, relinkableTo: true, reshapable: true },
        {
          routing: go.Link.AvoidsNodes,
          curve: go.Link.JumpOver,
          corner: 5,
          toShortLength: 4
        },
        new go.Binding("points").makeTwoWay(),
        $(go.Shape,  // the link path shape
          { isPanelMain: true, strokeWidth: 2 }, ...makeEmptyBinding(false, 'stroke')),
        $(go.Shape,  // the arrowhead
          { toArrow: "Standard" }, new go.Binding('fill', 'stroke'), new go.Binding('stroke', 'stroke')),
        $(go.Panel, "Auto",
          new go.Binding("visible", "isSelected").ofObject(),
          $(go.Shape, "RoundedRectangle",  // the link shape
            { fill: "#F8F8F8", stroke: null }),
          $(go.TextBlock,
            {
              textAlign: "center",
              font: "10pt helvetica, arial, sans-serif",
              stroke: "#919191",
              minSize: new go.Size(10, NaN),
              editable: true
            },
            new go.Binding("text").makeTwoWay())
        )
      )
    }
  }

  makeMindLinkTemplate () {
    var { stroke, strokeWidth } = _.get(this.style, 'Line')

    return {
      linkTemplate: $(go.Link,
        {
          curve: go.Link.Bezier,
          fromShortLength: 0,
          toShortLength: 0,
          selectable: false
        },
        $(go.Shape,
          { strokeWidth: strokeWidth, alignment: go.Spot.Center },
          new go.Binding("stroke", "toNode", function (n) {
            return stroke
            // var node = n.findObject('NODE')
            // return (node && node.stroke) || stroke
          }).ofObject()),

        $("TreeExpanderLink", { name: 'EXPANDER', segmentIndex: 1, segmentFraction: 1, name: 'EXPANDER', visible: false }),

      )
    }

  }

  wrapperNode (node) {
    let portSize = new go.Size(10, 10)
    let container = $(go.Node, 'Spot', {
      mouseDragLeave: (e, o, t) => this.onMouseDragLeave(e, o, t),
      mouseDragEnter: (e, o, t) => this.onMouseDragEnter(e, o, t),
      mouseDrop: (e, o) => this.onMouseDrop(e, o),
      name: 'CONTAINER',
      locationSpot: go.Spot.Center,
      cursor: 'move',
      locationObjectName: "NODE",
      selectable: true,
      selectionAdornmentTemplate: this.nodeSelectionAdornmentTemplate,
      selectionObjectName: 'NODE',
      resizable: true,
      resizeObjectName: 'NODE',
      resizeAdornmentTemplate: this.nodeResizeAdornmentTemplate,
      rotatable: true,
      rotateAdornmentTemplate: this.nodeRotateAdornmentTemplate,
      mouseEnter (event, node) {
        if (node.diagram && !node.diagram.isReadOnly) {
          node.part.ports.each((port) => {
            port.opacity = 1
          })
        }
      },
      mouseLeave (event, node) {
        if (node.diagram && !node.diagram.isReadOnly) {
          node.part.ports.each((port) => {
            port.opacity = 0
          })
        }
      },
      doubleClick (event, node) {
        if (node.diagram && !node.diagram.isReadOnly) {
          var text = node.part.findObject('TEXT');
          if (text) {
            node.diagram.commandHandler.editTextBlock(text);
          }
        }
      }
    },
      new go.Binding("location", "location", go.Point.parse).makeTwoWay(go.Point.stringify),
      node,
      $(go.Panel,
        {
          row: 1,
          column: 0,
          _side: "left",
          cursor: "pointer",
          alignment: go.Spot.Left,
          alignmentFocus: go.Spot.Right
        },
        $(go.Shape, "Circle",
          {
            fromSpot: go.Spot.Left,
            toSpot: go.Spot.Left,
            fromLinkable: true,
            toLinkable: true,
            portId: 'LEFT',
            name: 'PORT',
            stroke: null, strokeWidth: 0,
            desiredSize: portSize,
            fill: 'red',
            opacity: 0
          }
        )),
      $(go.Panel,
        {
          row: 1,
          column: 2,
          _side: "left",
          cursor: "pointer",
          alignment: go.Spot.Right,
          alignmentFocus: go.Spot.Left
        },
        $(go.Shape, "Circle",
          {
            fromSpot: go.Spot.Right,
            toSpot: go.Spot.Right,
            fromLinkable: true,
            toLinkable: true,
            portId: 'RIGHT',
            name: 'PORT',
            stroke: null, strokeWidth: 0,
            desiredSize: portSize,
            fill: 'red',
            opacity: 0
          }
        )),
      $(go.Panel,
        {
          row: 0,
          column: 1,
          _side: "left",
          cursor: "pointer",
          alignment: go.Spot.Top,
          alignmentFocus: go.Spot.Bottom
        },
        $(go.Shape, "Circle",
          {
            fromSpot: go.Spot.Top,
            toSpot: go.Spot.Top,
            fromLinkable: true,
            toLinkable: true,
            portId: 'TOP',
            name: 'PORT',
            stroke: null, strokeWidth: 0,
            desiredSize: portSize,
            fill: 'red',
            opacity: 0
          }
        )),
      $(go.Panel,
        {
          row: 2,
          column: 1,
          _side: "left",
          cursor: "pointer",
          alignment: go.Spot.Bottom,
          alignmentFocus: go.Spot.Top,
        },
        $(go.Shape, "Circle",
          {
            fromSpot: go.Spot.Bottom,
            toSpot: go.Spot.Bottom,
            fromLinkable: true,
            toLinkable: true,
            opacity: 0,
            portId: 'BOTTOM',
            name: 'PORT',
            stroke: null,
            strokeWidth: 0,
            desiredSize: portSize,
            fill: 'red',
            opacity: 0
          }
        )))

    return container
  }

  makeNode (categoryName, mapping, wrapper) {
    var style = _.get(this.style, categoryName)

    if (_.isEmpty(style)) {
      return console.warn(`Style is empty for Category named '${categoryName}'`)
    }

    mapping.add(categoryName, wrapper(style))
  }

  changeStyle (style, canvas) {
    this.style = style
  }
}


TemplateMap.getStyleMapping = function (categoryName) {
  return _.get(TemplateMap.categoryStyle, categoryName.toLowerCase()) || []
}

TemplateMap.categoryStyle = {
  picture: ['fill', 'stroke', 'strokeWidth', 'opacity', 'text', 'fontColor'],
  monocanvas: ['fill', 'linear', 'strokeWidth', 'stroke', 'opacity', 'shadow', 'text', 'fontColor'],
  colorcanvas: ['opacity', 'text', 'fontColor'],
  shape: ['fill', 'linear', 'strokeWidth', 'opacity', 'stroke', 'text', 'fontColor'],
  treetitle: ['fill', 'stroke', 'strokeWidth', 'fontColor', 'text', 'font', 'fontSize', 'opacity', 'fontBold', 'fontItalic', 'isUnderline', 'isStrikethrough'],
  treesubtitle: ['fill', 'stroke', 'strokeWidth', 'fontColor', 'text'],
  treenode: ['fontColor', 'text'],
}

TemplateMap.registeShortcuts = function (canvas) {
  var commander = canvas.commandHandler
  var treeKeys = {
    'ctrl&enter': commander.editNodeText,
    'ctrl&arrowleft': commander.collapseTreeNode,
    'ctrl&arrowright': commander.expandTreeNode,
  }

  var regedit = {
    'TreeTitle': {
      ...treeKeys,
      'tab': commander.insertChild,
    },
    'TreeSubtitle': {
      ...treeKeys,
      'tab': commander.insertChild,
      'enter': commander.insertBrother,
      'ctrl&enter': commander.editNodeText,
      'shift&tab': commander.insertParent
    },
    'TreeNode': {
      ...treeKeys,
      'tab': commander.insertChild,
      'enter': commander.insertBrother,
      'ctrl&enter': commander.editNodeText,
      'shift&tab': commander.insertParent
    }
  }

  commander.registeShortcuts(regedit)
}

export default TemplateMap