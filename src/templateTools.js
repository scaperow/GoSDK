/**
 * go templates
 */

import go from 'gojs'
import ResizeTool from './extentions/ResizeTool'
import DraggingTool from './extentions/DraggingTool'
import { makeEmptyBinding, makeEmptyChildBinding } from './helper'
import './extentions/Button'

const $ = go.GraphObject.make
/**
   * 横线标尺
   */
let gradScaleHoriz = $(go.Node, "Graduated",
  {
    name: 'GRAD_SCALE',
    selectable: false,
    graduatedTickUnit: 10,
    pickable: false,
    layerName: "Foreground",
    isInDocumentBounds: false,
    isAnimated: false,
    background: '#fff',
    opacity: 0.6
  },
  $(go.Shape, { name: 'CONTAINER', geometryString: "M0 0 H1920" }, ...makeEmptyBinding('strokeColor')),
  $(go.Shape, { geometryString: "M0 0 V3", interval: 1 }, ...makeEmptyBinding('strokeColor')),
  $(go.Shape, { geometryString: "M0 0 V15", interval: 5 }, ...makeEmptyBinding('strokeColor')),
  $(go.TextBlock,
    {

      font: "10px sans-serif",
      interval: 5,
      alignmentFocus: go.Spot.TopLeft,
      segmentOffset: new go.Point(0, 7)
    },
    new go.Binding('fontColor', 'strokeColor').makeTwoWay()
  )
)

/** 
   * 竖向标尺
   */
let gradScaleVert = $(go.Node, "Graduated",
  {
    name: 'GRAD_SCALE',
    selectable: false,
    graduatedTickUnit: 10, pickable: false, layerName: "Foreground",
    isInDocumentBounds: false, isAnimated: false, background: '#fff',
    opacity: 0.6
  },
  $(go.Shape, { name: 'CONTAINER', geometryString: "M0 0 V1080" }, ...makeEmptyBinding('strokeColor')),
  $(go.Shape, { geometryString: "M0 0 V3", interval: 1, alignmentFocus: go.Spot.Bottom }, ...makeEmptyBinding('strokeColor')),
  $(go.Shape, { geometryString: "M0 0 V15", interval: 5, alignmentFocus: go.Spot.Bottom }, ...makeEmptyBinding('strokeColor')),
  $(go.TextBlock,
    {
      font: "10px sans-serif",
      segmentOrientation: go.Link.OrientOpposite,
      interval: 5,
      alignmentFocus: go.Spot.BottomLeft,
      segmentOffset: new go.Point(0, -7)
    },
    new go.Binding('fontColor', 'strokeColor').makeTwoWay()
  )
)

/**
 * 横向坐标尺
 */
let gradIndicatorHoriz = $(go.Node,
  {
    selectable: false,
    pickable: false, layerName: "Foreground", visible: false,
    isInDocumentBounds: false, isAnimated: false,
    locationSpot: go.Spot.Top
  },
  $(go.Shape, { geometryString: "M0 0 V15", strokeWidth: 2, stroke: "red" })
)

/** 
 * 竖向坐标尺
 */
let gradIndicatorVert = $(go.Node,
  {
    selectable: false,
    pickable: false, layerName: "Foreground", visible: false,
    isInDocumentBounds: false, isAnimated: false,
    locationSpot: go.Spot.Left
  },
  $(go.Shape, { geometryString: "M0 0 H15", strokeWidth: 2, stroke: "red" })
)


class Maker {
  constructor(style, canvas) {
    this.style = style
    this.canvas = canvas

    this.changeStyle(style)
  }


  /**
   * 缩放更新
   * @param {} canvas 
   */
  updateScales (canvas) {
    var vb = canvas.viewportBounds;

    canvas.startTransaction("update scales");

    gradScaleHoriz.location = new go.Point(vb.x, vb.y);
    gradScaleHoriz.graduatedMin = vb.x;
    gradScaleHoriz.graduatedMax = vb.right;
    gradScaleHoriz.scale = 1 / canvas.scale;

    gradScaleVert.location = new go.Point(vb.x, vb.y);
    gradScaleVert.graduatedMin = vb.y;
    gradScaleVert.graduatedMax = vb.bottom;
    gradScaleVert.scale = 1 / canvas.scale;

    canvas.commitTransaction("update scales");

    var w = canvas.div.offsetWidth
    var h = canvas.div.offsetHeight
    if (w > 0 && h > 0) {
      gradScaleHoriz.part.findObject('CONTAINER').setProperties({ geometryString: `M0 0 H${w}` })
      gradScaleVert.part.findObject('CONTAINER').setProperties({ geometryString: `M0 0 V${h}` })
    }
  }

  /**
   * 从画布安装标尺线控件
   * @param {*} canvas 
   */
  setupScalesAndIndicators (canvas) {
    canvas.commitTransaction("add scales");
    canvas.add(gradScaleHoriz);
    canvas.add(gradScaleVert);
    canvas.add(gradIndicatorHoriz);
    canvas.add(gradIndicatorVert);
    canvas.commitTransaction("add scales");

    this.updateScales(canvas);
  }

  /**
   * 从画布移除标尺线控件
   * @param {*} canvas 
   */
  unsetupScalesAndIndicators (canvas) {
    canvas.startTransaction("remove scales");
    // Add each node to the diagram
    canvas.remove(gradScaleHoriz);
    canvas.remove(gradScaleVert);
    canvas.remove(gradIndicatorHoriz);
    canvas.remove(gradIndicatorVert);
    canvas.commitTransaction("remove scales");
  }

  updateIndicators (canvas) {
    var vb = canvas.viewportBounds;
    var mouseCoords = canvas.lastInput.documentPoint;
    gradIndicatorHoriz.location = new go.Point(Math.max(mouseCoords.x, vb.x), vb.y);
    gradIndicatorHoriz.scale = 1 / canvas.scale;
    gradIndicatorVert.location = new go.Point(vb.x, Math.max(mouseCoords.y, vb.y));
    gradIndicatorVert.scale = 1 / canvas.scale;
  }
  /**
   * 生成网格工具
   */
  makeMeshTemplate () {
    return {
      grid: $(go.Panel, "Grid",
        {
          name: "GRID",
          visible: true,
          gridCellSize: new go.Size(10, 10),
          gridOrigin: new go.Point(0, 0)
        },
        $(go.Shape, "LineH", { strokeWidth: 0.5, interval: 1, stroke: '#e3e3e3' }),
        $(go.Shape, "LineH", { strokeWidth: 0.5, interval: 10, stroke: '#c0c0c0' }),
        $(go.Shape, "LineV", { strokeWidth: 0.5, interval: 1, stroke: '#e3e3e3' }),
        $(go.Shape, "LineV", { strokeWidth: 0.5, interval: 10, stroke: '#c0c0c0' })
      )
    }
  }

  /**
   * 生成尺寸调整工具
   */
  makeResizingTool () {
    return {
      resizingTool: new ResizeTool()
    }
  }

  /**
   * 生成锚点模板
   * @returns {*} properties
   */
  makeArchorTemplate () {
    return $(go.Shape, "Rectangle",
      {
        width: 10,
        height: 10,
        stroke: null,
        opacity: 0.8, fill: "#409eff", stroke: '#333', mouseEnter: (e, p) => {
          if (!p.cursor) {
            const { alignment: align } = p
            if (align === go.Spot.TopLeft) {
              p.cursor = 'nw-resize'
            } else if (align === go.Spot.TopCenter) {
              p.cursor = 'n-resize'
            } else if (align === go.Spot.TopRight) {
              p.cursor = 'ne-resize'
            } else if (align === go.Spot.RightCenter) {
              p.cursor = 'e-resize'
            } else if (align === go.Spot.BottomRight) {
              p.cursor = 'se-resize'
            } else if (align === go.Spot.BottomCenter) {
              p.cursor = 's-resize'
            } else if (align === go.Spot.BottomLeft) {
              p.cursor = 'sw-resize'
            } else if (align === go.Spot.LeftCenter) {
              p.cursor = 'w-resize'
            }
          }
        }
      }, new go.Binding('cursor'))
  }
  /**
   * 生成重链接工具
   * @returns {*} properties
   */
  makeRelinkTool () {
    return {
      "linkingTool.isUnconnectedLinkValid": true,
      "linkingTool.portGravity": 20,
      "relinkingTool.isUnconnectedLinkValid": true,
      "relinkingTool.portGravity": 20,
      "relinkingTool.fromHandleArchetype":
        $(go.Shape, "Diamond", { segmentIndex: 0, cursor: "pointer", desiredSize: new go.Size(8, 8), fill: "tomato", stroke: "deepskyblue" }),
      "relinkingTool.toHandleArchetype":
        $(go.Shape, "Diamond", { segmentIndex: -1, cursor: "pointer", desiredSize: new go.Size(8, 8), fill: "darkred", stroke: "tomato" }),
      "linkReshapingTool.handleArchetype":
        $(go.Shape, "Diamond", { desiredSize: new go.Size(7, 7), fill: "lightblue", stroke: "deepskyblue" })
    }
  }
  /**
   * 生成拖动工具
   * @returns {*} properties
   */
  makeDraggingTool () {
    return {
      draggingTool: new DraggingTool(),
      "draggingTool.dragsLink": true,
      "draggingTool.isGridSnapEnabled": true,
      "draggingTool.horizontalGuidelineColor": "blue",
      "draggingTool.verticalGuidelineColor": "blue",
      "draggingTool.centerGuidelineColor": "green",
      "draggingTool.guidelineWidth": 1
    }
  }
  /**
   * 生成旋转工具
   */
  makeRotatingTool () {
    return {
      "rotatingTool.handleAngle": 270,
      "rotatingTool.handleDistance": 30,
      "rotatingTool.snapAngleMultiple": 15,
      "rotatingTool.snapAngleEpsilon": 15,
    }
  }
  /**
   * 安装标尺
   * @param {*} canvas 
   */
  setupRule (canvas, width, height) {
    var mine = this
    canvas.addDiagramListener("InitialLayoutCompleted", () => this.setupScalesAndIndicators(canvas))
    canvas.addDiagramListener("ViewportBoundsChanged", () => this.updateScales(canvas))
    canvas.addDiagramListener("ViewportBoundsChanged", () => this.updateIndicators(canvas))

    canvas.toolManager.doMouseMove = function () {
      go.ToolManager.prototype.doMouseMove.call(this)
      mine.updateIndicators(canvas);
    }
    canvas.toolManager.linkingTool.doMouseMove = function () {
      go.LinkingTool.prototype.doMouseMove.call(this)
      mine.updateIndicators(canvas);
    }
    canvas.toolManager.draggingTool.doMouseMove = function () {
      go.DraggingTool.prototype.doMouseMove.call(this)
      mine.updateIndicators(canvas);
    }
    canvas.toolManager.dragSelectingTool.doMouseMove = function () {
      go.DragSelectingTool.prototype.doMouseMove.call(this)
      mine.updateIndicators(canvas);
    }

    canvas.mouseEnter = () => {
      gradIndicatorHoriz.visible = true;
      gradIndicatorVert.visible = true;
    }

    canvas.mouseLeave = () => {
      gradIndicatorHoriz.visible = false;
      gradIndicatorVert.visible = false;
    }

    this.setupScalesAndIndicators(canvas)
  }

  /**
   * 卸载标尺
   * @param {*} canvas 
   */
  unsetupRule (canvas) {
    this.unsetupScalesAndIndicators(canvas)
  }

  /**
   * 改变样式
   * @param {*} styleObject 
   * @param {*} canvas 
   */
  changeStyle (styleObject) {
    this.style = styleObject

    if (!_.isEmpty(styleObject)) {
      let { meshColor, ruleColor } = _.get(styleObject, 'Root')

      if (!_.isEmpty(meshColor)) {
        this.canvas.grid.elements.each((element) => {
          element.stroke = meshColor
        })
      }

      if (!_.isEmpty(ruleColor)) {
        gradScaleHoriz.elements.each((element) => {
          element.stroke = ruleColor
        })

        gradScaleVert.elements.each((element) => {
          element.stroke = ruleColor
        })
      }
    }

  }

  setupMesh (canvas) {
    if (canvas.grid) {
      canvas.setProperties({
        'grid.visible': true
      })
    } else {
      canvas.setProperties(this.makeMeshTemplate())
    }
  }

  unsetupMesh (canvas) {
    canvas.setProperties({
      'grid.visible': false
    })
  }
}

export default Maker