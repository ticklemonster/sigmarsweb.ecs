//
// Simple command-pattern implementation for user actions to enable undo/redo
//

function CommandManager() {
    this._undoList = [];
    this._redoList = [];

    this.clear = function() {
        this._undoList = [];
        this._redoList = [];
    }

    this.canUndo = function() {
        return (this._undoList.length > 0);
    }

    this.canRedo = function() {
        return (this._redoList.length > 0);
    }

    this.doAction = function(dofunc, undofunc) {
        dofunc();
        this._undoList.push({ 'action': dofunc, 'undoaction': undofunc });
        this._redoList = [];        
    }

    this.undoAction = function() {
        const command = this._undoList.pop();
        if (command) {
            command.undoaction();
            this._redoList.push(command);
        }
    }

    this.redoAction = function() {
        const command = this._redoList.pop();
        if (command) {
            command.action();
            this._undoList.push(command)
        }
    }
};

export default CommandManager;