layui.define(['jquery','laydate','upload'],function(exports){
  var $ = layui.$;
  var laydate = layui.laydate;
  var upload = layui.upload;

  // 渲染模板
  
  // 组装一个要特别渲染的对象
  TEMPLATE_OBJECT = function(cols) {
      var templateObject = {}
      for (var i = 0;i < cols.length;i++) {
        if (cols[i]['edit']) {
          templateObject[cols[i]['field']] = {'edit':true}
        }else if (cols[i]['date']) {
          templateObject[cols[i]['field']] = {'date':true}
        }else if (cols[i]['upload']) {
          templateObject[cols[i]['field']] = {'upload':true}
        }
      }
      return templateObject
  }

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
    var allTemplate = TEMPLATE_OBJECT(cols);

    for (var i = 0;i < data.length;i++) {
      template += '<tr id="'+name+'-'+i+'">';   
      for (var key in data[i]) {
        template += TABLE_TEMPLATE(name,allTemplate,key,i,data[i])
      }
      template += '<td><button type="button" class="layui-btn layui-btn-xs layui-btn-danger" tableId="delete">删除</button></td>'
      template += '</tr>';
      // 设置缓存index
      dataTable.index[name] = i;
    }
    return template;
  }

  // 表格单行 td 空的一行
  TABLE_ONE = function (data,cols,name) {
    var template = ''
    var allTemplate = TEMPLATE_OBJECT(cols);
    // index+1
    dataTable.index[name] = (dataTable.index[name]+1);
    
    template += '<tr id="'+name+'-'+dataTable.index[name]+'">'
    for (var key in data[0]) {
      template += TABLE_TEMPLATE(name,allTemplate,key,dataTable.index[name],{})
    }
    template += '<td><button type="button" class="layui-btn layui-btn-xs layui-btn-danger  tableId="delete"">删除</button></td>'
    template += '</tr>'
    // template = "{{# layui.each(d.data,function(index,item){ }}" + "{{# layui.each(item,function(name,value){ }}"+ '<td style = "height:20px;">{{value}}</td>' +
    // "{{#  }); }}"+"{{#  }); }}"
    // template = laytpl(ttt).render({"data":data});
    return template
  }

  // 组装模板
  TABLE_TEMPLATE = function (name,tobject,key,i,data) {
    // value="{{layui.util.toDateString2(d.licensingDate,'yyyy-MM-dd','enterpriseQualificationTable',d.LAY_TABLE_INDEX,'licensingDate')}}"
    if (tobject[key]) {
      if (tobject[key]['edit'] == true ) {
        return '<td style = "height:20px;" contentEditable="true" tableId="'+key+'">'+(data[key] ? data[key]:"")+'</td>'
      }else if (tobject[key]['date'] == true ) {
        // 缓存渲染id与个数
        if (dataTable.Render.date[name]) {
          dataTable.Render.date[name].push(key+'-'+i)
          dataTable.Render.date[name+"-index"] =  dataTable.Render.date[name+"-index"] + 1;
        } else {
          dataTable.Render.date[name] = [key+'-'+i];
          // 初始化组件index
          dataTable.Render.date[name+"-index"] = 0
        }
        // 日期要i区分渲染
        return '<td style="padding:0;" tableId="'+key+'"><input style="border:none;" type="text" class="layui-input" value="" id="'+key+'-'+dataTable.Render.date[name+"-index"]+'" autocomplete="off"></input></td>'
      } else if (tobject[key]['upload'] == true ) {
        // <button id="tableUpload{{d.LAY_TABLE_INDEX}}" class="layui-btn layui-btn-xs" type="button" style="margin:0;display: inline-block;">上传</button>
        // 缓存渲染id与个数
        if (dataTable.Render.upload[name]) {
          dataTable.Render.upload[name].push(key+'-'+i)
          dataTable.Render.upload[name+"-index"] =  dataTable.Render.upload[name+"-index"] + 1;
        } else {
          dataTable.Render.upload[name] = [key+'-'+i];
          // 初始化组件index
          dataTable.Render.upload[name+"-index"] = 0
        }
        return '<td style = "height:20px;" tableId="'+key+'"><button id="'+key+'-'+dataTable.Render.upload[name+"-index"]+'" class="layui-btn layui-btn-xs" type="button" style="margin:0;display: inline-block;">上传</button> </td>'
      }
    } else {
      return '<td style = "height:20px;" tableId="'+key+'">'+(data[key] ? data[key]:"")+'</td>'
    }
  }
  
  // 总体组装返回
  TABLE_ALL = function (options){
    return result  = ' <table class="layui-table" style="width:'+options.width+'">' + 
    TABLE_HEAD(options.cols) +TABLE_BODY(options.data,options.cols,options.elem.replace('#',''))+ '</table>'
  }

  // 外部接口
  dataTable={
    cache:{}, //数据缓存
    index:{}, //目前行数
    Render:{
      date:{
        // index:"" //表格渲染后就算删除了可以改变id，但是组件不可以，保持一个叠加把，然后再写入dateid的时候一起写了
      },
      upload:{},
    } //渲染数组缓存
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
    var that = this;
    $(id).append(template);
    if (dataTable.Render.date[id.replace("#", "")+"-index"]) { // 有日期index再渲染
      that.dateRender(id.replace('#',''),false)
    }
    if (dataTable.Render.upload[id.replace("#", "")+"-index"]) {
      that.uploadRender(id.replace('#',''),false)
    }
   
  }
  // 添加之后执行日期渲染方法
  Class.prototype.dateRender = function(tableName,sigin) {
    // 数组渲染为一整个list渲染，如果传入了一个单个渲染标志，就走单个渲染
    if (sigin === false) { //if 是排除了没有日期的情况，就不用渲染了
      for (var i = 0;i < dataTable.Render.date[tableName].length;i++) {
        laydate.render({
          elem: '#'+dataTable.Render.date[tableName][i],
          trigger: 'click'
        });
      }
    } else if (sigin) {
      // 去缓存取最新的渲染  注意是date的缓存index
      laydate.render({
        elem: '#'+dataTable.Render.date[tableName][0].split('-')[0]+'-'+dataTable.Render.date[tableName+"-index"],
        trigger: 'click'
      });
    }
  }
  // 上传组件渲染方法
  Class.prototype.uploadRender = function(tableName,sigin) {
    if (sigin) {
      upload.render({
        elem:'#'+dataTable.Render.upload[tableName][0].split('-')[0]+'-'+dataTable.Render.date[tableName+"-index"],
        url: '${ctx}/laboratory/minioFileController/uploadFileAndAdd',
        data: {
            'bucketName': 'zsjcz-image'
        },
        uploaddisplay: {
            serverUrl: '${ctx}/laboratory/minioFileController/getObject',
            idCallback:function (res) { //url的回调
                
            },
            urlCallback:function (res) {
                
            },
          }
        });

    } else {
      for (var i = 0;i < dataTable.Render.upload[tableName].length;i++) {
        upload.render({
          elem:'#'+dataTable.Render.upload[tableName][i],
          url: '${ctx}/laboratory/minioFileController/uploadFileAndAdd',
          data: {
              'bucketName': 'zsjcz-image'
          },
          uploaddisplay: {
              serverUrl: '${ctx}/laboratory/minioFileController/getObject',
              idCallback:function (res) { //url的回调
                  
              },
              urlCallback:function (res) {
                  
              },
            }
          });
      }
    }
  }
  // 绑定按钮添加方法
  Class.prototype.add = function(options) {
    var that = this;

    if (!(options.add)) return;
    $(options.add).bind('click',function() {
      var template = TABLE_ONE(options.data,options.cols,options.elem.replace('#',''))
      $(options.elem + ' table').append(template);
      // 渲染组件
      if (dataTable.Render.date[options.elem.replace("#", "")+"-index"]) { // 有日期index再渲染
        that.dateRender(options.elem.replace('#',''),true);
      }
      if (dataTable.Render.upload[options.elem.replace("#", "")+"-index"]) {
        that.uploadRender(options.elem.replace('#',''),true)
      }
      // 缓存中新加一行
      dataTable.cache[options.elem.replace('#','')][dataTable.index[[options.elem.replace('#','')]]] = {};
    })
  }
  // 绑定每行的删除方法与改变方法
  Class.prototype.deleteAndEdit = function(tableId) {
    // 事件代理
    // 删除一行
    $(tableId).on('click','button[tableId="delete"]',function() {
      // 删除缓存数据
      var index = $(this).parent().parent().attr("id").split("-")[1];
      dataTable.cache[tableId.replace('#','')].splice(index,1)

      console.log(dataTable.cache[tableId.replace('#','')])

       // 删除样式
       $(this).parent().parent().remove();

      // 缓存index减少一，所有行id更新
      dataTable.index[tableId.replace('#','')] = dataTable.index[tableId.replace('#','')] - 1;
      $(tableId+' table tbody tr[id]').each(function(index) {
        $(this).attr("id",tableId.replace('#','')+'-'+index)
      })
    })
    // 修改时对应修改缓存中的值
    $(tableId).on('blur','td',function(e) {
      // 删除样式的时候也会触发光标消失时间
      if (e.target.nodeName.toLowerCase() !== "button" && e.target.nodeName.toLowerCase() !== "input") {
        var index = $(this).parent().attr("id").split("-")[1];
        var name = $(this).attr("tableId");
        dataTable.cache[tableId.replace('#','')][index][name] =  $(this).text();
        console.log( dataTable.cache[tableId.replace('#','')])
      }
      if (e.target.nodeName.toLowerCase() === "input") {
        // 他这里这个是shadow-root隐藏元素，而且他还设置了mode：close的，草，拿不到值
        var index = $(this).parent().attr('id').split('-')[1]; 
        
        var name = $(this).attr('tableId');
        var id = $(this).children(':first').attr("id"); //取input框的id
        // 光标移除事件触发的时候，框内的值还没开始赋值，应延迟执行取值赋值，考虑卡顿，为100ms
        setTimeout(function(){
          lay('#'+id).each(function(i,item,){
            dataTable.cache[tableId.replace('#','')][index][name] = item.value;
            console.log( dataTable.cache[tableId.replace('#','')])
          }) 
        }, 100);       
      }
    })
  }

  //核心入口
  dataTable.render = function(options){
    var inst = new Class(options);
    return inst;
  };

  exports('dataTable', dataTable);  
});