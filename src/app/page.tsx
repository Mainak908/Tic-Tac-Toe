"use client";
import { useEffect, useState } from "react";
import Square from "./_components/square";
import { socket } from "./_components/socket";

console.log("rendre");

const TicTacToe = (): JSX.Element => {
  interface GameData {
    squares: (string | null)[];
    isXNext: boolean;
  }

  const [gameData, setGameData] = useState<GameData>({
    squares: Array(9).fill(null),
    isXNext: true,
  });

  useEffect(() => {
    socket.connect();
    // Listen for initial game state
    socket.on("initialState", (initialState: GameData) => {
      setGameData(initialState);
    });

    // Listen for updated game state
    socket.on("updateState", (updatedState: GameData) => {
      setGameData(updatedState);
    });

    return () => {
      // Cleanup event listeners on component unmount
      socket.off("initialState");
      socket.off("updateState");
      socket.disconnect();
    };
  }, []);

  const handleClick = (index: number): void => {
    if (!gameData.squares[index] && !calculateWinner(gameData.squares)) {
      // Send player move to the server
      socket.emit("move", index);
    }
  };

  const renderSquare = (index: number): JSX.Element => {
    return (
      <Square
        value={gameData.squares[index]}
        onClick={() => handleClick(index)}
      />
    );
  };
  const winnercheck = () => {
    const winner = calculateWinner(gameData.squares);
    if (winner) return `winner is ${winner}`;
    return `Next player: ${gameData.isXNext ? "X" : "O"}`;
  };
  return (
    <div className=" flex justify-center items-center h-screen flex-col">
      <div className="font-bold text-2xl mb-4">{winnercheck()}</div>
      <div className="grid grid-cols-3 gap-4">
        {Array(9)
          .fill(null)
          .map((_, index) => (
            <div key={index}>{renderSquare(index)}</div>
          ))}
      </div>
    </div>
  );
};

const calculateWinner = (squares: (string | null)[]): string | null => {
  const lines: number[][] = [
    [0, 1, 2],
    [3, 4, 5],
    [6, 7, 8],
    [0, 3, 6],
    [1, 4, 7],
    [2, 5, 8],
    [0, 4, 8],
    [2, 4, 6],
  ];

  for (let i = 0; i < lines.length; i++) {
    const [a, b, c] = lines[i];
    if (squares[a] && squares[a] === squares[b] && squares[a] === squares[c]) {
      return squares[a] as string;
    }
  }

  return null;
};

export default TicTacToe;
