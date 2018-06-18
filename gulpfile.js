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

var argv = require('yargs').argv,
    gulp = require('gulp'),
    concat = require('gulp-concat'),
    cssnano = require('gulp-cssnano'),
    gulpif = require('gulp-if'),
    gettext = require('gulp-angular-gettext'),
    inject = require('gulp-inject-string'),
    jshint = require('gulp-jshint'),
    mainBowerFiles = require('main-bower-files'),
    path = require('path'),
    rename = require('gulp-rename'),
    sass = require('gulp-sass'),
    sourcemaps = require('gulp-sourcemaps'),
    templateCache = require('gulp-angular-templatecache'),
    through = require('through2'),
    uglify = require('gulp-uglify'),
    vsprintf = require('sprintf-js').vsprintf;


// Directory where the results go to
var output_directory = path.join('openslides', 'static');


// Container for all watchers
var watchers = [];


/**
 * Default tasks to be run before start.
 */

// Catches all JavaScript files (excluded worker files) from all core apps and concats them to one
// file js/openslides.js. In production mode the file is uglified.
var js_src = [
    path.join('openslides', '*', 'static', 'js', '**', '*.js'),
    '!' + path.join('openslides', 'core', 'static', 'js', 'core', 'pdf-worker.js'),
];

gulp.task('js', function () {
    return gulp.src(js_src)
        .pipe(sourcemaps.init())
        .pipe(concat('openslides.js'))
        .pipe(sourcemaps.write())
        //TODO: Needs rework in all js files that uglified code works correctly.
        //.pipe(gulpif(argv.production, uglify()))
        .pipe(gulp.dest(path.join(output_directory, 'js')));
});

watchers.push(function () {
    gulp.watch(js_src, gulp.series('js'));
});


// Catches all JavaScript files from all bower components and concats them to
// one file js/openslides-libs.js. In production mode the file is uglified.
gulp.task('js_libs', function () {
    return gulp.src(mainBowerFiles({
            filter: /\.js$/
        }))
        .pipe(sourcemaps.init())
        .pipe(concat('openslides-libs.js'))
        .pipe(sourcemaps.write())
        .pipe(inject.prepend("/* set basepath of CKEditor */\n" +
                "window.CKEDITOR_BASEPATH = '/static/ckeditor/';\n\n"))
        .pipe(inject.prepend("/* Workaround for IE and pdfjs-dist#1.3.100 (see PR#3714) */\n" +
                "PDFJS = {workerSrc: 'not used but set'};\n\n"))
        .pipe(gulpif(argv.production, uglify()))
        .pipe(gulp.dest(path.join(output_directory, 'js')));
});


// Catches all pdfmake files for pdf worker and pdfmake library.
var pdf_worker_src = path.join('openslides', 'core', 'static', 'js', 'core', 'pdf-worker.js');

gulp.task('pdf_worker', function () {
    return gulp.src(pdf_worker_src)
        .pipe(gulpif(argv.production, uglify()))
        .pipe(gulp.dest(path.join(output_directory, 'js', 'workers')));
});

gulp.task('pdf_worker_libs', function () {
    return gulp.src(path.join('bower_components', 'pdfmake', 'build', 'pdfmake.min.js'))
        .pipe(gulpif(argv.production, uglify()))
        .pipe(rename('pdf-worker-libs.js'))
        .pipe(gulp.dest(path.join(output_directory, 'js', 'workers')));
});

watchers.push(function () {
    gulp.watch(pdf_worker_src, gulp.series('pdf_worker'));
});


// Catches all template files from all core apps and concats them to one
// file js/openslides-templates.js. In production mode the file is uglified.
var templates_src = path.join('openslides', '*', 'static', 'templates', '**', '*.html');

gulp.task('templates', function () {
    return gulp.src(templates_src)
        .pipe(templateCache('openslides-templates.js', {
            module: 'OpenSlidesApp-templates',
            standalone: true,
            moduleSystem: 'IIFE',
            transformUrl: function (url) {
                var pathList = url.split(path.sep);
                pathList.shift();
                return pathList.join(path.sep);
            },
        }))
        .pipe(gulpif(argv.production, uglify()))
        .pipe(gulp.dest(path.join(output_directory, 'js')));
});

watchers.push(function () {
    gulp.watch(templates_src, gulp.series('templates'));
});


// Build the openslides-site.css file from the main file core/static/css/site.scss.
// Minimizes the outputfile if the production flag is given.
gulp.task('css_site', function () {
    return gulp.src(path.join('openslides', 'core', 'static', 'css', 'site.scss'))
        .pipe(sass().on('error', sass.logError))
        .pipe(gulpif(argv.production, cssnano({safe: true})))
        .pipe(rename('openslides-site.css'))
        .pipe(gulp.dest(path.join(output_directory, 'css')));
});


// Build the openslides-projector.css file from the main file core/static/css/projector.scss.
// Minimizes the outputfile if the production flag is given.
gulp.task('css_projector', function () {
    return gulp.src(path.join('openslides', 'core', 'static', 'css', 'projector.scss'))
        .pipe(sass().on('error', sass.logError))
        .pipe(gulpif(argv.production, cssnano({safe: true})))
        .pipe(rename('openslides-projector.css'))
        .pipe(gulp.dest(path.join(output_directory, 'css')));
});


// Watcher for scss files.
// We cannot differentiate between all scss files which belong to each realm. So if
// one scss file changes the site and projector css is rebuild.
watchers.push(function () {
  gulp.watch(path.join('openslides', '*', 'static', 'css', '**', '*.scss'), gulp.parallel('css_site', 'css_projector'));
});


// Catches all CSS files from all bower components and concats them to one file
// css/openslides-libs.css. In production mode the file is uglified.
gulp.task('css_libs', function () {
    return gulp.src(mainBowerFiles({
            filter: /\.css$/
        }))
        .pipe(concat('openslides-libs.css'))
        .pipe(gulpif(argv.production, cssnano({safe: true})))
        .pipe(gulp.dest(path.join(output_directory, 'css')));
});


// Catches all font files from all bower components.
gulp.task('fonts_libs', function () {
    return gulp.src(mainBowerFiles({
            filter: /\.(woff)|(woff2)$/
        }))
        .pipe(gulp.dest(path.join(output_directory, 'fonts')));
});


// Catches image files for angular-chosen.
gulp.task('angular_chosen_img', function () {
    return gulp.src(path.join('bower_components', 'chosen', '*.png'))
        .pipe(gulp.dest(path.join(output_directory, 'css')));
});


// Tasks for CKEditor
gulp.task('ckeditor_defaults', function () {
    return gulp.src([
            path.join('bower_components', 'ckeditor', 'styles.js'),
            path.join('bower_components', 'ckeditor', 'contents.css'),
        ])
        .pipe(gulp.dest(path.join(output_directory, 'ckeditor')));
});

gulp.task('ckeditor_skins', function () {
    return gulp.src(
            [
                path.join('bower_components', 'ckeditor', 'skins', 'moono-lisa', '**', '*'),
            ],
            {
                base: path.join('bower_components', 'ckeditor', 'skins')
            }
        )
        .pipe(gulp.dest(path.join(output_directory, 'ckeditor', 'skins')));
});

gulp.task('ckeditor_plugins', function () {
    return gulp.src(
            [
                path.join('bower_components', 'ckeditor', 'plugins', 'clipboard', '**', '*'),
                path.join('bower_components', 'ckeditor', 'plugins', 'colorbutton', '**', '*'),
                path.join('bower_components', 'ckeditor', 'plugins', 'colordialog', '**', '*'),
                path.join('bower_components', 'ckeditor', 'plugins', 'dialog', '**', '*'),
                path.join('bower_components', 'ckeditor', 'plugins', 'find', '**', '*'),
                path.join('bower_components', 'ckeditor', 'plugins', 'image', '**', '*'),
                path.join('bower_components', 'ckeditor', 'plugins', 'justify', '**', '*'),
                path.join('bower_components', 'ckeditor', 'plugins', 'link', '**', '*'),
                path.join('bower_components', 'ckeditor', 'plugins', 'liststyle', '**', '*'),
                path.join('bower_components', 'ckeditor', 'plugins', 'magicline', '**', '*'),
                path.join('bower_components', 'ckeditor', 'plugins', 'pastefromword', '**', '*'),
                path.join('bower_components', 'ckeditor', 'plugins', 'panelbutton', '**', '*'),
                path.join('bower_components', 'ckeditor', 'plugins', 'showblocks', '**', '*'),
                path.join('bower_components', 'ckeditor', 'plugins', 'specialchar', '**', '*'),
                path.join('bower_components', 'ckeditor', 'plugins', 'sourcedialog', '**', '*'),
                path.join('bower_components', 'ckeditor', 'plugins', 'table', '**', '*'),
            ],
            {
                base: path.join('bower_components', 'ckeditor', 'plugins')
            }
        )
        .pipe(gulp.dest(path.join(output_directory, 'ckeditor', 'plugins')));
});

gulp.task('ckeditor_lang', function () {
    return gulp.src([
            path.join('bower_components', 'ckeditor', 'lang', 'en.js'),
            path.join('bower_components', 'ckeditor', 'lang', 'de.js'),
            path.join('bower_components', 'ckeditor', 'lang', 'pt.js'),
            path.join('bower_components', 'ckeditor', 'lang', 'es.js'),
            path.join('bower_components', 'ckeditor', 'lang', 'fr.js'),
            path.join('bower_components', 'ckeditor', 'lang', 'cs.js'),
            path.join('bower_components', 'ckeditor', 'lang', 'ru.js'),
        ])
        .pipe(gulp.dest(path.join(output_directory, 'ckeditor', 'lang')));
});

gulp.task('ckeditor', gulp.parallel('ckeditor_defaults', 'ckeditor_skins', 'ckeditor_plugins', 'ckeditor_lang'));


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
gulp.task('default', gulp.parallel(
        'js',
        'js_libs',
        'pdf_worker',
        'pdf_worker_libs',
        'templates',
        'css_site',
        'css_projector',
        'css_libs',
        'fonts_libs',
        'angular_chosen_img',
        'ckeditor',
        'translations'
));


/**
 * Extra tasks that have to be called manually. Useful for development.
 */

// Watches changes in JavaScript and templates.
gulp.task('watching', function () {
    // This tasks never completes because it starts all watchers and let them
    // watch forever ...
    for (var i = 0; i < watchers.length; i++) {
        watchers[i]();
    }
});

gulp.task('watch', gulp.series(gulp.parallel('js', 'pdf_worker', 'templates', 'css_site', 'css_projector'), 'watching'));


// Extracts translatable strings using angular-gettext and saves them in file
// openslides/locale/angular-gettext/template-en.pot.
gulp.task('pot', function () {
    return gulp.src([
            templates_src,
            path.join('openslides', '*', 'static', 'js', '**', '*.js'),
        ])
        .pipe(gettext.extract('template-en.pot', {}))
        .pipe(gulp.dest('openslides/locale/angular-gettext/'));
});


// Checks JavaScript using JSHint
gulp.task('jshint', function () {
    return gulp.src([
            'gulpfile.js',
            path.join('openslides', '*', 'static', 'js', '**', '*.js'),
        ])
        .pipe(jshint())
        .pipe(jshint.reporter('default'))
        .pipe(jshint.reporter('fail'));
});


// Extracts names, URLs and licensed of all uses bower components and prints
// it to the console. This is useful to update the README.rst during release
// process.
gulp.task('bower-components-for-readme', function () {
    var files = [];
    return gulp.src([
            path.join('bower_components', '*', 'bower.json'),
            path.join('bower_components', '*', 'package.json'),
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
