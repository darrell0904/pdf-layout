const assert = require("assert");
const fs = require("fs");
const vm = require("vm");

const source = fs.readFileSync("layouts.js", "utf8");
const sandbox = {};
vm.runInNewContext(`${source}\nglobalThis.__layouts = LAYOUTS;`, sandbox);

const layouts = sandbox.__layouts;
const verticalThree = layouts.find((layout) => layout.id === "vertical-3");

assert(verticalThree, "vertical-3 layout should exist");
assert.strictEqual(verticalThree.fixedCount, 3, "vertical-3 should always use 3 slots");
assert.strictEqual(verticalThree.autoCanvas, "vertical-stack", "vertical-3 should use automatic long-image canvas sizing");

const slots = verticalThree.getSlots(1000, 1800, { pad: 40, gap: 20, gapX: 20 }, 3);
assert.strictEqual(slots.length, 3, "vertical-3 should produce exactly 3 slots");
assert(slots.every((slot) => slot.mode === "contain"), "vertical-3 should preserve each image without cropping");
assert(slots.every((slot) => slot.x === slots[0].x && slot.w === slots[0].w), "all slots should be equal-width and aligned");
assert.strictEqual(slots[1].y, slots[0].y + slots[0].h + 20, "second slot should follow the first with configured gap");
assert.strictEqual(slots[2].y, slots[1].y + slots[1].h + 20, "third slot should follow the second with configured gap");
