import go from 'gojs'
import { relayoutDiagram, computeMinPoolSize, computeLaneSize, computeMinLaneSize } from '../layout/PoolLayout'


const toolTip = go.GraphObject.make("ToolTip", { name: 'SIZE_TOOLTIP' },
  go.GraphObject.make(go.Panel,
    go.GraphObject.make(go.TextBlock, { name: 'TEXT', margin: 4 })))

class ResizeMultipleTool extends go.ResizingTool {
  constructor() {
    super()
  }

  name = 'ResizeMultiple';

  isLengthening = function (direction) {

    return direction === 'Horizontal' ? (this.handle.alignment === go.Spot.Right) : (this.handle.alignment === go.Spot.Bottom)
  }

  computeMinSize() {

    var sz= null
    var lane = this.adornedObject.part
    if (lane.category === 'HorizontalLane') {
      // assert(lane instanceof go.Group && lane.category !== "Pool");
      var direction = 'Horizontal'
      var msz = computeMinLaneSize(lane, direction);  // get the absolute minimum size
      if (this.isLengthening(direction)) {  // compute the minimum length of all lanes
        sz = computeMinPoolSize(lane.containingGroup, direction);
        msz.width = Math.max(msz.width, sz.width);

      } else {  // find the minimum size of this single lane
        sz = computeLaneSize(lane);

        msz.width = Math.max(msz.width, sz.width);
        msz.height = Math.max(msz.height, sz.height);
      }

      return msz;
    }

    return super.computeMinSize()
  }

  resize(newr) {
    var diagram = this.diagram;

    diagram.selection.each((part) => {
      if (part instanceof go.Link)
        return; // only Nodes and simple Parts

      if (part instanceof go.Group && part.category === 'HorizontalLane') {
        // var lane = this.adornedObject.part
        if (this.isLengthening('Horizontal')) {  // changing the length of all of the lanes

          part.containingGroup.memberParts.each(function (part) {
            var shape = part.resizeObject;
            if (shape !== null) {  // set its desiredSize length, but leave each breadth alone
              shape.width = newr.width;
              computeLaneSize(part)
            }
          })
        } else {
          go.ResizingTool.prototype.resize.call(this, newr);
        }

        relayoutDiagram(part.diagram)
      } else if (part instanceof go.Group && part.category === 'verticalLane') {
        if (this.isLengthening('Vertical')) {  // changing the length of all of the lanes
          part.containingGroup.memberParts.each(function (lane) {
            if (!(lane instanceof go.Group)) return;
            var shape = lane.resizeObject;
            if (shape !== null) {  // set its desiredSize length, but leave each breadth alone
              shape.height = newr.height;
            }
          });
        } else {  // changing the breadth of a single lane
          go.ResizingTool.prototype.resize.call(this, newr);
        }

        relayoutDiagram(part.diagram);  // now that the lane has changed size, layout the pool again

      } else if (part instanceof go.Node) {

        var obj = part.resizeObject;
        // calculate new location
        var pos = part.position.copy();
        var angle = obj.getDocumentAngle();
        var sc = obj.getDocumentScale();
        var radAngle = Math.PI * angle / 180;
        var angleCos = Math.cos(radAngle);
        var angleSin = Math.sin(radAngle);
        var deltaWidth = newr.width - obj.naturalBounds.width;
        var deltaHeight = newr.height - obj.naturalBounds.height;
//        var angleRight = (angle > 270 || angle < 90) ? 1 : 0;
        var angleBottom = (angle > 0 && angle < 180) ? 1 : 0;
        var angleLeft = (angle > 90 && angle < 270) ? 1 : 0;
        var angleTop = (angle > 180 && angle < 360) ? 1 : 0;
        pos.x += sc * ((newr.x + deltaWidth * angleLeft) * angleCos - (newr.y + deltaHeight * angleBottom) * angleSin);
        pos.y += sc * ((newr.x + deltaWidth * angleTop) * angleSin + (newr.y + deltaHeight * angleLeft) * angleCos);
        obj.desiredSize = newr.size;
        part.position = pos;
        toolTip.findObject('TEXT').text = 'W:' + newr.size.width + ' H:' + newr.size.height
        diagram.toolManager.showToolTip(toolTip, part)
      }
    });
  }
}

export default ResizeMultipleTool