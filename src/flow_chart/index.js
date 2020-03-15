import go from 'gojs'
import _ from 'lodash'
import Maps from '../maps'

let $ = go.GraphObject.make
const DefaultModel = {
}

class FlowChart extends Maps {
  name = "FLOWCHART"
  allowActions = ['brush', 'ceiling', 'floor', 'lock', 'unlock', 'link', 'group', 'ungroup']
  mount (elementId) {
    super.mount(elementId)
    // var { onMouseEnter, onMouseLeave } = makeRule(this.canvas)

    var properties = {
      ...this.toolMaker.makeMeshTemplate(),
      //...makeGroupTemplate(),
      ...this.templateMaker.makeNodeTemplates(),
      ...this.templateMaker.makeFlowLinkTemplate(),
      ...this.toolMaker.makeRelinkTool(),
      ...this.toolMaker.makeDraggingTool(),
      ...this.toolMaker.makeRotatingTool(),
      ...this.toolMaker.makeResizingTool(),
      // mouseEnter: onMouseEnter,
      // mouseLeave: onMouseLeave,
      model: go.Model.fromJson(this.model || DefaultModel)
    }

    this.canvas.setProperties(properties)
    super.bindEvents()
  }
}

export default FlowChart