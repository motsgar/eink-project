const path = require('path');
const CopyPlugin = require('copy-webpack-plugin');

module.exports = {
    entry: './web/src/index.ts',
    module: {
        rules: [
            {
                test: /\.ts$/,
                use: 'ts-loader',
                exclude: /node_modules/,
            },
            {
                test: /\.css$/i,
                use: ['style-loader', 'css-loader'],
            },
            {
                test: /jsoneditor-icons\.svg$/,
                type: 'asset',
                generator: {
                    filename: 'img/[name][ext]',
                },
            },
        ],
    },
    resolve: {
        extensions: ['.ts', '.js'],
    },
    plugins: [
        new CopyPlugin({
            patterns: [{ from: './web/public', to: '.' }],
        }),
    ],
    output: {
        filename: 'bundle.js',
        path: path.resolve(__dirname, 'webdist'),
    },
};
