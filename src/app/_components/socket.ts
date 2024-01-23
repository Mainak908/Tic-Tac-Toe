import { io } from "socket.io-client";

const URL = "https://bb-87dj.onrender.com";

export const socket = io(URL, {
  extraHeaders: {
    "Access-Control-Allow-Origin": "*",
  },
  autoConnect: false,
  withCredentials: true,
});
