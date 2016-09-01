/**
	Author: Patel Dharmesh Hemaram 
	Name : Grid system 
	Require: jQuery(version 1.11.1) , font-awesome-icons
	Created On: 29th Oct 2014 
	Description: This plugin is used to create the Grid with the given headers and data which is loaded through ajax call made to server. It contain sortable, selectable, filterable, expandable, pagination,select all,master search.
 */
var globalFilterFlag = false;
(function($) {
    $.widget("x.grid", {
        options: {
            isSortable: false,
            isSelectable: false,
            isFilterable: false,
            isCountChange: false,
            isMasterSearch: false,
            start: 0,
            count: 10,
            arrows: {
                downArrow: '',
                upArrow: '',
                rightArrow: '',
                leftArrow: ''
            },
            arrowsClass: {
                downArrow: 'fa-caret-down',
                upArrow: 'fa-caret-up',
                rightArrow: 'fa-caret-right',
                leftArrow: 'fa-caret-left'
            },
            countList: [5, 10, 15, 20],
            backgroundColorGradient: ['#78909C', '#90A4AE','#B0BEC5', '#CFD8DC','#ECEFF1']
        },
        _create: function() {
            // This is the init method which is called very first
            // As Headers are the mandatory fields while creating grids Headers cant be empty
            if (!this.options.headers || this.options.headers.length === 0) {
                log("headers is not defined", true);
                return;
            }

            // As responseData are the mandatory fields while creating grids responseData cant be empty
            if (!this.options.responseData || !($.isArray(this.options.responseData))) {
                log("responseData is not defined properly:" + this.options.responseData, true);
                return;
            }

            // Clear the existing element
            this.element.text('').addClass("x-grid");
            if (this.options.xClass) {
                this.element.addClass(this.options.xClass);
            }
            this.gridHolder = $("<div>").appendTo(this.element);
            this.table = $("<table cellpadding='0' cellspacing='0' width='100%'>").addClass('grid').appendTo(this.gridHolder);
            this.thead = $("<thead>").appendTo(this.table);
            this.tbody = $("<tbody>").appendTo(this.table);

            this._createHeader();
            this._pagination();
            this._createCFGButton();
            this._createEditable();
            this.options.removedData = [];
            // To check if any data is passed while initializing
            if (this.options.responseData && $.isArray(this.options.responseData) && this.options.responseData.length !== 0) {
                this._initiate();
            }
        },
        _initiate: function() {

            // Adding Index to the data which helps in performing operation
            for (var index = 0; index < this.options.responseData.length; index++) {
                this.options.responseData[index].xGridIndex = index;
            }
            var sortingColumn = this.thead.find("[is-sortable]").attr("item");
            // If Hierarchical grid is enabled sorting of data will be disabled.
            if (this.options.isExpandable || !sortingColumn || sortingColumn == '') {
                this.currentData = this.options.responseData;
            } else {
                // Sorting the data into asec order repect to first column
                this.currentData = this._sortList(this.options.responseData, sortingColumn, true);
            }
            this._updateGrid();
        },

        getSelected: function() {
            // This method is used to get the items element which are selected
            var data = [];
            for (var index in this.options.responseData) {
                // Get the selected rows
                if (this.options.responseData[index].xGridSelected) {
                    data[data.length] = this.options.responseData[index];
                }
            }
            return data;
        },
        getCurrentData: function() {
            // This method is used to get the items element which are selected
            var data = this.currentData;
            return data;
        },
        refresh: function() {
            // This method is used to get the items element which are selected
            this._updateGrid();
        },

        clearSelected: function(data) {
            // This method is used to clear the items element which are selected
            for (var index in this.options.responseData) {
                // Get the selected rows
                if (this.options.responseData[index].xGridSelected) {
                    for (var key in this.options.responseData[index]) {
                        if ($.inArray(key, this.keys) >= 0) {
                            if (!data[key]) {
                                delete this.options.responseData[index][key];
                            } else {
                                this.options.responseData[index][key] = data[key];
                            }
                        }
                    }
                    this.options.responseData[index].isEdited = true;
                }
            }
            this._initiate();
        },

        selectAll: function(flag) {
            var flag = flag != undefined && !flag ? false : true;
            // This method is used to get the items element which are selected
            for (var index in this.options.responseData) {
                this.options.responseData[index].xGridSelected = flag;
            }
            this._initiate();
            return true;
        },
        removeSelected: function() {
            // This method is used to get the items element which are selected
            var responseData = this.options.responseData.slice(0);
            var deleteIndex = 0;
            var deleteFlag = false;
            for (var dataIndex = 0; dataIndex < this.options.responseData.length; dataIndex++) {
                if (this.options.responseData[dataIndex].xGridSelected) {
                    deleteFlag = true;
                } else {
                    deleteFlag = false;
                }
                if (deleteFlag) {
                    this.options.responseData[dataIndex].xGridRemoved = true;
                    this.options.removedData.push(this.options.responseData[dataIndex]);
                    responseData.splice(deleteIndex, 1);
                } else {
                    deleteIndex++;
                }
            }
            this.options.responseData = responseData;
            this.currentData = this.options.responseData;
            // This is to reset the page initial to 1 if the records are less than no of count
            if (this.currentData.length <= this.options.count) {
                this.options.start = 0;
            }
            this._initiate();
            return true;
        },
        // This method is used to remove the items element which are selected
        getRemoved: function() {
            return this.options.removedData;
        },
        clear: function() {
            this.options.responseData = [];
            this.options.start = 0;
            return true;
        },
        getEdited: function() {
            // This method is used to get the items element which are selected
            var data = [];
            for (var index in this.options.responseData) {
                // Get the selected rows
                if (this.options.responseData[index].isEdited) {
                    data[data.length] = this.options.responseData[index];
                }
            }
            return data;
        },
        data: function(data) {
            // No value passed, act as a getter.
            if (!data) {
                return this.options.responseData;
            }
            if (data && $.isArray(data)) {
                for (var index in data) {
                    this.options.responseData[this.options.responseData.length] = data[index];
                }
                // Value passed, act as a setter.
                this._initiate();
            }
        },
        _pagination: function() {
            // This method is used to add the pagination button on the top of the grid section
            var $this = this;
            this.options.origin_count = this.options.count;
            var pagination = $("<div>").addClass("pagination").prependTo(this.element);
            this.pagination = pagination;
            var table = $("<table cellpadding='0' cellspacing='0' width='100%'>").appendTo(pagination);
            var thead = $("<thead>").appendTo(table);
            var tr = $("<tr>").appendTo(thead);

            // If the header text is passed
            if (this.options.headerText) {
                $("<th>").appendTo(tr).text(this.options.headerText).addClass('headerText');
            }

            // Showing pagination button column
            // Creating previous button and its event on click
            var th = $("<th>").css({
                textAlign: 'right',
                fontSize: '14px'
            }).appendTo(tr);
            $("<span>&nbsp;</span>").appendTo(th);
            this.prev = $("<i>").addClass('fa').addClass("fa-arrow-left").click(function() {
                if ($(this).attr("disabled") || $(this).hasClass('disabled')) {
                    return;
                }
                $this.options.start = $this.options.start - $this.options.count;
                $this._updateGrid();
            }).appendTo(th).hide().html(this.options.arrows.leftArrow);

            // Creating the pagination info span in between next and prev button
            this.paginationColumn = $("<span>").addClass('page-info').appendTo(th);
            this.paginationTemplate = $("<span>").html("Page <input type='text' x-force='num,nflt' style='width:20px'> of <span class='total'></span>");
            this.paginationTemplate.find("input").change(function() {
                var value = parseInt($(this).val());
                if ($.trim($(this).val()) == "" || value <= 0) {
                    value = 1;
                } else if ((parseInt(value) - 1) * $this.options.count > $this.currentDataLength) {
                    value = parseInt($this.currentDataLength / $this.options.count) + 1;
                }
                $this.options.start = (value - 1) * $this.options.count;
                $this._updateGrid();
            }).on("keydown", function(event) {
                if (event.keyCode === 13) {
                    log("Preventing enter key");
                    event.preventDefault();
                }
            });
            this.paginationColumn.html(this.paginationTemplate).hide();

            // Creating next button and its event on click
            this.next = $("<i>").addClass('fa').addClass("fa-arrow-right").click(function() {
                if ($(this).attr("disabled") || $(this).hasClass('disabled')) {
                    return;
                }
                $this.options.start = $this.options.start + $this.options.count;
                $this._updateGrid();
            }).appendTo(th).hide().html(this.options.arrows.rightArrow);

            if (this.options.isCountChange) {
                // Creating count drop down to change the no of rows par page
                th = $("<th>").css({
                    width: '70px',
                    textAlign: 'right'
                }).appendTo(tr);
                this.countDD = $("<select>").change(function() {
                    if ($(this).attr("disabled") || $(this).hasClass('disabled')) {
                        return;
                    }
                    $this.options.start = 0;
                    $this.options.count = parseInt($(this).val());
                    $this._updateGrid();
                }).appendTo(th).hide();

                $.each(this.options.countList, function(i, el) {
                    $this.countDD.append("<option value='" + el + "'>" + el + "</option>");
                });
                this.countDD.val(this.options.count);
            }

            // Showing record column
            th = $("<th>").css({
                width: '170px',
                textAlign: 'right'
            }).appendTo(tr);
            this.showColumn = $("<span>").addClass('record-info').appendTo(th);
            this.showTemplate = "Showing {start} - {end} of {total} records";
            this._viewAll(tr);
            this._createMasterSearch(tr);
        },
        _viewAll: function(tr) {
            // This section is used to view all the records at a time.
            var $this = this;
            if (this.options.isViewAll) {

                var th = $("<th>").css({
                    width: '135px',
                    textAlign: 'center'
                }).appendTo(tr);
                this.viewAll = $("<button type='button'>").appendTo(th).html('VIEW ALL').addClass("small").addClass('grey').css("width", 124).on("click", function() {
                    // Adding input field to each header and binding index up even to it
                    if ($this.masterSearchInput) {
                        $this.masterSearchInput.val('');
                    }
                    // This line is to clear the input of the master search input
                    if ($(this).attr("view-all") == 'true') {
                        $(this).attr("view-all", false).html('VIEW ALL');
                        $this.options.count = $this.options.origin_count;
                        // This is for view ALL
                        if ($this.options.withScroll) {
                            if ($('html').is('.ie6, .ie7, .ie8, .ie9')) {
                                $this.gridHolder.css({
                                    "height": "auto",
                                    "overflow-y": "auto",
                                    "overflow-x": "auto"
                                });
                            } else {
                                $this.tbody.removeClass("scroll");
                                $this.thead.removeClass("scroll");
                                $this.tbody.css("height", "auto");
                                $this.pagination.css("paddingRight", 2);
                            }
                        }
                        if ($this.options.paginationScroll) {
                            $this.gridHolder.css({
                                "height": "auto",
                                "overflow-y": "auto",
                                "overflow-x": "auto"
                            });
                        }
                    } else {
                        // This is for view ALL
                        if ($this.options.withScroll) {
                            if ($('html').is('.ie6, .ie7, .ie8, .ie9')) {
                                $this.gridHolder.css({
                                    "height": $this.tbody.find("tr:eq(0)").outerHeight() * (parseInt($this.options.origin_count) + 2),
                                    "overflow-y": "auto",
                                    "overflow-x": "hidden"
                                });
                            } else {
                                $this.tbody.addClass("scroll");
                                $this.thead.addClass("scroll");
                                $this.tbody.css("height", $this.tbody.find("tr:eq(0)").outerHeight() * $this.options.origin_count);
                                $this.pagination.css("paddingRight", 18);
                            }
                        }
                        if ($this.options.paginationScroll) {
                            $this.gridHolder.css({
                                "height": $this.tbody.find("tr:eq(0)").outerHeight() * (parseInt($this.options.origin_count) + 2),
                                "overflow-y": "auto",
                                "overflow-x": "hidden"
                            });
                        }
                        $(this).attr("view-all", true).html('PAGE VIEW');
                        $this.options.count = $this.options.responseData.length;
                    }
                    $this.options.start = 0;
                    $this.currentData = $this.options.responseData;
                    $this._updateGrid();
                });
            }
        },
        _createMasterSearch: function(tr) {
            var $this = this;
            if (this.options.isMasterSearch) {
                var th = $("<th>").css({
                    width: '150px',
                    textAlign: 'right'
                }).appendTo(tr);
                // Adding input field to each header and binding index up even to it
                // Appending input. For more details refer defect : 61915
                this.masterSearchInput = $("<input type='text'>").attr("placeholder", "Search").appendTo(th).on("keyup input", function() {
                    setTimeout(function() {
                        $this.thead.find("th input").val('');
                        var filter = {};
                        $this.options.start = 0;
                        if ($.trim($(this).val()) != '') {
                            for (var index in $this.options.headers) {
                                filter[$this.options.headers[index].key] = $.trim($(this).val());
                            }

                            // this function is used to match the data with the given data
                            var matchElement = function(element) {
                                for (var index in this) {
                                    if (this[index]) {
                                        var value = element[index] ? element[index].removeHTMLTag() : "";
                                        // i is for ignoreCase
                                        if (new RegExp(this[index].escapeRegExp(), 'i').test(value)) {
                                            return true;
                                        }
                                    }
                                }
                                return false;
                            };
                            $this.currentData = $this.options.responseData.filter(matchElement, filter);
                        } else {
                            $this.currentData = $this.options.responseData;
                        }
                        $this._updateGrid();
                    }, 1);
                });
            }
        },
        _createHeader: function() {
            // This method creates the grid header
            var options = this.options;
            this.keys = [];
            var tr = $("<tr>").appendTo(this.thead);
            for (var index in options.headers) {
                if (options.headers[index]) {
                    var columnHeader = $('<div>').append($("<span>").html(options.headers[index].text));
                    var th = $("<th>").attr("item", options.headers[index].key).append(columnHeader).appendTo(tr);
                    if (options.headers[index].isFilterable && options.isFilterable) {
                        th.attr("is-filterable", true);
                    }
                    if (options.headers[index].isSortable) {
                        th.attr("is-sortable", true);
                    }
                    if (options.headers[index].css) {
                        th.css(options.headers[index].css);
                    }
                    this.keys.push(options.headers[index].key);
                }
            }
            this.keys.push("errors");
            this.keys.push("xGridSelected");
            this._applyFilterable();
            this._applySortable();
            this._applyResizable();
        },
        _applyResizable: function() {
            if (this.options.isResizable) {
                var $this = this;
                this.pressed = false;
                this.pressStart = undefined;
                this.pressStartX, this.pressStartWidth;

                this.thead.find("th").mousedown(function(e) {
                    $this.pressStart = $(this);
                    $this.pressed = true;
                    $this.pressStartX = e.pageX;
                    $this.pressStartWidth = $(this).width();
                    $($this.pressStart).addClass("resizing");
                });

                $(document).mousemove(function(e) {
                    if ($this.pressed) {
                        $($this.pressStart).width($this.pressStartWidth + (e.pageX - $this.pressStartX));
                    }
                });

                $(document).mouseup(function() {
                    if ($this.pressed) {
                        $($this.pressStart).removeClass("resizing");
                        $this.pressed = false;
                    }
                });
            }
        },

        _applySortable: function() {
            // This method is used to create elements in header which helps in data sorting either asec / desc
            var options = this.options;
            var $this = this;

            this.thead.find("[is-sortable]").each(function(i) {
                // Iterate all shorting column
                var columnHeader = $(this).find("div");
                var sortArrowHolder = $("<i>").addClass('sort fa').css("padding-left", 3);
                if ($this.options.xClass) {
                    sortArrowHolder.css("font-size", 12);
                }
                // This is to add down arrow indicating sorting in the that particular column
                if (i === 0) {
                    sortArrowHolder.html(options.arrows.downArrow).addClass(options.arrowsClass.downArrow);
                    columnHeader.attr("sort", "ASC");
                }

                columnHeader.append(sortArrowHolder);
                columnHeader.addClass("cursor-pointer").on("click", function() {
                    var sortType = $(this).attr("sort");
                    var item = $(this).parent().attr("item");
                    $this.thead.find(".sort").html('').removeClass(options.arrowsClass.downArrow + " " + options.arrowsClass.upArrow);
                    $this.thead.find("[sort]").removeAttr("sort");

                    var isAesc = true;
                    // If the column is already sorted
                    if (sortType != "") {
                        // If the column is sorted ASC
                        if (sortType == "ASC") {
                            isAesc = false;
                            $(this).attr("sort", "DESC");
                            $(this).find(".sort").html(options.arrows.upArrow).removeClass(options.arrowsClass.downArrow).addClass(options.arrowsClass.upArrow);
                            // else the column is sorted DESC
                        } else {
                            $(this).attr("sort", "ASC");
                            $(this).find(".sort").html(options.arrows.downArrow).removeClass(options.arrowsClass.upArrow).addClass(options.arrowsClass.downArrow);
                        }
                        // else the column is not sorted
                    } else {
                        $(this).attr("sort", "ASC");
                        $(this).find(".sort").html(options.arrows.downArrow).removeClass(options.arrowsClass.upArrow).addClass(options.arrowsClass.downArrow);
                    }
                    $this.currentData = $this._sortList($this.currentData, item, isAesc);
                    $this._updateGrid();
                });

            });
        },
        _applyFilterable: function() {
            // This method is used to apply the filtering ability into grid system
            var $this = this;
            $this.thead.find("[is-filterable]").each(function(index) {
                // Adding input field to each header and binding index up even to it
                // Appending input event. For more details refer defect : 61915
                var input = $("<input type='text'>").appendTo(this).on("keyup input", function() {
                    setTimeout(function() {
                        if ($this.masterSearchInput) {
                            $this.masterSearchInput.val('');
                        }
                        var filter = {};
                        $this.options.start = 0;
                        // Iterating all the input filter and created filter
                        $this.thead.find("th:not(.edit) input[value!='']").each(function() {
                            var value = $.trim($(this).val());
                            var filterBy = $(this).parents("th:eq(0)").attr("item");
                            if (value != '') {
                                filter[filterBy] = value;
                            }
                        });

                        // this function is used to match the data with the given data
                        function matchElement(element) {
                            for (var index in this) {
                                if (this[index]) {
                                    var value = element[index] ? element[index].removeHTMLTag() : "";
                                    // i is for ignoreCase
                                    if (!(new RegExp(this[index].escapeRegExp(), 'i').test(value))) {
                                        return false;
                                    }
                                }

                            }
                            return true;
                        }
                        $this._filterData(matchElement, filter);
                    }, 1);
                });
                // This is for view ALL
                if ($this.options.headers[index].css && $this.options.headers[index].css.width && $this.options.withScroll) {
                    input.css("width", $this.options.headers[index].css.width - 12);
                } else {
                    input.css("width", "90%");
                }
            });
        },
        _filterData: function(matchElement, filter) {
            this.currentData = this.options.responseData.filter(matchElement, filter);
            this._updateGrid();
        },
        _updateGrid: function() {
            // This function is used to update the grid with data
            this.tbody.text('');
            var $this = this;
            this.currentDataLength = this.currentData.length;
            // If there are no data ?
            if (this.currentData.length === 0) {
                var tr = $("<tr>").appendTo(this.tbody).addClass("no-record");
                $("<td colspan='" + this.thead.find("th").length + "'>").addClass("no-record").text('No Records Found').appendTo(tr);
                log("No records found");
            } else {
                var start = this.options.start;
                var count = this.options.count;
                // Iterating array
                for (var i = start; i < count + start; i++) {
                    var data = this.currentData[i];
                    if (data) {
                        var tr = $("<tr>").appendTo(this.tbody);
                        tr.attr("index", data['xGridIndex']);
                        if (data['xGridSelected']) {
                            tr.addClass("selected");
                        }
                        if (data['disabled'] === true) {
                            tr.addClass("disabled");
                        }
                        // This is for view ALL
                        if ($this.tbody.hasClass("scroll")) {
                            tr.css("height", 30);
                        }
                        var errors = data.errors;
                        // Iterating data for items
                        for (var index in this.options.headers) {
                            if ($this.options.headers[index]) {
                                var td = $this._renderItem(tr, data, index, $this, errors);
                                if ($this.options.headers[index].isEditable) {
                                    td.attr("is-editable", true);
                                }
                                if ($this.options.headers[index].css && $this.options.headers[index].css.width) {
                                    td.css("width", $this.options.headers[index].css.width);
                                }
                                if ($this.options.headers[index].css && $this.options.headers[index].css.minWidth) {
                                    td.css("min-width", $this.options.headers[index].css.minWidth);
                                }
                                if ($this.options.headers[index].bodyCss) {
                                    td.css($this.options.headers[index].bodyCss);
                                }
                            }

                        }
                    }
                }
            }
            if (this.tbody.find("tr").length === 0) {
                var tr = $("<tr>").appendTo(this.tbody).addClass("no-record");
                $("<td colspan='" + this.thead.find("th").length + "'>").addClass("no-record").text('No Records Found').appendTo(tr);
            }
            this._afterGridUpdate();
        },
        _renderItem: function(tr, data, index, $this, errors) {
            var key = $this.options.headers[index].key;
            var isError = $.inArray(key, errors);
            var div;
            if ($this.options.headers[index].isHover) {
                var span = $("<span>").attr("title", data[key]).html(data[key]).css("white-space", "nowrap");
                div = $("<div>").append(span).addClass("x-hover");
            } else {
                div = $("<div>").html(data[key]);
            }
            if (isError >= 0) {
                div.addClass("error-border");
            }
            /* Changes related to US362088 start */
            if (key == "ExtnNote") {
                return $("<td class='hiddenNote'>").appendTo(tr).append(div);
            } else {
                return $("<td>").appendTo(tr).append(div);
            }
            /* Changes related to US362088 end */
        },
        _afterGridUpdate: function() {
            this._applyEditable();
            this._applyCFGable();
            this._applySelectable();

            var start = this.options.start;
            var count = this.options.count;

            if (this.currentDataLength <= this.options.count) {
                this.paginationColumn.hide();
                if (this.viewAll && this.options.count == this.options.origin_count) {
                    this.viewAll.attr("disabled", true);
                }
                this.next.hide();
                this.prev.hide();
                if (this.options.responseData.length <= this.options.origin_count) {
                    this.options.isCountChange ? this.countDD.hide() : "";
                    this.options.count = this.options.origin_count;
                }
                // Updating showing record section
                this.options.start = 0;

                if (this.currentDataLength === 0) {
                    this.showColumn.text('');
                } else {
                    var showTemplateObj = this.showTemplate.replace("{start}", 1);
                    showTemplateObj = showTemplateObj.replace("{end}", this.currentDataLength);
                    showTemplateObj = showTemplateObj.replace("{total}", this.currentDataLength);
                    this.showColumn.text(showTemplateObj);
                }
                return;
            }

            this.options.isCountChange ? this.countDD.show() : "";

            // Checking count and start and enabling/disabling the pagination button
            if (start <= 0) {
                this.prev.attr('disabled', true).addClass('disabled');
            } else {
                this.prev.attr('disabled', false).removeClass('disabled');
            }

            if ((start + count) >= this.currentDataLength) {
                this.next.attr('disabled', true).addClass('disabled');
            } else {
                this.next.attr('disabled', false).removeClass('disabled');
            }

            // If there are no data ?
            if (this.currentDataLength === 0) {
                this.paginationColumn.hide();
                if (this.viewAll) {
                    this.viewAll.attr("disabled", true);
                }
                this.next.hide();
                this.prev.hide();
                this.options.isCountChange ? this.countDD.hide() : "";
            } else {
                this.next.show();
                this.prev.show();
                if (this.viewAll) {
                    this.viewAll.attr("disabled", false);
                }
                this.options.isCountChange ? this.countDD.show() : "";

                // Updating pagination section
                this.paginationTemplate.find("input").val(parseInt(start / count) + 1);

                var total = (this.currentDataLength / count) % 1 === 0 ? parseInt(this.currentDataLength / count) : parseInt(this.currentDataLength / count) + 1;
                this.paginationTemplate.find("span.total").text(total);
                this.paginationColumn.show();
            }
            // Updating showing record section
            var showTemplate = this.showTemplate.replace("{start}", start + 1);
            showTemplate = showTemplate.replace("{end}", (start + count) > this.currentDataLength ? this.currentDataLength : (start + count));
            showTemplate = showTemplate.replace("{total}", this.currentDataLength);
            this.showColumn.text(showTemplate);
        },
        _applySelectable: function() {
            // This function is used to apply selectable event on the row
            if (this.options.isSelectable) {
                var $this = this;
                this.tbody.find("tr:not(.no-record)").on("click", function(event) {
                    if ($this.options.isSingleSelect) {
                        $this.tbody.find("tr:not(.no-record)").removeClass("selected");
                        $(this).addClass("selected");
                        var rowIndex = $(this).attr("index");
                        for (var index in $this.options.responseData) {
                            if ($this.options.responseData[index].xGridIndex == rowIndex) {
                                $this.options.responseData[index].xGridSelected = true;
                            } else {
                                $this.options.responseData[index].xGridSelected = false;
                            }
                        }
                    } else {
                        var isSelected = true;
                        if ($(this).hasClass("selected")) {
                            $(this).removeClass("selected");
                            isSelected = false;
                        } else {
                            $(this).addClass("selected");
                        }

                        var rowIndex = $(this).attr("index");
                        for (var index in $this.options.responseData) {
                            if ($this.options.responseData[index].xGridIndex == rowIndex) {
                                $this.options.responseData[index].xGridSelected = isSelected;
                                break;
                            }
                        }
                    }
                }).addClass("cursor-pointer");
                this._afterApplySelectable();
            }
        },
        _sortList: function(array, sortBy, isAesc) {
            // This function is used to sort the array with the given item name in the array
            return array.sort(function(a, b) {
                if ($.isNumeric(a[sortBy]) && $.isNumeric(b[sortBy])) {
                    return isAesc ? a[sortBy] - b[sortBy] : b[sortBy] - a[sortBy];
                }
                if (a[sortBy] < b[sortBy])
                    return isAesc ? -1 : 1;
                if (b[sortBy] < a[sortBy])
                    return isAesc ? 1 : -1;
                return 0;
            });
        },
        _afterApplySelectable: function() {},
        _applyExpandable: function() {},
        _createCFGButton: function() {},
        _applyCFGable: function() {},
        _applyEditable: function() {
            /* This section contain the code to make the row as editable on clicking on it */
            // This function is used to convert the column as editable column
            var $this = this;
            this.tbody.find("[is-editable]").on("dblclick", function(event) {
                event.stopPropagation();
                var index = $(this).index();
                // Fix for Offnet page
                var top = $(this).position().top + ($(this).height() / 2) - 15;
                var left = $(this).position().left;
                var width = $(this).find("div").outerWidth();
                var height = $(this).find("div").outerHeight();
                var paddingLeft = 0;
                if ($this.options.isSelectable && index === 0) {
                    width = width + 3;
                    paddingLeft = -1;
                }
                var columnName = $this.options.headers[$(this).index()].key;
                var value = $(this).find("div").css("visibility", "hidden").text();
                var editableFiled = $this.thead.find("input[item='" + columnName + "'],select[item='" + columnName + "']");
                if ($(editableFiled).is('input')) {
                    width = width - 11;
                    height = height - 3;
                    paddingLeft = paddingLeft + 8;
                } else {
                    paddingLeft = 0;
                }
                editableFiled.css({
                    top: top,
                    left: left,
                    width: width,
                    height: 29,
                    paddingLeft: paddingLeft
                }).show().focus().val(value).attr("row-index", $(this).parent().attr("index")).attr("td-index", $(this).index()).attr("tr-index", $(this).parent().index()).on("blur", function() {
                    var tdIndex = $(this).attr("td-index");
                    var trIndex = $(this).attr("tr-index");
                    var valueHolder = $this.tbody.find("tr:eq(" + trIndex + ") td:eq(" + tdIndex + ")").find("div");
                    if (valueHolder.css("visibility") == "hidden") {
                        valueHolder.css("visibility", "visible").removeClass("error-border");
                    }
                    $(this).hide();
                });
            });
        },
        _createEditable: function() {
            /* To create the editable text box in the header which can be used when in line editing is triggered Mainly will be used if we have the editable column as drop down or date picker or auto suggestion */
            var tr = undefined;
            var th = undefined;
            for (var index in this.options.headers) {
                if (this.options.headers[index].isEditable) {
                    if (!tr) {
                        tr = $("<tr>").appendTo(this.thead).addClass('edit');
                        th = $("<th colspan='" + this.options.headers.length + "'>").appendTo(tr);
                    }
                    var item = this.options.headers[index].key;
                    var sOptions = this.options.headers[index].selectOptions;
                    var element = undefined;
                    if (sOptions) {
                        element = $("<select>");
                        for (var sIndex in sOptions) {
                            if (sOptions[sIndex]) {
                                var value = sOptions[sIndex].v ? sOptions[sIndex].v : sOptions[sIndex].n;
                                element.append("<option value='" + value + "'>" + sOptions[sIndex].n + "</option>");
                            }
                        }
                    } else {

                        element = $("<input type='text'>");
                        if (this.options.headers[index].xForce) {
                            element.attr("x-force", this.options.headers[index].xForce);
                        }
                        if (this.options.headers[index].xMax) {
                            element.attr("x-max", this.options.headers[index].xMax);
                        }
                        if (this.options.headers[index].xMin) {
                            element.attr("x-min", this.options.headers[index].xMin);
                        }
                    }
                    th.append(element.attr("item", item).hide());
                }
            }
            this._bindChangeOnEditable();
        },
        _bindChangeOnEditable: function() {
            var $this = this;
            this.thead.find("tr.edit input,tr.edit select").on("blur", function() {
                var columnName = $(this).attr("item");
                var rowIndex = $(this).attr("row-index");
                var tdIndex = $(this).attr("td-index");
                var trIndex = $(this).attr("tr-index");
                var valueHolder = $this.tbody.find("tr:eq(" + trIndex + ") td:eq(" + tdIndex + ")").find("div");
                var value = $(this).val();
                valueHolder.addClass("edited");
                if ($this.options.headers[tdIndex].isHover) {
                    valueHolder.html('');
                    var span = $("<span>").attr("title", value).html(value).css("white-space", "nowrap");
                    valueHolder.append(span).addClass("x-hover");
                } else {
                    valueHolder.html(value);
                }
                for (index in $this.options.responseData) {
                    if ($this.options.responseData[index].xGridIndex == rowIndex) {
                        $this.options.responseData[index][columnName] = $(this).val();
                        $this.options.responseData[index].isEdited = true;
                        if (!$this.options.responseData[index].editedList) {
                            $this.options.responseData[index].editedList = [];
                        }
                        $this.options.responseData[index].editedList.push(columnName);

                        // US516534 highlight mandatory fields
                        if ($this.options.responseData[index].errors && value != null && value != undefined && value != "" && $this.options.responseData[index].errors.indexOf(columnName) != -1) {
                            $this.options.responseData[index].errors.splice($this.options.responseData[index].errors.indexOf(columnName), 1);

                        } else if (($this.options.headers[tdIndex].isMandatory || ($this.options.headers[tdIndex].key == "OffnetExpediteReason" && $this.options.responseData[index].OffnetExpedite == "Yes")) && (value == null || value == undefined || value == "")) {
                            if (!$this.options.responseData[index].errors) {
                                $this.options.responseData[index].errors = [];
                            }

                            // Arpit Tripathi Defect #63607
                            if ($.inArray(columnName, $this.options.responseData[index].errors) === -1) {
                                $this.options.responseData[index].errors[$this.options.responseData[index].errors.length] = columnName;
                            }
                        }
                        // End US516534
                        break;
                    }
                }
                $this.afterEdit($(this));
            });
        },
        afterEdit: function() {}
    });
})(jQuery);

/**
	Tree Grid structure 
	Description: This grid plugin is extension of main grid and it contain tree structure formation 
*/

$(function() {
    $.widget("x.treegrid", $.x.grid, {
        _updateGrid: function() {
            // This function is used to update the grid with data
            this.tbody.text('');
            this._hideCFGButton();
            var $this = this;
            this.currentDataLength = 0;
            // If there are no data ?
            if (this.currentData.length === 0) {
                var tr = $("<tr>").appendTo(this.tbody);
                $("<td colspan='" + this.thead.find("th").length + "'>").addClass("no-record").text('No Records Found').appendTo(tr);
            } else {
                var start = this.options.start;
                var count = this.options.count;
                count = count + start;
                for (var itemIndex = 0; itemIndex < this.currentData.length; itemIndex++) {
                    var data = this.currentData[itemIndex];
                    if (data) {
                        if (!data['parentId']) {
                            this.currentDataLength++;
                            if (this.currentDataLength <= start || this.currentDataLength > count) {
                                continue;
                            }
                        }
                        var tr = $("<tr>").appendTo(this.tbody);
                        tr.attr("index", data['xGridIndex']);
                        tr.attr("x-id", data['xGridIndex']);
                        tr.attr("x-level", data.Level);
                        tr.addClass("level-" + data.Level);
                        if (data.error) {
                            tr.addClass("error");
                        }
                        if (data.cfg) {
                            tr.attr("cfg", data.cfg).attr("is-configure", true).addClass("cfg");
                        }
                        tr.css("backgroundColor", this.options.backgroundColorGradient[data.Level]);

                        if (data['xGridSelected']) {
                            tr.addClass("selected");
                        }
                        if (data.bodyCss) {
                            tr.css(data.bodyCss);
                        }
                        // Iterating data for items
                        for (var index in this.options.headers) {
                            var key = this.options.headers[index].key;
                            var td = undefined;
                            // US562009 condition added for ISP and OSP
                            if ((key == "MRC" || key == "NRC" || key == "ISP" || key == "OSP") && data[this.options.headers[index].key] && data[this.options.headers[index].key] != "") {
                                var value = data[this.options.headers[index].key];
                                if (!value || value == "-0.00") {
                                    value = "$0.00";
                                } else {
                                    value = addDollar(value);
                                }
                                td = $("<td>").appendTo(tr).append($("<div>").html(value));
                            } else {
                                td = $("<td>").appendTo(tr).append($("<div>").html(data[this.options.headers[index].key]));
                            }
                            if ($this.options.headers[index].isEditable) {
                                td.attr("is-editable", true);
                            }
                            if ($this.options.headers[index].css && $this.options.headers[index].css.width && !data['parentId']) {
                                td.css("width", $this.options.headers[index].css.width);
                            }
                            if ($this.options.headers[index].bodyCss) {
                                td.css($this.options.headers[index].bodyCss);
                            }

                        }

                        if (data['parentId']) {
                            tr.attr("x-id-parent", data['parentId']).hide();
                            tr.find("td:first-child").css("padding-left", parseInt(data.Level) * 20);
                        }

                        var parentElement = this.tbody.find("tr[x-id=" + data['parentId'] + "]");
                        if (parentElement.length > 0) {
                            if (!parentElement.hasClass("hasIcon")) {
                                var icon = $("<i>").addClass("fa").addClass(this.options.arrowsClass.rightArrow).css({
                                    "marginRight": 5,
                                    "fontSize": '14px',
                                    "display": 'inline'
                                }).html(this.options.arrows.rightArrow);
                                parentElement.find("td:first-child div").prepend(icon);
                                parentElement.addClass("hasIcon");
                            }
                        }
                    }
                }
            }

            this._afterGridUpdate();
            this._applyExpandable();
        },
        _applyExpandable: function() {
            var $this = this;
            this.tbody.find("tr td:first-child div i.fa").on("click", function() {
                var id = $(this).parents("tr:eq(0)").attr('x-id');
                var show = $(this).hasClass($this.options.arrowsClass.rightArrow) ? true : false;
                showOrHideCell($this, id, show);
                if ($this.tbody.hasClass("double")) {
                    $this._hideCFGButton();
                } else {
                    if ($this.tbody.find("tr.selected:visible").length === 1) {
                        $this._showCFGButton($this.tbody.find("tr.selected:visible"));
                    } else {
                        $this._hideCFGButton();
                    }
                }
            });
        },
        _createCFGButton: function() {
            var tr = $("<tr>").appendTo(this.thead).addClass('cfg-btn').hide();
            this.checkCFGBtn = $("<button type='button'>").html("Check").addClass("white check").prepend($("<i>").addClass("fa fa-check").css("font-size","16px"));
            $("<th colspan='" + this.options.headers.length + "'>").appendTo(tr).append(this.checkCFGBtn);
            this._bindCFGButton();
        },
        _bindCFGButton: function() {
            var $this = this;
            this.checkCFGBtn.on("click", function() {
                var rowIndex = parseInt($this.tbody.find("tr.selected").attr("index"));
                for (index in $this.currentData) {
                    if ($this.currentData[index].xGridIndex === rowIndex) {
                        console.log($this.currentData[index]);
                        break;
                    }
                }
            });
        },
        _applyCFGable: function() {
            var $this = this;
            this.tbody.find("tr[is-configure]").each(function() {
                $(this).on("click", function(e) {
                    if ($(e.target).is("i")) {
                        return;
                    }
                    if ($(this).hasClass("selected")) {
                        $(this).removeClass("selected");
                    } else {
                        $(this).addClass("selected");
                    }
                    if ($this.tbody.find("tr.selected").length === 1 && $this.tbody.find("tr.selected").is(":visible")) {
                        $this._showCFGButton($this.tbody.find("tr.selected"));
                    } else {
                        $this._hideCFGButton();
                    }
                    if ($this.tbody.find("tr.selected").length >= 2) {
                        $this.tbody.addClass("double");
                    } else {
                        $this.tbody.removeClass("double");
                    }
                });
            });
        },
        _hideCFGButton: function() {
            this.thead.find(".cfg-btn").hide();
        },
        _showCFGButton: function(tr) {
            var top = tr.position().top;
            var height = tr.outerHeight();
            var left = tr.position().left;
            var cfgBtn = this.thead.find(".cfg-btn").css({
                top: top + height - 1,
                left: left
            }).show();
            cfgBtn.find("button").hide();
            var buttons = tr.attr("cfg").split(",");
            $.each(buttons, function(i, v) {
                cfgBtn.find("button." + v).show();
            });
            cfgBtn.css("marginLeft", (this.element.width() / 2) - (cfgBtn.width() / 2));
        },

        _applyFilterable: function() {
            // This method is used to apply the filtering ability into grid system
            var $this = this;
            $this.thead.find("[is-filterable]").each(function() {
                // Adding input field to each header and binding index up even to it
                // Appending input event. For more details refer defect : 61915
                var input = $("<input type='text'>").appendTo(this).on("keyup input", function() {
                    setTimeout(function() {
                        if ($this.masterSearchInput) {
                            $this.masterSearchInput.val('');
                        }
                        globalFilterFlag = false;
                        var filter = {};
                        $this.options.start = 0;
                        // Iterating all the input filter and created filter
                        $this.thead.find("th:not(.edit) input[value!='']").each(function() {
                            var value = $.trim($(this).val());
                            var filterBy = $(this).parents("th:eq(0)").attr("item");
                            if (value != '') {
                                filter[filterBy] = value;
                            }
                        });

                        // this function is used to match the data with the given data
                        function matchElement(element) {
                            if (element.Level != 0) {
                                return globalFilterFlag;
                            }
                            for (var index in this) {
                                if (this[index]) {
                                    var value = element[index] ? element[index].removeHTMLTag() : "";
                                    // i is for ignoreCase
                                    if (!(new RegExp(this[index].escapeRegExp(), 'i').test(value))) {
                                        globalFilterFlag = false;
                                        return false;
                                    }
                                }
                            }
                            globalFilterFlag = true;
                            return true;
                        }
                        $this._filterData(matchElement, filter);
                    }, 1);
                });

                input.css({
                    "width": "99%",
                    "margin": 0,
                    "marginTop": 5
                });
                $this.thead.find("tr:eq(0) th").css("padding", "10px 6px 6px");
                $this.thead.find("tr:eq(0) th div").css("padding", 0);
            });
        }
    });
});
function showOrHideCell($this , id , show) {
  var icon = $this.tbody.find("tr[x-id=" + id + "] td:first-child div i.fa");
  $this.tbody.find("tr[x-id-parent=" + id + "]").each(function() {
    if (show) {
      icon.removeClass($this.options.arrowsClass.rightArrow).addClass($this.options.arrowsClass.downArrow).html($this.options.arrows.downArrow);
      $(this).show();
    } else {
      icon.removeClass($this.options.arrowsClass.downArrow).addClass($this.options.arrowsClass.rightArrow).html($this.options.arrows.rightArrow);
      $(this).hide();
      showOrHideCell($this, $(this).attr('x-id'), false);
    }
  });
}