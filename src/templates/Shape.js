import {
  createTextBlock,
  makeDataBinding,
  makeSelectable,
  makeRotatable,
  makeResizable,
  makeTextEditable,
  selectionAdornmentTemplate,
  makeStyleBinding,
  makePortable,
  showPorts
} from '../helper'
import go from 'gojs'
import _ from 'lodash'
let style = { fill: '#fff', stroke: '#333', strokeDashArray: [], strokeWidth: 1, opacity: 1, width: 80, height: 80, fontColor: '#333', fontSize: 14, fontFamily: 'arial,sans-serif', fontBold: null, fontItalic: null, isUnderline: null, isStrikethrough: false }
let actions = ['cut', 'paste', 'group', 'copy', 'ungroup']
let creatingShapeData = null
let $ = go.GraphObject.make

function createCreateAdornment(alignment) {
  let alignmentFocus, offsetName, offsetValue, offsetOn, angle, fromPortId, toPortId

  switch (alignment) {
    case go.Spot.Top:
      alignmentFocus = go.Spot.Bottom
      offsetName = 'y'
      offsetValue = 50
      offsetOn = 'height'
      angle = -90
      fromPortId = 'T'
      toPortId = 'B'
      break;

    case go.Spot.Bottom:
      alignmentFocus = go.Spot.Top
      offsetName = 'y'
      offsetValue = -50
      offsetOn = 'height'
      angle = 90
      fromPortId = 'B'
      toPortId = 'T'
      break;

    case go.Spot.Left:
      alignmentFocus = go.Spot.Right
      offsetName = 'x'
      offsetValue = 40
      offsetOn = 'width'
      angle = 180
      fromPortId = 'L'
      toPortId = 'R'
      break;

    case go.Spot.Right:
      alignmentFocus = go.Spot.Left
      offsetName = 'x'
      offsetValue = -40
      offsetOn = 'width'
      angle = 0
      fromPortId = 'R'
      toPortId = 'L'
      break;
  }

  return $(go.Shape, 'Chevron', {
    cursor: 'pointer',
    fill: '#fff',
    stroke: '#2196F3',
    strokeWidth: 1,
    width: 26,
    height: 26,
    opacity: 0.5,
    alignment,
    alignmentFocus,
    angle,
    mouseEnter(e, shape) {
      shape.opacity = 1

      let $ = shape.diagram.model
      let { key, position, category } = shape.part.adornedPart
      let { width = 0, height = 0 } = shape.part.adornedPart.locationObject
      let offsetPoint = position[offsetName] - (offsetValue + shape.part.adornedPart.locationObject[offsetOn])
      let shiftPosition = null

      if (offsetName === 'x') {
        shiftPosition = new go.Point(offsetPoint, position.y)
      } else {
        shiftPosition = new go.Point(position.x, offsetPoint)
      }

      creatingShapeData = {
        category,
        loc: go.Point.stringify(shiftPosition),
        width,
        height,
        temporary: true
      }

      delete creatingShapeData.key
      $.addNodeData(creatingShapeData)
      $.addLinkData({
        from: key,
        to: creatingShapeData.key,
        temporary: true,
        fromPortId,
        toPortId
      })
    },
    mouseLeave(e, shape) {
      shape.opacity = 0.5

      if (creatingShapeData) {
        let $ = shape.diagram.model
        let linkData = $.linkDataArray.find(({ to }) => to === creatingShapeData.key)

        $.removeNodeData(creatingShapeData)
        $.removeLinkData(linkData)

        creatingShapeData = null
      }
    },
    click(e, shape) {
      if (creatingShapeData) {
        shape.diagram.model.commit($ => {
          let linkData = $.linkDataArray.find(({ to }) => to === creatingShapeData.key)
          delete creatingShapeData.temporary
          delete linkData.temporary
        })

        creatingShapeData = null
      }
    }
  })
}

function createPreview() {
  var { fill, stroke, strokeDashArray, strokeWidth } = style

  return $(go.Node, 'Vertical',
    {
      locationObjectName: 'SHAPE', cursor: 'move',
      selectionAdornmentTemplate
    },

    $(go.Shape, {
      name: 'SHAPE',
      width: 60,
      height: 60,
      //desiredSize: new go.Size(width / 2, height / 2),
      fill, stroke, strokeDashArray, strokeWidth,
    }, ...makeDataBinding(false, 'angle', 'figure')),
    createTextBlock(this.name, { ...style, fontColor: '#333', fontSize: 12 }, name, {
      isMultiline: false,
    })
  )
}

const Shape = {
  name: 'shape',
  actions,
  style,
  createPreview,

  createTemplate(...opts) {
    var fill = '#fff', stroke = "#333", strokeDashArray = [], strokeWidth = 1, opacity = 1, width = 80, height = 80

    return $(go.Node, 'Auto',
      $(go.Panel, 'Spot',
        {
          stretch: go.GraphObject.Fill,
          mouseEnter(e, shape) {
            showPorts(shape, true)
          },
          mouseLeave(e, shape) {
            showPorts(shape, false)
          },
        },
        $(go.Shape, {
          width,
          height,
          fill,
          stroke,
          opacity,
          strokeDashArray,
          strokeWidth,
          cursor: 'move',
          name: 'NODE',
        },
          ...makeStyleBinding(this.name, ['figure', 'fill', 'opacity', 'stroke', 'strokeWidth', 'strokeDashArray']),
          ...makeDataBinding(true, 'figure', 'fill', 'opacity', 'stroke', 'strokeWidth', 'strokeDashArray', 'width', 'height', 'angle')
        ),
        makePortable(),
      ),
      new go.Binding("position", "loc", go.Point.parse).makeTwoWay(go.Point.stringify),
      createTextBlock(this.name),
      makeTextEditable(),
      makeSelectable(),
      makeRotatable(),
      makeResizable(),
      opts,
    )
  },

  resetStyle(part, ...names) {
    var defaultStyle = _.pick(this.style, names)

    if (_.has(defaultStyle, 'stroke')) {
      part.findObject('NODE').stroke = defaultStyle.stroke
    }

    // if (names.indexOf('stroke') > -1) {
    //   part.findObject('NODE').stroke = '#'
    // }
  }
}

// const Personal = {

//   style: { fill: '#fff', stroke: '#333', strokeDashArray: [], strokeWidth: 1, fontColor: '#333', radius: 4, fontSize: 14, fontFamily: 'arial,sans-serif', fontBold: null, fontItalic: null, isUnderline: null, isStrikethrough: false },

//   form: {
//     avatar: {
//       type: 'file',
//       label: '头像'
//     },
//     name: {
//       type: 'text', label: '姓名', flex: 12
//     },
//     position: {
//       type: 'text', label: '职位', flex: 12
//     },
//     gender: {
//       toCtrl({ value }) {
//         if (value === null) {
//           return '无'
//         }

//         return value
//       },
//       fromCtrl({ value }) {
//         if (value === '无') {
//           return null
//         }

//         return value
//       },
//       type: 'radio', label: '性别', options: ['无', '男', '女'], flex: 12
//     }
//   },

//   createTemplate() {
//     var fill = '#fff', stroke = '#333', radius = 4, strokeDashArray = [], strokeWidth = 1

//     return $(go.Node, "Auto",
//       {
//         doubleClick: (e, object) => {
//           var clicked = object.part;
//           var diagram = clicked.diagram

//           if (clicked !== null) {
//             var thisemp = clicked.data;
//             diagram.startTransaction("add employee");

//             var newemp = {
//               name: "(new person)",
//               title: "",
//               comments: "",
//               parent: thisemp.key,
//               category: 'Personal'
//             };

//             diagram.model.addNodeData(newemp);
//             diagram.commitTransaction("add employee");
//           }
//         }
//       },
//       {
//         // handle dragging a Node onto a Node to (maybe) change the reporting relationship
//         mouseDragEnter: function (e, node) {
//           var diagram = node.diagram;
//           var selnode = diagram.selection.first();
//           if (!mayWorkFor(selnode, node)) return;
//           var shape = node.findObject("SHAPE");
//           if (shape) {
//             shape._prevFill = shape.fill;  // remember the original brush
//             shape.fill = "darkred";
//           }
//         },
//         mouseDragLeave: function (e, node) {
//           var shape = node.findObject("SHAPE");
//           if (shape && shape._prevFill) {
//             shape.fill = shape._prevFill;  // restore the original brush
//           }
//         },
//         mouseDrop: function (e, node) {
//           var diagram = node.diagram;
//           var selnode = diagram.selection.first();  // assume just one Node in selection
//           if (mayWorkFor(selnode, node)) {
//             // find any existing link into the selected node
//             var link = selnode.findTreeParentLink();
//             if (link !== null) {  // reconnect any existing link
//               link.fromNode = node;
//             } else {  // else create a new link
//               diagram.toolManager.linkingTool.insertLink(node, node.port, selnode, selnode.port);
//             }
//           }
//         }
//       },
//       // for sorting, have the Node.text be the data.name
//       new go.Binding("text", "name"),
//       // bind the Part.layerName to control the Node's layer depending on whether it isSelected
//       new go.Binding("layerName", "isSelected", function (sel) { return sel ? "Foreground" : ""; }).ofObject(),
//       // define the node's outer shape
//       $(go.Shape, "RoundedRectangle",
//         {
//           name: "SHAPE",
//           fill,
//           stroke,
//           strokeWidth,
//           strokeDashArray,
//           parameter1: radius,
//           portId: "",
//           fromLinkable: true, toLinkable: true, cursor: "pointer"
//         }),
//       $(go.Panel, "Horizontal",
//         $(go.Panel, 'Auto',
//           $(go.Shape, 'Circle', { fill: 'transparent', stroke: 'transparent' }),
//           $(go.Picture,
//             {
//               name: "PICTURE",
//               desiredSize: new go.Size(39, 50),
//               margin: new go.Margin(6, 8, 6, 10),
//             },
//             new go.Binding("source", "avatar", (avatar) => {
//               return avatar
//             }))
//         ),
//         $(go.Panel, "Vertical",
//           {
//             maxSize: new go.Size(150, 999),
//             margin: new go.Margin(6, 10, 0, 3),
//             defaultAlignment: go.Spot.Left
//           },
//           // createTextBlock(style, '姓名', new go.Binding("text", 'name')),
//           // createTextBlock(style, '性别', new go.Binding("text", 'gender')),
//           // createTextBlock(style, '职位', new go.Binding("text", 'position'))
//           ..._.map(this.form.property, (value, key) => {
//             if (key !== 'avatar') {
//               return createTextBlock(style, '', new go.Binding("text", key))
//             }
//           })
//         )  // end Table Panel
//       ) // end Horizontal Panel
//     );  // end Node
//   }
// }

const ShapeVertical = {
  name: 'shapeVertical',
  styleName: "Shape",
  style,
  actions,
  createPreview,

  createTemplate(opts) {
    var { fill, stroke, strokeDashArray, strokeWidth, opacity, width, height } = this.style

    return $(go.Node, 'Vertical',
      $(go.Shape, {
        width,
        height,
        stretch: go.GraphObject.Fill,
        name: 'NODE',
        fill,
        stroke,
        opacity,
        strokeDashArray,
        strokeWidth,
        cursor: 'move',
        ...makeTextEditable()
      },
        ...makeStyleBinding('shapevertical', ['figure', 'fill', 'opacity', 'stroke', 'strokeWidth', 'strokeDashArray']),
        ...makeDataBinding(false, 'figure', 'fill', 'opacity', 'stroke', 'strokeWidth', 'strokeDashArray'),
        ...makeDataBinding(false, 'width', 'height', 'angle')),

      createTextBlock(this.name, style),
      //makeToolTip(),

      makeSelectable(),
      makeRotatable(),
      makeResizable(),


      opts
    )
  }
}


export default { Shape, ShapeVertical }