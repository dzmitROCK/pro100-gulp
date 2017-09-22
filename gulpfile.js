'use strict';
const $ = require('gulp-load-plugins')(); // автозагрузка плагинов. некоторые доподключаем ниже если не подключились

const gulp = require('gulp'), // Сам галп
    browserSync = require('browser-sync').create(), // LiveReload перезагрузка страницы при изменениях
    del = require('del'), // пакет для удаления папок || файлов
    // path = require('path'), // скоро понадобится
    imageminJpegRecompress = require('imagemin-jpeg-recompress'),
    fs = require('fs'),
    pngquant = require('imagemin-pngquant'),
    argv = require('yargs').argv; // Подключаем библиотеку для работы с png

// включаем флаги команд
var isProduction = !!(argv.production);

gulp.task('plug', function () { // посмотрим какие плагины подключились и какие названия
    console.log($);
});

// Опции
const options = {
    appName: 'app', // когда пакуем в zip то будет это название
    imgQuality: 'low', // качество картинок на выходе low, medium, high and veryhigh
    htmlMin: false, // false не сжимем pug на выходе, true сжимаем
    notify: false, // false отключает чудо-надоедливые посказки browser-sync
    devFolder: 'app', // рабочая папка
    distFolder: 'public', // папка с выходным проектом
    autoprefixer: [
        'last 3 versions',
        'ie >= 9',
        'Android >= 2.3'
    ], // на сколько версий браузеров ставить префиксы
};

// Пути к файлам
const PATHS = {
    node: 'node_modules',
    pug: options.devFolder + '/pug/*.pug',
    allPug: options.devFolder + '/pug/**/*.pug',
    sass: options.devFolder + '/stylesheet/**/*.{scss,sass}',
    images: options.devFolder + '/images/**/*.{png,jpg,gif}',
    js: options.devFolder + '/javascript/**/*',
    fonts: options.devFolder + '/fonts/**/*',
    favicon: options.devFolder + '/favicon/**/*',
    jsonPug: options.devFolder + '/pug/json/pug-variables.json',
    tmpFonts: options.devFolder + '/tmp/*.css'
};

// массив javascript
var allJavaScripts = [ // подключаем все скрипты проекта здесь. причём в каком порядке подключим в том и собирётся
    PATHS.node + '/foundation-sites/dist/js/foundation.min.js', // foundation js
    options.devFolder + '/javascript/app.js', // главный файл для работы с js. Желательно подключать последним
];


// del
gulp.task('clean', function () { // удаляет всю папку генерируемую в продакшен или при разработке
    return del.sync([options.distFolder, options.devFolder + '/tmp']);
});


// Компиляция pug 
gulp.task('pug', function () {
    return gulp.src(PATHS.pug) // берём все файлы
        .pipe($.data(function (file) {
            return JSON.parse(fs.readFileSync(PATHS.jsonPug));
        }))
        .pipe($.pug({ // компилим в pug
            pretty: !options.htmlMin,
            cache: true,
        }).on('error', $.notify.onError({
            message: "<%= error.message %>",
            title: "Pug Error"
        })))
        .pipe($.size({
            title: 'pug'
        }))
        .pipe(gulp.dest(options.distFolder))
});

gulp.task('pug:watch', ['pug'], function (done) {
    browserSync.reload();
    done();
});

// Копируем php
gulp.task('php', function () {
    return gulp.src(options.devFolder + './php/**/*') // берём все php
        .pipe(gulp.dest(options.distFolder + '/php')); // переносим в public
});
// Работа с картинками
gulp.task('img', function () {
    return gulp.src(PATHS.images) // Берем все изображения
        .pipe($.cache($.imagemin([
            $.imagemin.gifsicle({interlaced: true}),
            $.imagemin.jpegtran({progressive: true}),
            imageminJpegRecompress({
                loops: 5,
                min: 65,
                max: 70,
                quality: options.imgQuality
            }),
            $.imagemin.svgo(),
            $.imagemin.optipng({optimizationLevel: 3}),
            pngquant({quality: '65-70', speed: 5})
        ], {
            verbose: true
        })))
        .pipe($.size({
            title: 'images'
        }))
        .pipe(gulp.dest(options.distFolder + '/images')) // Выгружаем на продакшен
});
gulp.task('img:watch', ['img'], function (done) {
    browserSync.reload();
    done();
});

// Чистка кэша
gulp.task('cache', function (done) {
    return $.cache.clearAll(done);
});

gulp.task('fonts-style', ['generate-fonts'], function () {
    return gulp.src(PATHS.tmpFonts)
        .pipe($.concat('_fonts.scss'))
        .pipe(gulp.dest(options.devFolder + '/stylesheet'))
});

gulp.task('generate-fonts', function () {
    return gulp.src(PATHS.fonts) // берём все шрифты в папке fonts
        .pipe($.fontmin({ // генерируем шрифты
            fontPath: '../fonts/', // добавляем в путь
            asFileName: true,
        }))
        .pipe(gulp.dest(options.devFolder + '/tmp')) // переносим в tmp
});


// Копируем fonts
gulp.task('fonts', ['fonts-style'], function () {
    return gulp.src(options.devFolder + '/tmp/*.{eot,svg,ttf,woff}') // берём все шрифты в папке tmp
        .pipe($.size({
            title: 'fonts'
        }))
        .pipe(gulp.dest(options.distFolder + '/fonts')) // переносим в public
});

gulp.task('fonts:watch', ['fonts'], function (done) {
    browserSync.reload();
    done();
});
// Копируем favicon
gulp.task('favicon', function () {
    return gulp.src(PATHS.favicon)
        .pipe($.cache($.imagemin([
            $.imagemin.gifsicle({interlaced: true}),
            $.imagemin.jpegtran({progressive: true}),
            imageminJpegRecompress({
                loops: 5,
                min: 65,
                max: 70,
                quality: options.imgQuality
            }),
            $.imagemin.svgo(),
            $.imagemin.optipng({optimizationLevel: 3}),
            pngquant({quality: '65-70', speed: 5})
        ], {
            verbose: true
        })))
        .pipe(gulp.dest(options.distFolder + '/favicon'));
});


// Запускаем сервер
gulp.task('serve', [
    'clean',
    'fonts',
    'php',
    'scripts',
    'favicon',
    'img',
    'sass',
    'pug',
    'watch'
], function () {

    browserSync.init({
        server: options.distFolder,
        notify: options.notify
    });

});

// Компилим sass || scss
gulp.task('sass', function () {
    return gulp.src(PATHS.sass) // берём все файлы
        .pipe($.if(!isProduction, $.sourcemaps.init())) // sourcemap при разработке
        .pipe($.sass()
            .on('error', $.notify.onError({
                message: "<%= error.message %>",
                title: "Sass Error"
            })))
        .pipe($.autoprefixer({browsers: options.autoprefixer, cascade: true})) // добавляем префиксы
        .pipe($.if(isProduction, $.cleanCss())) // подчищаем css от неиспользуемых класов и тд
        .pipe($.if(isProduction, $.cssnano())) // сжимаем если на продакшен
        .pipe($.if(!isProduction, $.sourcemaps.write())) // sourcemap при разработке
        .pipe($.size({
            title: 'css'
        }))
        .pipe(gulp.dest(options.distFolder + '/stylesheet')) // выгружаем
        .pipe(browserSync.stream()); // инжектим без перезагрузки
});

gulp.task('lint', function () {
    return gulp.src('app/javascript/**/*.js')
        .pipe($.jshint())
        .pipe($.notify(function (file) {
            if (file.jshint.success) {
                return false;
            }

            var errors = file.jshint.results.map(function (data) {
                if (data.error) {
                    return "(" + data.error.line + ':' + data.error.character + ') ' + data.error.reason;
                }
            }).join("\n");
            return file.relative + " (" + file.jshint.results.length + " errors)\n" + errors;
        }));
})

// javascripts
gulp.task('scripts', ['lint'], function () { // берём все файлы скриптов
    return gulp.src(allJavaScripts) //
        .pipe($.if(!isProduction, $.sourcemaps.init())) // sourcemap при разработке
        .pipe($.concat('app.min.js')) // Собираем их в кучу в новом файле
        .pipe($.if(isProduction, $.uglify())) // Сжимаем JS файл если на продакшен
        .pipe($.if(!isProduction, $.sourcemaps.write())) // sourcemap при разработке
        .pipe($.size({
            title: 'js'
        }))
        .pipe(gulp.dest(options.distFolder + '/javascript')) // Выгружаем в папку
});

gulp.task('js:watch', ['scripts'], function (done) {
    browserSync.reload();
    done();
});

// смотрим за файлами
gulp.task('watch', function () {
    gulp.watch(PATHS.sass, ['sass']); // наблюдаем за файлами и при изменениях выполняем таск
    gulp.watch([PATHS.allPug, PATHS.jsonPug], ['pug:watch']); // наблюдаем за файлами и при изменениях выполняем таск
    gulp.watch(PATHS.fonts, ['fonts:watch']); // наблюдаем за файлами и при изменениях выполняем таск
    gulp.watch(PATHS.images, ['img:watch']); // наблюдаем за файлами и при изменениях выполняем таск
    gulp.watch(PATHS.js, ['js:watch']); // наблюдаем за файлами и при изменениях выполняем таск
    gulp.watch(PATHS.php, ['php']); // наблюдаем за файлами и при изменениях выполняем таск
});


// defaul task
gulp.task('default', ['serve'], function () {
    console.log('Поехали!!!');
});


// prod task
gulp.task('production', [
    'clean',
    'fonts',
    'favicon',
    'scripts',
    'img',
    'sass',
    'pug'
], function () {
    console.log('А я вот день рождения не буду справлять...\nвсё зае....\nэммм...\nВсё скомпилировано, сэр!!!');
});


// Архивирование проекта
gulp.task('zip', ['production'], function () {
    gulp.src(options.distFolder + '/**/*')
        .pipe($.zip(options.appName + '.zip'))
        .pipe($.size({
            title: options.appName + '.zip'
        }))
        .pipe(gulp.dest(''))
        .pipe($.notify('Создан архив  ' + options.appName + '.zip'))
});