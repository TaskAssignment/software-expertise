'use strict';

module.exports = {
  db: 'mongodb://' + (process.env.DB_PORT_27017_TCP_ADDR || 'localhost') + '/mean-prod',
  /**
   * Database options that will be passed directly to mongoose.connect
   * Below are some examples.
   * See http://mongodb.github.io/node-mongodb-native/driver-articles/mongoclient.html#mongoclient-connect-options
   * and http://mongoosejs.com/docs/connections.html for more information
   */
  dbOptions: {
    /*
    server: {
        socketOptions: {
            keepAlive: 1
        },
        poolSize: 5
    },
    replset: {
      rs_name: 'myReplicaSet',
      poolSize: 5
    },
    db: {
      w: 1,
      numberOfRetries: 2
    }
    */
  },
  hostname: 'http://localhost:3000',
  app: {
    name: 'Software Expertise'
  },
  logging: {
    format: 'combined'
  },
  secret: '9ExpA8rp8BVh98jZcW1AjtSe81vI4rH6GMZ0wsIHW1KrBQcYyvvPF6bfwIgSl8SRlxOG0toor2THsxRU'
};
