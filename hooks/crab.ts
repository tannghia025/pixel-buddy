// Pixel Claude at its laptop, drawn as an SVG with SMIL animation (no
// script). One unit is one pixel of the sprite.

const ORANGE = '#D97757'
const SHADE = '#B85F42'
const EYE = '#1F1F1F'
const FRAME = '#5A5A5A'
const SCREEN = '#2B2B2B'
const KEY = '#6E6E6E'
const MUG = '#E8E2D6'
const STEAM = '#9A9A9A'
const SPARK = '#F2C94C'

const px = (x: number, y: number, w: number, h: number, fill: string, extra = '') =>
  `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${fill}"${extra}/>`

const loop = 'calcMode="discrete" repeatCount="indefinite"'

// Discrete hops through offsets, for the pixel-jumpy look.
const move = (values: string, dur: string, begin = '0s', keyTimes = '') =>
  `<animateTransform attributeName="transform" type="translate" values="${values}" dur="${dur}" begin="${begin}"${keyTimes ? ` keyTimes="${keyTimes}"` : ''} ${loop}/>`

const flash = (values: string, keyTimes: string, dur: string, begin = '0s') =>
  `<animate attributeName="opacity" values="${values}" keyTimes="${keyTimes}" dur="${dur}" begin="${begin}" ${loop}/>`

const blinkKey = (x: number, y: number, begin: string) =>
  px(x, y, 1, 1, KEY) + `<rect x="${x}" y="${y}" width="1" height="1" fill="${ORANGE}" opacity="0">${flash('0;1;0', '0;0.2;1', '0.8s', begin)}</rect>`

const laptop = (isThinking: boolean) => {
  // code lines scroll up the screen; the clip keeps them inside it
  const line = (y: number, w: number, fill: string) => px(2, y, w, 1, fill)
  const code = `<g clip-path="url(#scr)"><g>${line(8, 5, ORANGE)}${line(10, 7, KEY)}${line(12, 4, '#7FB27F')}${line(14, 6, KEY)}${line(16, 3, ORANGE)}${line(18, 6, '#7FB27F')}${move('0 0;0 -2;0 -4;0 -6', isThinking ? '4s' : '1.6s')}</g></g>`
  const cursor = `<rect x="8" y="12" width="1" height="1" fill="#EEE">${flash('1;0', '0;0.5', '0.7s')}</rect>`

  return [
    `<defs><clipPath id="scr"><rect x="1" y="7" width="9" height="6"/></clipPath></defs>`,
    px(0, 6, 11, 8, FRAME),
    px(1, 7, 9, 6, SCREEN),
    code,
    cursor,
    px(0, 14, 14, 1, FRAME),
    px(0, 15, 14, 2, '#444'),
    blinkKey(2, 15, '0s'),
    blinkKey(5, 16, '0.25s'),
    blinkKey(8, 15, '0.5s'),
    blinkKey(11, 16, '0.4s'),
    blinkKey(4, 15, '0.65s'),
  ].join('')
}

const crab = (isThinking: boolean) => {
  const x = 16
  // eyes glance at the laptop, back at you, then up; blink on top of that
  const eyes = `<g>${px(x + 2, 9, 1, 2, EYE)}${px(x + 6, 9, 1, 2, EYE)}${move(
    isThinking ? '0 0;0 -1;1 -1;0 0' : '-1 0;-1 0;0 0;-1 0',
    isThinking ? '3s' : '5s',
    '0s',
    '0;0.3;0.6;0.9',
  )}</g>`
  const lids = `<g opacity="0">${px(x + 1, 9, 7, 2, ORANGE)}${flash('0;1;0;1;0', '0;0.9;0.93;0.96;0.99', '4.2s')}</g>`

  // typing: arms tap alternately; thinking: left claw scratches the head
  const leftArm = isThinking
    ? `<g>${px(x - 1, 8, 1, 3, ORANGE)}${px(x - 1, 7, 2, 1, SHADE)}${move('0 0;0 -1', '0.5s')}</g>`
    : `<g>${px(x - 2, 11, 2, 1, ORANGE)}${px(x - 2, 12, 1, 1, SHADE)}${move('0 0;0 1;0 0;-1 1', '0.36s')}</g>`
  const rightArm = isThinking
    ? `<g>${px(x + 9, 11, 1, 2, ORANGE)}</g>`
    : `<g>${px(x + 9, 11, 2, 1, ORANGE)}${px(x + 10, 12, 1, 1, SHADE)}${move('0 1;0 0;0 1;0 0', '0.36s', '0.18s')}</g>`

  // feet shuffle in pairs
  const legs = (dxs: number[], begin: string) =>
    `<g>${dxs.map(dx => px(x + dx, 15, 1, 2, SHADE)).join('')}${move('0 0;0 -1', '0.6s', begin)}</g>`

  const body = [
    px(x, 8, 9, 7, ORANGE),
    px(x, 14, 9, 1, SHADE),
    px(x + 1, 7, 7, 1, ORANGE),
    // antenna that wobbles
    `<g>${px(x + 4, 5, 1, 2, SHADE)}${px(x + 4, 4, 1, 1, SPARK)}${move('0 0;1 0;0 0;-1 0', '1.2s')}</g>`,
    eyes,
    lids,
    // blush when it lands a jump
    `<g opacity="0">${px(x + 1, 12, 1, 1, '#F09A80')}${px(x + 7, 12, 1, 1, '#F09A80')}${flash('0;1;0', '0;0.8;0.95', '6s')}</g>`,
    leftArm,
    rightArm,
  ].join('')

  // a little hop every 6s, over a steady bob
  const bob = `<g>${body}${move('0 0;0 -1', isThinking ? '1.4s' : '0.7s')}</g>`
  const hop = `<g>${bob}${legs([1, 5], '0s')}${legs([3, 7], '0.3s')}${move('0 0;0 -2;0 -3;0 -2;0 0', '6s', '0s', '0;0.8;0.83;0.86;0.89')}</g>`

  const sparks = [
    [x - 2, 4, '0s'],
    [x + 10, 3, '0.7s'],
    [x + 12, 7, '1.4s'],
  ]
    .map(([sx, sy, begin]) => `<rect x="${sx}" y="${sy}" width="1" height="1" fill="${SPARK}" opacity="0">${flash('0;1;0', '0;0.1;0.3', '2.1s', begin as string)}</rect>`)
    .join('')

  const thought = isThinking
    ? [0, 1, 2]
        .map(
          i =>
            `<rect x="${x + 10 + i * 2}" y="${5 - i * 2}" width="${i === 2 ? 2 : 1}" height="${i === 2 ? 2 : 1}" fill="#DDD" opacity="0">${flash('0;1;1;0', `0;${0.15 + i * 0.2};0.85;1`, '1.8s')}</rect>`,
        )
        .join('')
    : sparks

  return hop + thought
}

// Coffee beside it, steam curling up.
const coffee = () => {
  const steam = (dx: number, begin: string) =>
    `<rect x="${31 + dx}" y="11" width="1" height="1" fill="${STEAM}" opacity="0"><animate attributeName="y" values="11;10;9;8;7" dur="1.5s" begin="${begin}" ${loop}/>${flash('0;0.9;0.7;0.4;0', '0;0.2;0.4;0.6;0.8', '1.5s', begin)}</rect>`

  return px(30, 13, 4, 4, MUG) + px(31, 13, 2, 1, '#6B3E26') + px(34, 14, 1, 2, MUG) + steam(0, '0s') + steam(2, '0.75s')
}

export const crabSvg = (isThinking: boolean) =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 36 18" shape-rendering="crispEdges">${laptop(isThinking)}${crab(isThinking)}${coffee()}</svg>`

// The HUD's small Claude: asleep with drifting z's while idle, awake and
// waving while a turn runs.
export const miniCrabSvg = (isWorking: boolean) => {
  const x = 3
  const body = px(x, 6, 9, 6, ORANGE) + px(x + 1, 5, 7, 1, ORANGE) + px(x, 11, 9, 1, SHADE)
  const legs = [1, 3, 5, 7].map(dx => px(x + dx, 12, 1, 2, SHADE)).join('')
  const open = (inner: string) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 14" shape-rendering="crispEdges">${inner}</svg>`

  if (!isWorking) {
    const eyes = px(x + 2, 8, 2, 1, EYE) + px(x + 5, 8, 2, 1, EYE)
    const arms = px(x - 1, 9, 1, 2, ORANGE) + px(x + 9, 9, 1, 2, ORANGE)
    // a pixel "z": top bar, diagonal step, bottom bar
    const z = (zx: number, begin: string) =>
      `<g opacity="0">${px(zx, 4, 2, 1, '#CCC')}${px(zx, 5, 1, 1, '#CCC')}${px(zx, 6, 2, 1, '#CCC')}` +
      `<animateTransform attributeName="transform" type="translate" values="0 1;1 0;2 -1;3 -3" dur="2.4s" begin="${begin}" ${loop}/>` +
      `${flash('0;1;1;0', '0;0.1;0.6;0.9', '2.4s', begin)}</g>`
    // slow breathing: the body sinks a pixel and rises
    return open(`<g>${body}${eyes}${arms}${move('0 0;0 1', '1.6s')}</g>${legs}${z(x + 10, '0s')}${z(x + 12, '1.2s')}`)
  }

  const eyes = `<g>${px(x + 2, 7, 1, 2, EYE)}${px(x + 6, 7, 1, 2, EYE)}${move('0 0;1 0;0 0;-1 0', '1.6s')}</g>`
  const wave = (ax: number, begin: string) => `<g>${px(ax, 6, 1, 3, ORANGE)}${px(ax, 5, 1, 1, SHADE)}${move('0 0;0 -2', '0.3s', begin)}</g>`
  const sparkle = (sx: number, sy: number, begin: string) =>
    `<rect x="${sx}" y="${sy}" width="1" height="1" fill="${SPARK}" opacity="0">${flash('0;1;0', '0;0.15;0.4', '1.2s', begin)}</rect>`

  return open(`<g>${body}${eyes}${wave(x - 1, '0s')}${wave(x + 9, '0.15s')}${move('0 0;0 -1', '0.4s')}</g>${legs}${sparkle(1, 2, '0s')}${sparkle(15, 1, '0.4s')}${sparkle(17, 6, '0.8s')}`)
}
