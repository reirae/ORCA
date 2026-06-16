const app = require('./app');
const { system } = require('./utils/winstonLogger');

app.listen(3000, () => {
  system.info('Server running on port 3000', { context: 'server' });
});