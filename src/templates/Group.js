
import { makeDataBinding, createTextBlock, makeGroupDragable, makeStyleBinding, selectionAdornmentTemplate, makeTextEditable, makeSelectable } from '../helper'
import { PoolLayout, relayoutDiagram } from '../layout/PoolLayout'
import go from 'gojs'
const $ = go.GraphObject.make




function updateCrossLaneLinks(group) {
  group.findExternalLinksConnected().each(function (l) {
    l.visible = (l.fromNode.isVisible() && l.toNode.isVisible());
  });
}


const Group = {
  name: 'group',
  style: { radius: 8, opacity: 1, fill: 'transparent', stroke: '#333', strokeWidth: 1, fontColor: '#333', fontFamily: 'arial,sans-serif', fontSize: 14, fontBold: false, fontItalic: false, isUnderline: false, isStrikethrough: false },
  actions: ['ungroup', 'remove', 'copy', 'cut'],

  /**
   * 
   * @return {GraphObject}
   */
  createTemplate(opts) {
    var { radius, opacity, fill, stroke, strokeWidth } = this.style

    return $(go.Group, "Vertical",
      {
        //contextMenu: createContextMenu(actionList.searchAction('ungroup', 'remove', 'copy', 'cut')),
        cursor: 'move',
        name: 'GROUP',
        ungroupable: true,
        selectionAdornmentTemplate,
        doubleClick(event, node) {
          if (node.diagram && !node.diagram.isReadOnly) {
            var text = node.part.findObject('TEXT')
            if (text) {
              node.diagram.commandHandler.editTextBlock(text)
            }
          }
        }
      },
      $(go.Panel, "Auto",
        $(go.Shape, "RoundedRectangle",
          {
            parameter1: radius,
            fill,
            opacity,
            stroke,
            strokeWidth
          },
          ...makeStyleBinding('group', ['opacity', 'fill', 'radius', 'stroke', 'strokeWidth']),
          ...makeDataBinding(false, 'opacity', 'fill', 'radius', 'stroke', 'strokeWidth'),
        ),
        $(go.Placeholder,
          { padding: 6 },
          ...makeDataBinding(false, 'padding'))
      ),
      createTextBlock(this.name, this.style),
      makeTextEditable(),
      opts
    )
  }
}

const HorizontalLane = {
  name: 'horizontalLane',
  actions: ['cut', 'delete', 'paste', 'group', 'copy', 'ungroup'],

  createPreview() {
    var stroke = '#333', strokeWidth = 1, fill = '#fff'
    return $(go.Group, 'Vertical', {
      name: 'NODE',
      background: fill,
    },

      makeSelectable(),
      $(go.Panel, 'Viewbox', { width: 60, height: 60 },
        $(go.Shape, {
          geometryString: 'M 0 20 L 80 20 L 80 60 L 0 60 L 0 20 M 20 0 L 20 80 L 60 80 L 60 0 L 20 0',
          stroke,
          strokeWidth,
        })
      ),
      createTextBlock(this.name, null, '通道'))
  },

  /**
   * 
   * @return {GraphObject} 
   */
  createTemplate(opts) {
    var radius = 4, opacity = 1, fill = "#fff", stroke = '#333', strokeWidth = 1
    return $(go.Group, "Horizontal",
      {

        layerName: "Background",  // all pools and lanes are always behind all nodes and links
        background: "transparent",  // can grab anywhere in bounds
        name: 'GROUP',
        resizeAdornmentTemplate: $(go.Adornment, "Spot",
          $(go.Placeholder),
          $(go.Shape,  // for changing the length of a lane
            {
              alignment: go.Spot.Right,
              desiredSize: new go.Size(7, 50),
              fill: "lightblue", stroke: "dodgerblue",
              cursor: "col-resize"
            },
            new go.Binding("visible", "", function (ad) {
              if (ad.adornedPart === null) return false;
              return ad.adornedPart.isSubGraphExpanded;
            }).ofObject()),
          $(go.Shape,  // for changing the breadth of a lane
            {
              alignment: go.Spot.Bottom,
              desiredSize: new go.Size(50, 7),
              fill: "lightblue", stroke: "dodgerblue",
              cursor: "row-resize"
            },
            new go.Binding("visible", "", function (ad) {
              if (ad.adornedPart === null) return false;
              return ad.adornedPart.isSubGraphExpanded;
            }).ofObject())
        ),
        selectionObjectName: "GROUP",  // selecting a lane causes the body of the lane to be highlit, not the label
        selectionAdornmentTemplate,
        resizable: true,
        resizeObjectName: "SHAPE",  // the custom resizeAdornmentTemplate only permits two kinds of resizing
        layout: $(go.LayeredDigraphLayout,  // automatically lay out the lane's subgraph
          {
            isInitial: false,  // don't even do initial layout
            isOngoing: false,  // don't invalidate layout when nodes or links are added or removed
            direction: 0,
            columnSpacing: 10,
            layeringOption: go.LayeredDigraphLayout.LayerLongestPathSource
          }),
        computesBoundsAfterDrag: true,  // needed to prevent recomputing Group.placeholder bounds too soon
        computesBoundsIncludingLinks: false,  // to reduce occurrences of links going briefly outside the lane
        computesBoundsIncludingLocation: true,  // to support empty space at top-left corner of lane
        //handlesDragDropForMembers: true,  // don't need to define handlers on member Nodes and Links
        subGraphExpandedChanged: function (grp) {
          var shp = grp.resizeObject;
          if (grp.diagram.undoManager.isUndoingRedoing)
            return;

          if (grp.isSubGraphExpanded) {
            shp.height = grp._savedBreadth;
          } else {
            grp._savedBreadth = shp.height;
            shp.height = NaN;
          }

          updateCrossLaneLinks(grp);
        }
      },

      new go.Binding("location", "loc", go.Point.parse).makeTwoWay(go.Point.stringify),
      new go.Binding("isSubGraphExpanded", "expanded").makeTwoWay(),

      makeTextEditable(),
      // the lane header consisting of a Shape and a TextBlock
      $(go.Panel, "Horizontal",
        {
          name: "HEADER",
          angle: 270,
          alignment: go.Spot.Center
        },
        $(go.Panel, "Horizontal",  // this is hidden when the swimlane is collapsed
          new go.Binding("visible", "isSubGraphExpanded").ofObject(),
          createTextBlock(this.name, null, '通道', { margin: 0 }),
        ),
        $("SubGraphExpanderButton", { margin: 4 })  // but this remains always visible!
      ),  // end Horizontal Panel
      $(go.Panel, "Auto",  // the lane consisting of a background Shape and a Placeholder representing the subgraph
        { ...makeGroupDragable(['*'], { denyCategories: ['verticalPool', 'horizontalPool', 'HorizontalLane', 'verticalLane'] }) },
        $(go.Shape, "RoundedRectangle",  // this is the resized object
          {
            //minSize: isPalatte ? new go.Size(60, 20) : new go.Size(NaN, NaN),
            name: "SHAPE",
            fill,
            stroke,
            strokeWidth,
            parameter1: radius,
            opacity
          },
          ...makeDataBinding(false, 'fill', 'stroke', 'strokeWidth', 'radius', 'opacity'),
          // new go.Binding('minSize', 'dir', (dir) => dir === 'Horizontal' ? new go.Size(320, 260) : new go.Size(320, 260)).ofObject(),
          new go.Binding("desiredSize", "size", go.Size.parse).makeTwoWay(go.Size.stringify),
          new go.Binding("fill", "isHighlighted", (isHighlighted, shape) => isHighlighted ? '#FFC107' : (shape.part.data.color || fill)).ofObject()),
        $(go.Placeholder,
          { alignment: go.Spot.TopLeft, padding: 6 }),
        createTextBlock(this.name, null, '通道', new go.Binding("visible", "isSubGraphExpanded", function (e) { return !e; }).ofObject())

      ),  // end Auto Panel

      createTextBlock(this.name, this.style),
      makeTextEditable(),
      opts
    )
  }
}

const verticalLane = {
  name: 'verticalLane',
  style: { radius: 4, opacity: 1, fill: '#fff', stroke: '#333', strokeWidth: 1, fontColor: '#333', fontFamily: 'arial,sans-serif', fontSize: 14, fontBold: false, fontItalic: false, isUnderline: false, isStrikethrough: false },
  actions: ['cut', 'delete', 'paste', 'group', 'copy', 'ungroup'],
  createPreview() {
    var fill = '#fff', stroke = '#333', strokeWidth = 1

    return $(go.Group, 'Vertical', {
      name: 'NODE',
      background: fill,
    },

      makeSelectable(),
      $(go.Panel, 'Viewbox', { width: 60, height: 60 },
        $(go.Shape, {
          geometryString: 'M 0 20 L 80 20 L 80 60 L 0 60 L 0 20 M 20 0 L 20 80 L 60 80 L 60 0 L 20 0',
          stroke,
          strokeWidth,
        })
      ),
      createTextBlock(this.name, null, '通道'))
  },

  /**
   * 
   * @return {GraphObject} 
   */
  createTemplate(opts) {
    var radius = 4, opacity = 1, fill = '#fff', stroke = '#333', strokeWidth = 1
    return $(go.Group, "Vertical",
      {

        layerName: "Background",  // all pools and lanes are always behind all nodes and links
        background: "transparent",  // can grab anywhere in bounds
        name: 'GROUP',
        resizeAdornmentTemplate:
          $(go.Adornment, "Spot",
            $(go.Placeholder),
            $(go.Shape,  // for changing the length of a lane
              {
                alignment: go.Spot.Bottom,
                desiredSize: new go.Size(50, 7),
                fill: "lightblue", stroke: "dodgerblue",
                cursor: "row-resize"
              },
              new go.Binding("visible", "", function (ad) {
                if (ad.adornedPart === null) return false;
                return ad.adornedPart.isSubGraphExpanded;
              }).ofObject()),
            $(go.Shape,  // for changing the breadth of a lane
              {
                alignment: go.Spot.Right,
                desiredSize: new go.Size(7, 50),
                fill: "lightblue", stroke: "dodgerblue",
                cursor: "col-resize"
              },
              new go.Binding("visible", "", function (ad) {
                if (ad.adornedPart === null) return false;
                return ad.adornedPart.isSubGraphExpanded;
              }).ofObject())
          ),
        selectionObjectName: "GROUP",  // selecting a lane causes the body of the lane to be highlit, not the label
        selectionAdornmentTemplate,
        resizable: true,
        resizeObjectName: "SHAPE",  // the custom resizeAdornmentTemplate only permits two kinds of resizing
        layout: $(go.LayeredDigraphLayout,  // automatically lay out the lane's subgraph
          {
            isInitial: false,  // don't even do initial layout
            isOngoing: false,  // don't invalidate layout when nodes or links are added or removed
            direction: 90,
            columnSpacing: 10,
            layeringOption: go.LayeredDigraphLayout.LayerLongestPathSource
          }),
        computesBoundsAfterDrag: true,  // needed to prevent recomputing Group.placeholder bounds too soon
        computesBoundsIncludingLinks: false,  // to reduce occurrences of links going briefly outside the lane
        computesBoundsIncludingLocation: true,  // to support empty space at top-left corner of lane
        //handlesDragDropForMembers: true,  // don't need to define handlers on member Nodes and Links
        subGraphExpandedChanged: function (grp) {
          var shp = grp.resizeObject;
          if (grp.diagram.undoManager.isUndoingRedoing) return;
          if (grp.isSubGraphExpanded) {
            shp.width = grp._savedBreadth;
          } else {
            grp._savedBreadth = shp.width;
            shp.width = NaN;
          }
          updateCrossLaneLinks(grp);
        }
      },

      new go.Binding("location", "loc", go.Point.parse).makeTwoWay(go.Point.stringify),
      new go.Binding("isSubGraphExpanded", "expanded").makeTwoWay(),

      makeTextEditable(),
      // the lane header consisting of a Shape and a TextBlock
      $(go.Panel, "Horizontal",
        {
          name: "HEADER",
          angle: 0,
          alignment: go.Spot.Center,
        },
        $(go.Panel, "Horizontal",  // this is hidden when the swimlane is collapsed
          new go.Binding("visible", "isSubGraphExpanded").ofObject(),
          createTextBlock(this.name, null, '通道', { margin: 0 }),
        ),
        $("SubGraphExpanderButton", { margin: 5 })  // but this remains always visible!
      ),  // end Horizontal Panel
      $(go.Panel, "Auto",  // the lane consisting of a background Shape and a Placeholder representing the subgraph

        $(go.Shape, "RoundedRectangle",  // this is the resized object
          {
            minSize: new go.Size(100, 60),
            name: "SHAPE",
            fill,
            stroke,
            strokeWidth,
            parameter1: radius,
            opacity
          },
          ...makeDataBinding(false, 'fill', 'stroke', 'strokeWidth', 'radius', 'opacity'),
          new go.Binding("desiredSize", "size", go.Size.parse).makeTwoWay(go.Size.stringify),
          new go.Binding("fill", "isHighlighted", (isHighlighted, shape) => isHighlighted ? '#FFC107' : (shape.part.data.color || fill)).ofObject()),
        $(go.Placeholder,
          { alignment: go.Spot.TopLeft, padding: 6, angle: 90 }, makeGroupDragable(['*'], { denyCategories: ['verticalPool', 'horizontalPool', 'HorizontalLane', 'verticalLane'] })),
        createTextBlock(this.name, null, '通道', new go.Binding("visible", "isSubGraphExpanded", function (e) { return !e; }).ofObject())

      ),  // end Auto Panel
      opts
    )
  }
}

const horizontalPool = {
  name: 'horizontalPool',
  //node: 'SHAPE,TABLE',
  styleSetter: {},
  style: { radius: 4, fill: '#fff', stroke: '#333', strokeWidth: 1, strokeDashArray: [], fontColor: '#333', fontFamily: 'arial,sans-serif', fontSize: 14, fontBold: false, fontItalic: false, isUnderline: false, isStrikethrough: false },
  actions: ['insertLane', 'cut', 'delete', 'paste', 'group', 'copy', 'ungroup'],
  subscribes: {
    "SelectionMoved": (e) => relayoutDiagram(e.diagram),
    "SelectionCopied": (e) => relayoutDiagram(e.diagram)
  },

  createPreview() {

    var stroke = '#333', strokeWidth = 1, fill = '#fff'
    return $(go.Group, 'Vertical', {
      name: 'NODE',
      background: fill,
    },
      makeSelectable(),
      $(go.Panel, 'Viewbox', { width: 60, height: 60 },
        $(go.Shape, {
          stroke, strokeWidth,
          fill,
          geometryString: 'M 0 0 L 80 0 L 80 80 L 0 80 L 0 0 M 20 0 L 20 80 M 20 40 L 80 40',
        })),
      createTextBlock(this.name, null, '泳道')
    )

  },

  /**
   * 
   * @return {GraphObject} 
   */
  createTemplate(opts) {
    var radius = 4, fill = "#fff", stroke = '#333', strokeWidth = 1, strokeDashArray = []

    return $(go.Group, "Auto",
      {
        selectionAdornmentTemplate,
        layerName: "Background",
        background: "transparent",
        layout: $(PoolLayout, { direction: 'Horizontal', spacing: 6 }), // no space between lanes
        //contextMenu: createContextMenu(actionList.searchAction(...this.actions)),
        ...makeGroupDragable(['HorizontalLane']),
      },

      new go.Binding("location", "loc", go.Point.parse).makeTwoWay(go.Point.stringify),
      makeTextEditable(),
      $(go.Shape, 'RoundedRectangle',
        {
          name: 'NODE',
          fill,
          stroke,
          strokeWidth,
          parameter1: radius,
          strokeDashArray,
          minSize: new go.Size(100, 60),
        },
        new go.Binding("fill", "isHighlighted", (isHighlighted, shape) => isHighlighted ? '#FFC107' : (shape.part.data.color || fill)).ofObject(),
        ...makeDataBinding(false, 'fill', 'stroke', 'strokeWidth', 'radius', 'strokeDashArray')),
      $(go.Panel, 'Table',
        {
          name: 'TABLE',
          defaultColumnSeparatorStroke: stroke,
          defaultColumnSeparatorStrokeWidth: strokeWidth,
          defaultRowSeparatorDashArray: strokeDashArray
        },
        new go.Binding('defaultColumnSeparatorStroke', 'stroke'),
        new go.Binding('defaultColumnSeparatorStrokeWidth', 'strokeWidth'),
        new go.Binding('defaultColumnSeparatorDashArray', 'strokeDashArray'),
        $(go.Panel, "Horizontal", { column: 0, angle: 270 },
          createTextBlock(this.name, this.style, '横向泳道')),
        $(go.Placeholder,
          { padding: 0, column: 1 }
        )
      ),
      opts
    )
  }
}


const verticalPool = {
  style: { fill: '#fff', stroke: '#333', strokeWidth: 1, radius: 2, strokeDashArray: [] },
  name: 'verticalPool',
  //node: 'SHAPE,TABLE',
  // styleSetter: {},
  // style: { radius: 4, fill: '#fff', stroke: '#333', strokeWidth: 1, strokeDashArray: [], fontColor: '#333', fontFamily: 'arial,sans-serif', fontSize: 14, fontBold: false, fontItalic: false, isUnderline: false, isStrikethrough: false },
  actions: ['insertLane', 'cut', 'delete', 'paste', 'group', 'copy', 'ungroup'],
  subscribes: {
    "SelectionMoved": (e) => relayoutDiagram(e.diagram),
    "SelectionCopied": (e) => relayoutDiagram(e.diagram)
  },

  createPreview() {
    var fill = '#fff', stroke = '#333', strokeWidth = 1
    return $(go.Group, 'Vertical', {
      name: 'NODE',
      background: fill,
    },
      makeSelectable(),
      $(go.Panel, 'Viewbox', { width: 60, height: 60 },
        $(go.Shape, {
          stroke, strokeWidth,
          fill,
          geometryString: 'M 0 0 L 80 0 L 80 80 L 0 80 L 0 0 M 0 20 L 80 20 M 40 20 L 40 80',
        },
        )),
      createTextBlock(this.name, this.style, '泳道')
    )

  },

  /**
   * 
   * @return {GraphObject} 
   */
  createTemplate(opts) {
    var { fill, stroke, strokeWidth, radius, strokeDashArray } = this.style
    return $(go.Group, "Auto",
      {
        selectionAdornmentTemplate,
        layerName: "Background",
        background: "transparent",
        layout: $(PoolLayout, { direction: 'Vertical', spacing: 0 }), // no space between lanes
        //contextMenu: createContextMenu(actionList.searchAction(...this.actions)),
        ...makeGroupDragable(['verticalLane']),
      },

      new go.Binding("location", "loc", go.Point.parse).makeTwoWay(go.Point.stringify),
      makeTextEditable(),
      $(go.Shape, 'RoundedRectangle',
        {
          name: 'NODE',
          fill,
          stroke,
          strokeWidth,
          parameter1: radius,
          strokeDashArray,
        },
        new go.Binding("fill", "isHighlighted", (isHighlighted, shape) => isHighlighted ? '#FFC107' : (shape.part.data.color || fill)).ofObject(),
        ...makeDataBinding(false, 'fill', 'stroke', 'strokeWidth', 'radius', 'strokeDashArray')),
      $(go.Panel, 'Table',
        {
          name: 'TABLE',
          defaultRowSeparatorStroke: stroke,
          defaultRowSeparatorStrokeWidth: strokeWidth,
          defaultRowSeparatorDashArray: strokeDashArray
        },
        new go.Binding('defaultRowSeparatorStroke', 'stroke'),
        new go.Binding('defaultRowSeparatorStrokeWidth', 'strokeWidth'),
        new go.Binding('defaultRowSeparatorDashArray', 'strokeDashArray'),
        $(go.Panel, "Horizontal", { row: 0, angle: 0 },
          createTextBlock(this.name, this.style, '竖向泳道', {
            stretch: go.GraphObject.Horizontal
          })
        ),
        $(go.Placeholder,
          { padding: 0, row: 1 }
        )
      ),
      opts
    )
  }
}


export default { Group, verticalPool, horizontalPool, verticalLane, HorizontalLane }