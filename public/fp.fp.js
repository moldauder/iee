KISSY.add('iee/fp.fp', function(S, DOM, Event, IO, Base, Waterfall, Submit){

    var FP = {};

    FP.init = function(){
        this.initWaterfall();
        Submit.init();
    };

    FP.initWaterfall = function(){
        var hasMore = true;
        var last_post_id = window.startId;
        var loadingEl = DOM.get('#loading');

        function afterEnd(){
            loadingEl.innerHTML = '<p class="end"></p>';
            loadingEl.style.visibility = 'visible';
        }

        function showLoad(){
            loadingEl.innerHTML = '<p><img src="http://pic.yupoo.com/iewei/C6Gb0faQ/PMs7M.gif" width="202" height="70" alt="加载中" /></p>';
            loadingEl.style.visibility = 'visible';
        }

        var wf = new Waterfall({
            container: '#waterfall',
            colWidth: 325,
            maxColCount: 4,
            minColCount: 3,
            load: function(success, end){
                if(!last_post_id){
                    afterEnd();
                    return end();
                }

                showLoad();

                IO({
                    url: '/query/all',
                    data: {
                        id: last_post_id,
                        cat: window.curCatId,
                        from: 'fp'
                    },
                    dataType: 'json',
                    success: function(data){
                        if(data.length){
                            var html = '';
                            S.each(data, function(vo, idx){
                                last_post_id = vo.id;

                                html += '<a href="/' + ('0' !== vo.sid ? vo.sid : vo.id) + '" class="pin">' +
                                    '<img ' + (idx < 3 ? 'src' : 'data-lazy') + '="' + vo.img + '" width="320" height="420" />' +
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

                            loadingEl.style.visibility = 'hidden';

                            var el = document.createElement('div');
                            el.innerHTML = html;
                            success(DOM.children(el));
                        }else{
                            afterEnd();
                            end();
                        }
                    }
                });
            }
        });

        wf.on('resize', function(ev){
            var el = document.documentElement;
            el.className = el.className.replace(/\s+pw\d+\b/, '') + ' pw' + ev.colCount;
        });

        wf.start();
    };

    return FP;

}, {
    requires:[
        'dom', 'event', 'ajax',
        'iee/fp.base',
        'iee/fp.waterfall',
        'iee/fp.submit'
    ]
});