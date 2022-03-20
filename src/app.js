// Import all the PIXI components explicity
import { Renderer, BatchRenderer } from '@pixi/core';
Renderer.registerPlugin('batch', BatchRenderer);
import { InteractionManager } from '@pixi/interaction';
Renderer.registerPlugin('interaction', InteractionManager);
import { Ticker } from '@pixi/ticker';
import { Loader } from "@pixi/loaders";
import { Spritesheet } from '@pixi/spritesheet';

// Add GSAP for animations
import { gsap } from 'gsap';
import { PixiPlugin } from 'gsap/PixiPlugin.js';
import { DisplayObject } from '@pixi/display';
gsap.registerPlugin(PixiPlugin);
PixiPlugin.registerPIXI({ 'DisplayObject': DisplayObject });


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
import EntityManager from './entityManager';
import CommandManager from './commandManager';

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

// Tracker for hints
const HINT_TIMEOUT = 600;   // 600 frames @ 60fps = 10 sec
let idleFrames = 0;

// Initialize PIXI.js components
const renderer = new Renderer({ width: 720, height: 720, backgroundColor: 0x00008b });
document.body.appendChild(renderer.view);

const loader = new Loader();

// Initialize the Systems
const entityManager = new EntityManager();
const commandManager = new CommandManager();
const layoutGenerator = new LayoutGenerator();
const gameSystem = new GameSystem();
const renderSystem = new RenderSystem(renderer);
const scoreboardSystem = new ScoreboardSystem();
const uiSystem = new UISystem();

// Add the systems (to a PIXI.Ticker)
let timeCounter = 30;
const ticker = new Ticker();
ticker.stop();
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
            console.info('Starting a NEW GAME of Sigmar\'s Garden (Web)');

            // clear the entity system and start again...
            entityManager.clear();
            commandManager.clear();
            uiSystem.enableUndoButton(false);

            // add the scoreboard entities then start the layout (no undo)
            entityManager.addEntities(
                scoreboardSystem.createEntities()
            );
            layoutGenerator.startLayout();
            uiSystem.enableNewGameButton(false);
            gameState = GAMESTATE_LAYOUT;

            renderSystem.update(t, entityManager);
            break;

        case GAMESTATE_LAYOUT:
            const nextPiece = layoutGenerator.nextPiece();
            if (nextPiece === null) {
                // layout is finished - get ready to start the game
                uiSystem.enableNewGameButton(true);
                gameState = GAMESTATE_RUNNING;
            }
            else if (nextPiece !== undefined) {
                entityManager.addEntities([{ name: nextPiece.piece.name, ...nextPiece }], false);
            }

            gameSystem.update(t, entityManager);
            scoreboardSystem.update(t, entityManager);
            renderSystem.update(t, entityManager);

            break;

        case GAMESTATE_RUNNING:
            
            gameSystem.update(t, entityManager);
            scoreboardSystem.update(t, entityManager);
            renderSystem.update(t, entityManager);
            
            // if all the pieces are gone - then the player wins!
            if (entityManager.getEntitiesWithComponent('piece').length == 0) {
                console.info('YOU WIN!');
                gameState = GAMESTATE_WIN;
            }
            
            // if we've been idle for while, ask for a hint
            idleFrames += t;
            if (idleFrames > HINT_TIMEOUT) {
                const hint = gameSystem.getHint(entityManager);
                if (!hint || hint.length == 0) {
                    console.info('GAME OVER - no more moves possible!');
                }
                else hint.forEach(entity => {
                    const sprite0 = entityManager.getEntityComponent(entity, 'sprite');
                    gsap.to(sprite0, {
                        duration: 0.3, 
                        yoyo: true, 
                        repeat: 3, 
                        pixi: { scale: 1.2 }
                    });
                });

                idleFrames = 0;
            }

            break;

        case GAMESTATE_WIN:
            wins = parseInt(window.localStorage.getItem(LOCALSTORAGE_WIN_KEY), 10) || 0;
            wins++;
            window.localStorage.setItem(LOCALSTORAGE_WIN_KEY, wins);
            uiSystem.setWins(wins);
            gameState = GAMESTATE_OVER;

            uiSystem.enableNewGameButton(true);
            uiSystem.enableUndoButton(false);
            uiSystem.enableRedoButton(false);

        case GAMESTATE_OVER:
            renderSystem.update(t, entityManager);
            break;
    }
});

// initialize the Game
{
    // Run the async loaders
    loader
        .add('background', backgroundImage)
        .add('sprites', spritesheetImage)
        .load((_loader, resources) => {
            // parse the spritesheet after the image is loaded
            const spritesheet = new Spritesheet(
                resources['sprites'].texture.baseTexture,
                spritesheetJson
            );
            spritesheet.parse(() => {
                // save the parsed spreadsheet
                resources['spritesheet'] = spritesheet;
                
                // give textures to the renderSystem...
                renderSystem.setTextures({...spritesheet.textures, 'background': resources['background'].texture});

                // add the background and static HUD objects
                renderSystem.addStaticTexture(0, 0, 'background');
                uiSystem.getDisplayObjects().forEach(o => renderSystem.addStaticDisplayObject(o));
                renderSystem.update(0, entityManager);

                // kick off the Systems
                ticker.start();
            });
        });

    // subscribe to game level events
    uiSystem.on('NEW GAME', () => {
        // console.debug('NEW GAME event received from UISystem');
        gameState = GAMESTATE_NEW;
    });
    uiSystem.on('UNDO', () => {
        // console.debug('UNDO EVENT received from UISystem');
        clearSelections();
        commandManager.undoAction();
        uiSystem.enableUndoButton(commandManager.canUndo());
        uiSystem.enableRedoButton(commandManager.canRedo());

        idleFrames = 0;
    });
    uiSystem.on('REDO', () => {
        // console.debug('REDO EVENT received from UISystem');
        clearSelections();
        commandManager.redoAction();
        uiSystem.enableUndoButton(commandManager.canUndo());
        uiSystem.enableRedoButton(commandManager.canRedo());

        idleFrames = 0;
    });

    renderSystem.on('SELECT', (entity) => {
        // console.debug(`SELECT EVENT for ${entity.name} received from RenderSystem`);
        selectEntities([entity]);

        idleFrames = 0;
    });
    
    gameSystem.on('UNSELECT', (entities) => {
        // console.debug(`UNSELECT EVENT for ${entities.map(e => e.name)} received from GameSystem`);
        selectEntities(entities, false);

        idleFrames = 0;
    });

    gameSystem.on('REMOVE', (entities) => {
        // console.debug(`REMOVE EVENT for ${entities.map(e => e.name)} received from GameSystem`);
        // use the COMMAND to make this undoable
        selectEntities(entities, false);
        commandManager.doAction( () => entityManager.removeEntities(entities), () => entityManager.addEntities(entities) );
        uiSystem.enableUndoButton(commandManager.canUndo());
        uiSystem.enableRedoButton(commandManager.canRedo());

        idleFrames = 0;
    });
        
    // set up the win tracker
    wins = parseInt(window.localStorage.getItem(LOCALSTORAGE_WIN_KEY), 10) || 0;
    uiSystem.setWins( wins );
}



//
// select or unselect an entity
// if "shouldSelect" is undefined, then toggle the current state
//
function selectEntities(entities, shouldSelect = undefined) {
    entities.forEach(entity => {
        const piece = entityManager.getEntityComponent(entity, 'piece');
        if (entity && piece) {
            piece.selected = (shouldSelect === undefined) ? !piece.selected : shouldSelect;

            if (piece.selected) {
                // console.debug(`[ select piece ${entity.name} ]`);
                entityManager.addEntities([newSelectorEntityFor(entity)]);
            } else {
                // console.debug(`[ unselect piece ${entity.name} ]`);
                const selectors = entityManager.getEntitiesWithComponentValue('selector', 'for', entity);
                entityManager.removeEntities(selectors);
            }
        }
    });
}

function clearSelections() {
    const selected = entityManager.getEntitiesWithComponentValue('piece', 'selected', true);
    selectEntities(selected, false);
}

function newSelectorEntityFor(other) {
    const entity = {
        name: 'selector for ' + other.name,
        selector: {
            'for': other,
        }
    }

    return entity;
}
