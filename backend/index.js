import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";
import { createServer } from "http";
import { Server } from "socket.io";


import authRoutes from "./routes/authRoutes.js";
import documentRoutes from "./routes/docRoutes.js"

dotenv.config();

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: { origin: "*" }
});

app.use(cors());
app.use(express.json());


app.use("/api/auth", authRoutes);
app.use('/api/documents', documentRoutes);

//socket.io thing
io.on("connection", (socket) => {
  console.log("New client connected:", socket.id);

  // Join a document room
  socket.on("join-document", (docId) => {
    socket.join(docId);
    console.log(`Socket ${socket.id} joined document ${docId}`);
  });

  // Listen for document changes
  socket.on("send-changes", ({ docId, content }) => {
    socket.to(docId).emit("receive-changes", content);
  });

  socket.on("disconnect", () => {
    console.log("Client disconnected:", socket.id);
  });
});

mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB connected"));

httpServer.listen(process.env.PORT, () =>
  console.log("Server running on port", process.env.PORT)
);