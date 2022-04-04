// Import the shared PIXI components explicity
import { Renderer, BatchRenderer } from '@pixi/core';
Renderer.registerPlugin('batch', BatchRenderer);
import { InteractionManager } from '@pixi/interaction';
Renderer.registerPlugin('interaction', InteractionManager);
import { Loader } from "@pixi/loaders";
import { Spritesheet } from '@pixi/spritesheet';
import { Ticker } from '@pixi/ticker';

// import BitECS, components and systems
import { createWorld, defineDeserializer, defineSerializer, removeEntity  } from 'bitecs';

import LayoutGenerator from './layoutGenerator';
import RenderSystem, { SELECT_EVENT } from './renderSystem';
import ScoreboardSystem, { HIGHLIGHT_EVENT } from './scoreboardSystem';
import GameSystem, { GAME_OVER_EVENT, REMOVE_EVENT } from './gameSystem';
import UISystem, { NEW_GAME_EVENT, UNDO_EVENT } from './uiSystem';
import CommandManager from './commandManager';

// assets to be loaded
import backgroundImage from './images/hexboard.png';
import spritesheetJson from './images/sprites.json';
import spritesheetImage from './images/sprites.png';

// State information
const LOCALSTORAGE_WIN_KEY = 'sigmarsweb.wins';
const GAMESTATE_INIT = 'INIT';
const GAMESTATE_NEW  = 'NEW GAME';
const GAMESTATE_LAYOUT = 'LAYOUT';
const GAMESTATE_RUNNING = 'RUNNING';
const GAMESTATE_WIN = 'WINNER';
const GAMESTATE_OVER = 'GAME OVER';

// Tracker for hints
const STARTUP_FRAMES = 30;
const LAYOUT_FRAMES = 2;
const HINT_FRAMES = 600;   // 600 frames @ 60fps = 10 sec

// Initialize PIXI.js global renderer
const renderer = new Renderer({ width: 720, height: 720, backgroundColor: 0x00008b });
document.body.appendChild(renderer.view);

// Build a bitecs world!
const world = createWorld();
const serialise = defineSerializer(world);
const deserialize = defineDeserializer(world);
world.game = {
    state: GAMESTATE_INIT,
    wins: parseInt(window.localStorage.getItem(LOCALSTORAGE_WIN_KEY), 10) || 0,
}

// Initialize the Systems
const layoutGenerator = new LayoutGenerator();
const commandManager = new CommandManager();
const gameSystem = new GameSystem();
const renderSystem = new RenderSystem(renderer);
const scoreboardSystem = new ScoreboardSystem();
const uiSystem = new UISystem();

//
// Wire up the listeners for events coming from systems
//

uiSystem.on(NEW_GAME_EVENT, () => {
    // console.debug('NEW GAME event received from UISystem');
    world.game.state = GAMESTATE_NEW;
});

uiSystem.on(UNDO_EVENT, () => {
    // console.debug('UNDO EVENT received from UISystem');
    gameSystem.clearSelections(world);
    commandManager.undoAction();
    uiSystem.enableUndoButton(commandManager.canUndo());
    uiSystem.enableRedoButton(commandManager.canRedo());

    frameCounter = 0;
});

//     uiSystem.on('REDO', () => {
//         // console.debug('REDO EVENT received from UISystem');
//         clearSelections();
//         commandManager.redoAction();
//         uiSystem.enableUndoButton(commandManager.canUndo());
//         uiSystem.enableRedoButton(commandManager.canRedo());

//         frameCounter = 0;
//     });

renderSystem.on(SELECT_EVENT, (eid) => {
    console.debug(`SELECT EVENT for ${eid} received from RenderSystem`);
    gameSystem.selectEntity(world, eid);

    frameCounter = 0;
});

scoreboardSystem.on(HIGHLIGHT_EVENT, typeId => {
    console.debug(`HIGHLIGHT EVENT for ${typeId}`);
    renderSystem.setHighlight(world, typeId);

    frameCounter = 0;
})

gameSystem.on(REMOVE_EVENT, (ids) => {
    console.debug(`REMOVE EVENT for ${ids} received from GameSystem`);

    // make sure we have an array to work with
    if (ids instanceof Number) ids = [ids];

    // Use a COMMAND pattern to enable redo
    const savedEntities = serialise(ids);
    commandManager.doAction( () => {
        ids.forEach(id => removeEntity(world, id));
    }, () => {
        deserialize(world, savedEntities);
    })

    uiSystem.enableUndoButton(commandManager.canUndo());
    // uiSystem.enableRedoButton(commandManager.canRedo());

    frameCounter = 0;
});

gameSystem.on(GAME_OVER_EVENT, (win) => {
    console.log(`GAME OVER! ${win ? 'WINNER':'LOSER'}`);

    if (win) {
        const wins = parseInt(window.localStorage.getItem(LOCALSTORAGE_WIN_KEY), 10) || 0;
        wins++;
        window.localStorage.setItem(LOCALSTORAGE_WIN_KEY, wins);
        uiSystem.setWins(wins);
    }
    world.game.state = GAMESTATE_WIN;
});

//
// Load the required resources
//
Loader.shared
    .add('background', backgroundImage)
    .add('sprites', spritesheetImage)
    .load((loader, resources) => {
        const spritesheet = new Spritesheet(
            resources['sprites'].texture.baseTexture,
            spritesheetJson
        );
        spritesheet.parse(() => {
            resources['spritesheet'] = spritesheet;

            // once the loading is done, init the systems that need to render
            renderSystem.init(resources);
            scoreboardSystem.init(resources);  
            uiSystem.init(resources);

            // uiSystem.init(resources);  
            renderSystem.addStaticDisplayObject(scoreboardSystem.getDisplayObject());
            renderSystem.addStaticDisplayObject(uiSystem.getDisplayObject());
        });
    });


//
// Set up the Game Loop by adding systems
// (to a PIXI.Ticker)
let frameCounter = 0;
const ticker = new Ticker();
ticker.stop();
ticker.add((t) => {
    switch (world.game.state) {
        case GAMESTATE_INIT:
            frameCounter += t;
            if (frameCounter > STARTUP_FRAMES && renderSystem._isReady) {
                world.game.state = GAMESTATE_NEW;
                uiSystem.enableNewGameButton(false);
                uiSystem.enableUndoButton(false);
                frameCounter = 0;
            }
            break; 

        case GAMESTATE_NEW:
            console.info('Starting a NEW GAME of Sigmar\'s Garden (Web)');

            // clear the entity system and start again...
            commandManager.clear();
            gameSystem.clear(world);
            layoutGenerator.startLayout();

            uiSystem.enableUndoButton(false);            
            uiSystem.enableNewGameButton(false);
            uiSystem.setWins(world.game.wins);

            world.game.state = GAMESTATE_LAYOUT;
            frameCounter = 0;

            renderSystem.update(world);
            break;

        case GAMESTATE_LAYOUT:
            frameCounter += t;
            if (frameCounter > LAYOUT_FRAMES) {
                if (layoutGenerator.hasNextPiece()) {
                    const piece = layoutGenerator.getNextPiece();
                    gameSystem.addPiece(world, piece);
                    // console.debug(`Layout: added ${eid} with `, getEntityComponents(world, eid));
                }
                else
                {
                    // layout is finished - get ready to start the game
                    uiSystem.enableNewGameButton(true);
                    world.game.state = GAMESTATE_RUNNING;
                }
                
                gameSystem.update(world);
                scoreboardSystem.update(world);
                renderSystem.update(world);
                frameCounter = 0;
            }

            break;

        case GAMESTATE_RUNNING:
            
            gameSystem.update(world);
            scoreboardSystem.update(world);
            renderSystem.update(world);
            uiSystem.update(world);
            
            frameCounter++;
            if (frameCounter > HINT_FRAMES) {
                const hint = gameSystem.getHint(world);

                console.debug(`HINT: `, hint);
                if (hint && hint.forEach) {
                    hint.forEach(id => renderSystem.blink(world, id));
                }
                frameCounter = 0;
            }

            break;

        case GAMESTATE_WIN:
            world.game.state = GAMESTATE_OVER;

            uiSystem.enableNewGameButton(true);
            uiSystem.enableUndoButton(false);
            uiSystem.enableRedoButton(false);

        case GAMESTATE_OVER:
            renderSystem.update(world)
            break;
    }
});
ticker.start();
