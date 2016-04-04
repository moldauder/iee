var webpack = require("webpack")

module.exports = {
    entry: {
        fp: "./public/fp.js"
    },
    output: {
        path: __dirname,
        filename: "template/default/assets/[name].js"
    },
    module: {
        loaders: [
            {
                test: /\.css$/,
                loader: "style!css"
            },
            {
                test: /\.png$/,
                loader: "url-loader?mimetype=image/png"
            }
        ]
    },
    plugins: [
        new webpack.optimize.UglifyJsPlugin({
            compress: {
                warnings: false
            }
        })
    ]
}
