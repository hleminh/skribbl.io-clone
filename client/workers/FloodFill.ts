import _ from 'lodash-es';

const floodFill = (data: { startingX: number, startingY: number, buf: Uint8ClampedArray, width: number, height: number, targetColor: Uint8ClampedArray, fillColor: { r: number, g: number, b: number } }) => {
    const { startingX, startingY, width, height, buf, targetColor, fillColor } = data;
    const seen = new Uint32Array(width * height);
    const data8 = new Uint8ClampedArray(buf);
    const data32 = new Uint32Array(buf);
    const targetColor32 = new Uint32Array(targetColor.buffer)[0];
    const executionQueue = [Math.floor(startingX), Math.floor(startingY)];
    while (executionQueue.length !== 0) {
        const x = executionQueue.shift()!;
        const y = executionQueue.shift()!;
        const currentPixel = Math.floor(x + y * width);
        if (x <= width && x >= 0 && y <= height && y >= 0 && !seen[currentPixel]) {
            if (data32[currentPixel] === targetColor32) {
                data32[currentPixel] =
                    255 << 24 |
                    fillColor.b << 16 |
                    fillColor.g << 8 |
                    fillColor.r
                    ;
                seen[currentPixel] = 1;
                executionQueue.push(x + 1, y);
                executionQueue.push(x - 1, y);
                executionQueue.push(x, y + 1);
                executionQueue.push(x, y - 1);
            }
        }
    }
    return data8;
}

self.addEventListener('message', _.debounce((event: any) => {
    self.postMessage(floodFill(event.data));
}, 200));

export { }
