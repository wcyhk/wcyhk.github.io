import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync, existsSync} from 'node:fs';
const root = existsSync(new URL('../dist/index.html', import.meta.url)) ? '../dist/' : '../';
const html = readFileSync(new URL(`${root}index.html`, import.meta.url), 'utf8');
const css = readFileSync(new URL(`${root}styles.css`, import.meta.url), 'utf8');
const about = html.slice(html.indexOf('<section class="studio '), html.indexOf('<section class="closing'));
const words = about.replace(/<[^>]+>/g, '').replace(/\s/g, '');
test('About preserves the approved positioning and curriculum projects', () => {
  for (const phrase of ['懂課堂，能開發，把構想做成作品。','教育科技與 STEAM 專家','課程設計・AI 應用・互動開發','自 2019 年起','整合九個學科的曲奇創業項目','STEM 陀螺及未來城市模型專題研習','RoboMaster Youth Tournament 2025 分組亞軍及香港八強','HKU x TKOGSS Racing Cup 分組冠軍與團體總亞軍','把教育目標設計成體驗，把技術能力做成作品。']) assert.ok(words.includes(phrase.replace(/\s/g, '')), phrase);
});
test('About has one section heading, four subsections and readable lists', () => {
  assert.equal((about.match(/<h2\b/g) || []).length, 1);
  assert.equal((about.match(/<h3\b/g) || []).length, 4);
  assert.equal((about.match(/<li>/g) || []).length, 9);
  for (const id of ['studio-heading','studio-curriculum','studio-team','studio-work','studio-qualifications']) {
    assert.ok(about.includes(`id="${id}"`));
    assert.ok(about.includes(`aria-labelledby="${id}"`));
  }
});
test('About retains approved qualifications, WCY artwork and existing social destinations', () => {
  for (const phrase of ['香港教育大學學位教師教育文憑（PGDE），主修設計與科技','Coventry University BSc (Hons) Computing','香港專業教育學院流動應用程式開發高級文憑','Apple Teacher','Microsoft Azure AI Fundamentals（AI-900）']) assert.ok(words.includes(phrase.replace(/\s/g, '')), phrase);
  assert.ok(about.includes('time-canvas'));
  assert.ok(about.includes('世界的盡頭'));
  assert.ok(about.includes('https://github.com/wcyhk'));
  assert.ok(about.includes('https://www.youtube.com/@wcy_hk'));
  assert.ok(!about.includes('mailto:'));
  assert.ok(!about.includes('tel:'));
  assert.ok(!about.includes('instagram.com'));
});
test('New editorial layout is scoped and defines a mobile single-column body', () => {
  const added = css.split('/* Approved professional profile:')[1];
  assert.ok(added.includes('.studio-expanded'));
  assert.ok(added.includes('@media(max-width:720px)'));
  assert.ok(added.includes('font-size:16px;line-height:1.95'));
  assert.ok(added.includes('grid-template-columns:minmax(0,1fr)'));
});
