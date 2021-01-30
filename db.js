const axios = require('axios');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const Sequelize = require('sequelize');
const { STRING, INTEGER, JSON } = Sequelize;
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
  data: JSON,
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
  try {
    let response = await axios.post(
      'https://github.com/login/oauth/access_token',
      {
        code: code,
        client_id: process.env.GITHUB_CLIENT_ID,
        client_secret: process.env.GITHUB_CLIENT_SECRET,
      },
      {
        headers: {
          accept: 'application/json',
        },
      }
    );

    if (response.data.error) {
      const error = Error(data.error);
      error.status = 401;
      throw error;
    }

    // console.log('token information', response.data);
    const access_token = response.data.access_token;
    // console.log('access_token,', access_token);

    const userinfo = await axios.get('https://api.github.com/user', {
      headers: {
        authorization: `token ${access_token}`,
      },
    });
    // console.log('user information', userinfo);

    let user = await User.findOne({
      where: {
        githubId: userinfo.data.id,
      },
    });
    if (!user) {
      user = await User.create({
        username: userinfo.data.login,
        githubId: userinfo.data.id,
        data: userinfo.data,
      });
    }
    // console.log(user);
    const signed = jwt.sign({ id: user.id }, process.env.JWT);
    // console.log(signed);
    return signed;
  } catch (ex) {
    console.log(ex);
  }
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
