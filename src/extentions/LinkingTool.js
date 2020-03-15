// A custom LinkingTool that fixes the "time" (i.e. the Y coordinate)
// for both the temporaryLink and the actual newly created Link
import go from 'gojs'
var $ = go.GraphObject.make


function ensureLifelineHeights(e) {
    // iterate over all Activities (ignore Groups)
    var arr = myDiagram.model.nodeDataArray;
    var max = -1;
    for (var i = 0; i < arr.length; i++) {
        var act = arr[i];
        if (act.isGroup) continue;
        max = Math.max(max, act.start + act.duration);
    }
    if (max > 0) {
        // now iterate over only Groups
        for (var i = 0; i < arr.length; i++) {
            var gr = arr[i];
            if (!gr.isGroup) continue;
            if (max > gr.duration) {  // this only extends, never shrinks
                myDiagram.model.setDataProperty(gr, "duration", max);
            }
        }
    }
}

class MessageLink extends go.Link {
    time = 0

    getLinkPoint(node, port, spot, from, ortho, othernode, otherport) {
        var p = port.getDocumentPoint(go.Spot.Center);
        var r = port.getDocumentBounds();
        var op = otherport.getDocumentPoint(go.Spot.Center);

        var data = this.data;
        var time = data !== null ? data.time : this.time;  // if not bound, assume this has its own "time" property

        var aw = this.findActivityWidth(node, time);
        var x = (op.x > p.x ? p.x + aw / 2 : p.x - aw / 2);
        var y = convertTimeToY(time);
        return new go.Point(x, y);
    }

    findActivityWidth(node, time) {
        var aw = ActivityWidth;
        if (node instanceof go.Group) {
            // see if there is an Activity Node at this point -- if not, connect the link directly with the Group's lifeline
            if (!node.memberParts.any(function (mem) {
                var act = mem.data;
                return (act !== null && act.start <= time && time <= act.start + act.duration);
            })) {
                aw = 0;
            }
        }
        return aw;
    }

    getLinkDirection(node, port, linkpoint, spot, from, ortho, othernode, otherport) {
        var p = port.getDocumentPoint(go.Spot.Center);
        var op = otherport.getDocumentPoint(go.Spot.Center);
        var right = op.x > p.x;
        return right ? 0 : 180;
    }

    computePoints() {
        if (this.fromNode === this.toNode) {  // also handle a reflexive link as a simple orthogonal loop
            var data = this.data;
            var time = data !== null ? data.time : this.time;  // if not bound, assume this has its own "time" property
            var p = this.fromNode.port.getDocumentPoint(go.Spot.Center);
            var aw = this.findActivityWidth(this.fromNode, time);

            var x = p.x + aw / 2;
            var y = convertTimeToY(time);
            this.clearPoints();
            this.addPoint(new go.Point(x, y));
            this.addPoint(new go.Point(x + 50, y));
            this.addPoint(new go.Point(x + 50, y + 5));
            this.addPoint(new go.Point(x, y + 5));
            return true;
        } else {
            return go.Link.prototype.computePoints.call(this);
        }
    }
}

class LinkingTool extends go.LinkingTool() {
    doActivate() {
        super.doActivate()
        //var time = convertYToTime(this.diagram.firstInput.documentPoint.y);
        //this.temporaryLink.time = Math.ceil(time);  // round up to an integer value
    }

    insertLink(fromNode, fromPort, toNode, toPort) {

        var newLink = super.insertLink(fromNode, fromPort, toNode, toPort)
        if (fromNode.category === 'Sequential' && toNode.category === 'Sequential') {
            if (newLink !== null) {
                var model = this.diagram.model;
                // specify the time of the message
                var start = this.temporaryLink.time;
                var duration = 1;
                newLink.data.time = start;
                model.setDataProperty(newlink.data, "text", "msg");
                // and create a new Activity node data in the "to" group data
                var newact = {
                    group: newLink.data.to,
                    start: start,
                    duration: duration
                };
                model.addNodeData(newact)
                // now make sure all Lifelines are long enough
                ensureLifelineHeights()
            }
            return newLink;
        }

        return newLink
    }

}

export default LinkingTool