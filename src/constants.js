// constants.js
//
// Constants and shared information for all Game modules,
// including axial coordinates system for the hex grid
//

// axial direction vectors in anticlockwise order
//       [ 0,-1]  /\    [ 1,-1]
//              /    \
//    [-1, 0] | [ 0, 0] | [ 1, 0]
//              \    /
//       [-1, 1]  \/   [ 0, 1]
//
const AXIAL_VECTORS = [[+1, 0], [+1, -1], [0, -1], [-1, 0], [-1, +1], [0, +1]];

// game setup information 
const PIECE_TYPES = new Map([
    ['salt',        { sprite: 'salt.png', qty: 4, matches: [ 'salt', 'fire', 'water', 'earth', 'air' ]}],
    ['fire',        { sprite: 'fire.png', qty: 8, matches: [ 'fire', 'salt' ]}],
    ['water',       { sprite: 'water.png', qty: 8, matches: [ 'water', 'salt' ] }],
    ['earth',       { sprite: 'earth.png', qty: 8, matches: [ 'earth', 'salt' ] }],
    ['air',         { sprite: 'air.png', qty: 8, matches: [ 'air', 'salt' ] }],
    ['mors',        { sprite: 'mors.png', qty: 4, matches: [ 'vitae' ] }],
    ['vitae',       { sprite: 'vitae.png', qty: 4, matches: [ 'mors' ] }],
    ['quicksilver', { sprite: 'quicksilver.png', qty: 5, matches: [ 'lead', 'tin', 'iron', 'copper', 'silver' ] }],
    ['lead',        { sprite: 'lead.png', qty: 1, matches: [ 'quicksilver' ] }],
    ['tin',         { sprite: 'tin.png', qty: 1, matches: [ 'quicksilver' ] }],
    ['iron',        { sprite: 'iron.png', qty: 1, matches: [ 'quicksilver' ] }],
    ['copper',      { sprite: 'copper.png', qty: 1, matches: [ 'quicksilver' ] }],
    ['silver',      { sprite: 'silver.png', qty: 1, matches: [ 'quicksilver' ] }],
    ['gold',        { sprite: 'gold.png', qty: 1, matches: [] }],
]);
const METALS = ['lead', 'tin', 'iron', 'copper', 'silver', 'gold'];

// Possible starting layouts (in axial coordinates)
const BOARD_LAYOUTS = [
    [ 
        [ 0, 0], [ 1,-1], [ 1, 0], [ 0, 1], [-1, 1], [-1, 0], [ 0,-1], [ 1,-2], 
        [ 2,-2], [ 2,-1], [ 2, 0], [ 1, 1], [ 0, 2], [-1, 2], [-2, 2], [-2, 1], 
        [-2, 0], [-1,-1], [ 0,-2], [ 1,-3], [ 2,-3], [ 3,-3], [ 3,-2], [ 3,-1], 
        [ 3, 0], [ 2, 1], [ 1, 2], [ 0, 3], [-1, 3], [-2, 3], [-3, 3], [-3, 2], 
        [-3, 1], [-3, 0], [-2,-1], [-1,-2], [ 0,-3], [ 2,-4], [ 3,-4], [ 4,-2], 
        [ 4,-1], [ 2, 2], [ 1, 3], [-2, 4], [-3, 4], [-4, 2], [-4, 1], [-2,-2], 
        [-1,-3], [ 3,-5], [ 5,-2], [ 2, 3], [-3, 5], [-5, 2], [-2,-3]
    ], [
        [ 0, 0], [ 1,-1], [ 1, 0], [ 0, 1], [-1, 1], [-1, 0], [ 0,-1], [ 1,-2], 
        [ 2,-2], [ 1, 1], [ 0, 2], [-2, 1], [-2, 0], [ 2,-3], [ 3,-2], [ 1, 2],
        [-1, 3], [-3, 1], [-2,-1], [ 3,-4], [ 4,-4], [ 4,-3], [ 4,-2], [ 1, 3],
        [ 0, 4], [-1, 4], [-2, 4], [-4, 1], [-4, 0], [-3,-1], [-2,-2], [ 5,-3],
        [ 5,-2], [ 5,-1], [ 5, 0], [ 4, 1], [ 3, 2], [ 2, 3], [ 1, 4], [-2, 5],
        [-3, 5], [-4, 5], [-5, 5], [-5, 4], [-5, 3], [-5, 2], [-5, 1], [-3,-2],
        [-2,-3], [-1,-4], [ 0,-5], [ 1,-5], [ 2,-5], [ 3,-5], [ 4,-5]
    ], [
        [ 0, 0], [ 2,-2], [ 2,-1], [ 2, 0], [ 1, 1], [ 0, 2], [-1, 2], [-2, 2],
        [-2, 1], [-2, 0], [-1,-1], [ 0,-2], [ 1,-2], [ 2,-3], [ 3,-3], [ 3,-1],
        [ 3, 0], [ 1, 2], [ 0, 3], [-2, 3], [-3, 3], [-3, 1], [-3, 0], [-1,-2],
        [ 0,-3], [ 4,-4], [ 4,-3], [ 4,-2], [ 4,-1], [ 4, 0], [ 3, 1], [ 2, 2],
        [ 1, 3], [ 0, 4], [-1, 4], [-2, 4], [-3, 4], [-4, 4], [-4, 3], [-4, 2],
        [-4, 1], [-4, 0], [-3,-1], [-2,-2], [-1,-3], [ 0,-4], [ 1,-4], [ 2,-4],
        [ 3,-4], [ 5,-5], [ 5, 0], [ 0, 5], [-5, 5], [-5, 0], [ 0,-5]
    ]
];


export {
    // AXIAL Info
    AXIAL_VECTORS,

    // GAME setup
    PIECE_TYPES, METALS, BOARD_LAYOUTS,
}
