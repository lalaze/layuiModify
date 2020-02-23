layui.define(['jquery','laytpl'],function(exports){
  var $ = layui.$;
  var laytpl = layui.laytpl;

  // 渲染模板

  // 表头
  TABLE_HEAD = function(cols) {
    var template = ['<colgroup>',
    function() {
      var result = '';
      for (var i = 0;i < cols.length;i++) {
        if (cols[i].width) {
          result += '<col width="'+cols[i].width+'">'
        } else {
          result += '<col>'
        }
      }
      return result;
    }(),'<col width="10%"></col>','</colgroup>','<tr>',
    function() {
      var result = "";
      for (var i = 0;i<cols.length;i++) {
        result += '<th>'+cols[i].title+'</th>'
      }
      return result;
    }(),'<th>操作</th>','</tr>'
    ].join('')

    return template
  }

  // 表身初始渲染
  TABLE_BODY = function(data,cols,name) {
    var template = ''
    var editArray = function() {
      var text = []
      for (var i = 0;i < cols.length;i++) {
        if (cols[i]['edit']) {
          text.push(cols[i]['field'])
        }
      }
      return text
    }();
    for (var i = 0;i < data.length;i++) {
      template += '<tr id="'+name+'-'+i+'">';   
      for (var key in data[i]) {
        var edit =  editArray.indexOf(key)>-1 ? " contentEditable=true" : "";
        template += '<td style = "height:20px;"'+edit +' id="'+key+'">' +data[i][key]+'</td>'
      }
      template += '<td><button type="button" class="layui-btn layui-btn-xs layui-btn-danger">删除</button></td>'
      template += '</tr>';
      // 设置缓存index
      dataTable.index[name] = i;
    }
    return template;
  }

  // 表格单行 td 空的一行
  TABLE_ONE = function (data,cols,name) {
    var template = ''
    var editArray = function() {
      var text = []
      for (var i = 0;i < cols.length;i++) {
        if (cols[i]['edit']) {
          text.push(cols[i]['field'])
        }
      }
      return text
    }();
    // index+1
    dataTable.index[name] = (dataTable.index[name]+1);
    
    template += '<tr id="'+name+'-'+dataTable.index[name]+'">'
    for (var key in data[0]) {
      var edit =  editArray.indexOf(key)>-1 ? " contentEditable=true" : "";
      template += '<td style = "height:20px;"'+edit +'id="'+key+'"></td>'
    }
    template += '<td><button type="button" class="layui-btn layui-btn-xs layui-btn-danger">删除</button></td>'
    template += '</tr>'
    // template = "{{# layui.each(d.data,function(index,item){ }}" + "{{# layui.each(item,function(name,value){ }}"+ '<td style = "height:20px;">{{value}}</td>' +
    // "{{#  }); }}"+"{{#  }); }}"
    // template = laytpl(ttt).render({"data":data});
    return template
  }

  // 一些特殊各自的组装模板
  
  // 总体组装返回
  TABLE_ALL = function (options){
    return result  = ' <table class="layui-table" style="width:'+options.width+'">' + 
    TABLE_HEAD(options.cols) +TABLE_BODY(options.data,options.cols,options.elem.replace('#',''))+ '</table>'
  }

  // 外部接口
  dataTable={
    cache:{}, //数据缓存
    index:{}, //目前行数
  }
  
  // 构造器
  Class = function(options){
    var that = this;
    that.config = options;

    // 缓存初始数据
    dataTable.cache[options.elem.replace('#','')] =options.data;

    that.render(options.elem,TABLE_ALL(options));
    
    that.add(options)
    that.deleteAndEdit(options.elem)
  };

  Class.prototype.render  = function(id,template){
    $(id).append(template);
  }
  // 绑定按钮添加方法
  Class.prototype.add = function(options) {
    if (!(options.add)) return;
    $(options.add).bind('click',function() {
      console.log(123)
      var template = TABLE_ONE(options.data,options.cols,options.elem.replace('#',''))
      $(options.elem + ' table').append(template);
    })
  }
  // 绑定每行的删除方法与改变方法
  Class.prototype.deleteAndEdit = function(tableId) {
    // 事件代理

    // 删除一行
    $(tableId).on('click','button',function() {
      // 删除缓存数据
      var index = $(this).parent().parent().attr("id").split("-")[1];
      dataTable.cache[tableId.replace('#','')].splice(index,1)

      // 缓存index减少一，所有行id更新
      
      
      // 删除样式
      $(this).parent().parent().remove();
    })
    // 修改时对应修改缓存中的值
    $(tableId).on('blur','td',function() {
      var index = $(this).parent().attr("id").split("-")[1];
      var name = $(this).attr("id").split("-")[0];
      dataTable.cache[tableId.replace('#','')][index][name] =  $(this).text();
    })
  }

  //核心入口
  dataTable.render = function(options){
    var inst = new Class(options);
    return inst;
  };

  exports('dataTable', dataTable);  
});