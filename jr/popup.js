function jr_Popup()
{
}

function jr_PopupCreate( title_string, close_img_url, start_width, start_height, start_x, start_y)
{
	var		object	= new jr_Popup();

	object.title_string		= title_string;
	object.close_img_url	= close_img_url;

	if (start_width !== undefined) {
		object.start_width	= start_width;
	}
	if (start_height !== undefined) {
		object.start_height	= start_height;
	}

	if (start_x !== undefined) {
		object.start_x		= start_x;
	}
	if (start_y !== undefined) {
		object.start_y		= start_y;
	}

	object.border_width		= 2;
	object.border_style		= object.border_width + "px solid black";
	object.shadow_width		= 6;		// 2-23-2011: 4 + 2 for the border?
	object.title_bar_color	= "salmon";
	object.background_color	= "white";
	object.content_overflow	= "auto";

	object.content_margin	= 10;
	object.allow_resize		= true;

	return object;
}

function jr_PopupSetTitleColor( popup_control, color)
{
	popup_control.title_bar_color	= color;
}

function jr_PopupSetColor( popup_control, color)
{
	popup_control.background_color	= color;
}

function jr_PopupSetAllowResize( popup_control, value)
{
	popup_control.allow_resize	= value;
}

function jr_PopupSetMaxHeight( popup_control, max_height)
{
	popup_control.max_height	= max_height;
}

function jr_PopupSetMaxWidth( popup_control, max_width)
{
	popup_control.max_width	= max_width;
}

function jr_PopupSetContent( popup_control, content_arg)
{
	popup_control.content_arg	= content_arg;
}

function jr_PopupSetContentCreateFn( popup_control, content_create_fn)
{
	popup_control.content_create_fn	= content_create_fn;
}

function jr_PopupSetContentOverflow( popup_control, value)
{
	popup_control.content_overflow	= value;
}

function jr_PopupSetCloseHandler( popup_control, close_handler)
{
	popup_control.close_handler	= close_handler;
}

function jr_PopupGetCloseButton( popup_control)
{
	return popup_control.close_button;
}

function jr_PopupDiv( popup_control)
{
	return popup_control.popup_div;
}

function jr_PopupOpen( popup_control, parent_el, zindex)
{
	var		popup_div			= jr_ElementAppendChild( parent_el,			"div");
	var		shadow_div			= jr_ElementAppendChild( popup_div,			"div");
	var		grab_div			= jr_ElementAppendChild( popup_div,			"div");
	var		content_parent_div	= jr_ElementAppendChild( popup_div,			"div");
	var		label_span			= jr_ElementAppendChild( grab_div,			"span");

	var		grab_height_em		= 1.5;

	/*
	** 10-21-2010: initialize these first so that other functions
	** can make use
	*/

	popup_control.popup_div				= popup_div;
	popup_control.grab_div				= grab_div;
	popup_control.content_parent_div	= content_parent_div;

	jr_ElementSetStyle( popup_div,		"position",			"absolute");
	jr_ElementSetStyle( popup_div,		"border",			popup_control.border_style);
	jr_ElementSetStyle( popup_div,		"zIndex",			zindex);

	jr_ElementSetStyle( shadow_div,		"position",			"absolute");
	jr_ElementSetStyle( shadow_div,		"backgroundColor",	"black");
	jr_ElementSetStyle( shadow_div,		"border",			"2px solid lightgrey");

	jr_ElementSetStyle( shadow_div,			"zIndex",			0);
	jr_ElementSetStyle( grab_div,			"zIndex",			1);
	jr_ElementSetStyle( content_parent_div,	"zIndex",			1);

	jr_ElementSetOpacityPercent( shadow_div, 15);


	if (popup_control.title_string) {
		/*
		** 3/12/2010: Need to append the text before getting the height.
		*/
		jr_ElementAppendText( label_span, popup_control.title_string);
	}

	jr_ElementSetStyle( grab_div,	"padding",		"0.25em");
	/*
	** 3/13/2010: for some reason the margin on label_span doesn't
	** have the same effect.
	*/
	jr_ElementSetStyle( label_span,		"margin",		"0");
	jr_ElementSetStyle( label_span,		"margin",		"0");
	/*
	** 3/14/2010: can't use padding since that changes the size, i.e.
	** isn't included in the width calculation?
	*/

	var		close_size		= "1em";
	var		space_size		= "0.25em";
	var		button_obj		= jr_ButtonAppend( grab_div, popup_control.close_img_url, "Close", close_size);
	var		close_div		= jr_ButtonElement( button_obj);

	jr_ButtonSetClickHandler( button_obj, jr_PopupCloseHandler, popup_control);

	popup_control.close_button	= button_obj;

	popup_control.min_width_px	= label_span.offsetWidth + 2 * close_div.offsetWidth;

	jr_ElementSetStyle( popup_div,		"minWidth",		popup_control.min_width_px);


	/*
	** 2-23-2011: set the positioning after calculating the minimum width
	*/
	jr_ElementSetStyle( grab_div,	"position",			"absolute");
	jr_ElementSetStyle( grab_div,	"left",				0);
	jr_ElementSetStyle( grab_div,	"right",			0);
	jr_ElementSetStyle( grab_div,	"top",				0);
	jr_ElementSetStyle( grab_div,	"height",			grab_height_em, "em");

	jr_ElementSetStyle( grab_div,	"backgroundColor",	popup_control.title_bar_color);

	jr_ElementSetStyle( close_div,	"position",			"absolute");
	jr_ElementSetStyle( close_div,	"top",				space_size);
	jr_ElementSetStyle( close_div,	"right",			space_size);
	jr_ElementSetStyle( close_div,	"height",			close_size);
	jr_ElementSetStyle( close_div,	"width",			close_size);

	/*
	** 10-21-2010: add content, set top now but don't set height and width until
	** after the content is added, since auto-width settings make
	** sub-blocks size read as 0.
	*/
	jr_ElementSetStyle( content_parent_div,	"position",			"absolute");
	jr_ElementSetStyle( content_parent_div, "top",				grab_height_em, "em");
	jr_ElementSetStyle( content_parent_div,	"borderTop",		popup_control.border_style);
	jr_ElementSetStyle( content_parent_div,	"backgroundColor",	popup_control.background_color);

	/*
	** 10-22-2010: if sizes were specified, set them so that
	** the content creation function can use the size as a reference if necessary.
	*/

	if (popup_control.start_width !== undefined) {
		if (popup_control.min_width_px > popup_control.start_width) {
			popup_control.start_width	= popup_control.min_width_px;
		}
		jr_ElementSetStyle( popup_div,			"width",		popup_control.start_width);
	}
	else if (popup_control.max_width !== undefined) {
		if (popup_control.min_width_px > popup_control.max_width) {
			popup_control.max_width		= popup_control.min_width_px;
		}
		jr_ElementSetStyle( popup_div,			"width",		popup_control.max_width);
	}
	else {
		jr_ElementSetStyle( popup_div,			"width",		popup_control.min_width_px);
	}

	if (popup_control.start_height !== undefined) {
		jr_ElementSetStyle( popup_div,			"height",		popup_control.start_height);
	}
	else if (popup_control.max_height !== undefined) {
		jr_ElementSetStyle( popup_div,			"height",		popup_control.max_height);
	}

	if (popup_control.content_arg !== undefined) {
		if (typeof popup_control.content_arg == "function") {
			popup_control.content_el	= popup_control.content_arg( content_parent_div, popup_control);
		}
		else {
			popup_control.content_el	= popup_control.content_arg;

			jr_ElementAppendChild( content_parent_div, popup_control.content_el);
		}
	}

	jr_PopupAdjustSizeForContent( popup_control);

	/*
	** 1-2-11: If we set the content parent auto-size before the content is added,
	** then the content element will have height/width zero. Seems like block
	** elements will get their heights from the parent in this case, and it'll be 0,
	** although the height is non-zero.
	*/
	jr_ElementSetStyle( content_parent_div,	"position",	"absolute");
	jr_ElementSetStyle( content_parent_div, "left",		0);
	jr_ElementSetStyle( content_parent_div, "right",	0);
	jr_ElementSetStyle( content_parent_div, "bottom",	0);
	jr_ElementSetStyle( content_parent_div,	"overflow",	popup_control.content_overflow);

	
	/*
	** 8-21-2010: set the start position after the dimensions have be determined.
	*/
	if (popup_control.start_x === undefined) {
		popup_control.start_x	= (parent_el.offsetWidth - popup_div.offsetWidth) / 2;
		popup_control.start_y	= (parent_el.offsetHeight - popup_div.offsetHeight) / 2;

		if (popup_control.start_x < 0) {
			popup_control.start_x	= grab_div.offsetHeight;
		}
		if (popup_control.start_y < 0) {
			popup_control.start_y	= grab_div.offsetHeight;
		}
	}
	jr_ElementSetStyle( popup_div,		"left",				popup_control.start_x);
	jr_ElementSetStyle( popup_div,		"top",				popup_control.start_y);

	jr_ElementSetStyle( shadow_div,		"left",		-popup_control.shadow_width);
	jr_ElementSetStyle( shadow_div,		"top",		-popup_control.shadow_width);
	jr_ElementSetStyle( shadow_div,		"bottom",	-popup_control.shadow_width);
	jr_ElementSetStyle( shadow_div,		"right",	-popup_control.shadow_width);

	var		drag_control	= jr_DragCreate( parent_el);

	jr_DragActivate( drag_control, grab_div, popup_div);

	if (popup_control.allow_resize) {
		var		resize_control	= jr_ResizeCreate( popup_control.content_margin);

		jr_ResizeSetMinWidth( resize_control, label_span.offsetWidth + close_div.offsetWidth * 2);
		jr_ResizeSetMinHeight( resize_control, grab_div.offsetHeight * 2);

		if (popup_control.max_width !== undefined) {
			jr_ResizeSetMaxWidth( resize_control, popup_control.max_width);
		}
		if (popup_control.max_height !== undefined) {
			jr_ResizeSetMaxHeight( resize_control, popup_control.max_height);
		}

		jr_ResizeActivate( resize_control, popup_div);
		jr_ResizeSetDragControl( resize_control, drag_control);
	}

	return popup_div;
}

function jr_PopupAdjustSizeForContent( popup_control)
{
	var		popup_div		= popup_control.popup_div;
	var		grab_height		= popup_control.grab_div.offsetHeight;

	if (	popup_control.max_width === undefined
		&&	popup_control.content_el.offsetWidth  >  popup_div.offsetWidth) {

		jr_ElementSetStyle( popup_div,		"width",	popup_control.content_el.offsetWidth);
	}

	if (	popup_control.max_height === undefined
		&&	popup_control.content_el.offsetHeight + grab_height + 2  >  popup_div.offsetHeight) {

		jr_ElementSetStyle( popup_div,		"height",	popup_control.content_el.offsetHeight
														+ grab_height + 2);
	}
}

function jr_PopupCloseHandler( popup_control, click_el)
{
	jr_PopupClose( popup_control);
}

function jr_PopupClose( popup_control)
{
	if ( popup_control.close_handler) {
		popup_control.close_handler( popup_control.popup_div);
	}
	else {
		jr_ElementRemoveFromDom( popup_control.popup_div);
	}
}

