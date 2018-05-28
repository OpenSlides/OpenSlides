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


/**
 * Default tasks to be run before start.
 */

// Catches all JavaScript files (excluded worker files) from all core apps and concats them to one
// file js/openslides.js. In production mode the file is uglified.

var paths = {
  js: {
    src: [path.join('openslides', '*', 'static', 'js', '**', '*.js'),
          '!' + path.join('openslides', 'core', 'static', 'js', 'core', 'pdf-worker.js'),],
    dest: path.join(output_directory, 'js')
  },
  js_libs: {
    src: mainBowerFiles({
            filter: /\.js$/
         }),
    dest: path.join(output_directory, 'js')
  },
  pdf_worker: {
    src: path.join('openslides', 'core', 'static', 'js', 'core', 'pdf-worker.js'),
    dest: path.join(output_directory, 'js', 'workers')
  },
  pdf_worker_libs: {
    src: path.join('bower_components', 'pdfmake', 'build', 'pdfmake.min.js'),
    dest: path.join(output_directory, 'js', 'workers')
  },
  templates: {
    src: path.join('openslides', '*', 'static', 'templates', '**', '*.html'),
    dest: path.join(output_directory, 'js')
  },
  css_site: {
    src: path.join('openslides', 'core', 'static', 'css', 'site.scss'),
    dest: path.join(output_directory, 'css')
  },
  css_projector: {
    src: path.join('openslides', 'core', 'static', 'css', 'projector.scss'),
    dest: path.join(output_directory, 'css')
  },
  css_libs: {
    src: mainBowerFiles({
            filter: /\.css$/
         }),
    dest: path.join(output_directory, 'css')
  },
  fonts_libs: {
    src: mainBowerFiles({
            filter: /\.(woff)|(woff2)$/
         }),
    dest: path.join(output_directory, 'fonts')
  },
  angular_chosen_img: {
    src: path.join('bower_components', 'chosen', '*.png'),
    dest: path.join(output_directory, 'css')
  },
  ckeditor_defaults: {
    src: [path.join('bower_components', 'ckeditor', 'styles.js'),
          path.join('bower_components', 'ckeditor', 'contents.css'),],
    dest: path.join(output_directory, 'ckeditor')
  },
  ckeditor_skins: {
    src: path.join('bower_components', 'ckeditor', 'skins', 'moono-lisa', '**', '*'),
    dest: path.join(output_directory, 'ckeditor', 'skins')
  },
  ckeditor_plugins: {
    src: [path.join('bower_components', 'ckeditor', 'plugins', 'clipboard', '**', '*'),
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
          path.join('bower_components', 'ckeditor', 'plugins', 'table', '**', '*'),],
    dest: path.join(output_directory, 'ckeditor', 'plugins')
  },
  ckeditor_lang: {
    src: [path.join('bower_components', 'ckeditor', 'lang', 'en.js'),
          path.join('bower_components', 'ckeditor', 'lang', 'de.js'),
          path.join('bower_components', 'ckeditor', 'lang', 'pt.js'),
          path.join('bower_components', 'ckeditor', 'lang', 'es.js'),
          path.join('bower_components', 'ckeditor', 'lang', 'fr.js'),
          path.join('bower_components', 'ckeditor', 'lang', 'cs.js'),
          path.join('bower_components', 'ckeditor', 'lang', 'ru.js'),],
    dest: path.join(output_directory, 'ckeditor', 'lang')
  },
  translations: {
    src: path.join('openslides', 'locale', 'angular-gettext', '*.po'),
    dest: path.join(output_directory, 'i18n')
  }
};

function js() {
    return gulp.src(paths.js.src)
        .pipe(sourcemaps.init())
        .pipe(concat('openslides.js'))
        .pipe(sourcemaps.write())
        //TODO: Needs rework in all js files that uglified code works correctly.
        //.pipe(gulpif(argv.production, uglify()))
        .pipe(gulp.dest(paths.js.dest));
}

// Catches all JavaScript files from all bower components and concats them to
// one file js/openslides-libs.js. In production mode the file is uglified.
function js_libs() {
    return gulp.src(paths.js_libs.src)
        .pipe(sourcemaps.init())
        .pipe(concat('openslides-libs.js'))
        .pipe(sourcemaps.write())
        .pipe(inject.prepend("/* set basepath of CKEditor */\n" +
                "window.CKEDITOR_BASEPATH = '/static/ckeditor/';\n\n"))
        .pipe(inject.prepend("/* Workaround for IE and pdfjs-dist#1.3.100 (see PR#3714) */\n" +
                "PDFJS = {workerSrc: 'not used but set'};\n\n"))
        .pipe(gulpif(argv.production, uglify()))
        .pipe(gulp.dest(paths.js_libs.dest));
}

// Catches all pdfmake files for pdf worker.
function pdf_worker() {
    return gulp.src(paths.pdf_worker.src)
        .pipe(gulpif(argv.production, uglify()))
        .pipe(gulp.dest(paths.pdf_worker.dest));
}

// pdfmake files
function pdf_worker_libs() {
    return gulp.src(paths.pdf_worker_libs.src)
        .pipe(gulpif(argv.production, uglify()))
        .pipe(rename('pdf-worker-libs.js'))
        .pipe(gulp.dest(paths.pdf_worker_libs.dest));
}

// Catches all template files from all core apps and concats them to one
// file js/openslides-templates.js. In production mode the file is uglified.
function templates() {
    return gulp.src(paths.templates.src)
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
        .pipe(gulp.dest(paths.templates.dest));
}

// Build the openslides-site.css file from the main file core/static/css/site.scss.
// Minimizes the outputfile if the production flag is given.
function css_site() {
    return gulp.src(paths.css_site.src)
        .pipe(sass().on('error', sass.logError))
        .pipe(gulpif(argv.production, cssnano({safe: true})))
        .pipe(rename('openslides-site.css'))
        .pipe(gulp.dest(paths.css_site.dest));
}

// Build the openslides-projector.css file from the main file core/static/css/projector.scss.
// Minimizes the outputfile if the production flag is given.
function css_projector() {
    return gulp.src(paths.css_projector.src)
        .pipe(sass().on('error', sass.logError))
        .pipe(gulpif(argv.production, cssnano({safe: true})))
        .pipe(rename('openslides-projector.css'))
        .pipe(gulp.dest(paths.css_projector.dest));
}

// Catches all CSS files from all bower components and concats them to one file
// css/openslides-libs.css. In production mode the file is uglified.
function css_libs() {
    return gulp.src(paths.css_libs.src)
        .pipe(concat('openslides-libs.css'))
        .pipe(gulpif(argv.production, cssnano({safe: true})))
        .pipe(gulp.dest(paths.css_libs.dest));
}

// Catches all font files from all bower components.
function fonts_libs() {
return gulp.src(paths.fonts_libs.src)
        .pipe(gulp.dest(paths.fonts_libs.dest));
}

// Catches image files for angular-chosen.
function angular_chosen_img() {
    return gulp.src(paths.angular_chosen_img.src)
        .pipe(gulp.dest(paths.angular_chosen_img.dest));
}

// CKEditor defaults
function ckeditor_defaults() {
    return gulp.src(paths.ckeditor_defaults.src)
        .pipe(gulp.dest(paths.ckeditor_defaults.dest));
}

// CKEditor skins
function ckeditor_skins() {
    return gulp.src(paths.ckeditor_skins.src)
        .pipe(gulp.dest(paths.ckeditor_skins.dest));
}

// CKEditor plugins
function ckeditor_plugins() {
    return gulp.src(paths.ckeditor_plugins.src)
        .pipe(gulp.dest(paths.ckeditor_plugins.dest));
}

// CKEditor languages
function ckeditor_lang() {
    return gulp.src(paths.ckeditor_lang.src)
        .pipe(gulp.dest(paths.ckeditor_lang.dest));
}

// Compiles translation files (*.po) to *.json and saves them in the directory
// openslides/static/i18n/.
function translations() {
    return gulp.src(paths.translations.src)
        .pipe(gettext.compile({
            format: 'json'
        }))
        .pipe(gulp.dest(paths.translations.dest));
}

// Combines all CKEditor related tasks.
gulp.task('ckeditor', gulp.series(ckeditor_defaults, ckeditor_skins, ckeditor_plugins, ckeditor_lang));



// Gulp default task. Runs all other tasks before.
gulp.task('default', gulp.series(
        js,
        js_libs,
        pdf_worker,
        pdf_worker_libs,
        templates,
        css_site,
        css_projector,
        css_libs,
        fonts_libs,
        'ckeditor',
        angular_chosen_img,
        translations
    )
);

function watcher() {
    gulp.watch(paths.js.src, js);
    gulp.watch(paths.templates.src, templates);
    gulp.watch(paths.pdf_worker.src, pdf_worker);
    gulp.watch(paths.css_projector.src, css_projector);
    gulp.watch(paths.css_site.src, css_site);
}

/**
 * Extra tasks that have to be called manually. Useful for development.
 */
// Watches changes in JavaScript and templates.
gulp.task('watch', gulp.series(gulp.parallel(js, templates, pdf_worker, css_site, css_projector), watcher));


// Extracts translatable strings using angular-gettext and saves them in file
// openslides/locale/angular-gettext/template-en.pot.
gulp.task('pot', function () {
    return gulp.src([paths.templates.src, paths.js.src])
        .pipe(gettext.extract('template-en.pot', {}))
        .pipe(gulp.dest('openslides/locale/angular-gettext/'));
});

// Checks JavaScript using JSHint
gulp.task('jshint', function () {
    return gulp.src([
            'gulpfile.js',
            paths.js.src,
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
