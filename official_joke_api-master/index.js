const express = require('express');
const LimitingMiddleware = require('limiting-middleware');
const { types, randomSelect, jokeByType, jokeById, count } = require('./handler');

const app = express();

app.use(new LimitingMiddleware().limitByIp());

app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  next();
});

app.get('/', (req, res) => {
  res.send(`<!doctype html>
<html>
<head><meta charset="utf-8"><title>Jokes API</title></head>
<body>
  <h1>Tervetuloa vitsi-API:iin</h1>
  <p>Kokeile seuraavia endpointteja (avautuvat tuotantopalvelussa):</p>
  <ul>
    <li><a href="https://jokes-api-ls4z.onrender.com/jokes/random">/jokes/random</a></li>
    <li><a href="https://jokes-api-ls4z.onrender.com/jokes/ten">/jokes/ten</a></li>
    <li><a href="https://jokes-api-ls4z.onrender.com/jokes/count">/jokes/count</a></li>
    <li><a href="https://jokes-api-ls4z.onrender.com/jokes/1">/jokes/1</a> (esim. id)</li>
    <li><a href="https://jokes-api-ls4z.onrender.com/ping">/ping</a></li>
  </ul>
</body>
</html>`);
});

app.get('/ping', (req, res) => {
  res.send('pong');
});

app.get('/jokes/random', (req, res) => {
  res.json(randomSelect(1)[0]);
});

app.get("/jokes/random/:num", (req, res) => {
  let num;
  try {
    num = parseInt(req.params.num);
    if (!num) {
      res.send("The passed path is not a number.");
    } else {
      if (num > count) {
        res.send(`The passed path exceeds the number of jokes (${count}).`);
      } else {
        res.json(randomSelect(num));
      }
    }
  } catch (e) {
    return next(e);
  } 
});

app.get('/jokes/ten', (req, res) => {
  res.json(randomSelect(10));
});

app.get('/jokes/:type/random', (req, res) => {
  res.json(jokeByType(req.params.type, 1));
});

app.get('/jokes/:type/ten', (req, res) => {
  res.json(jokeByType(req.params.type, 10));
});

// Siirretään /jokes/count ennen parametrireittejä
app.get('/jokes/count', (req, res) => {
  res.json({ count });
});

// rajoitetaan id-reitti hyväksymään vain numeeriset id:t
// only numeric ids allowed
app.get('/jokes/:id(\\d+)', (req, res, next) => {
  try {
    const { id } = req.params;
    const joke = jokeById(+id);
    if (!joke) return next({ statusCode: 404, message: 'joke not found' });
    return res.json(joke);
  } catch (e) {
    return next(e);
  }
});

app.get('/types', (req, res, next) => {
  res.json(types);
});

app.use((err, req, res, next) => {
  const statusCode = err.statusCode || 500;

  res.status(statusCode).json({
    type: 'error', message: err.message
  });
});

const PORT = process.env.PORT || 3005;
app.listen(PORT, () => console.log(`listening on ${PORT}`));

