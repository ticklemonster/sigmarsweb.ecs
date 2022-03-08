import { EventEmitter } from "@pixi/utils";
import { Text } from "@pixi/text";

function UISystem() {
    EventEmitter.apply(this);

    this._newGameButton = new Text('New\nGame',{fontFamily : 'Arial', fontSize: 20, fill : 0xfff0f0, align : 'center'});
    this._newGameButton.position = { x: 50, y: 550 };
    this._newGameButton.addListener('pointertap', (event) => this.handleNewGame(event));

    this._winCounter = new Text(`Wins\n-` ,{fontFamily : 'Arial', fontSize: 20, fill : 0x888080, align : 'center'});
    this._winCounter.position = { x: 620, y: 550 };

    return this;
}

UISystem.prototype = EventEmitter.prototype;

UISystem.prototype.getDisplayObjects = function() {
    return [this._newGameButton, this._winCounter];
}

UISystem.prototype.enableNewGameButton = function(shouldEnable) {
    this._newGameButton.interactive = shouldEnable;
    this._newGameButton.tint = shouldEnable ? 0xffffff : 0x888888
}

UISystem.prototype.handleNewGame = function(event) {
    this.emit('NEW GAME');
}

UISystem.prototype.setWins = function(wins) {
    this._winCounter.text = `Wins\n${wins}`;
}

export default UISystem;