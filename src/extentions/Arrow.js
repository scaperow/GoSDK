"use strict";
/*
*  Copyright (C) 1998-2019 by Northwoods Software Corporation. All Rights Reserved.
*/

// These are the definitions for all of the predefined arrowheads.
// You do not need to load this file in order to use arrowheads.

// Typical custom definition:
//   map.set("Zigzag", "M0,4 L1,8 3,0 5,8 7,0 8,4");

// Typical usage in a link template:
//   myDiagram.linkTemplate =
//     $(go.Link,
//       $(go.Shape),
//       $(go.Shape, { toArrow: "Zigzag" })
//     );

var map = new Map()

map.set("Standard", "F1 m 0,0 l 8,4 -8,4 2,-4 z");
map.set("Backward", "F1 m 8,0 l -2,4 2,4 -8,-4 z");
map.set("Triangle", "F1 m 0,0 l 8,4.62 -8,4.62 z");
map.set("BackwardTriangle", "F1 m 8,4 l 0,4 -8,-4 8,-4 0,4 z");
map.set("Boomerang", "F1 m 0,0 l 8,4 -8,4 4,-4 -4,-4 z");
map.set("BackwardBoomerang", "F1 m 8,0 l -8,4 8,4 -4,-4 4,-4 z");
map.set("SidewaysV", "m 0,0 l 8,4 -8,4 0,-1 6,-3 -6,-3 0,-1 z");
map.set("BackwardV", "m 8,0 l -8,4 8,4 0,-1 -6,-3 6,-3 0,-1 z");
map.set("OpenTriangle", "m 0,0 l 8,4 -8,4");
map.set("BackwardOpenTriangle", "m 8,0 l -8,4 8,4");
map.set("OpenTriangleLine", "m 0,0 l 8,4 -8,4 m 8.5,0 l 0,-8");
map.set("BackwardOpenTriangleLine", "m 8,0 l  -8,4 8,4 m -8.5,0 l 0,-8");
map.set("OpenTriangleTop", "m 0,0 l 8,4 m 0,4");
// map.set("BackwardOpenTriangleTop", "m 8,0 l -8,4 m 0,4");
// map.set("OpenTriangleBottom", "m 0,8 l 8,-4");
// map.set("BackwardOpenTriangleBottom", "m 0,4 l 8,4");
// map.set("HalfTriangleTop", "F1 m 0,0 l 0,4 8,0 z m 0,8");
map.set("BackwardHalfTriangleTop", "F1 m 8,0 l 0,4 -8,0 z m 0,8");
map.set("HalfTriangleBottom", "F1 m 0,4 l 0,4 8,-4 z");
map.set("BackwardHalfTriangleBottom", "F1 m 8,4 l 0,4 -8,-4 z");
map.set("ForwardSemiCircle", "m 4,0 b 270 180 0 4 4");
map.set("BackwardSemiCircle", "m 4,8 b 90 180 0 -4 4");
// map.set("Feather", "m 0,0 l 3,4 -3,4");
// map.set("BackwardFeather", "m 3,0 l -3,4 3,4");
map.set("DoubleFeathers", "m 0,0 l 3,4 -3,4 m 3,-8 l 3,4 -3,4");
map.set("BackwardDoubleFeathers", "m 3,0 l -3,4 3,4 m 3,-8 l -3,4 3,4");
map.set("TripleFeathers", "m 0,0 l 3,4 -3,4 m 3,-8 l 3,4 -3,4 m 3,-8 l 3,4 -3,4");
map.set("BackwardTripleFeathers", "m 3,0 l -3,4 3,4 m 3,-8 l -3,4 3,4 m 3,-8 l -3,4 3,4");
map.set("ForwardSlash", "m 0,8 l 5,-8");
// map.set("BackSlash", "m 0,0 l 5,8");
// map.set("DoubleForwardSlash", "m 0,8 l 4,-8 m -2,8 l 4,-8");
// map.set("DoubleBackSlash", "m 0,0 l 4,8 m -2,-8 l 4,8");
// map.set("TripleForwardSlash", "m 0,8 l 4,-8 m -2,8 l 4,-8 m -2,8 l 4,-8");
// map.set("TripleBackSlash", "m 0,0 l 4,8 m -2,-8 l 4,8 m -2,-8 l 4,8");
// map.set("Fork", "m 0,4 l 8,0 m -8,0 l 8,-4 m -8,4 l 8,4");
// map.set("BackwardFork", "m 8,4 l -8,0 m 8,0 l -8,-4 m 8,4 l -8,4");
// map.set("LineFork", "m 0,0 l 0,8 m 0,-4 l 8,0 m -8,0 l 8,-4 m -8,4 l 8,4");
// map.set("BackwardLineFork", "m 8,4 l -8,0 m 8,0 l -8,-4 m 8,4 l -8,4 m 8,-8 l 0,8");
// map.set("CircleFork", "F1 m 6,4 b 0 360 -3 0 3 z m 0,0 l 6,0 m -6,0 l 6,-4 m -6,4 l 6,4");
// map.set("BackwardCircleFork", "F1 m 0,4 l 6,0 m -6,-4 l 6,4 m -6,4 l 6,-4 m 6,0 b 0 360 -3 0 3");
// map.set("CircleLineFork", "F1 m 6,4 b 0 360 -3 0 3 z m 1,-4 l 0,8 m 0,-4 l 6,0 m -6,0 l 6,-4 m -6,4 l 6,4");
// map.set("BackwardCircleLineFork", "F1 m 0,4 l 6,0 m -6,-4 l 6,4 m -6,4 l 6,-4 m 0,-4 l 0,8 m 7,-4 b 0 360 -3 0 3");
// map.set("Circle", "F1 m 8,4 b 0 360 -4 0 4 z");
// map.set("Block", "F1 m 0,0 l 0,8 8,0 0,-8 z");
map.set("StretchedDiamond", "F1 m 0,3 l 5,-3 5,3 -5,3 -5,-3 z");
map.set("Diamond", "F1 m 0,4 l 4,-4 4,4 -4,4 -4,-4 z");
map.set("Chevron", "F1 m 0,0 l 5,0 3,4 -3,4 -5,0 3,-4 -3,-4 z");
map.set("StretchedChevron", "F1 m 0,0 l 8,0 3,4 -3,4 -8,0 3,-4 -3,-4 z");
map.set("NormalArrow", "F1 m 0,2 l 4,0 0,-2 4,4 -4,4 0,-2 -4,0 z");
map.set("X", "m 0,0 l 8,8 m 0,-8 l -8,8");
map.set("TailedNormalArrow", "F1 m 0,0 l 2,0 1,2 3,0 0,-2 2,4 -2,4 0,-2 -3,0 -1,2 -2,0 1,-4 -1,-4 z");
map.set("DoubleTriangle", "F1 m 0,0 l 4,4 -4,4 0,-8 z  m 4,0 l 4,4 -4,4 0,-8 z");
map.set("BigEndArrow", "F1 m 0,0 l 5,2 0,-2 3,4 -3,4 0,-2 -5,2 0,-8 z");
map.set("ConcaveTailArrow", "F1 m 0,2 h 4 v -2 l 4,4 -4,4 v -2 h -4 l 2,-2 -2,-2 z");
map.set("RoundedTriangle", "F1 m 0,1 a 1,1 0 0 1 1,-1 l 7,3 a 0.5,1 0 0 1 0,2 l -7,3 a 1,1 0 0 1 -1,-1 l 0,-6 z");
map.set("SimpleArrow", "F1 m 1,2 l -1,-2 2,0 1,2 -1,2 -2,0 1,-2 5,0 0,-2 2,2 -2,2 0,-2 z");
map.set("AccelerationArrow", "F1 m 0,0 l 0,8 0.2,0 0,-8 -0.2,0 z m 2,0 l 0,8 1,0 0,-8 -1,0 z m 3,0 l 2,0 2,4 -2,4 -2,0 0,-8 z");
map.set("BoxArrow", "F1 m 0,0 l 4,0 0,2 2,0 0,-2 2,4 -2,4 0,-2 -2,0 0,2 -4,0 0,-8 z");
map.set("TriangleLine", "F1 m 8,4 l -8,-4 0,8 8,-4 z m 0.5,4 l 0,-8");
map.set("CircleEndedArrow", "F1 m 10,4 l -2,-3 0,2 -2,0 0,2 2,0 0,2 2,-3 z m -4,0 b 0 360 -3 0 3 z");
map.set("DynamicWidthArrow", "F1 m 0,3 l 2,0 2,-1 2,-2 2,4 -2,4 -2,-2 -2,-1 -2,0 0,-2 z");
map.set("EquilibriumArrow", "m 0,3 l 8,0 -3,-3 m 3,5 l -8,0 3,3");
map.set("FastForward", "F1 m 0,0 l 3.5,4 0,-4 3.5,4 0,-4 1,0 0,8 -1,0 0,-4 -3.5,4 0,-4 -3.5,4 0,-8 z");
map.set("Kite", "F1 m 0,4 l 2,-4 6,4 -6,4 -2,-4 z");
map.set("HalfArrowTop", "F1 m 0,0 l 4,4 4,0 -8,-4 z m 0,8");
map.set("HalfArrowBottom", "F1 m 0,8 l 4,-4 4,0 -8,4 z");
map.set("OpposingDirectionDoubleArrow", "F1 m 0,4 l 2,-4 0,2 4,0 0,-2 2,4 -2,4 0,-2 -4,0 0,2 -2,-4 z");
map.set("PartialDoubleTriangle", "F1 m 0,0 4,3 0,-3 4,4 -4,4 0,-3 -4,3 0,-8 z");
// map.set("LineCircle", "F1 m 0,0 l 0,8 m 7 -4 b 0 360 -3 0 3 z");
// map.set("DoubleLineCircle", "F1 m 0,0 l 0,8 m 2,-8 l 0,8 m 7 -4 b 0 360 -3 0 3 z");
// map.set("TripleLineCircle", "F1 m 0,0 l 0,8 m 2,-8 l 0,8 m 2,-8 l 0,8 m 7 -4 b 0 360 -3 0 3 z");
// map.set("CircleLine", "F1 m 6 4 b 0 360 -3 0 3 z m 1,-4 l 0,8");
map.set("DiamondCircle", "F1 m 8,4 l -4,4 -4,-4 4,-4 4,4 m 8,0 b 0 360 -4 0 4 z");
// map.set("PlusCircle", "F1 m 8,4 b 0 360 -4 0 4 l -8 0 z m -4 -4 l 0 8");
map.set("OpenRightTriangleTop", "m 8,0 l 0,4 -8,0 m 0,4");
map.set("OpenRightTriangleBottom", "m 8,8 l 0,-4 -8,0");
// map.set("Line", "m 0,0 l 0,8");
// map.set("DoubleLine", "m 0,0 l 0,8 m 2,0 l 0,-8 z");
// // map.set("TripleLine", "m 0,0 l 0,8 m 2,0 l 0,-8 m 2,0 l 0,8 z");
map.set("PentagonArrow", "F1 m 8,4 l -4,-4 -4,0 0,8 4,0 4,-4 z");



map.forEach((figure, name) => {
  map.set(name, figure)
})

export default map