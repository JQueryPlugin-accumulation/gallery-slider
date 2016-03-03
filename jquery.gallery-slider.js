// liukai for design detail page
//2015.1.26 start
;(function() {
    var defaults = {
        thumbMargin: 0,
        thumbWidth: 0,

        imageWidth: 0,
        imageHeight: 0,
        speed: 400,

        loader: null,
        start_index: 0,
        showCount: false,

        // CALLBACKS
        afterImageVisible: function() { return true; },
    };

    $.fn.gallerySlider = function(options) {
        if (this.length === 0) {
            return this;
        }

        if (this.length > 1) {
            this.each(function() {
                $(this).gallery(options);
            });
        }

        var gallery = {},
            el = this;

        var init = function() {
            gallery.settings = $.extend({}, defaults, options);

            gallery.active = { index: gallery.settings.start_index };

            gallery.thumbs = el.find('.thumbs');
            gallery.wrapper = el.find('.image-wrapper');

            gallery.in_transtion = false;

            gallery.active.last =  gallery.thumbs.find('li').length - 1;
            gallery.totalCount =  gallery.thumbs.find('li').length;

            setup();
        };

        var setup = function() {
            gallery.thumbs.find('li').css({
                'margin-right': gallery.settings.thumbMargin,
                'width': gallery.settings.thumbWidth,
            });

            gallery.thumbs.find('ul').css({
                'position': 'relative',
                'width': getThumbListWidth(),
            });

            el.css({
                'width':gallery.settings.imageWidth
            });

            gallery.wrapper.css({
                'position': 'relative',
                'width': gallery.settings.imageWidth,
                'height': gallery.settings.imageHeight
            });

            if (gallery.settings.loader) {
                gallery.loader = $('<img class="gallery-loader" src=" '+ gallery.settings.loader + '">').hide();
                gallery.wrapper.prepend(gallery.loader);
                gallery.loader.hide();
            }

            gallery.images = [];
            gallery.currentImage = false;
            gallery.thumbs.find('li').each(function() {
                    var image = {image: $(this).data('src') ,
                                error: false,
                            preloaded: false,
                                 size: false};
                     gallery.images.push(image);
            });

            el.goToImage(gallery.active.index, true);

            bindAll();
        };

        var bindAll = function() {
            gallery.thumbs.delegate('li', 'click', function() {
                el.goToImage($(this).index());
            });
            gallery.wrapper.find('.btn-pre').click(function() {
                el.goToPreImage();
            });
            gallery.wrapper.find('.btn-next').click(function() {
                el.goToNextImage();
            });
        };

        var getThumbListWidth = function() {
            return (gallery.settings.thumbMargin + gallery.settings.thumbWidth) * gallery.thumbs.find('li').length;
        };

        var setPositionProperty= function(index) {
            var $ul = gallery.thumbs.find('ul');
            var $li = gallery.thumbs.find('li').eq(index);

            var left = (gallery.thumbs.width() - ($li.width() + gallery.settings.thumbMargin))/2 - $li.position().left;
            if (left > 0) {
                left = 0;
            } else if (left + $ul.width() < gallery.thumbs.width()) {
                left = gallery.thumbs.width() - $ul.width();
            }

            if ($ul.width() <= gallery.thumbs.width()) {
                left = 0;
            }

            $ul.stop().animate({
                'left' : left + 'px',
            }, gallery.settings.speed);
        };

        var showImage = function(index) {
            if (gallery.images[index]) {
                gallery.in_transtion = true;
                var image = gallery.images[index];
                if (!image.preloaded) {
                    gallery.loader.show();
                    preloadImage(index, function() {
                        gallery.loader.hide();
                        showWhenLoaded(index);
                    });
                } else {
                     showWhenLoaded(index);
                }
            }
        };

        var preloadImage = function(index, callback) {
            if (gallery.images[index]) {
                if (!gallery.images[index].preloaded) {
                    var image = gallery.images[index];
                    var img = $('<img />').attr( 'src', image.image);
                    if (isImageLoaded(img[0])) {
                        image.preloaded = true;
                        image.size = { width: img[0].width, height: img[0].height };
                        callback();
                    } else {
                        img.load(
                            function() {
                                image.preloaded = true;
                                image.size = { width: this.width, height: this.height };
                                callback();
                            }
                        ).error(
                            function() {
                                image.error = true;
                                image.preloaded = false;
                                image.size = false;
                            }
                        );
                    }
                } else {
                    callback();
                }
            }
        };

        var isImageLoaded = function(img) {
            if(typeof img.complete != 'undefined' && !img.complete) {
                return false;
            };
            if(typeof img.naturalWidth != 'undefined' && img.naturalWidth == 0) {
                return false;
            };
            return true;
        };

        var showWhenLoaded = function(index) {
            var image = gallery.images[index];
            var img_container = $('<div class="image-section">');
            var img = $(new Image()).attr('src', image.image);
            img_container.append(img);
            gallery.wrapper.find('.image-section').each(function() {
                $(this).remove();
            });
            var size = getContainedImageSize(image.size.width, image.size.height);
            img.css({
                'width': size.width,
                'height': size.height
            });
            img_container.css({
                'width': size.width,
                'height': size.height
            });

            gallery.wrapper.prepend(img_container);
            centerImage(img_container,size.width, size.height);

            var direction = 'right';

            if (gallery.active.index < index) {
                direction = 'left';
            }

            if (gallery.currentImage) {
                var animation = HorizontalSlideAnimation.call(this, img_container, direction);
                var old_image = gallery.currentImage;
                old_image.animate(animation.old_image, gallery.settings.speed, 'swing',
                    function() {
                        old_image.remove();
                    }
                );
                img_container.animate(animation.new_image, gallery.settings.speed, 'swing',
                    function() {
                        gallery.active.index = index;
                        gallery.in_transtion = false;
                        gallery.currentImage = img_container;
                        gallery.settings.afterImageVisible.call(el, index);
                        if (gallery.settings.showCount) {
                            gallery.settings.showCount.html(index + 1 +' / ' + gallery.totalCount);
                        }
                    }
                );
            } else {
                gallery.active.index = index;
                gallery.in_transtion = false;
                gallery.currentImage = img_container;
                gallery.settings.afterImageVisible.call(el, index);
                if (gallery.settings.showCount) {
                    gallery.settings.showCount.text(index + 1 +' / ' + gallery.totalCount);
                }
            }
        };

        function HorizontalSlideAnimation(img_container, direction) {
            var current_left = parseInt(img_container.css('left'), 10);
            if(direction == 'left') {
              var old_image_left = '-'+ gallery.settings.imageWidth +'px';
              img_container.css('left',gallery.settings.imageWidth +'px');
            } else {
              var old_image_left = gallery.settings.imageWidth +'px';
              img_container.css('left','-'+ gallery.settings.imageWidth +'px');
            };
            return {old_image: {left: old_image_left},
                    new_image: {left: current_left}};
        }

        var centerImage = function(img_container,image_width, image_height) {
            img_container.css('top', '0px');
            if(image_height < gallery.settings.imageHeight) {
                var dif = gallery.settings.imageHeight - image_height;
                img_container.css('top', (dif / 2) +'px');
            };
            img_container.css('left', '0px');
            if(image_width < gallery.settings.imageWidth) {
                var dif = gallery.settings.imageWidth - image_width;
                img_container.css('left', (dif / 2) +'px');
            };
        };

        var getContainedImageSize = function(image_width, image_height) {
            if(image_height > gallery.settings.imageHeight) {
                var ratio = image_width / image_height;
                image_height = gallery.settings.imageHeight;
                image_width = gallery.settings.imageHeight * ratio;
            };
            if(image_width > gallery.settings.imageWidth) {
                var ratio = image_height / image_width;
                image_width = gallery.settings.imageWidth;
                image_height = gallery.settings.imageWidth * ratio;
            };
            return {width: image_width, height: image_height};
        };

        el.preloadAll = function() {
            var i = 0;
            function preloadNext() {
                if(i < gallery.images.length) {
                  i++;
                  preloadImage(i, preloadNext);
                };
            };
            preloadImage(i, preloadNext);
        };

        el.goToNextImage = function() {
            if (gallery.active.index + 1 >= gallery.images.length) {
                 el.goToImage(0);
            } else  {
                 el.goToImage(gallery.active.index + 1);
            }
        };

        el.goToPreImage = function() {
            if (gallery.active.index - 1 < 0) {
                 el.goToImage(gallery.images.length - 1);
            } else  {
                 el.goToImage(gallery.active.index - 1);
            }
        };

        el.goToImage = function(index, first) {
            if (gallery.in_transtion) {
                return;
            }
            if (gallery.active.index == index && !first) {
                return;
            }
            gallery.thumbs.find('.active').removeClass('active');
            gallery.thumbs.find('li').eq(index).addClass('active');
            setPositionProperty(index);
            showImage(index);
        };

        el.destroySlider = function() {
            el.find('.image-wrapper .gallery-loader').remove();
            el.find('.image-wrapper .image-section').each(function() {
                $(this).remove();
            });
            el.find('.thumbs').undelegate('li', 'click');
            $(this).removeData('gallerySlider');
        };

        el.reloadSlider = function(settings) {
            if (settings !== undefined) {
                options = settings;
            }
            el.destroySlider();
            init();
            $(el).data('gallerySlider', this);
        };

        if ($(el).data('gallerySlider')) {
            el.reloadSlider(options);
        } else {
            init();
            $(el).data('gallerySlider', this);
        }

        return this;
    };
})();