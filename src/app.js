require('dotenv').config();
const express = require('express');
const morgan = require('morgan');
const cors = require('cors');
const helmet = require('helmet');
const { NODE_ENV } = require('./config');
const winston = require('winston');

const app = express();

const morganOption = NODE_ENV === 'production' ? 'tiny' : 'common';

app.use(morgan(morganOption));
app.use(helmet());
app.use(cors());
app.use(express.json());

const cards = [
  {
    id: 1,
    title: 'Task One',
    content: 'This is card one',
  },
];
const lists = [
  {
    id: 1,
    header: 'List One',
    cardIds: [1],
  },
];

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [new winston.transports.File({ filename: 'info.log' })],
});
if (NODE_ENV !== 'production') {
  logger.add(
    new winston.transports.Console({
      format: winston.format.simple(),
    })
  );
}

app.get('/card', (req, res) => {
  res.json(cards);
});

app.get('/list', (req, res) => {
  res.json(lists);
});

app.get('/card/:id', (req, res) => {
  const { id } = req.params;
  const card = cards.find((c) => c.id == id);

  if (!card) {
    logger.error(`Card with id ${id} not found.`);
    return res.status(404).send('Card Not Found');
  }
  res.json(card);
});

app.get('/list/:id', (req, res) => {
  const { id } = req.params;
  const list = lists.find((li) => li.id == id);

  if (!list) {
    logger.error(`List with id ${id} not found.`);
    return res.status(404).send('List Not Found');
  }
  res.json(list);
});

app.use(function validateBearerToken(req, res, next) {
  const apiToken = process.env.API_TOKEN;
  const authToken = req.get('Authorization');

  if (!authToken || authToken.split(' ')[1] !== apiToken) {
    logger.error(`Unauthorized request to path: ${req.path}`);
    return res.status(401).json({ error: 'Unauthorized request' });
  }
  next();
});

app.use(function errorHandler(error, req, res, next) {
  let response;
  if (NODE_ENV === 'production') {
    response = { error: { message: 'server error' } };
  } else {
    console.error(error);
    response = { message: error.message, error };
  }
  res.status(500).json(response);
});
module.exports = app;
