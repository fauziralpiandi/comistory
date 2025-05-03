export const logger = {
  info: (message: string): void => {
    console.log(`[INFO] ${message}`);
  },

  warn: (message: string): void => {
    console.warn(`[WARN] ${message}`);
  },

  error: (message: string): void => {
    console.error(`[ERROR] ${message}`);
  },

  debug: (message: string): void => {
    if (process.env['COMISTORY_VERBOSE'] === 'true') {
      console.debug(`[DEBUG] ${message}`);
    }
  },
};
