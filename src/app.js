import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';

const app = express();

app.set('view engine', 'ejs');
app.set('views', './views');

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(express.static('views'));

//Import routers
import indexRouter from './routes/views.router.js';
app.use('/', indexRouter);

import userRouter from './routes/user.router.js';
app.use('/api/users', userRouter);

export { app };