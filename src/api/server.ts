import '../env';

import logger from '../logger';
import app from './app';

app.listen(app.get('port'), (): void => {
  logger.info(`🌏 Express server started at http://localhost:${app.get('port')}`);
});
