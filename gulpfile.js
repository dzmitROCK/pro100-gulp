var gulp = require('gulp'); // Сам галп
var browserSync = require('browser-sync').create(); // LiveReload перезагрузка страницы при изменениях
var sass = require('gulp-sass'); // подключаем компилятор sass || scss
var autoprefixer = require('gulp-autoprefixer'); // пакет для префиксов CSS
var cssnano = require('gulp-cssnano'); // пакет для минификации CSS
var uglify = require('gulp-uglify'); //  пакет для сжатия JS
var pug = require('gulp-pug'); // компилятор pug
var del = require('del'); // пакет для удаления папок || файлов
var plumber = require('gulp-plumber'); // ловит ошибки и показывает их в консоли вместо остановки всего скрипта
var data = require('gulp-data'); // работаем с json


// del
gulp.task('clean', function() { // удаляет всю папку public
    return del.sync(['public']);
})

// Компиляция pug 
gulp.task('pug', function buildHTML() {
    return gulp.src('./work/html/**/*.pug') // берём все файлы pug в папках и подпапках 
        .pipe(plumber()) // обрабатываем на ошибки
        .pipe(pug({ // компилим в html
            pretty: false
        }))
        .pipe(gulp.dest("public"))
});

gulp.task('pug-watch', ['pug'], function(done) {
    browserSync.reload();
    done();
});


// Копируем fonts
gulp.task('fonts', function() {
        return gulp.src('./work/fonts/*') // берём все в папке fonts
            .pipe(gulp.dest('./public/fonts')); // переносим в public
    })
    // При изменении fonts
gulp.task('fonts-watch', function(done) { // таск выполняется если в папке fonts были изменения
    del.sync(['public/fonts']); // удаляем public/fonts
    gulp.src('./work/fonts/**/*') // берём всё в work/fonts
        .pipe(gulp.dest('./public/fonts')); // переносим в public/fonts 
    browserSync.reload(); // перезагружаем страницу
    done();
});

// Копируем favicon
gulp.task('favicon', function() {
        return gulp.src('./work/favicon/**/*')
            .pipe(gulp.dest('./public/favicon'));
    })
    // При изменении favicon
gulp.task('favicon-watch', function(done) { // таск выполняется если в папке favicon были изменения
    del.sync(['public/favicon']); // удаляем public/favicon
    gulp.src('./work/favicon/**/*') // берём всё в work/favicon
        .pipe(gulp.dest('./public/favicon')); // переносим в public/favicon 
    browserSync.reload(); // перезагружаем страницу... 
    done();
});


// Запускаем сервер
gulp.task('serve', function() {

    browserSync.init({
        server: "./public", // сервер в папке public
        notify: false // отключаем чудо-надоедливые посказки browser-sync
    });
});

// Компилим sass || scss
gulp.task('sass', function() {
    return gulp.src("./work/stylesheet/**/*.scss") // берём все файлы
        .pipe(sass.sync().on('error', sass.logError)) // ловим ошибки
        .pipe(autoprefixer(['last 5 versions', '> 1%', 'ie 8', 'ie 7'], { cascade: true })) // добавляем префиксы
        .pipe(cssnano()) // сжимаем
        .pipe(gulp.dest("./public/stylesheet")) // выгружаем
        .pipe(browserSync.stream()); // инжектим без перезагрузки
});


// defaul task
gulp.task('default', ['clean', 'fonts', 'favicon', 'sass', 'pug', 'serve'], function() { // выполняем таски по порядку ['clean', 'fonts', 'favicon', 'sass', 'pug', 'serve']

    gulp.watch('./work/stylesheet/**/*.scss', ['sass']); // наблюдаем за файлами и при изменениях выполняем таск ['sass']
    gulp.watch('./work/html/**/*.pug', ['pug-watch']); // тоже только другой таск
    gulp.watch('./work/fonts/**/*', ['fonts-watch']); // соответственно вышеперечисленных

});
