&emsp;&emsp;经历过杂乱的js函数式编程的人在认识了模块化和模块加载器之后，一定觉得是一种福音。模块化让我们更加有组织有模块地去编写我们的代码，模块化加载器让我们更加方便和清晰地进行模块定义和依赖管理。现在主要的模块化规范是commonJS，AMD和CMD，commonJS主要是用于node服务端，AMD和CMD主要用于浏览器端，代表框架分别是requireJS和seaJS；作为前端，当然更熟悉的是requireJS和seaJS，但是对于我个人而言，commonJS的编码方式我更喜欢，因为简单，无需使用define包装。<br>
&emsp;&emsp;如今，要特别感谢前端工程化的出现，让commonJS的编码方式在前端变成可能，比如我们熟悉的Browserify，当然作为国内最强大的前端工程化工具——fis，当然也对模块化也有自己的实现。下面我们来学习一下fis3是如何实现模块化构建的。当然你也可以直接阅读官方文档：[fis3模块化](http://fex-team.github.io/fis3/docs/lv3.html#%E6%A8%A1%E5%9D%97%E5%8C%96%E5%BC%80%E5%8F%91)<br>
&emsp;&emsp;模块化框架一般包含了组件依赖分析、保持加载并保持依赖顺序等功能。但在 FIS 中，依赖本身在构建过程中就已经分析完成，并记录在静态资源映射表中，那么对于线上运行时，模块化框架就可以省掉依赖分析这个步骤了。<br>
&emsp;&emsp;fis3中针对前端模块化框架的特性自动添加define包装，以及根据配置生成对应的require依赖标识主要是通过对应的模块化插件实现的：<br>
[fis3-hook-commonjs](https://github.com/fex-team/fis3-hook-commonjs)<br>
[fis3-hook-amd](https://github.com/fex-team/fis3-hook-amd)<br>
[fis3-hook-cmd](https://github.com/fex-team/fis3-hook-cmd)<br>
生成了规范的模块文件之后，如何将模块之间的依赖关系生成静态资源映射表，则是通过<br>
[fis3-postpackager-loader](https://github.com/fex-team/fis3-postpackager-loader)<br>
这个插件用于分析页面中使用的和依赖的资源（js或css）, 并将这些资源做一定的优化后插入页面中。<br>
下面我们结合栗子来学习一下这些模块化插件是如何工作的。先看看我们专题页项目的目录结构！
```
static/ #项目静态文件目录
      common/ #公共静态文件目录
            js/
              lib/ #类库文件
                 mod.js
                 require.js
                 sea.js
              mod/ #需要模块化的文件
                 react.js
                 jquery.js
            css/ #css文件目录
               style.css
            images/ #图片文件目录
               style.png
            commponents/ #公共组件，也是需要模块化加载的
                       HelloMessage/
                                   HelloMessage.jsx
                                   HelloMessage.css
     helloworld/ #简单的例子
              index.html
              index.css
              index.jsx
fis-conf.js #fis配置文件
package.json
```
####commonJS模块化
在浏览器环境运行的代码，我们希望采用commonJS规范作为模块化开发，则需要安装[fis3-hook-commonjs](https://github.com/fex-team/fis3-hook-commonjs)插件，`npm install fis3-hook-commonjs --save`，还要配合[mod.js](https://github.com/fex-team/mod/blob/master/mod.js)来使用；
```
###fis-conf.js
/*设置编译范围*/
fis.set('project.files', ['static/**']);
/*设置发布路径*/
fis.match(/\/static\/(.*)/i, {
    release: '/staticPub/$1', /*所有资源发布时产出到 /staticPub 目录下*/
    url: '/staticPub/$1' /*所有资源访问路径设置*/
});
/*指定模块化插件*/
fis.hook('commonjs', {
    paths: {
        jquery: '/static/common/js/mod/jquery', //设置jquery别名
        react: '/static/common/js/mod/react' //设置react别名
    }
});
/*指定哪些目录下的文件执行define包裹*/
fis.match('/static/common/js/mod/**', {
  isMod: true
});
fis.match('/static/common/components/**', {
  isMod: true
});
fis.match('/static/helloworld/**', {
  isMod: true
});
/*模块化加载器配置*/
fis.match('::package', {
  postpackager: fis.plugin('loader', {
    allInOne: true, //js&css打包成一个文件
    sourceMap: true, //是否生成依赖map文件
    useInlineMap: true //是否将sourcemap作为内嵌脚本输出
  })
});
/*支持react*/
fis.match('*.jsx', {
    rExt: '.js',
    parser: fis.plugin('react', {})
});
```
注意：需要对目标文件设置 isMod 属性，说明这些文件是模块化代码。这样才会被自动包装成 amd，才能在浏览器里面运行。[fis3-postpackager-loader](https://github.com/fex-team/fis3-postpackager-loader)的作用则是分析这些文件的依赖关系并生成对应的sourceMap文件，让mod.js分析并加载模块对应的文件到浏览器中。
```
#helloworld/index.html
<!DOCTYPE html>
<html>
<head>
	<title>繁星网 | 全球最大音乐现场直播平台</title>
	<meta charset="utf-8">
	<link rel="stylesheet" type="text/css" href="/static/common/css/style.css">
	<link rel="stylesheet" type="text/css" href="./css/index.css">
</head>
<body>
	<div id="helloApp"></div>
</body>
<script type="text/javascript" src="/static/common/js/lib/mod.js"></script>
<script type="text/javascript">
require(['./index']);//异步加载index.js模块
</script>
</html>

#helloworld/index.jsx
//引入React和HelloMessage模块
var React = require('react');
var HelloMessage = require('/static/common/components/HelloMessage/HelloMessage.react');
React.render(
  <HelloMessage message="I like commonjs!" />,
  document.getElementById('helloApp')
);

#common/components/HelloMessage/HelloMessage.react.jsx
var React = require('react');
var HelloMessage = React.createClass({
  	render: function() {
	    return (
	      	<h1>Hello, {this.props.message}</h1>
	    );
	}
});
module.exports = HelloMessage;
```
helloworld/index.html需要引入mod.js作为模块化加载器，然后通过require([./index])异步加载index模块；
helloworld/index.jsx依赖React和HelloMessage模块，写法就是我们熟悉的commonJS的方式；
common/components/HelloMessage/index.jsx就是HelloMessage模块，它也依赖React模块；
从上面的jsx文件我们可以轻易地发现，不管是react还是jsx文件都没有任何define包装，写法就commonJS一模一样，但是这样在浏览器肯定是跑不起来的，还需要fis帮我们构建模块包装和依赖分析。OK，一切准备就绪，我们就开始执行fis脚本：
```
fis3 release -d ./
```
我们来看看staticPub目录下面产出的编译文件：
```
#helloworld/index.html
<!DOCTYPE html>
<!DOCTYPE html>
<html>
<head>
	<title>繁星网 | 全球最大音乐现场直播平台</title>
	<meta charset="utf-8">
    <link rel="stylesheet" type="text/css" href="/staticPub/helloworld/index.html_aio.css" />
</head>
<body>
	<div id="helloApp"></div>
  <script type="text/javascript" src="/staticPub/common/js/lib/mod.js"></script>
  <script type="text/javascript">/*resourcemap*/
  require.resourceMap({
    "res": {
      "static/common/js/mod/react": {
        "url": "/staticPub/common/js/mod/react.js",
        "type": "js"
      },
      "static/common/components/HelloMessage/HelloMessage.react": {
        "url": "/staticPub/common/components/HelloMessage/HelloMessage.react.js",
        "type": "js",
        "deps": [
          "static/common/js/mod/react"
        ]
      },
      "static/helloworld/index": {
        "url": "/staticPub/helloworld/index.js",
        "type": "js",
        "deps": [
          "static/common/js/mod/react",
          "static/common/components/HelloMessage/HelloMessage.react"
        ]
      }
    },
    "pkg": {}
  });
  require(['static/helloworld/index']);//异步加载index.js模块
  </script>
</body>
</html>
```
我们来看看有哪些变化：<br>
1、index.html中css文件被打包成一个
&lt;link rel="stylesheet" type="text/css" href="/static/common/css/style.css"&gt;<br>
&lt;link rel="stylesheet" type="text/css" href="./css/index.css"&gt;<br>
变成了一个<br>
&lt;link rel="stylesheet" type="text/css" href="/staticPub/helloworld/index.html_aio.css" /&gt;<br>
2、上面的index.html多了一份sourceMap脚本；
这是因为在fis3-postpackager-loader的配置中加了useInlineMap:true，可以阅读[文档](https://github.com/fex-team/fis3-postpackager-loader)了解更多配置。<br>
我们再来看看helloworld/index.jsx和HellowMessage/HelloMessage.react.jsx的变化：
```
#hellowrold/index.js
define('static/helloworld/index', function(require, exports, module) {
  //引入React和HelloMessage模块
  var React = require('static/common/js/mod/react');
  var HelloMessage = require('static/common/components/HelloMessage/HelloMessage.react');
  React.render(
    React.createElement(HelloMessage, {message: "I like commonjs!"}),
    document.getElementById('helloApp')
  );
});

#common/components/HelloMessage/HelloMessage.react.js
define('static/common/components/HelloMessage/HelloMessage.react', function(require, exports, module) {
  var React = require('static/common/js/mod/react');
  var HelloMessage = React.createClass({displayName: "HelloMessage",
    	render: function() {
  	    return (
  	      	React.createElement("h1", null, "Hello, ", this.props.message)
  	    );
  	}
  });
  module.exports = HelloMessage;
});

#common/js/mod/react.js
define('static/common/js/mod/react', function(require, exports, module) {
 //react code...
}
```
1、所有的.jsx变成了.js文件，这是fis3-parser-react插件做的；
2、js文件都加了define包装，比如"static/helloworld/index"是index模块的moduleId;
3、require('react')编译成了require('static/common/js/mod/react')，因为我们通过path配置了别名；
我们可以发现，通过fis生成的js代码define的moduleId跟index.html中sourceMap的moduleId是一致的。这样mod.js就能通过map的依赖关系加载到所有的模块啦！下面是demo在浏览器中的运行结果截图：
![mod.js运行结果](http://ued.fanxing.com/content/images/2015/12/ND-5--I8-VT412BYGXF8F-G.png)
以上就是通过fis3-hook-commonjs实现模块化的过程，当然插件还有一些配置项供开发人员配置，感兴趣的同学可以通过阅读[fis3-hook-commonjs](http://https://github.com/fex-team/fis3-hook-commonjs)的文档自行了解。
####AMD模块化
首先安装[fis3-hook-amd](https://github.com/fex-team/fis3-hook-amd)插件，`npm install fis3-hook-amd --save`。
如果我们理解fis3-hook-commonjs的使用方式，换成fis3-hook-amd就很简单，使用方式的唯一的不同就是hook的插件由commonjs变为amd：
```
fis.hook('amd', {
    paths: {
        jquery: '/static/common/js/mod/jquery',
        react: '/static/common/js/mod/react'
    }
});
```
当然此时我们的模块化框架要用require.js啦！所以index.html我们要把mod.js换成require.js。<br>
`<script type="text/javascript" src="/static/common/js/lib/require.js"></script>`<br>
执行fis3编译：`fis3-release -d ./`<br>
下面我们看看编译之后的产出文件：
```
#helloworld/index.html
<!DOCTYPE html>
<html>
<head>
	<title>繁星网 | 全球最大音乐现场直播平台</title>
	<meta charset="utf-8">
    <link rel="stylesheet" type="text/css" href="/staticPub/helloworld/index.html_aio.css" />
</head>
<body>
	<div id="helloApp"></div>
  <script type="text/javascript" src="/staticPub/common/js/lib/require.js"></script>
  <script type="text/javascript">/*resourcemap*/
  require.config({paths:{
    "static/common/js/mod/jquery": "/staticPub/common/js/mod/jquery",
    "static/common/js/mod/react": "/staticPub/common/js/mod/react",
    "static/common/components/HelloMessage/HelloMessage.react": "/staticPub/common/components/HelloMessage/HelloMessage.react",
    "static/helloworld/index": "/staticPub/helloworld/index"
  }});
  require(['static/helloworld/index']);//异步加载index.js模块
</script>
</body>
</html>

#helloworld/index.js
define('static/helloworld/index', ['require', 'exports', 'module', 'static/common/js/mod/react', 'static/common/components/HelloMessage/HelloMessage.react'], function(require, exports, module) {
  //引入React和HelloMessage模块
  var React = require('static/common/js/mod/react');
  var HelloMessage = require('static/common/components/HelloMessage/HelloMessage.react');
  React.render(
    React.createElement(HelloMessage, {message: "I like AMD!"}),
    document.getElementById('helloApp')
  );
});

#common/components/HelloMessage/HelloMessage.js
define('static/common/components/HelloMessage/HelloMessage.react', ['require', 'exports', 'module', 'static/common/js/mod/react'], function(require, exports, module) {
  var React = require('static/common/js/mod/react');
  var HelloMessage = React.createClass({displayName: "HelloMessage",
    	render: function() {
  	    return (
  	      	React.createElement("h1", null, "Hello, ", this.props.message)
  	    );
  	}
  });
  module.exports = HelloMessage;
});
```
注意，index.html内嵌脚本生成的sourceMap变成下面的格式，因为是AMD规范嘛：
```
require.config({paths:{
    "static/common/js/mod/jquery": "/staticPub/common/js/mod/jquery",
    "static/common/js/mod/react": "/staticPub/common/js/mod/react",
    "static/common/components/HelloMessage/HelloMessage.react": "/staticPub/common/components/HelloMessage/HelloMessage.react",
    "static/helloworld/index": "/staticPub/helloworld/index"
  }});
```
js文件被包装成了遵循AMD规范的define形式。下面是demo执行结果：
![fis3-hook-amd](http://ued.fanxing.com/content/images/2015/12/XP-M---XE-W0-EZ2-4-UJ-U.png)

####CMD模块化
安装[fis3-hook-cmd](https://github.com/fex-team/fis3-hook-cmd)插件，`npm install fis3-hook-cmd --save`。
该fis-conf.js配置文件:
```
/*指定模块化插件*/
fis.hook('cmd', {
    paths: {
        jquery: '/static/common/js/mod/jquery',
        react: '/static/common/js/mod/react'
    }
});
```
改index.html模块加载器：<br>
`<script type="text/javascript" src="/static/common/js/lib/sea.js"></script>`<br>
异步加载入口index模块改为：<br>
`seajs.use(['./index']);//异步加载index.js模块`<br>
执行fis3编译：`fis3-release -d ./`<br>
注意：运行完成之后你会发现程序无法运行，因为react模块找不到，为什么呢？一般情况下，我们下载的开源框架都自己实现了amd包装，比如react的源码：<br>
```
/**
 * React v0.13.0
 */
(function(f) {
	if (typeof exports === "object" && typeof module !== "undefined") {
		module.exports = f()
        //注意看这里，这就是默认是用amd
	} else if (typeof define === "function" && define.amd) {
		define([], f)
	} else {
		var g;
		if (typeof window !== "undefined") {
			g = window
		} else if (typeof global !== "undefined") {
			g = global
		} else if (typeof self !== "undefined") {
			g = self
		} else {
			g = this
		}
		g.React = f()
	}
})(function() {
	var define, module, exports;
        //这里才是react的内部实现，源码会返回一个React对象
	return React;
});
```
对于这类框架fis3-hook-amd会识别define.amd并将define([], f)替换成define('static/common/js/mod/react', [], f)，但是我们运行fis3-hook-cmd就无法识别了，所以就无法通过define定义模块，define([], f)不会有任何变化。我们把define.cmd再运行一下fis就会发现了define([], f)变成了define('static/common/js/mod/react', [], f)。

再看看编译之后的产出文件：
```
#helloworld/index.html
<!DOCTYPE html>
<html>
<head>
	<title>繁星网 | 全球最大音乐现场直播平台</title>
	<meta charset="utf-8">
    <link rel="stylesheet" type="text/css" href="/staticPub/helloworld/index.html_aio.css" />
</head>
<body>
	<div id="helloApp"></div>
	<script type="text/javascript" src="/staticPub/common/js/lib/sea.js"></script>
	<script type="text/javascript">/*resourcemap*/
	seajs.config({alias:{
	  "static/common/js/mod/react": "/staticPub/common/js/mod/react",
	  "static/common/components/HelloMessage/HelloMessage.react": "/staticPub/common/components/HelloMessage/HelloMessage.react",
	  "static/helloworld/index": "/staticPub/helloworld/index"
	}});

	// require(['./index']);//异步加载index.js模块
	seajs.use(['static/helloworld/index']);//异步加载index.js模块
</script>
</body>
</html>

#helloworld/index.js
define('static/helloworld/index', ['static/common/js/mod/react', 'static/common/components/HelloMessage/HelloMessage.react'], function(require, exports, module) {
  //引入React和HelloMessage模块
  var React = require('static/common/js/mod/react');
  var HelloMessage = require('static/common/components/HelloMessage/HelloMessage.react');
  React.render(
    React.createElement(HelloMessage, {message: "I like CMD!"}),
    document.getElementById('helloApp')
  );
});

#common/components/HelloMessage/HelloMessage.js
define('static/common/components/HelloMessage/HelloMessage.react', ['static/common/js/mod/react'], function(require, exports, module) {
  var React = require('static/common/js/mod/react');
  var HelloMessage = React.createClass({displayName: "HelloMessage",
    	render: function() {
  	    return (
  	      	React.createElement("h1", null, "Hello, ", this.props.message)
  	    );
  	}
  });
  module.exports = HelloMessage;
});
```
再来看看index.html内嵌脚本生成的sourceMap：
```
seajs.config({alias:{
	  "static/common/js/mod/react": "/staticPub/common/js/mod/react",
	  "static/common/components/HelloMessage/HelloMessage.react": "/staticPub/common/components/HelloMessage/HelloMessage.react",
	  "static/helloworld/index": "/staticPub/helloworld/index"
	}});

```
查看结果：
![fis3-hook-cmd](http://ued.fanxing.com/content/images/2015/12/5ES---W92T--T-7ABK-VA5R.png)

因为工程化，让模块化变得简单，可复用！你不用在乎使用你模块的人是使用commonJS还是seaJS还是requireJS作为模块加载器，你只需要专心开发你的模块，并通过require加载你要依赖的模块即可。怎么样？是不是很爽？那就用起来吧~
