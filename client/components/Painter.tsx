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

export default function Paint(props: { height: number, width: number }) {
    const [drawing, setDrawing] = useState(false);
    const [mouseCoors, setMouseCoors] = useState({ x: 0, y: 0 });
    const [brush, setBrush] = useState({ tool: Tools.Brush, color: 'black', prevColor: 'black', width: BrushSizes[0] });

    const gameContext = useContext(GameContext);

    const player: Player = gameContext.gameState.players.find((player: any) => player.isYou);

    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const canvasContextRef = useRef<CanvasRenderingContext2D | null>(null);
    const cursorRef = useRef<HTMLDivElement>(null);
    console.log('painter render');

    useEffect(() => {
        console.log('painter useEffect');

        if (canvasRef) {
            canvasContextRef.current = canvasRef.current!.getContext('2d');
            canvasContextRef.current!.fillStyle = 'white';
            canvasContextRef.current!.fillRect(0, 0, canvasRef.current!.width, canvasRef.current!.height);
        }

        if (player.isDrawing) {
            cursorRef.current!.style.width = `${brush.width}px`;
            cursorRef.current!.style.height = `${brush.width}px`;
        }

        ws!.addEventListener('message', (event) => {
            const msg: Message = JSON.parse(event.data);

            switch (msg.type) {
                case MessageType.Draw: {
                    const ctx = canvasContextRef.current;
                    const data = JSON.parse(msg.data!);
                    ctx!.strokeStyle = data.strokeStyle;
                    ctx!.lineWidth = data.lineWidth;
                    ctx!.lineCap = 'round';
                    ctx!.lineJoin = 'round';
                    ctx!.imageSmoothingEnabled = false;
                    ctx!.beginPath();
                    ctx!.moveTo(data.moveToX, data.moveToY);
                    ctx!.lineTo(data.lineToX, data.lineToY);
                    ctx!.closePath();
                    ctx!.stroke();
                    break;
                }
                case MessageType.Fill: {
                    const data = JSON.parse(msg.data!);
                    floodFill(data.startingX, data.startingY, data.color);
                    break;
                }
                case MessageType.ClearCanvas: {
                    canvasContextRef.current!.fillStyle = 'white';
                    canvasContextRef.current!.fillRect(0, 0, canvasRef.current!.width, canvasRef.current!.height);
                    break;
                }
            }
        });
        return () => console.log('painter useEffect clean up');
    }, []);

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
    }

    const stopDrawing: MouseEventHandler = (e: React.MouseEvent<HTMLElement, MouseEvent>) => {
        setDrawing(false);
        setMouseCoors({
            x: 0,
            y: 0
        });
    }

    const clearCanvas: MouseEventHandler = (e: React.MouseEvent<HTMLElement, MouseEvent>) => {
        canvasContextRef.current!.fillStyle = 'white';
        canvasContextRef.current!.fillRect(0, 0, canvasRef.current!.width, canvasRef.current!.height);
        ws!.send(JSON.stringify({
            type: MessageType.ClearCanvas
        }));
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
        if (player.isDrawing) {
            cursorRef.current!.style.visibility = 'visible';
        }
    }

    const hideCursor = () => {
        if (player.isDrawing) {
            cursorRef.current!.style.visibility = 'hidden';
        }
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

            ws!.send(JSON.stringify({
                type: MessageType.Draw,
                data: JSON.stringify({
                    strokeStyle: brush.color,
                    lineWidth: brush.width,
                    moveToX: mouseCoors.x,
                    moveToY: mouseCoors.y,
                    lineToX: e.nativeEvent.offsetX,
                    lineToY: e.nativeEvent.offsetY,
                })
            }));

            setMouseCoors({
                x: e.nativeEvent.offsetX,
                y: e.nativeEvent.offsetY
            });
        }

        if (player.isDrawing) {
            cursorRef.current!.style.left = `${e.clientX + window.scrollX - brush.width / 2}px`;
            cursorRef.current!.style.top = `${e.clientY + window.scrollY - brush.width / 2}px`;
        }
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
    }

    function hex2RGB(hex: string) {
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
        <div className='flex flex-col items-center'>
            <div
                className='relative flex-none border-gray-300 border-2 border-opacity-25 mb-2 shadow-lg'
                onMouseUp={stopDrawing}
                onMouseLeave={stopDrawing}
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

            {player.isDrawing &&
                <div className={`bg-white absolute flex items-center justify-center pointer-events-none rounded-full border-black border`} ref={cursorRef}>
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
                    className='grid gap-2'
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
