import React from 'react'
import { useEffect, useState, useRef } from 'react';
import { Chess } from 'chess.js';
import { Chessboard } from 'react-chessboard';
import { io } from 'socket.io-client';
const socket = io(import.meta.env.VITE_BACKEND_URL || "http://localhost:3000");

const App = () => {

  const chessRef = useRef(new Chess());

  const [fen, setFen] = useState(chessRef.current.fen());
  const [turn, setTurn] = useState(chessRef.current.turn());

  const [playerRole, setPlayerRole] = useState(null);

  useEffect(()=>{

    socket.on('playerRole',(role)=>{
      setPlayerRole(role)
    })

    socket.on('spectatorRole',()=>{
      setPlayerRole(null)
    })

    socket.on('boardState',(fen)=>{
      chessRef.current.load(fen)
      setFen(fen)
      setTurn(chessRef.current.turn())
    })

    socket.on('invalidmove',(move)=>{
      console.warn('Invalid move from server:', move)
    })

    return () => {
        socket.off('playerRole');
        socket.off('spectatorRole');
        socket.off('boardState');
        socket.off('invalidmove');
    }

  },[]);

  function onDrop({ sourceSquare, targetSquare }) {
    if (!targetSquare) {
        return false;
    }

    const move = {
        from: sourceSquare,
        to: targetSquare,
        promotion: 'q'
    };

    socket.emit('move', move, (response) => {
        if (!response?.ok) {
            if (response?.fen) {
                chessRef.current.load(response.fen);
                setFen(response.fen);
                setTurn(chessRef.current.turn());
            }
            console.warn('Move rejected:', move, response?.error);
            alert('Invalid Move');
        }
    });

    return true;
} 

  return (

        <div className="
            min-h-screen
            bg-zinc-900
            text-white
            flex
            flex-col
            items-center
            justify-center
            gap-6
        ">

            <h1 className="
                text-5xl
                font-bold
            ">
                Multiplayer Chess
            </h1>

            <div className="
                bg-zinc-800
                px-6
                py-3
                rounded-xl
                text-xl
            ">

                {
                    playerRole === 'w'

                    ? "You are White"

                    : playerRole === 'b'

                    ? "You are Black"

                    : "Spectator Mode"
                }

            </div>

            <div className="w-[500px]
                shadow-2xl
                rounded-xl
                overflow-hidden
            ">

                <Chessboard

                    key={fen}

                    options={{
                        position: fen,
                        onPieceDrop: onDrop,
                        allowDragging:
                            (playerRole === 'w' && turn === 'w') ||
                            (playerRole === 'b' && turn === 'b'),
                        canDragPiece: ({ piece }) =>
                            (playerRole === 'w' && turn === 'w' && piece.pieceType.startsWith('w')) ||
                            (playerRole === 'b' && turn === 'b' && piece.pieceType.startsWith('b')),
                        boardOrientation:
                            playerRole === 'b'
                            ? 'black'
                            : 'white'
                    }}
                />

            </div>

        </div>
    );
}

export default App
