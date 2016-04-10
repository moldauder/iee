/**
 * List Page
 */

require('./gotop.js');
require('./waterfall.min.js')
require('./unslider.js')

var Base = require('./base.js');
var pageType = window.pageType || '';

var stopQueryItem = (pageType==='fp' || pageType==='thing') ? false : true;
var last_post_id = '';

var last_info_id = '';
var queryInformation = (pageType ==='thing') ? false : true;


//轮播
var $slider = $('#J_Slider');
if($slider.length){
    $sliderItems = $slider.find('a');
    last_info_id = $sliderItems.last().attr('data-id');

    $slider.unslider({
        infinite: true,
        arrows: $sliderItems.length > 3,
        nav: false
    });
}


//瀑布流

var $waterfall = $('#waterfall');

var isPageDoneMarkShow;

//http://wlog.cn/waterfall/index-zh.html
$waterfall.waterfall({
    itemCls: 'pin',
    fitWidth: true,
    colWidth: 320,
    gutterWidth: 20,
    gutterHeight: 20,
    maxCol: 3,
    checkImagesLoaded: false,
    loadingMsg: '<p class="loading"><img src="//pic.yupoo.com/iewei/C6Gb0faQ/PMs7M.gif" width="202" height="70"/></p>',
    path: function(){
        return 'query/all?' + $.param({
            from: 'fp',

            cat: window.curCatId || '',
            id: last_post_id,
            noItem: stopQueryItem,

            information: queryInformation,
            info_id: last_info_id
        });
    },
    callbacks: {
        loadingStart: function($loading){
            $loading.show();
        },
        loadingFinished: function($loading, isBeyondMaxPage){
            if(isBeyondMaxPage){
                if(!isPageDoneMarkShow){
                    $('<div class="page-load-done"></div>').insertAfter('#content');
                    $loading.remove();

                    isPageDoneMarkShow = true;
                }
            }else{
                $loading.fadeOut();
            }
        },
        renderData: function (data, dataType) {
            var html = '';

            if(data.infos.length){
                $.each(data.infos, function(idx, vo){
                    last_info_id = vo.id;

                    html += '<a href="/i' + ('0' !== vo.sid ? vo.sid : vo.id) + '" class="pin pin-info">' +
                        '<img src="' + vo.cover + '" width="320" height="250" />' +
                        '<div class="extra">' +
                            '<div class="date">' + vo.dateStr.toUpperCase() + '</div>' +
                            '<div class="title">' + vo.title + '</div>' +
                            '<div class="desc">' + vo.desc + '</div>' +
                        '</div>' +
                    '</a>';
                });
            }else{
                queryInformation = false;
            }

            if(data.items.length){
                $.each(data.items, function(idx, vo){
                    last_post_id = vo.id;

                    html += '<a href="/' + ('0' !== vo.sid ? vo.sid : vo.id) + '" class="pin pin-item">' +
                        '<img src="' + vo.img + '" width="320" height="420" />' +
                        '<div class="extra">' +
                            '<div class="mask"></div>' +
                            Base.stddate(vo.modified) +
                            '<div class="title">' + vo.title + '</div>' +
                            '<div class="desc">' + vo.fullcontent + '</div>' +
                            '<div class="author"><s></s>' + vo.nick + '</div>' +
                        '</div>' +
                        ('album' === vo.type ? '<s class="type-album"></s>' : '') +
                    '</a>';
                });
            }else{
                stopQueryItem = true;
            }

            if(html){
                return html;
            }else{
                $waterfall.data('plugin_waterfall').options.maxPage = 1;    //标记加载完成
            }
        }
    }
});

Base.initCategory(window.subCat, window.curCatId);
