// hf-utils.js — HyperFrames Weapon Compatibility Utilities
// Resolve CSS selector strings to DOM elements.
// GSAP natively accepts strings, but custom weapon functions often call
// el.querySelector() / el.querySelectorAll() internally — which fails on strings.
// Include this script BEFORE any weapon scripts.

function resolveElement(el) {
  if (typeof el === 'string') return document.querySelector(el);
  return el;
}

function resolveElements(el) {
  if (typeof el === 'string') return document.querySelectorAll(el);
  if (el && typeof el.length === 'undefined') return [el]; // single element → array
  return el;
}
