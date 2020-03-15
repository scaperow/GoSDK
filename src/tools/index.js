import _ from 'lodash'
import go from 'gojs'
import ResizeTool from '../extentions/ResizeTool'
import DragingGuidTool from '../extentions/GuidedDraggingTool'
import DragingNodeTool from '../extentions/MindDraggingTool'


const $ = go.GraphObject.make

let mesh = null

/**
   * 横线标尺
   */
let gradScaleHoriz = null

/** 
   * 竖向标尺
   */
let gradScaleVert = null

/**
 * 横向坐标尺
 */
let gradIndicatorHoriz = null

/** 
 * 竖向坐标尺
 */
let gradIndicatorVert = null

/**
 * 生成网格
 * @param {*} stroke 
 */
let createMesh = function (stroke) {

  return $(go.Panel, "Grid",
    {
      name: "GRID",
      visible: false,
      gridCellSize: new go.Size(10, 10),
      gridOrigin: new go.Point(0, 0)
    },
    $(go.Shape, "LineH", { strokeWidth: 0.5, interval: 1, stroke }),
    $(go.Shape, "LineH", { strokeWidth: 0.5, interval: 10, stroke }),
    $(go.Shape, "LineV", { strokeWidth: 0.5, interval: 1, stroke }),
    $(go.Shape, "LineV", { strokeWidth: 0.5, interval: 10, stroke })
  )
}

/**
 * 生成标尺
 * @param {*} stroke 
 */
let createRule = function (stroke) {

  var gradScaleHoriz = $(go.Node, "Graduated",
    {
      name: 'GRAD_SCALE',
      selectable: false,
      graduatedTickUnit: 10,
      pickable: false,
      layerName: "Foreground",
      isInDocumentBounds: false,
      isAnimated: false,
      background: '#fff',
      opacity: 0.6,
      visible: false
    },
    $(go.Shape, { name: 'CONTAINER', geometryString: "M0 0 H1920" }),
    $(go.Shape, { geometryString: "M0 0 V3", interval: 1, stroke }),
    $(go.Shape, { geometryString: "M0 0 V15", interval: 5, stroke }),
    $(go.TextBlock,
      {

        font: "10px sans-serif",
        interval: 5,
        alignmentFocus: go.Spot.TopLeft,
        segmentOffset: new go.Point(0, 7)
      },
      stroke
    )
  )

  var gradScaleVert = $(go.Node, "Graduated",
    {
      name: 'GRAD_SCALE',
      selectable: false,
      graduatedTickUnit: 10, pickable: false, layerName: "Foreground",
      isInDocumentBounds: false, isAnimated: false, background: '#fff',
      opacity: 0.6,

      visible: false
    },
    $(go.Shape, { name: 'CONTAINER', geometryString: "M0 0 V1080" }),
    $(go.Shape, { geometryString: "M0 0 V3", interval: 1, alignmentFocus: go.Spot.Bottom }),
    $(go.Shape, { geometryString: "M0 0 V15", interval: 5, alignmentFocus: go.Spot.Bottom }),
    $(go.TextBlock,
      {
        font: "10px sans-serif",
        segmentOrientation: go.Link.OrientOpposite,
        interval: 5,
        stroke,
        alignmentFocus: go.Spot.BottomLeft,
        segmentOffset: new go.Point(0, -7)
      },
    ))

  var gradIndicatorHoriz = $(go.Node,
    {
      visible: false,
      selectable: false,
      pickable: false, layerName: "Foreground",
      isInDocumentBounds: false, isAnimated: false,
      locationSpot: go.Spot.Top
    },
    $(go.Shape, { geometryString: "M0 0 V15", strokeWidth: 2, stroke: "red" })
  )

  var gradIndicatorVert = $(go.Node,
    {
      selectable: false,
      isInDocumentBounds: false, isAnimated: false,
      pickable: false, layerName: "Foreground", visible: false,
      locationSpot: go.Spot.Left
    },
    $(go.Shape, { geometryString: "M0 0 H15", strokeWidth: 2, stroke: "red" })
  )

  return {
    gradScaleHoriz, gradScaleVert, gradIndicatorHoriz, gradIndicatorVert
  }
}

/**
 * 缩放更新
 * @param {} canvas 
 */
let updateScales = function (canvas) {
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
let setupScalesAndIndicators = function (canvas) {
  canvas.commitTransaction("add scales");
  canvas.add(gradScaleHoriz);
  canvas.add(gradScaleVert);
  canvas.add(gradIndicatorHoriz);
  canvas.add(gradIndicatorVert);
  canvas.commitTransaction("add scales");

  updateScales(canvas);
}

/**
 * 从画布移除标尺线控件
 * @param {*} canvas 
 */
let unsetupScalesAndIndicators = function (canvas) {
  canvas.startTransaction("remove scales");
  // Add each node to the diagram
  canvas.remove(gradScaleHoriz);
  canvas.remove(gradScaleVert);
  canvas.remove(gradIndicatorHoriz);
  canvas.remove(gradIndicatorVert);
  canvas.commitTransaction("remove scales");
}

let updateIndicators = function (canvas) {
  var vb = canvas.viewportBounds;
  var mouseCoords = canvas.lastInput.documentPoint;
  gradIndicatorHoriz.location = new go.Point(Math.max(mouseCoords.x, vb.x), vb.y);
  gradIndicatorHoriz.scale = 1 / canvas.scale;
  gradIndicatorVert.location = new go.Point(vb.x, Math.max(mouseCoords.y, vb.y));
  gradIndicatorVert.scale = 1 / canvas.scale;
}

class ToolMaker {
  constructor({ meshColor, ruleColor }, canvas) {
    this.canvas = canvas
    this.meshColor = meshColor
    this.ruleColor = ruleColor

    mesh = createMesh(meshColor)
    var rules = createRule(ruleColor)
    gradScaleHoriz = rules.gradScaleHoriz
    gradScaleVert = rules.gradScaleVert
    gradIndicatorHoriz = rules.gradIndicatorHoriz
    gradIndicatorVert = rules.gradIndicatorVert
  }

  /**
   * 生成网格工具
   */
  makeMeshTemplate() {
    return {
      grid: mesh
    }
  }

  /**
   * 生成尺寸调整工具
   */
  makeResizingTool() {
    return {
      resizingTool: new ResizeTool()
    }
  }

  /**
   * 生成锚点模板
   * @returns {*} properties
   */
  makeArchorTemplate() {
    return $(go.Shape, "Rectangle",
      {
        width: 10,
        height: 10,
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
  makeRelinkTool() {
    return {
      "linkingTool.isUnconnectedLinkValid": true,
      "linkingTool.portGravity": 20,
      "relinkingTool.isUnconnectedLinkValid": true,
      "relinkingTool.portGravity": 20,
      "relinkingTool.fromHandleArchetype":
        $(go.Shape, "Diamond", { segmentIndex: 0, cursor: "pointer", desiredSize: new go.Size(12, 12), fill: "#2196F3", stroke: "#2196F3" }),
      "relinkingTool.toHandleArchetype":
        $(go.Shape, "Diamond", { segmentIndex: -1, cursor: "pointer", desiredSize: new go.Size(12, 12), fill: "#2196F3", stroke: "#2196F3" }),
      "linkReshapingTool.handleArchetype":
        $(go.Shape, "Diamond", { desiredSize: new go.Size(12, 12), fill: "#2196F3", stroke: "#2196F3" })
    }
  }

  /**
   * 生成拖动向导工具
   * @returns {*} properties
   */
  makeGuideDraggingTool() {
    return {
      draggingTool: new DragingGuidTool(),
      'dragSelectingTool.box': $(go.Part,
        { layerName: "Tool", selectable: false },
        $(go.Shape,
          { name: "SHAPE", fill: "#2196F322", stroke: "#2196F399", strokeWidth: 1 })),
      "draggingTool.dragsLink": true,
      "draggingTool.isGridSnapEnabled": true,
      "draggingTool.horizontalGuidelineColor": "blue",
      "draggingTool.verticalGuidelineColor": "blue",
      "draggingTool.centerGuidelineColor": "green",
      "draggingTool.guidelineWidth": 1
    }
  }

  /**
   * 生成拖动树节点工具
   */
  makeDraggingTreeTool() {
    return {
      draggingTool: new DragingNodeTool(),
      'dragSelectingTool.box': $(go.Part,
        { layerName: "Tool", selectable: false },
        $(go.Shape,
          { name: "SHAPE", fill: "#2196F322", stroke: "#2196F399", strokeWidth: 1 })),
    }
  }

  /**
   * 生成旋转工具
   */
  makeRotatingTool() {
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
  setupRule() {
    var canvas = this.canvas
    canvas.addDiagramListener("InitialLayoutCompleted", () => setupScalesAndIndicators(canvas))
    canvas.addDiagramListener("ViewportBoundsChanged", () => updateScales(canvas))
    canvas.addDiagramListener("ViewportBoundsChanged", () => updateIndicators(canvas))

    canvas.toolManager.doMouseMove = function () {
      go.ToolManager.prototype.doMouseMove.call(this)
      updateIndicators(canvas);
    }
    canvas.toolManager.linkingTool.doMouseMove = function () {
      go.LinkingTool.prototype.doMouseMove.call(this)
      updateIndicators(canvas);
    }
    canvas.toolManager.draggingTool.doMouseMove = function () {
      go.DraggingTool.prototype.doMouseMove.call(this)
      updateIndicators(canvas);
    }
    canvas.toolManager.dragSelectingTool.doMouseMove = function () {
      go.DragSelectingTool.prototype.doMouseMove.call(this)
      updateIndicators(canvas);
    }

    canvas.mouseEnter = () => {
      gradIndicatorHoriz.visible = true;
      gradIndicatorVert.visible = true;
    }

    canvas.mouseLeave = () => {
      gradIndicatorHoriz.visible = false;
      gradIndicatorVert.visible = false;
    }

    setupScalesAndIndicators(canvas)
  }

  /**
   * 卸载标尺
   * @param {*} canvas 
   */
  unsetupRule() {
    unsetupScalesAndIndicators(this.canvas)
  }

  setMeshColor(color) {
    this.canvas.grid.elements.each((element) => {
      element.stroke = color
    })
  }

  setRuleColor(color) {
    gradScaleHoriz.elements.each((element) => {
      element.stroke = color
    })

    gradScaleVert.elements.each((element) => {
      element.stroke = color
    })
  }

  setupMesh() {
    mesh.visible = true
  }

  unsetupMesh() {
    mesh.visible = false
  }


}

export default ToolMaker