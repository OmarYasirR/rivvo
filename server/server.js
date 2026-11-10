require('./config/environment'); 

const http = require('http');
const app = require('./app');
const connectDB = require('./config/database');
const initSocket = require('./socket/socketServer');
const { port } = require('./config/environment');

connectDB();

const server = http.createServer(app);
const io = initSocket(server);

app.set('io', io);

server.listen(port, () => {
  console.log(`Rivvo server running on port ${port}`);
});
