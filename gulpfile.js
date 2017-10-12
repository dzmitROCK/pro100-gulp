'use strict';
const $ = require('gulp-load-plugins')(); // автозагрузка плагинов. некоторые доподключаем ниже если не подключились

const gulp = require('gulp'), // Сам галп
    browserSync = require('browser-sync').create(), // LiveReload перезагрузка страницы при изменениях
    del = require('del'), // пакет для удаления папок || файлов
    path = require('path'), // скоро понадобится
    imageminJpegRecompress = require('imagemin-jpeg-recompress'),
    fs = require('fs'),
    gutil = require('gulp-util'),
    pngquant = require('imagemin-pngquant'),
    ftp = require('vinyl-ftp'), // деплой на хостинг
    argv = require('yargs').argv; // Подключаем библиотеку для работы с png

// включаем флаги команд
const isProduction = !!(argv.production);

gulp.task('plug', function() { // посмотрим какие плагины подключились и какие названия
    console.log($);
});

// Опции
const options = {
    appName: 'app', // когда пакуем в zip то будет это название
    htmlMin: false, // false не сжимем pug на выходе, true сжимаем
    notify: false, // false отключает чудо-надоедливые посказки browser-sync
    srcFolder: 'app', // рабочая папка(если переименовываем папку разработки то и здесь меняем)
    publicFolder: 'public', // папка с выходным проектом
    autoprefixer: [
        'last 3 versions',
        'ie >= 9',
        'Android >= 2.3'
    ], // на сколько версий браузеров ставить префиксы
    dataName: 'data.json',
    tmpFolder: '/tmp/',
    imgConfig: [ // настройка оптимизации картинок // при изменении настроек чистим кэш yarn cacheme
        $.imagemin.gifsicle({
            interlaced: true,
            optimizationLevel: 1 // от 1 до 3 более высокие значения занимают больше времени, но могут иметь лучшие результаты.
        }),
        $.imagemin.jpegtran({
            progressive: true
        }),
        imageminJpegRecompress({ // https://github.com/imagemin/imagemin-jpeg-recompress#options
            loops: 5,
            min: 25, // минимальное качество
            max: 65, // макс соответственно
            quality: 'low', // качество картинок на выходе low, medium, high and veryhigh
            method: 'ssim' // доступные методы mpe, ssim, ms-ssim and smallfry. посмотреть можно https://github.com/danielgtaylor/jpeg-archive#image-comparison-metrics
        }),
        $.imagemin.svgo({
            plugins: [
                { removeViewBox: true }
            ]
        }),
        $.imagemin.optipng({ // https://github.com/imagemin/imagemin-optipng#options
            optimizationLevel: 3 // от 0 до 7 
        }),
        pngquant({
            quality: '70',
            speed: 5
        })
    ]
};


// Пути к файлам
const PATHS = {
    nodeFolder: 'node_modules',
    pugPages: options.srcFolder + '/pug/*.pug',
    allPug: options.srcFolder + '/pug/**/*.pug',
    sass: options.srcFolder + '/stylesheet/**/*.{scss,sass}',
    images: options.srcFolder + '/images/**/*.{png,jpg,gif}',
    js: options.srcFolder + '/javascript/**/*',
    fonts: options.srcFolder + '/fonts/**/*',
    favicon: options.srcFolder + '/favicon/**/*',
    jsonPug: options.srcFolder + '/pug/json/**/*.json',
    tmpFontsCss: options.srcFolder + options.tmpFolder + '*.css',
    tmpData: options.srcFolder + options.tmpFolder + options.dataName
};

// массив javascript
const allJavaScripts = [ // подключаем все скрипты проекта здесь. в каком порядке подключим в том и собирётся

    // все плагины foundation
    // если что то в проекте не используем то надо закомментировать
    PATHS.nodeFolder + '/foundation-sites/dist/js/plugins/foundation.core.js',
    PATHS.nodeFolder + '/foundation-sites/dist/js/plugins/foundation.util.*.js',

    // Paths to individual JS components defined below
    PATHS.nodeFolder + '/foundation-sites/dist/js/plugins/foundation.abide.js',
    PATHS.nodeFolder + '/foundation-sites/dist/js/plugins/foundation.accordion.js',
    PATHS.nodeFolder + '/foundation-sites/dist/js/plugins/foundation.accordionMenu.js',
    PATHS.nodeFolder + '/foundation-sites/dist/js/plugins/foundation.drilldown.js',
    PATHS.nodeFolder + '/foundation-sites/dist/js/plugins/foundation.dropdown.js',
    PATHS.nodeFolder + '/foundation-sites/dist/js/plugins/foundation.dropdownMenu.js',
    PATHS.nodeFolder + '/foundation-sites/dist/js/plugins/foundation.equalizer.js',
    PATHS.nodeFolder + '/foundation-sites/dist/js/plugins/foundation.interchange.js',
    PATHS.nodeFolder + '/foundation-sites/dist/js/plugins/foundation.magellan.js',
    PATHS.nodeFolder + '/foundation-sites/dist/js/plugins/foundation.offcanvas.js',
    PATHS.nodeFolder + '/foundation-sites/dist/js/plugins/foundation.orbit.js',
    PATHS.nodeFolder + '/foundation-sites/dist/js/plugins/foundation.responsiveAccordionTabs.js',
    PATHS.nodeFolder + '/foundation-sites/dist/js/plugins/foundation.responsiveMenu.js',
    PATHS.nodeFolder + '/foundation-sites/dist/js/plugins/foundation.responsiveToggle.js',
    PATHS.nodeFolder + '/foundation-sites/dist/js/plugins/foundation.reveal.js',
    PATHS.nodeFolder + '/foundation-sites/dist/js/plugins/foundation.slider.js',
    PATHS.nodeFolder + '/foundation-sites/dist/js/plugins/foundation.smoothScroll.js',
    PATHS.nodeFolder + '/foundation-sites/dist/js/plugins/foundation.sticky.js',
    PATHS.nodeFolder + '/foundation-sites/dist/js/plugins/foundation.tabs.js',
    PATHS.nodeFolder + '/foundation-sites/dist/js/plugins/foundation.toggler.js',
    PATHS.nodeFolder + '/foundation-sites/dist/js/plugins/foundation.tooltip.js',
    // ###все плагины foundation

    options.srcFolder + '/javascript/app.js', // главный файл для работы с js. Подключать последним
];


// del
gulp.task('clean', function() { // удаляет всю папку генерируемую в продакшен или при разработке
    return del.sync([options.publicFolder, options.srcFolder + options.tmpFolder]);
});


// Компиляция pug 
gulp.task('pug', ['pug:data'], function() { // если надо конвертнуть html в pug http://html2jade.org/ и http://html2pug.herokuapp.com/
    return gulp.src(PATHS.pugPages) // берём все файлы
        .pipe($.data(function(file) {
            return JSON.parse(fs.readFileSync(PATHS.tmpData)); // берём json
        }))
        .pipe($.pug({ // компилим в pug
            pretty: !options.htmlMin,
        }))
        .on('error', $.notify.onError({
            message: "<%= error.message %>",
            title: "Pug Error"
        }))
        .pipe($.size({
            title: 'pug'
        }))
        .pipe(gulp.dest(options.publicFolder))
});

gulp.task('pug:watch', ['pug'], function(done) {
    browserSync.reload();
    done();
});


// data json 
gulp.task('pug:data', function() {
    return gulp.src(PATHS.jsonPug)
        .pipe($.plumber({
            errorHandler: $.notify.onError({
                message: "<%= error.message %>",
                title: "JSON Error"
            })
        }))
        .pipe($.mergeJson({
            fileName: options.dataName
        }))
        .pipe(gulp.dest(options.srcFolder + options.tmpFolder));
});


// Копируем php
gulp.task('php', function() {
    return gulp.src(options.srcFolder + '/php/**/*.php') // берём все php
        .pipe(gulp.dest(options.publicFolder + '/php')); // переносим в public
});


// Работа с картинками
gulp.task('img', function() {
    return gulp.src(PATHS.images) // Берем все изображения
        .pipe($.cache(
            $.imagemin(options.imgConfig, {
                verbose: true
            })))
        .pipe($.size({
            title: 'images'
        }))
        .pipe(gulp.dest(options.publicFolder + '/images')) // Выгружаем в public
});


gulp.task('img:watch', ['img'], function(done) {
    browserSync.reload();
    done();
});

// Чистка кэша
gulp.task('cache', function(done) {
    $.cached.caches = {};
    return $.cache.clearAll(done);
});


gulp.task('fonts-style', ['generate-fonts'], function() {
    return gulp.src(PATHS.tmpFontsCss)
        .pipe($.concat('_fonts.scss'))
        .pipe(gulp.dest(options.srcFolder + '/stylesheet'))
});


gulp.task('generate-fonts', function() {
    return gulp.src(PATHS.fonts) // берём все шрифты в папке fonts
        .pipe($.fontmin({ // генерируем шрифты
            fontPath: '../fonts/', // добавляем в путь
            asFileName: true, // по названию файла шрифта генерируется название font-family
        }))
        .pipe(gulp.dest(options.srcFolder + options.tmpFolder)) // переносим в tmp
});


// Копируем fonts
gulp.task('fonts', ['fonts-style'], function() {
    return gulp.src(options.srcFolder + options.tmpFolder + '*.{eot,svg,ttf,woff}') // берём все шрифты в папке tmp
        .pipe($.size({
            title: 'fonts'
        }))
        .pipe(gulp.dest(options.publicFolder + '/fonts')) // переносим в public
});


gulp.task('fonts:watch', ['fonts'], function(done) {
    browserSync.reload();
    done();
});


// Копируем favicon
gulp.task('favicon', function() {
    return gulp.src(['!app/favicon/readme.md', PATHS.favicon])
        .pipe($.cache(
            $.imagemin(options.imgConfig, {
                verbose: true
            })))
        .pipe(gulp.dest(options.publicFolder + '/favicon'));
});


// Компилим sass || scss
gulp.task('sass', function() {
    return gulp.src(PATHS.sass) // берём все файлы
        .pipe($.if(!isProduction, $.sourcemaps.init())) // sourcemap при разработке
        .pipe($.sass()
            .on('error', $.notify.onError({
                message: "<%= error.message %>",
                title: "Sass Error"
            })))
        .pipe($.autoprefixer({
            browsers: options.autoprefixer,
            cascade: true
        })) // добавляем префиксы
        .pipe($.if(isProduction, $.cleanCss())) // если на продакшен подчищаем css от неиспользуемых класов и тд (хз как это работает :) )
        .pipe($.if(isProduction, $.cssnano())) // сжимаем если на продакшен
        .pipe($.if(!isProduction, $.sourcemaps.write())) // sourcemap при разработке
        .pipe($.size({
            title: 'css'
        }))
        .pipe(gulp.dest(options.publicFolder + '/stylesheet')) // выгружаем
        .pipe(browserSync.stream()); // инжектим без перезагрузки
});


gulp.task('lint', function() {
    return gulp.src('app/javascript/**/*.js')
        .pipe($.jshint())
        .pipe($.notify(function(file) {
            if (file.jshint.success) {
                return false;
            }

            var errors = file.jshint.results.map(function(data) {
                if (data.error) {
                    return "(" + data.error.line + ':' + data.error.character + ') ' + data.error.reason;
                }
            }).join("\n");
            return file.relative + " (" + file.jshint.results.length + " errors)\n" + errors;
        }));
});


// javascripts
gulp.task('scripts', ['lint'], function() { // берём все файлы скриптов
    return gulp.src(allJavaScripts) //
        .pipe($.if(!isProduction, $.sourcemaps.init())) // sourcemap при разработке
        .pipe($.concat('app.min.js')) // Собираем их в кучу в новом файле
        .pipe($.if(isProduction, $.uglify())) // Сжимаем JS файл если на продакшен
        .pipe($.if(!isProduction, $.sourcemaps.write())) // sourcemap при разработке
        .pipe($.size({
            title: 'js'
        }))
        .pipe(gulp.dest(options.publicFolder + '/javascript')) // Выгружаем в папку
});


gulp.task('js:watch', ['scripts'], function(done) {
    browserSync.reload();
    done();
});


// смотрим за файлами
gulp.task('watch', function() {
    gulp.watch(PATHS.sass, ['sass']); // наблюдаем за файлами и при изменениях выполняем таск
    gulp.watch([PATHS.allPug, PATHS.jsonPug], ['pug:watch']); // наблюдаем за файлами и при изменениях выполняем таск
    gulp.watch(PATHS.fonts, ['fonts:watch']); // наблюдаем за файлами и при изменениях выполняем таск
    gulp.watch(PATHS.images, ['img:watch']); // наблюдаем за файлами и при изменениях выполняем таск
    gulp.watch(PATHS.js, ['js:watch']); // наблюдаем за файлами и при изменениях выполняем таск
    gulp.watch(PATHS.php, ['php']); // наблюдаем за файлами и при изменениях выполняем таск
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
], function() {

    browserSync.init({
        server: options.publicFolder,
        notify: options.notify,
    });

});


// prod task
gulp.task('production', [
    'cache',
    'clean',
    'fonts',
    'php',
    'scripts',
    'favicon',
    'img',
    'sass',
    'pug'
]);

gulp.task('deploy', ['production'], function() {

    const ftpOpt = JSON.parse(fs.readFileSync('deploy.json')); // берём настройки из json

    var conn = ftp.create({
        host: ftpOpt.host,
        user: ftpOpt.user,
        password: ftpOpt.password,
        parallel: 10,
        log: gutil.log
    });

    return gulp.src(options.publicFolder + '/**/*', { buffer: false })
        .pipe(conn.dest(ftpOpt.folderOnServer));

});

// defaul task
gulp.task('default', ['serve'], function() {
    console.log('Поехали!!!');
});


// Архивирование проекта
gulp.task('zip', ['production'], function() {
    gulp.src(options.publicFolder + '/**/*')
        .pipe($.zip(options.appName + '.zip'))
        .pipe($.size({
            title: options.appName + '.zip'
        }))
        .pipe(gulp.dest(''))
        .pipe($.notify({
            message: 'Создан архив ' + options.appName + '.zip',
        }));
});