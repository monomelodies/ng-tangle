
module.exports = function (grunt) {

    var pkg = grunt.file.readJSON('package.json');
    grunt.initConfig({pkg});

    grunt.loadNpmTasks('grunt-browserify');
    grunt.config('browserify', {
        monad: {
            src: 'src/index.js',
            dest: 'dist/ng-tangle.js',
            options: {
                transform: ['babelify'],
                standalone: 'ngTangle',
                watch: true
            }
        }
    });

    grunt.loadNpmTasks('grunt-shell');
    grunt.config('shell', {
        lib: { command: 'npm run build' },
        clean: { command: 'rm -rf dist/* && rm -rf lib/*' }
    });

    grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.config('uglify', {
        js: {
            src: 'dist/ng-tangle.js',
            dest: 'dist/ng-tangle.min.js'
        }
    });

    grunt.loadNpmTasks('grunt-contrib-watch');
    grunt.config('watch', {
        lib: {
            files: ['src/**/*.js'],
            tasks: ['shell:lib']
        }
    });

    grunt.registerTask('default', ['build']);
    grunt.registerTask('build', ['shell:lib', 'browserify']);
    grunt.registerTask('dev', ['build', 'watch']);
    grunt.registerTask('prod', ['shell:clean', 'build', 'uglify']);
};

