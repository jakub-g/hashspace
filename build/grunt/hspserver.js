var express = require('express');
var path = require("path");

module.exports = function(grunt) {
    grunt.registerTask('hspserver', 'Start a web server to server compiled templates on the fly', function () {
        grunt.config.requires('hspserver.port');
        grunt.config.requires('hspserver.base');
        grunt.config.requires('hspserver.templateExtension');

        var port = grunt.config('hspserver.port');
        var base = grunt.config('hspserver.base');
        var ext = grunt.config('hspserver.templateExtension');

        grunt.log.writeln('Starting express web server on port ' + port + '.');

        var app = express();
        require('http').createServer(app).listen(port);

        // Views can be everywhere in the public folder
        app.set("views", base);

        // Log requests
        if (grunt.option('verbose')) {
            app.use(express.logger());
        }

        var renderer = require("../../hsp/compiler/renderer");

        // Serve compiled templates through the view engine
        app.engine(ext, renderer.renderFile);

        app.use(express.bodyParser());

        app.use(function (req, res, next) {
            // extname return a ".ext", configuration asks only for "ext"
            if (path.extname(req.url) === "." + ext) {
                // The first character is '/', remove it to have relative paths
                res.render(req.url.substring(1));
                res.set("Content-Type","application/javascript");
            } else if (req.url==="/hsp/compile") {
                var src=req.body.src;
                if (src) {
                    src=(''+src).replace(/\\u0026/gi,"&").replace(/\\u002B/gi,"+").replace(/\\u003F/gi,"?");
                    // compile src
                    var r=renderer.renderString(src);
                    if (r.serverErrors && r.serverErrors.length) {
                        res.send(500,r.serverErrors[0].description);
                    } else {
                        res.send(200,r.code);
                    }
                } else {
                    res.send(500,"[/hsp/compile] src parameter is undefined");
                }
            } else {
                next();
            }
        });


        // Serve static files from the base folder from config
        app.use(express.static(grunt.config('hspserver.base')));
    });
};
