/**
 * Gulp tasks for development and production.
 *
 * Run
 *
 *      $ ./node_modules/.bin/gulp
 *
 * for development and
 *
 *      $ ./node_modules/.bin/gulp --production
 *
 * for production mode.
 */

// TODO: Remove the next line when support for Node 0.10.x is dropped.
// See https://github.com/postcss/postcss#nodejs-010-and-the-promise-api
require('es6-promise').polyfill();

var argv = require('yargs').argv,
    gulp = require('gulp'),
    concat = require('gulp-concat'),
    cssnano = require('gulp-cssnano'),
    gulpif = require('gulp-if'),
    gettext = require('gulp-angular-gettext'),
    jshint = require('gulp-jshint'),
    mainBowerFiles = require('main-bower-files'),
    path = require('path'),
    through = require('through2'),
    uglify = require('gulp-uglify'),
    vsprintf = require('sprintf-js').vsprintf;

// Directory where the results go to
var output_directory = path.join('openslides', 'static');


/**
 * Default tasks to be run before start.
 */

// Catches all JavaScript files from all bower components and concats them to
// one file js/openslides-libs.js. In production mode the file is uglified.
gulp.task('js-libs', function () {
    return gulp.src(mainBowerFiles({
            filter: /\.js$/
        }))
        .pipe(concat('openslides-libs.js'))
        .pipe(gulpif(argv.production, uglify()))
        .pipe(gulp.dest(path.join(output_directory, 'js')));
});

// Catches all CSS files from all bower components and concats them to one file
// css/openslides-libs.css. In production mode the file is uglified.
gulp.task('css-libs', function () {
    return gulp.src(mainBowerFiles({
            filter: /\.css$/
        }))
        .pipe(concat('openslides-libs.css'))
        .pipe(gulpif(argv.production, cssnano({discardUnused: false})))
        .pipe(gulp.dest(path.join(output_directory, 'css')));
});

// Catches all font files from all bower components.
gulp.task('fonts-libs', function() {
    return gulp.src(mainBowerFiles({
            filter: /\.(eot)|(svg)|(ttf)|(woff)|(woff2)$/
        }))
        .pipe(gulp.dest(path.join(output_directory, 'fonts')));
});

// Extra task only for CKEditor
gulp.task('ckeditor', function () {
    return gulp.src(path.join('bower_components', 'ckeditor', '**'))
        .pipe(gulp.dest(path.join(output_directory, 'ckeditor')));
});

// Compiles translation files (*.po) to *.json and saves them in the directory
// openslides/static/i18n/.
gulp.task('translations', function () {
    return gulp.src(path.join('openslides', 'locale', 'angular-gettext', '*.po'))
        .pipe(gettext.compile({
            format: 'json'
        }))
        .pipe(gulp.dest(path.join(output_directory, 'i18n')));
});

// Gulp default task. Runs all other tasks before.
gulp.task('default', ['js-libs', 'css-libs', 'fonts-libs', 'ckeditor', 'translations'], function () {});


/**
 * Extra tasks that have to be called manually. Useful for development.
 */

// Extracts translatable strings using angular-gettext and saves them in file
// openslides/locale/angular-gettext/template-en.pot.
gulp.task('pot', function () {
    return gulp.src([
            'openslides/core/static/templates/*.html',
            'openslides/*/static/templates/*/*.html',
            'openslides/*/static/js/*/*.js',
        ])
        .pipe(gettext.extract('template-en.pot', {}))
        .pipe(gulp.dest('openslides/locale/angular-gettext/'));
});

// Checks JavaScript using JSHint
gulp.task('jshint', function () {
    return gulp.src([ 'gulpfile.js', path.join( 'openslides', '*', 'static', '**', '*.js' ) ])
        .pipe(jshint())
        .pipe(jshint.reporter('default'));
});

// Extracts names, URLs and licensed of all uses bower components and prints
// it to the console. This is useful to update the README.rst during release
// process.
gulp.task('bower-components-for-readme', function () {
    var files = [];
    return gulp.src([
            path.join('bower_components', '*', 'bower.json'),
            path.join('bower_components', '*', 'component.json'),
        ])
        .pipe(
            through.obj(
                function (chunk, encoding, callback) {
                    files.push(chunk);
                    callback();
                },
                function (callback) {
                    // Extract JSON from bower.json or components.json file.
                    var extracted = [];
                    for (var index = 0; index < files.length; index++) {
                        extracted.push(JSON.parse(files[index].contents.toString()));
                    }
                    // Sort files.
                    extracted.sort(function (a, b) {
                        return a.name < b.name ? -1 : 1;
                    });
                    // Print out line for README.rst.
                    for (var index2 = 0; index2 < extracted.length; index2++) {
                        var data = [
                            extracted[index2].name,
                            extracted[index2].homepage,
                            extracted[index2].license,
                        ];
                        console.log(vsprintf('  * `%s <%s>`_, License: %s', data));
                    }
                    // End stream without further file processing.
                    callback();
                }
            )
        );
});
