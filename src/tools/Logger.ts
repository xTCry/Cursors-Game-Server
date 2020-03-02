import { Logger, createLogger, format, transports } from 'winston';
const { combine, timestamp, printf } = format;

const myFormat = (label: string) =>
    printf(({ message, timestamp, level }) => `• ${timestamp} [${level}][${label.split(' ').join('_')}] => ${message}`);


const _createLogger = (label: string) =>
    createLogger({
        format: combine(
            format.splat(),
            timestamp(),
            format.colorize({ all: true }),
            myFormat(label)
        ),
        transports: [new transports.Console()],
    });

const logger = _createLogger('All');

export { logger as default, Logger, _createLogger as createLogger };
