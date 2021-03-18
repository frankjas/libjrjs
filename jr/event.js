
var jr_BLUR_EVENT			= "blur";
var jr_CHANGE_EVENT			= "change";
var jr_CLICK_EVENT			= "click";
var jr_FOCUS_EVENT			= "focus";
var jr_KEY_DOWN_EVENT		= "keydown";				/* 5-13-2019: key code, for all keys */
var jr_KEY_PRESS_EVENT		= "keypress";				/* 5-13-2019: ascii code, only for ~printable */
var jr_KEY_UP_EVENT			= "keyup";
var jr_MOUSE_DOWN_EVENT		= "mousedown";
var jr_MOUSE_MOVE_EVENT		= "mousemove";
var jr_MOUSE_OUT_EVENT		= "mouseout";
var jr_MOUSE_OVER_EVENT		= "mouseover";
var jr_MOUSE_UP_EVENT		= "mouseup";
var	jr_RIGHT_CLICK_EVENT	= "contextmenu";
var jr_RESIZE_EVENT			= "resize";
var jr_SCROLL_EVENT			= "scroll";
var jr_SUBMIT_EVENT			= "submit";

var jr_LEFT_MOUSE_BUTTON	= 0;
var jr_MIDDLE_MOUSE_BUTTON	= 1;
var jr_RIGHT_MOUSE_BUTTON	= 2;
/*
** 3/9/09: To disable the normal browser context menu,
** do: oncontextmenu="return false" ??
*/

var jr_NULL_KEY_CODE		= 0;		// 11-24-10: should be unused value
var jr_BACKSPACE_KEY_CODE	= 8;
var jr_TAB_KEY_CODE			= 9;
var jr_NEWLINE_KEY_CODE		= 13;
var jr_ESCAPE_KEY_CODE		= 27;
var jr_SPACE_KEY_CODE		= 32;
var jr_END_KEY_CODE			= 35;
var jr_HOME_KEY_CODE		= 36;
var jr_LEFT_KEY_CODE		= 37;
var jr_ARROW_UP_KEY_CODE	= 38;
var jr_UP_KEY_CODE			= jr_ARROW_UP_KEY_CODE;
var jr_RIGHT_KEY_CODE		= 39;
var jr_ARROW_DOWN_KEY_CODE	= 40;
var jr_DOWN_KEY_CODE		= jr_ARROW_DOWN_KEY_CODE;
var jr_DELETE_KEY_CODE		= 46;

var jr_ASCII_A_KEY_CODE		= 0x41;
var jr_ASCII_B_KEY_CODE		= jr_ASCII_A_KEY_CODE	+ 1;
var jr_ASCII_C_KEY_CODE		= jr_ASCII_A_KEY_CODE	+ 2;
var jr_ASCII_I_KEY_CODE		= jr_ASCII_A_KEY_CODE	+ 8;
var jr_ASCII_T_KEY_CODE		= jr_ASCII_A_KEY_CODE	+ 19;
var jr_ASCII_V_KEY_CODE		= jr_ASCII_A_KEY_CODE	+ 21;
var jr_ASCII_X_KEY_CODE		= jr_ASCII_A_KEY_CODE	+ 23;
var jr_ASCII_Y_KEY_CODE		= jr_ASCII_A_KEY_CODE	+ 24;
var jr_ASCII_Z_KEY_CODE		= jr_ASCII_A_KEY_CODE	+ 25;

var jr_ASCII_a_KEY_CODE		= 0x61;
var jr_ASCII_b_KEY_CODE		= jr_ASCII_a_KEY_CODE	+ 1;
var jr_ASCII_c_KEY_CODE		= jr_ASCII_a_KEY_CODE	+ 2;
var jr_ASCII_i_KEY_CODE		= jr_ASCII_a_KEY_CODE	+ 8;
var jr_ASCII_t_KEY_CODE		= jr_ASCII_a_KEY_CODE	+ 19;
var jr_ASCII_v_KEY_CODE		= jr_ASCII_a_KEY_CODE	+ 21;
var jr_ASCII_x_KEY_CODE		= jr_ASCII_a_KEY_CODE	+ 23;
var jr_ASCII_y_KEY_CODE		= jr_ASCII_a_KEY_CODE	+ 24;
var jr_ASCII_z_KEY_CODE		= jr_ASCII_a_KEY_CODE	+ 25;

var jr_EventDoDiag			= 0;

function jr_ElementRegisterHandler( element, event_type, handler_fn, handler_fn_arg, options)
{
	/*
	** 2-12-06: this implementation currently only supports a single handler per event.
	*/
	if (element.nodeType === undefined) {
		throw new Error( "can't register event handler: not an element");
	}

	if (! handler_fn) {
		/*
		** 12-4-2010: could re-register the return value of UnRegister() which could be null
		*/
		return;
	}

	var		handler_obj		= new Object();

	if (options) {
		handler_obj.prevent_default		= options.prevent_default;
		handler_obj.stop_propagation	= options.stop_propagation;
	}
	else {
		handler_obj.prevent_default		= true;
		handler_obj.stop_propagation	= true;
	}

	if (typeof handler_fn == "function") {
		handler_obj.handler_fn		= handler_fn;
		handler_obj.handler_fn_arg	= handler_fn_arg;
	}
	else if (typeof handler_fn == "object") {
		handler_obj		= handler_fn;
	}

	if (!handler_obj.handler_fn  || typeof handler_obj.handler_fn  !=  "function") {
		throw new Error( "invalid handler_fn for handler object parameter");
	}

	if (! element.jr_event_table) {
		element.jr_event_table	= new Array ();
	}
	if (element.jr_event_table[event_type]) {
		jr_ElementUnRegisterHandler( element, event_type);
	}

	element.jr_event_table[event_type]		= handler_obj;

	if (element.addEventListener) {
		/*
		** 2/11/06: DOM compliant
		** use_capture means this element gets the events of any descendent element
		** before the descendant does.
		** 2/12/06 Javascript v5 pg 376 says IE doesn't support event capture, so
		** don't use that capability.
		**
		*/
		var use_capture		= false;

		element.addEventListener (event_type, jr_EventGenericHandler, use_capture);
	}
	else if (element.attachEvent) {
		/*
		** 2/11/06: IE
		*/
		element.attachEvent ("on" + event_type, jr_EventGenericHandler);
	}
	else {
		/*
		** 2/11/06: safari?
		*/

		element["on" + event_type] = jr_EventGenericHandler;
	}

	return handler_obj;
}

function jr_ElementUnRegisterHandler( element, event_type)
{
	var		handler_obj;

	if (! element.jr_event_table) {
		/*
		** 10-18-10: never had events registered.
		*/
		return null;
	}

	handler_obj		= element.jr_event_table[event_type];

	delete element.jr_event_table[event_type];


	if (element.removeEventListener) {
		/*
		** 2/11/06: DOM compliant
		*/
		var use_capture		= false;

		element.removeEventListener (event_type, jr_EventGenericHandler, use_capture);
	}
	else if (element.detachEvent) {
		/*
		** 2/11/06: IE
		*/
		element.detachEvent ("on" + event_type, jr_EventGenericHandler);
	}
	else {
		/*
		** 2/11/06: safari?
		*/

		delete element["on" + event_type];
	}
	return handler_obj;
}

function jr_EventGenericHandler (event_object)
{
	/*
	** 2/12/06: Map MSIE event handling API to DOM version.
	*/
	var		element;
	var		handler_obj;

	if (event_object  &&  event_object.target) {
		/*
		** 4/28/06: Some browsers have both IE and W3C event handling (Konqueror)
		** Prefer W3C event_object if it exists.
		*/

		element					= event_object.target;

		if (false) {
			/*
			** 12-6-2010: use the jr_count for event bubbling?
			** Also could use currentTarget, which changes as the event
			** bubbles. Unfortunately, IE7/IE8? doesn't have this value.
			** And since it doesn't support setting values on the window.event
			** object, we have no solution for keeping track of
			** whether the call is for the lowest element or the
			** next element getting bubbled.
			*/
			if (event_object.jr_count === undefined) {
				event_object.jr_count = 0;
			}
			else {
				event_object.jr_count++;
			}
		}
	}
	else if (window.event  &&  window.event.srcElement) {
		element					= window.event.srcElement;

		if (false) {
			/*
			** 12-3-2010 not working: can't modify the event object, i.e
			** add a custom jr_count member.
			*/
			if (window.event.jr_count === undefined) {
				window.event.jr_count = 0;
			}
			else {
				window.event.jr_count++;
			}
		}

		event_object			= new Object ();

		event_object.jr_is_ie	= 1;

		event_object.target		= window.event.srcElement;
		event_object.type		= window.event.type;

		if (false) {
			event_object.jr_count	= window.event.jr_count;
		}

		/*
		** 2/12/06: mouse event properties.
		*/
		if (window.event.clientX) {
			event_object.clientX	= window.event.clientX;
		}
		if (window.event.clientY) {
			event_object.clientY	= window.event.clientY;
		}

		if (window.event.button) {
			event_object.button	= window.event.button;

			/*
			** 3/9/09: IE has a bit mask, 1,2,4 is left, right, middle?
			** 7/12/09: W3C button definitions preclude chords? Map IE to W3C below.
			*/
			if (event_object.button & 1) {
				event_object.button	= jr_LEFT_MOUSE_BUTTON;
			}
			else if (event_object.button & 2) {
				event_object.button	= jr_RIGHT_MOUSE_BUTTON;
			}
			else if (event_object.button & 4) {
				event_object.button	= jr_MIDDLE_MOUSE_BUTTON;
			}
		}
		if (jr_IsIE  &&  window.event.type == "contextmenu") {
			/*
			** 7/12/09: IE7: event button appears to be 0 in all cases.
			*/
			event_object.button	= jr_RIGHT_MOUSE_BUTTON;
		}
		event_object.keyCode	= window.event.keyCode;
		event_object.ctrlKey	= window.event.ctrlKey;
		event_object.altKey		= window.event.altKey;
		event_object.shiftKey	= window.event.shiftKey;
	}

	/*
	** 2/12/06: Modern Web Design pg. 63 says that some browsers pass in the
	** text child object instead of the parent.  This loop finds the parent object
	** that was used to register the event (i.e. the presence of the jr_event_table)
	** and uses that.
	**
	** This could result in multiple calls to the handler if the original object
	** somehow gets its event handler removed, since the event will also bubble up.
	*/

	var		orig_element	= element;

	while (element) {

		if (element.jr_event_table) {
			handler_obj		= element.jr_event_table[event_object.type];

			if (handler_obj && handler_obj.handler_fn) {
				if (handler_obj.stop_propagation) {
					jr_EventStopPropagation( event_object);
				}
				if (handler_obj.prevent_default) {
					jr_EventPreventDefault( event_object);
				}
				if (handler_obj.handler_fn_arg !== undefined) {
					handler_obj.handler_fn(
						handler_obj.handler_fn_arg, element, event_object, orig_element
					);
				}
				else {
					handler_obj.handler_fn (element, event_object, orig_element);
				}
				break;
			}
		}
		else {
			if (jr_EventDoDiag) {
				dump ("Event on: " + element.tagName + "\n");
			}
		}

		element = element.parentNode;
	}
}

function jr_EventStopPropagation (event_object)
{
	if (event_object.jr_is_ie) {
		window.event.cancelBubble = true;
	}
	else if (event_object.stopPropagation) {
		event_object.stopPropagation ();
	}
}

function jr_EventPreventDefault (event_object)
{
	if (event_object.jr_is_ie) {
		window.event.returnValue = false;
	}
	else if (event_object.preventDefault) {
		event_object.preventDefault ();
	}
}

function jr_KeyStrokeClass (event_object)
{
	this.type	= event_object.type;

	if (event_object.keyCode) {
		this.key_code	= event_object.keyCode;
	}
	else if (event_object.which) {
		this.key_code	= event_object.which;
	}
	else {
		this.key_code	= undefined;
	}

	if (event_object.shiftKey) {
		this.has_shift	= 1;
	}
	else {
		this.has_shift	= 0;
	}

	if (event_object.ctrlKey) {
		this.has_ctrl	= 1;
	}
	else {
		this.has_ctrl	= 0;
	}

	if (event_object.altKey) {
		this.has_alt	= 1;
	}
	else {
		this.has_alt	= 0;
	}

	/*
	** 9/30/07: Generate char depending on various browser quirks.
	*/
	if (this.type == "keypress") {
		if (event_object.charCode) {
			this.char_str	= String.fromCharCode (event_object.charCode);
		}
		else if (this.key_code) {
			if (event_object.jr_is_ie) {
				this.char_str	= String.fromCharCode (window.event.keyCode);
			}
			else if (jr_IsOpera) {
				if (	this.key_code == jr_ARROW_UP_KEY_CODE
					||	this.key_code == jr_ARROW_DOWN_KEY_CODE
					||	this.key_code == jr_LEFT_KEY_CODE
					||	this.key_code == jr_RIGHT_KEY_CODE
					||	this.key_code == jr_HOME_KEY_CODE
					||	this.key_code == jr_END_KEY_CODE
				) {
					/*
					** 6/23/09: Otherwise these keys will map to $%&#
					*/
					if (this.has_shift) {
						this.char_str	= String.fromCharCode (this.key_code);
					}
				}
				else if (this.key_code >= 16  &&  this.key_code <= 18) {
					/*
					** 9/30/07: It's just the shift/ctrl/alt keys alone
					*/
				}
				else if (this.key_code == jr_BACKSPACE_KEY_CODE) {
				}
				else {
					this.char_str	= String.fromCharCode (this.key_code);
				}
			}
			else if (jr_IsKonqueror) {
				if (this.key_code == 127) {
					this.key_code = jr_DELETE_KEY_CODE;
				}
			}
		}
		if (this.key_code == jr_NEWLINE_KEY_CODE) {
			/*
			** 6/23/09: don't add a char for the newline,
			** it needs special processing, it doesn't get added as a char
			*/
			delete this.char_str;
		}
	}
}

function jr_KeyStrokeHasCtrl( object)
{
	return object.has_ctrl;
}

function jr_KeyStrokeHasAlt( object)
{
	return object.has_alt;
}

function jr_KeyStrokeHasShift( object)
{
	return object.has_shift;
}

function jr_KeyStrokeCode( object)
{
	return object.key_code;
}

function jr_KeyStrokeCharStr( object)
{
	return object.char_str;
}

function jr_KeyStrokeType( object)
{
	return object.type;
}

function jr_KeyStrokeToString( object)
{
	var		diag_string		= "";

	diag_string	+= "key: " + jr_KeyStrokeCode( object);

	if (jr_KeyStrokeCharStr( object)) {
		diag_string += ", char: '" + jr_KeyStrokeCharStr( object) + "'";
	}

	if (jr_KeyStrokeHasShift( object)) {
		diag_string	+= ", shift";
	}
	if (jr_KeyStrokeHasCtrl( object)) {
		diag_string	+= ", ctrl";
	}
	if (jr_KeyStrokeHasAlt( object)) {
		diag_string	+= ", alt";
	}

	diag_string	+= ", " + jr_KeyStrokeType( object);

	return diag_string;
}

function jr_SwitchInitOverlapOnClick (first_element, second_element, ontop_zindex)
{
	if (ontop_zindex == undefined) {
		ontop_zindex	= 100;
	}

	first_element.jr_switch_overlap_el		= second_element;
	first_element.jr_switch_ontop_zindex	= ontop_zindex;
	second_element.jr_switch_overlap_el		= first_element;
	second_element.jr_switch_ontop_zindex	= ontop_zindex;

	jr_ElementRegisterHandler( first_element, jr_CLICK_EVENT, jr_SwitchOverlapClickHandler);
	jr_ElementRegisterHandler( second_element, jr_CLICK_EVENT, jr_SwitchOverlapClickHandler);
}

function jr_SwitchOverlapClickHandler (click_element)
{
	if (click_element.jr_switch_overlap_el) {
		click_element.style.zIndex						= click_element.jr_switch_ontop_zindex;
		click_element.jr_switch_overlap_el.style.zIndex	= click_element.jr_switch_ontop_zindex - 1;
	}

	/*
	** 10-12-10: propagate the event to the underlying element.
	*/
}

function jr_Selector()
{
}

function jr_SelectorCreate( parent_div, label_arg)
{
	object							= new jr_Selector();
	object.selector_el				= jr_ElementAppendChild( parent_div, "div");
	object.dropdown_el				= jr_ElementCreate( "div");
	object.selection_array			= new Array();
	object.choice_max_width_em		= 0;
	object.label_padding_left_em	= 0.5;

	jr_ElementSetStyle( object.selector_el,		"position",		"absolute");
	jr_ElementSetStyle( object.dropdown_el,		"position",		"absolute");

	if (typeof label_arg == "string") {
		object.label_el	= jr_ElementCreate( "span");
		jr_ElementAppendText( object.label_el, label_arg);
	}
	else {
		object.label_el	= label_arg;
	}
	jr_ElementAppendChild( object.selector_el, object.label_el);

	jr_ElementRegisterHandler( object.dropdown_el,  jr_MOUSE_OUT_EVENT,	jr_SelectorOutHandler, object);

	return object;
}

function jr_SelectorGetElement( object)
{
	return object.selector_el;
}
function jr_SelectorGetLabelElement( object)
{
	return object.label_el;
}

function jr_SelectorAddChoiceName( object, choice_name, handler_fn, handler_fn_arg, is_active)
{
	var		label_el				= jr_ElementCreate( "span");
	var		choice_obj;

	jr_ElementAppendText( label_el, choice_name);

	choice_obj	= jr_SelectorAddChoice( object, label_el, handler_fn, handler_fn_arg, is_active);

	if (object.selection_array.length == 1) {
		/*
		** 12-30-2010: It's the first choice
		*/
		jr_ElementSetStyle( choice_obj.choice_div,	"borderTop",		"1px solid #999999");
	}

	jr_ElementSetStyle( choice_obj.choice_div,		"borderLeft",		"1px solid #999999");
	jr_ElementSetStyle( choice_obj.choice_div,		"borderRight",		"1px solid #999999");
	jr_ElementSetStyle( choice_obj.choice_div,		"borderBottom",		"1px solid #999999");
	jr_ElementSetStyle( choice_obj.choice_div,		"paddingLeft",	object.label_padding_left_em, "em");

	choice_obj.has_text_label	= true;

	return choice_obj.choice_div;
}

function jr_SelectorAddChoice( object, label_el, handler_fn, handler_fn_arg, is_active)
{
	var		choice_obj		= new Object();

	choice_obj.jr_selector		= object;
	choice_obj.choice_div		= jr_ElementAppendChild( object.dropdown_el, "div");
	choice_obj.choice_index		= object.selection_array.length;
	choice_obj.label_el			= label_el;
	choice_obj.label_el_clone	= label_el.cloneNode( true);;
	choice_obj.handler_fn		= handler_fn;
	choice_obj.handler_fn_arg	= handler_fn_arg;

	object.selection_array.push( choice_obj);

	jr_ElementAppendChild( choice_obj.choice_div, label_el);

	jr_ElementSetStyle( choice_obj.choice_div,		"width",		"100%");
	jr_ElementSetStyle( choice_obj.choice_div,		"cursor",		"pointer");
	/*
	** 9/19/09: since the parent div will accept click events, a click on
	** this will propagate to the parent, so set a pointer here so the end-user
	** knows clicks will work.
	*/

	/*
	** 12-30-2010: temporarily add the element to figure out it's width.
	** Use the clone since we the other label is already appended.
	*/

	if (object.active_label_el) {
		jr_NodeReplace( object.active_label_el, choice_obj.label_el_clone);
	}
	else {
		object.selector_el.appendChild( choice_obj.label_el_clone);
	}

	var		avg_font_width	= jr_ElementGetFontWidthPx( object.selector_el);
	var		label_width		= choice_obj.label_el_clone.offsetWidth;
	var		width_em		= label_width / avg_font_width;
	/*
	** 12-30-2010: need to get the current em width, could change from choice to choice.
	** (unlikely currently but possible if choices are added dynamically)
	*/
	
	choice_obj.label_width_em	= width_em;

	if (object.active_label_el) {
		jr_NodeReplace( choice_obj.label_el_clone, object.active_label_el);
	}
	else {
		jr_NodeRemoveFromDom( choice_obj.label_el_clone);
	}

	jr_SelectorUpdateMaxChoiceWidth( object, width_em);


	if (is_active) {
		jr_SelectorActivateChoice( object, choice_obj.choice_index, true /* skip handler */);
	}

	jr_ElementRegisterHandler(
		choice_obj.label_el_clone, jr_MOUSE_OVER_EVENT, jr_SelectorOverHandler, object
	);
	jr_ElementRegisterHandler(
		choice_obj.choice_div, jr_CLICK_EVENT,  jr_SelectorChoiceHandler, choice_obj
	);

	return choice_obj;
}

function jr_SelectorUpdateMaxChoiceWidth( object, width_em)
{
	if (width_em <= object.choice_max_width_em) {
		return;
	}
	object.choice_max_width_em	= width_em;
	jr_ElementSetStyle( object.dropdown_el,		"width",	String(width_em) + "em");

	if (object.active_label_el) {
		var		choice_obj	= object.selection_array[object.active_index];

		jr_ElementSetStyle(
			object.active_label_el,	"paddingRight",
			String( object.choice_max_width_em - choice_obj.label_width_em) + "em"
		);
	}
}

function jr_SelectorActivateChoice( object, choice_index, skip_handler)
{
	var		choice_obj	= object.selection_array[choice_index];

	if (object.active_label_el) {
		jr_NodeReplace( object.active_label_el, choice_obj.label_el_clone);
	}
	else {
		object.selector_el.appendChild( choice_obj.label_el_clone);
	}
	object.active_label_el		= choice_obj.label_el_clone;
	object.active_index			= choice_obj.choice_index;

	/*
	** 12-30-2010: pad the label to occupy the width of drop down.
	*/
	if (!jr_ElementIsInDom( object.dropdown_el)) {
		jr_ElementAppendChild( object.selector_el, object.dropdown_el);
	}
	jr_ElementSetStyle(
		choice_obj.label_el_clone,	"paddingLeft", object.label_padding_left_em, "em"
	);
	jr_ElementSetStyle(
		choice_obj.label_el_clone,	"paddingRight",
		String( object.choice_max_width_em - choice_obj.label_width_em ) + "em"
	);

	jr_ElementRemoveFromDom( object.dropdown_el);


	if (choice_obj.handler_fn  &&  !skip_handler) {
		choice_obj.handler_fn( choice_obj.handler_fn_arg);
	}
}

function jr_SelectorDisplayDropDown( object)
{
	var		choice_obj;
	var		curr_zindex		= jr_ElementGetAssignedStyle( object.selector_el);

	jr_ElementAppendChild( object.selector_el, object.dropdown_el);

	jr_ElementSetStyle( object.dropdown_el,		"top",		0);
	jr_ElementSetStyle( object.dropdown_el,		"left",		object.label_el.offsetWidth);
	jr_ElementSetStyle( object.dropdown_el,		"zIndex",	3);

	for (var q=0; q < object.selection_array.length; q++) {
		choice_obj	= object.selection_array[q];

		if (choice_obj.has_text_label) {
			if (q == object.active_index) {
				jr_ElementSetStyle( choice_obj.choice_div, "fontWeight",	"bold");
			}
			else {
				jr_ElementSetStyle( choice_obj.choice_div, "fontWeight",	"normal");
			}
		}
	}
}

function jr_SelectorOverHandler( object, over_el)
{
	jr_SelectorDisplayDropDown( object);
}

function jr_SelectorOutHandler( object, element, event_obj)
{
	var		mouse_x		= event_obj.clientX;
	var		mouse_y		= event_obj.clientY;
	var		dropdown_el	= object.dropdown_el;
	var		origin;

	/*
	** 9/30/09: mouseout fires on all children and gets caught by the parent.
	** Check to see if the mouse is actually not over the dropdown_el anymore.
	** 12-31-10: the mouseout fires when leaving the content, but offsetX
	** includes the border so account for a 1px border.
	** Can't use clientXX for some reason, seems like that should already 
	** include the border.
	*/
	origin	= jr_ElementGetAbsOrigin( dropdown_el);

	origin.x	+= dropdown_el.offsetLeft;
	origin.y	+= dropdown_el.offsetTop;

	/*
	** 2-19-2011: mouse out x,y and the absolute offsets are off by one
	** in X in FF, IE7, and off by 1 or 2 in IE7.
	*/
	if (	mouse_x <= origin.x + 1
		||	mouse_x >= origin.x + dropdown_el.offsetWidth - 1
		||	mouse_y <= origin.y + 1
		||	mouse_y >= origin.y + dropdown_el.offsetHeight - 1) {

		jr_ElementRemoveFromDom( object.dropdown_el);
	}
}

function jr_SelectorChoiceHandler( choice_obj, element)
{
	var		object				= choice_obj.jr_selector;
	var		label_el;

	if (!object) {
		throw new Error( "element not a selector choice");
	}

	jr_SelectorActivateChoice( object, choice_obj.choice_index);
}

