'use strict';
const gulp = require('gulp'), // Сам галп
    browserSync = require('browser-sync').create(), // LiveReload перезагрузка страницы при изменениях
    sass = require('gulp-sass'), // подключаем компилятор sass || scss
    autoprefixer = require('gulp-autoprefixer'), // пакет для префиксов CSS
    cssnano = require('gulp-cssnano'), // пакет для минификации CSS
    uglify = require('gulp-uglify'), //  пакет для сжатия JS
    concat = require('gulp-concat'), // для конкатенации файлов
    pug = require('gulp-pug'), // компилятор pug
    del = require('del'), // пакет для удаления папок || файлов
    plumber = require('gulp-plumber'), // ловит ошибки и показывает их в консоли вместо остановки всего скрипта
    data = require('gulp-data'), // работаем с json
    imagemin = require('gulp-imagemin'), // Подключаем библиотеку для работы с изображениями
    pngquant = require('imagemin-pngquant'), // Подключаем библиотеку для работы с png
    sourcemaps = require('gulp-sourcemaps'),
    gulpIf = require('gulp-if'),
    cache = require('gulp-cache'); // Подключаем библиотеку кеширования

// Опции
const options = {
    isDev: true, // при разработке true, если хотите скомпилировать в продакшен ставим false
    htmlMin: false, // false не сжимем html на выходе, true сжимаем
    notify: false, // false отключает чудо-надоедливые посказки browser-sync
    devFolder: './app', // рабочая папка
    distFolder: './public', // папка с выходным проектом
    autoprefixer: 'last 5 versions', // на сколько версий браузеров ставить префиксы 
}

// Пути к файлам
const path = {
    node: './node_modules',
    pug: options.devFolder + '/html/*.pug',
    allPug: options.devFolder + '/html/**/*.pug',
    sass: options.devFolder + '/stylesheet/**/*.scss',
    images: options.devFolder + '/images/**/*',
    js: options.devFolder + '/javascript/**/*',
    fonts: options.devFolder + '/fonts/**/*',
    favicon: options.devFolder + '/favicon/**/*',
}

// массив javascript
var allJavaScripts = [ // подключаем все скрипты проекта здесь. причём в каком порядке подключим в том и собирётся
    path.node + '/jquery/dist/jquery.min.js', // jquery 3.2.1
    path.node + '/foundation-sites/dist/js/foundation.js', // foundation js
    options.devFolder + '/javascript/app.js', // главный файл для работы с js. Желательно подключать последним
];


// del
gulp.task('clean', function() { // удаляет всю папку public
    return del.sync(options.distFolder);
})


// Компиляция pug 
gulp.task('pug', function buildHTML() {
    return gulp.src(path.pug) // берём все файлы
        .pipe(plumber()) // обрабатываем на ошибки
        .pipe(pug({ // компилим в html
            pretty: !options.htmlMin
        }))
        .pipe(gulp.dest(options.distFolder));
});


gulp.task('pug-watch', ['pug'], function(done) {
    browserSync.reload();
    done();
});


// Работа с картинками
gulp.task('img', function() {
    return gulp.src(path.images) // Берем все изображения
       //.pipe(newer(options.distFolder + '/images'))
        .pipe(cache(imagemin({ // Сжимаем их с наилучшими настройками с учетом кеширования
            interlaced: true,
            progressive: true,
            svgoPlugins: [{ removeViewBox: false }],
            use: [pngquant()]
        })))
        .pipe(gulp.dest(options.distFolder + '/images')); // Выгружаем на продакшен
});


// Копируем fonts
gulp.task('fonts', function(done) {
    gulp.src(path.fonts) // берём все в папке fonts
        .pipe(gulp.dest(options.distFolder + '/fonts')); // переносим в public
    done();
});


// При изменении fonts
gulp.task('fonts-watch', function(done) { // таск выполняется если в папке fonts были изменения
    del.sync(options.distFolder + '/fonts'); // удаляем
    gulp.src(path.fonts) // берём всё 
        .pipe(gulp.dest(options.distFolder + '/fonts')); // переносим в 
    browserSync.reload(); // перезагружаем страницу
    done();
});


// Копируем favicon
gulp.task('favicon', function(done) {
    gulp.src(path.favicon)
        .pipe(cache(imagemin({ // Сжимаем их с наилучшими настройками с учетом кеширования
            interlaced: true,
            progressive: true,
            svgoPlugins: [{ removeViewBox: false }],
            use: [pngquant()]
        })))
        .pipe(gulp.dest(options.distFolder + '/favicon'));
    done();
});


// При изменении favicon
gulp.task('favicon-watch', function(done) { // таск выполняется если в папке favicon были изменения
    del.sync([options.distFolder + '/favicon']); // удаляем 
    gulp.src(path.favicon) // берём всё 
        .pipe(cache(imagemin({ // Сжимаем их с наилучшими настройками с учетом кеширования
            interlaced: true,
            progressive: true,
            svgoPlugins: [{ removeViewBox: false }],
            use: [pngquant()]
        })))
        .pipe(gulp.dest(options.distFolder + '/favicon')); // переносим 
    browserSync.reload(); // перезагружаем страницу... 
    done();
});


// Запускаем сервер
gulp.task('serve', ['clean', 'fonts', 'scripts', 'favicon', 'img', 'sass', 'pug'], function() {

    browserSync.init({
        server: options.distFolder,
        notify: options.notify
    });
});

// Компилим sass || scss
gulp.task('sass', function() {
    return gulp.src(path.sass) // берём все файлы
        .pipe(gulpIf(options.isDev, sourcemaps.init())) // sourcemap при разработке
        .pipe(sass.sync().on('error', sass.logError)) // компилим и ловим ошибки
        .pipe(autoprefixer([options.autoprefixer], { cascade: true })) // добавляем префиксы
        .pipe(gulpIf(!options.isDev, cssnano())) // сжимаем если на продакшен
        .pipe(gulpIf(options.isDev, sourcemaps.write())) // sourcemap при разработке
        .pipe(gulp.dest(options.distFolder + '/stylesheet')) // выгружаем
        .pipe(browserSync.stream()); // инжектим без перезагрузки
});


// javascripts
gulp.task('scripts', function() { // берём все файлы скриптов
    return gulp.src(allJavaScripts) // 
        .pipe(gulpIf(options.isDev, sourcemaps.init())) // sourcemap при разработке
        .pipe(concat('app.min.js')) // Собираем их в кучу в новом файле
        .pipe(gulpIf(!options.isDev, uglify())) // Сжимаем JS файл если на продакшен
        .pipe(gulpIf(options.isDev, sourcemaps.write())) // sourcemap при разработке
        .pipe(gulp.dest(options.distFolder + '/javascript')); // Выгружаем в папку 
});

//
gulp.task('js-watch', ['scripts'], function(done) {
    browserSync.reload();
    done();
});

gulp.task('watch', function () {
    gulp.watch(path.sass, ['sass']); // наблюдаем за файлами и при изменениях выполняем таск
    gulp.watch(path.allPug, ['pug-watch']); // наблюдаем за файлами и при изменениях выполняем таск
    gulp.watch(path.fonts, ['fonts-watch']); // наблюдаем за файлами и при изменениях выполняем таск
    gulp.watch(path.images, ['img-watch']); // наблюдаем за файлами и при изменениях выполняем таск
    gulp.watch(path.js, ['js-watch']); // наблюдаем за файлами и при изменениях выполняем таск
})
// defaul task
gulp.task('default', ['watch' ,'serve'], function() {
    console.log('Поехали!!!');
});

// prod task
gulp.task('prod', ['clean', 'fonts', 'favicon', 'scripts', 'img', 'sass', 'pug'], function() {
    console.log('А я вот день рождения не буду справлять...\nвсё зае....\nэммм...\nВсё скомпилировано, сэр!!!');
});
