
var			cw_PAGE_TAB_MARGIN				= 10;
var			cw_PAGE_TAB_PADDING				= 5;
var			cw_PAGE_TAB_MAX_LABEL_LENGTH	= 32;
var			cw_PAGE_TAB_MIN_LABEL_LENGTH	= 5;

function jr_TabBar( parent_tile, options)
{
	jr_TabBarInit( this, parent_tile, options);
}

function jr_TabBarCreate( parent_tile, options)
{
	var		tab_bar	= new jr_TabBar( parent_tile, options);

	return tab_bar;
}

function jr_TabBarInit( object, parent_tile, options)
{
	if (!jr_HasType( parent_tile, jr_Tile)) {
		throw new Error( "tab bar must be a jr_Tile");
	}
	if (options === undefined) {
		options	= new Object();
	}
	if (options.tab_bar_height === undefined) {
		options.tab_bar_height			= 2.5;
		options.tab_bar_height_units	= "em"
	}
	if (options.background_color === undefined) {
		options.background_color	= "white";
	}
	if (options.active_background_color === undefined) {
		options.active_background_color	= "white";
	}
	if (options.border_color === undefined) {
		options.border_color		= "black";
	}
	if (options.border_width === undefined) {
		options.border_width		= 1;
		options.border_width_units	= "px";
	}
	if (options.font_weight === undefined) {
		options.font_weight			= "normal";
	}
	if (options.color === undefined) {
		options.color				= "black";
	}
	if (options.active_color === undefined) {
		options.active_color		= "black";
	}

	object.options			= options;
	object.parent_tile		= parent_tile;
	object.tab_bar_tile		= jr_TileAppendChild(
								parent_tile, options.tab_bar_height, options.tab_bar_height_units, "top"
							);
	object.content_tile		= jr_TileAppendChild( parent_tile);

	object.tab_bar_div		= jr_ElementAppendChild( jr_TileDiv( object.tab_bar_tile), "div");

	jr_ElementSetStyle( object.tab_bar_div,	"position",		"absolute");
	jr_ElementSetStyle( object.tab_bar_div,	"top",			0);
	jr_ElementSetStyle( object.tab_bar_div,	"bottom",		0);
	jr_ElementSetStyle( object.tab_bar_div,	"left",			0);
	jr_ElementSetStyle( object.tab_bar_div,	"right",		0);

	jr_ElementSetStyle( object.tab_bar_div,	"borderBottomStyle",	"solid");
	jr_ElementSetStyle( object.tab_bar_div,	"borderBottomColor",	options.border_color);
	jr_ElementSetStyle( object.tab_bar_div,	"borderBottomWidth",	options.border_width,
																	options.border_width_units);

	object.tab_table		= new Array();
}

function jr_TabName( tab_obj)
{
	return tab_obj.tab_name;
}

function jr_TabContentTile( tab_obj)
{
	return tab_obj.content_tile;
}

function jr_TabBarAddNewTab( object, tab_name, options_or_activate_fn, activate_fn_arg)
{
	var		label_padding		= object.options.label_padding;
	var		label_padding_units	= object.options.label_padding_units;
	var		tab_obj;
	var		new_tab_el;

	tab_obj	= object.tab_table[tab_name];

	if (tab_obj) {
		return null;
	}

	tab_obj				= new Object;

	if (typeof options_or_activate_fn == "object") {
		options			= options_or_activate_fn;
	}
	else {
		options			= new Object;

		if (typeof activate_fn == "function") {
			options.activate_fn			= options_or_activate_fn;
			options.activate_fn_arg		= activate_fn_arg;
		}
	}

	new_tab_el	= jr_ElementAppendChild( object.tab_bar_div, "span");

	jr_ElementSetStyle( new_tab_el, "marginLeft",			1,	"em");
	jr_ElementSetStyle( new_tab_el, "color",				object.options.color);
	jr_ElementSetStyle( new_tab_el, "fontWeight",			object.options.font_weight);
	jr_ElementSetStyle( new_tab_el, "cursor",				"pointer");

	jr_ElementSetStyle( new_tab_el,	"borderLeftStyle",		"solid");
	jr_ElementSetStyle( new_tab_el,	"borderLeftColor",		object.options.border_color);
	jr_ElementSetStyle( new_tab_el,	"borderLeftWidth",		object.options.border_width,
															object.options.border_width_units);

	jr_ElementSetStyle( new_tab_el,	"borderRightStyle",		"solid");
	jr_ElementSetStyle( new_tab_el,	"borderRightColor",		object.options.border_color);
	jr_ElementSetStyle( new_tab_el,	"borderRightWidth",		object.options.border_width,
															object.options.border_width_units);

	jr_ElementSetStyle( new_tab_el,	"borderTopStyle",		"solid");
	jr_ElementSetStyle( new_tab_el,	"borderTopColor",		object.options.border_color);
	jr_ElementSetStyle( new_tab_el,	"borderTopWidth",		object.options.border_width,
															object.options.border_width_units);

	if (label_padding && label_padding_units) {
		if (!jr_IsIE7) {
			/*
			** 7-16-2012: on IE7 the paddingBottom isn't included 
			** Adding after we set the paddingTop below doesn't change the display
			** Also, can't see a bottom border if we set one.
			*/
			jr_ElementSetStyle( new_tab_el, "paddingBottom", 5);
		}
		jr_ElementSetStyle( new_tab_el, "paddingLeft",	label_padding, label_padding_units);
		jr_ElementSetStyle( new_tab_el, "paddingRight",	label_padding, label_padding_units);
	}

	jr_ElementAppendText( new_tab_el, tab_name);

	leading_height	= object.tab_bar_div.offsetHeight - new_tab_el.offsetHeight;

	if (jr_IsIE7) {
		/*
		** 7-16-2012: move down 1px to cover gap.
		*/
		leading_height += 1;
	}

	jr_ElementSetStyle( object.tab_bar_div,	"paddingTop",	leading_height);

	if (label_padding && label_padding_units) {
		jr_ElementSetStyle( new_tab_el, "paddingTop",	label_padding, label_padding_units);
	}

	if (options.close_icon) {
		var		close_handler	= function() {
									jr_TabBarDeleteTab( object, tab_name);
								}

		tab_obj.close_button = jr_ButtonAppend( new_tab_el, options.close_icon, "Close tab", 0.65, "em"); 

		jr_ElementRegisterHandler( jr_ButtonDiv( tab_obj.close_button), jr_CLICK_EVENT, close_handler);

		jr_ElementSetStyle( jr_ButtonDiv( tab_obj.close_button), "position", "relative");
		jr_ElementSetStyle( jr_ButtonDiv( tab_obj.close_button), "top",		-0.25, "em");
		jr_ElementSetStyle( jr_ButtonDiv( tab_obj.close_button), "right",	-0.25, "em");
	}

	content_div		= jr_ElementAppendChild( jr_TileDiv( object.content_tile), "div");

	jr_ElementSetStyle( content_div,	"position",		"absolute");
	jr_ElementSetStyle( content_div,	"top",			0);
	jr_ElementSetStyle( content_div,	"bottom",		0);
	jr_ElementSetStyle( content_div,	"left",			0);
	jr_ElementSetStyle( content_div,	"right",		0);

	jr_ElementSetStyle( content_div,	"borderLeftStyle",		"solid");
	jr_ElementSetStyle( content_div,	"borderLeftColor",		object.options.border_color);
	jr_ElementSetStyle( content_div,	"borderLeftWidth",		object.options.border_width,
																object.options.border_width_units);

	jr_ElementSetStyle( content_div,	"borderRightStyle",		"solid");
	jr_ElementSetStyle( content_div,	"borderRightColor",		object.options.border_color);
	jr_ElementSetStyle( content_div,	"borderRightWidth",		object.options.border_width,
																object.options.border_width_units);

	jr_ElementSetStyle( content_div,	"borderBottomStyle",	"solid");
	jr_ElementSetStyle( content_div,	"borderBottomColor",	object.options.border_color);
	jr_ElementSetStyle( content_div,	"borderBottomWidth",	object.options.border_width,
																object.options.border_width_units);
	jr_ElementSetStyle( content_div,	"display",		"none");

	var		click_handler_fn	= function() {
									jr_TabBarActivateTab( object, tab_name);
								}

	jr_ElementRegisterHandler( new_tab_el, jr_CLICK_EVENT, click_handler_fn)


	tab_obj.tab_name		= tab_name;
	tab_obj.tab_el			= new_tab_el;
	tab_obj.content_div		= content_div;
	tab_obj.content_tile	= jr_TileAppendRoot( content_div, object.content_tile);

	object.tab_table[tab_name]	= tab_obj;

	jr_TabBarActivateTab( object, tab_name);

	/*
	** 8-27-2012: If the tab isn't activated then it can't be initialized since
	** it's not in the DOM.  So it needs to be activated before the caller-defined content
	** can be created, but the first activation will call a caller-defined function
	** that may need the caller-defined content.
	** So activate it w/o calling the activation function.
	*/
	tab_obj.activate_fn		= options.activate_fn;
	tab_obj.activate_fn_arg	= options.activate_fn_arg;

	return tab_obj;
}

function jr_TabBarActivateTab( object, tab_name)
{
	var		tab_obj		= object.tab_table[tab_name];

	if ( !tab_obj) {
		throw new Error( "can't activate tab '" + tab_name + "': not found");
	}

	if (object.active_tab_obj) {
		jr_ElementSetStyle( object.active_tab_obj.tab_el,	"borderBottomStyle",	null);
		jr_ElementSetStyle( object.active_tab_obj.tab_el,	"borderBottomColor",	null);
		jr_ElementSetStyle( object.active_tab_obj.tab_el,	"borderBottomWidth",	null);

		jr_ElementSetStyle( object.active_tab_obj.tab_el,	"backgroundColor",		
															object.options.background_color);
		jr_ElementSetStyle( object.active_tab_obj.tab_el,	"color",			object.options.color);

		jr_ElementSetStyle( object.active_tab_obj.content_div,	"display",		"none");
	}


	var		multiplier;
	
	if (object.options.border_width_units == "px") {
		multiplier	= 1;
	}

	jr_ElementSetStyle( tab_obj.tab_el,	"borderBottomStyle",	"solid");
	jr_ElementSetStyle( tab_obj.tab_el,	"borderBottomColor",	object.options.active_background_color);
	jr_ElementSetStyle( tab_obj.tab_el,	"borderBottomWidth",	multiplier * object.options.border_width,
																object.options.border_width_units);
	jr_ElementSetStyle( tab_obj.tab_el,	"backgroundColor",		object.options.active_background_color);
	jr_ElementSetStyle( tab_obj.tab_el,	"color",				object.options.active_color);

	jr_ElementSetStyle( tab_obj.content_div,	"display",		"block");

	object.active_tab_obj	= tab_obj;

	if (tab_obj.activate_fn) {
		if (tab_obj.activate_fn_arg) {
			tab_obj.activate_fn( tab_obj.activate_fn_arg, tab_obj);
		}
		else {
			tab_obj.activate_fn( tab_obj);
		}
	}

	return tab_obj;
}

function jr_TabBarDeleteTab( object, tab_name)
{
	var		tab_obj		= object.tab_table[tab_name];

	if ( !tab_obj) {
		return;
	}

	jr_ElementRemoveFromDom( tab_obj.tab_el);
	jr_ElementRemoveFromDom( tab_obj.content_div);

	delete object.tab_table[tab_name];

	if (object.active_tab_obj === tab_obj) {

		for (tab_name in object.tab_table) {
			jr_TabBarActivateTab( object, tab_name);
			break;
		}
	}
}

function cw_AddNewTab (tab_bar, tab_name, page_div, activate_fn, activate_fn_arg, align_right)
{
	var			tab_span;
	var			tab_text;
	var			curr_width;

	if (! tab_bar.offsetParent) {
		throw new Error( "tab bar not in DOM");
	}

	if (tab_bar.cw_tab_min_width === undefined) {
		/*
		** 11/10/07: Calculate the average font width
		*/
		var			tmp_string	= "MatchMakerS";

		tab_span				= document.createElement ("span");
		tab_text				= document.createTextNode (tmp_string);

		tab_span.appendChild (tab_text);

		tab_bar.appendChild (tab_span);
		{
			tab_bar.avg_font_width	= tab_span.offsetWidth / tmp_string.length;
			tab_text.replaceData (0, tmp_string.length, "...");
			tab_bar.dot_dot_width	= tab_span.offsetWidth;
		}
		tab_bar.removeChild (tab_span);

		tab_bar.cw_tab_min_width	= tab_bar.avg_font_width * cw_PAGE_TAB_MIN_LABEL_LENGTH
									+ tab_bar.dot_dot_width
									+ 2 * (cw_PAGE_TAB_MARGIN + cw_PAGE_TAB_PADDING);
	}

	if (tab_bar.cw_tab_spacer == undefined) {
		/*
		** 11/11/07: Add the spacer span
		*/
		tab_span				= document.createElement ("span");
		tab_text				= document.createTextNode (" ");

		tab_span.appendChild (tab_text);
		tab_bar.appendChild (tab_span);

		tab_bar.cw_tab_spacer	= tab_span;
	}

	tab_span					= document.createElement ("span");

	tab_bar.cw_tab_activate_fn		= activate_fn;
	tab_bar.cw_tab_activate_fn_arg	= activate_fn_arg;

	page_div.cw_tab_span		= tab_span;

	tab_span.cw_tab_bar			= tab_bar;
	tab_span.cw_tab_name		= tab_name;
	tab_span.cw_tab_page_div	= page_div;
	tab_span.cw_tab_can_compress= 1;

	tab_span.className			= cw_PAGE_TAB_CLASS;
	tab_span.title				= tab_name;
	tab_span.style.marginLeft	= String (cw_PAGE_TAB_MARGIN) + "px";
	tab_span.style.marginRight	= String (cw_PAGE_TAB_MARGIN) + "px";
	tab_span.style.paddingLeft	= String (cw_PAGE_TAB_PADDING) + "px";
	tab_span.style.paddingRight	= String (cw_PAGE_TAB_PADDING) + "px";
	tab_span.style.height		= "2em";

	if (align_right) {

		tab_span.style.position	= "relative";

		if (tab_bar.cw_tab_spacer.nextSibling) {
			tab_bar.insertBefore (tab_span, tab_bar.cw_tab_spacer.nextSibling);
		}
		else {
			/*
			** 11/11/07: 1st right aligned tab.
			*/
			tab_bar.appendChild (tab_span);
		}
	}
	else {
		tab_bar.insertBefore (tab_span, tab_bar.cw_tab_spacer);
	}

	cw_TabSetSpanTitle (tab_span, tab_name);

	cw_AdjustTabSizes (tab_bar);

	jr_ElementRegisterHandler (tab_span, jr_CLICK_EVENT, cw_TabClickHandler);

	return tab_span;
}

function cw_TabSetSpanTitle (tab_span, tab_name)
{
	var			tab_label;

	/*
	** 11/11/07: truncate the label if it's too long
	*/
	if (tab_name.length > cw_PAGE_TAB_MAX_LABEL_LENGTH) {
		tab_label				= tab_name.substring (0, cw_PAGE_TAB_MAX_LABEL_LENGTH);
		tab_label				+= "...";

		tab_span.has_dot_dot	= 1;
		tab_span.num_label_chars= cw_PAGE_TAB_MAX_LABEL_LENGTH;
	}
	else {
		tab_label				= tab_name;
		tab_span.num_label_chars= tab_name.length;
	}

	jr_NodeReplaceText (tab_span, tab_name);
}

function cw_TabSetCanCompressLabel (tab_span, value)
{
	tab_span.cw_tab_can_compress		= value;
}

function cw_ChangeTabTitle (tab_bar, page_div, tab_name)
{
	if (page_div.cw_tab_span) {
		cw_TabSetSpanTitle (page_div.cw_tab_span, tab_name);

		cw_AdjustTabSizes (tab_bar);
	}
}

function cw_TabClickHandler (element)
{
	if (element.cw_tab_bar) {
		cw_ActivateTab (element.cw_tab_bar, element.cw_tab_page_div);
	}
}


function cw_ActivateTab (tab_bar, page_div)
{
	if (	tab_bar.cw_tab_curr_page_div
		&&	tab_bar.cw_tab_curr_page_div.cw_tab_span) {

		tab_bar.cw_tab_curr_page_div.cw_tab_span.className = cw_PAGE_TAB_CLASS;
	}

	if (tab_bar.cw_tab_activate_fn) {
		tab_bar.cw_tab_activate_fn( tab_bar.cw_tab_activate_fn_arg, page_div, tab_bar);
	}

	tab_bar.cw_tab_curr_page_div	= page_div;

	if (page_div.cw_tab_span) {
		page_div.cw_tab_span.className = cw_ACTIVE_TAB_CLASS;
	}
}

function cw_DeleteTab (tab_bar, page_div)
{
	var		next_active_div;

	if (tab_bar.cw_tab_curr_page_div == page_div) {

		if (page_div.cw_tab_span.nextSibling  &&  page_div.cw_tab_span.nextSibling.cw_tab_page_div) {
			next_active_div	= page_div.cw_tab_span.nextSibling.cw_tab_page_div;
		}
		else if (	page_div.cw_tab_span.previousSibling
				&&  page_div.cw_tab_span.previousSibling.cw_tab_page_div
		) {
			next_active_div	= page_div.cw_tab_span.previousSibling.cw_tab_page_div;
		}
	}

	if (page_div.cw_tab_span) {
		tab_bar.removeChild (page_div.cw_tab_span);

		if (next_active_div) {
			cw_ActivateTab (tab_bar, next_active_div);
		}
	}
	cw_AdjustTabSizes (tab_bar);
}

function cw_AdjustTabSizes (tab_bar)
{
	var		tab_bar_width			= tab_bar.offsetWidth;
	var		saved_width_style		= jr_ElementGetAssignedStyle( tab_bar, "width");
	var		curr_width;
	var		spacer_width;


	if (!tab_bar.lastChild) {
		return;
	}

	/*
	** 11/11/07: adjust spacer width to move right aligned tabs over.
	** start with the tab_bar wide enough to hold everything on one line.
	*/
	jr_ElementSetStyle( tab_bar,				"width",		2 * tab_bar_width);
	jr_ElementSetStyle( tab_bar.cw_tab_spacer,	"paddingLeft",	0);

	curr_width		= tab_bar.lastChild.offsetLeft
					+ tab_bar.lastChild.offsetWidth
					+ cw_PAGE_TAB_MARGIN				/* offsetWidth doesn't include margin */
					;

	if (curr_width > tab_bar_width) {
		cw_ShrinkTabs (tab_bar, tab_bar_width);
	}
	else {
		cw_GrowTabs (tab_bar, tab_bar_width);
	}

	curr_width		= tab_bar.lastChild.offsetLeft
					+ tab_bar.lastChild.offsetWidth
					+ cw_PAGE_TAB_MARGIN				/* offsetWidth doesn't include margin */
					;

	spacer_width	= tab_bar_width - curr_width;

	spacer_width	-= 3;

	if (jr_IsIE) {
		// spacer_width	-= cw_PAGE_TAB_MARGIN;
	}

	if (spacer_width > 0) {
		tab_bar.cw_tab_spacer.style.paddingLeft	= String (spacer_width) + "px";
	}
	if (saved_width_style) {
		jr_ElementSetStyle( tab_bar,			"width",		saved_width_style);
	}
}

function cw_ShrinkTabs (tab_bar, max_width)
{
	var		q;
	var		tab_span;
	var		uncompressable_width			= 0;
	var		compressable_width				= 0;
	var		num_compressable_tabs			= 0;
	var		compressable_tabs_max_width;
	var		do_minimize_compressable_tabs	= 0;
	var		compressable_tab_array			= new Array ();
	var		tab_label;


	for (q=0; q < tab_bar.childNodes.length; q++) {
		tab_span = tab_bar.childNodes[q];

		if (tab_span.cw_tab_can_compress) {
			tab_span.compressable_width		= tab_span.offsetWidth + 2 * cw_PAGE_TAB_MARGIN;
			compressable_width				+= tab_span.compressable_width;

			compressable_tab_array.push (tab_span);
		}
		else {
			uncompressable_width	+= tab_span.offsetWidth + 2 * cw_PAGE_TAB_MARGIN;
		}
	}

	compressable_tabs_max_width		= max_width - uncompressable_width;


	if (compressable_tabs_max_width < 0) {
		/*
		** 11/11/07: uncompressable tabs are bigger than max width
		** Shrink all compressable tabs to the minimum width and increase the nav bar width
		** which may result in a horizontal scroll bar on the page.
		*/
		do_minimize_compressable_tabs	= 1;
	}
	else if (compressable_tabs_max_width / compressable_tab_array.length  <  tab_bar.cw_tab_min_width) {
		do_minimize_compressable_tabs	= 1;
	}
	else {
		/*
		** 11/11/07: The average width of each tab is greater than that minimum width.
		** Shorten the largest tabs until we fit.
		*/
		var		max_label_chars			= 0;
		var		num_shrink_chars;
		var		new_length;
		var		new_width;

		compressable_tab_array.sort (cw_label_chars_rev_cmp);

		max_label_chars			= compressable_tab_array[0].num_label_chars - 1;

		while (uncompressable_width + compressable_width  >  max_width) {

			for (q = 0; q < compressable_tab_array.length; q++) {
				tab_span	= compressable_tab_array[q];

				if (tab_span.num_label_chars  >  max_label_chars) {
					num_shrink_chars	= tab_span.num_label_chars - max_label_chars;

					if (tab_span.has_dot_dot) {
						new_length			= tab_span.num_label_chars - num_shrink_chars;
					}
					else {
						new_length			= tab_span.num_label_chars - num_shrink_chars - 3;
					}
					if (new_length < cw_PAGE_TAB_MIN_LABEL_LENGTH) {
						continue;
					}
					tab_label				= tab_span.cw_tab_name.substring (0, new_length - 1);
					tab_label				+= "...";

					tab_span.has_dot_dot	= 1;
					tab_span.num_label_chars= new_length;;

					jr_NodeReplaceText (tab_span, tab_label);
					
					new_width				= tab_span.offsetWidth + 2 * cw_PAGE_TAB_MARGIN;

					if (new_width < tab_span.compressable_width) {
						compressable_width		-= tab_span.compressable_width - new_width;
						tab_span.compressable_width	= new_width;
					}
				}
				else {
					break;
				}
			}

			if (max_label_chars < cw_PAGE_TAB_MIN_LABEL_LENGTH) {
				/*
				** 11/11/07: This case should rarely happen, if ever.  It means that
				** the eventhough the calculations above suggested we only needed to shrink
				** some of the tab labels, in fact all of the labels needed shrinking to
				** the minimum size, and then we didn't fit either.  Reset the the nav
				** bar size to the current total width.
				*/
				do_minimize_compressable_tabs	= 1;
				break;
			}

			max_label_chars --;
		}
		tab_bar.style.width	= "100%";
	}

	if (do_minimize_compressable_tabs) {
		var		new_tab_bar_width		= 0;

		for (q =0; q < tab_bar.childNodes.length; q++) {
			tab_span = tab_bar.childNodes[q];

			if (tab_span.cw_tab_can_compress) {
				tab_label			= tab_span.cw_tab_name.substring (0, cw_PAGE_TAB_MIN_LABEL_LENGTH);
				tab_label			+= "...";

				tab_span.has_dot_dot	= 1;
				tab_span.num_label_chars= cw_PAGE_TAB_MIN_LABEL_LENGTH;

				jr_NodeReplaceText (tab_span, tab_label);
			}
			new_tab_bar_width	+= tab_span.offsetWidth + 2 * cw_PAGE_TAB_MARGIN;
		}
		tab_bar.style.width	= String (new_tab_bar_width) + "px";
	}
}

function cw_GrowTabs (tab_bar, max_width)
{
	var		dot_dot_tab_array				= new Array ();
	var		has_dot_dot_label				= 0;
	var		curr_width						= 0;
	var		q;
	var		tab_span;
	var		new_length;
	var		tab_label;
	var		old_label;


	for (q =0; q < tab_bar.childNodes.length; q++) {
		tab_span = tab_bar.childNodes[q];

		if (tab_span.has_dot_dot) {
			dot_dot_tab_array.push (tab_span);
			has_dot_dot_label	= 1;
		}
	}

	dot_dot_tab_array.sort (cw_label_chars_cmp);


	while (has_dot_dot_label  &&  curr_width  <  max_width) {

		has_dot_dot_label	= 0;

		for (q = 0; q < dot_dot_tab_array.length; q++) {
			tab_span	= dot_dot_tab_array[q];

			if (!tab_span.has_dot_dot  ||  tab_span.num_label_chars >= cw_PAGE_TAB_MAX_LABEL_LENGTH) {
				continue;
			}
			else {
				has_dot_dot_label	= 1;
			}

			new_length	= tab_span.num_label_chars + 1;

			if (new_length + 3  <   tab_span.cw_tab_name.length) {
				tab_label				= tab_span.cw_tab_name.substring (0, new_length - 1);
				tab_label				+= "...";
			}
			else {
				new_length				= tab_span.cw_tab_name.length;
				tab_label				= tab_span.cw_tab_name;
				tab_span.has_dot_dot	= 0;
			}

			jr_NodeReplaceText (tab_span, tab_label);

			curr_width		= tab_bar.lastChild.offsetLeft
							+ tab_bar.lastChild.offsetWidth
							+ cw_PAGE_TAB_MARGIN				/* offsetWidth doesn't include margin */
							+ 2;

			if (curr_width  >  max_width) {
				new_length				= tab_span.num_label_chars;
				tab_label				= tab_span.cw_tab_name.substring (0, new_length - 1);
				tab_label				+= "...";
				tab_span.has_dot_dot	= 1;

				jr_NodeReplaceText (tab_span, tab_label);
				break;
			}
			else {
				tab_span.num_label_chars	= new_length;
			}
		}
	}
}

function cw_label_chars_cmp (v1, v2)
{

	if (v1.num_label_chars < v2.num_label_chars) {
		return -1;
	}
	else if (v1.num_label_chars > v2.num_label_chars) {
		return 1;
	}
	return 0;
}


function cw_label_chars_rev_cmp (v1, v2)
{

	if (v1.num_label_chars > v2.num_label_chars) {
		return -1;
	}
	else if (v1.num_label_chars < v2.num_label_chars) {
		return 1;
	}
	return 0;
}


