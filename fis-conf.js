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
        jquery: '/static/common/js/mod/jquery',
        react: '/static/common/js/mod/react'
    }
});
/*指定哪些目录下的文件执行define包裹*/
fis.match('/static/common/js/mod/**', {
  isMod: true
});
fis.match('/static/common/components/**', {
  isMod: true,
  // packTo: '/staticPub/common/components/components_pkg.js'
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