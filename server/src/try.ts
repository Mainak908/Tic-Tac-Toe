import express from "express";
import http from "http";
import { Server, Socket } from "socket.io";
import cors from "cors";

const app = express();
app.use(cors()); // Enable CORS for all routes

const server = http.createServer(app);
const io = new Server(server);

let connectedClients = 0;
let currentPlayerIndex = 0;
let selectedBoxes: (string | null)[] = Array(9).fill(null);

io.on("connection", (socket: Socket) => {
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

    // Broadcast to all clients in the room when a new player joins
    const playerJoinedPayload = { playerId: socket.id };
    io.to("gameRoom").emit("playerJoined", playerJoinedPayload);

    // Handle game-related events
    socket.on("selectBox", (index: number) => {
      if (socket.id === getCurrentPlayerId()) {
        // Player is allowed to make a selection
        if (selectedBoxes[index] === null) {
          // Box is not selected, update the state and broadcast the change
          selectedBoxes[index] = socket.id;

          io.to("gameRoom").emit("updateBoxes", { selectedBoxes });

          // Switch to the next player's turn
          switchPlayerTurn();

          // Notify all clients about the current player
          io.to("gameRoom").emit("currentPlayer", {
            playerId: getCurrentPlayerId(),
          });
        } else {
          // Box is already selected, send a message or handle as needed
          socket.emit("boxAlreadySelected", {
            message: "This box is already selected.",
          });
        }
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
      const playerDisconnectedPayload = { playerId: socket.id };
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
//suppose 1jon khele galo ebr nxt turn e r 1joner index dekhe tar id bar kora holo
//means circulate hobe game...next joner chara entry hobe na
server.listen(3001, () => {
  console.log("Server is running on port 3001");
});
