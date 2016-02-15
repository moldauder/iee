var gulp = require('gulp');
var uglify = require('gulp-uglify');
var cssnano = require('gulp-cssnano');
var less = require('gulp-less');

gulp.task('js', function(){
    return gulp.src(['public/**/*.js'])
        .pipe(uglify())
        .pipe(gulp.dest('template/default/assets'))
});

gulp.task('css', function(){
    return gulp.src(['public/**/*.css', 'public/**/*.less'])
        .pipe(less())
        .pipe(cssnano())
        .pipe(gulp.dest('template/default/assets'))
});

gulp.task('watch', function(){
    gulp.watch(['public/**/*.js'], ['js']);
    gulp.watch(['public/**/*.css', 'public/**/*.less'], ['css']);
});

gulp.task('default', ['css', 'js']);
