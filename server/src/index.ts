import express from "express";
import http from "http";
import { Server, Socket } from "socket.io";
import cors from "cors";

const app = express();

app.use(
  cors({
    origin: "https://tic-tac-toe-mnem.vercel.app",
    credentials: true,
  })
);
app.use(function (req, res, next) {
  res.header("Access-Control-Allow-Credentials", "*");
  res.setHeader("Access-Control-Allow-Origin", "*");

  res.header(
    "Access-Control-Allow-Methods",
    "GET,PUT,POST,DELETE,UPDATE,OPTIONS"
  );
  res.header(
    "Access-Control-Allow-Headers",
    "X-Requested-With, X-HTTP-Method-Override, Content-Type, Accept"
  );
  next();
});

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "https://tic-tac-toe-mnem.vercel.app",
    methods: ["GET,PUT,POST,DELETE,UPDATE,OPTIONS"],
    credentials: true,
  },
});

let connectedClients = 0;
let currentPlayerIndex = 0;

interface GameData {
  squares: (string | null)[];
  isXNext: boolean;
}

let gameData: GameData = {
  squares: Array(9).fill(null),
  isXNext: true,
};

interface PlayerJoinedPayload {
  playerId: string;
}

interface PlayerDisconnectedPayload {
  playerId: string;
}

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

io.on("connection", (socket: Socket) => {
  //listen event
  if (connectedClients < 2) {
    // Allow the connection
    connectedClients++;
    console.log(
      `Client ${socket.id} connected. Total connected: ${connectedClients}`
    );

    // Place the client in a specific room (e.g., 'gameRoom')
    socket.join("gameRoom");

    // Send an acknowledgment to the client
    socket.emit("acknowledgment", {
      message: "You are connected to the game.",
    });

    // Send initial game state to the connected client
    socket.emit("initialState", gameData);
    // Broadcast to all clients in the room when a new player joins
    const playerJoinedPayload: PlayerJoinedPayload = { playerId: socket.id };
    io.to("gameRoom").emit("playerJoined", playerJoinedPayload);

    socket.on("move", (index: number) => {
      if (socket.id === getCurrentPlayerId()) {
        // Player is allowed to make a selection

        if (!gameData.squares[index] && !calculateWinner(gameData.squares)) {
          gameData.squares[index] = gameData.isXNext ? "X" : "O";
          gameData.isXNext = !gameData.isXNext;

          // Broadcast updated game state to all connected clients
          io.emit("updateState", gameData);
        }
        switchPlayerTurn();
      } else {
        // It's not the current player's turn, send a message or handle as needed
        socket.emit("notYourTurn", {
          message: "It's not your turn to make a selection.",
        });
      }
    });

    // Handle disconnection
    socket.on("disconnect", () => {
      connectedClients--;
      console.log(
        `Client ${socket.id} disconnected. Total connected: ${connectedClients}`
      );

      // Broadcast to all clients in the room when a player disconnects
      const playerDisconnectedPayload: PlayerDisconnectedPayload = {
        playerId: socket.id,
      };
      gameData.isXNext = true;
      gameData.squares.fill(null);
      io.to("gameRoom").emit("playerDisconnected", playerDisconnectedPayload);
    });
  } else {
    // Reject the connection
    socket.emit("rejected", {
      message: "Game room is full. Please try again later.",
    });
    socket.disconnect(true); // Disconnect the client
  }
});

function getCurrentPlayerId(): string {
  return connectedClients > 0
    ? Array.from(io.sockets.adapter.rooms.get("gameRoom")!)[currentPlayerIndex]
    : "";
}

function switchPlayerTurn(): void {
  currentPlayerIndex = (currentPlayerIndex + 1) % 2;
}
server.listen(3001, () => {
  console.log("Server is running on port 3001");
});
