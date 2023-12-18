import dotenv from 'dotenv';

dotenv.config();

const ENV = process.env;

export default {
  PORT: parseInt(ENV.PORT || '8080', 10),
  DIFFICULTY: parseInt(ENV.DIFFICULTY || '10000', 10), // Generate 5 digit random numbers
};
