const axios = require('axios');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const Sequelize = require('sequelize');
const { STRING, INTEGER } = Sequelize;
const config = {
  logging: false,
};

if (process.env.LOGGING) {
  delete config.logging;
}
const conn = new Sequelize(
  process.env.DATABASE_URL || 'postgres://localhost/acme_db',
  config
);

const User = conn.define('user', {
  username: STRING,
  githubId: INTEGER,
});

User.byToken = async (token) => {
  try {
    const { id } = await jwt.verify(token, process.env.JWT);
    const user = await User.findByPk(id);
    if (user) {
      return user;
    }
    throw 'noooo';
  } catch (ex) {
    const error = Error('bad credentials');
    error.status = 401;
    throw error;
  }
};

// documentation - https://docs.github.com/en/developers/apps/authorizing-oauth-apps

// useful urls
const GITHUB_CODE_FOR_TOKEN_URL = 'https://github.com/login/oauth/access_token';
const GITHUB_ACCESS_TOKEN_FOR_USER_URL = 'https://api.github.com/user';

//the authenticate methods is passed a code which has been sent by github
//if successful it will return a token which identifies a user in this app
User.authenticate = async (code) => {
  throw 'nooooo';
};

const syncAndSeed = async () => {
  await conn.sync({ force: true });
};

module.exports = {
  syncAndSeed,
  models: {
    User,
  },
};
