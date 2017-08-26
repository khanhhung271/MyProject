/**
 * @author: Hung Bui
 * @version: v1.0.0
 */

!function ($) {
    'use strict';
    var getTotalPageIndex = function(data){
        var pageIndex = [];
        for(var i = 0; i < data.length; i++){
            var idx = +data[i].Page;
            if($.inArray(idx, pageIndex) < 0){
                pageIndex.push(idx); 
            } 
        }
        return pageIndex;
    };
    // it only does '%s', and return '' when arguments are undefined
    var sprintf = function (str) {
        var args = arguments,
            flag = true,
            i = 1;

        str = str.replace(/%s/g, function () {
            var arg = args[i++];

            if (typeof arg === 'undefined') {
                flag = false;
                return '';
            }
            return arg;
        });
        return flag ? str : '';
    };
    var getPropertyFromOther = function (list, from, to, value) {
        var result = '';
        $.each(list, function (i, item) {
            if (item[from] === value) {
                result = item[to];
                return false;
            }
            return true;
        });
        return result;
    };

    var getFieldIndex = function (columns, field) {
        var index = -1;

        $.each(columns, function (i, column) {
            if (column.field === field) {
                index = i;
                return false;
            }
            return true;
        });
        return index;
    };

    // http://jsfiddle.net/wenyi/47nz7ez9/3/
    var setFieldIndex = function (columns) {
        var i, j, k,
            totalCol = 0,
            flag = [];

        for (i = 0; i < columns[0].length; i++) {
            totalCol += columns[0][i].colspan || 1;
        }

        for (i = 0; i < columns.length; i++) {
            flag[i] = [];
            for (j = 0; j < totalCol; j++) {
                flag[i][j] = false;
            }
        }

        for (i = 0; i < columns.length; i++) {
            for (j = 0; j < columns[i].length; j++) {
                var r = columns[i][j],
                    rowspan = r.rowspan || 1,
                    colspan = r.colspan || 1,
                    index = $.inArray(false, flag[i]);

                if (colspan === 1) {
                    r.fieldIndex = index;
                    // when field is undefined, use index instead
                    if (typeof r.field === 'undefined') {
                        r.field = index;
                    }
                }

                for (k = 0; k < rowspan; k++) {
                    flag[i + k][index] = true;
                }
                for (k = 0; k < colspan; k++) {
                    flag[i][index + k] = true;
                }
            }
        }
    };

    var getScrollBarWidth = function () {
        if (cachedWidth === null) {
            var inner = $('<p/>').addClass('fixed-table-scroll-inner'),
                outer = $('<div/>').addClass('fixed-table-scroll-outer'),
                w1, w2;

            outer.append(inner);
            $('body').append(outer);

            w1 = inner[0].offsetWidth;
            outer.css('overflow', 'scroll');
            w2 = inner[0].offsetWidth;

            if (w1 === w2) {
                w2 = outer[0].clientWidth;
            }

            outer.remove();
            cachedWidth = w1 - w2;
        }
        return cachedWidth;
    };

    var calculateObjectValue = function (self, name, args, defaultValue) {
        var func = name;

        if (typeof name === 'string') {
            // support obj.func1.func2
            var names = name.split('.');

            if (names.length > 1) {
                func = window;
                $.each(names, function (i, f) {
                    func = func[f];
                });
            } else {
                func = window[name];
            }
        }
        if (typeof func === 'object') {
            return func;
        }
        if (typeof func === 'function') {
            return func.apply(self, args);
        }
        if (!func && typeof name === 'string' && sprintf.apply(this, [name].concat(args))) {
            return sprintf.apply(this, [name].concat(args));
        }
        return defaultValue;
    };

    var compareObjects = function (objectA, objectB, compareLength) {
        // Create arrays of property names
        var objectAProperties = Object.getOwnPropertyNames(objectA),
            objectBProperties = Object.getOwnPropertyNames(objectB),
            propName = '';

        if (compareLength) {
            // If number of properties is different, objects are not equivalent
            if (objectAProperties.length !== objectBProperties.length) {
                return false;
            }
        }

        for (var i = 0; i < objectAProperties.length; i++) {
            propName = objectAProperties[i];

            // If the property is not in the object B properties, continue with the next property
            if ($.inArray(propName, objectBProperties) > -1) {
                // If values of same property are not equal, objects are not equivalent
                if (objectA[propName] !== objectB[propName]) {
                    return false;
                }
            }
        }

        // If we made it this far, objects are considered equivalent
        return true;
    };

    var escapeHTML = function (text) {
        if (typeof text === 'string') {
            return text
                .replace(/&/g, '&amp;')
                .replace(/</g, '&lt;')
                .replace(/>/g, '&gt;')
                .replace(/"/g, '&quot;')
                .replace(/'/g, '&#039;')
                .replace(/`/g, '&#x60;');
        }
        return text;
    };

    var getRealHeight = function ($el) {
        var height = 0;
        $el.children().each(function () {
            if (height < $(this).outerHeight(true)) {
                height = $(this).outerHeight(true);
            }
        });
        return height;
    };

    var getRealDataAttr = function (dataAttr) {
        for (var attr in dataAttr) {
            var auxAttr = attr.split(/(?=[A-Z])/).join('-').toLowerCase();
            if (auxAttr !== attr) {
                dataAttr[auxAttr] = dataAttr[attr];
                delete dataAttr[attr];
            }
        }

        return dataAttr;
    };

    var getItemField = function (item, field, escape) {
        var value = item;

        if (typeof field !== 'string' || item.hasOwnProperty(field)) {
            return escape ? escapeHTML(item[field]) : item[field];
        }
        var props = field.split('.');
        for (var p in props) {
            value = value && value[props[p]];
        }
        return escape ? escapeHTML(value) : value;
    };

    var isIEBrowser = function () {
        return !!(navigator.userAgent.indexOf("MSIE ") > 0 || !!navigator.userAgent.match(/Trident.*rv\:11\./));
    };

    var objectKeys = function () {
        // From https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/keys
        if (!Object.keys) {
            Object.keys = (function() {
                var hasOwnProperty = Object.prototype.hasOwnProperty,
                    hasDontEnumBug = !({ toString: null }).propertyIsEnumerable('toString'),
                    dontEnums = [
                        'toString',
                        'toLocaleString',
                        'valueOf',
                        'hasOwnProperty',
                        'isPrototypeOf',
                        'propertyIsEnumerable',
                        'constructor'
                    ],
                    dontEnumsLength = dontEnums.length;

                return function(obj) {
                    if (typeof obj !== 'object' && (typeof obj !== 'function' || obj === null)) {
                        throw new TypeError('Object.keys called on non-object');
                    }

                    var result = [], prop, i;

                    for (prop in obj) {
                        if (hasOwnProperty.call(obj, prop)) {
                            result.push(prop);
                        }
                    }

                    if (hasDontEnumBug) {
                        for (i = 0; i < dontEnumsLength; i++) {
                            if (hasOwnProperty.call(obj, dontEnums[i])) {
                                result.push(dontEnums[i]);
                            }
                        }
                    }
                    return result;
                };
            }());
        }
    };
    $.extend($.fn.bootstrapTable.defaults, {
        pageIndex: false,
        pageIndexVAlign: 'bottom',
        pageIndexHAlign: 'right'
    });
    var BootstrapTable = $.fn.bootstrapTable.Constructor,
        _init = BootstrapTable.prototype.init,
        _onSearch = BootstrapTable.prototype.onSearch;
    BootstrapTable.prototype.init = function(){
        this.initLocale();
        this.initContainer();
        this.initTable();
        this.initHeader();
        this.initData();
        this.initFooter();
        this.initToolbar();
        this.initPagination();
        if(typeof this.options.pageIndex != 'undefined'){
            if(this.options.pageIndex){
                this.initPageIndex();
                this.initBodyWithPageIndex();
            }
        } else {
            this.initBody();
        }
        this.initSearchText();
        this.initServer();
    };
    BootstrapTable.prototype.initContainer = function () {
        this.$container = $([
            '<div class="bootstrap-table">',
            '<div class="fixed-table-toolbar"></div>',
            this.options.paginationVAlign === 'top' || this.options.paginationVAlign === 'both' ?
                '<div class="fixed-table-pagination" style="clear: both;"></div>' :
                '',
            typeof this.options.pageIndexVAlign === 'undefined' ? '' : 
            (this.options.pageIndexVAlign === 'top' || this.options.pageIndexVAlign === 'both' ?
                '<div class="fixed-table-pageindex" style="clear: both;"></div>' :
                ''),
            '<div class="fixed-table-container">',
            '<div class="fixed-table-header"><table></table></div>',
            '<div class="fixed-table-body">',
            '<div class="fixed-table-loading">',
            this.options.formatLoadingMessage(),
            '</div>',
            '</div>',
            '<div class="fixed-table-footer"><table><tr></tr></table></div>',
            this.options.paginationVAlign === 'bottom' || this.options.paginationVAlign === 'both' ?
                '<div class="fixed-table-pagination"></div>' :
                '',
            typeof this.options.pageIndexVAlign === 'undefined' ? '' : 
            (this.options.pageIndexVAlign === 'bottom' || this.options.pageIndexVAlign === 'both' ?
                '<div class="fixed-table-pageindex"></div>' :
                ''),
            '</div>',
            '</div>'
        ].join(''));

        this.$container.insertAfter(this.$el);
        this.$tableContainer = this.$container.find('.fixed-table-container');
        this.$tableHeader = this.$container.find('.fixed-table-header');
        this.$tableBody = this.$container.find('.fixed-table-body');
        this.$tableLoading = this.$container.find('.fixed-table-loading');
        this.$tableFooter = this.$container.find('.fixed-table-footer');
        this.$toolbar = this.$container.find('.fixed-table-toolbar');
        this.$pagination = this.$container.find('.fixed-table-pagination');
        //adding pageIndex element
        this.$pageIndex = this.$container.find('.fixed-table-pageindex');
        this.$tableBody.append(this.$el);
        this.$container.after('<div class="clearfix"></div>');

        this.$el.addClass(this.options.classes);
        if (this.options.striped) {
            this.$el.addClass('table-striped');
        }
        if ($.inArray('table-no-bordered', this.options.classes.split(' ')) !== -1) {
            this.$tableContainer.addClass('table-no-bordered');
        }        
    };
    BootstrapTable.prototype.initPageIndex = function(){
        var that = this,
            html = [],
            i, from, to,
            $first, $pre,
            $next, $last,
            $number,
            data = this.getData();
        if(data.length == 0){
            return;
        }
        this.listPageIndex = getTotalPageIndex(data);
        var totalPageIndex = this.listPageIndex.length;
        if(typeof this.options.pageIndexHAlign == 'undefined'){
            this.options.pageIndexHAlign = 'right';
        }
        html.push(
            '<div class="pull-' + this.options.pageIndexHAlign + ' pagination pagination-index">',
            '<ul class="pagination' + sprintf(' pagination-%s', this.options.iconSize) + '">',
            '<li class="page-index-pre"><a href="javascript:void(0)">' + this.options.paginationPreText + '</a></li>'
        );
        if(typeof this.options.pageIndexNumber === "undefined"){
            this.options.pageIndexNumber = this.listPageIndex[0];
        }
        if(totalPageIndex > 0 && this.options.pageIndexNumber > this.listPageIndex[totalPageIndex-1]){
            this.options.pageIndexNumber = this.listPageIndex[totalPageIndex-1];
        }
        // if (totalPageIndex < 5) {
        //     from = this.listPageIndex[0];
        //     to = this.listPageIndex[totalPageIndex-1];
        // } else {
        //     from = this.options.pageIndexNumber - 2;
        //     to = from + 4;
        //     if (from < 1) {
        //         from = 1;
        //         to = 5;
        //     }
        //     if (to > totalPage) {
        //         to = totalPage;
        //         from = to - 4;
        //     }
        // }
        // if (totalPage >= 6) {
        //     if (this.options.pageIndexNumber >= 3) {
        //         html.push('<li class="page-index-first' + (1 === this.options.pageIndexNumber ? ' active' : '') + '">',
        //             '<a href="javascript:void(0)">', 1, '</a>',
        //             '</li>');

        //         from++;
        //     }

        //     if (this.options.pageIndexNumber >= 4) {
        //         if (this.options.pageIndexNumber == 4 || totalPage == 6 || totalPage == 7) {
        //             from--;
        //         } else {
        //             html.push('<li class="page-index-first-separator disabled">',
        //                 '<a href="javascript:void(0)">...</a>',
        //                 '</li>');
        //         }

        //         to--;
        //     }
        // }

        // if (totalPage >= 7) {
        //     if (this.options.pageIndexNumber >= (totalPage - 2)) {
        //         from--;
        //     }
        // }

        // if (totalPage == 6) {
        //     if (this.options.pageIndexNumber >= (totalPage - 2)) {
        //         to++;
        //     }
        // } else if (totalPage >= 7) {
        //     if (totalPage == 7 || this.options.pageIndexNumber >= (totalPage - 3)) {
        //         to++;
        //     }
        // }

        for (i = 0; i < totalPageIndex; i++) {
            html.push('<li class="page-index-number' + (this.listPageIndex[i] === this.options.pageIndexNumber ? ' active' : '') + '">',
                '<a href="javascript:void(0)">', this.listPageIndex[i], '</a>',
                '</li>');
        }

        // if (totalPage >= 8) {
        //     if (this.options.pageIndexNumber <= (totalPage - 4)) {
        //         html.push('<li class="page-index-last-separator disabled">',
        //             '<a href="javascript:void(0)">...</a>',
        //             '</li>');
        //     }
        // }

        // if (totalPage >= 6) {
        //     if (this.options.pageIndexNumber <= (totalPage - 3)) {
        //         html.push('<li class="page-index-last' + (totalPage === this.options.pageIndexNumber ? ' active' : '') + '">',
        //             '<a href="javascript:void(0)">', totalPage, '</a>',
        //             '</li>');
        //     }
        // }

        html.push(
            '<li class="page-index-next"><a href="javascript:void(0)">' + this.options.paginationNextText + '</a></li>',
            '</ul>',
            '</div>');
        this.$pageIndex.html(html.join(''));
        
        $first = this.$pageIndex.find('.page-index-first');
        $pre = this.$pageIndex.find('.page-index-pre');
        $next = this.$pageIndex.find('.page-index-next');
        $last = this.$pageIndex.find('.page-index-last');
        $number = this.$pageIndex.find('.page-index-number');
        if (this.options.smartDisplay) {
            if (this.listPageIndex.length <= 1) {
                this.$pageIndex.find('div.pagination-index').hide();
            }
            // when data is empty, hide the pagination
            this.$pageIndex[this.getData().length ? 'show' : 'hide']();
        }
        $first.off('click').on('click', $.proxy(this.onPageIndexFirst, this));
        $pre.off('click').on('click', $.proxy(this.onPageIndexPre, this));
        $next.off('click').on('click', $.proxy(this.onPageIndexNext, this));
        $last.off('click').on('click', $.proxy(this.onPageIndexLast, this));
        $number.off('click').on('click', $.proxy(this.onPageIndexNumber, this));
    };
    BootstrapTable.prototype.onPageIndexFirst = function(event){
        if(this.data.length){
            //if(typeof this.data[0].Page != 'undefined'){
                this.options.pageIndexNumber = this.listPageIndex[0];
                this.updatePageIndex(event);
            //}
        }
        //this.options.pageIndexNumber = 1;
        //this.updatePageIndex(event);
    };
    BootstrapTable.prototype.onPageIndexPre = function(event){
        var idx = $.inArray(this.options.pageIndexNumber, this.listPageIndex);
        if (idx == 0) {
            this.options.pageIndexNumber = this.listPageIndex[this.listPageIndex.length-1];
        } else {
            this.options.pageIndexNumber = this.listPageIndex[--idx];
        }
        this.updatePageIndex(event);
    };
    BootstrapTable.prototype.onPageIndexNext = function (event) {
        var idx = $.inArray(this.options.pageIndexNumber, this.listPageIndex);
        if (idx == this.listPageIndex.length) {
            this.options.pageIndexNumber = this.listPageIndex[0];
            this.updatePageIndex(event);
            // if(this.data.length){
            //     if(typeof this.data[0].Page != 'undefined'){
            //         this.options.pageIndexNumber = +this.data[0].Page;
            //         this.updatePageIndex(event);
            //     }
            // }
            //this.options.pageIndexNumber = 1;
        } else {
            this.options.pageIndexNumber = this.listPageIndex[++idx];
        }
        this.updatePageIndex(event);
    };
    BootstrapTable.prototype.onPageIndexLast = function (event) {
        this.options.pageIndexNumber = this.listPageIndex[this.listPageIndex.length - 1];
        this.updatePageIndex(event);
    };

    BootstrapTable.prototype.onPageIndexNumber = function (event) {
        if (this.options.pageIndexNumber === +$(event.currentTarget).text()) {
            return;
        }
        this.options.pageIndexNumber = +$(event.currentTarget).text();
        this.updatePageIndex(event);
    };
    BootstrapTable.prototype.updatePageIndex = function (event) {
        // Fix #171: IE disabled button can be clicked bug.
        if (event && $(event.currentTarget).hasClass('disabled')) {
            return;
        }

        if (!this.options.maintainSelected) {
            this.resetRows();
        }

        this.initPageIndex();
        this.initBodyWithPageIndex();

        this.trigger('page-change', this.options.pageIndexNumber);
    };
    BootstrapTable.prototype.initBodyWithPageIndex = function(fixedScroll){
        var that = this,
            html = [],
            data = this.getData();
        this.trigger('pre-body', data);
        this.$body = this.$el.find('>tbody');
        if(!this.$body.length){
            this.$body = $('<tbody></tbody>').appendTo(this.$el);
        }
        var pageItems = [];
        for(var i = 0; i < data.length; i++){
            if(data[i].Page == this.options.pageIndexNumber){
                pageItems.push(data[i]);
            }
        }
        for(var i = 0; i < pageItems.length; i++){
            var key,
                item = pageItems[i],
                style = {},
                csses = [],
                data_ = '',
                attributes = {},
                htmlAttributes = [];
            style = calculateObjectValue(this.options, this.options.rowStyle, [item, i], style);
            if (style && style.css) {
                for (key in style.css) {
                    csses.push(key + ': ' + style.css[key]);
                }
            }

            attributes = calculateObjectValue(this.options,
                this.options.rowAttributes, [item, i], attributes);

            if (attributes) {
                for (key in attributes) {
                    htmlAttributes.push(sprintf('%s="%s"', key, escapeHTML(attributes[key])));
                }
            }

            if (item._data && !$.isEmptyObject(item._data)) {
                $.each(item._data, function (k, v) {
                    // ignore data-index
                    if (k === 'index') {
                        return;
                    }
                    data_ += sprintf(' data-%s="%s"', k, v);
                });
            }

            html.push('<tr',
                sprintf(' %s', htmlAttributes.join(' ')),
                sprintf(' id="%s"', $.isArray(item) ? undefined : item._id),
                sprintf(' class="%s"', style.classes || ($.isArray(item) ? undefined : item._class)),
                sprintf(' data-index="%s"', i),
                sprintf(' data-uniqueid="%s"', item[this.options.uniqueId]),
                sprintf('%s', data_),
                '>'
            );

            if (this.options.cardView) {
                html.push(sprintf('<td colspan="%s"><div class="card-views">', this.header.fields.length));
            }

            if (!this.options.cardView && this.options.detailView) {
                html.push('<td>',
                    '<a class="detail-icon" href="javascript:">',
                    sprintf('<i class="%s %s"></i>', this.options.iconsPrefix, this.options.icons.detailOpen),
                    '</a>',
                    '</td>');
            }
            
            $.each(this.header.fields, function (j, field) {
                var text = '',
                    value = getItemField(item, field, that.options.escape),
                    type = '',
                    cellStyle = {},
                    id_ = '',
                    class_ = that.header.classes[j],
                    data_ = '',
                    rowspan_ = '',
                    colspan_ = '',
                    title_ = '',
                    column = that.columns[j];

                if (that.fromHtml && typeof value === 'undefined') {
                    return;
                }

                if (!column.visible) {
                    return;
                }

                if (that.options.cardView && !column.cardVisible) {
                    return;
                }

                style = sprintf('style="%s"', csses.concat(that.header.styles[j]).join('; '));

                // handle td's id and class
                if (item['_' + field + '_id']) {
                    id_ = sprintf(' id="%s"', item['_' + field + '_id']);
                }
                if (item['_' + field + '_class']) {
                    class_ = sprintf(' class="%s"', item['_' + field + '_class']);
                }
                if (item['_' + field + '_rowspan']) {
                    rowspan_ = sprintf(' rowspan="%s"', item['_' + field + '_rowspan']);
                }
                if (item['_' + field + '_colspan']) {
                    colspan_ = sprintf(' colspan="%s"', item['_' + field + '_colspan']);
                }
                if (item['_' + field + '_title']) {
                    title_ = sprintf(' title="%s"', item['_' + field + '_title']);
                }
                cellStyle = calculateObjectValue(that.header,
                    that.header.cellStyles[j], [value, item, i, field], cellStyle);
                if (cellStyle.classes) {
                    class_ = sprintf(' class="%s"', cellStyle.classes);
                }
                if (cellStyle.css) {
                    var csses_ = [];
                    for (var key in cellStyle.css) {
                        csses_.push(key + ': ' + cellStyle.css[key]);
                    }
                    style = sprintf('style="%s"', csses_.concat(that.header.styles[j]).join('; '));
                }

                value = calculateObjectValue(column,
                    that.header.formatters[j], [value, item, i], value);

                if (item['_' + field + '_data'] && !$.isEmptyObject(item['_' + field + '_data'])) {
                    $.each(item['_' + field + '_data'], function (k, v) {
                        // ignore data-index
                        if (k === 'index') {
                            return;
                        }
                        data_ += sprintf(' data-%s="%s"', k, v);
                    });
                }

                if (column.checkbox || column.radio) {
                    type = column.checkbox ? 'checkbox' : type;
                    type = column.radio ? 'radio' : type;

                    text = [sprintf(that.options.cardView ?
                        '<div class="card-view %s">' : '<td class="bs-checkbox %s">', column['class'] || ''),
                        '<input' +
                        sprintf(' data-index="%s"', i) +
                        sprintf(' name="%s"', that.options.selectItemName) +
                        sprintf(' type="%s"', type) +
                        sprintf(' value="%s"', item[that.options.idField]) +
                        sprintf(' checked="%s"', value === true ||
                        (value && value.checked) ? 'checked' : undefined) +
                        sprintf(' disabled="%s"', !column.checkboxEnabled ||
                        (value && value.disabled) ? 'disabled' : undefined) +
                        ' />',
                        that.header.formatters[j] && typeof value === 'string' ? value : '',
                        that.options.cardView ? '</div>' : '</td>'
                    ].join('');

                    item[that.header.stateField] = value === true || (value && value.checked);
                } else {
                    value = typeof value === 'undefined' || value === null ?
                        that.options.undefinedText : value;

                    text = that.options.cardView ? ['<div class="card-view">',
                        that.options.showHeader ? sprintf('<span class="title" %s>%s</span>', style,
                            getPropertyFromOther(that.columns, 'field', 'title', field)) : '',
                        sprintf('<span class="value">%s</span>', value),
                        '</div>'
                    ].join('') : [sprintf('<td%s %s %s %s %s %s %s>',
                        id_, class_, style, data_, rowspan_, colspan_, title_),
                        value,
                        '</td>'
                    ].join('');

                    // Hide empty data on Card view when smartDisplay is set to true.
                    if (that.options.cardView && that.options.smartDisplay && value === '') {
                        // Should set a placeholder for event binding correct fieldIndex
                        text = '<div class="card-view"></div>';
                    }
                }

                html.push(text);
            });

            if (this.options.cardView) {
                html.push('</div></td>');
            }

            html.push('</tr>');
        }
        // show no records
        if (!html.length) {
            html.push('<tr class="no-records-found">',
                sprintf('<td colspan="%s">%s</td>',
                    this.$header.find('th').length, this.options.formatNoMatches()),
                '</tr>');
        }

        this.$body.html(html.join(''));

        if (!fixedScroll) {
            this.scrollTo(0);
        }
        // click to select by column
        this.$body.find('> tr[data-index] > td').off('click dblclick').on('click dblclick', function (e) {
            var $td = $(this),
                $tr = $td.parent(),
                item = that.data[$tr.data('index')],
                index = $td[0].cellIndex,
                fields = that.getVisibleFields(),
                field = fields[that.options.detailView && !that.options.cardView ? index - 1 : index],
                column = that.columns[getFieldIndex(that.columns, field)],
                value = getItemField(item, field, that.options.escape);

            if ($td.find('.detail-icon').length) {
                return;
            }

            that.trigger(e.type === 'click' ? 'click-cell' : 'dbl-click-cell', field, value, item, $td);
            that.trigger(e.type === 'click' ? 'click-row' : 'dbl-click-row', item, $tr, field);

            // if click to select - then trigger the checkbox/radio click
            if (e.type === 'click' && that.options.clickToSelect && column.clickToSelect) {
                var $selectItem = $tr.find(sprintf('[name="%s"]', that.options.selectItemName));
                if ($selectItem.length) {
                    $selectItem[0].click(); // #144: .trigger('click') bug
                }
            }
        });

        this.$body.find('> tr[data-index] > td > .detail-icon').off('click').on('click', function () {
            var $this = $(this),
                $tr = $this.parent().parent(),
                index = $tr.data('index'),
                row = data[index]; // Fix #980 Detail view, when searching, returns wrong row

            // remove and update
            if ($tr.next().is('tr.detail-view')) {
                $this.find('i').attr('class', sprintf('%s %s', that.options.iconsPrefix, that.options.icons.detailOpen));
                $tr.next().remove();
                that.trigger('collapse-row', index, row);
            } else {
                $this.find('i').attr('class', sprintf('%s %s', that.options.iconsPrefix, that.options.icons.detailClose));
                $tr.after(sprintf('<tr class="detail-view"><td colspan="%s"></td></tr>', $tr.find('td').length));
                var $element = $tr.next().find('td');
                var content = calculateObjectValue(that.options, that.options.detailFormatter, [index, row, $element], '');
                if($element.length === 1) {
                    $element.append(content);
                }
                that.trigger('expand-row', index, row, $element);
            }
            that.resetView();
        });

        this.$selectItem = this.$body.find(sprintf('[name="%s"]', this.options.selectItemName));
        this.$selectItem.off('click').on('click', function (event) {
            event.stopImmediatePropagation();

            var $this = $(this),
                checked = $this.prop('checked'),
                row = that.data[$this.data('index')];

            if (that.options.maintainSelected && $(this).is(':radio')) {
                $.each(that.options.data, function (i, row) {
                    row[that.header.stateField] = false;
                });
            }

            row[that.header.stateField] = checked;

            if (that.options.singleSelect) {
                that.$selectItem.not(this).each(function () {
                    that.data[$(this).data('index')][that.header.stateField] = false;
                });
                that.$selectItem.filter(':checked').not(this).prop('checked', false);
            }

            that.updateSelected();
            that.trigger(checked ? 'check' : 'uncheck', row, $this);
        });
        $.each(this.header.events, function (i, events) {
            if (!events) {
                return;
            }
            // fix bug, if events is defined with namespace
            if (typeof events === 'string') {
                events = calculateObjectValue(null, events);
            }

            var field = that.header.fields[i],
                fieldIndex = $.inArray(field, that.getVisibleFields());

            if (that.options.detailView && !that.options.cardView) {
                fieldIndex += 1;
            }

            for (var key in events) {
                that.$body.find('>tr:not(.no-records-found)').each(function () {
                    var $tr = $(this),
                        $td = $tr.find(that.options.cardView ? '.card-view' : 'td').eq(fieldIndex),
                        index = key.indexOf(' '),
                        name = key.substring(0, index),
                        el = key.substring(index + 1),
                        func = events[key];

                    $td.find(el).off(name).on(name, function (e) {
                        var index = $tr.data('index'),
                            row = that.data[index],
                            value = row[field];

                        func.apply(this, [e, value, row, index]);
                    });
                });
            }
        });
        this.updateSelected();
        this.resetView();

        this.trigger('post-body', data);
    };
    BootstrapTable.prototype.onSearch = function (event) {
        if(this.options.pageIndex){
            var text = $.trim($(event.currentTarget).val());

            // trim search input
            if (this.options.trimOnSearch && $(event.currentTarget).val() !== text) {
                $(event.currentTarget).val(text);
            }

            if (text === this.searchText) {
                return;
            }
            this.searchText = text;
            this.options.searchText = text;

            //this.options.pageIndexNumber = 1;
            this.initSearch();
            if(this.data.length){            
                if(typeof this.data[0].Page != 'undefined'){
                    this.totalPageIndex = getTotalPageIndex(this.data).length;
                    this.options.pageIndexNumber = +this.data[0].Page;
                    this.updatePageIndex();
                }            
            } else {
                this.totalPageIndex = 0;
                this.updatePageIndex();
            }
            this.trigger('search', text);
        } else {
            _onSearch.apply(this, Array.prototype.slice.apply(arguments));
        }
        //this.totalPageIndex = this.data.length;
        //this.updatePageIndex();
        //this.trigger('search', text);
    };
    BootstrapTable.prototype.initSearchText = function () {
        if (this.options.search) {
            if (this.options.searchText !== '') {
                var $search = this.$toolbar.find('.search input');
                $search.val(this.options.searchText);
                this.onSearch({currentTarget: $search});
            }
        }
    };
}(jQuery);