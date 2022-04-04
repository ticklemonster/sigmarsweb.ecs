// Import all the PIXI components explicity
import { Container } from '@pixi/display';
import { Sprite } from '@pixi/sprite';
import { Circle } from '@pixi/math';
import { EventEmitter } from '@pixi/utils';

// Add GSAP for animations
import { gsap } from 'gsap';
import { PixiPlugin } from 'gsap/PixiPlugin.js';
import { DisplayObject } from '@pixi/display';
gsap.registerPlugin(PixiPlugin);
PixiPlugin.registerPIXI({ 'DisplayObject': DisplayObject });

// ECS information
import { defineQuery, enterQuery, exitQuery } from "bitecs";
import { AxialPosition, Displayable, Piece, SPRITE_NAMES, DISPLAY_STATES, PIECE_STATES } from './components';
const axialDisplayableQuery = defineQuery([ AxialPosition, Displayable ]);
const pieceDisplayQuery = defineQuery([ Piece, Displayable ]);
const displayableQuery = defineQuery([ Displayable ]);
const enterDisplayable = enterQuery(displayableQuery);
const exitDisplayable = exitQuery(displayableQuery);

// Event Management
const SELECT_EVENT = 'SELECT';


// TODO: Parameterise all of the display stuff - no hardcoded sizes!

function axialToScreen(q, r) {
    var x = 360 + 32 * (Math.sqrt(3) * q + Math.sqrt(3)/2 * r)
    var y = 300 + 32 * (                   3/2 * r)
    return { x: x, y: y };
}


function RenderSystem(renderer) {
    EventEmitter.call(this);

    this._renderer = renderer;
    this._isReady = false;
    this._spritesheet = undefined;
    
    this._stage = new Container();
    this._static = new Container();
    this._stage.addChild(this._static);
        
    return this;
}

RenderSystem.prototype = Object.create(EventEmitter.prototype);

RenderSystem.prototype.init = function(resources) {
    // add the static background...
    try {
        const bgSprite = new Sprite(resources['background'].texture)
        this._static.addChild(bgSprite);
    } catch (e) {
        console.error('No "background" texture found');
    }

    // save the spritesheet for later
    this._spritesheet = resources['spritesheet'];

    this._isReady = true;
    console.debug('RenderSystem is ready!');
}

RenderSystem.prototype.addStaticDisplayObject = function(displayObject) {
    this._static.addChild(displayObject);
}

RenderSystem.prototype.removeStaticDisplayObject = function(displayObject) {
    this._static.removeChild(displayObject);
}

// RenderSystem.prototype.clearStatic = function() {
//     for (let d = this._static.removeChildAt(0); d; d = this._static.removeChildAt(0)) {
//         d.destroy();
//     }
// }

RenderSystem.prototype.isReady = function() {
    return this._isReady; 
}

RenderSystem.prototype.clear = function() {
    this._stage.removeChildren();
    this._stage.addChild(this._static);
}

RenderSystem.prototype.setHighlight = function(world, typeId = undefined) {
    pieceDisplayQuery(world).forEach(id => {
        if (Piece.typeId[id] === typeId) {
            Piece.state[id] |= PIECE_STATES.HIGHLIGHTED;
        } else {
            Piece.state[id] &= (~PIECE_STATES.HIGHLIGHTED);
        }
    })
}

RenderSystem.prototype.clearHighlight = function(world) {
    this.setHighlight(world, undefined);
}

RenderSystem.prototype.blink = function(world, id) {
    const sprite = this._stage.children.find(c => c.name === id);
    if (sprite) {
        gsap.to(sprite, {
            duration: 0.3, 
            yoyo: true, 
            repeat: 3, 
            pixi: { scale: 1.2 }
        });    
    }

}

RenderSystem.prototype.update = function(world) {
    if (!this._renderer || !this._isReady) return;

    // add sprites to pieces that don't have one
    enterDisplayable(world).forEach(id => {    
        const spriteName = SPRITE_NAMES[Displayable.spriteId[id]];
        const sprite = new Sprite(this._spritesheet.textures[spriteName]);
        sprite.name = id;
        sprite.anchor = { x: 0.5, y: 0.5 };
        sprite.buttonMode = true;
        sprite.hitArea = new Circle(0, 0, 22);
        sprite.addListener('pointertap', () => { this.emit(SELECT_EVENT, id) });

        this._stage.addChild(sprite);
        // console.debug(`RenderSystem.update - new sprite for entity ${id} => `, sprite);
    });

    // remove sprites we no longer need
    exitDisplayable(world).forEach(id => {    
        this._stage.children.filter(c => c.name === id)
            .forEach(sprite => {
                sprite.destroy();
                this._stage.removeChild(sprite);
            });
    });

    // update axial sprite posisions to screen positions
    axialDisplayableQuery(world).forEach(id => {
        this._stage.children.filter(c => c.name === id).forEach(sprite => {
            const position = axialToScreen(AxialPosition.q[id], AxialPosition.r[id]);
            sprite.x = position.x;
            sprite.y = position.y;
        })
    })
    
    // for every piece with a dislpayable...
    pieceDisplayQuery(world).forEach(id => {
        // update the visual state of the piece if there is a piece to reflect
        const sprite = this._stage.children.find(c => c.name === id);
        const selectorSprite = sprite.children.find(c => c.name === 'SELECTOR');

        if (Piece.state[id] & PIECE_STATES.ENABLED) {
            sprite.tint = DISPLAY_STATES.TINT_SHOW;
            sprite.alpha = DISPLAY_STATES.ALPHA_SHOW;
            sprite.interactive = true;
        }
        else if (Piece.state[id] & PIECE_STATES.HIGHLIGHTED)
        {
            sprite.tint = DISPLAY_STATES.TINT_SHOW;
            sprite.alpha = DISPLAY_STATES.ALPHA_HIDE;
            sprite.interactive = false;
        }
        else {
            sprite.tint = DISPLAY_STATES.TINT_HIDE;
            sprite.alpha = DISPLAY_STATES.ALPHA_HIDE;
            sprite.interactive = false;
        }

        if ((Piece.state[id] & PIECE_STATES.SELECTED) && !selectorSprite) {
            // add a new Selector
            const newSelector = new Sprite(this._spritesheet.textures['selector.png']);
            newSelector.name = 'SELECTOR';
            newSelector.anchor = { x: 0.5, y: 0.5 };
            sprite.addChild(newSelector);

        }
        else if ((Piece.state[id] & PIECE_STATES.SELECTED) == 0 && selectorSprite) {
            // remove the Selector
            sprite.removeChild(selectorSprite);
            selectorSprite.destroy();
        }
        
        // add them to the display container
        sprite.updateTransform();
    });

    // render all the components and finish the batch to flush
    this._renderer.plugins.batch.start();
    this._renderer.render(this._stage);
    this._renderer.plugins.batch.stop();
}

export { RenderSystem, SELECT_EVENT };
export default RenderSystem;