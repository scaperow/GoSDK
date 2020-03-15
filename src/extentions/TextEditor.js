
import go from 'gojs'

var _textBlock = null
var _minSize = null

const selectElementContents = function (el) {
  var range = document.createRange()
  range.selectNodeContents(el)
  var sel = window.getSelection()
  sel.removeAllRanges()
  sel.addRange(range)
}

var textarea = document.createElement('div')
textarea.id = "text_editing"
textarea.setAttribute('contenteditable', true)


textarea.addEventListener('input', function (e) {
  var tool = TextEditor.tool;
  if (tool.textBlock === null) return;
  var textBlock = tool.textBlock;
  var diagram = tool.diagram;
  diagram.startTransaction();
  textBlock.text = this.value;
  diagram.commitTransaction("input text");
  textarea.rows = tool.textBlock.lineCount
}, false)

textarea.addEventListener('keydown', function (e) {
  var tool = TextEditor.tool
  if (tool.textBlock === null) return
  var keynum = e.which

  if (keynum === 13 && e.shiftKey) { //Shift Enter
    // tool.textBlock.text = textarea.innerText
    //tool.doDeactivate()

    if (tool.textBlock.isMultiline === false)
      e.preventDefault()

    tool.acceptText(go.TextEditingTool.Enter)

  } else if (keynum === 13) { // Enter
    tool.acceptText(go.TextEditingTool.Tab)
    return
  } else if (keynum === 9) { // Tab
    tool.acceptText(go.TextEditingTool.Tab)
    e.preventDefault()
    return
  } else if (keynum === 27) { // Esc
    tool.doCancel()

    if (tool.diagram !== null)
      tool.diagram.doFocus()
  }
}, false)

// handle focus:
textarea.addEventListener('focus', function (e) {
  var tool = TextEditor.tool
  if (!tool || tool.currentTextEditor === null) return

  if (tool.state === go.TextEditingTool.StateActive) {
    tool.state = go.TextEditingTool.StateEditing
  }

  if (tool.selectsTextOnActivate) {
    selectElementContents(textarea)
  }
}, false)

// Disallow blur.
// If the textEditingTool blurs and the text is not valid,
// we do not want focus taken off the element just because a user clicked elsewhere.
textarea.addEventListener('blur', function (e) {
  var tool = TextEditor.tool
  if (!tool || tool.currentTextEditor === null || tool.state === go.TextEditingTool.StateNone) return

  textarea.focus()

  if (tool.selectsTextOnActivate) {
    selectElementContents(textarea)
  }
}, false)

var TextEditor = new go.HTMLInfo()

TextEditor.valueFunction = function () {
  return textarea.innerText
}

TextEditor.mainElement = textarea // to reference it more easily

// used to be in doActivate
TextEditor.show = function (textBlock, diagram, tool) {
  if (!(textBlock instanceof go.TextBlock)) return

  TextEditor.tool = tool  // remember the TextEditingTool for use by listeners

  var { width: nodeWidth } = textBlock.part.naturalBounds
  //console.log(textBlock.locationObject)
  // This is called during validation, if validation failed:
  if (tool.state === go.TextEditingTool.StateInvalid) {
    textarea.style.color = 'red'
    textarea.focus()
    return
  }

  var nodePoint = textBlock.part.locationObject.getDocumentPoint(go.Spot.TopLeft)
  // This part is called during initalization:
  var loc = textBlock.getDocumentPoint(go.Spot.TopLeft)
  var pos = diagram.position
  var sc = diagram.scale
  var textscale = textBlock.getDocumentScale() * sc
  if (textscale < tool.minimumEditorScale) {
    textscale = tool.minimumEditorScale
  }
  // Add slightly more width/height to stop scrollbars and line wrapping on some browsers
  // +6 is firefox minimum, otherwise lines will be wrapped improperly
  var textwidth = (textBlock.naturalBounds.width * textscale)
  var textheight = (textBlock.naturalBounds.height * textscale)
  var left = (nodePoint.x - pos.x) * sc
  var top = (loc.y - pos.y) * sc


  textarea.innerText = textBlock.text
  // the only way you can mix font and fontSize is if the font inherits and the fontSize overrides
  // in the future maybe have textarea contained in its own div
  diagram.div.style['font'] = textBlock.font
  diagram.div.style['color'] = textBlock.stroke

  textarea.style['position'] = 'absolute'
  textarea.style['zIndex'] = '100'
  textarea.style['font'] = textBlock.font
  textarea.style['fontSize'] = (textscale * 100) + '%'
  textarea.style['lineHeight'] = 'normal'
  textarea.style['left'] = left + 'px'
  textarea.style['top'] = top + 'px'
  textarea.style['textAlign'] = textBlock.textAlign
  textarea.style['width'] = (nodeWidth) + 'px'
  textarea.style['maxWidth'] = (nodeWidth) + 'px'


  textarea.rows = textBlock.lineCount
  textarea.textScale = textscale // attach a value to the textarea, for convenience
  textarea.className = 'goTXarea'
  diagram.div.appendChild(textarea)
  textarea.focus()

  _textBlock = textBlock
  _minSize = textBlock.minSize
  textBlock.minSize = new go.Size(textBlock.naturalBounds.width, textBlock.naturalBounds.height)
  textBlock.text = null

  if (tool.selectsTextOnActivate) {
    selectElementContents(textarea)
  }
}

TextEditor.hide = function (diagram, tool) {
  _textBlock.minSize = _minSize

  diagram.div.removeChild(textarea)
  textarea.innerText = textarea.innerHTML = ''
  TextEditor.tool = null  // forget reference to TextEditingTool
}

export default TextEditor
