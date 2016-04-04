var MonthName = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];

exports.stddate = function(timeStr){
    var ymd = timeStr.split(' ')[0].split('-');

    if(3 === ymd.length){
        var idx = ymd[1] - 1;
        if(-1 < idx && idx < 12){
            ymd[1] = MonthName[idx];
        }

        return '<div class="stddate">' +
            '<span class="day">' + ymd[2] + '</span>' +
            '<span class="month">' + ymd[1] + '</span>' +
            '<span class="year">' + ymd[0] + '</span>' +
            '</div>';
    }

    return '';
};

exports.filterHtmlTag = function(html){
    var el = document.createElement('div');
    el.innerHTML = html;
    return DOM.text(el);
};

//处理分类固顶和分类交互
exports.initCategory = function(subCatMap, curCatId){
    var $root = $('#category');

    //创建一个替身，占住位置
    var $holder = $('<div class="category-placeholder"></div>');
    $holder.insertBefore($root);

    //点击监听
    var $sub = $root.find('div.sub');
    var $curSubTrigger;

    var $curExpandSubTrigger;
    var subTriggerClickHandler = function($trigger){
        var catList = subCatMap[$trigger.attr('data-cat')];
        if(!$.isArray(catList) && 0 === catList.length){
            return;
        }

        var isExpand = $trigger.data('isExpand');

        if(isExpand){   //收缩起来
            var $list = $sub.find('div.sub-cat');
            if($list.length){
                $list.animate({
                    marginTop: 0 - $list.outerHeight()
                }, 0.5);
            }

            $curExpandSubTrigger = null;
        }else{          //展开
            if('color' === catList[0].type){
                var html = '<div class="sub-cat sub-cat-color"><div class="list">';
                $.each(catList, function(index, vo){
                    html += '<a target="_self" class="cat-' + vo.alias + (curCatId === vo.id ? ' active' : '') + '" href="?cat=' + vo.alias + '"><span>' + vo.name.substr(vo.name.indexOf('/') + 1)  + '</span></a>';
                });
                html += '</div></div>';

            }
            $sub.html(html);

            var $list = $sub.find('div.sub-cat');
            var height= $list.outerHeight();

            $list.css('marginTop', 0 - height);
            $sub.css('height', height);

            $list.animate({
                marginTop: 0
            }, 0.5);

            $curExpandSubTrigger = $trigger;
        }

        $trigger.data('isExpand', !isExpand)
    };

    $root.find('li.collapse a').each(function(){
        var $trigger = $(this);

        var catList = subCatMap[$trigger.attr('data-cat')];
        if($.isArray(catList) && catList.length){
            $trigger.click(function(ev){
                ev.preventDefault();
                subTriggerClickHandler($trigger);
            });
        }
    });

    var isFixed;
    var $win = $(window);
    $win.scroll(function(){
        if($holder.offset().top < $win.scrollTop()){
            if(!isFixed){
                isFixed = true;
                $root.addClass('category-fixed');
                $holder.css('height', $root.outerHeight());
            }

            //如果子类目被展开了，那么这个时候自动收回
            if($curExpandSubTrigger){
                subTriggerClickHandler($curExpandSubTrigger);
            }
        }else{
            isFixed = false;
            $holder.css('height', 0);
            $root.removeClass('category-fixed');
        }
    });
};
