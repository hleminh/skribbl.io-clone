import React, { MouseEventHandler, useContext, useEffect, useRef, useState } from 'react';
import { FaTrashAlt, FaEraser } from 'react-icons/fa';
import { GrPaint } from 'react-icons/gr';
import { RiBrushFill } from 'react-icons/ri';
import { Colors } from '../constants/Colors';
import { Tools } from '../constants/Tools';
import { BrushSizes } from '../constants/BrushSizes';
import { MessageType } from '../models/MessageType';
import { Message } from '../models/Message';
import { GameContext } from '../pages/_app';
import Tooltip from './Tooltip';
import { get } from './WebSocket';
import WordChooser from './WordChooser';
import { RoundState } from '../models/RoundState';
import RoundReveal from './RoundReveal';
import { LobbyState } from '../models/LobbyState';
import LobbyReveal from './LobbyReveal';
import TurnReveal from './TurnReveal';
import { Player } from '../models/Player';
import { hex2RGB } from '../common/Utils';
import _ from 'lodash-es';

const ws = get();

export default function Painter() {
    const [drawing, setDrawing] = useState(false);
    const [mouseCoors, setMouseCoors] = useState({ x: 0, y: 0 });
    const [brush, setBrush] = useState({ tool: Tools.Brush, color: 'black', prevColor: 'black', width: BrushSizes[0] });
    const [instructions, setInstructions] = useState<any>([]);

    const gameContext = useContext(GameContext);

    const player: Player = gameContext.gameState.players.find((player: any) => player.isYou);

    const canvasRef = useRef<HTMLCanvasElement>(null);
    const canvasContainerRef = useRef<HTMLDivElement>(null);
    const canvasContextRef = useRef<CanvasRenderingContext2D | null>(null);

    const cursorRef = useRef<HTMLDivElement>(null);

    const instructionsRef = useRef<[]>();

    const fillWorkerRef = useRef<Worker>();

    const debouncedRedraw = _.debounce(() => {
        clear();
        instructionsRef.current!.forEach((instruction: any) => {
            switch (instruction.type) {
                case MessageType.Draw: {
                    const data = instruction.data;
                    draw(data);
                    break;
                }
                case MessageType.Fill: {
                    const data = instruction.data;
                    floodFill(data);
                    break;
                }
            }
        });
    }, 200);

    const fitCanvasToContainer = () => {
        const canvas = canvasRef.current!;
        const canvasContainerWidth = canvasContainerRef.current!.getBoundingClientRect().width;
        const bordersWidth = canvasContainerRef.current!.offsetWidth - canvasContainerRef.current!.clientWidth;
        canvas.width = Math.floor(canvasContainerWidth) - bordersWidth;
        canvas.height = canvas.width * 0.625;
    }

    console.log('painter render');

    useEffect(() => {
        instructionsRef.current = instructions;
    }, [instructions]);

    useEffect(() => {
        setInstructions([]);
    }, [gameContext.gameState.word]);

    useEffect(() => {
        console.log('painter useEffect');

        fitCanvasToContainer();

        fillWorkerRef.current = new Worker(new URL('../workers/FloodFill.ts', import.meta.url));
        fillWorkerRef.current.addEventListener('message', (event) => {
            const canvas = canvasRef.current!;
            const ctx = canvasContextRef.current!;
            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            imageData.data.set(event.data);
            ctx.putImageData(imageData, 0, 0);
        });

        if (canvasRef.current) {
            console.log('mount clear');
            canvasContextRef.current = canvasRef.current!.getContext('2d');
            clear();
        }

        if (player.isDrawing) {
            cursorRef.current!.style.width = `${brush.width}px`;
            cursorRef.current!.style.height = `${brush.width}px`;
        }

        window.addEventListener('resize', (event) => {
            fitCanvasToContainer();
            debouncedRedraw();
        });

        ws!.addEventListener('message', (event) => {
            const msg: Message = JSON.parse(event.data);

            switch (msg.type) {
                case MessageType.Draw: {
                    const data = JSON.parse(msg.data!);
                    draw(data);
                    setInstructions([
                        ...instructionsRef.current!,
                        {
                            type: MessageType.Draw,
                            data: data
                        }
                    ]);
                    break;
                }
                case MessageType.Fill: {
                    const data = JSON.parse(msg.data!);
                    floodFillWithWorker(data);
                    setInstructions([
                        ...instructionsRef.current!,
                        {
                            type: MessageType.Fill,
                            data: data
                        }
                    ]);
                    break;
                }
                case MessageType.ClearCanvas: {
                    clear();
                    setInstructions([]);
                    break;
                }
            }
        });
        return () => {
            console.log('painter useEffect clean up');
            fillWorkerRef.current?.terminate();
        }
    }, []);

    useEffect(() => {
        canvasContextRef.current!.fillStyle = 'white';
        canvasContextRef.current!.fillRect(0, 0, canvasRef.current!.width, canvasRef.current!.height);
    }, [gameContext.gameState.word])

    const mouseDownHandler: MouseEventHandler = (e: React.MouseEvent<HTMLCanvasElement, MouseEvent>) => {
        if (player.isDrawing && e.button === 0) {
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

        const moveToX = (mouseCoors.x / canvasRef.current!.width);
        const moveToY = (mouseCoors.y / canvasRef.current!.height);
        const lineToX = (e.nativeEvent.offsetX / canvasRef.current!.width);
        const lineToY = (e.nativeEvent.offsetY / canvasRef.current!.height);

        const data = {
            strokeStyle: brush.color,
            lineWidth: brush.width,
            moveToX: moveToX,
            moveToY: moveToY,
            lineToX: lineToX,
            lineToY: lineToY,
        }

        draw(data);

        ws!.send(JSON.stringify({
            type: MessageType.Draw,
            data: JSON.stringify(data)
        }));

        setInstructions([
            ...instructions,
            {
                type: MessageType.Draw,
                data: data
            }
        ]);

        setMouseCoors({
            x: e.nativeEvent.offsetX,
            y: e.nativeEvent.offsetY
        });
    }

    const stopDrawing = () => {
        setDrawing(false);
        setMouseCoors({
            x: 0,
            y: 0
        });
    }

    const clearCanvas = () => {
        clear();
        ws!.send(JSON.stringify({
            type: MessageType.ClearCanvas
        }));
        setInstructions([]);
    }

    const clear = () => {
        canvasContextRef.current!.fillStyle = 'white';
        canvasContextRef.current!.fillRect(0, 0, canvasRef.current!.width, canvasRef.current!.height);
    }

    const changeBrushColor: MouseEventHandler = (e: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
        const color = e.currentTarget.getAttribute('color')!;
        setBrush({
            ...brush,
            tool: brush.tool === Tools.Eraser ? Tools.Brush : brush.tool,
            prevColor: brush.color,
            color: color
        });
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
        if (player.isDrawing && cursorRef.current!.style.visibility !== 'visible') {
            cursorRef.current!.style.visibility = 'visible';
        }
    }

    const hideCursor = () => {
        if (player.isDrawing && cursorRef.current!.style.visibility !== 'hidden') {
            cursorRef.current!.style.visibility = 'hidden';
        }
    }

    const mouseMoveHandler: MouseEventHandler = (e: React.MouseEvent<HTMLCanvasElement, MouseEvent>) => {
        if (drawing) {
            const moveToX = (mouseCoors.x / canvasRef.current!.width);
            const moveToY = (mouseCoors.y / canvasRef.current!.height);
            const lineToX = (e.nativeEvent.offsetX / canvasRef.current!.width);
            const lineToY = (e.nativeEvent.offsetY / canvasRef.current!.height);

            const data = {
                strokeStyle: brush.color,
                lineWidth: brush.width,
                moveToX: moveToX,
                moveToY: moveToY,
                lineToX: lineToX,
                lineToY: lineToY,
            }

            draw(data);

            ws!.send(JSON.stringify({
                type: MessageType.Draw,
                data: JSON.stringify(data)
            }));

            setInstructions([
                ...instructions,
                {
                    type: MessageType.Draw,
                    data: data
                }
            ]);
        }

        setMouseCoors({
            x: e.nativeEvent.offsetX,
            y: e.nativeEvent.offsetY
        });
    }

    const mouseOutHandler: MouseEventHandler = (e: React.MouseEvent<HTMLCanvasElement, MouseEvent>) => {
        hideCursor();
        stopDrawing();
    }

    const trackMouse: MouseEventHandler = (e: React.MouseEvent) => {
        if (player.isDrawing) {
            const rect = canvasRef.current!.getBoundingClientRect();
            const borderWidth = (canvasContainerRef.current!.offsetWidth - canvasContainerRef.current!.clientWidth) / 2;
            cursorRef.current!.style.left = `${e.clientX - rect.left + borderWidth - brush.width / 2}px`;
            cursorRef.current!.style.top = `${e.clientY - rect.top + borderWidth - brush.width / 2}px`;
        }
    }

    const draw = (data: { strokeStyle: string, lineWidth: number, moveToX: number, moveToY: number, lineToX: number, lineToY: number }) => {
        const { strokeStyle, lineWidth, moveToX, moveToY, lineToX, lineToY } = data;
        const ctx = canvasContextRef.current;
        ctx!.strokeStyle = strokeStyle;
        ctx!.lineWidth = lineWidth;
        ctx!.lineCap = 'round';
        ctx!.lineJoin = 'round';
        ctx!.imageSmoothingEnabled = false;
        ctx!.beginPath();
        ctx!.moveTo(moveToX * canvasRef.current!.width, moveToY * canvasRef.current!.height);
        ctx!.lineTo(lineToX * canvasRef.current!.width, lineToY * canvasRef.current!.height);
        ctx!.closePath();
        ctx!.stroke();
    }

    const startFilling = (e: React.MouseEvent<HTMLCanvasElement, MouseEvent>) => {

        const data = {
            startingX: (e.nativeEvent.offsetX / canvasRef.current!.width),
            startingY: (e.nativeEvent.offsetY / canvasRef.current!.height),
            color: brush.color
        }

        floodFillWithWorker(data);

        ws!.send(JSON.stringify({
            type: MessageType.Fill,
            data: JSON.stringify(data)
        }));

        setInstructions([
            ...instructions,
            {
                type: MessageType.Fill,
                data: data
            }
        ]);
    }

    // runs on UI thread
    const floodFill = (data: { startingX: number, startingY: number, color: string }) => {
        const { startingX, startingY, color } = data;

        const ctx = canvasContextRef.current!;
        const canvas = canvasRef.current!;

        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const targetColor = ctx.getImageData(startingX * canvasRef.current!.width, startingY * canvasRef.current!.height, 1, 1).data;

        const seen = new Uint32Array(imageData.data.length);
        const data8 = new Uint8ClampedArray(imageData.data.buffer);
        const data32 = new Uint32Array(imageData.data.buffer);
        const targetColor32 = new Uint32Array(targetColor.buffer)[0];
        const executionQueue = [Math.floor(startingX * canvasRef.current!.width), Math.floor(startingY * canvasRef.current!.height)];

        ctx.strokeStyle = color;
        const fillColor = hex2RGB(ctx.strokeStyle);

        while (executionQueue.length !== 0) {
            const x = executionQueue.shift()!;
            const y = executionQueue.shift()!;
            const currentPixel = Math.floor(x + y * imageData.width);
            if (x <= imageData.width && x >= 0 && y <= imageData.height && y >= 0 && !seen[currentPixel]) {
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

        imageData.data.set(data8);
        ctx.putImageData(imageData, 0, 0);
    }

    // runs on Web Worker thread
    const floodFillWithWorker = (data: { startingX: number, startingY: number, color: string }) => {

        const { startingX, startingY, color } = data;

        const ctx = canvasContextRef.current!;
        const canvas = canvasRef.current!;

        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const targetColor = ctx.getImageData(startingX * canvasRef.current!.width, startingY * canvasRef.current!.height, 1, 1).data;

        ctx.strokeStyle = color;
        const fillColor = hex2RGB(ctx.strokeStyle);

        fillWorkerRef.current!.postMessage({
            startingX: startingX * canvasRef.current!.width,
            startingY: startingY * canvasRef.current!.height,
            buf: imageData.data.buffer,
            width: imageData.width,
            height: imageData.height,
            targetColor,
            fillColor
        }, [imageData.data.buffer]);

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

    const colorBtns = Colors.map((color, index) => (
        <button
            key={color}
            onClick={changeBrushColor}
            className={`h-10 w-10`}
            color={color}
            style={{ background: color }}
        />
    ));

    const brushSizeBtns = BrushSizes.map((size, index) => (
        <button
            key={size}
            className={`${size === brush.width ? 'bg-white' : 'bg-gray-200'} flex justify-center items-center h-10 w-10 hover:bg-white  ${index !== BrushSizes.length - 1 ? 'mr-2' : ''}`}
            onClick={changeBrushWidth}
            value={size}
        >
            <div
                className={`rounded-full ${brush.color === 'white' ? 'border border-black' : ''}`}
                style={{
                    background: brush.color,
                    width: size,
                    height: size
                }}>
            </div>
        </button>
    ));

    return (
        <div className='relative flex flex-col items-center'>
            <div
                className='relative flex-none border-gray-300 border-2 border-opacity-25 shadow-lg w-full'
                onMouseMove={trackMouse}
                ref={canvasContainerRef}
            >
                {gameContext.gameState.roundState === RoundState.ChooseWord &&
                    <WordChooser />
                }
                {gameContext.gameState.roundState === RoundState.TurnReveal &&
                    <TurnReveal />
                }
                {gameContext.gameState.roundState === RoundState.Reveal &&
                    <RoundReveal />
                }
                {gameContext.gameState.lobbyState === LobbyState.Reveal &&
                    <LobbyReveal />
                }
                <canvas
                    className={`block ${player.isDrawing ? 'cursor-none' : 'cursor-not-allowed'}`}
                    ref={canvasRef}
                    onMouseDown={mouseDownHandler}
                    onMouseUp={stopDrawing}
                    onMouseLeave={stopDrawing}
                    onMouseOver={showCursor}
                    onMouseMove={mouseMoveHandler}
                    onMouseOut={mouseOutHandler}
                >
                    You need a browser that supports Canvas to see this
                </canvas>
            </div>

            {player.isDrawing &&
                <div className={`bg-white absolute flex items-center justify-center pointer-events-none rounded-full border-black border invisible`} ref={cursorRef}>
                    <div
                        className='rounded-full border border-white'
                        style={{
                            width: brush.width - 2,
                            height: brush.width - 2,
                            background: brush.color
                        }}
                    />
                </div>
            }

            {player.isDrawing &&
                <div
                    className='absolute mt-2 top-full grid gap-2'
                    style={{
                        gridTemplateColumns: `max-content max-content max-content`
                    }}
                >
                    <div
                        className={`grid border-gray-300 border-2 border-opacity-25 p-1 shadow-lg`}
                        style={{
                            gridTemplateColumns: `max-content`
                        }}
                    >
                        <Tooltip text='Choose color'>
                            {colorBtns}
                        </Tooltip>
                    </div>

                    <div
                        className='grid gap-2 border-gray-300 border-2 border-opacity-25 p-1 shadow-lg'
                        style={{
                            gridTemplateColumns: `max-content max-content max-content max-content`
                        }}
                    >
                        <Tooltip text='Brush'>
                            <button
                                className={`${brush.tool === Tools.Brush ? 'bg-white' : 'bg-gray-200'} flex justify-center items-center hover:bg-white h-10 w-10`}
                                onClick={() => selectTool(Tools.Brush)}
                            >
                                <RiBrushFill />
                            </button>
                        </Tooltip>
                        <Tooltip text='Fill'>
                            <button
                                className={`${brush.tool === Tools.Fill ? 'bg-white' : 'bg-gray-200'} flex justify-center items-center hover:bg-white h-10 w-10`}
                                onClick={() => selectTool(Tools.Fill)}
                            >
                                <GrPaint />
                            </button>
                        </Tooltip>
                        <Tooltip text='Eraser'>
                            <button
                                className={`${brush.tool === Tools.Eraser ? 'bg-white' : 'bg-gray-200'} flex justify-center items-center hover:bg-white h-10 w-10`}
                                onClick={() => selectTool(Tools.Eraser)}
                            >
                                <FaEraser />
                            </button>
                        </Tooltip>
                        <Tooltip text='Clear'>
                            <button
                                className='bg-gray-200 hover:bg-white flex justify-center items-center h-10 w-10'
                                onClick={clearCanvas}
                            >
                                <FaTrashAlt />
                            </button>
                        </Tooltip>
                    </div>

                    <div className={`grid gap-2 border-gray-300 border-2 border-opacity-25 p-1 shadow-lg`}>
                        <Tooltip text='Choose brush width'>
                            {brushSizeBtns}
                        </Tooltip>
                    </div>
                </div>
            }
        </div>
    )
}
