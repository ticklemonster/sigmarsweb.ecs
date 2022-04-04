//
// Simple command-pattern implementation for user actions to enable undo/redo
//

function CommandManager() {
    this._undoList = [];
    this._redoList = [];
}

CommandManager.prototype.clear = function() {
    this._undoList = [];
    this._redoList = [];
}

CommandManager.prototype.canUndo = function() {
    return (this._undoList.length > 0);
}

CommandManager.prototype.canRedo = function() {
    return (this._redoList.length > 0);
}

CommandManager.prototype.doAction = function(dofunc, undofunc) {
    dofunc();
    this._undoList.push({ 'action': dofunc, 'undoaction': undofunc });
    this._redoList = [];        
}

CommandManager.prototype.undoAction = function() {
    const command = this._undoList.pop();
    if (command) {
        command.undoaction();
        this._redoList.push(command);
    }
}

CommandManager.prototype.redoAction = function() {
    const command = this._redoList.pop();
    if (command) {
        command.action();
        this._undoList.push(command)
    }
}


export default CommandManager;