/*Tree Grid structure code starts here*/

$(function() {
	$.widget("x.treegrid", $.x.grid, {
		removeElement: function(OrderLineKey){
			if(OrderLineKey == undefined){return;}
			var deleteFlag = false;
			var responseData = this.options.responseData.slice(0);
			var deleteIndex = 0;
			for(dataIndex = 0; dataIndex < this.options.responseData.length; dataIndex++){
				var data = this.options.responseData[dataIndex];
				if(data['OrderLineKey'] == OrderLineKey){
					deleteIndex = dataIndex;
					deleteFlag = true;
				}else if(data['parentId'] == undefined && deleteFlag){
					deleteFlag = false;
					break;
				}
				if(deleteFlag){
					responseData.splice(deleteIndex, 1);
				}
			}
			this.options.responseData = responseData;
			this.currentData = this.options.responseData;
			this._updateGrid();
			this.thead.find(".cfg-btn").hide();
		},
		_updateGrid: function() { //This function is used to update the grid with data
			this.tbody.text('');
			this._hideCFGButton();
			var $this = this;
			this.currentDataLength = 0;
			if (this.currentData.length == 0) { //If there are no data ?
				var tr = $("<tr>").appendTo(this.tbody);
				$("<td colspan='" + this.thead.find("th").length + "'>").addClass("no-record").text(
					'No Records Found').appendTo(tr);
			} else {
				var start = this.options.start;
				var count = this.options.count;
				count = count + start;
				for (var itemIndex = 0; itemIndex < this.currentData.length; itemIndex++) { //Iterating array 
					var data = this.currentData[itemIndex];
					if (data != undefined) {
						if(data['parentId'] == undefined){
							this.currentDataLength++;
							if(this.currentDataLength <= start || this.currentDataLength > count){
								continue;
							}							
						}
						var tr = $("<tr>").appendTo(this.tbody);
						tr.attr("index", data['xGridIndex']);
						tr.attr("x-id", data['xGridIndex']);
						tr.attr("x-level", data.Level);
						tr.addClass("level-"+data.Level);
						if(data.error){
							tr.addClass("error");
						}
						if(data.cfg){
							tr.attr("cfg",data.cfg).attr("is-configure",true).addClass("cfg");
						}
						tr.css("backgroundColor", this.options.backgroundColorGradient[data.Level]);

						if (data['xGridSelected'] != undefined && data['xGridSelected']) {
							tr.addClass("selected");
						}
						if (data.bodyCss) {
							tr.css(data.bodyCss);
						}
						for (var index in this.options.headers) { //Iterating data for items
							var key = this.options.headers[index].key;
							var td = undefined;
							if((key == "MRC" || key == "NRC") && data[this.options.headers[index].key] != undefined && data[this.options.headers[index].key] != ""){
								var value = data[this.options.headers[index].key];
								if(value == undefined || value == "-0.00"){
									value = "$0.00";
								}else if(value.toString().indexOf("-") != -1){
									value = "-$"+value.replace(/-/g,"");//.numberFormat();
								}else{
									value = "$"+value;//.numberFormat();
								}
								td = $("<td>").appendTo(tr).append($("<div>").html(value));	
							}else{
								td = $("<td>").appendTo(tr).append($("<div>").html(data[this.options.headers[index].key]));
							}
							if ($this.options.headers[index].isEditable) {
								td.attr("is-editable", true);
							}
							if ($this.options.headers[index].css && $this.options.headers[index].css.width && data['parentId'] == undefined) {
								td.css("width", $this.options.headers[index].css.width);
							}
							if ($this.options.headers[index].bodyCss) {
								td.css($this.options.headers[index].bodyCss);
							}
							
						}

						if (data['parentId'] != undefined) {
							tr.attr("x-id-parent", data['parentId']).hide();
							tr.find("td:first-child").css("padding-left", parseInt(data.Level) * 20);
						}

						var parentElement = this.tbody.find("tr[x-id=" + data['parentId'] + "]");
						if (parentElement.length > 0) {
							if (!parentElement.hasClass("hasIcon")) {
								var icon = $("<i>")
									.addClass("fa")
									.addClass(this.options.arrowsClass.rightArrow)
									.css({
										"marginRight": 5,
										"fontSize": '14px'
									})
									.html(this.options.arrows.rightArrow);
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
				if($this.tbody.hasClass("double")){
					$this._hideCFGButton();
				}else{
					if($this.tbody.find("tr.selected:visible").length == 1){
						$this._showCFGButton($this.tbody.find("tr.selected:visible"));
					}else{
						$this._hideCFGButton();
					}	
				}
			});
		},
		_createCFGButton:function(){
			var $this = this;
			var tr = $("<tr>").appendTo(this.thead).addClass('cfg-btn').hide();
			this.removeCFGBtn = $("<button type='button'>").html("Remove").addClass("white remove").prepend($("<i>").addClass("icon-remove"));
			this.configCFGBtn = $("<button type='button'>").html("Configure").addClass("white configure").prepend($("<i>").addClass("icon-configure"));
			this.updateCFGBtn = $("<button type='button'>").html("Update").addClass("white update").prepend($("<i>").addClass("icon-update"));
			this.discountCFGBtn = $("<button type='button'>").html("Discount").addClass("white discount").prepend($("<i>").addClass("icon-discount"));
			if(discountAccess != undefined && discountAccess == true){
				this.discountCFGBtn.attr("disabled",true);
			}
			$("<th colspan='"+this.options.headers.length+"'>").appendTo(tr)
			.append(this.removeCFGBtn)
			.append(this.discountCFGBtn)
			.append(this.updateCFGBtn)
			.append(this.configCFGBtn);
			this._bindCFGButton();
		},
		_bindCFGButton:function(){
			var $this = this;
			this.removeCFGBtn.on("click",function(){
				var rowIndex = $this.tbody.find("tr.selected").attr("index");
				for (index in $this.currentData) {
					if ($this.currentData[index].xGridIndex == rowIndex) {
						removeCFGButton($this,$this.currentData[index]);
						break;
					}
				}				
			});
			this.configCFGBtn.on("click",function(){
				var rowIndex = $this.tbody.find("tr.selected").attr("index");
				for (index in $this.currentData) {
					if ($this.currentData[index].xGridIndex == rowIndex) {
						configCFGButton($this,$this.currentData[index]);
						break;
					}
				}
			});
			this.updateCFGBtn.on("click",function(){
				var rowIndex = $this.tbody.find("tr.selected").attr("index");
				for (index in $this.currentData) {
					if ($this.currentData[index].xGridIndex == rowIndex) {
						updateCFGButton($this,$this.currentData[index]);
						break;
					}
				}
			});
			this.discountCFGBtn.on("click",function(){
				var rowIndex = $this.tbody.find("tr.selected").attr("index");
				for (index in $this.currentData) {
					if ($this.currentData[index].xGridIndex == rowIndex) {
						discountCFGButton($this,$this.currentData[index]);
						break;
					}
				}
			});
		},
		_applyCFGable:function(){
			var $this = this;
			this.tbody.find("tr[is-configure]").each(function(){
				$(this).on("click",function(e){
					if($(e.target).is("i")){return;}
					if($(this).hasClass("selected")){
						$(this).removeClass("selected");						
					}else{
						$(this).addClass("selected");
					}
					if($this.tbody.find("tr.selected").length == 1 && $this.tbody.find("tr.selected").is(":visible")){
						$this._showCFGButton($this.tbody.find("tr.selected"));
					}else{
						$this._hideCFGButton();
					}
					if($this.tbody.find("tr.selected").length >= 2){
						$this.tbody.addClass("double");
					}else{
						$this.tbody.removeClass("double");
					}
				});
			});
		},
		_hideCFGButton:function(){
			this.thead.find(".cfg-btn").hide();
			//this.tbody.find("tr[is-configure]").removeClass("selected");
		},
		_showCFGButton:function(tr){
			var top = tr.position().top;
			var height = tr.outerHeight();
			var left = tr.position().left;
			var cfgBtn = this.thead.find(".cfg-btn")
					.css({top:top + height - 1,left:left})
					.show();	
			cfgBtn.find("button").hide();
			var buttons = tr.attr("cfg").split(",");
			$.each(buttons, function(i, v) {
				cfgBtn.find("button." + v).show();
				if (v == "discount" && discountAccess != undefined && discountAccess == true) {
					cfgBtn.find("button." + v).attr("disabled", true);
				}
			});			
		},
		_applyFilterable: function() { // This method is used to apply the filtering ability into grid system
			var $this = this;
			$this.thead.find("[is-filterable]").each(function(index) {
				var input = $("<input type='text'>").appendTo(this).on("keyup", function() { // Adding input field to each header and binding index up even to it
					if($this.masterSearchInput){
						$this.masterSearchInput.val('');
					}
					globalFilterFlag = false;
					var filter = {};
					$this.options.start = 0;
					$this.thead.find("th:not(.edit) input[value!='']").each(function() { // Iterating all the input filter and created filter 
						var value = $.trim($(this).val());
						var filterBy = $(this).parents("th:eq(0)").attr("item");
						if (value != '') {
							filter[filterBy] = value;
						}
					});
					
					//this function is used to match the data with the given data
					function matchElement(element) {						
						if(element.Level != 0){
							return globalFilterFlag;
						}
						for (var index in this) {
							var value = element[index] ? element[index].removeHTMLTag() : "";
							if (!(new RegExp(this[index].escapeRegExp(), 'i').test(value))) { // i is for ignoreCase
								globalFilterFlag = false;
								return false;
							}
						}
						globalFilterFlag = true;
						return true;
					}
					$this._filterData(matchElement,filter);
				});
				
				input.css({"width":"99%","margin":0,"marginTop":5});
				$this.thead.find("tr:eq(0) th").css("padding","10px 6px 6px");
				$this.thead.find("tr:eq(0) th div").css("padding",0);
			});
		}
	});
});

function showOrHideCell($this, id, show) {
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
