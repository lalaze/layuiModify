/*!

 @Title: layui
 @Description：经典模块化前端 UI 框架
 @Site: www.layui.com
 @Author: 贤心
 @License：MIT

 */
 
// 全局引入图标的js,笨比如我，接下来可能要学gulp
// import 'css/modules/icon/iconfont.js';

;!function(win){
  "use strict";

  var doc = document, config = {
    modules: {} //记录模块物理路径
    ,status: {} //记录模块加载状态
    ,timeout: 10 //符合规范的模块请求最长等待秒数
    ,event: {} //记录模块自定义事件
  }

  ,Layui = function(){
    this.v = '2.5.5'; //版本号
  }

  //获取layui所在目录
  ,getPath = function(){
    var jsPath = doc.currentScript ? doc.currentScript.src : function(){
      var js = doc.scripts
      ,last = js.length - 1
      ,src;
      for(var i = last; i > 0; i--){
        if(js[i].readyState === 'interactive'){
          src = js[i].src;
          break;
        }
      }
      return src || js[last].src;
    }();
    return jsPath.substring(0, jsPath.lastIndexOf('/') + 1);
  }()

  //异常提示
  ,error = function(msg){
    win.console && console.error && console.error('Layui hint: ' + msg);
  }

  ,isOpera = typeof opera !== 'undefined' && opera.toString() === '[object Opera]'

  //内置模块
  ,modules = {
    layer: 'modules/layer' //弹层
    ,laydate: 'modules/laydate' //日期
    ,laypage: 'modules/laypage' //分页
    ,laytpl: 'modules/laytpl' //模板引擎
    ,layim: 'modules/layim' //web通讯
    ,layedit: 'modules/layedit' //富文本编辑器
    ,form: 'modules/form' //表单集
    ,upload: 'modules/upload' //上传
    ,transfer: 'modules/transfer' //上传
    ,tree: 'modules/tree' //树结构
    ,table: 'modules/table' //表格
    ,element: 'modules/element' //常用元素操作
    ,rate: 'modules/rate'  //评分组件
    ,colorpicker: 'modules/colorpicker' //颜色选择器
    ,slider: 'modules/slider' //滑块
    ,carousel: 'modules/carousel' //轮播
    ,flow: 'modules/flow' //流加载
    ,util: 'modules/util' //工具块
    ,code: 'modules/code' //代码修饰器
    ,jquery: 'modules/jquery' //DOM库（第三方）
    ,dataTable:'modules/dataTable'//数据表格模块
    
    ,mobile: 'modules/mobile' //移动大模块 | 若当前为开发目录，则为移动模块入口，否则为移动模块集合
    ,'layui.all': '../layui.all' //PC模块合并版
  };

  //记录基础数据
  Layui.prototype.cache = config;

  //定义模块
  Layui.prototype.define = function(deps, factory){
    var that = this
    ,type = typeof deps === 'function'
    ,callback = function(){
      var setApp = function(app, exports){
        layui[app] = exports;
        config.status[app] = true;
      };
      typeof factory === 'function' && factory(function(app, exports){
        setApp(app, exports);
        config.callback[app] = function(){
          factory(setApp);
        }
      });
      return this;
    };
    
    type && (
      factory = deps,
      deps = []
    );
    
    if((!layui['layui.all'] && layui['layui.mobile'])){
      return callback.call(that);
    }

    that.use(deps, callback);
    return that;
  };

  //使用特定模块
  Layui.prototype.use = function(apps, callback, exports){
    var that = this
    ,dir = config.dir = config.dir ? config.dir : getPath
    ,head = doc.getElementsByTagName('head')[0];

    apps = typeof apps === 'string' ? [apps] : apps;
    
    //如果页面已经存在jQuery1.7+库且所定义的模块依赖jQuery，则不加载内部jquery模块
    if(window.jQuery && jQuery.fn.on){
      that.each(apps, function(index, item){
        if(item === 'jquery'){
          apps.splice(index, 1);
        }
      });
      layui.jquery = layui.$ = jQuery;
    }
    
    var item = apps[0]
    ,timeout = 0;
    exports = exports || [];

    //静态资源host
    config.host = config.host || (dir.match(/\/\/([\s\S]+?)\//)||['//'+ location.host +'/'])[0];
    
    //加载完毕
    function onScriptLoad(e, url){
      var readyRegExp = navigator.platform === 'PLaySTATION 3' ? /^complete$/ : /^(complete|loaded)$/
      if (e.type === 'load' || (readyRegExp.test((e.currentTarget || e.srcElement).readyState))) {
        config.modules[item] = url;
        head.removeChild(node);
        (function poll() {
          if(++timeout > config.timeout * 1000 / 4){
            return error(item + ' is not a valid module');
          };
          config.status[item] ? onCallback() : setTimeout(poll, 4);
        }());
      }
    }
    
    //回调
    function onCallback(){
      exports.push(layui[item]);
      apps.length > 1 ?
        that.use(apps.slice(1), callback, exports)
      : ( typeof callback === 'function' && callback.apply(layui, exports) );
    }
    
    //如果引入了完整库（layui.all.js），内置的模块则不必再加载
    if(apps.length === 0 
    || (layui['layui.all'] && modules[item]) 
    || (!layui['layui.all'] && layui['layui.mobile'] && modules[item])
    ){
      return onCallback(), that;
    }

    //首次加载模块
    if(!config.modules[item]){
      var node = doc.createElement('script')
      
      //如果是内置模块，则按照 dir 参数拼接模块路径
      //如果是扩展模块，则判断模块路径值是否为 {/} 开头，
      //如果路径值是 {/} 开头，则模块路径即为后面紧跟的字符。
      //否则，则按照 base 参数拼接模块路径
      ,url = ( modules[item] ? (dir + 'lay/') 
        : (/^\{\/\}/.test(that.modules[item]) ? '' : (config.base || ''))
      ) + (that.modules[item] || item) + '.js';
      
      url = url.replace(/^\{\/\}/, '');
      
      node.async = true;
      node.charset = 'utf-8';
      node.src = url + function(){
        var version = config.version === true 
        ? (config.v || (new Date()).getTime())
        : (config.version||'');
        return version ? ('?v=' + version) : '';
      }();
      
      head.appendChild(node);
      
      if(node.attachEvent && !(node.attachEvent.toString && node.attachEvent.toString().indexOf('[native code') < 0) && !isOpera){
        node.attachEvent('onreadystatechange', function(e){
          onScriptLoad(e, url);
        });
      } else {
        node.addEventListener('load', function(e){
          onScriptLoad(e, url);
        }, false);
      }
      
      config.modules[item] = url;
    } else { //缓存
      (function poll() {
        if(++timeout > config.timeout * 1000 / 4){
          return error(item + ' is not a valid module');
        };
        (typeof config.modules[item] === 'string' && config.status[item]) 
        ? onCallback() 
        : setTimeout(poll, 4);
      }());
    }
    return that;
  };

  //获取节点的style属性值
  Layui.prototype.getStyle = function(node, name){
    var style = node.currentStyle ? node.currentStyle : win.getComputedStyle(node, null);
    return style[style.getPropertyValue ? 'getPropertyValue' : 'getAttribute'](name);
  };

  //css外部加载器
  Layui.prototype.link = function(href, fn, cssname){
    var that = this
    ,link = doc.createElement('link')
    ,head = doc.getElementsByTagName('head')[0];
    
    if(typeof fn === 'string') cssname = fn;
    
    var app = (cssname || href).replace(/\.|\//g, '')
    ,id = link.id = 'layuicss-'+app
    ,timeout = 0;
    
    link.rel = 'stylesheet';
    link.href = href + (config.debug ? '?v='+new Date().getTime() : '');
    link.media = 'all';
    
    if(!doc.getElementById(id)){
      head.appendChild(link);
    }

    if(typeof fn !== 'function') return that;
    
    //轮询css是否加载完毕
    (function poll() {
      if(++timeout > config.timeout * 1000 / 100){
        return error(href + ' timeout');
      };
      parseInt(that.getStyle(doc.getElementById(id), 'width')) === 1989 ? function(){
        fn();
      }() : setTimeout(poll, 100);
    }());
    
    return that;
  };
  
  //存储模块的回调
  config.callback = {};
  
  //重新执行模块的工厂函数
  Layui.prototype.factory = function(modName){
    if(layui[modName]){
      return typeof config.callback[modName] === 'function' 
        ? config.callback[modName]
      : null;
    }
  };

  //css内部加载器
  Layui.prototype.addcss = function(firename, fn, cssname){
    return layui.link(config.dir + 'css/' + firename, fn, cssname);
  };

  //图片预加载
  Layui.prototype.img = function(url, callback, error) {   
    var img = new Image();
    img.src = url; 
    if(img.complete){
      return callback(img);
    }
    img.onload = function(){
      img.onload = null;
      typeof callback === 'function' && callback(img);
    };
    img.onerror = function(e){
      img.onerror = null;
      typeof error === 'function' && error(e);
    };  
  };

  //全局配置
  Layui.prototype.config = function(options){
    options = options || {};
    for(var key in options){
      config[key] = options[key];
    }
    return this;
  };

  //记录全部模块
  Layui.prototype.modules = function(){
    var clone = {};
    for(var o in modules){
      clone[o] = modules[o];
    }
    return clone;
  }();

  //拓展模块
  Layui.prototype.extend = function(options){
    var that = this;

    //验证模块是否被占用
    options = options || {};
    for(var o in options){
      if(that[o] || that.modules[o]){
        error('\u6A21\u5757\u540D '+ o +' \u5DF2\u88AB\u5360\u7528');
      } else {
        that.modules[o] = options[o];
      }
    }

    return that;
  };

  //路由解析
  Layui.prototype.router = function(hash){
    var that = this
    ,hash = hash || location.hash
    ,data = {
      path: []
      ,search: {}
      ,hash: (hash.match(/[^#](#.*$)/) || [])[1] || ''
    };
    
    if(!/^#\//.test(hash)) return data; //禁止非路由规范
    hash = hash.replace(/^#\//, '');
    data.href = '/' + hash;
    hash = hash.replace(/([^#])(#.*$)/, '$1').split('/') || [];
    
    //提取Hash结构
    that.each(hash, function(index, item){
      /^\w+=/.test(item) ? function(){
        item = item.split('=');
        data.search[item[0]] = item[1];
      }() : data.path.push(item);
    });
    
    return data;
  };

  //本地持久性存储
  Layui.prototype.data = function(table, settings, storage){
    table = table || 'layui';
    storage = storage || localStorage;
    
    if(!win.JSON || !win.JSON.parse) return;
    
    //如果settings为null，则删除表
    if(settings === null){
      return delete storage[table];
    }
    
    settings = typeof settings === 'object' 
      ? settings 
    : {key: settings};
    
    try{
      var data = JSON.parse(storage[table]);
    } catch(e){
      var data = {};
    }
    
    if('value' in settings) data[settings.key] = settings.value;
    if(settings.remove) delete data[settings.key];
    storage[table] = JSON.stringify(data);
    
    return settings.key ? data[settings.key] : data;
  };
  
  //本地会话性存储
  Layui.prototype.sessionData = function(table, settings){
    return this.data(table, settings, sessionStorage);
  }

  //设备信息
  Layui.prototype.device = function(key){
    var agent = navigator.userAgent.toLowerCase()

    //获取版本号
    ,getVersion = function(label){
      var exp = new RegExp(label + '/([^\\s\\_\\-]+)');
      label = (agent.match(exp)||[])[1];
      return label || false;
    }
    
    //返回结果集
    ,result = {
      os: function(){ //底层操作系统
        if(/windows/.test(agent)){
          return 'windows';
        } else if(/linux/.test(agent)){
          return 'linux';
        } else if(/iphone|ipod|ipad|ios/.test(agent)){
          return 'ios';
        } else if(/mac/.test(agent)){
          return 'mac';
        } 
      }()
      ,ie: function(){ //ie版本
        return (!!win.ActiveXObject || "ActiveXObject" in win) ? (
          (agent.match(/msie\s(\d+)/) || [])[1] || '11' //由于ie11并没有msie的标识
        ) : false;
      }()
      ,weixin: getVersion('micromessenger')  //是否微信
    };
    
    //任意的key
    if(key && !result[key]){
      result[key] = getVersion(key);
    }
    
    //移动设备
    result.android = /android/.test(agent);
    result.ios = result.os === 'ios';
    
    return result;
  };

  //提示
  Layui.prototype.hint = function(){
    return {
      error: error
    }
  };

  //遍历
  Layui.prototype.each = function(obj, fn){
    var key
    ,that = this;
    if(typeof fn !== 'function') return that;
    obj = obj || [];
    if(obj.constructor === Object){
      for(key in obj){
        if(fn.call(obj[key], key, obj[key])) break;
      }
    } else {
      for(key = 0; key < obj.length; key++){
        if(fn.call(obj[key], key, obj[key])) break;
      }
    }
    return that;
  };

  //将数组中的对象按其某个成员排序
  Layui.prototype.sort = function(obj, key, desc){
    var clone = JSON.parse(
      JSON.stringify(obj || [])
    );
    
    if(!key) return clone;
    
    //如果是数字，按大小排序，如果是非数字，按字典序排序
    clone.sort(function(o1, o2){
      var isNum = /^-?\d+$/
      ,v1 = o1[key]
      ,v2 = o2[key];
      
      if(isNum.test(v1)) v1 = parseFloat(v1);
      if(isNum.test(v2)) v2 = parseFloat(v2);
      
      if(v1 && !v2){
        return 1;
      } else if(!v1 && v2){
        return -1;
      }
        
      if(v1 > v2){
        return 1;
      } else if (v1 < v2) {
        return -1;
      } else {
        return 0;
      }
    });

    desc && clone.reverse(); //倒序
    return clone;
  };

  //阻止事件冒泡
  Layui.prototype.stope = function(thisEvent){
    thisEvent = thisEvent || win.event;
    try { thisEvent.stopPropagation() } catch(e){
      thisEvent.cancelBubble = true;
    }
  };

  //自定义模块事件
  Layui.prototype.onevent = function(modName, events, callback){
    if(typeof modName !== 'string' 
    || typeof callback !== 'function') return this;

    return Layui.event(modName, events, null, callback);
  };

  //执行自定义模块事件
  Layui.prototype.event = Layui.event = function(modName, events, params, fn){
    var that = this
    ,result = null
    ,filter = events.match(/\((.*)\)$/)||[] //提取事件过滤器字符结构，如：select(xxx)
    ,eventName = (modName + '.'+ events).replace(filter[0], '') //获取事件名称，如：form.select
    ,filterName = filter[1] || '' //获取过滤器名称,，如：xxx
    ,callback = function(_, item){
      var res = item && item.call(that, params);
      res === false && result === null && (result = false);
    };
    
    //添加事件
    if(fn){
      config.event[eventName] = config.event[eventName] || {};

      //这里不再对多次事件监听做支持，避免更多麻烦
      //config.event[eventName][filterName] ? config.event[eventName][filterName].push(fn) : 
      config.event[eventName][filterName] = [fn];
      return this;
    }
    
    //执行事件回调
    layui.each(config.event[eventName], function(key, item){
      //执行当前模块的全部事件
      if(filterName === '{*}'){
        layui.each(item, callback);
        return;
      }
      
      //执行指定事件
      key === '' && layui.each(item, callback);
      (filterName && key === filterName) && layui.each(item, callback);
    });
    
    return result;
  };

  win.layui = new Layui();
}(window);

!function(c){var h,e='<svg><symbol id="icon-guanbi" viewBox="0 0 1024 1024"><path d="M221.257143 799.085714c-160.914286-160.914286-160.914286-420.571429 0-581.485714s420.571429-160.914286 581.485714 0 160.914286 420.571429 0 581.485714-420.571429 159.085714-581.485714 0z m484.571428-437.028571l-49.371428-49.371429-144.457143 146.285715-144.457143-144.457143-47.542857 47.542857 144.457143 144.457143-146.285714 146.285714 49.371428 49.371429 146.285714-146.285715 146.285715 146.285715 47.542857-47.542858-146.285714-146.285714 144.457142-146.285714z" fill="#d81e06" ></path></symbol><symbol id="icon-guanbi1" viewBox="0 0 1024 1024"><path d="M566.97558594 521.09667969L856.8828125 231.18945312c14.63378906-14.63378906 14.63378906-38.75976563 0-53.39355468l-1.58203125-1.58203125c-14.63378906-14.63378906-38.75976563-14.63378906-53.39355469 0L512 466.51660156 222.09277344 176.21386719c-14.63378906-14.63378906-38.75976563-14.63378906-53.39355469 0l-1.58203125 1.58203125c-15.02929688 14.63378906-15.02929688 38.75976563 0 53.39355469l289.90722656 289.90722656L167.1171875 811.00390625c-14.63378906 14.63378906-14.63378906 38.75976563 0 53.39355469l1.58203125 1.58203125c14.63378906 14.63378906 38.75976563 14.63378906 53.39355469 0L512 576.07226563 801.90722656 865.97949219c14.63378906 14.63378906 38.75976563 14.63378906 53.39355469 0l1.58203125-1.58203125c14.63378906-14.63378906 14.63378906-38.75976563 0-53.39355469L566.97558594 521.09667969z" fill="#363F4D" ></path></symbol><symbol id="icon-xiangyou" viewBox="0 0 1024 1024"><path d="M385.536 102.4l398.848 364.544c12.288 10.752 19.456 26.624 19.456 43.008s-7.168 32.256-19.456 43.008l-398.848 364.544c-18.944 17.92-46.08 23.552-70.656 14.336s-40.96-31.232-43.52-57.344V145.408c2.048-26.112 18.944-48.128 43.52-57.344 24.064-9.216 51.712-3.584 70.656 14.336z" fill="" ></path></symbol><symbol id="icon-xiangzuo" viewBox="0 0 1024 1024"><path d="M689.664 917.504L290.816 552.96c-12.288-10.752-19.456-26.624-19.456-43.008s7.168-32.256 19.456-43.008L689.664 102.4c18.944-17.92 46.08-23.552 70.656-14.336 24.064 9.216 40.96 31.232 43.52 57.344v729.088c-2.048 26.112-18.944 48.128-43.52 57.344-24.576 9.216-51.712 3.584-70.656-14.336z" fill="" ></path></symbol><symbol id="icon-pdf" viewBox="0 0 1024 1024"><path d="M296.96 390.050909c60.509091 0 90.298182 25.134545 90.298182 76.334546 0 51.2-30.72 77.265455-91.229091 77.265454h-65.163636V642.327273h-38.167273V390.050909h104.261818z m-66.094545 121.018182h63.301818c19.549091 0 32.581818-3.723636 41.890909-10.24 8.378182-7.447273 13.032727-18.618182 13.032727-33.512727 0-15.825455-4.654545-26.996364-13.032727-33.512728-8.378182-7.447273-22.341818-10.24-40.96-10.24h-63.301818v87.505455zM514.792727 390.050909c40.96 0 71.68 11.170909 93.090909 34.443636 19.549091 21.410909 29.789091 52.130909 29.789091 92.16 0 40.029091-10.24 70.749091-30.72 92.16-21.410909 22.341818-52.130909 33.512727-93.090909 33.512728h-91.229091V390.050909h92.16z m-53.061818 219.694546h45.614546c31.650909 0 55.854545-7.447273 70.74909-23.272728 14.894545-14.894545 22.341818-38.167273 22.341819-70.749091s-7.447273-55.854545-21.410909-70.749091c-14.894545-14.894545-38.167273-22.341818-69.818182-22.341818h-46.545455v187.112728zM848.058182 390.050909v32.581818H714.938182v73.541818h125.672727v32.581819H714.938182V642.327273h-38.167273V390.050909h171.287273z" fill="#FFFFFF" ></path><path d="M508.276364 422.632727h-46.545455v187.112728h45.614546c31.650909 0 55.854545-7.447273 70.74909-23.272728 14.894545-14.894545 22.341818-38.167273 22.341819-70.749091s-7.447273-55.854545-21.410909-70.749091c-15.825455-14.894545-39.098182-22.341818-70.749091-22.341818zM335.127273 432.872727c-8.378182-7.447273-22.341818-10.24-40.96-10.24h-63.301818v88.436364h63.301818c19.549091 0 32.581818-3.723636 41.890909-10.24 8.378182-7.447273 13.032727-18.618182 13.032727-33.512727 0-16.756364-4.654545-27.927273-13.963636-34.443637z" fill="#D24726" ></path><path d="M0 0v1024h1024V0H0z m296.029091 543.650909h-65.163636V642.327273h-38.167273V390.050909h104.261818c60.509091 0 90.298182 25.134545 90.298182 76.334546 0 52.130909-30.72 77.265455-91.229091 77.265454z m310.923636 65.163636c-21.410909 22.341818-52.130909 33.512727-93.090909 33.512728h-91.229091V390.050909h92.16c40.96 0 71.68 11.170909 93.090909 34.443636 19.549091 21.410909 29.789091 52.130909 29.789091 92.16 0 39.098182-10.24 69.818182-30.72 92.16z m241.105455-186.181818H714.938182v73.541818h125.672727v32.581819H714.938182V642.327273h-38.167273V390.050909h171.287273v32.581818z" fill="#D24726" ></path></symbol><symbol id="icon-img" viewBox="0 0 1024 1024"><path d="M924.611765 256H763.482353c-45.176471 0-82.823529-37.647059-82.823529-84.329412V3.011765L924.611765 256z" fill="#6EA858" ></path><path d="M259.011765 415.623529c0-33.129412 24.094118-60.235294 55.717647-60.235294 30.117647 0 55.717647 27.105882 55.717647 60.235294s-24.094118 60.235294-55.717647 60.235295-55.717647-27.105882-55.717647-60.235295z m408.094117 13.552942l138.541177 281.6H228.894118c69.270588-64.752941 216.847059-204.8 216.847058-204.8l58.729412 109.929411 162.635294-186.729411z" fill="#FFFFFF" ></path><path d="M763.482353 256c-45.176471 0-82.823529-37.647059-82.823529-84.329412V3.011765H192.752941C171.670588 3.011765 150.588235 12.047059 135.529412 27.105882c-15.058824 16.564706-24.094118 37.647059-24.094118 60.235294v843.294118c0 22.588235 9.035294 43.670588 24.094118 58.729412s36.141176 24.094118 57.223529 24.094118H843.294118c21.082353 0 42.164706-9.035294 57.223529-24.094118s24.094118-36.141176 24.094118-58.729412V256H763.482353z m-448.752941 100.894118c30.117647 0 55.717647 27.105882 55.717647 60.235294s-24.094118 60.235294-55.717647 60.235294-55.717647-27.105882-55.717647-60.235294 25.6-60.235294 55.717647-60.235294z m-85.835294 355.388235c69.270588-64.752941 216.847059-204.8 216.847058-204.8l58.729412 109.929412 162.635294-186.729412 138.541177 281.6H228.894118z" fill="#9FD48C" ></path></symbol><symbol id="icon-docx" viewBox="0 0 1024 1024"><path d="M309.061818 300.683636l82.850909 331.403637h2.792728l86.574545-331.403637H549.236364l86.574545 331.403637h2.792727l82.850909-331.403637h73.541819L672.116364 726.109091h-68.887273l-86.574546-328.610909h-2.792727L427.287273 726.109091h-69.818182L235.52 300.683636h73.541818z" fill="#FFFFFF" ></path><path d="M0 0v1024h1024V0H0z m672.116364 726.109091h-68.887273l-86.574546-328.610909h-2.792727L427.287273 726.109091h-69.818182L235.52 300.683636h73.541818l82.850909 331.403637h2.792728l86.574545-331.403637H549.236364l86.574545 331.403637h2.792727l82.850909-331.403637h73.541819L672.116364 726.109091z" fill="#2C579B" ></path></symbol><symbol id="icon-ppt" viewBox="0 0 1024 1024"><path d="M545.512727 279.272727c110.778182 0 166.632727 46.545455 166.632728 141.498182s-55.854545 142.429091-167.563637 142.429091h-121.018182V744.727273h-70.749091V279.272727h192.698182zM423.563636 502.690909H539.927273c35.374545 0 60.509091-6.516364 77.265454-19.549091 15.825455-13.032727 24.203636-33.512727 24.203637-62.370909s-8.378182-49.338182-25.134546-61.44c-16.756364-13.032727-41.890909-19.549091-76.334545-19.549091H423.563636V502.690909z" fill="#FFFFFF" ></path><path d="M616.261818 359.330909c-16.756364-13.032727-41.890909-19.549091-76.334545-19.549091H423.563636V502.690909H539.927273c35.374545 0 60.509091-6.516364 77.265454-19.549091 15.825455-13.032727 24.203636-33.512727 24.203637-62.370909-0.930909-28.858182-9.309091-49.338182-25.134546-61.44z" fill="#D24726" ></path><path d="M0 0v1024h1024V0H0z m544.581818 563.2h-121.018182V744.727273h-70.749091V279.272727h192.698182c110.778182 0 166.632727 46.545455 166.632728 141.498182s-55.854545 142.429091-167.563637 142.429091z" fill="#D24726" ></path></symbol><symbol id="icon-zip" viewBox="0 0 1024 1024"><path d="M546.443636 668.392727h-66.094545v-33.512727h66.094545v33.512727zM446.836364 601.367273v99.607272h133.12V567.854545h-67.025455v33.512728H446.836364z m0-33.512728h66.094545v-33.512727H446.836364V567.854545z m66.094545-32.581818h66.094546v-33.512727h-66.094546v33.512727zM446.836364 501.76h66.094545v-33.512727H446.836364v33.512727z m66.094545-33.512727h66.094546v-33.512728h-66.094546v33.512728zM446.836364 434.734545h66.094545v-33.512727H446.836364v33.512727z m66.094545-32.581818h66.094546v-33.512727h-66.094546v33.512727zM446.836364 368.64h66.094545V335.127273H446.836364v33.512727z m67.025454-33.512727h66.094546v-33.512728h-66.094546V335.127273zM446.836364 302.545455h66.094545v-33.512728H446.836364v33.512728z" fill="#FFFFFF" ></path><path d="M512.930909 402.152727h67.025455v-33.512727h-67.025455zM446.836364 368.64h66.094545V335.127273H446.836364zM513.861818 269.032727h66.094546v-33.512727h-66.094546z" fill="#FFFFFF" ></path><path d="M451.490909 237.381818h66.094546V204.8h-66.094546z" fill="#FFFFFF" ></path><path d="M480.349091 634.88h66.094545v33.512727h-66.094545z" fill="#F07900" ></path><path d="M0 0v1024h1024V0H0z m451.490909 204.8h66.094546v30.72h62.370909v33.512727h-66.094546v-30.72h-62.370909V204.8z m128.465455 197.352727h-66.094546v33.512728h66.094546v33.512727h-66.094546V502.690909h66.094546v33.512727h-66.094546V567.854545h66.094546v133.12H446.836364V601.367273h66.094545V567.854545H446.836364v-33.512727h66.094545v-33.512727H446.836364v-33.512727h66.094545v-33.512728H446.836364V400.290909h66.094545v-33.512727H446.836364V335.127273h66.094545v33.512727h66.094546v33.512727z m0-67.025454h-66.094546v-33.512728H446.836364v-33.512727h66.094545v33.512727h66.094546V335.127273z" fill="#F07900" ></path></symbol><symbol id="icon-txt" viewBox="0 0 1024 1024"><path d="M379.810909 390.050909v32.581818h-83.781818V642.327273h-38.167273V422.632727h-84.712727v-32.581818h206.661818zM440.32 390.050909l61.44 91.229091 61.44-91.229091h47.476364L525.032727 512l91.229091 130.327273h-47.476363l-67.956364-100.538182L434.734545 642.327273h-47.476363l91.229091-130.327273-84.712728-121.949091h46.545455zM830.370909 390.050909v32.581818h-83.781818V642.327273h-38.167273V422.632727H623.709091v-32.581818h206.661818z" fill="#FFFFFF" ></path><path d="M0 0v1024h1024V0H0z m379.810909 422.632727h-83.781818V642.327273h-38.167273V422.632727h-84.712727v-32.581818h206.661818v32.581818zM569.716364 642.327273l-67.956364-100.538182L434.734545 642.327273h-47.476363l91.229091-130.327273-84.712728-121.949091h47.476364l61.44 91.229091 61.44-91.229091h47.476364L525.032727 512l91.229091 130.327273h-46.545454z m260.654545-219.694546h-83.781818V642.327273h-38.167273V422.632727H623.709091v-32.581818h206.661818v32.581818z" fill="#2C579B" ></path></symbol><symbol id="icon-doc" viewBox="0 0 1024 1024"><path d="M309.061818 300.683636l82.850909 331.403637h2.792728l86.574545-331.403637H549.236364l86.574545 331.403637h2.792727l82.850909-331.403637h73.541819L672.116364 726.109091h-68.887273l-86.574546-328.610909h-2.792727L427.287273 726.109091h-69.818182L235.52 300.683636h73.541818z" fill="#FFFFFF" ></path><path d="M0 0v1024h1024V0H0z m672.116364 726.109091h-68.887273l-86.574546-328.610909h-2.792727L427.287273 726.109091h-69.818182L235.52 300.683636h73.541818l82.850909 331.403637h2.792728l86.574545-331.403637H549.236364l86.574545 331.403637h2.792727l82.850909-331.403637h73.541819L672.116364 726.109091z" fill="#2C579B" ></path></symbol><symbol id="icon-unknow" viewBox="0 0 1024 1024"><path d="M604.16 309.992727c-22.341818-20.48-52.130909-30.72-90.298182-30.72-39.098182 0-70.749091 12.101818-94.952727 35.374546-24.203636 24.203636-37.236364 51.2-37.236364 81.92 0 19.549091 9.309091 28.858182 30.72 28.858182 19.549091 0 28.858182-9.309091 30.72-29.789091 0-16.756364 6.516364-30.72 19.549091-41.890909 12.101818-12.101818 28.858182-17.687273 49.338182-17.687273 20.48 0 36.305455 5.585455 48.407273 14.894545 12.101818 10.24 17.687273 25.134545 17.687272 42.821818 0 7.447273-0.930909 13.963636-1.861818 19.549091-0.930909 5.585455-3.723636 11.170909-7.447272 16.756364-3.723636 5.585455-8.378182 11.170909-14.894546 17.687273-5.585455 5.585455-13.963636 13.032727-23.272727 22.341818-20.48 19.549091-35.374545 39.098182-45.614546 57.716364-10.24 18.618182-14.894545 38.167273-14.894545 56.785454 0 6.516364 0 12.101818 0.930909 16.756364 0.930909 3.723636 1.861818 7.447273 3.723636 9.309091 1.861818 1.861818 4.654545 3.723636 8.378182 4.654545 4.654545 0.930909 10.24 1.861818 18.618182 1.861818 18.618182 0 27.927273-10.24 27.927273-32.581818 0-7.447273 0.930909-13.963636 1.861818-20.48 0.930909-6.516364 3.723636-13.032727 7.447273-18.618182 3.723636-6.516364 9.309091-13.032727 15.825454-21.410909 6.516364-7.447273 15.825455-16.756364 27.927273-27.927273 18.618182-17.687273 32.581818-34.443636 41.890909-50.26909 8.378182-14.894545 13.032727-31.650909 13.032727-49.338182 0-36.305455-11.170909-66.094545-33.512727-86.574546zM531.549091 662.807273c-3.723636-3.723636-8.378182-6.516364-13.963636-9.309091-5.585455-1.861818-10.24-3.723636-16.756364-3.723637-5.585455 0-11.170909 0.930909-16.756364 3.723637-5.585455 1.861818-9.309091 5.585455-13.963636 9.309091-3.723636 3.723636-7.447273 8.378182-9.309091 13.032727-1.861818 4.654545-3.723636 10.24-3.723636 15.825455 0 5.585455 0.930909 11.170909 3.723636 15.825454 1.861818 4.654545 5.585455 9.309091 9.309091 13.032727 3.723636 3.723636 8.378182 6.516364 13.963636 9.309091 5.585455 1.861818 10.24 3.723636 16.756364 3.723637 5.585455 0 11.170909-0.930909 16.756364-3.723637 5.585455-1.861818 9.309091-5.585455 13.963636-9.309091 3.723636-3.723636 7.447273-8.378182 9.309091-13.032727 1.861818-4.654545 3.723636-10.24 3.723636-15.825454 0-5.585455-0.930909-11.170909-3.723636-15.825455-1.861818-4.654545-4.654545-9.309091-9.309091-13.032727z" fill="#FFFFFF" ></path><path d="M0 0v1024h1024V0H0z m540.858182 708.421818c-1.861818 4.654545-5.585455 9.309091-9.309091 13.032727-3.723636 3.723636-8.378182 6.516364-13.963636 9.309091-5.585455 1.861818-10.24 3.723636-16.756364 3.723637-5.585455 0-11.170909-0.930909-16.756364-3.723637-5.585455-1.861818-9.309091-5.585455-13.963636-9.309091-3.723636-3.723636-7.447273-8.378182-9.309091-13.032727-1.861818-4.654545-3.723636-10.24-3.723636-15.825454 0-5.585455 0.930909-11.170909 3.723636-15.825455 1.861818-4.654545 5.585455-9.309091 9.309091-13.032727 3.723636-3.723636 8.378182-6.516364 13.963636-9.309091 5.585455-1.861818 10.24-3.723636 16.756364-3.723636 5.585455 0 11.170909 0.930909 16.756364 3.723636 5.585455 1.861818 9.309091 5.585455 13.963636 9.309091 3.723636 3.723636 7.447273 8.378182 9.309091 13.032727 1.861818 4.654545 3.723636 10.24 3.723636 15.825455 0 5.585455-0.930909 11.170909-3.723636 15.825454z m82.850909-260.654545c-9.309091 15.825455-23.272727 32.581818-41.890909 50.269091-11.170909 11.170909-21.410909 20.48-27.927273 27.927272-7.447273 7.447273-12.101818 14.894545-15.825454 21.410909-3.723636 6.516364-5.585455 13.032727-7.447273 18.618182-0.930909 5.585455-1.861818 13.032727-1.861818 20.48 0 22.341818-9.309091 32.581818-27.927273 32.581818-8.378182 0-13.963636-0.930909-18.618182-1.861818-3.723636-0.930909-6.516364-2.792727-8.378182-4.654545-1.861818-1.861818-3.723636-5.585455-3.723636-9.309091-0.930909-4.654545-0.930909-10.24-0.930909-16.756364 0-18.618182 4.654545-38.167273 14.894545-56.785454 10.24-19.549091 25.134545-39.098182 45.614546-57.716364 9.309091-9.309091 17.687273-16.756364 23.272727-22.341818 6.516364-6.516364 11.170909-12.101818 14.894545-17.687273 3.723636-5.585455 6.516364-11.170909 7.447273-16.756363 0.930909-5.585455 1.861818-12.101818 1.861818-19.549091 0-18.618182-5.585455-32.581818-17.687272-42.821819-11.170909-10.24-27.927273-14.894545-48.407273-14.894545s-37.236364 5.585455-49.338182 16.756364c-12.101818 11.170909-19.549091 25.134545-19.549091 40.96-0.930909 20.48-10.24 29.789091-30.72 29.789091-20.48 0-30.72-9.309091-30.72-28.858182 0-30.72 12.101818-57.716364 37.236364-81.92 24.203636-23.272727 55.854545-35.374545 94.952727-35.374546 38.167273 0 68.887273 10.24 90.298182 30.72 22.341818 20.48 33.512727 50.269091 33.512727 87.505455 0.930909 17.687273-3.723636 34.443636-13.032727 50.269091z" fill="#C2CCD3" ></path></symbol><symbol id="icon-excel" viewBox="0 0 1024 1024"><path d="M398.429091 279.272727L512 447.767273 625.570909 279.272727h86.574546L554.821818 504.552727 723.316364 744.727273h-86.574546L512 560.407273 387.258182 744.727273h-86.574546l167.563637-240.174546L311.854545 279.272727h86.574546z" fill="#FFFFFF" ></path><path d="M0 0v1024h1024V0H0z m636.741818 744.727273L512 560.407273 387.258182 744.727273h-86.574546l167.563637-240.174546L311.854545 279.272727h86.574546L512 447.767273 625.570909 279.272727h86.574546L554.821818 504.552727 723.316364 744.727273h-86.574546z" fill="#107C0F" ></path></symbol><symbol id="icon-rar" viewBox="0 0 1024 1024"><path d="M546.443636 668.392727h-66.094545v-33.512727h66.094545v33.512727zM446.836364 601.367273v99.607272h133.12V567.854545h-67.025455v33.512728H446.836364z m0-33.512728h66.094545v-33.512727H446.836364V567.854545z m66.094545-32.581818h66.094546v-33.512727h-66.094546v33.512727zM446.836364 501.76h66.094545v-33.512727H446.836364v33.512727z m66.094545-33.512727h66.094546v-33.512728h-66.094546v33.512728zM446.836364 434.734545h66.094545v-33.512727H446.836364v33.512727z m66.094545-32.581818h66.094546v-33.512727h-66.094546v33.512727zM446.836364 368.64h66.094545V335.127273H446.836364v33.512727z m67.025454-33.512727h66.094546v-33.512728h-66.094546V335.127273zM446.836364 302.545455h66.094545v-33.512728H446.836364v33.512728z" fill="#FFFFFF" ></path><path d="M512.930909 402.152727h67.025455v-33.512727h-67.025455zM446.836364 368.64h66.094545V335.127273H446.836364zM513.861818 269.032727h66.094546v-33.512727h-66.094546z" fill="#FFFFFF" ></path><path d="M451.490909 237.381818h66.094546V204.8h-66.094546z" fill="#FFFFFF" ></path><path d="M480.349091 634.88h66.094545v33.512727h-66.094545z" fill="#F07900" ></path><path d="M0 0v1024h1024V0H0z m451.490909 204.8h66.094546v30.72h62.370909v33.512727h-66.094546v-30.72h-62.370909V204.8z m128.465455 197.352727h-66.094546v33.512728h66.094546v33.512727h-66.094546V502.690909h66.094546v33.512727h-66.094546V567.854545h66.094546v133.12H446.836364V601.367273h66.094545V567.854545H446.836364v-33.512727h66.094545v-33.512727H446.836364v-33.512727h66.094545v-33.512728H446.836364V400.290909h66.094545v-33.512727H446.836364V335.127273h66.094545v33.512727h66.094546v33.512727z m0-67.025454h-66.094546v-33.512728H446.836364v-33.512727h66.094545v33.512727h66.094546V335.127273z" fill="#F07900" ></path></symbol><symbol id="icon-plus-select-down" viewBox="0 0 1024 1024"><path d="M260.45 384.043l251.524 251.524 251.523-251.524h-503.046zM260.45 384.043z"  ></path></symbol><symbol id="icon-plus-select-up" viewBox="0 0 1024 1024"><path d="M260.45 635.566l251.524-251.524 251.523 251.524h-503.046zM260.45 635.566z"  ></path></symbol><symbol id="icon-duigou" viewBox="0 0 1024 1024"><path d="M403.240649 739.274524c-13.007763 0-25.292872-5.058574-34.687367-14.45307-0.722653-0.722653-0.722653-1.445307-1.445307-1.445307L191.503176 507.302752c-7.949188-9.394495-6.503881-23.847565 3.613267-31.796753 9.394495-7.949188 23.847565-6.503881 31.796754 3.613267L401.072689 693.747354c1.445307 1.445307 2.890614 1.445307 5.058574-0.722654l384.451659-409.021877c8.671842-9.394495 23.124912-9.394495 31.796753-0.722654 9.394495 8.671842 9.394495 23.124912 0.722654 31.796754l-385.174312 409.744531c-9.394495 9.394495-21.679605 14.45307-34.687368 14.45307z"  ></path></symbol><symbol id="icon-duigou-copy" viewBox="0 0 1024 1024"><path d="M403.240649 931.27452397c-13.007763 0-25.292872-5.058574-34.687367-14.45307-0.722653-0.722653-0.722653-1.445307-1.445307-1.445307L191.503176 699.30275197c-7.949188-9.394495-6.503881-23.847565 3.613267-31.796753 9.394495-7.949188 23.847565-6.503881 31.796754 3.613267L401.072689 885.74735397c1.445307 1.445307 2.890614 1.445307 5.058574-0.722654l384.451659-409.021877c8.671842-9.394495 23.124912-9.394495 31.796753-0.722654 9.394495 8.671842 9.394495 23.124912 0.722654 31.796754l-385.174312 409.744531c-9.394495 9.394495-21.679605 14.45307-34.687368 14.45307z"  ></path></symbol></svg>',l=(h=document.getElementsByTagName("script"))[h.length-1].getAttribute("data-injectcss");if(l&&!c.__iconfont__svg__cssinject__){c.__iconfont__svg__cssinject__=!0;try{document.write("<style>.svgfont {display: inline-block;width: 1em;height: 1em;fill: currentColor;vertical-align: -0.1em;font-size:16px;}</style>")}catch(h){console&&console.log(h)}}!function(h){if(document.addEventListener)if(~["complete","loaded","interactive"].indexOf(document.readyState))setTimeout(h,0);else{var l=function(){document.removeEventListener("DOMContentLoaded",l,!1),h()};document.addEventListener("DOMContentLoaded",l,!1)}else document.attachEvent&&(i=h,v=c.document,o=!1,(e=function(){try{v.documentElement.doScroll("left")}catch(h){return void setTimeout(e,50)}t()})(),v.onreadystatechange=function(){"complete"==v.readyState&&(v.onreadystatechange=null,t())});function t(){o||(o=!0,i())}var i,v,o,e}(function(){var h,l,t,i,v,o;(h=document.createElement("div")).innerHTML=e,e=null,(l=h.getElementsByTagName("svg")[0])&&(l.setAttribute("aria-hidden","true"),l.style.position="absolute",l.style.width=0,l.style.height=0,l.style.overflow="hidden",t=l,(i=document.body).firstChild?(v=t,(o=i.firstChild).parentNode.insertBefore(v,o)):i.appendChild(t))})}(window);


