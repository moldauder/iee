# compress all js,css files by cleancss and uglifyjs

for file in *.css
do
    cleancss -o $file.min $file
done

for file in *.js
do
    uglifyjs $file -o $file.min
done

