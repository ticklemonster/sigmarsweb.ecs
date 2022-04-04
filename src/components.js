//
// Define the bitecs components and for this world
//

import { defineComponent, Types } from "bitecs";

// export const Vector2 = defineComponent({ x, y });
export const AxialPosition = defineComponent({ q: Types.f32, r: Types.f32 });
export const Piece = defineComponent({ typeId: Types.ui8, state: Types.ui8 });
export const Displayable = defineComponent({ spriteId: Types.ui8 });

export const PIECE_TYPES = [
    { type: 'salt',        sprite:  0, qty: 4, matches: [ 'salt', 'fire', 'water', 'earth', 'air' ], requires: [] },
    { type: 'fire',        sprite:  1, qty: 8, matches: [ 'fire', 'salt' ], requires: [] },
    { type: 'water',       sprite:  2, qty: 8, matches: [ 'water', 'salt' ], requires: [] },
    { type: 'earth',       sprite:  3, qty: 8, matches: [ 'earth', 'salt' ], requires: [] },
    { type: 'air',         sprite:  4, qty: 8, matches: [ 'air', 'salt' ], requires: [] },
    { type: 'mors',        sprite:  5, qty: 4, matches: [ 'vitae' ], requires: [] },
    { type: 'vitae',       sprite:  6, qty: 4, matches: [ 'mors' ], requires: [] },
    { type: 'quicksilver', sprite:  7, qty: 5, matches: [ 'lead', 'tin', 'iron', 'copper', 'silver' ], requires: [] },
    { type: 'lead',        sprite:  8, qty: 1, matches: [ 'quicksilver' ], requires: [] },
    { type: 'tin',         sprite:  9, qty: 1, matches: [ 'quicksilver' ], requires: ['lead'] },
    { type: 'iron',        sprite: 10, qty: 1, matches: [ 'quicksilver' ], requires: ['tin'] },
    { type: 'copper',      sprite: 11, qty: 1, matches: [ 'quicksilver' ], requires: ['iron'] },
    { type: 'silver',      sprite: 12, qty: 1, matches: [ 'quicksilver' ], requires: ['copper'] },
    { type: 'gold',        sprite: 13, qty: 1, matches: [], requires: ['silver'] },
];

export const METAL_TYPES = ['lead', 'tin', 'iron', 'copper', 'silver', 'gold'];

export const SPRITE_NAMES = [
    'salt.png', 'fire.png', 'water.png', 'earth.png', 'air.png', 
    'mors.png', 'vitae.png', 'quicksilver.png', 'lead.png', 'tin.png', 
    'iron.png', 'copper.png', 'silver.png', 'gold.png', 'selector.png',
]

export const PIECE_STATES = {
    NONE: 0x0,
    ENABLED: 0x01,
    SELECTED: 0x02,
    HIGHLIGHTED: 0x04,
}

export const DISPLAY_STATES = {
    // display style constants
    ALPHA_SHOW: 1.0,
    ALPHA_HIDE: 0.7,
    TINT_HIDE:  0x888888,
    TINT_SHOW:  0xffffff,
}
