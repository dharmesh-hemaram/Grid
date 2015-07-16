# Grid
This repository is mainly create to post my plugin called Grid plugin developed using jQuery widget plugin.


This plugin is used to create the Grid with the given headers and data which is loaded through ajax call made to server.
It contain sortable, selectable, filterable, expandable, pagination.

#E.g.

var headers = [
		{text:"Name",key:"name",isSortable:true,isFilterable:true,isResizable:true,css:{width:230}},
		{text:"Address",key:"address",isSortable:true,isFilterable:true,css:{width:215}}];
		
		var div = $( "<div/>" )
		.appendTo("#container")
		.grid({
		responseData:[],
		headers:headers,
		isSelectable:isSelectable,
		isSortable:true,
		isCountChange:true,
		isFilterable:true,
		isViewAll:true,
		withScroll:true
		start:0,
		count:10
	});
