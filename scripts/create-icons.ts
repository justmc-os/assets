import fetch from 'node-fetch';
import { promises as fs } from 'fs';
import { createCanvas, loadImage, registerFont } from 'canvas';
import path from 'path';

import {
  Dictionary,
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

const canvas = createCanvas(SIZE, SIZE);
const context = canvas.getContext('2d');
context.font = `${FONT_SIZE}px Minecraft Seven`;

const offCanvas = createCanvas(SIZE, SIZE);
const offContext = offCanvas.getContext('2d');

const glint = fs
  .readFile(path.resolve(__dirname, '../enchanted_item_glint.png'))
  .then(loadImage);

const loadIcon = async (material: string) => {
  const result = await fetch(
    `https://raw.githubusercontent.com/Owen1212055/mc-assets/main/assets/${material}.png`,
    {
      timeout: 40_000,
    }
  ).then((r) => r.buffer());

  return result;
};

const drawIcon = async (icon: CachedIcon) => {
  const buffer = await loadIcon(icon.material);
  const image = await loadImage(buffer);

  context.clearRect(0, 0, SIZE, SIZE);
  context.drawImage(image, 0, 0, SIZE, SIZE);

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

  if (icon.amount < 2) return canvas.toBuffer();

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

  const jobs = iconsDir.map(async (categoryFile) => {
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
        return fs.writeFile(iconPath, await drawIcon(icon));
      })
    );

    success(`created ${category} icons`);
  });

  for (let job of jobs) {
    await job;
  }

  success(`created all icons`);
})();
