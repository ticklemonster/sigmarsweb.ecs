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
let entities = [];

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
            }
            break; 

        case GAMESTATE_NEW:
            console.debug('Start a NEW GAME');
            // clear the entity system and start again...
            entities = [];

            // add the scoreboard entities then start the layout
            scoreboardSystem.createEntities(entities);
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
                entities.push(nextEntity);
            }

            gameSystem.update(t, entities); //.filter(e => e.components.has('piece')));
            scoreboardSystem.update(t, entities);
            renderSystem.update(t, entities);

            break;

        case GAMESTATE_RUNNING:
            gameSystem.update(t, entities); //entities.filter(e => e.components.has('piece')));
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
        // console.debug('NEW GAME event received');
        gameState = GAMESTATE_NEW;
    });

    renderSystem.on('SELECT', (entity) => {
        console.debug(`SELECT EVENT for entity `, entity);
        gameSystem.toggleSelect(entity, entities);
    })


    // set up the win tracker
    wins = parseInt(window.localStorage.getItem(LOCALSTORAGE_WIN_KEY), 10) || 0;
    uiSystem.setWins( wins );

})();
