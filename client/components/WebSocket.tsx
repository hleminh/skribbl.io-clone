export const ws = process.browser ? new WebSocket('ws://localhost:6969') : null;
