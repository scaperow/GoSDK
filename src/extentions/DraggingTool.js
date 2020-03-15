"use strict";
import EventEmitter from 'event-emitter'
import go from 'gojs'

/*
*  Copyright (C) 1998-2019 by Northwoods Software Corporation. All Rights Reserved.
*/

/**
* @constructor
* @extends DraggingTool
* @class
* This draggingTool class makes guidelines visible as the parts are dragged around a diagram
* when the selected part is nearly aligned with another part.
*/
function DraggingTool() {
  go.DraggingTool.call(this);
  this.event = EventEmitter()
}

go.Diagram.inherit(DraggingTool, go.DraggingTool)


DraggingTool.prototype.doMouseMove = function () {
  go.DraggingTool.prototype.doMouseMove.call(this)

  this.event.emit('dragger:dragging')
}

DraggingTool.prototype.doActivate = function () {
  go.DraggingTool.prototype.doActivate.call(this)
  this.event.emit('dragger:start')
}

DraggingTool.prototype.on = function (name, listener) {
  this.event.on(name, listener)
}

/**
* Calls the base method from {@link DraggingTool#doDeactivate}
* and removes the guidelines from the graph.
* @this {DraggingTool}
*/
DraggingTool.prototype.doDeactivate = function () {
  go.DraggingTool.prototype.doDeactivate.call(this)
  this.event.emit('dragger:stop')
}

// DraggingNodeTool.prototype.doDragOver = function (pt, obj) {
//   go.DraggingTool.prototype.doDragOver.call(this);
// }

// /**
// * On a mouse-up, snaps the selected part to the nearest guideline.
// * If not snapping, the part remains at its position.
// * This calls {@link #guidelineSnap}.
// * @this {DraggingNodeTool}
// */
// DraggingNodeTool.prototype.doDropOnto = function (pt, obj) {
//   go.DraggingTool.prototype.doDropOnto.call(this)
// }


export default DraggingTool