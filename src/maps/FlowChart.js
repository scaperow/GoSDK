import go from 'gojs'
import Maps from './Maps'
import { makeDataBinding, makeStyleBinding } from '../helper'
import { LineLink } from '../templates/Link'
const $ = go.GraphObject.make
const linkSelectionAdornmentTemplate =
  $(go.Adornment, "Auto",
    $(go.Placeholder)
    // $(go.Shape, 'Line', {

    //   fill: null,
    //   stroke: "#2196F3cc", strokeWidth: 1
    // },
    //   new go.Binding("strokeDashArray", "strokeDashArray"),
    //   new go.Binding("strokeWidth", "strokeWidth"))
  )

// let toolTip = go.GraphObject.make("ToolTip", { name: 'SIZE_TOOLTIP' },
//   go.GraphObject.make(go.Panel,
//     go.GraphObject.make(go.TextBlock, { name: 'TEXT', margin: 4 })))
const DefaultModel = {
}

class FlowChart extends Maps {
  name = "FLOWCHART"
  allowActions = ['undo', 'redo', 'cut', 'paste', 'copy', 'ceiling', 'floor', 'lock', 'unlock', 'merge', 'split']
  linkTemplate = LineLink

  getProperties() {
    return {
      "undoManager.isEnabled": true,
      //"commandHandler.archetypeGroupData": { isGroup: true, title: '分组', ungroupable: true, category: 'Group' },
      ...this.toolMaker.makeGuideDraggingTool(),
      ...this.toolMaker.makeMeshTemplate(),
      ...this.templateMaker.makeGroupTemplate(),
      ...this.templateMaker.makeNodeTemplates(),
      ...this.templateMaker.makeLinkTemplate(),
      ...this.toolMaker.makeRelinkTool(),
      ...this.toolMaker.makeRotatingTool(),
      ...this.toolMaker.makeResizingTool(),
      "draggingTool.dragsLink": true,
      "draggingTool.isGridSnapEnabled": true,
      "relinkingTool.isUnconnectedLinkValid": true,
      "relinkingTool.portGravity": 20,
      "rotatingTool.handleAngle": 270,
      "rotatingTool.handleDistance": 30,
      "rotatingTool.snapAngleMultiple": 15,
      "rotatingTool.snapAngleEpsilon": 15,
      "linkingTool.isUnconnectedLinkValid": true,
      "linkingTool.portGravity": 20
    }
  }

  parseModel(model) {
    return go.Model.fromJson(model || DefaultModel)
  }

  created() {

    //this.toolMaker.setupRule(this.canvas)
    // this.canvas.toolManager.draggingTool.on('dragger:start', () => {
    //   this.templateMaker.onStartDrag.call(this.templateMaker, arguments)
    // })
    // this.canvas.toolManager.draggingTool.on('dragger:dragging', () => {
    //   this.canvas.selection.each(function (part) {
    //     if (part instanceof go.Link || part instanceof go.Group)
    //       return

    //     toolTip.findObject('TEXT').text = `X:${part.position.x.toFixed(2)} Y:${part.position.y.toFixed(2)}`
    //     part.diagram.toolManager.showToolTip(toolTip, part)
    //   })

    //   this.templateMaker.onDragging.call(this.templateMaker, arguments)
    // })
    // this.canvas.toolManager.draggingTool.on('dragger:stop', () => this.templateMaker.onStopDrag.call(this.templateMaker, arguments))
  }

}

export default FlowChart