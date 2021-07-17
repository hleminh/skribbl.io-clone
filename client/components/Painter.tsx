import React, { MouseEventHandler, useEffect, useRef, useState } from 'react';
import { FaTrashAlt, FaEraser } from 'react-icons/fa';
import { GrPaint } from 'react-icons/gr';
import { RiBrushFill } from 'react-icons/ri';
import { Colors } from '../constants/colors';
import { Tools } from '../constants/tools';
import Tooltip from './Tooltip';
import { ws } from './WebSocket';

export default function Paint(props: { height: number, width: number }) {
    const [drawing, setDrawing] = useState(false);
    const [mouseCoors, setMouseCoors] = useState({ x: 0, y: 0 });
    const [brush, setBrush] = useState({ tool: Tools.Brush, color: 'black', prevColor: 'black', width: 2 })

    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const canvasContextRef = useRef<CanvasRenderingContext2D | null>(null);
    const cursorRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (canvasRef) {
            canvasContextRef.current = canvasRef.current!.getContext('2d');
            canvasContextRef.current!.fillStyle = 'white';
            canvasContextRef.current!.fillRect(0, 0, canvasRef.current!.width, canvasRef.current!.height);
        }
        cursorRef.current!.style.width = `${brush.width}px`;
        cursorRef.current!.style.height = `${brush.width}px`;
        hideCursor();

        ws!.onerror = (event) => {
            console.log(event);
        }

        ws!.onopen = (event) => {
            console.log(event);
        }

        ws!.addEventListener('message', (event) => {
            const data = event.data.split(',');

            switch (data[0]) {
                case 'draw':
                    const ctx = canvasContextRef.current;
                    ctx!.strokeStyle = data[1];
                    ctx!.lineWidth = data[2];
                    ctx!.lineCap = 'round';
                    ctx!.lineJoin = 'round';
                    ctx!.imageSmoothingEnabled = false;
                    ctx!.beginPath();
                    ctx!.moveTo(data[3], data[4]);
                    ctx!.lineTo(data[5], data[6]);
                    ctx!.closePath();
                    ctx!.stroke();
                    break;
                case 'fill':

                    break;
                case 'clear':
                    canvasContextRef.current!.clearRect(0, 0, canvasRef.current!.width, canvasRef.current!.height);
                    break;
            }
        });

        ws!.onclose = (event) => {
            console.log(event);
        }
    }, []);

    const mouseDownHandler: MouseEventHandler = (e: React.MouseEvent<HTMLCanvasElement, MouseEvent>) => {
        if (e.button === 0) {
            switch (brush.tool) {
                case Tools.Fill:
                    startFilling(e);
                    break;
                case Tools.Brush:
                case Tools.Eraser:
                    startDrawing(e);
                    break;
                default:
                    break;
            }
        }
    }

    const startDrawing: MouseEventHandler = (e: React.MouseEvent<HTMLCanvasElement, MouseEvent>) => {
        setDrawing(true);
        setMouseCoors({
            x: e.nativeEvent.offsetX,
            y: e.nativeEvent.offsetY
        });
    }

    const stopDrawing: MouseEventHandler = (e: React.MouseEvent<HTMLElement, MouseEvent>) => {
        setDrawing(false);
        setMouseCoors({
            x: 0,
            y: 0
        });
    }

    const clearCanvas: MouseEventHandler = (e: React.MouseEvent<HTMLElement, MouseEvent>) => {
        canvasContextRef.current!.clearRect(0, 0, canvasRef.current!.width, canvasRef.current!.height);
        ws!.send(`clear`);
    }

    const changeBrushColor: MouseEventHandler = (e: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
        const color = e.currentTarget.getAttribute('color')!;
        setBrush({
            ...brush,
            tool: brush.tool === Tools.Eraser ? Tools.Brush : brush.tool,
            prevColor: brush.color,
            color: color
        });
        cursorRef.current!.style.background = `${color}`;
    }

    const changeBrushWidth: MouseEventHandler = (e: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
        const width = Number.parseInt(e.currentTarget.getAttribute('value')!);
        setBrush({
            ...brush,
            width: width
        });
        cursorRef.current!.style.width = `${width}px`;
        cursorRef.current!.style.height = `${width}px`;
    }

    const showCursor = () => {
        cursorRef.current!.style.visibility = 'visible';
    }

    const hideCursor = () => {
        cursorRef.current!.style.visibility = 'hidden';
    }

    const draw: MouseEventHandler = (e: React.MouseEvent<HTMLCanvasElement, MouseEvent>) => {
        if (drawing) {
            const ctx = canvasContextRef.current;
            ctx!.strokeStyle = brush.color;
            ctx!.lineWidth = brush.width;
            ctx!.lineCap = 'round';
            ctx!.lineJoin = 'round';
            ctx!.imageSmoothingEnabled = false;
            ctx!.beginPath();
            ctx!.moveTo(mouseCoors.x, mouseCoors.y);
            ctx!.lineTo(e.nativeEvent.offsetX, e.nativeEvent.offsetY);
            ctx!.closePath();
            ctx!.stroke();

            ws!.send(`draw,${brush.color},${brush.width},${mouseCoors.x},${mouseCoors.y},${e.nativeEvent.offsetX},${e.nativeEvent.offsetY}`);

            setMouseCoors({
                x: e.nativeEvent.offsetX,
                y: e.nativeEvent.offsetY
            });
        }
        cursorRef.current!.style.left = `${e.clientX + window.scrollX - brush.width / 2}px`;
        cursorRef.current!.style.top = `${e.clientY + window.scrollY - brush.width / 2}px`;
    }

    const startFilling = (e: React.MouseEvent<HTMLCanvasElement, MouseEvent>) => {
        const canvas = canvasRef.current;
        const ctx = canvasContextRef.current;
        const startingX = e.nativeEvent.offsetX;
        const startingY = e.nativeEvent.offsetY;

        ctx!.strokeStyle = brush.color;
        ctx!.imageSmoothingEnabled = false;

        const imageData = ctx!.getImageData(0, 0, canvas!.width, canvas!.height);

        const targetColor = ctx!.getImageData(startingX, startingY, 1, 1).data;

        const fillColor = hex2RGB(ctx!.strokeStyle);

        const executionQueue = [startingX, startingY];

        floodFill(executionQueue, imageData, targetColor, fillColor, canvas!, ctx!);
    }

    function hex2RGB(hex: string) {
        let m = hex.match(/^#?([\da-f]{2})([\da-f]{2})([\da-f]{2})$/i)!;
        return {
            r: parseInt(m[1], 16),
            g: parseInt(m[2], 16),
            b: parseInt(m[3], 16)
        };
    }

    const floodFill = (queue: any[], imageData: ImageData, targetColor: Uint8ClampedArray, fillColor: { r: number, g: number, b: number }, canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D) => {
        const seen = new Uint32Array(imageData.data.length);
        const buf = imageData.data.buffer;
        const data8 = new Uint8ClampedArray(buf);
        const data32 = new Uint32Array(buf);
        const targetColor32 = new Uint32Array(targetColor.buffer)[0];

        while (queue.length !== 0) {
            const x = queue.shift();
            const y = queue.shift();
            if (x <= canvas.width && x >= 0 && y <= canvas.height && y >= 0 && !seen[x + y * canvas.width]) {
                if (data32[x + y * canvas.width] === targetColor32) {
                    data32[x + y * canvas.width] =
                        255 << 24 |
                        fillColor.b << 16 |
                        fillColor.g << 8 |
                        fillColor.r
                        ;
                    seen[x + y * canvas.width] = 1;
                    queue.push(x + 1, y);
                    queue.push(x - 1, y);
                    queue.push(x, y + 1);
                    queue.push(x, y - 1);
                }
            }
        }
        imageData.data.set(data8);
        ctx.putImageData(imageData, 0, 0);
    }

    const selectTool = (tool: Tools) => {
        switch (tool) {
            case Tools.Brush:
            case Tools.Fill:
                setBrush({
                    ...brush,
                    color: brush.tool === Tools.Eraser ? brush.prevColor : brush.color,
                    tool: tool
                });
                break;
            case Tools.Eraser:
                setBrush({
                    ...brush,
                    color: 'white',
                    prevColor: brush.color,
                    tool: tool
                });
                break;
            default:
                setBrush({
                    ...brush,
                    tool: tool,
                });
                break;
        }
    }

    const colorBtns = Colors.map((color) => (
        <button
            key={color}
            onClick={changeBrushColor}
            className={`flex-none shadow h-8 w-8 ${color === brush.color ? 'border-white border-4 border-double' : ''}`}
            color={color}
            style={{ background: color }}
        />
    ));

    return (
        <div className='flex flex-col items-center'>
            <div
                className='flex-none border-black border mb-2'
                onMouseUp={stopDrawing}
                onMouseLeave={stopDrawing}
            >
                <canvas
                    className='block cursor-none'
                    height={props.height}
                    width={props.width}
                    ref={canvasRef}
                    onMouseDown={mouseDownHandler}
                    onMouseUp={stopDrawing}
                    onMouseMove={draw}
                    onMouseEnter={showCursor}
                    onMouseLeave={hideCursor}
                >
                    You need a browser that supports Canvas to see this
                </canvas>
            </div>

            <div className={`absolute pointer-events-none rounded-full shadow-inner border-black border`} style={{ background: brush.color }} ref={cursorRef}>
            </div>

            <div className='bg-gray-200 p-4 border border-black'>
                <div className='flex mb-4'>
                    <Tooltip text='Brush'>
                        <button
                            className={`${brush.tool === Tools.Brush ? 'bg-gray-200' : 'bg-white'} hover:bg-gray-100 mr-2 rounded shadow p-2`}
                            onClick={() => selectTool(Tools.Brush)}
                        >
                            <RiBrushFill />
                        </button>
                    </Tooltip>
                    <Tooltip text='Fill'>
                        <button
                            className={`${brush.tool === Tools.Fill ? 'bg-gray-200' : 'bg-white'} hover:bg-gray-100	mr-2 rounded shadow p-2`}
                            onClick={() => selectTool(Tools.Fill)}
                        >
                            <GrPaint />
                        </button>
                    </Tooltip>
                    <Tooltip text='Eraser'>
                        <button
                            className={`${brush.tool === Tools.Eraser ? 'bg-gray-200' : 'bg-white'} hover:bg-gray-100 mr-2 rounded shadow p-2`}
                            onClick={() => selectTool(Tools.Eraser)}
                        >
                            <FaEraser />
                        </button>
                    </Tooltip>
                    <Tooltip text='Clear'>
                        <button
                            className='bg-white hover:bg-gray-200 rounded shadow p-2'
                            onClick={clearCanvas}
                        >
                            <FaTrashAlt />
                        </button>
                    </Tooltip>
                </div>

                <div className='flex mb-4'>
                    <Tooltip text='Choose color'>
                        {colorBtns}
                    </Tooltip>
                </div>

                <div className='flex items-center'>
                    <Tooltip text='Choose brush width'>
                        <button
                            className={`${2 === brush.width ? 'bg-gray-200' : 'bg-white'} flex-none hover:bg-gray-100 mr-2 rounded shadow p-2`}
                            onClick={changeBrushWidth}
                            value={2}
                        >
                            <div
                                className='rounded-full shadow-inner border-black border'
                                style={{
                                    background: brush.color,
                                    width: 2,
                                    height: 2
                                }}>
                            </div>
                        </button>
                        <button
                            className={`${4 === brush.width ? 'bg-gray-200' : 'bg-white'} flex-none hover:bg-gray-100 mr-2 rounded shadow p-2`}
                            onClick={changeBrushWidth}
                            value={4}
                        >
                            <div
                                className='rounded-full shadow-inner border-black border'
                                style={{
                                    background: brush.color,
                                    width: 4,
                                    height: 4
                                }}>
                            </div>
                        </button>
                        <button
                            className={`${8 === brush.width ? 'bg-gray-200' : 'bg-white'} flex-none hover:bg-gray-100	mr-2 rounded shadow p-2`}
                            onClick={changeBrushWidth}
                            value={8}
                        >
                            <div
                                className='rounded-full shadow-inner border-black border'
                                style={{
                                    background: brush.color,
                                    width: 8,
                                    height: 8
                                }}
                            >
                            </div>
                        </button>
                        <button
                            className={`${16 === brush.width ? 'bg-gray-200' : 'bg-white'} flex-none hover:bg-gray-100 rounded shadow p-2`}
                            onClick={changeBrushWidth}
                            value={16}
                        >
                            <div
                                className='rounded-full shadow-inner border-black border'
                                style={{
                                    background: brush.color,
                                    width: 16,
                                    height: 16
                                }}>
                            </div>
                        </button>
                    </Tooltip>
                </div>
            </div>
        </div>
    )
}