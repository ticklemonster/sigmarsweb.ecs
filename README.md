# Sigmar's Web

A (rather average) web-based clone of Sigmar's Garden from the (quite excellent) game, Opus Magnum.
If you don't already know how to play the game - go and buy the original!

This is an exercise for my own learning, but is relatively complete and functional.
It was refactored in an attempt to take an _Entity-Component-System_ type approach, with PIXI.js as the renderer.

## Recent updates
20 Mar 2022
* Refactor to remove knowledge of Entity/Component storage from Systems (all Systems now use EntityManager)
* Added a HINT feature
12 Mar 2022
* Added an UNDO capability (with redo in the code, but not the UI)

## TODO:
* Hints - suggest potential moves (if you get stuck) 
* Settings page - if there's anything to set
* Help page - maybe
* Make it look prettier?

