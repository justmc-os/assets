import fetch from 'node-fetch';
import { promises as fs, existsSync, mkdirSync, exists } from 'fs';
import { createCanvas, loadImage, registerFont } from 'canvas';
import path from 'path';

import {
  Dictionary,
  error,
  exitIfAnyErrors,
  fileExists,
  ICONS_CACHE_DIR,
  ICONS_DIR,
  info,
  success,
  type CachedIcon,
} from './common';

registerFont('Minecraft.ttf', { family: 'Minecraft' });

const SIZE = 300;
const FONT_SIZE = 165;
const TEXT_OFFSET_Y = 6;
const TEXT_OFFSET_X = -2;
const SHADOW_OFFSET = 17;
const SHADOW_COLOR = '#373737';
const TEXT_COLOR = 'white';

const DEFAULT_DEST_IMAGE_OPTIONS = {
  x: 0,
  y: 0,
  width: SIZE,
  height: SIZE,
};

const HEAD_DEST_IMAGE_WIDTH = 246;
const HEAD_DEST_IMAGE_HEIGHT = 260;
const HEAD_DEST_IMAGE_OPTIONS = {
  x: ~~((SIZE - HEAD_DEST_IMAGE_WIDTH) / 2),
  y: ~~((SIZE - HEAD_DEST_IMAGE_HEIGHT) / 2),
  width: HEAD_DEST_IMAGE_WIDTH,
  height: HEAD_DEST_IMAGE_HEIGHT,
};

const canvas = createCanvas(SIZE, SIZE);
const context = canvas.getContext('2d');
context.font = `${FONT_SIZE}px Minecraft Seven`;

const offCanvas = createCanvas(SIZE, SIZE);
const offContext = offCanvas.getContext('2d');

const glint = fs
  .readFile(path.resolve(__dirname, '../enchanted_item_glint.png'))
  .then(loadImage);

const getPlayerHeadId = (texture: string): string => {
  const decoded = Buffer.from(texture, 'base64').toString('utf-8');

  try {
    const parsed = JSON.parse(decoded);

    return parsed.textures.SKIN.url.split('/').pop();
  } catch (_) {
    // New steve
    return '31f477eb1a7beee631c2ca64d06f8f68fa93a3386d04452ab27f43acdf1b60cb';
  }
};

const loadIcon = async (url: string) => {
  const result = await fetch(url, {
    timeout: 40_000,
  }).then((r) => r.buffer());

  return result;
};

const drawIcon = async (icon: CachedIcon) => {
  let buffer: Buffer;
  let destinationOpts = DEFAULT_DEST_IMAGE_OPTIONS;

  if (icon.material === 'PLAYER_HEAD') {
    const texture = icon.texture;
    if (!texture)
      return error(`Could not get player head texture for icon ${icon.id}`);

    destinationOpts = HEAD_DEST_IMAGE_OPTIONS;
    buffer = await loadIcon(
      `https://mc-heads.net/head/${getPlayerHeadId(texture)}`
    );
  } else {
    buffer = await loadIcon(
      `https://raw.githubusercontent.com/Owen1212055/mc-assets/main/assets/${icon.material}.png`
    );
  }

  const image = await loadImage(buffer);

  context.clearRect(0, 0, SIZE, SIZE);
  context.drawImage(
    image,
    destinationOpts.x,
    destinationOpts.y,
    destinationOpts.width,
    destinationOpts.height
  );

  if (icon.hasGlint) {
    offContext.clearRect(0, 0, SIZE, SIZE);
    offContext.drawImage(image, 0, 0, SIZE, SIZE);
    offContext.save();
    offContext.globalCompositeOperation = 'source-atop';
    offContext.drawImage(await glint, 0, 0, SIZE, SIZE);
    offContext.restore();

    context.save();
    context.globalAlpha = 0.5;
    context.globalCompositeOperation = 'lighter';
    context.drawImage(await loadImage(offCanvas.toBuffer()), 0, 0);
    context.restore();
  }

  if (!('amount' in icon) || icon.amount < 2) return canvas.toBuffer();

  const text = icon.amount.toString();
  const { width } = context.measureText(text);
  const x = SIZE - width - TEXT_OFFSET_X;
  const y = SIZE - TEXT_OFFSET_Y;

  context.fillStyle = SHADOW_COLOR;
  context.fillText(text, x, y);

  context.fillStyle = TEXT_COLOR;
  context.fillText(text, x - SHADOW_OFFSET, y - SHADOW_OFFSET);

  return canvas.toBuffer();
};

(async () => {
  info('creating icons...');
  const iconsDir = await fs.readdir(ICONS_CACHE_DIR);

  await Promise.all(
    iconsDir.map(async (categoryFile) => {
      const icons: Dictionary<CachedIcon> = JSON.parse(
        await fs.readFile(path.resolve(ICONS_CACHE_DIR, categoryFile), 'utf-8')
      );

      const category = `${categoryFile.replace('.json', '')}`;
      const categoryDir = path.resolve(ICONS_DIR, category);
      info(`creating ${category} icons...`);

      if (!(await fileExists(categoryDir))) await fs.mkdir(categoryDir);

      await Promise.all(
        Object.values(icons).map(async (icon) => {
          const iconPath = path.resolve(categoryDir, `${icon.id}.png`);

          if (await fileExists(iconPath)) return;
          const picture = await drawIcon(icon);
          if (!picture) return;

          return fs.writeFile(iconPath, picture);
        })
      );

      exitIfAnyErrors();

      success(`created ${category} icons`);
    })
  );

  info('creating extra icons...');

  const extraIcons: (CachedIcon & { path: string })[] = JSON.parse(
    await fs.readFile(path.resolve(ICONS_DIR, 'extra_icons.json'), 'utf-8')
  );

  await Promise.all(
    extraIcons.map(async (icon) => {
      const dir = path.resolve(ICONS_DIR, icon.path);
      if (!existsSync(dir)) mkdirSync(dir);

      return fs.writeFile(`${dir}/${icon.id}.png`, await drawIcon(icon));
    })
  );

  success(`created all icons`);
})();
