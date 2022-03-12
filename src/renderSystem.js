import { Container } from '@pixi/display';
import { Sprite } from '@pixi/sprite';
import { Text } from '@pixi/text';
import { Circle } from '@pixi/math';
import { PIECE_TYPES } from './constants';
import { EventEmitter } from '@pixi/utils';

// display style constants
const ALPHA_SHOW = 1.0;
const ALPHA_HIDE = 0.7;
const TINT_HIDE = 0x888888;
const TINT_SHOW = 0xffffff;

// TODO: Parameterise all of the display stuff - no hardcoded sizes!

const SCOREBOARD_POSITION = new Map([
    ['salt',        { x:  65, y: 650 }],
    ['fire',        { x: 120, y: 650 }],
    ['water',       { x: 160, y: 650 }],
    ['earth',       { x: 200, y: 650 }],
    ['air',         { x: 240, y: 650 }],
    ['mors',        { x: 300, y: 650 }],
    ['vitae',       { x: 340, y: 650 }],
    ['quicksilver', { x: 400, y: 650 }],
    ['lead',        { x: 455, y: 650 }],
    ['tin',         { x: 495, y: 650 }],
    ['iron',        { x: 535, y: 650 }],
    ['copper',      { x: 575, y: 650 }],
    ['silver',      { x: 615, y: 650 }],
    ['gold',        { x: 655, y: 650 }],
]);

function axialToScreen(q, r) {
    var x = 360 + 32 * (Math.sqrt(3) * q + Math.sqrt(3)/2 * r)
    var y = 300 + 32 * (                   3/2 * r)
    return { x: x, y: y };
}

function RenderSystem(renderer) {
    EventEmitter.apply(this);

    this._renderer = renderer;
    this._textures = {};
    this._static = new Container();
    this._stage = new Container();
    this._highlightType = undefined;

    return this;
}

RenderSystem.prototype = Object.create(EventEmitter.prototype);
// RenderSystem.prototype.constructor = RenderSystem;

RenderSystem.prototype.setTextures = function(textures) {
    this._textures = textures;
}

RenderSystem.prototype.addStaticTexture = function(x, y, texture) {
    const newSprite = new Sprite(this._textures[texture]);
    newSprite.position.set(x, y);
    // console.debug(`RenderSystem.addStatic(${x},${y},${texture}) => `, newSprite);
    this._static.addChild(newSprite);
}

RenderSystem.prototype.addStaticDisplayObject = function(displayObject) {
    this._static.addChild(displayObject);
}

RenderSystem.prototype.clearStatic = function() {
    for (let d = this._static.removeChildAt(0); d; d = this._static.removeChildAt(0)) {
        d.destroy();
    }
}

RenderSystem.prototype.setHighlightType = function(typename, status) {
    this._highlightType = (status) ? typename : undefined;
}

RenderSystem.prototype.update = function(t, entities) {
    if (!this._renderer) return;

    // add sprites to pieces that don't have one
    entities
        .filter(e => e.components.has('piece') && !e.components.has('sprite'))
        .forEach(entity => {
            const piece = entity.components.get('piece');
            const sprite = new Sprite(this._textures[PIECE_TYPES.get(piece.type).sprite]);
            sprite.anchor = { x: 0.5, y: 0.5 };
            sprite.buttonMode = true;
            sprite.hitArea = new Circle(0, 0, 22);
            sprite.position = axialToScreen(piece.position.q, piece.position.r);

            sprite.addListener('pointertap', () => { this.emit('SELECT', entity) });

            entity.components.set('sprite', sprite);
            // console.debug(`RenderSystem.update - new sprite for ${entity.name} => `, sprite);
        });

    // add sprites to selectors that don't have one
    entities
        .filter(e => e.components.has('selector') && !e.components.has('sprite'))
        .forEach(entity => {
            const otherEntity = entity.components.get('selector');
            const otherSprite = otherEntity.entity.components.get('piece');
            const sprite = new Sprite(this._textures['selector.png']);
            sprite.anchor = { x: 0.5, y: 0.5 };
            sprite.position.copyFrom(otherSprite.position);
            entity.components.set('sprite', sprite);
            // console.debug(`RenderSystem.update - new sprite for ${entity.name} => `, sprite);
        });

    // add scoreboard display components...
    entities
        .filter(e => e.components.has('score') && !e.components.has('sprite'))
        .forEach(entity => {
            const scoreObj = entity.components.get('score');
            
            let p = new Sprite(this._textures[PIECE_TYPES.get(scoreObj.type).sprite]);
            p.anchor.set(0.5);
            p.scale.set(0.7); 
            p.position = SCOREBOARD_POSITION.get(scoreObj.type);
            p.buttonMode = true;
            
            if (PIECE_TYPES.get(scoreObj.type).qty > 1) {
                const l = new Text('0',{fontFamily : 'Arial', fontSize: 24, fill : 0xffffff, align : 'center'}); 
                l.position = {x: 20, y: -30};
                p.addChild(l);
            }

            // process scoreboard click+hold events
            p.addListener('pointerdown', () => { this._highlightType = scoreObj.type });
            p.addListener('pointerup', () => { this._highlightType = undefined });
            p.addListener('pointerout', () => { this._highlightType = undefined });

            entity.components.set('sprite', p);
        });

    // console.debug(`RenderSystem.update: ${entities.length} entities`);

    //
    // Start the rendering!
    //
    this._renderer.plugins.batch.start();

    // add static components
    const stage = new Container();
    stage.addChild(this._static);

    // for every entity with a sprite...
    for (let entity of entities.filter(e => e.components.has('sprite'))) {
        const sprite = entity.components.get('sprite');
        
        // update the visual state if there is a piece to reflect
        const piece = entity.components.get('piece');
        if (piece) {
            sprite.position = axialToScreen(piece.position.q, piece.position.r);
            
            if (piece.enabled) {
                sprite.tint = TINT_SHOW;
                sprite.alpha = ALPHA_SHOW;
                sprite.interactive = true;
            } else {
                sprite.tint = (piece.type == this._highlightType) ? TINT_SHOW : TINT_HIDE;
                sprite.alpha = ALPHA_HIDE;
                sprite.interactive = false;
            }
        }

        // update scoreboard components based on values...
        const score = entity.components.get('score');
        if (score) {
            sprite.tint = (score.value == 0) ? TINT_HIDE : TINT_SHOW;
            sprite.interactive = (score.value > 0);
            let label = null;
            if (label = sprite.children.find(c => c instanceof Text)) {
                label.text = `${score.value}`;
            }
        }

        // make sure selectors stay with their pieces
        if (entity.components.has('selector')) {
            entity.components.get('sprite').position.copyFrom( entity.components.get('selector').entity.components.get('sprite').position);
        }
        
        // add them to the display container
        stage.addChild(sprite);
        sprite.updateTransform();
    }

    // render all the components and finish the batch to flush
    this._renderer.render(stage);
    this._renderer.plugins.batch.stop();
}

export default RenderSystem;