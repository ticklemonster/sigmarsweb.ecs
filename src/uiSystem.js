import { EventEmitter } from '@pixi/utils';
import { Text } from '@pixi/text';
import { Sprite } from '@pixi/sprite';
import { Container } from '@pixi/display';

const NEW_GAME_EVENT = 'NEW_GAME';
const UNDO_EVENT = 'UNDO';
const REDO_EVENT = 'REDO';

function UISystem() {
    EventEmitter.apply(this);

    this._container = new Container();

    return this;
}

UISystem.prototype = Object.create(EventEmitter.prototype);
// UISystem.prototype.constructor = UISystem;

UISystem.prototype.init = function(resources) {
    this._container = new Container();

    this._newGameButton = new Text('New\nGame', {fontFamily : 'Arial', fontSize: 20, fill : 0xfff0f0, align : 'center'});
    this._newGameButton.position = { x: 50, y: 50 };
    this._newGameButton.addListener('pointertap', () => this.emit(NEW_GAME_EVENT));
    this._container.addChild(this._newGameButton);
    
    this._undoButton = new Text('Undo', {fontFamily : 'Arial', fontSize: 20, fill : 0xfff0f0, align : 'center'});
    this._undoButton.position = { x: 620, y: 550 };
    this._undoButton.addListener('pointertap', () => this.emit(UNDO_EVENT));
    this._container.addChild(this._undoButton);
    
    this._winCounter = new Text(`Wins\n-` ,{fontFamily : 'Arial', fontSize: 20, fill : 0x888080, align : 'center'});
    this._winCounter.position = { x: 620, y: 50 };
    this._container.addChild(this._winCounter);

}

// Update UI details
UISystem.prototype.update = function(world) {
}

UISystem.prototype.getDisplayObject = function() {
    return this._container;
}

UISystem.prototype.enableNewGameButton = function(shouldEnable) {
    this._newGameButton.interactive = shouldEnable;
    this._newGameButton.tint = shouldEnable ? 0xffffff : 0x888888
}

UISystem.prototype.enableUndoButton = function(shouldEnable) {
    this._undoButton.interactive = shouldEnable;
    this._undoButton.tint = shouldEnable ? 0xffffff : 0x888888
}

UISystem.prototype.enableRedoButton = function(shouldEnable) {
    // this._redoButton.interactive = shouldEnable;
    // this._redoButton.tint = shouldEnable ? 0xffffff : 0x888888
}

UISystem.prototype.setWins = function(wins) {
    this._winCounter.text = `Wins\n${wins}`;
}

export default UISystem;
export { NEW_GAME_EVENT, UNDO_EVENT, REDO_EVENT };