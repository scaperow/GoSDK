import go from 'gojs'
import _ from 'lodash'
import EventEmitter from 'event-emitter'
import LinkTemplates from './Link'
import CanvasTemplates from './Canvas'
import PictureTemplates from './Picture'
import TreeTemplates from './Tree'
import ShapeTemplates from './Shape'
import GroupTemplates from './Group'
import IconTemplates from './Icon'
import Actions from '../Action'
import { createContextMenu } from '../helper'

const { TreeLink, LineLink, SequenceLink, StructLink } = LinkTemplates

const containerStyleName = ['background']
const nodeStyleName = ['fill', 'stroke', 'strokeDashArray', 'strokeWidth', 'opacity', 'width', 'height']
const textStyleName = ['fontColor', 'fontFamily', 'fontSize', 'fontBold', 'fontItalic', 'isUnderline', 'isStrikethrough']


/**
 * 用于生成形状模板的类
 */
class TemplateMaker {
  event = EventEmitter()
  groups = new Map()
  nodes = new Map()
  links = new Map()
  mouseDrops = {}
  mouseDragEnters = {}
  mouseDragLeaves = {}
  actionList = null
  canvas = null

  constructor(style, canvas, actionList, mapName = 'FLOWCHART') {
    this.mapName = mapName
    this.canvas = canvas
    this.actionList = actionList || new Actions(canvas)

    this.setMap(this.nodes, CanvasTemplates, ShapeTemplates, TreeTemplates, IconTemplates, PictureTemplates)
    this.setMap(this.groups, GroupTemplates)

    this.canvas.addDiagramListener('SelectionDeleting', this.onDeleteing.bind(this))

    if (this.canvas instanceof go.Diagram) {
      this.bindCategoryEvent()
    }

    switch (mapName) {
      case 'MINDMAP':
        this.links.set('', TreeLink)
        break;

      case 'FLOWCHART':
        this.links.set('', LineLink)
        break;

      case 'SEQUENCEMAP':
        this.links.set('', SequenceLink)
        break;

      case 'STRUCTMAP':
        this.links.set('', StructLink)
        break;
    }
  }

  setMap(map, ...template) {
    _.each(template, (subTemplate) => {
      _.each(subTemplate, (value, key) => {
        if (value) {
          if (!_.has(value, 'name')) {
            console.warn(key + ' not added to templateMap cause that has no "name" property')
            return
          }

          map.set(value.name, value)
        }
      })
    })
  }

  bindCategoryEvent() {
    [this.nodes, this.groups, this.links].forEach(category => {
      category.forEach(part => {
        //if (!_.isEmpty(part.subscribers)) {
        _.forIn(part.subscribes || {}, (handler, eventName) => {
          this.canvas.addDiagramListener(eventName, handler.bind(part))
        })
        //}
      })
    })

  }

  onMouseDrop(e, object) {
    var triggers = _.get(this.mouseDrops, object.part.category) || []
    if (!_.isEmpty(triggers)) {
      _.each(triggers, trig => trig(...arguments))
    }
  }

  onMouseDragEnter(e, object) {
    var triggers = _.get(this.mouseDragEnters, object.part.category) || []
    if (!_.isEmpty(triggers)) {
      _.each(triggers, trig => trig(...arguments))
    }
  }

  onMouseDragLeave(e, object) {
    var triggers = _.get(this.mouseDragLeaves, object.part.category) || []
    if (!_.isEmpty(triggers)) {
      _.each(triggers, trig => trig(...arguments))
    }
  }

  addDropListener(trigger, ...categoryNames) {
    _.each(categoryNames, categoryName => {

      var list = null

      if (!_.has(this.mouseDrops, categoryName)) {
        this.mouseDrops[categoryName] = []
      }

      list = this.mouseDrops[categoryName]
      list.push(trigger)
    })
  }

  addDragEnterListener(trigger, ...categoryNames) {
    _.each(categoryNames, categoryName => {
      var list = null

      if (!_.has(this.mouseDragEnters, categoryName)) {
        this.mouseDragEnters[categoryName] = []
      }

      list = this.mouseDragEnters[categoryName]
      list.push(trigger)
    })
  }

  addDragLeaveListener(trigger, ...categoryNames) {
    _.each(categoryNames, categoryName => {

      var list = null

      if (!_.has(this.mouseDragLeaves, categoryName)) {
        this.mouseDragLeaves[categoryName] = []
      }

      list = this.mouseDragLeaves[categoryName]
      list.push(trigger)
    })
  }

  on(eventName, listener) {
    this.event.on(eventName, listener)
  }

  onDeleteing(args) {
    var template = null

    args.subject.each((part) => {
      template = this.getTemplate(part)
      template && template.onDeleteing && template.onDeleteing(part)
    })
  }

  onShortcut(key) {
    var it = this.canvas.selection.iterator
    var category = null
    var actions = []
    var isMatch = false

    while (it.next()) {
      category = this.nodes.get(it.value.category)
      if (category) {
        actions = this.actionList.searchAction(...(category.allowAction || []))
        actions.forEach(action => {
          if (action.shortcutKey === key) {
            action.execute(it.value)
            isMatch = true
          }
        })
      }
    }

    return isMatch
  }

  /**
   * 节点模板
   */
  makeNodeTemplates(isPalatte = false) {
    var templates = new go.Map()
    // var categoryStyle = null
    // var mergedStyle = null
    var part = null
    this.nodes.forEach((template, key) => {
      //var result = null
      //categoryStyle = _.get(this.style, `model.${(node.name)}`)
      //mergedStyle = _.defaultsDeep(categoryStyle, node.style)

      if (isPalatte && _.isFunction(template.createPreview)) {
        part = template.createPreview()
      } else if (_.isFunction(template.createTemplate)) {
        part = template.createTemplate({
          contextMenu:
            createContextMenu(this.actionList.searchAction(template.actions))
        })
      }


      if (part) {
        if (!(part instanceof go.Node)) {
          console.warn('template "' + key + '" is not typeof Node')
          return
        }

        templates.add(key, part)
      }
    })

    return {
      nodeTemplateMap: templates
    }
  }

  /**
   * 流程图连接线模板
   */
  makeLinkTemplate() {
    var link = this.links.get('')
    var opts = {
      contextMenu: createContextMenu(this.actionList.searchAction(link.actions))
    }

    if (link) {
      return {
        linkTemplate: link.createTemplate(opts)
      }
    }
  }

  /**
   * 分组模板
   */
  makeGroupTemplate(isPalatte = false) {
    var templates = new go.Map()
    var part = null
    this.groups.forEach((template, key) => {
      part = null


      if (isPalatte && _.isFunction(template.createPreview)) {
        part = template.createPreview()
      } else if (_.isFunction(template.createTemplate)) {
        part = template.createTemplate({
          contextMenu: createContextMenu(this.actionList.searchAction(template.actions))
        })
      }

      templates.add(key, part)
    })

    return {
      groupTemplateMap: templates
    }
  }

  /**
   * 
   * @param {Array[go.Part]} parts 
   * @param {String} template 
   * @param {Object} style 
   */
  setCategoryPartStyle(parts, template, style) {
    var containerStyle = _.pick(style, containerStyleName)
    var nodeStyle = _.pick(style, nodeStyleName)
    var textStyle = _.pick(style, textStyleName);
    var container, text, node
    var setterKeys = _.intersection(_.keys(style), _.keys(template.styleSetter))

    parts.forEach(part => {
      if (!_.isEmpty(containerStyle)) {
        container = part.findObject(template.container || 'CONTAINER')
        if (container) {
          container.setProperties(containerStyle)
          //_.set(container, nodeStyle)
        }
      }

      if (!_.isEmpty(nodeStyle)) {
        node = part.findObject(template.node || 'NODE')
        if (node) {
          node.setProperties(nodeStyle)
        }
      }

      if (!_.isEmpty(textStyle)) {
        if (_.has(textStyle, 'fontColor')) {
          _.set(textStyle, 'stroke', textStyle.fontColor)
          _.unset(textStyle, 'fontColor')
        }

        text = part.findObject(template.text || 'TEXT')
        if (text) {
          text.setProperties(textStyle)
        }
      }

      setterKeys.forEach(styleKey => {
        template.styleSetter[styleKey].call(template, part, style[styleKey])
      })
      //part.updateTargetBindings()
    })
  }

  /**
   * 
   * @param {go.Part} parts 
   * @param  {...String} styleNames 
   */
  resetStyle(parts, ...styleNames) {
    //var style = null
    var template = null

    this.canvas.model.commit(($) => {
      this.canvas.selection.each((item) => {

        _.each(styleNames, (name) => {
          //item.data[name] = undefined
          //$.setData
          //$.set(item.part.data, name, undefined)
          delete item.part.data[name]
        })

        template = this.getTemplate(item)
        template && template.resetStyle && template.resetStyle(item, styleNames)
        $.updateTargetBindings(item.part.data)
        // item.part.updateTargetBindings()
        // item.part.updateRelationshipsFromData()
      })
    }, '重置样式')

   this.canvas.requestUpdate()
  }

  /**
   * 
   * @param {String} styleName 
   * @param {String} styleValue 
   */
  changeStyle(styleName, styleValue) {
    var template = null
    var parts = this.canvas.selection.toArray()

    this.canvas.model.commit(($) => {
      parts.forEach(part => {
        $.set(part.data, styleName, styleValue)
        template = this.getTemplate(part)

        if (!template) {
          console.warn('no template named "' + part.category + '" ')
          return
        }

        template.onChangeStyle && template.onChangeStyle(part, styleName, styleValue)
      })
    })
  }

  getTemplate(graphObject) {
    var map = null

    if (graphObject instanceof go.Link) {
      map = this.links
    } else if (graphObject instanceof go.Group) {
      map = this.groups
    } else {
      map = this.nodes
    }

    return map.get(graphObject.category)
  }

  getNameTemplate(category) {
    return this.nodes.get(category) || this.groups.get(category) || this.links.get(category)
  }

  onStartDrag() {
    var firstSelection = this.canvas.selection.first()
    if (firstSelection) {
      var { category } = firstSelection
      var shape = this.nodes.get(category)
      if (shape && shape.onStartDrag) {
        shape.onStartDrag.call(shape, firstSelection, this.canvas)
      }
    }
  }

  onDragging() {
    var firstSelection = this.canvas.selection.first()
    if (firstSelection) {
      var { category } = firstSelection
      var shape = this.nodes.get(category)
      if (shape && shape.onDragging) {
        shape.onDragging.call(shape, firstSelection, this.canvas)
      }
    }
  }

  onStopDrag() {
    var firstSelection = this.canvas.selection.first()
    if (firstSelection) {
      var { category } = firstSelection
      var shape = this.nodes.get(category)
      if (shape && shape.onStopDrag) {
        shape.onStopDrag.call(shape, firstSelection, this.canvas)
      }
    }
  }

  resetLink(template) {
    this.links = new Map()
    this.links.set('', template)
  }

  setNode(name, template) {
    this.nodes.set(name, template)
    TemplateMaker.categoryStyle[template.name] = template.style
  }

  setGroup(name, template) {
    this.groups.set(name, template)
    TemplateMaker.categoryStyle[template.name] = template.style

  }
}

TemplateMaker.categoryStyle = {}
TemplateMaker.styleNameSeparator = '_'

_.each([CanvasTemplates,
  PictureTemplates,
  TreeTemplates,
  ShapeTemplates,
  GroupTemplates,
  IconTemplates,
  LinkTemplates,
], (subTemplate) => {
  _.each(subTemplate, (value) => {
    TemplateMaker.categoryStyle[value.name] = value.style
  })
})



export default TemplateMaker