import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';

import {createServer} from 'http';

import dotenv from "dotenv";
dotenv.config();

const app = express();
const httpServer = createServer(app);

app.use(cors());
app.use(express.json());

mongoose.connect(process.env.MONGO_URI).then(() => console.log("MongoDB connected:>"))

httpServer.listen(process.env.PORT, ()=> 
    console.log("Server running ")
)