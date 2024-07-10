const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const { CleanWebpackPlugin } = require('clean-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const CssMinimizerPlugin = require('css-minimizer-webpack-plugin');
const TerserPlugin = require('terser-webpack-plugin');
const ImageMinimizerPlugin = require('image-minimizer-webpack-plugin');
const { type } = require('os');

const isDev = process.env.NODE_ENV === 'development';
const isProd = !isDev;

const filename = (ext) => 
    isDev ? `[name].${ext}` : `[name].[contenthash].${ext}`;

const optimization = () => {
    const config = {
        splitChunks: {
            chunks: 'all',
        },
    };

    if (isProd) {
        config.minimizer = [
            new TerserPlugin(),
            new CssMinimizerPlugin(),
            new ImageMinimizerPlugin({
                minimizer: {
                    implementation: ImageMinimizerPlugin.imageminMinify,
                    options: {
                        plugins: [
                            ['gifsicle', { interlaced: true }],
                            ['jpegtran', { progressive: true }],
                            ['optipng', { optimizationLevel: 5 }],
                            [
                                'svgo',
                                {
                                    plugins: [
                                        {
                                            name: 'preset-default',
                                            params: {
                                                overrides: {
                                                    removeViewBox: false,
                                                },
                                            },
                                        },
                                        {
                                            name: 'addAttributesToSVGElement',
                                            params: {
                                                attributes: [{ xmlns: 'http://www.w3.org/2000/svg' }],
                                            },
                                        },
                                    ],
                                },
                            ],
                        ],
                    },
                },
            }),
        ];
    }

    return config;
};

const generateHtmlPlugins = (cities) => {
    return cities.flatMap((city) => {
        return ['en', 'ru'].map((lang) => {
            return new HtmlWebpackPlugin({
                filename: `${city}/public/${lang}/index.html`,
                template: `./${city}/public/${lang}/index.html`,
                chunks: [city],
                minify: {
                    collapseWhitespace: isProd,
                },
            });
        });
    });
};

const cities = ['moscow'];

const entry = cities.reduce((acc, city) => {
    acc[city] = `./${city}/src/main.js`;
    return acc;
}, {});

module.exports = {
    entry,
    output: {
        filename: (pathData) => {
            const city = pathData.chunk.name;
            return `${city}/src/${filename('js')}`;
        },
        path: path.resolve(__dirname, 'dist'),
        publicPath: '/',
    },
    optimization: optimization(),
    module: {
        rules: [
            {
                test: /\.html$/,
                use: 'html-loader',
            },
            {
                test: /\.css$/,
                use: [
                    isDev ? 'style-loader' : MiniCssExtractPlugin.loader,
                    'css-loader',
                ],
            },
            {
                test: /\.(png|jpg|jpeg|gif|svg|ico|webmanifest)$/,
                type: 'asset/resource',
                generator: {
                    filename: (pathData) => {
                        const city = pathData.filename.split('/')[0];
                        const ext = path.extname(pathData.filename).replace('.', '');
                        return `${city}/public/assets/[name].[contenthash].${ext}`;
                    },
                },
            },
            {
                test: /\.(woff|woff2)$/,
                type: 'asset/resource',
                generator: {
                    filename: (pathData) => {
                        const city = pathData.filename.split('/')[0];
                        const ext = path.extname(pathData.filename).replace('.', '');
                        return `${city}/public/assets/[name].[contenthash].${ext}`;
                    },
                },
            },
            {
                test: /\.js$/,
                exclude: /node_modules/,
                use: 'babel-loader',
            },
        ],
    },
    plugins: [
        new CleanWebpackPlugin(),
        new MiniCssExtractPlugin({
            filename: (pathData) => {
                const city = pathData.chunk.name;
                return `${city}/src/${filename('css')}`;
            },
        }),
        ...generateHtmlPlugins(cities),
    ],
};
