/**
 * List Page
 */

require('./gotop.js');
require('./waterfall.min.js')

var Base = require('./base.js');
var last_post_id = '';
var $waterfall = $('#waterfall');

$waterfall.waterfall({
    itemCls: 'pin',
    fitWidth: true,
    colWidth: 320,
    gutterWidth: 20,
    maxCol: 3,
    loadingMsg: '<p class="loading"><img src="//pic.yupoo.com/iewei/C6Gb0faQ/PMs7M.gif" width="202" height="70"/></p>',
    path: function(){
        return '/query/all?from=fp&cat=' + (window.curCatId||'') + '&id=' + last_post_id;
    },
    callbacks: {
        loadingStart: function($loading){
            $loading.show();
        },
        loadingFinished: function($loading, isBeyondMaxPage){
            if(isBeyondMaxPage){
                $loading.html('<p class="end"></p>').show();
            }else{
                $loading.fadeOut();
            }
        },
        renderData: function (data, dataType) {
            if(data.length){
                var html = '';

                $.each(data, function(idx, vo){
                    last_post_id = vo.id;

                    html += '<a href="/' + ('0' !== vo.sid ? vo.sid : vo.id) + '" class="pin">' +
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

                return html;
            }else{
                $waterfall.data('plugin_waterfall').options.maxPage = 1;    //标记加载完成
            }
        }
    }
});

Base.initCategory(window.subCat, window.curCatId);
