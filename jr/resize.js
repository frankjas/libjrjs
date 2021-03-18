jr_DiagRegister( "jr_Resize",	"Start",				"resize start info");


function jr_Resize()
{
}

function jr_ResizeCreate( corner_size, opt_size_units)
{
	var		object				= new jr_Resize();

	object.corner_size			= corner_size;

	if (opt_size_units === undefined) {
		object.corner_size_units	= "px";
	}
	else {
		object.corner_size_units	= opt_size_units;
	}

	object.min_width			= 0;
	object.min_height			= 0;
	object.max_width			= 0;
	object.max_height			= 0;

	object.do_width				= true;
	object.do_height			= true;
	object.do_right_control		= true;
	object.do_left_control		= true;
	object.do_top_control		= true;
	object.do_bottom_control	= true;

	object.resize_handlers		= new Array();

	return object;
}

function jr_ResizeSetDragControl( object, drag_control)
{
	object.drag_control		= drag_control;
}

function jr_ResizeSetMouseUpHandler( object, mouse_up_handler, handler_arg)
{
	object.mouse_up_handler		= mouse_up_handler;
	object.mouse_up_handler_arg	= handler_arg;
}

function jr_ResizeSetMouseMoveHandler( object, mouse_move_handler, handler_arg)
{
	object.mouse_move_handler		= mouse_move_handler;
	object.mouse_move_handler_arg	= handler_arg;
}

function jr_ResizeDoWidthOnly( object, value)
{
	if (value) {
		object.do_height		= false;
	}
	else {
		object.do_height		= true;
	}
}

function jr_ResizeDoHeightOnly( object, value)
{
	if (value) {
		object.do_width		= false;
	}
	else {
		object.do_width		= true;
	}
}

function jr_ResizeSetMinHeight( object, min_height)
{
	object.min_height			= min_height;
}

function jr_ResizeSetMinWidth( object, min_width)
{
	object.min_width			= min_width;
}

function jr_ResizeSetMaxHeight( object, max_height)
{
	object.max_height			= max_height;
}

function jr_ResizeSetMaxWidth( object, max_width)
{
	object.max_width			= max_width;
}

function jr_ResizeDoLeftOnly( object, value)
{
	if (value) {
		object.do_left_control	= true;
		object.do_right_control	= false;
	}
	else {
		object.do_left_control	= false;
		object.do_right_control	= true;
	}
}

function jr_ResizeDoRightOnly( object, value)
{
	if (value) {
		object.do_left_control	= false;
		object.do_right_control	= true;
	}
	else {
		object.do_left_control	= true;
		object.do_right_control	= false;
	}
}

function jr_ResizeDoTopOnly( object, value)
{
	if (value) {
		object.do_bottom_control	= false;
	}
	else {
		object.do_bottom_control	= true;
	}
}

function jr_ResizeDoBottomOnly( object, value)
{
	if (value) {
		object.do_top_control		= false;
	}
	else {
		object.do_top_control		= true;
	}
}

function jr_ResizeActivate( object, resize_div)
{
	var		resize_left_div		= document.createElement ("div");
	var		resize_right_div	= document.createElement ("div");
	var		min_zindex			= jr_ElementGetAssignedStyle( resize_div, "zIndex");

	if (object.do_left_control) {
		jr_ElementAppendChild( resize_div, resize_left_div);

		jr_ElementSetStyle( resize_left_div,		"position",		"absolute");
		jr_ElementSetStyle( resize_left_div,		"zIndex",		min_zindex + 2);
		/*
		** 12/27/08: needs to be on top for cursor
		*/

		resize_left_div.jr_resize_is_left	= true;
		resize_left_div.jr_resize_div		= resize_div;

		jr_ElementRegisterHandler( resize_left_div, jr_MOUSE_DOWN_EVENT,	jr_ResizeHandleMouseDown, object);
		/*
		** 8/4/09: don't register the mouse up/move handlers, we register them
		** with the document below.
		*/
	}

	if (object.do_right_control) {
		jr_ElementAppendChild( resize_div, resize_right_div);

		jr_ElementSetStyle( resize_right_div,		"position",		"absolute");
		jr_ElementSetStyle( resize_right_div,		"zIndex",		min_zindex + 2);
		/*
		** 12/27/08: needs to be on top for cursor
		*/

		resize_right_div.jr_resize_is_left	= false;
		resize_right_div.jr_resize_div		= resize_div;

		jr_ElementRegisterHandler( resize_right_div, jr_MOUSE_DOWN_EVENT,	jr_ResizeHandleMouseDown, object);
		/*
		** 8/4/09: don't register the mouse up/move handlers, we register them
		** with the document below.
		*/
	}

	if (jr_IsIE) {
		/*
		** 12/27/08: otherwise the divs end up a minimum size greater than corner size.
		*/
		jr_ElementSetStyle( resize_left_div,	"fontSize",		1);
		jr_ElementSetStyle( resize_right_div,	"fontSize",		1);
	}

	if (!object.do_height) {
		/*
		** 9/8/09: make the control along the left/right borders
		*/
		if (object.do_left_control) {
			resize_left_div.style.height	= "100%";
			resize_left_div.style.width		= String( object.corner_size ) + object.corner_size_units;
			resize_left_div.style.cursor	= "w-resize";
			resize_left_div.style.left		= String( 0) + "px";
			resize_left_div.style.bottom	= String( 0) + "px";
		}


		if (object.do_right_control) {
			resize_right_div.style.height	= "100%";
			resize_right_div.style.width	= String( object.corner_size ) + object.corner_size_units;
			resize_right_div.style.cursor	= "e-resize";
			resize_right_div.style.right	= String( 0) + "px";
			resize_right_div.style.bottom	= String( 0) + "px";
		}
	}
	else if (!object.do_width) {
		/*
		** 9/18/09: make the control along the top/bottom borders
		*/
		if (object.do_top_control) {
			resize_left_div.style.height	= String( object.corner_size ) + object.corner_size_units;
			resize_left_div.style.width		= "100%";
			resize_left_div.style.cursor	= "n-resize";
			resize_left_div.style.left		= String( 0) + "px";
			resize_left_div.style.top		= String( 0) + "px";
			resize_left_div.jr_resize_is_top	= true;
		}


		if (object.do_bottom_control) {
			resize_right_div.style.height	= String( object.corner_size ) + object.corner_size_units;
			resize_right_div.style.width	= "100%";
			resize_right_div.style.cursor	= "s-resize";
			resize_right_div.style.left		= String( 0) + "px";
			resize_right_div.style.bottom	= String( 0) + "px";
			resize_right_div.jr_resize_is_top	= false;
		}
	}
	else {
		if (object.do_left_control) {
			resize_left_div.style.cursor	= "sw-resize";
			resize_left_div.style.height	= String( object.corner_size ) + object.corner_size_units;
			resize_left_div.style.width		= String( object.corner_size ) + object.corner_size_units;
			resize_left_div.style.left		= String( 0) + "px";
			resize_left_div.style.bottom	= String( 0) + "px";
		}


		if (object.do_right_control) {
			resize_right_div.style.cursor	= "se-resize";
			resize_right_div.style.height	= String( object.corner_size ) + object.corner_size_units;
			resize_right_div.style.width	= String( object.corner_size ) + object.corner_size_units;
			resize_right_div.style.right	= String( 0) + "px";
			resize_right_div.style.bottom	= String( 0) + "px";
		}
	}

	if (jr_IsIE) {
		/*
		** 12/30/08: without a color, only the border triggers a drag
		*/
		resize_left_div.style.backgroundColor	= "red";
		resize_right_div.style.backgroundColor	= "red";

		jr_ElementSetOpacityPercent( resize_left_div, 1);
		jr_ElementSetOpacityPercent( resize_right_div, 1);
	}

	if (false) {
		resize_right_div.style.border	= "1px solid black";
		resize_left_div.style.border	= "1px solid black";
	}

	if (object.do_left_control) {
		object.resize_left_div	= resize_left_div;
	}
	if (object.do_right_control) {
		object.resize_right_div	= resize_right_div;
	}


	object.resize_div			= resize_div;
}

function jr_ResizeDeactivate( object)
{
	if (object.resize_left_div) {
		jr_ElementRemoveFromDom( object.resize_left_div);
		delete object.resize_left_div;
	}
	if (object.resize_right_div) {
		jr_ElementRemoveFromDom( object.resize_right_div);
		delete object.resize_right_div;
	}
}

function jr_ResizeAddHandler( object, handler_fn, handler_fn_arg )
{
	var		handler_obj		= new Object();

	handler_obj.fn			= handler_fn;
	handler_obj.fn_arg		= handler_fn_arg;

	object.resize_handlers.push( handler_obj );
}

function jr_ResizeDoHandlers( object )
{
	var		handler_obj;
	var		q;

	for (q=0; q < object.resize_handlers.length; q++) {
		handler_obj	= object.resize_handlers[q];

		handler_obj.fn( handler_obj.fn_arg, object );
	}
}

function jr_ResizeStart (object, cursor_down_x, cursor_down_y, uses_left, uses_top)
{
	var		resize_div		= object.resize_div;
	/*
	** 9/8/09: Use clientHeight since we're setting "style.height", and the latter
	** corrsponds to the height within the borders, as does clientHeight.
	** This fixes (reduces in some cases?) an initial "hop" when moving the left edge.
	*/
	object.resize_div_height	= resize_div.clientHeight;
	object.resize_div_width		= resize_div.clientWidth;
	object.resize_div_left		= resize_div.offsetLeft;
	object.down_x				= cursor_down_x;
	object.down_y				= cursor_down_y;

	object.jr_resize_uses_left	= uses_left;
	object.jr_resize_uses_top	= uses_top;


	/*
	** 6/29/08: register the event with the document so that you'll see the events
	** regardless of whether the mouse is actual over the dragged element.
	*/
	jr_ElementRegisterHandler( document, jr_MOUSE_MOVE_EVENT,	jr_ResizeHandleMouseMove, object);
	jr_ElementRegisterHandler( document, jr_MOUSE_UP_EVENT, 	jr_ResizeHandleMouseUp, object);

	if (jr_DoDiag.jr_ResizeStart) {
		jr_DiagClear();
	}
}

function jr_ResizeStop( object)
{
	if (object.mouse_up_handler) {
		object.mouse_up_handler( object.mouse_up_handler_arg, object.resize_div);
	}
}

function jr_ResizeHandleMouseDown( object, click_div, event_object)
{
	var		click_x				= event_object.clientX;
	var		click_y				= event_object.clientY;

	jr_ResizeStart(
		object, click_x, click_y, click_div.jr_resize_is_left, click_div.jr_resize_is_top
	);
}

function jr_ResizeHandleMouseUp( object, document_el)
{
	jr_ElementUnRegisterHandler( document, jr_MOUSE_MOVE_EVENT);
	jr_ElementUnRegisterHandler( document, jr_MOUSE_UP_EVENT);

	jr_ResizeStop( object);

	if (object.drag_control) {
		jr_DragSetLimits( object.drag_control );
	}
}

function jr_ResizeHandleMouseMove( object, document_el, event_object)
{
	var		resize_div			= object.resize_div;
	var		curr_x				= event_object.clientX;
	var		curr_y				= event_object.clientY;
	var		diff_x;
	var		diff_y;
	var		new_height;
	var		new_width;
	var		reset_left_edge		= false;
	var		reset_top_edge		= false;

	if (object.do_width) {
		diff_x		= curr_x - object.down_x;

		if (object.jr_resize_uses_left) {
			reset_left_edge	= true;

			new_width	= object.resize_div_width - diff_x;
		}
		else {
			new_width	= object.resize_div_width + diff_x;
		}

		if (object.min_width > 0  &&  new_width < object.min_width) {
			new_width	= object.min_width;
		}
		if (object.max_width > 0  &&  new_width > object.max_width) {
			new_width	= object.max_width;
		}

		resize_div.style.width	= String( new_width ) + "px";
	}

	if (object.do_height) {
		diff_y		= curr_y - object.down_y;

		if (object.jr_resize_uses_top) {
			reset_top_edge	= true;

			new_height	= object.resize_div_height - diff_y;
		}
		else {
			new_height	= object.resize_div_height + diff_y;
		}

		if (object.min_height > 0  &&  new_height < object.min_height) {
			new_height	= object.min_height;
		}
		if (object.max_height > 0  &&  new_height > object.max_height) {
			new_height	= object.max_height;
		}

		resize_div.style.height	= String( new_height ) + "px";
	}


	if (reset_left_edge) {
		resize_div.style.left	= String( object.resize_div_left + diff_x ) + "px";
	}
	if (reset_top_edge) {
		resize_div.style.top	= String( object.resize_div_top + diff_y ) + "px";
	}

	jr_ResizeDoHandlers( object );

	if (object.mouse_move_handler) {
		object.mouse_move_handler(
			object.mouse_move_handler_arg, resize_div, diff_x, diff_y
		);
	}

	if (jr_DoDiag.jr_ResizeMouseMove) {
		var			status_msg		= "";

		status_msg		+= "(" + resize_div.offsetLeft + ", " + resize_div.offsetTop + ")";
		status_msg		+= "  " + diff_x + " ";
		status_msg		+= "(" + new_width + ", " + new_height + ")";
		status_msg		+= "new x: " + resize_div.style.left;

		jr_DiagPrintLine( status_msg);
	}
}

