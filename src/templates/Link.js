
import go from 'gojs'
import { createTextBlock, makeDataBinding, makeStyleBinding } from '../helper'
const $ = go.GraphObject.make
const ActivityWidth = 80
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

function Taper() {
  go.Link.call(this);
}
go.Diagram.inherit(Taper, go.Link);

// produce a Geometry from the Link's route
Taper.prototype.makeGeometry = function () {
  // maybe use the standard geometry for this route, instead?
  var numpts = this.pointsCount;
  if (numpts < 4 || this.computeCurve() !== go.Link.Bezier) {
    return go.Link.prototype.makeGeometry.call(this);
  }

  var p0 = this.getPoint(0);
  var p1 = this.getPoint((numpts > 4) ? 2 : 1);
  var p2 = this.getPoint((numpts > 4) ? numpts - 3 : 2);
  var p3 = this.getPoint(numpts - 1);
  var fromHoriz = Math.abs(p0.y - p1.y) < Math.abs(p0.x - p1.x);
  var toHoriz = Math.abs(p2.y - p3.y) < Math.abs(p2.x - p3.x);

  var p0x = p0.x + (fromHoriz ? 0 : -4);
  var p0y = p0.y + (fromHoriz ? -4 : 0);
  var p1x = p1.x + (fromHoriz ? 0 : -3);
  var p1y = p1.y + (fromHoriz ? -3 : 0);
  var p2x = p2.x + (toHoriz ? 0 : -2);
  var p2y = p2.y + (toHoriz ? -2 : 0);
  var p3x = p3.x + (toHoriz ? 0 : -1);
  var p3y = p3.y + (toHoriz ? -1 : 0);

  var fig = new go.PathFigure(p0x, p0y, true);  // filled
  fig.add(new go.PathSegment(go.PathSegment.Bezier, p3x, p3y, p1x, p1y, p2x, p2y));

  p0x = p0.x + (fromHoriz ? 0 : 4);
  p0y = p0.y + (fromHoriz ? 4 : 0);
  p1x = p1.x + (fromHoriz ? 0 : 3);
  p1y = p1.y + (fromHoriz ? 3 : 0);
  p2x = p2.x + (toHoriz ? 0 : 2);
  p2y = p2.y + (toHoriz ? 2 : 0);
  p3x = p3.x + (toHoriz ? 0 : 1);
  p3y = p3.y + (toHoriz ? 1 : 0);
  fig.add(new go.PathSegment(go.PathSegment.Line, p3x, p3y));
  fig.add(new go.PathSegment(go.PathSegment.Bezier, p0x, p0y, p2x, p2y, p1x, p1y).close());

  var geo = new go.Geometry();
  geo.add(fig);
  geo.normalize();
  return geo;
};



const TreeLink = {
  name: 'treeLink',
  style: {
    stroke: '#333',
    strokeWidth: 1,
    strokeDashArray: []
  },
  node: 'LINE',
  createTemplate(opts) {
    var {
      stroke,
      strokeWidth,
      strokeDashArray
    } = this.style

    return $(go.Link, {
      curve: go.Link.Bezier,
      toEndSegmentLength: 35,
      fromEndSegmentLength: 10,
      selectable: false,
      fromShortLength: -2,
      toShortLength: -2
    },

      $(go.Shape, { name: 'LINE', strokeDashArray, stroke, strokeWidth },
        new go.Binding('stroke', 'toNode', (object) => {
          return object.data.stroke || object.findObject('LINE').stroke || '#3333'
        }).ofObject(),
        new go.Binding('strokeDashArray', 'toNode', (object) => {
          return object.data.strokeDashArray || object.findObject('LINE').strokeDashArray || []
        }).ofObject(),
        ...makeStyleBinding('link', ['strokeWidth']),
        ...makeDataBinding(false, 'strokeWidth', 'stroke', 'strokeDashArray'),
      ),
      opts
    )
  }
}

// time is just an abstract small non-negative integer
// here we map between an abstract time and a vertical position
function convertTimeToY(t) {
  return t * 20 + 40;
}


// a custom routed Link
function MessageLink() {
  go.Link.call(this);
  this.time = 0;  // use this "time" value when this is the temporaryLink
}
go.Diagram.inherit(MessageLink, go.Link);

MessageLink.prototype.getLinkPoint = function (node, port, spot, from, ortho, othernode, otherport) {

  var p = port.getDocumentPoint(go.Spot.Center);
  //var r = port.getDocumentBounds();
  var op = otherport.getDocumentPoint(go.Spot.Center);

  var data = this.data;
  var time = data !== null ? data.time : this.time;  // if not bound, assume this has its own "time" property

  var aw = this.findActivityWidth(node, time);
  var x = (op.x > p.x ? p.x + aw / 2 : p.x - aw / 2);
  var y = convertTimeToY(time);
  return new go.Point(x, y);
};

MessageLink.prototype.findActivityWidth = function (node, time) {
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
};

MessageLink.prototype.getLinkDirection = function (node, port, linkpoint, spot, from, ortho, othernode, otherport) {
  var p = port.getDocumentPoint(go.Spot.Center);
  var op = otherport.getDocumentPoint(go.Spot.Center);
  var right = op.x > p.x;
  return right ? 0 : 180;
};

MessageLink.prototype.computePoints = function () {
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
// end MessageLink

const SequenceLink = {
  name: 'sequenceLink',
  style: {
    stroke: '#333',
    strokeWidth: 1,
    strokeDashArray: [],
    label: {
      fontColor: '#333', fontSize: 14, fontFamily: 'arial,sans-serif', fontBold: null, fontItalic: null, isUnderline: null, isStrikethrough: false
    }
  },

  createTemplate(opts) {
    // var {
    //   stroke,
    //   strokeWidth,
    //   strokeDashArray
    // } = this.style

    return $(MessageLink,  // defined below
      { selectionAdorned: true, curviness: 0 },
      $(go.Shape, "Rectangle",
        { stroke: "black" }),
      $(go.Shape,
        { toArrow: "OpenTriangle", stroke: "black" }),
      $(go.TextBlock,
        {
          font: "400 9pt Source Sans Pro, sans-serif",
          segmentIndex: 0,
          segmentOffset: new go.Point(NaN, NaN),
          isMultiline: false,
          editable: true
        },
        new go.Binding("text", "text").makeTwoWay())
    ),
      opts
  }
}

const StructLink = {
  name: 'structLink',
  createTemplate(opts) {
    return $(go.Link, go.Link.Orthogonal,
      { corner: 5, relinkableFrom: true, relinkableTo: true },
      $(go.Shape, { strokeWidth: 1.5, stroke: "#F5F5F5" }), opts);  // the link shape
  }
}

const LineLink = {
  name: 'lineLink',
  style: {
    line: 'Broken',
    stroke: '#333',
    strokeWidth: 1,
    curve: go.Link.JumpGap,
    routing: go.Link.Orthogonal,
    strokeDashArray: [],
    relinkableFrom: true,
    relinkableTo: true,
    label: {
      fill: '#fff',
      stroke: '#666',
      strokeWidth: 1,
      fontColor: '#333'
    },
    corner: 5,
    toShortLength: 5,
    fromShortLength: 0,
    fromArrow: '',
    reshapable: true,
    toArrow: 'Standard',

  },

  actions: ['delete'],
  node: 'LINE',
  createTemplate(opts) {
    var {
      stroke,
      strokeWidth,
      curve,
      routing,
      strokeDashArray,
      label,
      corner,
      toShortLength,
      fromShortLength,
      fromArrow,
      reshapable,
      toArrow,
      adjusting,
    } = this.style

    var { fill: labelFill,
      stroke: labelStroke,
      strokeWidth: labelStrokeWidth,
    } = label

    return $(go.Link,
      {
        //contextMenu: createContextMenu(actionList.searchAction(...this.actions)),
        selectionAdornmentTemplate: linkSelectionAdornmentTemplate,
        adjusting,
        reshapable,
        resegmentable: true,
        relinkableFrom: true,
        relinkableTo: true,
        curve,
        corner,
        toShortLength,
        fromShortLength,
        selectionAdorned: true,
        routing,
        mouseEnter: function (e, link) {
          if (!e.diagram.isReadOnly || link.part.isSelected) {
            // link.findObject("LINE").stroke = '#FFC107'
            //link.findObject("ARROW").fill = '#FFC107'
            //link.findObject("LABEL").stroke = '#FFC107'
            //link.findObject("HIGHLIGHT").stroke = "#2196F366"
          }

        },
        mouseLeave: function (e, link) {
          if (!e.diagram.isReadOnly && !link.part.isSelected) {
            // link.findObject("ARROW").fill = stroke
            //link.findObject("LABEL").stroke = stroke
            // link.findObject("HIGHLIGHT").stroke = "transparent"
          }
        },
        doubleClick(event, el) {
          if (el.diagram && !el.diagram.isReadOnly) {
            var text = el.part.findObject('TEXT');
            if (text) {
              el.diagram.commandHandler.editTextBlock(text);
            }
          }
        },
      },
      ...makeDataBinding(false, 'smoothness', 'points'),
      new go.Binding("curviness", "curviness").makeTwoWay(),
      new go.Binding('curve', 'line', (line) => line === 'Bend' ? go.Link.Bezier : go.Link.JumpGap),
      new go.Binding('routing', 'line', (line) => (line === 'Straight' || line === 'Bend') ? go.Link.Normal : go.Link.Orthogonal),
      $(go.Shape,
        { isPanelMain: true, strokeWidth: strokeWidth + 6, stroke: "transparent", name: "HIGHLIGHT" },
        new go.Binding('strokeWidth', 'strokeWidth', (strokeWidth) => parseInt(strokeWidth) + 6),
        new go.Binding('stroke', 'isSelected', (selected) => selected ? '#2196F366' : 'transparent').ofObject()
      ),
      $(go.Shape,  // the link path shape
        {
          stroke,
          strokeDashArray,
          strokeWidth,
          name: 'LINE',
          isPanelMain: true,
        },
        ...makeStyleBinding(this.name, ['strokeWidth', 'strokeDashArray', 'stroke']),
        ...makeDataBinding(false, 'strokeWidth', 'strokeDashArray', 'stroke'),
        // new go.Binding('stroke', 'isSelected', (isSelected, object) => {
        //   if (isSelected) {
        //     return '#2196F3'
        //   } else {
        //     return object.part.data.stroke || stroke
        //   }
        // }).ofObject()
      ),

      $(go.Shape,  // the arrowhead
        {
          fromArrow,
          stroke,
          strokeWidth,
          fill: stroke,
          name: 'FROMARROW'
        },
        new go.Binding('fromArrow', 'fromArrow'),
        new go.Binding('scale', 'strokeWidth', (strokeWidth) => parseInt(parseInt(strokeWidth) / 4)),
        // new go.Binding('fill', 'isSelected', (isSelected, object) => {
        //   if (isSelected) {
        //     return '#2196F3'
        //   } else {
        //     return object.part.data.stroke || stroke
        //   }
        // }).ofObject(),
        // new go.Binding('stroke', 'isSelected', (isSelected, object) => {
        //   if (isSelected) {
        //     return '#2196F3'
        //   } else {
        //     return object.part.data.stroke || stroke
        //   }
        // }).ofObject(),
      ),
      $(go.Panel, "Auto",
        {
          background: 'transparent',
          cursor: 'pointer',
          click(e, object) {
            if (object.diagram && !object.diagram.isReadOnly) {
              var text = object.part.findObject('TEXT')
              if (text) {
                object.diagram.commandHandler.editTextBlock(text)
              }
            }
          }
        },
        $(go.Shape, "RoundedRectangle",  // the label shape
          {
            name: "LABEL",
            fill: labelFill,
            strokeWidth: labelStrokeWidth,
            stroke: labelStroke,
            visible: false
          },
          new go.Binding('visible', 'text', (text) => text.length > 0).ofObject('TEXT'),
          // new go.Binding("stroke", "isSelected", function (isSelected, object) {
          //   if (isSelected) {
          //     return '#2196F3'
          //   } else {
          //     return object.part.data.stroke || stroke
          //   }
          // }).ofObject(),
          new go.Binding('strokeWidth', 'strokeWidth'),
          new go.Binding("strokeDashArray", "strokeDashArray"),
          // new go.Binding("stroke", "isSelected", function (sel) { return sel ? '#2196F3' : stroke; }).ofObject(),
        ),
        createTextBlock(this.name, this.style, '')),

      $(go.Shape,  // the arrowhead
        {
          toArrow,
          stroke,
          strokeWidth,
          fill: stroke,
          name: 'TOARROW'
        },
        new go.Binding('scale', 'strokeWidth', (strokeWidth) => parseInt(parseInt(strokeWidth) / 4)),
        new go.Binding('toArrow', 'toArrow'),
        // new go.Binding('fill', 'isSelected', (isSelected, object) => {
        //   if (isSelected) {
        //     return '#2196F3'
        //   } else {
        //     return object.part.data.stroke || stroke
        //   }
        // }).ofObject(),
        // new go.Binding('stroke', 'isSelected', (isSelected, object) => {
        //   if (isSelected) {
        //     return '#2196F3'
        //   } else {
        //     return object.part.data.stroke || stroke
        //   }
        // }).ofObject()
      ),
      opts
    )
  },

  onChangeStyle(part, name, value) {
    if (name === 'strokeWidth' && value <= 0) {
      part.data.strokeWidth = 1
    }

  }
}





export default { LineLink, TreeLink, SequenceLink, StructLink }