var path = require('path');

module.exports = {
  entry: './src/index.js',
  output: {
    path: path.resolve(__dirname, 'dist'),
    libraryTarget: 'umd',
    library: 'go-juggle',
    filename: 'go-juggle.js'
  },
  externals: {
    'gojs': 'gojs'
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        include: /src/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: ['@babel/preset-env'],
            plugins: ['@babel/plugin-proposal-class-properties']
          }
        },
      },
    ]
  }
};