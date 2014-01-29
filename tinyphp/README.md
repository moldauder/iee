tinyphp
=====

将tinyphp作为网站下的一个目录，然后建立index.php，内容如下：

    require 'tinyphp/tinyphp.php';

此时，还需要配置`.htaccess`文件，内容如下：


    <IfModule mod_rewrite.c>
        RewriteEngine On
        RewriteBase /
        RewriteRule ^index\.php$ - [L]
        RewriteCond %{REQUEST_FILENAME} !-f
        RewriteCond %{REQUEST_FILENAME} !-d
        RewriteRule . /index.php [L]
    </IfModule>

其作用是将请求转到入口文件index.php中。
