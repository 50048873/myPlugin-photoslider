'use strict';

module.exports = function (grunt) { 
	// 智能加载grunt任务插件
	require('load-grunt-tasks')(grunt);

	grunt.initConfig({ 
		pkg: grunt.file.readJSON('package.json'),

		// 清除dest目录
		clean: { 
			dest: ['dest']
		},

		// 压缩js
		uglify: { 
			options: { 
				mangle: true,	//安全压缩，不压缩参数变量
				compress: { 
					drop_console: true //去掉js中的console.*语句
				}
			},
			dest: { 
				src: 'js/jquery.photoslider.js',
		    	dest: 'js/jquery.photoslider.min.js'
			}
		},

		// 连接一个本地的静态服务器
		connect: {
			options: {
				port: 9000,
				hostname: '*', //默认就是这个值，可配置为本机某个 IP，localhost 或域名
				livereload: 35729  //声明给 watch 监听的端口
			},

			server: {
				options: {
					open: true, //自动打开网页 http://
					base: [
						'./'  //主目录
					]
				}
			}
		},

		// 监听指定的目录
		watch: {
			livereload: {
				options: {
					livereload: '<%=connect.options.livereload%>'  //监听前面声明的端口  35729
				},

				files: [  //下面文件的改变就会实时刷新网页
					'./index.html',
					'./css/{,*/}*.css',
					'./js/{,*/}*.js',
					'./img/{,*/}*.{png,jpg}'
				]
			}
		}
	});

	grunt.registerTask('serve', [
		'connect:server',
		'watch'
	]);

	grunt.registerTask('default', ['clean', 'uglify']);
};