// background.js
chrome.runtime.onInstalled.addListener(() => {
  console.log('Gemini Image Processor extension installed');
});

// Service worker to handle potential errors
self.addEventListener('error', (event) => {
  console.error('Service worker error:', event.message);
});

// This helps address the service worker registration failures shown in the screenshot
self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(clients.claim());
});