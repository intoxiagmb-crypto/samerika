import test from 'node:test';
import assert from 'node:assert/strict';
import {startBannerRotation} from '../lib/home-banner-rotation.mjs';

test('banners advance every five seconds and stop when rotation is cleaned up', t => {
  t.mock.timers.enable({apis:['setInterval']});
  let slide=0;
  const stop=startBannerRotation(()=>{slide=(slide+1)%3;});
  t.mock.timers.tick(4999);assert.equal(slide,0);
  t.mock.timers.tick(1);assert.equal(slide,1);
  t.mock.timers.tick(5000);assert.equal(slide,2);
  t.mock.timers.tick(5000);assert.equal(slide,0);
  stop();t.mock.timers.tick(15000);assert.equal(slide,0);
});
