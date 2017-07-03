/*!
 * photoslider.js
 * by 50048873@qq.com 2017-07-01
 * version: 3.0.0
**/
;(function($){
	/*
		*imgs传参形式
		1.图片大小一样
		var imgs = ['img/index-carousel-1.jpg', 'img/index-carousel-1.jpg', 'img/index-carousel-1.jpg', 'img/index-carousel-1.jpg']
		2.图片大小不一样（img必传，其它可选。只有当传入的图片大小不同时，才需要传入width, height）
		var list = [
			{
				img: "img/1.jpg",
				width: 400,
				height: 475,
				caption: "1全团青年发展工作研讨推进会召开  推进从严治团",
				href: "demo.html"
			},
			{
				img: "img/2.jpg",
				width: 512,
				height: 400,
				caption: "2全团青年发展工作研讨推进会召开  推进从严治团"
			},
			{
				img: "img/3.jpg",
				width: 609,
				height: 400,
				caption: "3全团青年发展工作研讨推进会召开  推进从严治团"
			}
		];
	*/

	Slider.defaults = { 
		currentIndex: 0,				//可选，Number, 记录了目前显示在屏幕上图片的索引
		imgs: undefined,				//必传，Array，接受图片json数据
		height: 'fullScreen',			//可选，Number或String, （固定数值，图片宽高比数值），'fullScreen', 'auto'
		displayCount: false,			//可选，Boolean，是否显示计数
		photoFill: false,				//可选，false: 图片按比例显示全；true: 图片按比例占满容器
		dotCls: '',						//可选，String, 添加在dots类所在的元素
		caption: false,					//可选，Boolean, 是否添加标题
		captionWithTag: false, 			//可选, Boolean, 标题中是否能添加标签
		showDots: true,					//可选，Boolean, 是否显示点
		interval: 2000,					//可选, Number, 自动播放速度
		auto: true, 					//可选, Boolean, 是否自动播放
		onClick: function(e) { }			//可选，Function, touchend结束执行的回调
	};

	//定义图片滑动构造函数
	function Slider(options, wrap) { 
		this.wrapDom = $(wrap);			//wrap：传入的容器元素
		$.extend(this, Slider.defaults, options);
		this.init();
	}

	Slider.prototype.init = function() { 
		if (Object.prototype.toString.call(this.imgs) !== "[object Array]") { 
			throw new Error('请传入图片列表数组');
			return;
		}
		this.transform = this.getSurportCss('transform');		//判断浏览器是否支持'transform'
		if (!this.transform) { 
			throw new Error('您的浏览器太旧，请升级到最新的浏览器！');
			return;
		}
		this.getRealHeight();									//获取容器的高度
		this.drawDom();											//渲染页面
		this.auto && this.autoPlay();							//自动播放
		this.monitorTouch();									//监听交互
	};

	Slider.prototype.getRealHeight = function() { 
		this.windowW = window.innerWidth;						//视口宽
		this.windowH = window.innerHeight;						//视口高
		if (this.height === "auto") { 
			this.realHeight = this.getContainerHeight();
		} else if (this.height === 'fullScreen') { 
			this.realHeight = this.windowH;
		} else if (this.height < 10) {  						//如果小于10，则认为是传为的宽高比
			this.realHeight = this.windowW / this.height;
		} else { 												//传入的数字
			this.realHeight = parseFloat(this.height);
		}
		return this.realHeight;
	};

	//获取横图中宽高比最小的比值（也就是最接近正方形的图）
	Slider.prototype.getContainerHeight = function() { 
		var imgs = this.imgs, len = imgs.length;
		for (var i = 0, arrW = []; i < len; i++) { 
			if (imgs[i].width / imgs[i].height >= 1) { 
				arrW.push(imgs[i]);
			} else if (typeof imgs[i].width !== 'number' || typeof imgs[i].height !== 'number') { 
				throw new Error('当高设置为自动计算时，传入的图片列表中必须要有图片的宽高');
			}
		}
		for (var j = 0, arr = []; j < arrW.length; j++) { 
			arr.push(arrW[j].width/arrW[j].height);
		}
		var minRadio = Math.min.apply(null, arr);
		return this.windowW/minRadio;
	};

	//获取图片路径
	Slider.prototype.getImgSrc = function(imgSrc) { 
		var src = '';
		if (typeof imgSrc === 'string') { 
			src = imgSrc;
		} else { 
			if (imgSrc.img) { 
				src = imgSrc.img;
			} else { 
				throw new Error('图片路径不对');
			}
		}
		return src;
	};

	//设置图片宽高
	Slider.prototype.getImgWH = function(imgWH) { 
		if (this.photoFill) { 
			if (imgWH.width / imgWH.height >= 1) { 
				return 'height="' + this.realHeight + '"' + ' style="max-width:none"';
			} 
			if (imgWH.width / imgWH.height < 1) { 
				return 'width="' + this.windowW + '"' + ' style="max-height:none"';
			}
		}
		return '';
	};

	//获取标题
	Slider.prototype.getCaption = function(obj) { 
		if (this.caption && this.captionWithTag) { 
			return '<div>' + obj.caption + '</div>'
		} else if (this.caption) { 
			return '<div>' + $('<i></i>').html(obj.caption).text() + '</div>'; 
		}
		return ''; 
	};

	//如果有caption，修正dots的位置
	Slider.prototype.fixDotsPosition = function() { 
		if (this.caption && this.$dotsEle) { 
			var capH = this.$ul.find('div').outerHeight();
			var dotH = this.$dotsEle.outerHeight();
			this.$dotsEle.css('bottom', (capH - dotH) / 2);
		}
	};

	//渲染数据到wrap元素
	Slider.prototype.drawDom = function() { 
		var imgs = this.imgs, len = imgs.length;
		var dotCls = this.dotCls ? (' ' + this.dotCls) : '';
		this.$ul = $('<ul>').css({ 
			'width': 100 * len + '%',
			'height': this.realHeight
		});
		//是否生成dots元素
		this.showDots && (this.$dotsEle = $('<div class="dots' + dotCls + '">')); 
		
		for (var i = 0; i < len; i++) { 
			var img = imgs[i];
			var li = ['<li>',
						'<a href="' + (img.href || "javascript:;") + '"><img ' + this.getImgWH(img) + ' src="' + this.getImgSrc(img) + '" alt="photo" /></a>',
						this.getCaption(img),
					'</li>'].join('');
			li = $(li).css({ 
				'width': this.windowW,
				'left': this.windowW * i
			});
			this.$ul.append(li);
			this.showDots && this.$dotsEle.append('<span></span>');
		}

		//是否显示数字进度
		if (this.displayCount) { 
			this.$countEle = $('<div class="count">');
			this.$countEle.append('<span>' + (this.currentIndex + 1) + '</span><span>\/</span><span>' + len + '</span>');
		}

		this.wrapDom.append(this.$ul.add(this.$dotsEle).add(this.$countEle));	//将生成的元素添加到wrapDom
		this.fixDotsPosition();													//修正dots的位置
		this.toggleDotsActive(0);												//初始化dots的active状态
	};

	//注册移动事件监听
	Slider.prototype.monitorTouch = function() { 
		var _this = this;
		var ul = this.$ul[0];
		ul.addEventListener('touchstart', fingerStart, false);
		ul.addEventListener('touchmove', fingerMove, false);
		ul.addEventListener('touchend', fingerEnd, false);

		//手指触摸
		function fingerStart(e) { 
			this.startPageX = e.touches[0].pageX;
		};

		//手指触摸后移动
		function fingerMove(e) {
			//阻止android滑动时的默认行为，重要！
			e.preventDefault(); 

			//记录偏移量 = 移动位置座标 - 开始位置座标
			this.offsetX = e.touches[0].pageX - this.startPageX;
			//获取li元素集合
			var lis = $(this).find('li');
			if (_this.currentIndex === 0 && this.offsetX > 0 || _this.currentIndex === (_this.imgs.length - 1) && this.offsetX < 0) { 
				this.offsetX /= 10;
			}
			
			//方案一：设置ul的transform
			_this.$ul.css(_this.transform, 'translate3d('+ (-_this.currentIndex * _this.windowW + this.offsetX) +'px, 0, 0)');

			//方案二：设置ul的left
			//_this.$ul.css('left', this.offsetX +'px');
		};

		//手指抬起
		function fingerEnd(e) { 
			//如果手指移动了，则阻止默认行为
			if (this.offsetX) e.preventDefault(); 
			//e.preventDefault()
			//翻页边界值
			var minMoveVal = _this.windowW/6;

			//方案二：恢复ul的left
			//_this.$ul.css('left', 0);

			//如果抬起值与按下值相同，说明是单击
			if (e.changedTouches[0].pageX == this.startPageX) { 
				_this.onClick.call(this, e);
				return;
			}

			if (this.offsetX < 0 && Math.abs(this.offsetX) > minMoveVal) {
				_this.currentIndex++; 
			} else if (this.offsetX < _this.windowW && this.offsetX > minMoveVal) { 
				_this.currentIndex--;
			}
			_this.goTo();
		};
	};

	// 根据索引切换点的active状态
	Slider.prototype.toggleDotsActive = function(arriveIndex) { 
		this.wrapDom.find('.dots span').eq(arriveIndex).addClass('active').siblings().removeClass('active');
		this.wrapDom.find('.count span').eq(0).text(arriveIndex + 1);
	};

	//返回浏览器支持的指定属性
	Slider.prototype.getSurportCss = function(prop) { 
		var div = document.createElement('div'),
			prefixs = 'webkit moz ms'.split(' '),
			len = prefixs.length;

		if ( prop in div.style ) return prop;

		var replaceStr = function(str){ 
			var reg = /\b(\w)|\s(\w)/g; //  \b判断边界\s判断空格
			return str.replace(reg,function(m){ 
				return m.toUpperCase()
			});
		}
		prop = replaceStr(prop);

		while(len--) {
			if ( prefixs[len] + prop in div.style ) {
				return prefixs[len] + prop;
			}
		}
		
		return false; 
	};

	//滑动到相应的图片
	Slider.prototype.goTo = function() { 
		//this.$ul.css('-webkit-transform', 'translate3d('+ this.windowW * -this.currentIndex +'px,0,0)');
		this.$ul.css(this.transform, 'translate3d('+ this.windowW * -this.currentIndex +'px,0,0)');

		//根据索引改变小点和或数字的状态
		this.toggleDotsActive(this.currentIndex);
	};

	//注册浏览器尺寸改变监听
	Slider.prototype.resize = function() { 
		var _this = this;
		addEventListener('resize', function() { 
			_this.wrapDom.children().remove();
			_this.init();
			//保证resize事件时，始终显示curentIndex索引图片
			_this.goTo();
		}, false);
	};

	//自动播放
	Slider.prototype.autoPlay = function() { 
		var _this = this;
		var autoPlay = function() { 
			if (_this.timer) clearInterval(_this.timer);
			_this.timer = setInterval(function() { 
				if (_this.currentIndex >= _this.imgs.length - 1){
					_this.currentIndex = 0;
				} else { 
					_this.currentIndex++;
				}
				_this.goTo();
			}, _this.interval);
		};
		autoPlay();

		var clearAutoPlay= function() { 
			clearInterval(_this.timer);
		};
		
		var ul = this.$ul[0];
		ul.addEventListener('touchstart', clearAutoPlay, false);
		ul.addEventListener('touchend', autoPlay, false);
	};

	$.fn.slider =  function(options){
		return this.each(function(index, ele) { 
			this.instance = new Slider(options, this);
		});
  	}

  	window.Slider = Slider;
})(jQuery);