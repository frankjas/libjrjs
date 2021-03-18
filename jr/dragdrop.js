jr_DiagRegister( "jr_Drag",		"Start",				"drag start info");
jr_DiagRegister( "jr_Drag",		"MouseMove",			"drag move positions");
jr_DiagRegister( "jr_Drag",		"ActivateDropTargets",	"activating drop targets");

function jr_Drag()
{
}

function jr_DragCreate( drag_area_div)
{
	var		object	= new jr_Drag();

	if (! drag_area_div) {
		drag_area_div	= document.documentElement;
	}
	object.drag_area_div			= drag_area_div;
	object.drag_overlap_width		= 0;
	object.drag_area_border_width	= 0;

	return object;
}

function jr_DragSetAreaBorderWidth( object, drag_area_border_width)
{
	object.drag_area_border_width		= drag_area_border_width;
}

function jr_DragSetDragOverlapWidth( object, drag_overlap_width)
{
	object.drag_overlap_width		= drag_overlap_width;
}

function jr_DragSetStartStopFns( object, drag_start_fn, drag_stop_fn, opt_fn_arg)
{
	object.drag_start_fn	= drag_start_fn;
	object.drag_stop_fn		= drag_stop_fn;
	object.opt_fn_arg		= opt_fn_arg;
}

function jr_DragActivate( object, grab_div, drag_div)
{
	var		tmp_style;

	if (drag_div === undefined) {
		drag_div	= grab_div;
	}

	tmp_style		= jr_ElementGetActiveStyle( drag_div, "position");

	if (tmp_style == "relative"  ||  tmp_style == "static") {
		throw new Error( "Can't jr_Drag() with 'relative' or 'static' positioned elements");
	}
	
	tmp_style		= jr_ElementGetActiveStyle( drag_div, "display");

	if (tmp_style != "block") {
		throw new Error( "jr_Drag() requires 'block' display");
	}
	
	if (grab_div === null  ||  grab_div === undefined) {
		grab_div	= drag_div;
	}

	if (jr_NodeIsSubNode( drag_div, object.drag_area_div)) {
		/*
		** 2-25-2011: check whether the drag_div has any parents/offsetParents
		** with overflow "auto"? Can't drag outside these so this element
		** is between the drag_div and the drag_area, then the behavior will
		** be unexpected.
		*/
		var		parent_node		= drag_div.offsetParent;

		while (parent_node !== object.drag_area_div) {
			tmp_style		= jr_ElementGetActiveStyle( parent_node, "overflow");

			if (tmp_style == "auto") {
				throw new Error( "jr_Drag() can't drag outside a parent with overflow auto");
			}

			parent_node		= parent_node.parentNode;
		}
	}


	jr_ElementSetIsDraggable( drag_div, true);

	grab_div.style.cursor			= "move";

	object.grab_div			= grab_div;
	object.drag_div			= drag_div;

	jr_ElementRegisterHandler( grab_div, jr_MOUSE_DOWN_EVENT,	jr_DragHandleMouseDown, object);
}

function jr_DragSetLimits( object, cursor_down_x, cursor_down_y )
{
	var		drag_div				= object.drag_div;
	var		area_div				= object.drag_area_div;
	var		drag_origin;
	var		area_origin;
	var		grab_diff_x;
	var		grab_diff_y;
	var		area_width;
	var		area_height;

	drag_origin	= jr_ElementGetAbsOrigin( drag_div);
	area_origin	= jr_ElementGetAbsOrigin( area_div);

	/*
	** 7/23/09: Translate the drag_area coordinates into the drag_div coordinates.
	** by converting both to absoluate coordinates wrt viewport
	*/
	object.drag_start_x		= drag_div.offsetLeft;
	object.drag_start_y		= drag_div.offsetTop;

	object.drag_abs_x		= drag_origin.x + drag_div.offsetLeft;
	object.drag_abs_y		= drag_origin.y + drag_div.offsetTop;

	object.cursor_down_x	= cursor_down_x;
	object.cursor_down_y	= cursor_down_y;

	grab_diff_x				= object.cursor_down_x - object.drag_abs_x;
	grab_diff_y				= object.cursor_down_y - object.drag_abs_y;

	object.drag_min_x		= area_origin.x + area_div.offsetLeft + grab_diff_x;
	object.drag_min_y		= area_origin.y + area_div.offsetTop + grab_diff_y;

	object.drag_origin		= drag_origin;

	/*
	** 3/12/2010: the documentElement's height can be less that the innerWidth
	** so use the "inner" dimensions in this case.
	*/
	if (area_div === document.documentElement) {
		area_width	= window.innerWidth;
	}
	else if (area_div.offsetWidth == 0) {
		throw new Error( "jr_DragSetLimits(): drag area has 0 width");
	}
	else {
		area_width	= area_div.offsetWidth;
	}

	if (area_div === document.documentElement) {
		area_height	= window.innerHeight;
	}
	else if (area_div.offsetHeight == 0) {
		throw new Error( "jr_DragSetLimits(): drag area has 0 height");
	}
	else {
		area_height	= area_div.offsetHeight;
	}

	object.drag_max_x			= object.drag_min_x + area_width;
	object.drag_max_y			= object.drag_min_y + area_height;

	if (drag_div.offsetWidth < object.drag_max_x) {
		object.drag_max_x		+= -drag_div.offsetWidth;
	}
	if (drag_div.offsetHeight < object.drag_max_y) {
		object.drag_max_y		+= -drag_div.offsetHeight;
	}

	if (object.drag_overlap_width > 0) {
		object.drag_min_x		+= -object.drag_overlap_width;
		object.drag_min_y		+= -object.drag_overlap_width;
		object.drag_max_x		+= object.drag_overlap_width;
		object.drag_max_y		+= object.drag_overlap_width;
	}

	object.drag_min_x			-= object.drag_area_border_width;
	object.drag_min_y			-= object.drag_area_border_width;
	object.drag_max_x			-= 2 * object.drag_area_border_width;
	object.drag_max_y			-= 2 * object.drag_area_border_width;


	if (jr_DoDiag.jr_DragStart) {
		var			diag_string		= "";
		var			tmp_x;
		var			tmp_y;

		tmp_x			= drag_origin.x + drag_div.offsetLeft;
		tmp_y			= drag_origin.y + drag_div.offsetTop;
		diag_string		= "drag abs:  (" + tmp_x + ", " + tmp_y + ")";
		jr_DiagPrintLine( diag_string);

		tmp_x			= area_origin.x + area_div.offsetLeft;
		tmp_y			= area_origin.y + area_div.offsetTop;
		diag_string		= "area abs:  (" + tmp_x + ", " + tmp_y + ")";
		jr_DiagPrintLine( diag_string);

		diag_string		= "area size:  (" + area_width + ", " + area_height + ")";
		jr_DiagPrintLine( diag_string);

		diag_string		= "min:  (" + object.drag_min_x + ", " + object.drag_min_y + ")";
		jr_DiagPrintLine( diag_string);

		diag_string		= "max:  (" + object.drag_max_x + ", " + object.drag_max_y + ")";
		jr_DiagPrintLine( diag_string);
	}
}

function jr_DragStart (object, cursor_down_x, cursor_down_y)
{
	var		drag_div			= object.drag_div;

	if (jr_DoDiag.jr_DragStart) {
		jr_DiagClear();
	}

	jr_DragSetLimits( object, cursor_down_x, cursor_down_y );

	/*
	** 6/29/08: register the event with the document so that you'll see the events
	** regardless of whether the mouse is actual over the dragged element.
	** 9-5-11 ToDo: is document.body better (also change UnRegister)?
	*/
	jr_ElementRegisterHandler( document,	jr_MOUSE_MOVE_EVENT,	jr_DragHandleMouseMove,	object);
	jr_ElementRegisterHandler( document,	jr_MOUSE_UP_EVENT, 	jr_DragHandleMouseUp,	object);

	if (object.drag_start_fn) {
		if (object.opt_fn_arg !== undefined) {
			object.drag_start_fn(
				object.opt_fn_arg, drag_div, cursor_down_x, cursor_down_y, object
			);
		}
		else {
			object.drag_start_fn( drag_div, cursor_down_x, cursor_down_y, object);
		}
	}

	if (object.drag_drop_array !== undefined) {
		jr_DragActivateDropTargets( object);
	}

	if (jr_DoDiag.jr_DragStart) {
		var			diag_string		= "";

		diag_string		= "start:  (" + object.drag_start_x + ", " + object.drag_start_y + ")";
		jr_DiagPrintLine( diag_string);

		diag_string		= "cursor: (" + object.cursor_down_x + ", " + object.cursor_down_y + ")";
		jr_DiagPrintLine( diag_string);

		jr_DiagPrintLine( diag_string);
	}
}

function jr_DragStop( object, cursor_up_x, cursor_up_y)
{
	var		drag_div			= object.drag_div;
	var		target_index;
	var		drop_info;
	var		drop_worked;

	jr_ElementUnRegisterHandler( document, jr_MOUSE_MOVE_EVENT);
	jr_ElementUnRegisterHandler( document, jr_MOUSE_UP_EVENT);


	if (object.drag_drop_array === undefined) {
		if (object.drag_stop_fn) {
			if (object.opt_fn_arg !== undefined) {
				object.drag_stop_fn( object.opt_fn_arg, drag_div, cursor_up_x, cursor_up_y);
			}
			else {
				object.drag_stop_fn( drag_div, cursor_up_x, cursor_up_y);
			}
		}
	}
	else {
		target_index		= object.drag_drop_target_index;

		jr_DragDeactivateDropTargets( object);

		object.drag_drop_target_index	= -1;

		if (target_index !== undefined  &&	target_index >= 0) {

			drop_info	= object.drag_drop_array[ target_index];

			if (drop_info.handle_drop_received) {
				if (drop_info.handler_arg !== undefined) {
					drop_worked	= drop_info.handle_drop_received(
									drop_info.handler_arg,
									object.drag_div,
									drop_info.drop_target_div
								); 
				}
				else {
					drop_worked	= drop_info.handle_drop_received(
									object.drag_div,
									drop_info.drop_target_div
								); 
				}
			}
			else {
				drop_worked = true;
			}
		}
		else {
			drop_worked	= false;
		}

		if (!drop_worked) {
			jr_ElementSetStyle( drag_div,	"left",		object.drag_start_x);
			jr_ElementSetStyle( drag_div,	"top",		object.drag_start_y);

			if (object.drag_stop_fn) {
				if (object.opt_fn_arg !== undefined) {
					object.drag_stop_fn(
						object.opt_fn_arg, drag_div, cursor_up_x, cursor_up_y
					);
				}
				else {
					object.drag_stop_fn( drag_div, cursor_up_x, cursor_up_y);
				}
			}
		}
	}
}

function jr_DragAddDropTarget(
	object, drop_target_div,
	handle_mouse_over, handle_mouse_out, handle_drop_received, handler_arg)
{
	var		drop_info;
	var		target_overlay;
	var		q;

	if (object.drag_drop_array === undefined) {
		object.drag_drop_array	= new Array();
	}

	target_overlay					= jr_ElementCreate( "div");

	jr_ElementSetStyle( target_overlay,		"position",			"absolute");
	jr_ElementSetStyle( target_overlay,		"backgroundColor",	"transparent");

	drop_info						= new Object();

	drop_info.drop_target_div		= drop_target_div;
	drop_info.target_overlay		= target_overlay;
	drop_info.handle_mouse_over		= handle_mouse_over;			
	drop_info.handle_mouse_out		= handle_mouse_out;			
	drop_info.handle_drop_received	= handle_drop_received;			
	drop_info.handler_arg			= handler_arg;			

	object.drag_drop_array.push( drop_info);
}

function jr_DragActivateDropTargets( object)
{
	var		drag_div				= object.drag_div;
	var		drop_array				= object.drag_drop_array;
	var		drag_parent_el			= drag_div.parentNode;
	var		drag_origin;
	var		target_origin;
	var		origin_diff_x;
	var		origin_diff_y;
	var		drop_info;
	var		drop_target_div;
	var		target_overlay;
	var		target_zindex			= jr_ElementGetActiveStyle( drag_div, "zIndex");


	/*
	** 1-19-2011: append the target overlays to the drag_div's parent
	** so the two are part of the same stacking context.  The drag_div's
	** context has to layer on top of the drop target (this is the caller's
	** responsibility). The targer overlay needs to be over that.
	**
	** Another approach is to add the drag div and target overlay's
	** to the drop target's parent, but this requires the drop targets
	** to be siblings, requires temporily reparenting the drag div, and
	** requires calculating the max. zindex of all drop targets.
	*/

	drag_origin	= jr_ElementGetAbsOrigin( drag_div);

	for (q=0; q < drop_array.length; q++) {
		drop_info		= drop_array[q];

		drop_target_div	= drop_info.drop_target_div;
		target_overlay	= drop_info.target_overlay;

		target_origin	= jr_ElementGetAbsOrigin( drop_target_div);

		origin_diff_x	= target_origin.x - drag_origin.x;
		origin_diff_y	= target_origin.y - drag_origin.y;

		jr_ElementAppendChild( drag_parent_el, target_overlay);

		jr_ElementSetStyle( target_overlay,		"left",		drop_target_div.offsetLeft + origin_diff_x);
		jr_ElementSetStyle( target_overlay,		"top",		drop_target_div.offsetTop + origin_diff_y) ;
		jr_ElementSetStyle( target_overlay,		"width",	drop_target_div.offsetWidth);
		jr_ElementSetStyle( target_overlay,		"height",	drop_target_div.offsetHeight);
		jr_ElementSetStyle( target_overlay,		"zIndex",	target_zindex + 1);

		if (jr_IsIE) {
			/*
			** 1-20-2011: mouseover doesn't fire unless the overlay is visible.
			*/
			jr_ElementSetStyle( target_overlay,		"backgroundColor", "white");
			jr_ElementSetOpacityPercent( target_overlay, 1);
		}

		target_overlay.jr_drag_div					= drag_div;
		target_overlay.jr_drag_drop_target_div		= drop_target_div;
		target_overlay.jr_drag_drop_target_index	= q;

		jr_ElementRegisterHandler(
			target_overlay, jr_MOUSE_OVER_EVENT, jr_DragHandleDropMouseOver, object
		);
		jr_ElementRegisterHandler(
			target_overlay, jr_MOUSE_OUT_EVENT, jr_DragHandleDropMouseOut, object
		);

		if (jr_DoDiag.jr_DragActivateDropTargets) {
			var			status_msg		= "";

			status_msg		+= "overlay: ";
			status_msg		+= "(" + target_overlay.offsetLeft + ", " + target_overlay.offsetTop + ")";
			status_msg		+= " target: ";
			status_msg		+= "(" + drop_target_div.offsetLeft + ", " + drop_target_div.offsetTop + ")";

			jr_DiagPrintLine( status_msg);
		}
	}
}

function jr_DragDeactivateDropTargets( object)
{
	var		drop_array		= object.drag_drop_array;

	for (q=0; q < drop_array.length; q++) {
		drop_info		= drop_array[q];

		jr_ElementRemoveFromDom( drop_info.target_overlay);
	}
}


function jr_DragHandleMouseDown (object, grab_div, event_object)
{
	var		click_x				= event_object.clientX;
	var		click_y				= event_object.clientY;

	jr_DragStart( object, click_x, click_y);
}

function jr_DragHandleMouseUp( object, document_el, event_object)
{
	var		click_x				= event_object.clientX;
	var		click_y				= event_object.clientY;

	jr_DragStop( object, click_x, click_y);
}

function jr_DragHandleMouseMove (object, document_el, event_object)
{
	var		drag_div			= object.drag_div;
	var		curr_x				= event_object.clientX;
	var		curr_y				= event_object.clientY;
	var		new_x;
	var		new_y;

	if (curr_x < object.drag_min_x) {
		curr_x	= object.drag_min_x;
	}
	if (curr_x > object.drag_max_x) {
		curr_x	= object.drag_max_x;
	}
	if (curr_y < object.drag_min_y) {
		curr_y	= object.drag_min_y;
	}
	if (curr_y > object.drag_max_y) {
		curr_y	= object.drag_max_y;
	}

	new_x	= object.drag_start_x + curr_x - object.cursor_down_x;
	new_y	= object.drag_start_y + curr_y - object.cursor_down_y;

	drag_div.style.left	= String( new_x ) + "px";
	drag_div.style.top	= String( new_y ) + "px";

	if (jr_DoDiag.jr_DragMouseMove) {
		var			status_msg		= "";

		status_msg		+= "(" + drag_div.offsetLeft + ", " + drag_div.offsetTop + ")";
		status_msg		+= "  ";
		status_msg		+= "(" + new_x + ", " + new_y + ")";
		status_msg		+= "  ";
		status_msg		+= "(" + object.drag_max_x + ", " + object.drag_max_y + ")";

		jr_DiagPrintLine( status_msg);
	}
}

function jr_DragHandleDropMouseOver (object, target_overlay, event_object)
{
	if (target_overlay.jr_drag_div === object.drag_div) {
		var		target_index		= target_overlay.jr_drag_drop_target_index;
		var		drop_info			= object.drag_drop_array[ target_index];

		if (drop_info.handle_mouse_over) {

			if (drop_info.handler_arg !== undefined) {
				drop_info.handle_mouse_over(
					drop_info.handler_arg,
					target_overlay.jr_drag_div,
					target_overlay.jr_drag_drop_target_div
				); 
			}
			else {
				drop_info.handle_mouse_over(
					target_overlay.jr_drag_div,
					target_overlay.jr_drag_drop_target_div
				); 
			}
		}
		object.drag_drop_target_index		= target_index;
		if (jr_DoDiag.jr_DragMouseOver) {
			var			status_msg		= "";

			status_msg		+= "over target: " + target_index;

			jr_DiagPrintLine( status_msg);
		}
	}
}

function jr_DragHandleDropMouseOut (object, target_overlay, event_object)
{
	if (target_overlay.jr_drag_div === object.drag_div) {
		var		target_index		= target_overlay.jr_drag_drop_target_index;
		var		drop_info			= object.drag_drop_array[ target_index];

		if (drop_info.handle_mouse_out) {

			if (drop_info.handler_arg !== undefined) {
				drop_info.handle_mouse_out(
					drop_info.handler_arg,
					target_overlay.jr_drag_div,
					target_overlay.jr_drag_drop_target_div
				); 
			}
			else {
				drop_info.handle_mouse_out(
					target_overlay.jr_drag_div,
					target_overlay.jr_drag_drop_target_div
				); 
			}
		}
		object.drag_drop_target_index		= -1;
	}
}

