import go from 'gojs'
import Maps from './Maps'

const DefaultModel = {
  "class": "go.TreeModel",
  "nodeDataArray": [
    { "key": 0, "text": "主题", "location": "0 0", category: 'TreeFree' }
  ]
}


class MindMap extends Maps {
  name = "MINDMAP"
  allowActions = ['undo', 'redo', 'insertChild', 'insertParent', 'insertBrother', 'delete']


  getProperties() {
    return {
      allowCopy: false,
      "commandHandler.copiesTree": true,
      "commandHandler.copiesParentKey": true,
      "commandHandler.deletesTree": true,
      "draggingTool.dragsTree": true,
      "undoManager.isEnabled": true,
      ...this.toolMaker.makeDraggingTreeTool(),
      ...this.templateMaker.makeNodeTemplates(),
      ...this.templateMaker.makeLinkTemplate()
    }
  }

  parseModel(model) {

    // var modelData = null

    // try {
    //   modelData = JSON.parse(model)
    // } catch (e) { }

    // if (_.isEmpty(_.get(modelData, 'nodeDataArray'))) {
    //   modelData = JSON.stringify(DefaultModel)
    // }

    return go.Model.fromJson(model || DefaultModel)
  }

  created() {
    // this.canvas.toolManager.draggingTool.on('dragger:start', () => this.templateMaker.onStartDrag.call(this.templateMaker, arguments))
    // this.canvas.toolManager.draggingTool.on('dragger:dragging', () => this.templateMaker.onDragging.call(this.templateMaker, arguments))
    // this.canvas.toolManager.draggingTool.on('dragger:stop', () => this.templateMaker.onStopDrag.call(this.templateMaker, arguments))
  }
}

export default MindMap