import { Container } from '@pixi/display';
import { Sprite } from '@pixi/sprite';
import { Text } from '@pixi/text';
import { EventEmitter } from '@pixi/utils';
import { defineQuery } from 'bitecs';
import { Piece, PIECE_TYPES, SPRITE_NAMES, DISPLAY_STATES } from './components';

const HIGHLIGHT_EVENT = 'HIGHLIGHT';

const SCOREBOARD_ELEMENTS = [
    { type: 'salt',        x:  65, y: 650 },
    { type: 'fire',        x: 120, y: 650 },
    { type: 'water',       x: 160, y: 650 },
    { type: 'earth',       x: 200, y: 650 },
    { type: 'air',         x: 240, y: 650 },
    { type: 'mors',        x: 300, y: 650 },
    { type: 'vitae',       x: 340, y: 650 },
    { type: 'quicksilver', x: 400, y: 650 },
    { type: 'lead',        x: 455, y: 650 },
    { type: 'tin',         x: 495, y: 650 },
    { type: 'iron',        x: 535, y: 650 },
    { type: 'copper',      x: 575, y: 650 },
    { type: 'silver',      x: 615, y: 650 },
    { type: 'gold',        x: 655, y: 650 },
];

const pieceQuery = defineQuery([ Piece ]);

function ScoreboardSystem() {
    EventEmitter.call(this);

    this._scoreboardContainer = undefined;
    this._highlighting = false;

    return this;
}

ScoreboardSystem.prototype = Object.create(EventEmitter.prototype);

ScoreboardSystem.prototype.init = function(resources) {
    this._scoreboardContainer = new Container();
    
    // add the scoreboard indicators...
    SCOREBOARD_ELEMENTS.forEach(({type, x, y}) => {
        const piecetype = PIECE_TYPES.find(pt => pt.type === type);
        const sprite = new Sprite(resources['spritesheet'].textures[SPRITE_NAMES[piecetype.sprite]]);
        sprite.name = type;
        sprite.anchor.set(0.5);
        sprite.scale.set(0.7); 
        sprite.x = x;
        sprite.y = y;
        sprite.buttonMode = true;
        
        // if there is more than one possible piece of a type, add a label
        if (piecetype.qty > 1) {
            const l = new Text('0',{fontFamily : 'Arial', fontSize: 24, fill : 0xffffff, align : 'center'}); 
            l.position = {x: 20, y: -30};
            sprite.addChild(l);
        }
        
        // add some listeners for UI interaction
        sprite.addListener('pointerdown', () => { 
            this._highlighting = true;
            this.emit(HIGHLIGHT_EVENT, PIECE_TYPES.indexOf(piecetype)); 
        });
        sprite.addListener('pointerup', () => { 
            if (this._highlighting) {
                this._highlighting = false;
                this.emit(HIGHLIGHT_EVENT, undefined);
            }
        });
        sprite.addListener('pointerout', () => {
            if (this._highlighting) {
                this._highlighting = false;
                this.emit(HIGHLIGHT_EVENT, undefined);
            }
        });
        
        this._scoreboardContainer.addChild(sprite);
        // console.debug(`add scoreboard item: ${type} = ${this._counts.get(type)}`);
    })
}

ScoreboardSystem.prototype.getDisplayObject = function() {
    return this._scoreboardContainer;
}

ScoreboardSystem.prototype.update = function(world) {
    const counts = new Map();
    SCOREBOARD_ELEMENTS.forEach(s => counts.set(s.type, 0));

    pieceQuery(world).forEach(eid => {
        const typeId = Piece.typeId[eid];
        const typeName = PIECE_TYPES[typeId].type;
        const count = counts.get(typeName) || 0;
        counts.set(typeName, count + 1);
    });

    // update scoreboard components based on values...
    this._scoreboardContainer.children.forEach(sprite => {
        const value = counts.get(sprite.name);

        sprite.tint = (value == 0) ? DISPLAY_STATES.TINT_HIDE : DISPLAY_STATES.TINT_SHOW;
        sprite.interactive = (value > 0);
        let label = null;
        if (label = sprite.children.find(c => c instanceof Text)) {
            label.text = `${value}`;
        }
    });

    // console.debug(`SCOREBOARD: `, entities.filter(e => e.components.has('score')).map(e => e.components.get('score')));
}

export default ScoreboardSystem;
export { HIGHLIGHT_EVENT };
