KISSY.add("iee/fp.waterfall",function(t,n,a,e){function i(n){this.config=t.merge({diff:200,effect:{type:"fadeIn",duration:.5,easing:"easeInStrong"},minColCount:1},n)}return t.augment(i,t.EventTarget,{start:function(){var t=this;t.container=n.get(t.config.container),t.data=[],t.lazyImgs=[],t.checkLazyElements(t.container),a.on(window,"scroll",function(){t.check()}),t.check()},checkLazyElements:function(a){var e=[];t.each(n.query("img",a),function(t){t.getAttribute("data-lazy")&&e.push(t)}),this.lazyImgs=this.lazyImgs.concat(e)},loadData:function(){var t=this;t._loading=!0,t.config.load(function(n,a){t._loading=!1,t.addItems(n,a)},function(){t.end()})},end:function(){self.isEnd=!0},addItems:function(n,a){var i=this;if(i.data=i.data.concat(n),!i._adding){i._adding=!0;var o=i.config.effect,c=function(){if(0===i.data.length)return i._adding=!1,t.isFunction(a)&&a(),i.check();var n=i.data.shift();i.checkLazyElements(n);var r=e.one(n);r.appendTo(i.container),r.css({display:"none",visibility:""}),r[o.type](o.duration,0,o.easing),setTimeout(c,50)};c()}},check:function(){var a=this,e=n.scrollTop()+n.viewportHeight();a.lazyImgs=t.filter(a.lazyImgs,function(t){if(n.offset(t).top-200<=e){var a=t.getAttribute("data-lazy");return a&&(t.removeAttribute("data-lazy"),t.src=a),!1}return!0}),!a.isEnd&&!a._loading&&!a._adding&&n.offset(a.container).top+n.outerHeight(a.container)-a.config.diff<=e&&a.loadData()}}),i},{requires:["dom","event","node"]});