/*!
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

var argv = require('yargs').argv,
    gulp = require('gulp'),
    concat = require('gulp-concat'),
    gulpif = require('gulp-if'),
    gettext = require('gulp-angular-gettext'),
    mainBowerFiles = require('main-bower-files'),
    minifyCSS = require('gulp-minify-css'),
    path = require('path'),
    uglify = require('gulp-uglify');

// Directory where the results go
var output_directory = path.join('openslides', 'static');

// Catches all JavaScript files from all bower components and concats them to
// one file js/openslides-libs.js. In production mode the file is uglified.
gulp.task('js', function() {
    return gulp.src(mainBowerFiles({
            filter: /\.js$/
        }))
        .pipe(concat('openslides-libs.js'))
        .pipe(gulpif(argv.production, uglify()))
        .pipe(gulp.dest(path.join(output_directory, 'js')));
});

// Catches all CSS files from all bower components and concats them to one file
// css/openslides-libs.css. In production mode the file is uglified.
gulp.task('css', function() {
    return gulp.src(mainBowerFiles({
            filter: /\.css$/
        }))
        .pipe(concat('openslides-libs.css'))
        .pipe(gulpif(argv.production, minifyCSS()))
        .pipe(gulp.dest(path.join(output_directory, 'css')));
});

// Catches all font files from all bower components.
gulp.task('fonts', function() {
    return gulp.src(mainBowerFiles({
            filter: /\.(eot)|(svg)|(ttf)|(woff)$/
        }))
        .pipe(gulp.dest(path.join(output_directory, 'fonts')));
});

// Extracts translatable strings using angular-gettext and saves them in file
// openslides/locale/angular-gettext/template-en.pot.
gulp.task('pot', function () {
    return gulp.src(['openslides/*/static/templates/*/*.html',
                     'openslides/*/static/js/*/*.js'])
        .pipe(gettext.extract('template-en.pot', {}))
        .pipe(gulp.dest('openslides/locale/angular-gettext/'));
});

// Compiles translation files (*.po) to *.json and saves them in the directory
// openslides/static/i18n/.
gulp.task('translations', function () {
    return gulp.src('openslides/locale/angular-gettext/*.po')
        .pipe(gettext.compile({
            format: 'json'
        }))
        .pipe(gulp.dest(path.join(output_directory, 'i18n')));
});

// Gulp default task. Runs all other tasks before.
gulp.task('default', ['js', 'css', 'fonts'], function() {});
