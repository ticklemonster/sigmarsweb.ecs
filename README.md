# Sigmar's Web

A (rather average) web-based clone of Sigmar's Garden from the (quite excellent) game, Opus Magnum.
If you don't already know how to play the game - go and buy the original!

This is an exercise for my own learning, but is relatively complete and functional.
It was refactored in an attempt to take an _Entity-Component-System_ type approach, with PIXI.js as the renderer. Originally with a simple DIY ECS, it has ben rewritten with bitECS (in anticipation of PIXI 4).

An UNDO system was added (following a _Command_ pattern).

And a HINT feature is triggered by an "idle timer" (frame counter).

## Recent updates
5 Apr 2022
* Replace my rough ECS with bitECS (https://github.com/NateTheGreatt/bitECS)

20 Mar 2022
* Added a HINT feature

12 Mar 2022
* Added an UNDO capability (with redo in the code, but not the UI)

## TODO:
* Settings page - if there's anything to set
* Help page - maybe
* Make it look prettier?

