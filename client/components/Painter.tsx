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

const ws = get();

export default function Painter() {
    const [drawing, setDrawing] = useState(false);
    const [mouseCoors, setMouseCoors] = useState({ x: 0, y: 0 });
    const [brush, setBrush] = useState({ tool: Tools.Brush, color: 'black', prevColor: 'black', width: BrushSizes[0] });
    const [instructions, setInstructions] = useState<any>([]);

    const gameContext = useContext(GameContext);

    const player: Player = gameContext.gameState.players.find((player: any) => player.isYou);

    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const canvasContainerRef = useRef<HTMLDivElement | null>(null);
    const canvasContextRef = useRef<CanvasRenderingContext2D | null>(null);

    const cursorRef = useRef<HTMLDivElement>(null);

    const instructionsRef = useRef<[]>();

    console.log('painter render');

    useEffect(() => {
        instructionsRef.current = instructions;
    }, [instructions])

    useEffect(() => {
        setInstructions([]);
    }, [gameContext.gameState.word])

    useEffect(() => {
        console.log('painter useEffect');

        const canvas = canvasRef.current!;
        canvas.width = canvasContainerRef.current!.clientWidth;
        canvas.height = canvas.width * 0.625;

        if (canvasRef) {
            canvasContextRef.current = canvasRef.current!.getContext('2d');
            clear();
        }

        if (player.isDrawing) {
            cursorRef.current!.style.width = `${brush.width}px`;
            cursorRef.current!.style.height = `${brush.width}px`;
        }

        window.addEventListener('resize', (event) => {
            const canvas = canvasRef.current!;

            canvas.width = canvasContainerRef.current!.clientWidth;
            canvas.height = canvas.width * 0.625;

            clear();

            instructionsRef.current!.forEach((instruction: any) => {
                switch (instruction.type) {
                    case MessageType.Draw: {
                        const data = instruction.data;
                        draw(
                            data.strokeStyle,
                            data.lineWidth,
                            data.moveToX * canvasRef.current!.width,
                            data.moveToY * canvasRef.current!.height,
                            data.lineToX * canvasRef.current!.width,
                            data.lineToY * canvasRef.current!.height
                        );
                        break;
                    }
                    case MessageType.Fill: {
                        const data = instruction.data;
                        floodFill(data.startingX, data.startingY, data.color);
                        break;
                    }
                }
            });
        });

        ws!.addEventListener('message', (event) => {
            const msg: Message = JSON.parse(event.data);

            switch (msg.type) {
                case MessageType.Draw: {
                    const data = JSON.parse(msg.data!);
                    draw(
                        data.strokeStyle,
                        data.lineWidth,
                        data.moveToX * canvasRef.current!.width,
                        data.moveToY * canvasRef.current!.height,
                        data.lineToX * canvasRef.current!.width,
                        data.lineToY * canvasRef.current!.height
                    );
                    setInstructions([
                        ...instructionsRef.current!,
                        {
                            type: MessageType.Draw,
                            data: {
                                strokeStyle: data.strokeStyle,
                                lineWidth: data.lineWidth,
                                moveToX: data.moveToX,
                                moveToY: data.moveToY,
                                lineToX: data.lineToX,
                                lineToY: data.lineToY
                            }
                        }
                    ]);
                    break;
                }
                case MessageType.Fill: {
                    const data = JSON.parse(msg.data!);
                    floodFill(data.startingX, data.startingY, data.color);
                    setInstructions([
                        ...instructionsRef.current!,
                        {
                            type: MessageType.Fill,
                            data: {
                                startingX: data.startingX,
                                startingY: data.startingY,
                                color: data.color
                            }
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
        return () => console.log('painter useEffect clean up');
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
        setMouseCoors({
            x: e.nativeEvent.offsetX,
            y: e.nativeEvent.offsetY
        });
        draw(brush.color, brush.width, mouseCoors.x, mouseCoors.y, e.nativeEvent.offsetX, e.nativeEvent.offsetY);
        ws!.send(JSON.stringify({
            type: MessageType.Draw,
            data: JSON.stringify({
                strokeStyle: brush.color,
                lineWidth: brush.width,
                moveToX: mouseCoors.x / canvasRef.current!.width,
                moveToY: mouseCoors.y / canvasRef.current!.height,
                lineToX: e.nativeEvent.offsetX / canvasRef.current!.width,
                lineToY: e.nativeEvent.offsetY / canvasRef.current!.height,
            })
        }));
        setInstructions([
            ...instructions,
            {
                type: MessageType.Draw,
                data: {
                    strokeStyle: brush.color,
                    lineWidth: brush.width,
                    moveToX: mouseCoors.x / canvasRef.current!.width,
                    moveToY: mouseCoors.y / canvasRef.current!.height,
                    lineToX: e.nativeEvent.offsetX / canvasRef.current!.width,
                    lineToY: e.nativeEvent.offsetY / canvasRef.current!.height,
                }
            }
        ]);
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
        // cursorRef.current!.style.background = `${color}`;
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
            draw(brush.color, brush.width, mouseCoors.x, mouseCoors.y, e.nativeEvent.offsetX, e.nativeEvent.offsetY);
            ws!.send(JSON.stringify({
                type: MessageType.Draw,
                data: JSON.stringify({
                    strokeStyle: brush.color,
                    lineWidth: brush.width,
                    moveToX: mouseCoors.x / canvasRef.current!.width,
                    moveToY: mouseCoors.y / canvasRef.current!.height,
                    lineToX: e.nativeEvent.offsetX / canvasRef.current!.width,
                    lineToY: e.nativeEvent.offsetY / canvasRef.current!.height,
                })
            }));
            setInstructions([
                ...instructions,
                {
                    type: MessageType.Draw,
                    data: {
                        strokeStyle: brush.color,
                        lineWidth: brush.width,
                        moveToX: mouseCoors.x / canvasRef.current!.width,
                        moveToY: mouseCoors.y / canvasRef.current!.height,
                        lineToX: e.nativeEvent.offsetX / canvasRef.current!.width,
                        lineToY: e.nativeEvent.offsetY / canvasRef.current!.height,
                    }
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

    const draw = (strokeStyle: string, lineWidth: number, moveToX: number, moveToY: number, lineToX: number, lineToY: number) => {
        const ctx = canvasContextRef.current;
        ctx!.strokeStyle = strokeStyle;
        ctx!.lineWidth = lineWidth;
        ctx!.lineCap = 'round';
        ctx!.lineJoin = 'round';
        ctx!.imageSmoothingEnabled = false;
        ctx!.beginPath();
        ctx!.moveTo(moveToX, moveToY);
        ctx!.lineTo(lineToX, lineToY);
        ctx!.closePath();
        ctx!.stroke();
    }

    const startFilling = (e: React.MouseEvent<HTMLCanvasElement, MouseEvent>) => {

        const startingX = e.nativeEvent.offsetX;
        const startingY = e.nativeEvent.offsetY;

        floodFill(startingX, startingY, brush.color);

        ws!.send(JSON.stringify({
            type: MessageType.Fill,
            data: JSON.stringify({
                startingX: startingX,
                startingY: startingY,
                color: brush.color,
            })
        }));

        setInstructions([
            ...instructions,
            {
                type: MessageType.Fill,
                data: {
                    startingX: startingX,
                    startingY: startingY,
                    color: brush.color
                }
            }
        ]);
    }

    const hex2RGB = (hex: string) => {
        let m = hex.match(/^#?([\da-f]{2})([\da-f]{2})([\da-f]{2})$/i)!;
        return {
            r: parseInt(m[1], 16),
            g: parseInt(m[2], 16),
            b: parseInt(m[3], 16)
        };
    }

    const floodFill = (startingX: number, startingY: number, color: string) => {
        const ctx = canvasContextRef.current!;
        const canvas = canvasRef.current!;

        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const targetColor = ctx.getImageData(startingX, startingY, 1, 1).data;

        const executionQueue = [startingX, startingY];
        const seen = new Uint32Array(imageData.data.length);
        const buf = imageData.data.buffer;
        const data8 = new Uint8ClampedArray(buf);
        const data32 = new Uint32Array(buf);
        const targetColor32 = new Uint32Array(targetColor.buffer)[0];

        ctx.imageSmoothingEnabled = false;

        ctx.strokeStyle = color;

        const fillColor = hex2RGB(ctx.strokeStyle);

        while (executionQueue.length !== 0) {
            const x = executionQueue.shift()!;
            const y = executionQueue.shift()!;
            if (x <= canvas.width && x >= 0 && y <= canvas.height && y >= 0 && !seen[x + y * canvas.width]) {
                if (data32[x + y * canvas.width] === targetColor32) {
                    data32[x + y * canvas.width] =
                        255 << 24 |
                        fillColor.b << 16 |
                        fillColor.g << 8 |
                        fillColor.r
                        ;
                    seen[x + y * canvas.width] = 1;
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
            className={`${size === brush.width ? 'bg-white' : 'bg-gray-100'} flex justify-center items-center h-10 w-10 hover:bg-white  ${index !== BrushSizes.length - 1 ? 'mr-2' : ''}`}
            onClick={changeBrushWidth}
            value={size}
        >
            <div
                className='rounded-full'
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
                                className={`${brush.tool === Tools.Brush ? 'bg-white' : 'bg-gray-100'} flex justify-center items-center hover:bg-white h-10 w-10`}
                                onClick={() => selectTool(Tools.Brush)}
                            >
                                <RiBrushFill />
                            </button>
                        </Tooltip>
                        <Tooltip text='Fill'>
                            <button
                                className={`${brush.tool === Tools.Fill ? 'bg-white' : 'bg-gray-100'} flex justify-center items-center hover:bg-white h-10 w-10`}
                                onClick={() => selectTool(Tools.Fill)}
                            >
                                <GrPaint />
                            </button>
                        </Tooltip>
                        <Tooltip text='Eraser'>
                            <button
                                className={`${brush.tool === Tools.Eraser ? 'bg-white' : 'bg-gray-100'} flex justify-center items-center hover:bg-white h-10 w-10`}
                                onClick={() => selectTool(Tools.Eraser)}
                            >
                                <FaEraser />
                            </button>
                        </Tooltip>
                        <Tooltip text='Clear'>
                            <button
                                className='bg-gray-100 hover:bg-white flex justify-center items-center h-10 w-10'
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
