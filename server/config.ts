import dotenv from 'dotenv';

dotenv.config();

const ENV = process.env;

export default {
  PORT: parseInt(ENV.PORT || '8080', 10)
};
