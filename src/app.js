// Import all the PIXI components explicity
import { Renderer, BatchRenderer } from '@pixi/core';
Renderer.registerPlugin('batch', BatchRenderer);
import { InteractionManager } from '@pixi/interaction';

import { Ticker } from '@pixi/ticker';
import { Loader } from "@pixi/loaders";
import { Spritesheet } from "@pixi/spritesheet";

// assets to be loaded
import backgroundImage from './images/hexboard.png';
import spritesheetJson from './images/sprites.json';
import spritesheetImage from './images/sprites.png';

// Systems
import LayoutGenerator from './layoutGenerator';
import RenderSystem from './renderSystem';
import GameSystem from './gameSystem';
import ScoreboardSystem from './scoreboardSystem';
import UISystem from './uiSystem';

// State information
const LOCALSTORAGE_WIN_KEY = 'sigmarsweb.wins';
const GAMESTATE_INIT = 'INIT';
const GAMESTATE_NEW  = 'NEW GAME';
const GAMESTATE_LAYOUT = 'LAYOUT';
const GAMESTATE_RUNNING = 'RUNNING';
const GAMESTATE_WIN = 'WINNER';
const GAMESTATE_OVER = 'GAME OVER';

let gameState = GAMESTATE_INIT;
let wins = 0;

// Initialize PIXI.js components
const renderer = new Renderer({ width: 720, height: 720, backgroundColor: 0x00008b });
document.body.appendChild(renderer.view);

const loader = new Loader();

// Initialize the Systems
const layoutGenerator = new LayoutGenerator();
const gameSystem = new GameSystem();
const renderSystem = new RenderSystem(renderer);
const scoreboardSystem = new ScoreboardSystem();
const uiSystem = new UISystem();
const interactionManager = new InteractionManager(renderer, {useSystemTicker: false})

// Add the systems (to a PIXI.Ticker)
let timeCounter = 30;
const ticker = new Ticker();
ticker.add((t) => {
    switch (gameState) {
        case GAMESTATE_INIT:
            timeCounter -= t;
            if (timeCounter < 0 && loader.resources['spritesheet']) {
                gameState = GAMESTATE_NEW;
                uiSystem.enableNewGameButton(false);
                uiSystem.enableUndoButton(false);
            }
            break; 

        case GAMESTATE_NEW:
            console.debug('Start a NEW GAME');

            // clear the entity system and start again...
            clearEntities();
            clearUndo();
            uiSystem.enableUndoButton(false);

            // add the scoreboard entities then start the layout (no undo)
            addEntities(
                scoreboardSystem.createEntities(), false
            );
            layoutGenerator.startLayout();
            uiSystem.enableNewGameButton(false);
            gameState = GAMESTATE_LAYOUT;

            renderSystem.update(t, entities);
            break;

        case GAMESTATE_LAYOUT:
            const nextEntity = layoutGenerator.nextEntity(t);
            if (nextEntity === null) {
                // layout is finished - get ready to start the game
                console.debug('Layout COMPLETE');

                uiSystem.enableNewGameButton(true);
                gameState = GAMESTATE_RUNNING;
            }
            else if (nextEntity !== undefined) {
                addEntities([nextEntity], false);
            }

            gameSystem.update(t, entities);
            scoreboardSystem.update(t, entities);
            renderSystem.update(t, entities);

            break;

        case GAMESTATE_RUNNING:
            gameSystem.update(t, entities);
            scoreboardSystem.update(t, entities);
            renderSystem.update(t, entities);

            // if all the pieces are gone - then the player wins!
            if (entities.filter(e => e.components.has('piece')).length == 0) {
                console.log('WIN!');
                gameState = GAMESTATE_WIN;
            }
            break;

        case GAMESTATE_WIN:
            wins = parseInt(window.localStorage.getItem(LOCALSTORAGE_WIN_KEY), 10) || 0;
            wins++;
            window.localStorage.setItem(LOCALSTORAGE_WIN_KEY, wins);
            uiSystem.setWins(wins);
            gameState = GAMESTATE_OVER;

        case GAMESTATE_OVER:
            renderSystem.update(t, entities);
            break;
    }
});

// initGame - in a closure, just for laughs
(function() {
    console.debug('+ GAMESTATE_INIT');

    // Run the async loaders
    loader
        .add('background', backgroundImage)
        .add('sprites', spritesheetImage)
        .load((_loader, resources) => {
            console.debug('loader finished')

            // parse the spritesheet after the image is loaded
            const spritesheet = new Spritesheet(
                resources['sprites'].texture.baseTexture,
                spritesheetJson
            );
            spritesheet.parse(() => {
                // save the parsed spreadsheet
                resources['spritesheet'] = spritesheet;
                
                // give textures to the renderSystem...
                console.debug('spritesheet ready');
                renderSystem.setTextures({...spritesheet.textures, 'background': resources['background'].texture});

                // add the background and static HUD objects
                renderSystem.addStaticTexture(0, 0, 'background');
                uiSystem.getDisplayObjects().forEach(o => renderSystem.addStaticDisplayObject(o));
                renderSystem.update(0, []);

                // kick off the Systems
                ticker.start();
            });
        });

    // subscribe to game level events
    uiSystem.on('NEW GAME', () => {
        console.debug('NEW GAME event received');
        gameState = GAMESTATE_NEW;
    });
    uiSystem.on('UNDO', () => {
        console.log('UNDO event from UI');
        clearSelections();
        undoAction();
        if (undoList.length == 0) uiSystem.enableUndoButton(false);
    });
    uiSystem.on('REDO', () => {
        console.log('REDO event from UI');
        clearSelections();
        redoAction();
        // if (redoList.length == 0) uiSystem.enableRedoButton(false);
    });

    renderSystem.on('SELECT', (entity) => {
        // console.debug('SELECT EVENT for ', entity);
        selectEntities([entity]);
    });
    
    gameSystem.on('UNSELECT', (entities) => {
        // console.debug(`UNSELECT EVENT for `, entities);
        selectEntities(entities, false);
    });

    gameSystem.on('REMOVE', (entities) => {
        // console.debug('REMOVE EVENT for ', entities);
        // use the COMMAND to make this undoable
        selectEntities(entities, false);
        doAction( () => removeEntities(entities), () => addEntities(entities) );
    });
        

    // set up the win tracker
    wins = parseInt(window.localStorage.getItem(LOCALSTORAGE_WIN_KEY), 10) || 0;
    uiSystem.setWins( wins );

})();


//
// Command-pattern for user actions to enable undo/redo
//
let undoList = [];
let redoList = [];

function clearUndo() {
    undoList = [];
    redoList = [];
}

function doAction(action, undoaction) {
    action();
    undoList.push({ 'action': action, 'undoaction': undoaction });
    redoList = [];
    
    uiSystem.enableUndoButton(true);
}

function undoAction() {
    const command = undoList.pop();
    if (command) {
        command.undoaction();
        redoList.push(command);
    }

    uiSystem.enableUndoButton(undoList.length > 0);
    // uiSystem.enableRedoButton(redoList.length > 0);
}

function redoAction() {
    const command = redoList.pop();
    if (command) {
        command.action();
        undoList.push(command)
    }
}

//
// Entity Management
//
let entities = [];

function clearEntities() {
    entities = [];
}

function addEntities(es) {
    es.forEach(e => console.debug(`[ add entity ${e.name}]`));
    entities = [ ...entities, ...es ];
}

function removeEntities(es) {
    // "destroy" each component
    for (let e of es) {
        console.debug(`[ remove entity ${e.name}]`);
        for (let c of e.components) {
            if (c.destroy && typeof c.destroy == 'function') c.destroy();
        }
    }

    // remove the entities
    entities = entities.filter(e => !es.includes(e));
}


//
// select or unselect an entity
// if not defined, then toggle the current state
//
function selectEntities(ens, shouldSelect = undefined) {
    for (let entity of ens) {
        if (entity && entity.components.has('piece')) {
            const p = entity.components.get('piece');
            p.selected = (shouldSelect === undefined) ? !p.selected : shouldSelect;

            if (p.selected) {
                console.debug(`[ select piece ${entity.name}]`);
                addEntities([newSelectorEntityFor(entity)]);
            } else {
                console.debug(`[ unselect piece ${entity.name}]`);
                const selectors = entities.filter(e => e.components.has('selector') && e.components.get('selector').entity == entity);
                removeEntities(selectors);
            }
        }
    }

}

function clearSelections() {
    const selected = entities.filter(e => e.components.has('piece') && e.components.get('piece').selected);
    selectEntities(selected, false);
}

function newSelectorEntityFor(other) {
    const entity = {
        name: 'selector for ' + other.name,
        components: new Map([
            ['selector', {
                'entity': other,
            }],
        ])
    }

    return entity;
}

// function destroyEntityComponents(entity) {
//     entity.components.forEach(c => {
//         if (c.destroy && typeof(c.destroy) === 'function') {
//             c.destroy();
//         }
//     })
// }
// 
// function removeSelectorFrom(entity, entities) {
//     let i = -1;
//     while ((i = entities.findIndex(e => e.components.has('selector') && e.components.get('selector').entity == entity)) > -1) {
//         destroyEntityComponents(entities[i]);
//         entities.splice(i, 1);
//     }
// }

// function removeEntityFrom(entity, entities) {
//     const i = entities.findIndex(e => e == entity);
//     if (i > -1) {
//         destroyEntityComponents(entity);
//         entities.splice(i, 1);
//     }
// }