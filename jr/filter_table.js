/*
** 5-13-2019:
** filter_obj.filter_dataTable.fnGetPosition( row_tr) returns position in original data array?
** obsolete as of version 1.10: https://legacy.datatables.net/ref
**
** 5-14-2019: see: https://datatables.net/upgrade/1.10-convert
*/

function jr_FilterTable(dom_id)
{
	this.dom_id						= dom_id
	this.use_show_count				= false;
	/*
	** 1-29-2013: to activate use_show_count also need to change the sDom option
	*/
}


function jr_FilterTableInit( filter_obj, parent_tile, column_array, options)
{
	var		col_title;
	var		width_left;

	if (! options) {
		options = {};
	}

	filter_obj.parent_tile			= parent_tile;
	filter_obj.column_array			= column_array;

	filter_obj.table_id				= 'jr_ftab_' + filter_obj.dom_id ;

	if (options.title_str) {
		filter_obj.filter_header_div	= jr_ElementAppendChild(
											jr_TileDiv( parent_tile), "div", "jr_ftab_title_div"
										);
		jr_ElementAppendText( filter_obj.filter_header_div, options.title_str);
	}
	filter_obj.filter_body_div		= jr_ElementAppendChild(
										jr_TileDiv( parent_tile),	"div", "jr_ftab_nested_body"
									);

	filter_obj.init_options			= options;

	filter_obj.load_fn				= options.load_fn;
	filter_obj.click_fn				= options.click_fn;
	filter_obj.dblclick_fn			= options.dblclick_fn;
	filter_obj.row_expand_fn		= options.row_expand_fn;
	filter_obj.keypress_fn			= options.keypress_fn;

	filter_obj.dataTable_options	= options.dataTable_options;

	/*
	** 12-10-2012: map the alerts query fields to table column indicies
	*/

	var		field_map	= new Array()
	var		col_obj;
	var		z;

	for (z=0; z < column_array.length; z++) {
		col_obj	= column_array[z];

		col_obj.column_index			= z;

		if (col_obj.field_name === undefined  &&  col_obj.data_index === undefined) {
			throw new Error( "Missing data index for column " + z + ": '" + col_obj.title + "'");
		}
		if (col_obj.data_index !== undefined) {
			field_map[col_obj.data_index]	= col_obj;
		}
		if (col_obj.field_name !== undefined) {
			field_map[col_obj.field_name]	= col_obj;
		}
	}

	filter_obj.field_map			= field_map;

	return filter_obj;
}

function jr_FilterTableColumnIndex( filter_obj, field_ref)
{
	if (filter_obj === undefined) {
		throw new Error( "jr_FilterTableColumnIndex(): filter_obj is undefined");
	}
	if (field_ref === undefined) {
		throw new Error(
			"jr_FilterTableColumnIndex(): field_ref is undefined, id: " + filter_obj.dom_id
		);
	}
	var col_obj	= filter_obj.field_map[field_ref];

	if (col_obj === undefined) {
		throw new Error( "jr_FilterTableColumnIndex(): no column for field " + field_ref);
	}
	return col_obj.column_index;
}

function jr_FilterTableSetDataTableOptions( filter_obj, dataTable_options)
{
	if (dataTable_options.bJQueryUI === undefined) {
		dataTable_options.bJQueryUI = false;
	}
	if (dataTable_options.bAutoWidth === undefined) {
		dataTable_options.bAutoWidth = false;
	}
	filter_obj.dataTable_options	= dataTable_options;
}

function jr_FilterTableDisplay( filter_obj, opt_data_array)
{
	var		dataTable_options		= filter_obj.dataTable_options;
	var		retval;

	var		jr_DATATABLES_MIN_NUM_ROWS			= 3;


	if (opt_data_array !== undefined) {
		filter_obj.data_array	= opt_data_array;
	}
	if (!filter_obj.data_array) {
		throw new Error( "can't display table without data_array");
	}

	if (filter_obj.load_fn && filter_obj.parent_tile) {
		jr_TileSetResizeHandler( filter_obj.parent_tile, undefined, undefined);
	}

	$(filter_obj.filter_body_div).attr('style','visibility:hidden');	// FOR TESTING ONLY

		
	dataTable_options.iDisplayLength	= -1;	/* 1-29-2013: all values */

	if (!filter_obj.init_options.disable_scroll) {
		dataTable_options.sScrollY			= filter_obj.filter_body_div.offsetHeight; 


		if (	dataTable_options.sScrollY
			<	jr_DATATABLES_MIN_NUM_ROWS * filter_obj.filter_thead_el.offsetHeight) {

			/*
			** 9-10-2012: by default always leave room for ~5 rows, with the thead
			** has an estimate for a row height.
			*/

			dataTable_options.sScrollY = jr_DATATABLES_MIN_NUM_ROWS * filter_obj.filter_thead_el.offsetHeight;
		}
		/*
		** 5/14/2019: scroller extenstion for large data
		*/
		dataTable_options.scroller			= true;
		dataTable_options.deferRender		= true;
	}

	jr_FilterTableAddColumnDefs( filter_obj, dataTable_options);
	/*
	** 1-23-2013: get the current iDisplayLength or calculate the best value.
	*/

	if (filter_obj.filter_dataTable) {
		var oSettings		= filter_obj.filter_dataTable.fnSettings();

		filter_obj.display_length	= oSettings._iDisplayLength;
		filter_obj.prev_search_str	= oSettings.oPreviousSearch.sSearch;

		jr_FilterTableDestroyDataTable( filter_obj);
	}

	dataTable_options.oSearch		= { sSearch : filter_obj.prev_search_str};

	/*
	** 1-23-2013: always set the full data array, since if the array is empty, the above
	** sizing code won't apply.
	*/
			
	if (!filter_obj.init_options.disable_scroll) {
		filter_obj.filter_dataTable	= $(filter_obj.filter_table_el).dataTable( dataTable_options);

		jr_FilterTableAddColumnDefs( filter_obj, dataTable_options);
			
		var scroll_body_el	= jr_FilterTableGetScrollBody( filter_obj);
			
		if (scroll_body_el) {
			var table_height		= filter_obj.filter_body_div.offsetHeight - scroll_body_el.offsetTop;
				
			var jr_SCROLL_BAR_FUDGE_FACTOR = 11;
			/*
			 * 07-26-2013 Ed Little
			 * This fudge factor is required to prevent scroll-bars occuring simultaneously
			 * in the dataTable and its parent element in a few edge cases
			 *
			 * 5-14-2019 : can't use scrollY since that sets sScrollY
			 * resetting scrollY here leaves the previous sScrollY set.
			 */
			dataTable_options.sScrollY = table_height - jr_SCROLL_BAR_FUDGE_FACTOR;		
		}

		jr_FilterTableDestroyDataTable( filter_obj);
	}

	dataTable_options.aaData = filter_obj.data_array;

	filter_obj.filter_dataTable		= $(filter_obj.filter_table_el).dataTable( dataTable_options);

	filter_obj.filter_dataTable_api = filter_obj.filter_dataTable.api(true);

	filter_obj.filter_dataTable.initComplete =  function () {
		this.api().columns().every( function () {
		var column = this;
		var select = $('<select><option value=""></option></select>')
			.appendTo ( $(column.footer()).empty() )
			.on ('change', function () {
				var val = $.fn.dataTable.util.escapeRegex(
					$(this).val()
				);

				column
				.search( val ? '^'+val+'$' : '', true, false )
				.draw();
			} );

		    column.data().unique().sort().each( function ( d, j ) {
		        select.append( '<option value="'+d+'">'+d+'</option>' )
		    } );
		})
    }

	jr_FilterTableInitHeaderDom( filter_obj);
		
	$(filter_obj.filter_body_div).attr('style','visibility:visible');


	if (filter_obj.row_expand_fn) {
		$('#' + filter_obj.table_id + ' tbody tr td.expander_col').off('click').on('click', function () {				
			var nTr		= $(this).parents('tr')[0]; // 12-17-2012: w/o td.expander_col: $(this).[0]

			jr_FilterTableToggleRowExpand( filter_obj, nTr);
		} );
	}

	if (filter_obj.click_fn) {
		$('#' + filter_obj.table_id + ' tbody tr').off('click').on('click', function (event) {
			var row_tr		= $(this)[0];
			var row_index	= $(this).index();
			var data_info	= filter_obj.filter_dataTable_api.row( row_tr).data();


			if (filter_obj.textarea_el) {
				/*
				** 5-7-2019: otherwise the table div will get the focus (default browser behavior)
				** Do it before so the handler below can reset.
				*/
				filter_obj.textarea_el.focus();
			}

			filter_obj.click_fn( filter_obj, data_info, row_index, row_tr, event );
		});
	}

	if (filter_obj.dblclick_fn) {
		$('#' + filter_obj.table_id + ' tbody tr').off('dblclick').on('dblclick', function (event) {
			var row_tr		= $(this)[0];
			var row_index	= $(this).index();
			var data_info	= filter_obj.filter_dataTable_api.row( row_tr).data();

			if (filter_obj.textarea_el) {
				/*
				** 5-7-2019: otherwise the table div will get the focus (default browser behavior)
				** Do it before so the handler below can reset.
				*/
				filter_obj.textarea_el.focus();
			}
			filter_obj.dblclick_fn( filter_obj, data_info, row_index, row_tr, event );
		} );
	}
	if (	filter_obj.keypress_fn
		||  filter_obj.init_options.enable_arrow_keys
		||	filter_obj.init_options.enable_vi_keys) {
		/*
		** 2-6-2013: add handlers for up/down arrows.
		*/
		filter_obj.textarea_el	= jr_ElementAppendChild( filter_obj.filter_body_div, "textarea");

		jr_ElementSetStyle( filter_obj.textarea_el, "position", "absolute");
		jr_ElementSetStyle( filter_obj.textarea_el, "top", -1000);
		jr_ElementSetStyle( filter_obj.textarea_el, "left", -1000);


		jr_ElementRegisterHandler(
			filter_obj.textarea_el, jr_KEY_PRESS_EVENT,
			{
				handler_fn			: jr_FilterTableCreateKeyPressFn( filter_obj),
				stop_propagation	: false,
				prevent_default		: false
			}
		);

		if (jr_KeyPressIgnoresArrow || jr_KeyPressIgnoresEscape) {
			jr_ElementRegisterHandler(
				filter_obj.textarea_el, jr_KEY_DOWN_EVENT,
				{
					handler_fn			: jr_FilterTableCreateKeyPressFn( filter_obj),
					stop_propagation	: false,
					prevent_default		: false
				}
			);
		}

		filter_obj.textarea_el.focus();
	}

	filter_obj.is_loaded = true;

	if (filter_obj.load_fn && filter_obj.parent_tile) {
		jr_TileSetResizeHandler(
			filter_obj.parent_tile, 
			function() {
				filter_obj.load_fn( filter_obj, {for_resize: true});
			}
		);
	}

	if (	filter_obj.init_options.auto_open_single_row
		&&	filter_obj.row_expand_fn && filter_obj.data_array.length == 1) {

		jr_FilterTableToggleRowExpand( filter_obj, 0);
	}
}

function jr_FilterTableCreateKeyPressFn( filter_obj)
{
	return function( textarea_el, event_object) {
		var key_info		= new jr_KeyStrokeClass( event_object);
		var key_code		= jr_KeyStrokeCode( key_info);
		var row_tr			= filter_obj.active_row_tr;
		var row_index;
		var next_row_index;
		var data_info;

		if (jr_KeyStrokeType( key_info) == jr_KEY_DOWN_EVENT
			&&	key_code != jr_ARROW_DOWN_KEY_CODE
			&&	key_code != jr_ARROW_UP_KEY_CODE
			&&	key_code != jr_ESCAPE_KEY_CODE) {
			/*
			** 5-13-2019: only process "keydown" events on arrow down, up, esc which often
			** don't generate a "keypress". Otherwise we'll process printables keys twice.
			*/

			return;
		}

		if (row_tr) {
			row_index 		= $(row_tr).index();
			data_info		= filter_obj.filter_dataTable_api.row( row_tr).data();
		}

		if (filter_obj.init_options.enable_arrow_keys) {
			if (key_code == jr_ARROW_DOWN_KEY_CODE) {
				next_row_index = row_index + 1;
			}
			else if (key_code == jr_ARROW_UP_KEY_CODE) {
				next_row_index = row_index - 1;
			}
		}

		if (filter_obj.init_options.enable_vi_keys) {
			if (String.fromCharCode( key_code) == 'j') {
				next_row_index = row_index + 1;
			}
			else if (String.fromCharCode( key_code) == 'k') {
				next_row_index = row_index - 1;
			}
		}
		if (next_row_index >= 0) {
			var adjust_scroll		= true;

			jr_FilterTableHighlightRow( filter_obj, next_row_index, adjust_scroll);
		}
		if (filter_obj.init_options.enable_vi_keys) {
			if (key_code == jr_ESCAPE_KEY_CODE) {
				if (jr_FilterTableHasExpandedRow( filter_obj, row_index)) {
					jr_FilterTableToggleRowExpand( filter_obj, row_index);
				}
			}
			if (key_code == jr_NEWLINE_KEY_CODE) {
				if (filter_obj.row_expand_fn) {
					jr_FilterTableToggleRowExpand( filter_obj, row_index);
				}
			}
		}
		if (filter_obj.keypress_fn) {
			filter_obj.keypress_fn(
				filter_obj, data_info, row_index, row_tr, event, jr_KeyStrokeCode( key_info)
			);
		}
	}
}

function jr_FilterTableCreateTableDom( filter_obj)
{
	var		curr_table;
	var		str_buf			= jr_StringBufCreate();

	jr_StringBufAdd( str_buf, '<table id="' + filter_obj.table_id + '"');

	if (filter_obj.init_options.table_class) {
		jr_StringBufAdd( str_buf, ' class="' + filter_obj.init_options.table_class + '"');
	}
	jr_StringBufAdd( str_buf, '>');

	jr_StringBufAdd( str_buf, '<thead id="jr_ftab_thead_' + filter_obj.table_id + '"><tr>');

	for (var z=0; z < filter_obj.column_array.length; z++) {
		var col_title = filter_obj.column_array[z].title;

		jr_StringBufAdd( str_buf, '<th class="');
		if (filter_obj.init_options.col_head_class) {
			jr_StringBufAdd( str_buf, filter_obj.col_head_class + ' ');
		}
		if (filter_obj.column_array[z].filter_enabled === true) {
			jr_StringBufAdd( str_buf, 'filter_enabled '+ filter_obj.column_array[z].filter_group);
		}
		jr_StringBufAdd( str_buf, '">');

		if (filter_obj.column_array[z].filter_enabled === true) {
			jr_StringBufAdd( str_buf, '<div class="filter_title">' + col_title + '</div>');
			jr_StringBufAdd( str_buf, '<div class="filter_dd_container"></div>');
		}
		else {
			jr_StringBufAdd( str_buf, col_title);
		}
		jr_StringBufAdd( str_buf, '</th>');
	}

	jr_StringBufAdd( str_buf, '<tbody></tbody>');
	jr_StringBufAdd( str_buf, '</table>');


	jr_StringBufSetAsHtml( str_buf, filter_obj.filter_body_div);

	filter_obj.filter_table_el	= jr_ElementGetById( filter_obj.table_id);
	filter_obj.filter_thead_el	= jr_ElementGetById( "jr_ftab_thead_"+ filter_obj.table_id);	
}

function jr_FilterTableDestroyDataTable( filter_obj)
{
	jr_FilterTableCreateTableDom( filter_obj);

	if (filter_obj.filter_dataTable) {
		/*
		** 1-30-2013: don't fnDestroy() since that tries to restore the original table DOM
		** and takes several seconds.
		*/
		delete filter_obj.filter_dataTable;
	}
	delete filter_obj.is_loaded; 
}

function jr_FilterTableGetScrollBody( filter_obj)
{
	var curr_el	= filter_obj.filter_table_el;

	while (curr_el !== filter_obj.filter_body_div) {
		if (jr_ElementHasClass( curr_el, "dataTables_scrollBody")) {
			return curr_el;
		}
		curr_el = curr_el.parentElement;
	}
	return undefined;
}

function jr_FilterTableHighlightRow(filter_obj, row, adjust_scroll)
{
	var		row_index;
	var		row_tr;
	
	
	if (typeof(row) == "number") {
		row_index 	= row;
	}
	else if (row instanceof HTMLElement) {
		row_tr 		= row;
	}
	else {
		return;
	}

	if (adjust_scroll === undefined) {
		adjust_scroll = false;
	}
	
	if (row_index === undefined) {
		row_index = $(row_tr).index();
	}
	else if( row_tr === undefined) {
		row_tr = $('#' + filter_obj.table_id + ' tbody tr')[row_index];
	}
	
	if (row_index == null  ||  row_index >= filter_obj.data_array.length) {
		/*
		**  2-7-2013:  could happen if there's no data to display.
		*/
		return;
	}
	
	if (filter_obj.active_row_tr) {
		$(filter_obj.active_row_tr).removeClass( filter_obj.active_row_class);
	}
	
	filter_obj.active_row_tr	= row_tr;
	filter_obj.active_row_index	= row_index;
	filter_obj.active_row_class = "jr_ftab_row_highlight";
	
	$(filter_obj.active_row_tr).addClass( filter_obj.active_row_class);

	if (adjust_scroll  &&  filter_obj.active_row_tr !== undefined) {
		

		if (false && filter_obj.dataTable_options.scroller) {
			/*
			** 5-14-2019: Not as good as below. Slow response and keeps row at the top.
			*/
			filter_obj.filter_dataTable_api.row( row_tr).scrollTo();
		}
		else {
			/*
			** 10/28/2013: filter_obj.active_row_tr can be undefined, apparently
			** jquery above ignores undefined variables.
			*/
			var		scroll_body_el	= jr_FilterTableGetScrollBody( filter_obj);
			var		row_tr			= filter_obj.active_row_tr;
			var		row_top			= filter_obj.active_row_tr.offsetTop;
			var		row_height		= filter_obj.active_row_tr.offsetHeight;

			var		scroll_top		= scroll_body_el.scrollTop;
			var		view_height		= scroll_body_el.offsetHeight;

			if (row_top < scroll_top) {
				scroll_body_el.scrollTop	-= scroll_top - row_top + row_height/4;
			}
			else if (row_top + row_height  >  scroll_top + view_height) {
				scroll_body_el.scrollTop	+=  (row_top + row_height) - (scroll_top + view_height)
											+ 3 * row_height/4;
			}
		}
	}
	
	return filter_obj.filter_dataTable_api.row( row_tr).data();
}

function jr_FilterTableToggleRowExpand(filter_obj, row)
{
	var row_index;
	var row_tr;
	var img_el;
	
	
	if (typeof(row) == "number") {
		row_index 	= row;
	}
	else {
		row_tr 		= row;
	}
	
	if (row_index === undefined) {
		row_index = $(row_tr).index();
	}
	else if (row_tr === undefined) {
		row_tr = $('#' + filter_obj.table_id + ' tbody tr')[row_index];
	}
	if (row_tr === undefined) {
		if (row_index >= 0 && row_index < filter_obj.data_array.length) {
			row_tr = $('#' + filter_obj.table_id + ' tbody tr')[row_index];
		}
	}

	if (row_tr) {
		var expander_td	= $(row_tr).find('td.expander_col');

		if (expander_td) {
			img_el	= $(expander_td).find('img');
		}
	}

	if (row_tr && row_tr.jr_sub_row) { /* This row is already open - close it */
		if (img_el) {
			img_el.attr( "src", "images/tables/table_arrow_right.png");
		}
		filter_obj.filter_dataTable.fnClose( row_tr );
		delete row_tr.jr_sub_row;
	}
	else { /* Open this row */
		var data_info;

		if (img_el) {
			img_el.attr( "src", "images/tables/table_arrow_down.png");
		}
		data_info = filter_obj.filter_dataTable_api.row( row_tr).data();

		var expand_result	= filter_obj.row_expand_fn(
								filter_obj.filter_dataTable, data_info, row_index, row_tr
							);

		if (expand_result) {
			var html_str;
			var render_fn;

			if (typeof expand_result == "object") {
				html_str	= expand_result.html_str;
				render_fn	= expand_result.render_fn;
			}
			else {
				html_str = expand_result;
			}

			if (html_str) {
				row_tr.jr_sub_row	= filter_obj.filter_dataTable.fnOpen( row_tr, html_str, 'no-bg');
				$(row_tr.jr_sub_row).find('td.no-bg').width('100%');
				if (render_fn) {
					render_fn( row_tr.jr_sub_row, row_tr);
				}
			}
		}
	}
}

function jr_FilterTableHasExpandedRow(filter_obj, row)
{
	var row_index;
	var row_tr;

	if (typeof(row) == "number") {
		row_index 	= row;
	}
	else {
		row_tr 		= row;
	}
	
	if (row_tr === undefined) {
		if (row_index >= 0 && row_index < filter_obj.data_array.length) {
			row_tr = $('#' + filter_obj.table_id + ' tbody tr')[row_index];
		}
	}
	if (row_tr && row_tr.jr_sub_row) {
		return true;
	}
	return false;
}

function jr_FilterTableIsLoaded( filter_obj)
{
	if (filter_obj.is_loaded) {
		return true;
	}
	return false;
}
		
function jr_FilterTableHasData( filter_obj)
{
	if (filter_obj.data_array) {
		return true;
	}
	return false;
}

function jr_FilterTableClearFilters( filter_obj)
{
	if (filter_obj.filter_dataTable  &&  filter_obj.filter_dataTable.fnFilter !== undefined) {
		filter_obj.filter_dataTable.fnFilter("");
	}
}

function jr_FilterTableGetSelectedRowData( filter_obj)
{
	return filter_obj.filter_dataTable_api.rows('.' + filter_obj.active_row_class).data();
}

function jr_FilterTableGetRowData( filter_obj, row)
{
	var row_index;
	var row_tr;
	
	
	if (typeof(row) == "number") {
		row_index 	= row;
	}
	else {
		row_tr 		= row;
	}
	
	if (row_tr === undefined) {
		row_tr = $('#' + filter_obj.table_id + ' tbody tr')[row_index];
	}
	
	if (row_tr) {
		return filter_obj.filter_dataTable_api.row( row_tr).data();
	}
	/*
	** 5-14-2019:  could happen if there's no data to display?
	*/
	return undefined;
}

function jr_FilterTableSetRowData( filter_obj, row, data_info)
{
	var row_index;
	var row_tr;
	
	
	if (typeof(row) == "number") {
		row_index 	= row;
	}
	else {
		row_tr 		= row;
	}
	
	if (row_tr === undefined) {
		row_tr = $('#' + filter_obj.table_id + ' tbody tr')[row_index];
	}
	
	if (row_tr) {
		filter_obj.filter_dataTable_api.row( row_tr).data(data_info);
	}
	/*
	** 5-14-2019:  could happen if there's no data to display?
	*/
}

function jr_FilterTableGetRowIndex( filter_obj, row_tr)
{
	var row_index 		= $(row_tr).index();

	return row_index;
}

function jr_FilterTableAddColumnDefs( filter_obj, dataTable_options)
{
	var		num_columns	= filter_obj.column_array.length;
	var		col_obj;
	var		mdata_obj;
	var		z;

	if (dataTable_options.aoColumnDefs === undefined) {
		dataTable_options.aoColumnDefs	= new Array();
	}
	/*
	** 12-10-2012: dynamically add the mData information.
	*/
	for (z=0; z < num_columns; z++) {
		col_obj		= filter_obj.column_array[z];

		mdata_obj	= {
			aTargets	: [z]
		}


		if (col_obj.render_fn) {
			/*
			** 16-Feb-2015: the 1.10.5 version fnRender is replaced by render
			*/
			mdata_obj.render	= function( data, type, row, meta) {
									var		col_obj	= filter_obj.column_array[meta.col];
									return col_obj.render_fn(row);
								}
			
		}
		if (col_obj.field_name) {
			mdata_obj.mData				= col_obj.field_name;
		}
		else if (col_obj.data_index >= 0) {
			/*
			** 1-15-2013: can't have a negative mDataProp, it's used to 
			** index a row's data array.
			*/
			mdata_obj.mData				= col_obj.data_index;
		}
		else {
			/*
			** 1-15-2013: no data defined for the dummy row
			*/
			mdata_obj.mData				= null;
			mdata_obj.sDefaultContent	= null;
		}

		dataTable_options.aoColumnDefs.push( mdata_obj);
	}

	/*
	** 12-10-2012: Set the visible/searchable properties.
	** Set the characteristics first, then append all the columns that apply
	*/
	var		sTypes_obj			= {};
	var		bvisible_obj		= {
				bVisible		: false,
				aTargets		: []
			}
	var		bsearchable_obj		= {
				bSearchable		: false,
				aTargets		: []
			}
	var		bsortable_obj		= {
				bSortable		: false,
				aTargets		: []
			}

	for (z=0; z < num_columns; z++) {
		col_obj		= filter_obj.column_array[z];

		if (col_obj.is_hidden) {
			bvisible_obj.aTargets.push( z);
		}
		if (col_obj.is_searchable !== undefined  &&  ! col_obj.is_searchable) {
			bsearchable_obj.aTargets.push( z);
		}
		if (col_obj.is_sortable !== undefined  &&  ! col_obj.is_sortable) {
			bsortable_obj.aTargets.push( z);
		}
		if (col_obj.type !== undefined) {
			if (!(col_obj.type in sTypes_obj)) {
				sTypes_obj[col_obj.type] = {
					sType:		col_obj.type,
					aTargets:	[]
				};
			}
			sTypes_obj[col_obj.type].aTargets.push( z);
		}
	}

	if (bvisible_obj.aTargets.length > 0) {
		dataTable_options.aoColumnDefs.push( bvisible_obj);
	}
	if (bsearchable_obj.aTargets.length > 0) {
		dataTable_options.aoColumnDefs.push( bsearchable_obj);
	}
	if (bsortable_obj.aTargets.length > 0) {
		dataTable_options.aoColumnDefs.push( bsortable_obj);
	}
	for (var key in sTypes_obj) {
		dataTable_options.aoColumnDefs.push( sTypes_obj[key]);
	}
}

var jr_DAY_INTERVAL_SEC			= 24 * 60 * 60;
var jr_WEEK_INTERVAL_SEC		= 7 * jr_DAY_INTERVAL_SEC;
var jr_MONTH_INTERVAL_SEC		= 30 * jr_DAY_INTERVAL_SEC;
var jr_YEAR_INTERVAL_SEC		= 365 * jr_DAY_INTERVAL_SEC;

var jr_FILTER_TABLE_STARTING_AT_LABEL	= "From:";
var jr_FILTER_TABLE_ENDING_AT_LABEL		= "To:";

function jr_FilterTableAddCalendarFeature(
	filter_obj, feature_letter, wrapper_class, opt_interval_sec, opt_add_time)
{
	var init_dom_fn		= function( header_el, filter_obj, feature_options) {
		var str_buf;
 
		str_buf					= jr_StringBufCreate();

		jr_StringBufAdd( str_buf, '<form id="jr_ftab_refresh_interval_' + filter_obj.dom_id + '">');

		jr_StringBufAdd( str_buf, '<label>' + jr_FILTER_TABLE_STARTING_AT_LABEL + '</label>');
		jr_StringBufAdd( str_buf, ' <input id="jr_ftab_begintime_' + filter_obj.dom_id + '"');
		jr_StringBufAdd( str_buf, ' size="15" type="text" class="jr_ftab_text_input">');

		jr_StringBufAdd( str_buf, '<label style="margin-left: 5px;">' + jr_FILTER_TABLE_ENDING_AT_LABEL + '</label>');
		jr_StringBufAdd( str_buf, ' <input id="jr_ftab_endtime_' + filter_obj.dom_id + '"');
		jr_StringBufAdd( str_buf, ' size="15" type="text" class="jr_ftab_text_input" style="margin-right: 5px;">');

		jr_StringBufSetAsHtml( str_buf, header_el);

		var begin_time_input	= jr_ElementGetById( "jr_ftab_begintime_"	+ filter_obj.dom_id);
		var end_time_input		= jr_ElementGetById( "jr_ftab_endtime_"	+ filter_obj.dom_id);

		if (filter_obj.load_fn) {
			/*
			** 10-25-2011: need to instantiate the picker before setting the date.
			** 10-24-2011: the datepicker sets the date object passed to the time 00:00, 
			** so make a copy of the date object, since the object is passed by reference.
			*/

			if (begin_time_input) {
				$(begin_time_input).datepicker({
					onClose : function( dateText, inst) {
						window.setTimeout(function() {
							if (begin_time_input.jr_did_select) {
								$(end_time_input).datepicker('hide');
								filter_obj.load_fn( filter_obj);
								begin_time_input.jr_did_select	= false;
							}
						}, 0);
					},
					onSelect : function( dateText, inst) {
						begin_time_input.jr_did_select	= true;
					}
				});
				$(begin_time_input).datepicker(
					"setDate", new Date( feature_options.last_time.getTime() - feature_options.interval_sec * 1000)
				);
			}

			if (end_time_input) {
				$(end_time_input).datepicker({
					onClose : function( dateText, inst) {
						window.setTimeout(function() {
							if (end_time_input.jr_did_select) {
								$(begin_time_input).datepicker('hide');

								if (filter_obj.load_fn) {
									filter_obj.load_fn( filter_obj);
								}

								end_time_input.jr_did_select		= false;
								feature_options.has_user_end_time	= true;
							}
						}, 0);
					},
					onSelect : function( dateText, inst) {
						end_time_input.jr_did_select	= true;
					}
				});
				$(end_time_input).datepicker(
					"setDate", new Date( feature_options.last_time.getTime())
				);
			}
			feature_options.begin_time_input	= begin_time_input;
			feature_options.end_time_input		= end_time_input;
		}
	};

	if (opt_interval_sec === undefined) {
		opt_interval_sec	= jr_MONTH_INTERVAL_SEC;
	}
	var new_options = {
		feature_name	: "ftab_calendar",
		feature_letter	: feature_letter,
		wrapper_class	: wrapper_class,
		init_dom_fn		: init_dom_fn,
		interval_sec	: opt_interval_sec,
		last_time		: new Date()
	};

	jr_FilterTableAddFeature( filter_obj, new_options);
}

function jr_FilterTableAddPulldownFeature( filter_obj, options)
{
	var init_dom_fn		= function( header_el, filter_obj, feature_options) {

		str_buf					= jr_StringBufCreate();

		jr_StringBufAddSelectPulldown(
			str_buf, options.feature_name + filter_obj.dom_id, "jr_interval_select",
			options.choice_array, feature_options.curr_value, options.allow_multiple
		);

		jr_StringBufSetAsHtml( str_buf, header_el);

		var select_el		= jr_ElementGetById( options.feature_name + filter_obj.dom_id);
		
		if (select_el) {
			jr_ElementRegisterHandler(
				select_el,
				jr_CHANGE_EVENT,
				function() {
					feature_options.curr_value = select_el.value;
					options.select_fn( filter_obj, select_el.value)
				}
			);
		}

		feature_options.select_el		= select_el;
	};

	var new_options = {
		feature_name	: options.feature_name,
		feature_letter	: options.feature_letter,
		wrapper_class	: options.wrapper_class,
		init_dom_fn		: init_dom_fn,
		curr_value		: options.default_value
	};

	jr_FilterTableAddFeature( filter_obj, new_options);
}

function jr_FilterTableAddIntervalFeature(
	filter_obj, feature_letter, wrapper_class, opt_interval_array, opt_interval_sec)
{
	if (opt_interval_array === undefined) {
		opt_interval_array = [{
							selected_value 	: -1,
							label			: "Custom Time Range"
						},{
							selected_value 	: jr_DAY_INTERVAL_SEC,
							label			: "Last 24 Hours"
						},{
							selected_value 	: jr_WEEK_INTERVAL_SEC,
							label			: "Last Week"
						},{
							selected_value 	: jr_MONTH_INTERVAL_SEC,
							label			: "Last Month"
						},{
							selected_value 	: 3 * jr_MONTH_INTERVAL_SEC,
							label			: "Last 3 Months"
						},{ 
							selected_value	: jr_YEAR_INTERVAL_SEC,
							label			: "Last Year"
						}];
	}
	if (opt_interval_sec === undefined) {
		opt_interval_sec = jr_MONTH_INTERVAL_SEC;
	}

	jr_FilterTableAddPulldownFeature(
		filter_obj, {
			feature_name		: "ftab_interval",
			feature_letter		: feature_letter,
			wrapper_class		: wrapper_class,
			choice_array		: opt_interval_array,
			default_value		: opt_interval_sec,
			allow_multiple		: false,
			select_fn			: function( filter_obj, new_value) {
									filter_obj.load_fn( filter_obj, { use_interval_pulldown: true});
								}
		}
	);
}


function jr_FilterTableGetIntervalInputs( filter_obj, options)
{
	var feature_options;
	var feature_name;
	var interval_options;
	var calendar_options;
	var begin_time_input;
	var end_time_input;
	var interval_select;
	var curr_time				= new Date();
	var last_time
	var interval_sec;
	var end_time_sec;

	for (feature_name in filter_obj.feature_map) {
		feature_options = filter_obj.feature_map[feature_name];

		if (feature_options.feature_name == "ftab_interval") {
			interval_options = feature_options;
		}
		if (feature_options.feature_name == "ftab_calendar") {
			calendar_options = feature_options;
		}
	}

	if (interval_options) {
		interval_select		= interval_options.select_el;
	}
	if (calendar_options) {
		begin_time_input	= calendar_options.begin_time_input;
		end_time_input		= calendar_options.end_time_input;
	}

	if (! options) {
		options	 = {};
	}

	if (options.end_time_sec === undefined) {
		end_time_sec = 0;
	}
	else {
		end_time_sec = options.end_time_sec;
	}

	if (options.interval_sec  ||  options.use_interval_pulldown && interval_select) {
		if (options.use_interval_pulldown && interval_select) {
			interval_sec	= Number( interval_select.value);
			end_time_sec	= 0;
		}
		else {
			interval_sec	= options.interval_sec;
			end_time_sec	= end_time_sec;
		}

		if (end_time_sec == 0) {
			last_time	= curr_time;
		}
		else {
			last_time	= jr_CreateDateUtc( end_time_sec * 1000);
		}

		if (end_time_input) {
			$(end_time_input).datepicker( "setDate", new Date( last_time));

			if (calendar_options) {
				calendar_options.has_user_end_time	= false;
			}
		}
	}
	else if (begin_time_input  &&  end_time_input) {
		begin_time_date	= $(begin_time_input).datepicker("getDate");
		end_time_date	= $(end_time_input).datepicker("getDate");

		interval_sec	= Math.round(
							(end_time_date.getTime() - begin_time_date.getTime()) / 1000
						);

		if (	end_time_date.getTime() == calendar_options.last_time.getTime()
			&&  !calendar_options.has_user_end_time) {
			/*
			** 10-26-2011: The end time wasn't changed, i.e. should be now. Pass a 0 
			** to the backend to get everything recent.
			** Also reset the current time to now.
			*/
			$(end_time_input).datepicker( "setDate", new Date( curr_time.getTime()));

			last_time		= curr_time;
			end_time_sec	= 0;
		}
		else {
			last_time		= end_time_date;
 			end_time_sec	= Math.round( end_time_date.getTime() / 1000);
		}
	}
	else {
		interval_sec	= jr_MONTH_INTERVAL_SEC;
		last_time		= curr_time;
		end_time_sec	= 0;
	}

	if (calendar_options) {
		calendar_options.interval_sec	= interval_sec;
		calendar_options.last_time		= last_time
	}

	header_inputs = {
		interval_sec	: interval_sec,
		end_time_sec	: end_time_sec
	};

	return header_inputs;

}

var jr_FilterTableFeatureMap = {};

function jr_FilterTableAddFeature( filter_obj, feature_options)
{
	/*
	** 9-7-2017: lower case letters for cFeature are built-in
	** Looks like numbers are ok too, anything but '<' and '>'?
	**
	** aoFeatures is pre 1.10 naming.  New naming is ext.feature.
	*/
	if (jr_FilterTableFeatureMap[feature_options.feature_name] !== undefined) {
		var curr_feature = jr_FilterTableFeatureMap[feature_options.feature_name];

		if (curr_feature.feature_letter != feature_options.feature_letter) {
			
			/*
			** 9-11-2017: programming error, shouldn't use the same letter
			*/
			throw new Error( "jr_FilterTable: duplicate features '" + feature_options.feature_name
				+ "' but different letters: '" + curr_feature.feature_letter + "' and '"
				+ feature_options.feature_letter);
		}
	}

	if (jr_FilterTableFeatureMap[feature_options.feature_name] === undefined) {
		$.fn.dataTable.ext.feature.push( {
			fnInit		: function( oSettings ) {
							var table_id		= oSettings.sInstance;
							var new_el;

							new_el	= jr_ElementCreate( "span", "jr_ftab_dt_feature");
							jr_ElementSetAttr( new_el, "id", table_id + feature_options.feature_name);

							if (feature_options.wrapper_class) {
								jr_ElementAddClass( new_el, feature_options.wrapper_class);
							}

							return new_el;
						},
			cFeature	: feature_options.feature_letter,
			sFeature	: "jr_ftab-" + feature_options.feature_name
		});
	}

	if (filter_obj.feature_map === undefined) {
		filter_obj.feature_map = {};
	}
	filter_obj.feature_map[feature_options.feature_name] = feature_options;
}

function jr_FilterTableInitHeaderDom( filter_obj)
{
	var feature_options;
	var feature_name;
	var header_el;

	for (feature_name in filter_obj.feature_map) {
		feature_options = filter_obj.feature_map[feature_name];

		header_el		= jr_ElementGetById( filter_obj.table_id + feature_name);

		if (header_el && feature_options.init_dom_fn) {
			feature_options.init_dom_fn( header_el, filter_obj, feature_options);
		}
	}
}


/*
** 4-9-2013: apparently to use a dataTables plugin-api you need to copy/paste
** the code from the website?? See: http://datatables.net/plug-ins/api
*/

$.fn.dataTableExt.oApi.fnGetAdjacentTr  = function ( oSettings, nTr, bNext )
{
    /* Find the node's position in the aoData store */
    var iCurrent = oSettings.oApi._fnNodeToDataIndex( oSettings, nTr );
      
    /* Convert that to a position in the display array */
    var iDisplayIndex = $.inArray( iCurrent, oSettings.aiDisplay );
    if ( iDisplayIndex == -1 )
    {
        /* Not in the current display */
        return null;
    }
      
    /* Move along the display array as needed */
    iDisplayIndex += (bNext === undefined || bNext) ? 1 : -1;
      
    /* Check that it within bounds */
    if ( iDisplayIndex < 0 || iDisplayIndex >= oSettings.aiDisplay.length )
    {
        /* There is no next/previous element */
        return null;
    }
      
    /* Return the target node from the aoData store */
    return oSettings.aoData[ oSettings.aiDisplay[ iDisplayIndex ] ].nTr;
};


/*

.jr_ftab_title_div {
	border-bottom		: 1px solid #c0d0dd;
	height				: 1.5em;
	padding-left		: 2em;
	font-weight			: bold;
}

.jr_ftab_nested_body {
	height				: 100%;
	width				: 100%;
}
.jr_interval_select {
	margin-top: 4px;
	margin-left: 0;
}
.jr_ftab_text_input,
.jr_interval_select {
	-webkit-appearance: none;
	border: 1px solid #c0d0dd;
	font-weight: normal;
	background-color: white;
    width: 11em;
	border-radius: 3px;
	padding: 4px;
}
.jr_interval_select {
  	background: #fff url('../images/forms/bg_form_select.png') no-repeat right 4px center;
}
.jr_interval_select:first-child {
	margin-left: 6px;
}

.jr_ftab_row_highlight {
	background-color: #bccfe2 !important;
}
.jr_ftab_tablemenu {
	float: left;
	line-height: 1.5em;
	font-size: 1.5em;
	margin-left: 0.5em;
	margin-right: 1em;

}
.jr_ftab_dt_feature {
  display: inline-block;
  z-index: 3;
}

.dt_calendar {
  padding-left: 5px;
}
.dt_calendar>form>input {
  font-size: 0.6875em;
}

.dt_interval {
  margin-right: 5px;
}

.dt_interval select {
  color: #000;
}
.dt_button_icon {
  padding: 0 ; 
  position: relative;
  top: 0.25em;
}



*/
