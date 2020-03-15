
import _ from 'lodash'

class Runner {
  constructor(commander) {
    this.commander = commander
  }

  execute({ name }, shape) {
    switch (name) {
      case 'redo':
        this.commander.redo()
        break;
      case 'undo':
        this.commander.undo()
        break;
      case 'cut':
        this.commander.cutSelection()
        break;
      case 'paste':
        this.commander.pasteSelection()
        break;
      case 'delete':
        this.commander.deleteSelection()
        break;
      case 'group':
        this.commander.groupSelection()
        break;
      case 'ungroup':
        this.commander.ungroupSelection()
        break;
      case 'collapse':
        this.commander.collapseTree(shape)
        break;
      case 'expand':
        this.commander.expandTree(shape)
        break;
      case 'floor':
        this.commander.floorSelection()
        break;
      case 'ceiling':
        this.commander.ceilingSelection()
        break;
      case 'insertChild':
        this.commander.insertChild(shape)
        break;
      case 'insertBrother':
        this.commander.insertBrother(shape)
        break;
      case 'insertParent':
        this.commander.insertParent(shape)
        break;

      case 'insertLane':
        this.commander.insertLane(shape)
        break;
    }
  }
}

class Action {
  label
  name
  shortcutKey
  status = true
  onChangeStatus = null

  constructor(label, name, runner) {
    this.label = label
    this.name = name
    this.runner = runner
  }

  setShortcutKey(key) {
    this.shortcutKey = key

    return this
  }

  execute(shape) {
    this.runner.execute(this, shape)
  }

  setStatus(value) {
    if (this.status !== value) {
      this.status = value

      if (this.onChangeStatus) {
        this.onChangeStatus(value)
      }

      return true
    }

    return false
  }
}

class Actions {
  list = null
  runner = null
  onChangeStatus = null
  map = null

  constructor(map) {
    var runner = new Runner(map.commandHandler)

    map.addDiagramListener('ChangedSelection', () => this.updateStatus())
    map.addDiagramListener('Modified', () => this.updateStatus())
    map.addDiagramListener('SelectionGrouped', () => this.updateStatus())
    map.addDiagramListener('ClipboardChanged', () => this.updateStatus())
    map.addDiagramListener('ClipboardPasted', () => this.updateStatus())

    this.map = map
    this.runner = runner
    this.list = {
      delete: new Action('删除', 'delete', runner),
      redo: new Action('撤销', 'redo', runner),
      undo: new Action('重做', 'undo', runner),
      copy: new Action('复制', 'copy', runner),
      cut: new Action('剪切', 'cut', runner),
      paste: new Action('粘贴', 'paste', runner),
      group: new Action('组合', 'group', runner),
      ungroup: new Action('拆解', 'ungroup', runner),
      floor: new Action('下移', 'floor', runner),
      ceiling: new Action('上移', 'ceiling', runner),
      collapse: new Action('折叠', 'collapse', runner),
      expand: new Action('展开', 'expand', runner),
      insertChild: new Action('插入子级', 'insertChild', runner).setShortcutKey('tab'),
      insertBrother: new Action('插入同级', 'insertBrother', runner).setShortcutKey('ctrl&enter'),
      insertParent: new Action('插入父级', 'insertParent', runner).setShortcutKey('shift&enter'),
      //虽然shotcut 为 tab，但是并不会与 insertChild 冲突，因为 insertChild 只会存在于脑图，而insertLane 只存在于流程图，两者是互斥的
      insertLane: new Action('增加通道', 'insertLane', runner).setShortcutKey('tab')
    }
  }

  /**
   * 
   * @param {String} actionName 
   * @return Array<Action>
   */
  searchAction(actionName) {
    return _.values(_.pick(this.list, actionName))
  }

  updateStatus() {
    var commander = this.map.commandHandler
    var result = {}
    var statusChanged = false

    result.copy = commander.canCopySelection()
    result.cut = commander.canCutSelection()
    result.paste = commander.canPasteSelection()
    result.undo = commander.canUndo()
    result.redo = commander.canRedo()
    result.group = commander.canGroupSelection()
    result.ungroup = commander.canUngroupSelection()
    result.collapse = commander.canCollapseTree()
    result.expand = commander.canExpandTree()
    result.delete = commander.canDeleteSelection()

    Object.keys(result).forEach((key) => {
      if (this.list[key].setStatus(result[key]) === true) {
        statusChanged = true
      }
    })

    if (statusChanged && this.onChangeStatus) {
      this.onChangeStatus(result)
    }
  }
}

// Actions.createList = function (action) {
//     action.forEach(a=>{

//     })
// }


export default Actions
export { Actions, Action }