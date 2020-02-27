layui.define(['jquery','laydate','upload','layer'],function(exports){
  var $ = layui.$;
  var laydate = layui.laydate;
  var upload = layui.upload;
  var layer = layui.layer;

  // 外部接口
  dataTable={
    cache:{}, //数据缓存
    index:{}, //目前行数
    Render:{
      date:{},
      upload:{},
      radio:{},
      checkbox:{}
    } //渲染数组缓存
  }
  /* 
    要说明一下render的设置，本意是缓存当前的渲染id，然后index不管他继续往前加，反正我改数据的时候是拿tr的行数的，独立出来，但是没有考虑到同一个表格有两个date的情况
    date:{
      表格名：{
        字段名：{
          data：[],
          index:个数
        }
      }
    }
    同理upload也是
    upload:{
      表格名：{
        字段名：{
          data：[],
          index:个数
        }
      }
    }
    因此很有必要单独写一个写缓存的方法
  */

  // 写入render数据，data加一或者index加一（单加的时候就不管data了）
  WRITE_RENDERDATA = function(tableName,type,key,num,flag,data) {
    if (flag) { //初始渲染
      if (!(dataTable.Render[type][tableName])) {
        dataTable.Render[type][tableName]={};
      }
      if (!(dataTable.Render[type][tableName][key])) {
        dataTable.Render[type][tableName][key]={};
        dataTable.Render[type][tableName][key].data=[];
        dataTable.Render[type][tableName][key].index = 0;
        dataTable.Render[type][tableName][key].data.push(key+'-'+num)
        if (data) {
            dataTable.Render[type][tableName][key].valueList = data;
        }
      } else {
        dataTable.Render[type][tableName][key].data.push(key+'-'+num)
        dataTable.Render[type][tableName][key].index =  dataTable.Render[type][tableName][key].index + 1;
      }
    } else { //单加，index加一
      dataTable.Render[type][tableName][key].index =  dataTable.Render[type][tableName][key].index + 1;
    } 
  }

  // 渲染模板
  
  // 组装一个要特别渲染的对象
  TEMPLATE_OBJECT = function(cols) {
      var templateObject = {};
      templateObject['namelist'] = [];
      for (var i = 0;i < cols.length;i++) {
        if (cols[i]['edit']) {
          templateObject[cols[i]['field']] = {'edit':true}
        }else if (cols[i]['date']) {
          templateObject[cols[i]['field']] = {'date':true}
        }else if (cols[i]['upload']) {
          templateObject[cols[i]['field']] = {'upload':true}
        }else if(cols[i]['radio'] ) {
          templateObject[cols[i]['field']] = {'radio':true}
          cols[i]['data'] ? templateObject[cols[i]['field']].data = cols[i]['data']:MSG("使用下拉选择请导入数据")
        }else if (cols[i]['checkbox']){
            templateObject[cols[i]['field']] = {'checkbox':true}
            cols[i]['data'] ? templateObject[cols[i]['field']].data = cols[i]['data']:MSG("使用下拉选择请导入数据")
        }
        templateObject['namelist'].push(cols[i]['field'])
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
    if (!data) return;
    if (!(Object.prototype.toString.call(data)== '[object Array]')) {
      MSG("数据格式错误")
        return "";
    }
    if (!(Object.prototype.toString.call(data[0])== '[object Object]')) {
        MSG("数据格式错误")
        return "";
    }
    var template = ''
    var allTemplate = TEMPLATE_OBJECT(cols);

    for (var i = 0;i < data.length;i++) {
      template += '<tr id="'+name+'-'+i+'">';
      for (var j = 0;j < allTemplate.namelist.length;j++) {
          template += TABLE_TEMPLATE(name,allTemplate,allTemplate.namelist[j],i,data[i])
      }
      template += '<td><button type="button" class="layui-btn layui-btn-xs layui-btn-danger" tableId="delete" style="margin:0;">删除</button></td>'
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
    for (var j = 0;j < allTemplate.namelist.length;j++) {
        template += TABLE_TEMPLATE(name,allTemplate,allTemplate.namelist[j],dataTable.index[name],"")
    }
    template += '<td><button type="button" class="layui-btn layui-btn-xs layui-btn-danger  tableId="delete" style="margin:0;">删除</button></td>'
    template += '</tr>'
    return template
  }

  // 组装模板
  TABLE_TEMPLATE = function (name,tobject,key,i,data) {
    if (tobject[key]) {
      if (tobject[key]['edit'] == true ) {
        return '<td contentEditable="true" tableId="'+key+'">'+(data[key] ? data[key]:"")+'</td>'
      }else if (tobject[key]['date'] == true ) {
        // 缓存
        if (data) {
          WRITE_RENDERDATA(name,'date',key,i,true)
          return '<td style="padding:0;" tableId="'+key+'"><input style="border:none;" type="text" class="layui-input" value="" id="'+key+'-'+i+'" autocomplete="off"></input></td>'
        } else {
          WRITE_RENDERDATA(name,'date',key,i,false)
          return '<td style="padding:0;" tableId="'+key+'"><input style="border:none;" type="text" class="layui-input" value="" id="'+key+'-'+ dataTable.Render.date[name][key].index+'" autocomplete="off"></input></td>'
        }
      } else if (tobject[key]['upload'] == true ) {
        if (data) {
          WRITE_RENDERDATA(name,'upload',key,i,true)
          return '<td  tableId="'+key+'"><button id="'+key+'-'+i+'" class="layui-btn layui-btn-xs" type="button" style="margin:0;display: inline-block;">上传</button> </td>'
        } else {
          WRITE_RENDERDATA(name,'upload',key,i,false)
          return '<td  tableId="'+key+'"><button id="'+key+'-'+dataTable.Render.upload[name][key].index+'" class="layui-btn layui-btn-xs" type="button" style="margin:0;display: inline-block;">上传</button> </td>'
        }
      }else if (tobject[key]['radio'] == true){
          if (data) {
              WRITE_RENDERDATA(name,'radio',key,i,true,tobject[key]['data'])
              return '<td style="padding:0;" tableId = "'+key+'" id="'+key+'-'+i+'"></td>'
          } else {
              WRITE_RENDERDATA(name,'radio',key,i,false)
              return '<td style="padding:0;" tableId = "'+key+'" id="'+key+'-'+dataTable.Render.radio[name][key].index+'"></td>'
          }
      }else if (tobject[key]['checkbox'] == true) {
          if (data) {
              WRITE_RENDERDATA(name,'checkbox',key,i,true,tobject[key]['data'])
              return '<td style="padding:0;" tableId = "'+key+'" id="'+key+'-'+i+'"></td>'
          } else {
              WRITE_RENDERDATA(name,'checkbox',key,i,false)
              return '<td style="padding:0;" tableId = "'+key+'" id="'+key+'-'+dataTable.Render.checkbox[name][key].index+'"></td>'
          }
      }
    } else {
      return '<td tableId="'+key+'">'+(data[key] ? data[key]:"")+'</td>'
    }
  }
  
  // 总体组装返回
  TABLE_ALL = function (options){
    return result  = ' <table class="layui-table" style="width:'+options.width+'">' + 
    TABLE_HEAD(options.cols) +TABLE_BODY(options.data,options.cols,options.elem.replace('#',''))+ '</table>'
  }

  //请求
  AJAX = function (url) {
    var result;
    $.ajax({
      url:url,
      type: 'get',
      async:false,
      success:function (res) {
        //返回的是
        result = res.data;
      },
      error: function () {
          MSG("数据接口出现异常")
      }
    })
    return result;
  }
  // 错误提示方法
  MSG = function (content) {
      return layer.msg(content, {
          icon: 2,
          shift: 6
      });
  };

    // 构造器
    Class = function(options){
        var that = this;
        that.config = options;

        //如果有url，把url的数据请求了写进data
        if (options.url) {
            options.data = AJAX(options.url);
        }
        // 缓存初始数据
        dataTable.cache[options.elem.replace('#','')] =options.data;

        //展示   展示属性  加个注释方便以后删除
        dataTable.cache.show =options.data;

        that.render(options.elem,TABLE_ALL(options));
        that.add(options)
        that.deleteAndEdit(options.elem)
    };

    Class.prototype.render  = function(id,template){
        var that = this;
        $(id).append(template);
        if (dataTable.Render.date[id.replace("#","")]) {
            that.dateRender(id.replace('#',''),false)
        }
        if (dataTable.Render.upload[id.replace('#','')]) {
            that.uploadRender(id.replace('#',''),false)
        }
        if (dataTable.Render.radio[id.replace('#','')]) {
            that.radioRender(id.replace('#',''),false,'radio')
        }
        if (dataTable.Render.checkbox[id.replace('#','')]) {
            that.radioRender(id.replace('#',''),false,'checkbox')
        }
    }
  
  // 日期渲染方法,分初始的列表渲染与单个渲染
  Class.prototype.dateRender = function(tableName,sigin) {
    if (sigin === false) { 
      for (var key in dataTable.Render.date[tableName]) {
        for (var i = 0;i<dataTable.Render.date[tableName][key].data.length;i++) {
            //初始数据回显
            var index =  $('#'+dataTable.Render.date[tableName][key].data[i]).parent().parent().attr("id").split("-")[1];
            var data = dataTable.cache[tableName][index][key];
          laydate.render({
            elem: '#'+dataTable.Render.date[tableName][key].data[i],
            trigger: 'click',
            value: data ? new Date(Number(data)): 0
          });
        }
      }
    } else if (sigin) {
      // 去缓存取最新的渲染  注意是date的缓存index
      for (var key in dataTable.Render.date[tableName]) {
        //  根据缓存回显数据
          laydate.render({
            elem: '#'+dataTable.Render.date[tableName][key].data[0].split('-')[0]+'-'+dataTable.Render.date[tableName][key].index,
            trigger: 'click',
          });
      }
    }
  }

  // 上传组件渲染方法
  Class.prototype.uploadRender = function(tableName,sigin) {
    var that = this;
    if (sigin) {
      for (var key in dataTable.Render.upload[tableName]) {
        upload.render({
          elem:'#'+dataTable.Render.upload[tableName][key].data[0].split('-')[0]+'-'+dataTable.Render.upload[tableName][key].index,
          url: that.config.upload.url,
          data: {
              'bucketName':that.config.upload.bucketName
          },
          uploaddisplay: {
              serverUrl: that.config.upload.serverUrl,
              idCallback:function (res,obj) { //url的回调
                  var index = obj.parent().parent().attr('id').split('-')[1];
                  var name = obj.parent().attr('tableId');
                  dataTable.cache[tableName][index][name] = res.data;
                  //展示
                  dataTable.cache.show = dataTable.cache[tableName];
              },
              urlCallback:function (res,obj) {
                  obj.prev().find('a')[0].innerText = res.data.contentType;
              },
            }
        });
      }
    } else {
      for (var key in dataTable.Render.upload[tableName]) {
        for (var i = 0;i<dataTable.Render.upload[tableName][key].data.length;i++) {
            //初始数据回显
            var index =  $('#'+dataTable.Render.upload[tableName][key].data[i]).parent().parent().attr("id").split("-")[1];
            var data = dataTable.cache[tableName][index][key];
          upload.render({
            elem:'#'+dataTable.Render.upload[tableName][key].data[i],
            url: that.config.upload.url,
            data: {
                'bucketName': that.config.upload.bucketName
            },
            uploaddisplay: {
                serverUrl: that.config.upload.serverUrl,
                fileId:data,
                idCallback:function (res,obj) { //url的回调  返回obj方便调控
                    var index = obj.parent().parent().attr('id').split('-')[1];
                    var name = obj.parent().attr('tableId');
                    dataTable.cache[tableName][index][name] = res.data;
                    //展示
                    dataTable.cache.show = dataTable.cache[tableName];
                },
                urlCallback:function (res,obj) { //obj为返回的按钮对象，方便修改定位
                   obj.prev().find('a')[0].innerText = res.data.contentType;
                },
              }
          });
        }
      }
    }
  }

  //下拉单选渲染方法
    Class.prototype.radioRender = function (tableName,sigin,type) {
        if (!xmSelect) {MSG("使用下拉选择请导入xmSelect");return}
        if (sigin) {
            for (var key in dataTable.Render[type][tableName]) {
                var name = xmSelect.render({
                    el: '#'+dataTable.Render[type][tableName][key].data[0].split('-')[0]+'-'+dataTable.Render[type][tableName][key].index,
                    radio: type === "radio"?true:false,
                    style: {
                        height: '100%',
                        border:'none',
                    },
                    model: {
                        label: {
                            type: 'xxxx',
                            // block: {
                            // //最大显示数量, 0:不限制
                            // showCount: 1,
                            // //是否显示删除图标
                            // showIcon: true,
                            // },
                            xxxx: {
                                template:function(data, sels){
                                    return '<div style="color: green;">已选中</div>'
                                }
                            },
                        }
                    },
                    on:function (data) {
                        var index = $('#'+dataTable.Render[type][tableName][key].data[0].split('-')[0]+'-'+dataTable.Render[type][tableName][key].index).parent().attr('id').split('-')[1];
                        var name =  $('#'+dataTable.Render[type][tableName][key].data[0].split('-')[0]+'-'+dataTable.Render[type][tableName][key].index).attr('tableId');
                        var valueList = [];
                        data.arr.forEach(function (item) {
                            valueList.push(item.value)
                        })
                        dataTable.cache[tableName][index][name] = valueList;
                        //展示
                        dataTable.cache.show = dataTable.cache[tableName];
                    },
                    autoRow: true,
                    data: dataTable.Render[type][tableName][key].valueList,
                });
            }
        } else {
            for (var key in dataTable.Render[type][tableName]) {
                $.each( dataTable.Render[type][tableName][key].data,function(i){
                    var name = xmSelect.render({
                        el: '#'+dataTable.Render[type][tableName][key].data[i],
                        radio: type === "radio"?true : false,
                        style: {
                            height: '100%',
                            border:'none',
                        },
                        model: {
                            label: {
                                type: 'xxxx',
                                // block: {
                                // //最大显示数量, 0:不限制
                                // showCount: 1,
                                // //是否显示删除图标
                                // showIcon: true,
                                // },
                                xxxx: {
                                    template:function(data, sels){
                                        return '<div style="color: green;">已选中</div>'
                                    }
                                },
                            }
                        },
                        on:function (data) {
                            var index = $('#'+dataTable.Render[type][tableName][key].data[i]).parent().attr('id').split('-')[1];
                            var name =  $('#'+dataTable.Render[type][tableName][key].data[i]).attr('tableId');
                            var valueList = [];
                            data.arr.forEach(function (item) {
                                valueList.push(item.value)
                            })
                            dataTable.cache[tableName][index][name] = valueList;
                            //展示
                            dataTable.cache.show = dataTable.cache[tableName];
                        },
                        autoRow: true,
                        data: dataTable.Render[type][tableName][key].valueList,
                    });

                    var index =  $('#'+dataTable.Render[type][tableName][key].data[i]).parent().attr("id").split("-")[1];
                    var data = dataTable.cache[tableName][index][key];
                    if (data) {
                        data = data.split(',')
                    }
                    if (data) {
                        name.setValue(data)
                    }
                })
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
      if (dataTable.Render.date[options.elem.replace('#','')]) { 
        that.dateRender(options.elem.replace('#',''),true);
      }
      if (dataTable.Render.upload[options.elem.replace('#','')]) {
            that.uploadRender(options.elem.replace('#',''),true)
      }
      if (dataTable.Render.radio[options.elem.replace('#','')]) {
        that.radioRender(options.elem.replace('#',''),true,"radio")
      }
      if (dataTable.Render.checkbox[options.elem.replace('#','')]) {
        that.radioRender(options.elem.replace('#',''),true,"checkbox")
      }

      // 缓存中新加一行
      dataTable.cache[options.elem.replace('#','')][dataTable.index[[options.elem.replace('#','')]]] = {};
        //展示
        dataTable.cache.show = dataTable.cache[options.elem.replace('#','')];
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
        //展示
        dataTable.cache.show = dataTable.cache[tableId.replace('#','')];


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
      // if (e.target.nodeName.toLowerCase() !== "button" && e.target.nodeName.toLowerCase() !== "input"  && e.target.nodeName.toLowerCase() !== "xm-select") {
      //  普通td
      if (e.target.nodeName.toLowerCase() === "td") {
        var index = $(this).parent().attr("id").split("-")[1];
        var name = $(this).attr("tableId");
        dataTable.cache[tableId.replace('#','')][index][name] =  $(this).text();
          //展示
          dataTable.cache.show = dataTable.cache[tableId.replace('#','')];
      }
      // 代理了日期
      if (e.target.nodeName.toLowerCase() === "input") {
        // 他这里这个是shadow-root隐藏元素，而且他还设置了mode：close的，草，拿不到值
        var index = $(this).parent().attr('id').split('-')[1];
        var name = $(this).attr('tableId');
        var id = $(this).children(':first').attr("id"); //取input框的id
        // 光标移除事件触发的时候，框内的值还没开始赋值，应延迟执行取值赋值，考虑卡顿，为100ms
        setTimeout(function(){
          lay('#'+id).each(function(i,item){
            dataTable.cache[tableId.replace('#','')][index][name] = item.value;
              //展示
              dataTable.cache.show = dataTable.cache[tableId.replace('#','')];
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