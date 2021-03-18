jr_DiagRegister( "jr_Editor",		"HandleMouseDown",				"mouse down");
jr_DiagRegister( "jr_Editor",		"HandleMouseMove",				"mouse move");
jr_DiagRegister( "jr_Editor",		"HandleMouseUp",				"mouse up");
jr_DiagRegister( "jr_Editor",		"HandleMouseScroll",			"scroll");
jr_DiagRegister( "jr_Editor",		"HandleMouseScrollClip",		"scroll clip");
jr_DiagRegister( "jr_Editor",		"MoveCaretLeftRight",			"move caret left/right");
jr_DiagRegister( "jr_Editor",		"MoveCaretUpDown",				"move caret up/down");
jr_DiagRegister( "jr_Editor",		"HighlightSelection",			"highlight current selection");
jr_DiagRegister( "jr_Editor",		"PlaceCaretInTextNode",			"place caret");
jr_DiagRegister( "jr_Editor",		"ProcessKey",					"process keystroke");
jr_DiagRegister( "jr_Editor",		"FindClickedText",				"find click position");

var		jr_EDITOR_PERIOD_WIDTH		= 4;
var		jr_EDITOR_NUM_LAYERS		= 3;
		/*
		** 10/15/09: layer 3: text, 2: highlight, 1: background, then the original context
		*/
var		jr_INLINE_STYLE_CLASS		= "jr_InlineStyle";

function jr_Editor ()
{
	var		caret_el			= document.createElement ("div");
	var		caret_loc_el		= document.createElement ("span");
	var		char_size_el		= document.createElement ("span");
	var		textarea_el			= document.createElement ("textarea");
	var		tmp_span_el			= document.createElement ("span");
	var		move_box_left_el	= document.createElement ("div");
	var		move_box_right_el	= document.createElement ("div");
	var		move_box_middle_el	= document.createElement ("div");


	jr_ElementSetStyle( textarea_el,		"position",		"absolute");
	jr_ElementSetStyle( textarea_el,		"left",			-1000);
	jr_ElementSetStyle( textarea_el,		"top",			-1000);

	caret_el.style.position				= "absolute";
	caret_el.style.backgroundColor		= "black";
	caret_el.style.margin				= "0";
	caret_el.style.padding				= "0";
	caret_el.style.width				= "1px";
	caret_el.style.height				= "1em";
	caret_el.style.display				= "none";
	caret_el.style.cursor				= "text";

	if (jr_IsIE) {
		/*
		** 9/29/07: IE doesn't provide position info for null spans, and
		** when you give it a width (even 0), it'll break words, which changes
		** the word spacing. A character will provide good location info,
		** but will show off trailing white space.
		*/
		jr_NodeAppendText (caret_loc_el, "i");
		// caret_loc_el.style.width			= "0";
	}
	else {
		caret_loc_el.style.margin			= "0";
		caret_loc_el.style.padding			= "0";
		caret_loc_el.style.width			= "0";
		caret_loc_el.style.height			= "0";
		caret_loc_el.style.display			= "inline";
	}

	jr_NodeAppendText (char_size_el, "m");

	move_box_left_el.style.position			= "absolute";
	move_box_left_el.style.backgroundColor	= "gold";
	move_box_left_el.style.display			= "none";

	move_box_right_el.style.position		= "absolute";
	move_box_right_el.style.backgroundColor	= "gold";
	move_box_right_el.style.display			= "none";

	move_box_middle_el.style.position		= "absolute";
	move_box_middle_el.style.backgroundColor= "gold";
	move_box_middle_el.style.display		= "none";

	tmp_span_el.style.display				= "inline";

	this.jr_editor_textarea_el				= textarea_el;
	this.jr_editor_caret_el					= caret_el;
	this.jr_editor_caret_loc_el				= caret_loc_el;
	this.jr_editor_char_size_el				= char_size_el;
	this.jr_editor_tmp_span_el				= tmp_span_el;
	this.jr_editor_move_box_left_el			= move_box_left_el;
	this.jr_editor_move_box_right_el		= move_box_right_el;
	this.jr_editor_move_box_middle_el		= move_box_middle_el;
	this.jr_editor_indent_ems				= 2;

	this.jr_editor_cmd_table				= new Object();
	this.jr_editor_edit_el_array			= new Array();

	this.jr_editor_browser_does_selection	= false;
	/*
	** 12-8-2011: currently two problems with letting the browser do text selection.
	** First, resetting the keyboard focus() to our off-screen textarea erases
	** the selection highlight. Second, placing the caret in a text node shifts
	** the text around, which apparently truncates the highlight to the beginning
	** of that text node.
	*/

	jr_EditorSpecialKeysInit( this);
	jr_EditorUndoRedoInit( this);
	jr_EditorRegisterStandardOps( this);
}

function jr_EditorAddDiv (object, edit_el)
{
	object.jr_editor_edit_el_array.push( edit_el);
}

function jr_EditorDivSetDisableNewlines( parent_el, value)
{
	parent_el.jr_editor_disable_newlines	= (value != 0);
}

function jr_EditorDivSetDefaultText( parent_el, default_text)
{
	var		span_el;

	if (parent_el.firstChild) {
		throw new Error( "default text parent already has content");
	}

	span_el			= jr_ElementAppendChild( parent_el, "span");

	jr_ElementAppendText( span_el, default_text);

	span_el.jr_editor_is_default_el		= true;
	parent_el.jr_editor_has_default_el	= true;
}

function jr_EditorDivHasDefaultText( parent_el)
{
	if (parent_el.jr_editor_has_default_el) {
		return true;
	}
	return false;
}


function jr_EditorEnable( object)
{
	var		edit_el;
	var		q;

	if (! object.jr_editor_textarea_el) {
		throw new Error( "jr_Editor object not initialized");
	}

	/*
	** 6/19/09: don't register a blur handler since blur means when the whole browser
	** blurs. The jr_EditorHandleBlur() erases the cursor but when the browser window
	** comes back into focus and keystrokes will still enter at that point. So we want
	** to keep the cursor visible.
	*/

	jr_ElementRegisterHandler (
		object.jr_editor_textarea_el, jr_KEY_PRESS_EVENT, jr_EditorHandleKeyPress, object,
		{stop_propagation : false, prevent_default : false}
	);

	if (	jr_KeyPressIgnoresTab
		||	jr_KeyPressIgnoresBackspace
		||	jr_KeyPressIgnoresDelete
		||  jr_KeyPressIgnoresArrow
	) {
		jr_ElementRegisterHandler (
			object.jr_editor_textarea_el, jr_KEY_DOWN_EVENT, jr_EditorHandleKeyDown, object,
			{stop_propagation : false, prevent_default : false}
		);
	}

	jr_ElementRegisterHandler (
		object.jr_editor_textarea_el, jr_BLUR_EVENT, jr_EditorHandleBlur, object,
		{stop_propagation : false, prevent_default : false}
	);
	jr_ElementRegisterHandler (
		object.jr_editor_textarea_el, jr_FOCUS_EVENT, jr_EditorHandleFocus, object,
		{stop_propagation : false, prevent_default : false}
	);

	for (q=0; q < object.jr_editor_edit_el_array.length; q++) {
		edit_el	= object.jr_editor_edit_el_array[q];

		jr_EditorEnableEditEl( object, edit_el);
	}
}

function jr_EditorDisable( object)
{
	var		edit_el;
	var		q;

	if (! object.jr_editor_textarea_el) {
		throw new Error( "jr_Editor object not initialized");
	}

	jr_ElementUnRegisterHandler( object.jr_editor_textarea_el, jr_KEY_PRESS_EVENT);

	if (	jr_KeyPressIgnoresTab
		||	jr_KeyPressIgnoresBackspace
		||	jr_KeyPressIgnoresDelete
		||  jr_KeyPressIgnoresArrow
	) {
		jr_ElementUnRegisterHandler( object.jr_editor_textarea_el, jr_KEY_DOWN_EVENT);
	}

	jr_ElementUnRegisterHandler( object.jr_editor_textarea_el, jr_BLUR_EVENT);
	jr_ElementUnRegisterHandler( object.jr_editor_textarea_el, jr_FOCUS_EVENT);

	for (q=0; q < object.jr_editor_edit_el_array.length; q++) {
		edit_el	= object.jr_editor_edit_el_array[q];

		jr_EditorDisableEditEl( object, edit_el);
	}

	jr_ElementRemoveFromDom( object.jr_editor_caret_el);
	jr_ElementRemoveFromDom( object.jr_editor_textarea_el);
	jr_ElementRemoveFromDom( object.jr_editor_move_box_left_el);
	jr_ElementRemoveFromDom( object.jr_editor_move_box_right_el);
	jr_ElementRemoveFromDom( object.jr_editor_move_box_middle_el);
}

function jr_EditorEnableEditEl( object, edit_el)
{
	var		background_el;
	var		edit_left					= jr_ElementGetAssignedStyle( edit_el,	"left");
	var		edit_right					= jr_ElementGetAssignedStyle( edit_el,	"right");
	var		edit_top					= jr_ElementGetAssignedStyle( edit_el,	"top");
	var		edit_bottom					= jr_ElementGetAssignedStyle( edit_el,	"bottom");
	var		edit_height					= jr_ElementGetAssignedStyle( edit_el,	"height");
	var		edit_width					= jr_ElementGetAssignedStyle( edit_el,	"width");

	/*
	** 6/20/09: need to make the edit div transparent since otherwise highlighting
	** won't work.  The highlight box needs to be visible behind the text.
	** Create a new backing layer to preserve the background color.
	**
	** 9/28/09: Can't make the background element a child of the edit_el since
	** that will mess with the text selection algorithm (it loops over all children)
	** and since its dimensions match the whole edit element, it'll match any click
	** location, but it has no children, so there'll be no text node found.
	*/

	if (edit_el.jr_editor_background_el) {
		/*
		** 10/15/09: Still enabled
		*/
		return;
	}

	edit_el.jr_editor_position				= jr_ElementGetActiveStyle( edit_el, "position");
	edit_el.jr_editor_orig_zindex			= jr_ElementGetActiveStyle( edit_el, "zIndex");
	edit_el.jr_editor_background_color		= jr_ElementGetActiveStyle( edit_el, "backgroundColor");

	edit_el.jr_editor_background_el			= jr_ElementCreate( edit_el.tagName);

	background_el							= edit_el.jr_editor_background_el;

	jr_NodeAppendAfter( edit_el, background_el);

	if (edit_el.jr_editor_position == "static") {
		/*
		** 7/25/09: Non-positioned elements have zIndex 0, so set positioning to "relative"
		** and bump up the zIndex to allow for the highlight boxes to slide underneath.
		**
		** 9/29/09: non-positioned elements go behind all positioned elements
		** except for negatively positioned elements.
		** http://www.w3.org/TR/CSS2/visuren.html#layers
		*/
		jr_ElementSetStyle( edit_el,		"position",		"relative");

		/*
		** 1-17-2011 ToDo: figure out how to get the background element to resize
		** when the edit_el is resized via a browser window resize.
		*/
		jr_ElementSetStyle( background_el,	"position",		"absolute");
		jr_ElementSetStyle( background_el,	"left",			edit_el.offsetLeft);
		jr_ElementSetStyle( background_el,	"top",			edit_el.offsetTop);
		jr_ElementSetStyle( background_el,	"height",		edit_el.offsetHeight);
		jr_ElementSetStyle( background_el,	"width",		edit_el.offsetWidth);
	}
	else {
		jr_ElementSetStyle( background_el,	"position",		"absolute");

		jr_ElementSetStyle( background_el,	"height",		edit_height);
		jr_ElementSetStyle( background_el,	"width",		edit_width);

		jr_ElementSetStyle( background_el,	"left",			edit_left);
		jr_ElementSetStyle( background_el,	"right",		edit_right);
		jr_ElementSetStyle( background_el,	"top",			edit_top);
		jr_ElementSetStyle( background_el,	"bottom",		edit_bottom);
	}

	jr_ElementSetStyle( background_el,	"backgroundColor",	edit_el.jr_editor_background_color);
	jr_ElementSetStyle( edit_el,		"backgroundColor",	"transparent");


	if (edit_el.jr_editor_orig_zindex == "auto"  ||  edit_el.jr_editor_orig_zindex === undefined) {
		edit_el.jr_editor_zindex	= 0;
	}
	else {
		edit_el.jr_editor_zindex	= edit_el.jr_editor_orig_zindex;

	}
	edit_el.jr_editor_zindex		+= jr_EDITOR_NUM_LAYERS;

	jr_ElementSetStyle(	background_el,	"zIndex",				edit_el.jr_editor_zindex - 2);
	jr_ElementSetStyle( edit_el,		"zIndex",				edit_el.jr_editor_zindex);
	jr_ElementSetStyle( object.jr_editor_caret_el,	"zIndex",	edit_el.jr_editor_zindex + 1);

	if (object.jr_editor_browser_does_selection) {
		event_options	= {stop_propagation : false, prevent_default : false};
	}
	else {
		event_options	= {stop_propagation : true, prevent_default : true};
	}

	jr_ElementRegisterHandler( edit_el,	jr_MOUSE_DOWN_EVENT,	jr_EditorHandleMouseDown,	object,
		event_options
	);
	jr_ElementRegisterHandler( edit_el,	jr_SCROLL_EVENT,		jr_EditorHandleScroll,		object);
}

function jr_EditorDisableEditEl( object, edit_el)
{
	if (!edit_el.jr_editor_background_el) {
		return;
	}

	jr_ElementUnRegisterHandler( edit_el,	jr_MOUSE_DOWN_EVENT);
	jr_ElementUnRegisterHandler( edit_el,	jr_SCROLL_EVENT);

	if (edit_el.jr_editor_orig_zindex == "auto"  ||  edit_el.jr_editor_orig_zindex === undefined) {
		jr_ElementSetStyle( edit_el,	"zIndex",	undefined);
	}
	else {
		jr_ElementSetStyle( edit_el,	"zIndex",	edit_el.jr_editor_orig_zindex);
	}
	if (edit_el.jr_editor_position == "static") {
		jr_ElementSetStyle( edit_el,	"position",		"static");
	}
	jr_ElementSetStyle( edit_el,		"backgroundColor",	edit_el.jr_editor_background_color);

	jr_ElementRemoveFromDom( edit_el.jr_editor_background_el);

	delete edit_el.jr_editor_background_el;
}

function jr_EditorUpdateBackgroundHeight( object)
{
	var		edit_el						= object.jr_editor_edit_el;

	if (edit_el.jr_editor_background_el) {
		jr_ElementSetStyle( edit_el.jr_editor_background_el,	"height",		edit_el.offsetHeight);
	}
}

function jr_EditorSetMaxHeight( object, edit_el, max_height)
{
	if (max_height > 0) {
		jr_ElementSetStyle(	edit_el,	"overflow",		"auto");
		jr_ElementSetStyle(	edit_el,	"maxHeight",	max_height);

		if (jr_IsIE) {
			jr_ElementSetStyle(	edit_el,	"height",	max_height);
		}
	}
	else {
		jr_ElementSetStyle(	edit_el,	"height",		null);
		jr_ElementSetStyle(	edit_el,	"maxHeight",	null);
		jr_ElementSetStyle(	edit_el,	"overflow",		null);
	}
	if (edit_el.jr_editor_background_el) {
		jr_ElementSetStyle( edit_el.jr_editor_background_el,	"height",		edit_el.offsetHeight);
	}
}

function jr_EditorInitHandlers( object, edit_node)
{
	var		edit_handler_obj;
	var		tag_name;

	if (edit_node.jr_edit_handler) {
		return edit_node.jr_edit_handler;
	}

	tag_name	= jr_NodeInitCategories( edit_node);

	if (!tag_name) {
		if (edit_node.jr_is_text) {
			return undefined;
		}
		tag_name	= edit_node.tagName;
	};

	edit_handler_obj	= object.jr_editor_handlers[ tag_name.toUpperCase()];

	if (edit_handler_obj) {
		edit_node.jr_edit_handler	= edit_handler_obj;

		edit_handler_obj.initNode( edit_node);
	}

	return edit_node.jr_edit_handler;
}

function jr_EditorAddEditHandler( object, tag_name, edit_handler_obj)
{
	if (! object.jr_editor_handlers) {
		object.jr_editor_handlers	= new Object();
	}

	object.jr_editor_handlers[tag_name.toUpperCase()]	= edit_handler_obj;
}


var jr_EditorSpecialKeys	= new Object();

function jr_EditorSpecialKeysInit( object)
{
	if (jr_IsIE || jr_IsSafari) {
		jr_EditorSpecialKeys[ jr_BACKSPACE_KEY_CODE]	= true;
		jr_EditorSpecialKeys[ jr_TAB_KEY_CODE]			= true;
		jr_EditorSpecialKeys[ jr_NEWLINE_KEY_CODE]		= true;
		jr_EditorSpecialKeys[ jr_ESCAPE_KEY_CODE]		= true;
		jr_EditorSpecialKeys[ jr_LEFT_KEY_CODE]			= true;
		jr_EditorSpecialKeys[ jr_UP_KEY_CODE]			= true;
		jr_EditorSpecialKeys[ jr_RIGHT_KEY_CODE]		= true;
		jr_EditorSpecialKeys[ jr_DOWN_KEY_CODE]			= true;
		jr_EditorSpecialKeys[ jr_DELETE_KEY_CODE]		= true;
	}
	if (jr_IsFirefox) {
		jr_EditorSpecialKeys[ jr_TAB_KEY_CODE]			= true;
	}
}

function jr_EditorHandleBlur (object, textarea_el)
{
	object.jr_editor_clear_copied_nodes	= true;
}

function jr_EditorHandleFocus (object, textarea_el)
{
	if (object.jr_editor_clear_copied_nodes) {
		delete object.jr_editor_copied_nodes;
	}
	object.jr_editor_clear_copied_nodes	= false;
}

function jr_EditorReFocusAfterAction( object)
{
	object.jr_editor_clear_copied_nodes	= false;
	object.jr_editor_textarea_el.focus();
}

function jr_EditorHandleKeyPress (object, textarea_el, event_object)
{
	var		key_info;

	key_info	= new jr_KeyStrokeClass (event_object);

	jr_EditorProcessKeyStroke (object, key_info, event_object);
}

function jr_EditorHandleKeyDown (object, textarea_el, event_object)
{
	var		key_info;

	key_info	= new jr_KeyStrokeClass (event_object);

	if (jr_EditorSpecialKeys[ jr_KeyStrokeCode( key_info)]) {
		jr_EditorProcessKeyStroke (object, key_info, event_object);
	}
}

function jr_EditorProcessKeyStroke (object, key_info, event_object)
{
	var			edit_op;
	var			key_obj;

	if (jr_DoDiag.jr_EditorProcessKeyStroke) {
		var			diag_string		= jr_KeyStrokeToString( key_info);

		// jr_DiagClear();

		jr_DiagPrintLine( diag_string);
	}

	/*
	** 11-23-10: Need to check for CharStr before using key code,
	** since the key code for del and '.' are the same, but the latter
	** has a CharStr, the former doesn't.
	*/
	if (jr_KeyStrokeHasCtrl( key_info)) {
		key_obj		= jr_EditorCtrlKeyMap[ jr_KeyStrokeCode( key_info)];
	}
	else if (jr_KeyStrokeCharStr( key_info)) {
		edit_op		= jr_EditorPasteOpCreate( object, jr_KeyStrokeCharStr( key_info));
	}
	else {
		key_obj		= jr_EditorKeyMap[ jr_KeyStrokeCode( key_info)];
	}

	var		stop_propagation	= true;
	var		prevent_default		= true;

	if (key_obj) {
		edit_op	= key_obj.ProcessKey( object, key_info);

		if (key_obj.is_move) {
			
			if (jr_KeyStrokeHasShift( key_info)) {
				jr_EditorHighlightSelection (object);
			}
			else {
				jr_EditorSelectionInit( object);
			}
		}
		if (key_obj.is_copy  &&  object.jr_editor_copied_nodes) {
			/*
			** 12-4-2010: FF copy code
			** default action for ^C on textarea happens, which grabs
			** the selected area
			*/
			var		z;
			var		curr_node;

			object.jr_editor_textarea_el.value	= "";

			for (z=0;  z < object.jr_editor_copied_nodes.length;  z++) {
				curr_node	= object.jr_editor_copied_nodes[z];

				jr_NodeInitCategories( curr_node);

				if (curr_node.jr_is_text) {
					if (curr_node.length > 0) {
						object.jr_editor_textarea_el.value	+= curr_node.data;
					}
				}
				else {
					if (curr_node.jr_is_block) {
						object.jr_editor_textarea_el.value	+= "\n";
					}

					if (curr_node.innerText) {
						object.jr_editor_textarea_el.value	+= curr_node.innerText;
					}

					if (curr_node.jr_is_block) {
						object.jr_editor_textarea_el.value	+= "\n";
					}
				}
			}

			object.jr_editor_textarea_el.select();

			stop_propagation	= false;
			prevent_default		= false;
		}
		if (key_obj.is_paste  &&  edit_op.no_paste_nodes) {
			/*
			** 12-4-2010: FF paste code
			** default action for ^V on textarea happens, which posts
			** to the selected area. The default action happens after the
			** has bubbled, so grab the data after a delay.
			*/

			object.jr_editor_textarea_el.value	= "";

			window.jr_CurrEditor	= object;

			window.setTimeout( "jr_EditorProcessPastedText( jr_CurrEditor)", 5);

			stop_propagation	= false;
			prevent_default		= false;
		}
	}

	if (edit_op) {
		jr_EditorAddNewEditOp( object, edit_op);
	}

	if (stop_propagation) {
		jr_EventStopPropagation (event_object);
	}
	if (prevent_default) {
		jr_EventPreventDefault (event_object);
	}
}


var MoveDiagCount = 0;

function jr_EditorHandleMouseDown (object, edit_el, event_object, click_node)
{
	var		click_x				= event_object.clientX;
	var		click_y				= event_object.clientY;
	var		is_shift_click		= event_object.shiftKey;
	var		edit_origin;
		
	if (jr_DoDiag.jr_EditorHandleMouseDown  ||  jr_DoDiag.jr_EditorUpdateSelection) {
		jr_DiagClear();
	}

	if (jr_IsIE) {
		/*
		** 9/24/07: Calibrate IE click, should be configurable, i.e. have user click on a line
		** 4/4/2010: Could be we should use clientTop to account for the 1px border on each side.
		*/
		click_x	-= 2;
	}

	object.jr_editor_edit_el	= edit_el;

	edit_origin	= jr_ElementGetAbsOrigin( object.jr_editor_edit_el);

	object.jr_editor_min_x		= edit_origin.x + object.jr_editor_edit_el.offsetLeft;
	object.jr_editor_min_y		= edit_origin.y + object.jr_editor_edit_el.offsetTop;
	object.jr_editor_max_x		= object.jr_editor_min_x + object.jr_editor_edit_el.clientWidth;
	object.jr_editor_max_y		= object.jr_editor_min_y + object.jr_editor_edit_el.clientHeight;

	if (click_x < object.jr_editor_min_x  ||  click_x > object.jr_editor_max_x) {
		object.jr_editor_do_scroll	= true;
	}
	else if (click_y < object.jr_editor_min_y  ||  click_y > object.jr_editor_max_y) {
		object.jr_editor_do_scroll	= true;
	}
	else {
		object.jr_editor_do_scroll	= false;
	}

	if (object.jr_editor_do_scroll) {
		object.jr_editor_last_scroll_top	= edit_el.scrollTop;
	}
	else {

		edit_el.parentNode.appendChild (object.jr_editor_caret_el);
		edit_el.parentNode.appendChild (object.jr_editor_textarea_el);
		edit_el.parentNode.appendChild (object.jr_editor_move_box_left_el);
		edit_el.parentNode.appendChild (object.jr_editor_move_box_right_el);
		edit_el.parentNode.appendChild (object.jr_editor_move_box_middle_el);


		jr_EditorPlaceCaret (object, click_node, click_x, click_y);

		if (object.jr_editor_text_node_left.parentNode.jr_editor_is_default_el) {
			/*
			** 10/12/09: User clicked on default text. Make that text disappear,
			** recalculate with the parent element, which is the actual clicked-on element.
			*/
			var		default_el		= object.jr_editor_text_node_left.parentNode;
			var		parent_el		= default_el.parentNode;


			jr_ElementSetStyle( parent_el, "minHeight", "1em");
			jr_ElementRemoveFromDom( default_el);
			jr_ElementAppendText( parent_el, "\u00A0");

			delete parent_el.jr_editor_has_default_el;

			jr_EditorPlaceCaret (object, parent_el, click_x, click_y);
		}
		if (	object.jr_editor_text_node_left.length > 0
			&&	object.jr_editor_text_node_right.length == 0
			&&  !object.jr_editor_text_node_right.nextSibling) {

			/*
			** 11-23-10: check for a &nbsp; as the last char in an element.
			** Assuming it's a block element, it's probably leftover from
			** adding a new block element
			*/
			var		left_length	= object.jr_editor_text_node_left.length;
			var		last_char	= object.jr_editor_text_node_left.substringData( left_length - 1, 1);

			if ( last_char.charAt(0) == '\u00A0') {
				/*
				** 11-23-10: move it to the other side of the cursor.
				*/
				object.jr_editor_text_node_right.insertData( 0, "\u00A0");
				object.jr_editor_text_node_left.deleteData( left_length - 1, 1);
				object.jr_editor_has_artificial_space	= true;

				jr_EditorUpdateCaret( object);
			}
		}

		if (object.jr_editor_textarea_el) {
			jr_EditorReFocusAfterAction( object);
		}

		delete object.jr_editor_updown_x;

		if (is_shift_click  &&  object.jr_editor_has_selection_start) {
			jr_EditorHighlightSelection (object);
		}
		else {
			jr_EditorSelectionInit (object);
		}
	}

	if (jr_DoDiag.jr_EditorHandleMouseDown) {
		var		diag_string;

		diag_string	= "Down: click: [" + click_x + ", " + click_y + "]";

		if (object.jr_editor_do_scroll) {
			diag_string += " SCROLL";
		}
		else {
			diag_string += ", text: [" + object.jr_editor_caret_x + ", " + object.jr_editor_caret_y +"]";
		}

		jr_DiagPrintLine( diag_string);

		diag_string = "box [" + edit_el.offsetLeft + "-" + (edit_el.offsetLeft + edit_el.offsetWidth);
		diag_string += ",  " + edit_el.offsetTop + "-" + (edit_el.offsetTop + edit_el.offsetHeight) +"]";
		jr_DiagPrintLine( diag_string);

		diag_string = "scroll [" + edit_el.scrollLeft + "-" + (edit_el.scrollLeft + edit_el.scrollWidth);
		diag_string += ",  " + edit_el.scrollTop + "-" + (edit_el.scrollTop + edit_el.scrollHeight) +"]";
		jr_DiagPrintLine( diag_string);

		diag_string = "client [" + edit_el.clientLeft + "-" + (edit_el.clientLeft + edit_el.clientWidth);
		diag_string += ",  " + edit_el.clientTop + "-" + (edit_el.clientTop + edit_el.clientHeight) +"]";
		jr_DiagPrintLine( diag_string);

		diag_string = "min/max [" + object.jr_editor_min_x + "-" + object.jr_editor_max_x;
		diag_string += ",  " + object.jr_editor_min_y + "-" + object.jr_editor_max_y +"]";
		jr_DiagPrintLine( diag_string);
	}

	MoveDiagCount = 0;
	ScrollDiagCount = 0;

	if (object.jr_editor_browser_does_selection) {
		event_options	= {stop_propagation : false, prevent_default : false};
	}
	else {
		jr_ElementRegisterHandler( edit_el,		jr_MOUSE_MOVE_EVENT,jr_EditorHandleMouseMove,	object);
		event_options	= {stop_propagation : true, prevent_default : true};
	}

	jr_ElementRegisterHandler( document.body,	jr_MOUSE_UP_EVENT, 	jr_EditorHandleMouseUp,		object,
		event_options
	);
	/*
	** 10/9/09: Mouse-up on the whole viewport so that we'll always get it.
	*/

	/*
	** 9/30/09 ToDo: Apparently when the window blurs, this blurs as well.
	** Somehow need to catch the blur when the user clicks outside the editor
	** but ignore it when the window blurs.
	*/
	/*
	jr_ElementRegisterHandler (
		object.jr_editor_textarea_el, jr_BLUR_EVENT, jr_EditorStopEditting, object
	);
	*/

	object.jr_editor_click_x		= click_x;
	object.jr_editor_click_y		= click_y;
}


function jr_EditorHandleMouseMove (object, edit_el, event_object, click_node)
{
	var		mouse_x				= event_object.clientX;
	var		mouse_y				= event_object.clientY;
		

	if (object.jr_editor_do_scroll) {
		return;
	}

	if (jr_IsIE) {
		/*
		** 9/24/07: Calibrate IE click, should be configurable, i.e. have user click on a line
		*/
		mouse_x	-= 2;
	}

	if (jr_DoDiag.jr_EditorHandleMouseMove) {
		var		diag_string;

		if (MoveDiagCount == 0) {
			jr_DiagPrintLine( "");
			jr_DiagAppend( "Move: ");
		}
		diag_string	= "[" + mouse_x + ", " + mouse_y + "] ";

		jr_DiagPrintLine( diag_string);
		MoveDiagCount ++;

		if (MoveDiagCount >= 5) {
			MoveDiagCount = 0;
		}
	}

	try {
		jr_EditorUpdateDragSelection (object, mouse_x, mouse_y);
	}
	catch (err) {
		alert ("jr_EditorHandleMouseMove() error: " + jr_ExceptionString( err));
		jr_ElementUnRegisterHandler( document.body,	jr_MOUSE_UP_EVENT);
		jr_ElementUnRegisterHandler( object.jr_editor_edit_el,	jr_MOUSE_MOVE_EVENT);
	}
}

function jr_EditorHandleMouseUp (object, document_body, event_object, up_node)
{
	var		up_x				= event_object.clientX;
	var		up_y				= event_object.clientY;
		

	if (!object.jr_editor_do_scroll) {

		if (jr_IsIE) {
			/*
			** 9/24/07: Calibrate IE click, should be configurable, i.e. have user click on a line
			*/
			up_x	-= 2;
		}

		if (up_x != object.jr_editor_click_x  ||  up_y != object.jr_editor_click_y) {

			jr_EditorPlaceCaret (object, object.jr_editor_edit_el, up_x, up_y);
			/*
			** 10/13/09: Don't use the "up_node" since that could be any element
			** in the document body, since we registered the MOUSE_UP on the document body.
			*/
		}

		if (object.jr_editor_caret_y < object.jr_editor_move_start_y
			||	object.jr_editor_caret_y == object.jr_editor_move_start_y
			&&	object.jr_editor_caret_x < object.jr_editor_move_start_x) {

			object.jr_editor_going_backwards	= true;
		}
		else {
			object.jr_editor_going_backwards	= false;
		}


		if (! object.jr_editor_browser_does_selection) {
			jr_EditorHighlightSelection (object);
			/*
			** 9/27/09: need to either finish the current selection for turn off the previous
			** selection.
			*/

		}
		if (object.jr_editor_textarea_el) {
			jr_EditorReFocusAfterAction( object);
		}

		delete object.jr_editor_updown_x;
	}

	jr_ElementUnRegisterHandler( document.body,	jr_MOUSE_UP_EVENT);
	jr_ElementUnRegisterHandler( object.jr_editor_edit_el,	jr_MOUSE_MOVE_EVENT);

	if (jr_DoDiag.jr_EditorHandleMouseUp) {
		var		diag_string;


		jr_DiagPrintLine( "");
		diag_string	= "Up: [" + up_x + ", " + up_y + "]";
		if (object.jr_editor_do_scroll) {
			diag_string += " SCROLL";
		}
		else {
			diag_string += ", text: [" + object.jr_editor_caret_x + ", " + object.jr_editor_caret_y +"]";
		}
		jr_DiagPrintLine( diag_string);
	}
}

var ScrollDiagCount	= 0;

function jr_EditorHandleScroll (object, edit_el, event_object, click_node)
{
	var		scroll_delta;

	scroll_delta						= edit_el.scrollTop - object.jr_editor_last_scroll_top;
	object.jr_editor_last_scroll_top	= edit_el.scrollTop;

	if (! object.jr_editor_browser_does_selection) {
		jr_EditorScrollSelectionBox( object, scroll_delta, edit_el.offsetTop, edit_el.offsetHeight);
	}

	if (jr_DoDiag.jr_EditorHandleScroll) {
		var		diag_string;

		if (ScrollDiagCount == 0) {
			jr_DiagPrintLine( "");
			jr_DiagAppend( "Scroll: ");
		}
		diag_string	= " " + scroll_delta;

		jr_DiagAppend( diag_string);
		ScrollDiagCount ++;

		if (ScrollDiagCount >= 5) {
			ScrollDiagCount = 0;
		}
	}
}


function jr_EditorSetCaretPositionInEditDiv( object, caret_x, caret_y, caret_height)
{
	var		edit_origin;

	edit_origin	= jr_ElementGetAbsOrigin( object.jr_editor_edit_el);
	
	edit_origin.y += object.jr_editor_edit_el.scrollTop;
	/*
	** 6-15-2010: the caret element is relative to the parent node, whereas
	** the caret_y passed in is relative to the edit div include the scrollTop
	*/

	/*
	** 12-12-2010: when shift-selection the word "some" in the 2nd paragraph,
	** when putting the end selection on the end of the trailing 'e' (225),
	** commenting out the following line causes the IE blue backgroud flash.
	** The value for "left" should be 163, setting to 162, 165 doesn't have the effect.
	** Commenting the re-focus shows that in MouseDown handler shows the selection
	** is large. Turns out 163 is where the cursor currently is.
	*/
	jr_ElementSetStyle( object.jr_editor_caret_el,	"left",	caret_x - edit_origin.x);
	jr_ElementSetStyle( object.jr_editor_caret_el,	"top",	caret_y - edit_origin.y);

	object.jr_editor_caret_x				= caret_x;
	object.jr_editor_caret_y				= caret_y;

	if (caret_height > 0) {
		jr_ElementSetStyle( object.jr_editor_caret_el,	"height",	caret_height);
		object.jr_editor_curr_char_height	= caret_height;
	}

	jr_EditorSetPreScrollInfo(object, object.jr_editor_caret_el);
}

function jr_EditorPlaceCaret (object, click_node, click_x, click_y)
{
	var		text_node;

	text_node	= jr_EditorFindClickedText (object, click_node, click_x, click_y);

	if (!text_node) {
		if (click_node === object.jr_editor_edit_el) {
			throw new Error( "ToDo: no text node, see comment in code");
			/*
			** 10/14/19 ToDo: can't add to the click node, it may be the top-level
			** edit element. Instead get the previous text node of the parent w/o text?
			** So return the element that failed, and return the previous text node?
			*/
		}
		else {

			text_node	= jr_NodeGetFirstSubTextNode( click_node);

			if (!text_node) {
				/*
				** 10/13/09: No text in the editor, add an empty text object.
				*/
				text_node	= jr_ElementAppendText( click_node, "");
			}
		}
	}

	jr_EditorPlaceCaretInTextNode ( object, text_node, click_x, click_y);

	jr_ElementSetStyle( object.jr_editor_caret_el, "display", "block");

	return 0;
}

function jr_EditorFindClickedText (object, parent_node, click_x, click_y)
{
	/*
	** 9/17/07: assumes nodes are inline in display order.
	** First binary search on height, since the nodes are in order wrt height.
	*/
	var		tmp_span_el		= object.jr_editor_tmp_span_el;
	var		el_origin;
	var		scrollTop		= object.jr_editor_edit_el.scrollTop;
	var		child_node;
	var		curr_el;
	var		curr_top;
	var		curr_height;
	var		curr_left;
	var		curr_width;
	var		low_index;
	var		high_index;
	var		mid_index;
	var		q;
	
	var		diag_string;
	

	if (parent_node.nodeType == jr_Node.TEXT_NODE) {
		return parent_node;
	}

	/*
	** 9/23/07: Note: text nodes have no offset info, so wrap them in a span.
	** Also note that inline elements are not rectangular, i.e. that offsetLeft
	** not refer to the leftmost edge, rather the X position of the topmost left edge
	** To get the ending left edge, you need to look at left edge of the next inline element.
	** Summary: offsetLeft + offsetWidth has no meaning.
	*/

	if (jr_DoDiag.jr_EditorFindClickedText) {
		diag_string	= "jr_EditorFindClickedText( " + parent_node.tagName;
		diag_string	+= ", " + click_x + ", " + click_y + ")";
		jr_DiagPrintLine( diag_string);
	}

	/*
	** 9/17/07: First find a node with the correct y value
	*/
	low_index	= 0;
	high_index	= parent_node.childNodes.length;

	while (low_index != high_index) {
		mid_index	= low_index + Math.floor ((high_index - low_index)/2);

		child_node	= parent_node.childNodes[mid_index];

		if (child_node.nodeType == jr_Node.TEXT_NODE) {
			parent_node.replaceChild (tmp_span_el, child_node);

			tmp_span_el.appendChild (child_node);

			curr_el	= tmp_span_el;
		}
		else if (child_node.nodeType == jr_Node.ELEMENT_NODE) {
			curr_el	= child_node;
		}
		else {
			throw new Error( "illegal node type " + child_node.nodeType);
		}

		el_origin		= jr_ElementGetAbsOrigin( curr_el);

		curr_top		= el_origin.y + curr_el.offsetTop - scrollTop;
		curr_height		= curr_el.offsetHeight;

		if (child_node.nodeType == jr_Node.TEXT_NODE) {
			tmp_span_el.removeChild (child_node);
			parent_node.replaceChild (child_node, tmp_span_el);
		}

		if (jr_DoDiag.jr_EditorFindClickedText) {
			var	curr_end	= curr_top + curr_height;

			diag_string = "    mid index: " + mid_index + ", y [" + curr_top + " - " + curr_end + "]";
			jr_DiagPrintLine( diag_string);
		}

		if (click_y  <  curr_top) {
			high_index	= mid_index;
		}
		else if (click_y  >  curr_top + curr_height) {
			low_index	= mid_index + 1;
		}
		else {
			break;
		}
	}

	if (low_index == high_index) {
		var		text_node		= null;

		if (low_index > 0) {
			low_index --;
		}
		if (parent_node.childNodes.length > 0) {

			text_node	= jr_NodeGetLastSubTextNode( parent_node.childNodes[low_index]);
		}
		
		if (jr_DoDiag.jr_EditorFindClickedText) {
			diag_string = "    low_index: " + low_index;

			if (text_node) {
				diag_string += ", '" + text_node.data.substring( 0, 10) + "'";
			}
			jr_DiagPrintLine( diag_string);
		}

		/*
		** 6/22/09: Note: text_node could be null
		*/
		return text_node;
	}

	/*
	** 9/17/07 Multiple elements could have the correct y range. Find
	** the first child (low_index) and last child (high_index - 1) have a matching y range.
	*/
	for (q = mid_index - 1; q >= 0;  q--) {
		child_node = parent_node.childNodes[q];

		if (child_node.nodeType == jr_Node.TEXT_NODE) {
			parent_node.replaceChild (tmp_span_el, child_node);

			tmp_span_el.appendChild (child_node);

			curr_el	= tmp_span_el;
			/*
			** 6/25/09: In IE the span may end up on the previous line eventhough
			** the text node was one the following. This will give the wrong height.
			** Appears to happen if the text node begins a line?
			*/
		}
		else if (child_node.nodeType == jr_Node.ELEMENT_NODE) {
			curr_el	= child_node;
		}
		else {
			throw new Error( "illegal node type " + child_node.nodeType);
		}

		el_origin		= jr_ElementGetAbsOrigin( curr_el);

		curr_top		= el_origin.y + curr_el.offsetTop - scrollTop;
		curr_height		= curr_el.offsetHeight;

		if (child_node.nodeType == jr_Node.TEXT_NODE) {
			tmp_span_el.removeChild (child_node);
			parent_node.replaceChild (child_node, tmp_span_el);
		}
		if (jr_DoDiag.jr_EditorFindClickedText) {
			var	curr_end	= curr_top + curr_height;

			diag_string = "    match: " + q + ", y [" + curr_top + " - " + curr_end + "]";
			jr_DiagPrintLine( diag_string);
		}

		if (click_y  <  curr_top  ||  click_y  >  curr_top + curr_height
		) {
			break;
		}
	}
	low_index	= q + 1;

	/*
	** 9/17/07: find the last element having a matching y range (high_index - 1).
	*/
	for (q = mid_index + 1; q < parent_node.childNodes.length;  q++) {
		child_node = parent_node.childNodes[q];

		if (child_node.nodeType == jr_Node.TEXT_NODE) {
			parent_node.replaceChild (tmp_span_el, child_node);

			tmp_span_el.appendChild (child_node);

			curr_el	= tmp_span_el;
		}
		else if (child_node.nodeType == jr_Node.ELEMENT_NODE) {
			curr_el	= child_node;
		}
		else {
			throw new Error( "illegal node type " + child_node.nodeType);
		}

		el_origin		= jr_ElementGetAbsOrigin( curr_el);

		curr_top		= el_origin.y + curr_el.offsetTop - scrollTop;
		curr_height		= curr_el.offsetHeight;

		if (child_node.nodeType == jr_Node.TEXT_NODE) {
			tmp_span_el.removeChild (child_node);
			parent_node.replaceChild (child_node, tmp_span_el);
		}

		if (click_y  <  curr_top  ||  click_y  >  curr_top + curr_height) {
			break;
		}
	}
	high_index	= q;

	if (jr_DoDiag.jr_EditorFindClickedText) {
		diag_string	= "    low_index: " + low_index + ", high_index: " + high_index;
		jr_DiagPrintLine( diag_string);
	}

	/*
	** 9/23/07: low_index and high_index are at least 1 element apart.
	*/

	if (high_index - low_index == 1) {
		child_node = parent_node.childNodes[low_index];
	}
	else {
		/*
		** 9/17/07: More than one inline on the line.  Note that the first should have an unusable
		** offsetLeft, since it most likely starts on a previous line.
		*/
		var		match_index			= high_index - 1;
		var		num_zero_width		= 0;


		for (q = low_index;  q < high_index; q++) {


			child_node	= parent_node.childNodes[q];

			if (jr_IsIE) {
				/*
				** 9/24/07: A zero-width span has a bogus X value in IE, use the X value
				** of the following
				*/

				while (	child_node.nodeType == jr_Node.TEXT_NODE	&& child_node.length == 0
					||	child_node.nodeType == jr_Node.ELEMENT_NODE	&& child_node.offsetWidth == 0
				) {
					q++;
					if (q < high_index) {
						child_node	= parent_node.childNodes[q];
					}
					else {
						break;
					}
				}

				if (q == high_index) {
					/*
					** 9/24/07: All nulls to the end.
					*/
					break;
				}
			}


			if (child_node.nodeType == jr_Node.TEXT_NODE) {
				parent_node.replaceChild (tmp_span_el, child_node);

				tmp_span_el.appendChild (child_node);

				curr_el	= tmp_span_el;
			}
			else if (child_node.nodeType == jr_Node.ELEMENT_NODE) {
				curr_el	= child_node;
			}
			else {
				throw new Error( "illegal node type " + child_node.nodeType);
			}

			el_origin		= jr_ElementGetAbsOrigin( curr_el);

			curr_left		= el_origin.x + curr_el.offsetLeft;

			if (child_node.nodeType == jr_Node.TEXT_NODE) {
				tmp_span_el.removeChild (child_node);
				parent_node.replaceChild (child_node, tmp_span_el);
			}

			if (jr_DoDiag.jr_EditorFindClickedText) {
				var	curr_end	= curr_left + curr_width;

				diag_string = "    x index: " + q + ", cur_left: " + curr_left;
				jr_DiagPrintLine( diag_string);
			}

			if (click_x < curr_left) {
				/*
				** 6/25/09: Went past, the previous is the match
				*/
				
				if (q != low_index) {
					match_index	= q - 1;
					break;
				}
				/*
				** 6/25/09: the first element's left index may refer to 
				** to its beginning on the previous line.
				*/
			}
		}

		child_node	= parent_node.childNodes[match_index];
	}

	if (child_node.nodeType == jr_Node.TEXT_NODE) {
		return child_node;
	}
	if (child_node.offsetWidth == 0  ||  child_node.offsetHeight == 0) {
		/*
		** 9/24/07: managed to click on an empty node (it's possible)
		** Use the prior node.
		*/
		child_node	= child_node.previousSibling;
		
		if (child_node.nodeType == jr_Node.TEXT_NODE) {
			return child_node;
		}
		click_x --;
	}

	return jr_EditorFindClickedText (object, child_node, click_x, click_y);
}

function jr_EditorPlaceCaretInTextNode( object, text_node, click_x, click_y)
{
	var		caret_loc_el		= object.jr_editor_caret_loc_el;
	var		scrollTop			= object.jr_editor_edit_el.scrollTop;

	var		diag_string;
	
	var		parent_el			= text_node.parentNode;
	var		text_node_left;
	var		text_node_right;

	var		text_length;
	var		text_left;
	var		text_right;

	var		low_index;
	var		high_index;
	var		mid_index;

	var		text_string;

	var		char_width;
	var		char_height;


	/*
	** 6/23/09: Works better on IE if we only split if there aren't any siblings.
	** Don't remember why.
	*/
	if (text_node.nextSibling  &&  text_node.nextSibling.nodeType == jr_Node.TEXT_NODE) {
		text_node_left	= text_node;
		text_node_right	= text_node.nextSibling;
	}
	else if (text_node.previousSibling  &&  text_node.previousSibling.nodeType == jr_Node.TEXT_NODE) {
		text_node_right	= text_node;
		text_node_left	= text_node.previousSibling;
	}
	else {
		text_node_left	= text_node;
		text_length		= text_node.length;

		if (text_node.length < 2) {
			/*
			** 9/25/07: IE doesn't support 0-length nodes after splits
			*/
			text_node_right = document.createTextNode ("");
			if (text_node_left.nextSibling) {
				text_node_left.parentNode.insertBefore (text_node_right, text_node_left.nextSibling);
			}
			else {
				text_node_left.parentNode.appendChild (text_node_right);
			}
		}
		else {
			text_node_right	= text_node_left.splitText (Math.floor (text_length/2));
		}
	}

	jr_NodeRemoveFromDom( caret_loc_el);

	jr_NodeInsertBefore( text_node_right, object.jr_editor_char_size_el);

	char_width	= object.jr_editor_char_size_el.offsetWidth;
	char_height	= object.jr_editor_char_size_el.offsetHeight;

	jr_NodeReplace( object.jr_editor_char_size_el, caret_loc_el);

	/*
	** 9/23/07: Compute the origin of the caret's coords in terms of document coords
	** since that's the frame of reference for the mouse click.
	*/

	var		caret_origin;
	var		caret_top;
	var		caret_bottom;
	/*
	** 9/23/07: Find a char index that has the correct Y value
	*/
	caret_origin	= jr_ElementGetAbsOrigin( caret_loc_el);
	low_index		= 0;
	high_index		= text_node_left.length + text_node_right.length;

	while (low_index != high_index) {
		
		mid_index	= low_index + Math.floor ((high_index - low_index)/2);

		jr_TextShift (text_node_left, text_node_right, mid_index - text_node_left.length);

		caret_top		= caret_origin.y + caret_loc_el.offsetTop - scrollTop;
		caret_bottom	= caret_top + caret_loc_el.offsetHeight;

		if (click_y  <  caret_top) {
			high_index	= mid_index;
		}
		else if (click_y  >  caret_bottom) {
			low_index	= mid_index + 1;
		}
		else {
			break;
		}
	}

	/*
	** 9/23/07: Find the correct X location
	*/
	var		start_view_x;
	var		start_view_y;
	var		left_view_x;
	var		prev_view_x;
	var		prev_view_y;
	var		caret_view_x;
	var		caret_view_y;
	var		x_diff;
	var		new_x_diff;
	var		num_chars;
	var		shift_text;


	if (char_width <= 0) {
		char_width	= 20;
	}

	start_view_x		= caret_origin.x + caret_loc_el.offsetLeft;
	start_view_y		= caret_origin.y + caret_loc_el.offsetTop - scrollTop;

	x_diff			= click_x - start_view_x;
	num_chars		= Math.floor (x_diff / char_width);

	if (parent_el === caret_loc_el.offsetParent) {
		left_view_x	= caret_origin.x;
	}
	else {
		left_view_x	= caret_origin.x + parent_el.offsetLeft;
	}

	caret_view_x		= caret_origin.x + caret_loc_el.offsetLeft;
	caret_view_y		= caret_origin.y + caret_loc_el.offsetTop - scrollTop;

	if (jr_DoDiag.jr_EditorPlaceCaretInTextNode) {
		
		diag_string = "PlaceCaret click [" + click_x + ", " + click_y + "]";
		diag_string += ", start [" + caret_view_x + ", " + caret_view_y + "]";
		diag_string += ", x_diff: " + x_diff;
		jr_DiagPrintLine( diag_string);
		diag_string	= "Initial left length: " + text_node_left.length;
		diag_string += ", right: " + text_node_right.length;
		jr_DiagPrintLine( diag_string);

		diag_string	= "--> '" + text_node_left.data + "'";
		jr_DiagPrintLine( diag_string);

		diag_string = "char_width: " + char_width;
		diag_string += ", left_view_x: " + left_view_x;
		jr_DiagPrintLine( diag_string);
	}

	/*
	** 6/25/09: jr_EditorMoveCaretLeftRight() calls below needs these set.
	*/
	object.jr_editor_text_node_left		= text_node_left;
	object.jr_editor_text_node_right	= text_node_right;

	while (x_diff != 0) {
	
		if (num_chars == 0) {
			if (x_diff < 0) {
				num_chars	= -1;
			}
			else if (x_diff > 0) {
				num_chars	= 1;
			}
		}

		if (num_chars == -1) {
			if (text_node_left.length == 0) {
				break;
			}
		}
		else if (num_chars == 1) {
			if (text_node_right.length == 0) {
				break;
			}
		}

		prev_view_x	= caret_view_x;
		prev_view_y	= caret_view_y;

		shift_text		= jr_TextShift (text_node_left, text_node_right, num_chars);

		if (num_chars < 0) {
			num_chars	= -shift_text.length;
		}
		else {
			num_chars	= shift_text.length;
		}

		caret_view_x			= caret_origin.x + caret_loc_el.offsetLeft;
		caret_view_y			= caret_origin.y + caret_loc_el.offsetTop - scrollTop;

		new_x_diff		= click_x - caret_view_x;

		if (jr_DoDiag.jr_EditorPlaceCaretInTextNode) {

			diag_string	= "--> '" + text_node_left.data + "'";
			jr_DiagPrintLine( diag_string);

			diag_string = "curr [" + caret_view_x + ", " + caret_view_y + "]";
			diag_string	+= ", num_chars was: " + num_chars;
			diag_string += ", new_x_diff: " + new_x_diff;

			jr_DiagPrintLine( diag_string);
		}

		if (caret_view_y == start_view_y) {
			/*
			** 9/24/07: Still on the same line.
			*/

			if (new_x_diff == x_diff) {
				/*
				** 9/24/07: No change, could be due to white space (which takes up no
				** formatted space), or we could have run out of chars.
				*/
				if (	num_chars < 0  &&  text_node_left.length == 0
					||	num_chars > 0  &&  text_node_right.length == 0
				) {
					break;
				}

				/*
				** 6/23/09: Still have chars, keep going in the same direction.
				** Both x_diff and num_chars are the same, but if this case
				** keeps happening, we'll eventually run out of chars.
				*/
			}
			else if (Math.abs (new_x_diff)  <  Math.abs (x_diff)) {
				/*
				** 9/24/07: We're closer, keep going.
				** Both x_diff and num_chars are smaller.
				*/
				x_diff		= new_x_diff;
				num_chars	= Math.floor (x_diff / char_width);
			}
			else {
				/*
				** 9/24/07: we went past and either are the same distance away or worse
				*/

				if (num_chars > 0  &&  new_x_diff > 0) {
					/*
					** 9/30/07: . we're going right but our x is more to left than before?
					** our x position went in the wrong direction,
					** Probably a browser measuring error.
					*/
					if (jr_DoDiag.jr_EditorPlaceCaretInTextNode) {
						/*
						** 9/30/07: We're just after a space near the end of line?
						*/
						jr_DiagPrintLine( "IE measuring error");
					}
				}
				if (Math.abs (num_chars) == 1) {
					/*
					** 9/18/07: Click is between two chars, closer to the previous one.
					*/
					jr_TextShift (text_node_left, text_node_right, -num_chars);

					caret_view_x	= prev_view_x;
					caret_view_y	= prev_view_y;
					break;
				}
				else {
					/*
					** 9/18/07: worse or same as the previous, go back by half
					*/
					x_diff		= new_x_diff;
					num_chars	= -Math.floor (num_chars/2);
				}
			}
		}
		else {
			/*
			** 9/18/07: We jumped to the next/previous line, go back some.
			** Our char width is probably too small (we had to guess, and
			** we guessed too small).
			*/

			if (num_chars == -1) {
				if (	caret_view_y < prev_view_y
					&&	(	left_view_x  <  prev_view_x
						&&  prev_view_x < caret_view_x
						&&   caret_view_y < prev_view_y
						||	jr_IsIE && left_view_x == caret_view_x)
					&&	shift_text.match (/\S/)) {
					/*
					** 9/27/07: Going left, jumped up and to the right, but we hadn't
					** hit the left edge yet and the current char isn't white space.
					** Should be at the beginning of the line but browsers consider space
					** at the end of the previous.
					** IE case: browser error, caret_view_x is set to left_view_x eventhough y
					** goes to prev. line.
					**
					** See identical case(s) in jr_EditMoveCaretLeftRight
					*/
					caret_view_x	= left_view_x;
					caret_view_y	= prev_view_y;

					if (jr_DoDiag.jr_EditorPlaceCaretInTextNode) {
						jr_DiagPrintLine( "reset left edge");
					}
				}
				else {
					/*
					** 6/25/09: can only happen if a line starts with a space,
					** i.e. going left over a space and jumped up a line.
					** Only seems possible if the browser doesn't align the left edge.
					*/
					jr_TextShift (text_node_left, text_node_right, -num_chars);

					caret_view_x	= prev_view_x;
					caret_view_y	= prev_view_y;
				}
				break;
			}
			else if (num_chars == 1) {
				/*
				** 9/23/07: i.e. num_chars == 1  => the click was between the last
				** char on the line and the end of line.
				*/
				jr_TextShift (text_node_left, text_node_right, -num_chars);

				caret_view_x	= prev_view_x;
				caret_view_y	= prev_view_y;
				break;
			}
			else {
				num_chars	= -Math.floor (num_chars/2);

				if (jr_DoDiag.jr_EditorPlaceCaretInTextNode) {

					caret_origin	= jr_ElementGetAbsOrigin( caret_loc_el);

					diag_string	= "undo: " + -num_chars;
					diag_string += ", curr [" + caret_view_x + ", " + caret_view_y + "]";
					diag_string += ", off [" + caret_loc_el.offsetLeft + ", " + caret_loc_el.offsetTop + "]";

					jr_DiagPrintLine( diag_string);
				}
			}
		}
	}

	jr_EditorSetCaretPositionInEditDiv( object, caret_view_x, caret_view_y + scrollTop, char_height);

	if (jr_DoDiag.jr_EditorPlaceCaretInTextNode) {
		
		diag_string	= "Caret [" + object.jr_editor_caret_x + ", " + object.jr_editor_caret_y + "]";
		diag_string	+= ", left length: " + text_node_left.length;
		jr_DiagPrintLine( diag_string);
		diag_string	= "--> '" + text_node_left.data + "|" + text_node_right.data + "'";
		jr_DiagPrintLine( diag_string);
	}


	jr_NodeRemoveFromDom( caret_loc_el);
}

function jr_EditorShiftCaretByOne (object, direction)
{
	var			orig_text_parent	= object.jr_editor_text_node_right.parentNode;
	var			text_node_left;
	var			text_node_right;
	var			shift_amount;
	var			shift_text;
	var			num_shift_chars		= 1;

	/*
	** 3/15/08: Only uses sign of the number of chars.
	*/

	if (direction < 0  &&  object.jr_editor_text_node_left.length == 0) {

		text_node_right	= object.jr_editor_text_node_left;

		/*
		** 9/27/07: Find non-zero node to left, remove the 0-length nodes to clean up the tree.
		*/
		while (text_node_right.length == 0) {
			text_node_left	= jr_NodeGetPreviousTextNode (text_node_right, object.jr_editor_edit_el);

			if (! text_node_left) {
				/*
				** 9/28/07: no non-zero elements to the left => at the beginning
				*/
				if (!object.jr_editor_text_node_left) {
					text_node_left = document.createTextNode ("");

					object.jr_editor_text_node_right.parentNode.insertBefore(
						text_node_left, object.jr_editor_text_node_right
					);
				}
				return null;
			}

			text_node_right.parentNode.removeChild (text_node_right);
			object.jr_editor_text_node_left	= null;
			/*
			** 10/14/09: Set to null since it's now referring to a deleted element.
			*/

			text_node_right	= text_node_left;
		}

		if (text_node_right.parentNode !== orig_text_parent) {
			var		old_parent_block		= jr_NodeGetParentBlock( orig_text_parent);
			var		new_parent_block		= jr_NodeGetParentBlock( text_node_right);

			if (old_parent_block !== new_parent_block) {
				/*
				** 11/25/09: On different lines, no need to shift a char
				*/
				num_shift_chars	= 0;
			}
		}

		if (	text_node_right.previousSibling
			&&  text_node_right.previousSibling.nodeType == jr_Node.TEXT_NODE
		) {
			text_node_left	= text_node_right.previousSibling;

			shift_amount	= text_node_right.length - num_shift_chars;
			shift_text		= text_node_right.data;
							/*
							** 7/4/09: if the length > 1, the shift_text will be reset below
							*/
		}
		else {
			/*
			** 3/15/08: create 1-length right node
			*/
			if (num_shift_chars == 0) {
				text_node_left	= text_node_right;
				text_node_right = document.createTextNode ("");
				jr_NodeAppendAfter( text_node_left, text_node_right);
			}
			else if (text_node_right.length < 2) {
				/*
				** 9/25/07: IE doesn't support 0-length nodes after splits
				*/
				text_node_left = document.createTextNode ("");
				text_node_right.parentNode.insertBefore (text_node_left, text_node_right);
			}
			else {
				text_node_left  = text_node_right;
				text_node_right = text_node_left.splitText (text_node_left.length - 1);
			}
			shift_text		= text_node_right.data;
			shift_amount	= 0;
		}
		object.jr_editor_text_node_left		= text_node_left;
		object.jr_editor_text_node_right	= text_node_right;
	}
	else if (direction > 0  &&  object.jr_editor_text_node_right.length == 0) {

		text_node_left	= object.jr_editor_text_node_right;
		
		/*
		** 9/27/07: Find non-zero node to right, remove the 0-length nodes to clean up the tree.
		*/
		while (text_node_left.length == 0) {
			text_node_right	= jr_NodeGetNextTextNode (text_node_left, object.jr_editor_edit_el);

			if (! text_node_right) {
				/*
				** 9/28/07: no non-zero elements to the right => at the end
				*/
				if (!object.jr_editor_text_node_right) {
					text_node_right = document.createTextNode ("");

					object.jr_editor_text_node_left.parentNode.appendChild( text_node_right);
				}
				return null;
			}
			text_node_left.parentNode.removeChild (text_node_left);
			object.jr_editor_text_node_right	= null;
			/*
			** 10/14/09: Set to null since it's now referring to a deleted element.
			*/

			text_node_left	= text_node_right;
		}

		if (text_node_left.parentNode !== orig_text_parent) {
			var		old_parent_block		= jr_NodeGetParentBlock( orig_text_parent);
			var		new_parent_block		= jr_NodeGetParentBlock( text_node_left);

			if (old_parent_block !== new_parent_block) {
				/*
				** 11/25/09: On different lines, no need to shift a char
				*/
				num_shift_chars	= 0;
			}
		}

		if (	text_node_left.nextSibling
			&&  text_node_left.nextSibling.nodeType == jr_Node.TEXT_NODE
		) {
			text_node_right	= text_node_left.nextSibling;

			shift_amount	= -(text_node_left.length - num_shift_chars);
			shift_text		= text_node_left.data;
							/*
							** 7/4/09: if the length > 1, the shift_text will be reset below
							*/
		}
		else {
			/*
			** 9/25/07: Create num_shift_chars length left node
			*/
			if (num_shift_chars == 0) {
				text_node_right	= text_node_left;
				text_node_left = document.createTextNode ("");
				jr_NodeInsertBefore( text_node_right, text_node_left);
			}
			else if (text_node_left.length  <  2) {
				/*
				** 9/25/07: IE doesn't support 0-length nodes after splits
				*/
				text_node_right = document.createTextNode ("");
				jr_NodeAppendAfter( text_node_left, text_node_right);
			}
			else {
				text_node_right	= text_node_left.splitText( 1);
			}
			shift_text		= text_node_left.data;
			shift_amount	= 0;
		}
		object.jr_editor_text_node_left		= text_node_left;
		object.jr_editor_text_node_right	= text_node_right;
	}
	else {
		shift_amount	= direction < 0  ? -1 : 1;
	}

	if (shift_amount != 0) {
		shift_text	= jr_TextShift (
						object.jr_editor_text_node_left, object.jr_editor_text_node_right, shift_amount
					);
	}

	var			caret_loc_el		= object.jr_editor_caret_loc_el;
	var			parent_el;

	if (caret_loc_el.parentNode) {
		caret_loc_el.parentNode.removeChild (caret_loc_el);
	}

	parent_el	= object.jr_editor_text_node_right.parentNode;
	parent_el.insertBefore (caret_loc_el, object.jr_editor_text_node_right);

	return shift_text;
}

function jr_EditorMoveCaretLeftRight (object, direction)
{
	var		parent_el;
	var		caret_loc_el		= object.jr_editor_caret_loc_el;
	var		caret_origin;
	var		diag_string;
	var		shift_text;
	var		num_skipped;
	var		has_ie_line_end_fix	= 0;
	var		has_tmp_null_locator_for_ie;

	var		left_x;
	var		prev_x;
	var		prev_y;
	var		caret_x;
	var		caret_y;
	var		caret_offset_parent;


	/*
	** 6-11-2010: no need to adjust by scrollTop since we're not comparing
	** to an abolute x,y.
	*/

	if (!object.jr_editor_text_node_left  ||  !object.jr_editor_text_node_right) {
		return -1;
	}

	if (object.jr_editor_use_tmp_null_locator_for_ie) {
		jr_NodeRemoveText (caret_loc_el);
		caret_loc_el.style.width		= "0";
		has_tmp_null_locator_for_ie		= 1;
	}
	else {
		has_tmp_null_locator_for_ie		= 0;
	}

	parent_el	= object.jr_editor_text_node_right.parentNode;

	parent_el.insertBefore (caret_loc_el, object.jr_editor_text_node_right);

	caret_origin	= jr_ElementGetAbsOrigin( caret_loc_el);

	if (parent_el === caret_loc_el.offsetParent) {
		left_x		= caret_origin.x;
	}
	else {
		left_x		= caret_origin.x + parent_el.offsetLeft;
	}

	prev_x		= object.jr_editor_caret_x;
	prev_y		= object.jr_editor_caret_y;

	if (jr_DoDiag.jr_EditorMoveCaretLeftRight) {
		diag_string	= "Prev: [" + prev_x + ", " + prev_y + "]";

		jr_DiagPrintLine( diag_string);

		if (has_tmp_null_locator_for_ie) {
			jr_DiagPrintLine( "Using null locator");
		}
	}

	num_skipped			= 0;
	caret_x				= prev_x;
	caret_y				= prev_y;
	caret_offset_parent	= caret_loc_el.offsetParent;

	while (caret_x == prev_x  &&  caret_y == prev_y) {

		shift_text	= jr_EditorShiftCaretByOne (object, direction);

		if (shift_text === null) {
			break;
		}

		if (has_tmp_null_locator_for_ie  &&  shift_text.match (/\s/)) {
			object.jr_editor_use_tmp_null_locator_for_ie	= 0;
			has_tmp_null_locator_for_ie						= 0;

			caret_loc_el.style.width	= "";
			jr_NodeAppendText (caret_loc_el, "i");

			if (jr_DoDiag.jr_EditorMoveCaretLeftRight) {
				jr_DiagPrintLine( "Removed IE null locator");
			}
		}

		if (caret_offset_parent !== caret_loc_el.offsetParent) {
			/*
			** 11/25/09: jumping in and out of divs causes the
			** origin to change.
			*/
			caret_origin	= jr_ElementGetAbsOrigin( caret_loc_el);
		}

		caret_x		= caret_origin.x + caret_loc_el.offsetLeft;
		caret_y		= caret_origin.y + caret_loc_el.offsetTop;

		if (jr_DoDiag.jr_EditorMoveCaretLeftRight) {
			diag_string	= "Curr: [" + caret_x + ", " + caret_y + "]";
			diag_string	+= " shift '" + shift_text + "'";
			diag_string	+= ", left len: " + object.jr_editor_text_node_left.length;
			diag_string	+= ", right len: " + object.jr_editor_text_node_right.length;

			jr_DiagPrintLine( diag_string);
		}

		if (jr_IsKonqueror) {
			if (	direction > 0  &&  caret_x < prev_x  &&  caret_y <= prev_y
				||	direction < 0  &&  caret_x == left_x  &&  caret_y <= prev_y 
					&& object.jr_editor_text_node_left.data.match (/\S/)
			) {
				/*
				** 9/29/07: We're going right and we've apparently gone back to the beginning
				** of the current line or we're going left and we've gone the beginning
				** of the current or previous line although there are non-space chars on the line.
				** Actually not, Konqueror's positioning has an error on multiple spaces or
				** spaces at the end of line, where the position goes back to the origin
				** of the div. Instead, pretend the cursor hasn't moved.
				** 
				** Note that we shouldn't skip over lead whitespace in an element since
				** Konqueror has a different bug where it'll actually show the space if
				** there's an empty text object in front of it, which we create by moving
				** left.
				*/
				caret_x	= prev_x;
				caret_y	= prev_y;

				if (jr_DoDiag.jr_EditorMoveCaretLeftRight) {
					diag_string	= "Konq fix";

					jr_DiagPrintLine( diag_string);
				}
			}
		}

		if (jr_IsIE) {

			if (direction > 0) {

				if (caret_x < prev_x  &&  caret_y <= prev_y) {
					/*
					** 9/29/07: Going right and we've gone to the beginning of the current line.
					** This is a positioning error with spaces at the end of line.
					** Pretend the cursor hasn't moved instead so we skip over the whitespace
					*/

					if (shift_text.match(/\S/)) {
						throw new Error(
							"IE error, moving right over non-whitespace gives position to left"
						);
					}

					caret_x	= prev_x;
					caret_y	= prev_y;

					if (jr_DoDiag.jr_EditorMoveCaretLeftRight) {
						diag_string	= "IE fix";

						jr_DiagPrintLine( diag_string);
					}
				}
				else if (caret_y > prev_y) {
					/*
					** 9/29/07: going to next line.  make sure it isn't because adding a character
					** to the current word makes it too long for the current.
					*/
					var			word_length;
					var			q;
					var			alt_x;
					var			alt_y;

					word_length	= jr_EditorGetWordEndOffset (object);

					jr_NodeRemoveText (caret_loc_el);
					caret_loc_el.style.width			= "0";

					for (q=0; q < word_length; q++) {
						jr_EditorShiftCaretByOne (object, 1);
					}

					alt_x		= caret_origin.x + caret_loc_el.offsetLeft;
					alt_y		= caret_origin.y + caret_loc_el.offsetTop;

					for (q=0; q < word_length; q++) {
						jr_EditorShiftCaretByOne (object, -1);
					}

					if (alt_y == prev_y) {
						/*
						** 9/29/07: without the extra char this word stays on the previous
						** line, use a null-width locator for this word.
						*/

						has_ie_line_end_fix	= 1;

						has_tmp_null_locator_for_ie						= 1;
						object.jr_editor_use_tmp_null_locator_for_ie	= 1;

						if (jr_DoDiag.jr_EditorMoveCaretLeftRight) {
							var		diag_string;

							diag_string = "using null locator, word length: " + word_length;

							jr_DiagPrintLine( diag_string);
						}
					}
					else {
						caret_loc_el.style.width			= "";
						jr_NodeAppendText (caret_loc_el, "i");
					}
				}
				else if (object.jr_editor_text_node_right.length == 0  &&  shift_text.match(/\s/)) {
					/*
					** 6/23/09: going right, last char is a space, but we didn't jump down a line.
					** See if a null locator does jump down. If it does, we're at th
					*/
					var			alt_x;
					var			alt_y;

					jr_NodeRemoveText (caret_loc_el);
					caret_loc_el.style.width			= "0";

					alt_x		= caret_origin.x + caret_loc_el.offsetLeft;
					alt_y		= caret_origin.y + caret_loc_el.offsetTop;

					caret_loc_el.style.width			= "";
					jr_NodeAppendText (caret_loc_el, "i");
				}
			}
			if (direction < 0) {
				if (caret_x < prev_x  &&  caret_y < prev_y) {
					/*
					** 9/29/2007: went back to the beginning of the previous line?
					** IE positioning error wrt spaces at the ends of lines, cause
					** position to read as the beginning of that line.  Should be
					** the beginning of the current line.
					*/
					caret_y	= prev_y;
				}
				if (	!has_tmp_null_locator_for_ie
					&&  caret_x >= prev_x  &&  caret_y <= prev_y
					&&  object.jr_editor_text_node_left.length != 0) {
					/*
					** 9/29/07: Going left and jumped to the end of the previous (or current) line.
					**
					** Check to see if the width of the locator altered the fill
					** of the end of the line, moving the last word down to a new line.
					*/
					var			alt_x;
					var			alt_y;

					jr_NodeRemoveText (caret_loc_el);
					caret_loc_el.style.width			= "0";

					alt_x		= caret_origin.x + caret_loc_el.offsetLeft;
					alt_y		= caret_origin.y + caret_loc_el.offsetTop;

					if (alt_y < prev_y) {
						/*
						** 9/29/07: without the extra char this word stays on the previous
						** line, use a null-width locator for this word.
						*/

						has_ie_line_end_fix	= 1;
						has_tmp_null_locator_for_ie						= 1;
						object.jr_editor_use_tmp_null_locator_for_ie	= 1;

						caret_x	= alt_x;
						caret_y	= alt_y;

						if (jr_DoDiag.jr_EditorMoveCaretLeftRight) {
							var		diag_string;

							diag_string = "using null locator";

							jr_DiagPrintLine( diag_string);
						}
					}
					else {
						caret_loc_el.style.width			= "";
						jr_NodeAppendText (caret_loc_el, "i");
					}
				}
			}
		}
		num_skipped ++;
	}

	var		shifted_non_whitespace	= false;

	if (shift_text != null  &&  shift_text.match( /\S/)) {
		shifted_non_whitespace	= true;
	}

	if (num_skipped > 1  &&  shifted_non_whitespace &&	(caret_y > prev_y  ||  jr_IsIE)) {
		/*
		** 9/27/07: Skipped over whitespace followed by non-whitespace,
		** and did a line change or we're in IE.
		** On line change, the trailing space appears as zero-width. Backup one.
		*/
		prev_x		= caret_x;
		prev_y		= caret_y;
		direction	= -direction;

		shift_text	= jr_TextShift (
						object.jr_editor_text_node_left, object.jr_editor_text_node_right, direction
					);

		shifted_non_whitespace	= false;
		/*
		** 1-10-2011: most likely shifted back over the non-whitespace
		*/

		caret_x		= caret_origin.x + caret_loc_el.offsetLeft;
		caret_y		= caret_origin.y + caret_loc_el.offsetTop;

		if (jr_DoDiag.jr_EditorMoveCaretLeftRight) {
			jr_DiagPrintLine( "shift " + direction);
		}
		if (jr_IsIE) {
			if (direction < 0  &&  caret_x < prev_x  &&  caret_y < prev_y) {
				/*
				** 9/29/2007: went back to the beginning of the previous line?
				** IE positioning error wrt spaces at the ends of lines, cause
				** position to read as the beginning of that line.  Should be
				** the beginning of the current line.
				*/
				caret_y	= prev_y;
			}
		}
	}
	if (direction < 0  &&  !has_ie_line_end_fix) {
		if (	left_x  <  prev_x  &&  prev_x < caret_x  &&   caret_y < prev_y
			&&	shifted_non_whitespace) {
			/*
			** 9/27/07: Going left, jumped up and to the right, but we hadn't
			** hit the left edge yet and the current char isn't white space.
			** Should be at the beginning of the line but browsers consider space
			** at the end of the previous.
			*/
			caret_x	= left_x;
			caret_y	= prev_y;

			if (jr_DoDiag.jr_EditorMoveCaretLeftRight) {
				jr_DiagPrintLine( "reset left edge");
			}
		}
	}

	if (caret_x == object.jr_editor_caret_x  &&  caret_y == object.jr_editor_caret_y) {
		/*
		** 9/26/09: No movement possible, at the beginning or end of the text.
		*/
		return -1;
	}

	jr_EditorSetCaretPositionInEditDiv( object, caret_x, caret_y, 0);

	caret_loc_el.parentNode.removeChild (caret_loc_el);

	if (has_tmp_null_locator_for_ie) {
		caret_loc_el.style.width = "";
		jr_NodeAppendText (caret_loc_el, "i");
	}

	delete object.jr_editor_updown_x;

	if (jr_DoDiag.jr_EditorMoveCaretLeftRight) {
		
		diag_string	= "Caret [" + caret_x + ", " + caret_y + "]";
		diag_string	+= ", left len: " + object.jr_editor_text_node_left.length;
		diag_string	+= ", left edge px: " + parent_el.offsetLeft;

		jr_DiagPrintLine( diag_string);
	}
	return 0;
}

function jr_EditorMoveCaretUpDown (object, num_lines, adjust_scroll)
{
	var		parent_el;
	var		edit_origin;
	var		min_y;
	var		max_y;
	var		char_height;
	var		half_height;
	var		caret_x;
	var		caret_y;
	var		new_y;

	var		diag_string;

	/*
	** 6-11-2010: no need to adjust by scrollTop since we're not comparing
	** to an abolute x,y.
	*/

	if (!object.jr_editor_text_node_left  ||  !object.jr_editor_text_node_right) {
		return;
	}

	parent_el	= object.jr_editor_text_node_right.parentNode;

	parent_el.insertBefore (object.jr_editor_char_size_el, object.jr_editor_text_node_right);

	char_height	= object.jr_editor_char_size_el.offsetHeight;
	half_height	= Math.floor (char_height/2);

	parent_el.removeChild (object.jr_editor_char_size_el);


	edit_origin	= jr_ElementGetAbsOrigin( object.jr_editor_edit_el);

	min_y		= edit_origin.y + object.jr_editor_edit_el.offsetTop;
	max_y		= min_y + object.jr_editor_edit_el.scrollHeight;

	if (object.jr_editor_updown_x == undefined) {
		object.jr_editor_updown_x	= object.jr_editor_caret_x;
	}
	caret_x	= object.jr_editor_updown_x;
	caret_y	= object.jr_editor_caret_y;

	if (num_lines < 0) {
		new_y	= caret_y;
	}
	else {
		new_y	= caret_y + char_height;
	}

	while (object.jr_editor_caret_y == caret_y) {

		if (num_lines < 0) {
			new_y	-= half_height;
		}
		else {
			new_y	+= half_height;
		}
		if (new_y < min_y  ||  new_y > max_y) {
			break;
		}

		if (jr_DoDiag.jr_EditorMoveCaretUpDown) {
			diag_string	= "Up/Down [" + caret_x + ", " + new_y + "]";

			jr_DiagPrintLine( diag_string);
		}
		jr_EditorPlaceCaret (object, object.jr_editor_edit_el, caret_x, new_y - object.jr_editor_edit_el.scrollTop);
		/*
		** 12-19-2010: need to provide coordinates relative to 
		*/
	}
	if (adjust_scroll) {
		var		scroll_diff	= 0;

		if (num_lines > 0) {
			/*
			** 12-19-2010: make sure the bottom of the cursor is still visible
			*/
			scroll_diff	= object.jr_editor_caret_el.offsetTop + object.jr_editor_caret_el.offsetHeight + half_height 
						- (object.jr_editor_edit_el.offsetTop + object.jr_editor_edit_el.offsetHeight);

			if (scroll_diff < 0) {
				scroll_diff = 0;
			}
		}
		else {
			/*
			** 12-19-2010: make sure the top of the cursor is still visible
			*/
			scroll_diff	= object.jr_editor_caret_el.offsetTop - half_height
						- object.jr_editor_edit_el.offsetTop;

			if (scroll_diff > 0) {
				scroll_diff = 0;
			}
		}

		if (scroll_diff != 0) {
			
			object.jr_editor_edit_el.scrollTop	= object.jr_editor_edit_el.scrollTop + scroll_diff;
		}
	}
}


function jr_EditorGetWordEndOffset (object)
{
	var			text_node_right			= object.jr_editor_text_node_right;
	var			right_length			= text_node_right.length;
	var			end_word_index			= 0;
	var			next_char;
	var			q;

	while (text_node_right) {
		for (q=0; q < right_length; q++, end_word_index++) {
			next_char = text_node_right.substringData (q, 1);

			if (next_char.match (/\s/)) {
				return end_word_index;
			}
		}

		text_node_right	= jr_NodeGetNextTextNode (text_node_right, object.jr_editor_edit_el);
	}
	return end_word_index;
}

function jr_EditorUpdateCaret( object)
{
	var		caret_loc_el		= object.jr_editor_caret_loc_el;
	var		parent_el			= object.jr_editor_text_node_right.parentNode;
	var		left_length			= object.jr_editor_text_node_left.length;
	var		caret_origin;
	var		char_height;
	var		last_left_char;
	var		last_is_space		= false;
	var		caret_x;
	var		caret_y;

	if (left_length > 0) {
		/*
		** 6/29/09: maybe this space adjustment only applies if the right node is null?
		*/

		last_left_char	= object.jr_editor_text_node_left.data.charAt( left_length - 1);
		if (last_left_char == " ") {
			last_is_space	= true;
		}
	}
	else {
		last_is_space	= true;
	}

	if (last_is_space) {
		object.jr_editor_text_node_left.appendData (".");
	}

	jr_NodeRemoveFromDom( caret_loc_el);

	jr_NodeInsertBefore( object.jr_editor_text_node_right, object.jr_editor_char_size_el);

	char_height	= object.jr_editor_char_size_el.offsetHeight;

	jr_NodeReplace( object.jr_editor_char_size_el, caret_loc_el);

	caret_origin	= jr_ElementGetAbsOrigin( caret_loc_el);

	caret_x		= caret_origin.x + caret_loc_el.offsetLeft;
	caret_y		= caret_origin.y + caret_loc_el.offsetTop;

	jr_NodeRemoveFromDom( caret_loc_el);

	if (last_is_space) {
		object.jr_editor_text_node_left.deleteData (object.jr_editor_text_node_left.length - 1, 1);
		caret_x	-= jr_EDITOR_PERIOD_WIDTH;
	}

	jr_EditorSetCaretPositionInEditDiv( object, caret_x, caret_y, char_height);
}

function jr_EditorSelectionInit (object)
{
	var		edit_origin;

	/*
	** 6/24/09: The surrounding edit element is unlikely to change during a mouse movement
	** Avoid recalculating by storing the value. Only use during drag.
	*/
	edit_origin	= jr_ElementGetAbsOrigin( object.jr_editor_edit_el);

	object.jr_editor_origin_x			= edit_origin.x;
	object.jr_editor_origin_y			= edit_origin.y;


	object.jr_editor_start_parent_el	= object.jr_editor_text_node_right.parentNode;
	object.jr_editor_start_text_index	= jr_NodeGetTextIndexInParent( object.jr_editor_text_node_right);

	object.jr_editor_move_start_x		= object.jr_editor_caret_x;
	object.jr_editor_move_start_y		= object.jr_editor_caret_y;

	object.jr_editor_update_x_left		= object.jr_editor_caret_x;
	object.jr_editor_update_x_right		= object.jr_editor_caret_x;

	object.jr_editor_update_y_top		= object.jr_editor_caret_y;
	object.jr_editor_update_y_bottom	= object.jr_editor_caret_y + object.jr_editor_curr_char_height;

	object.jr_editor_edge_left_x		= object.jr_editor_origin_x
										+ object.jr_editor_edit_el.offsetLeft;

	object.jr_editor_edge_right_x		= object.jr_editor_edge_left_x
										+ object.jr_editor_edit_el.offsetWidth;

	object.jr_editor_edge_top_y			= object.jr_editor_origin_y
										+ object.jr_editor_edit_el.offsetTop;

	object.jr_editor_edge_bottom_y		= object.jr_editor_edge_top_y
										+ object.jr_editor_edit_el.offsetHeight;

	object.jr_editor_has_selection_start= true;
	object.jr_editor_has_selection		= false;

	object.jr_editor_going_backwards	= false;

	jr_EditorHideSelectionBox( object);
}


function jr_EditorHighlightSelection (object)
{
	var		char_height			= object.jr_editor_curr_char_height;
	var		scrollTop			= object.jr_editor_edit_el.scrollTop;

	var		box_left;
	var		box_width;
	var		box_top;
	var		box_height;
	var		going_left;
	var		going_up;


	/*
	** 3/17/08: Calculate the dimensions of a box bounded by the start point and the current point.
	*/

	/*
	** 11/25/09 ToDo: if the selection ends in a bold character, the height is off by a pixel
	** or two, causing the below to think we're going up/down when we're not.
	*/

	if (object.jr_editor_move_start_x <= object.jr_editor_caret_x) {
		box_left	= object.jr_editor_move_start_x;
		box_width	= object.jr_editor_caret_x - object.jr_editor_move_start_x;
		going_left	= false;
	}
	else {
		box_left	= object.jr_editor_caret_x;
		box_width	= object.jr_editor_move_start_x - object.jr_editor_caret_x;
		going_left	= true;
	}
	
	if (object.jr_editor_move_start_y <= object.jr_editor_caret_y) {
		box_top		= object.jr_editor_move_start_y;
		box_height	= object.jr_editor_caret_y - object.jr_editor_move_start_y;
		going_up	= false;
	}
	else {
		box_top		= object.jr_editor_caret_y;
		box_height	= object.jr_editor_move_start_y - object.jr_editor_caret_y;
		going_up	= true;
	}

	var		box_left_el		= object.jr_editor_move_box_left_el;
	var		box_right_el	= object.jr_editor_move_box_right_el;
	var		box_middle_el	= object.jr_editor_move_box_middle_el;

	if (box_height > 0) {
		
		var		tmp_left;
		var 	tmp_width;
		var		need_middle_box;

		tmp_left			= object.jr_editor_edge_left_x;
		tmp_width			= box_left - tmp_left;

		if (going_left && !going_up  ||  !going_left && going_up) {
			need_middle_box	= true;
		}
		else {
			tmp_width		+= box_width;
			need_middle_box	= false;
		}

		jr_ElementSetStyle( box_left_el,		"left",		tmp_left - object.jr_editor_origin_x);
		jr_ElementSetStyle( box_left_el,		"width",	tmp_width);
		jr_ElementSetStyle( box_left_el,		"top",		box_top + char_height
															- object.jr_editor_origin_y
															- scrollTop);
		jr_ElementSetStyle( box_left_el,		"height",	box_height);

		jr_ElementSetStyle( box_left_el,		"display",	"block");
		jr_ElementSetStyle( box_left_el,		"zIndex",	object.jr_editor_edit_el.jr_editor_zindex-1);

		if (going_left && !going_up) {
			tmp_left	= object.jr_editor_move_start_x;
		}
		else if (!going_left && going_up) {
			tmp_left	= object.jr_editor_caret_x;
		}
		else {
			tmp_left	= box_left;
		}
		tmp_width	= object.jr_editor_edge_right_x - tmp_left;

		jr_ElementSetStyle( box_right_el,		"left",		tmp_left - object.jr_editor_origin_x);
		jr_ElementSetStyle( box_right_el,		"width",	tmp_width);
		jr_ElementSetStyle( box_right_el,		"top",		box_top - object.jr_editor_origin_y
															- scrollTop);
		jr_ElementSetStyle( box_right_el,		"height",	box_height);

		jr_ElementSetStyle( box_right_el,		"display",	"block");
		jr_ElementSetStyle( box_right_el,		"zIndex",	object.jr_editor_edit_el.jr_editor_zindex-1);

		if (need_middle_box) {
			jr_ElementSetStyle( box_middle_el,	"left",		box_left - object.jr_editor_origin_x);
			jr_ElementSetStyle( box_middle_el,	"width",	box_width);
			jr_ElementSetStyle( box_middle_el,	"top",		box_top + char_height
															- object.jr_editor_origin_y
															- scrollTop);
			jr_ElementSetStyle( box_middle_el,	"height",	box_height - char_height);

			jr_ElementSetStyle( box_middle_el,	"display",	"block");
			jr_ElementSetStyle( box_middle_el,	"zIndex",	object.jr_editor_edit_el.jr_editor_zindex-1);
		}
		else {
			jr_ElementSetStyle( box_middle_el,	"display",	"none");
		}
	}
	else if (box_width > 0) {
		/*
		** 3/17/08: selection is on one line
		*/

		box_height += char_height;
		
		jr_ElementSetStyle( box_middle_el,		"left",		box_left - object.jr_editor_origin_x);
		jr_ElementSetStyle( box_middle_el,		"width",	box_width);
		jr_ElementSetStyle( box_middle_el,		"top",		box_top - object.jr_editor_origin_y
															- scrollTop);
		jr_ElementSetStyle( box_middle_el,		"height",	box_height);

		jr_ElementSetStyle( box_middle_el,		"zIndex",	object.jr_editor_edit_el.jr_editor_zindex-1);

		jr_ElementSetStyle( box_left_el,		"display",	"none");
		jr_ElementSetStyle( box_middle_el,		"display",	"block");
		jr_ElementSetStyle( box_right_el,		"display",	"none");
	}
	if (box_height > 0  ||  box_width > 0) {
		object.jr_editor_has_selection_start= false;
		object.jr_editor_has_selection		= true;

		jr_EditorSetPreScrollInfo( object, box_left_el);
		jr_EditorSetPreScrollInfo( object, box_right_el);
		jr_EditorSetPreScrollInfo( object, box_middle_el);
	}
}

function jr_EditorUpdateDragSelection (object, new_x, new_y)
{
	var		needs_new_box		= false;
	var		do_recalc_left		= false;
	var		do_recalc_right		= false;
	var		old_y				= object.jr_editor_caret_y;
	var		scrollTop			= object.jr_editor_edit_el.scrollTop;

	var		save_diag_left		= jr_DoDiag.jr_EditorMoveCaretLeftRight;
	var		save_diag_up		= jr_DoDiag.jr_EditorMoveCaretUpDown;

	var		tmp_str;
	var		status;


	jr_DoDiag.jr_EditorMoveCaretLeftRight	= 0;
	jr_DoDiag.jr_EditorMoveCaretUpDown		= 0;

	if (jr_DoDiag.jr_EditorUpdateSelection) {
		var		diag_string;

		jr_DiagPrintLine( "");

		diag_string	= "UpdateSel: [" + new_x + ", " + new_y + "], old_y: " + old_y;
		diag_string += ", Box: ";
		diag_string += "["  + object.jr_editor_update_x_left + " - " + object.jr_editor_update_x_right;
		diag_string += ", " + object.jr_editor_update_y_top + " - " + object.jr_editor_update_y_bottom;
		diag_string += "]";

		jr_DiagPrintLine( diag_string);
	}
	if (object.jr_editor_update_x_left == object.jr_editor_update_x_right) {
		/*
		** 9/28/09: Haven't moved the mouse enough to calculate the first "update box",
		** i.e. the boundary of when the selection needs updating.
		*/
		if (	object.jr_editor_click_x <= new_x  &&  new_x <= object.jr_editor_update_x_left
			||	object.jr_editor_update_x_right <= new_x  &&  new_x <= object.jr_editor_click_x) {

			/*
			** 9/28/09: the initial click is in the margin at beginning/end of a line 
			** and the mouse is moving towards the text. No selection to highlight yet.
			*/
		}
		else {
			/*
			** 9/27/09: Need to initialize the update box.
			*/
			needs_new_box		= true;
			do_recalc_left		= true;
			do_recalc_right		= true;
		}
	}
	else if (new_x < object.jr_editor_update_x_left) {
		status	= jr_EditorMoveCaretLeftRight (object, -1);
		if (status == 0) {
			needs_new_box	= true;
		}
	}
	else if (new_x > object.jr_editor_update_x_right) {
		status = jr_EditorMoveCaretLeftRight (object, 1);
		if (status == 0) {
			needs_new_box	= true;
		}
	}

	if (	new_y + scrollTop < object.jr_editor_update_y_top
		||  new_y + scrollTop > object.jr_editor_update_y_bottom
	) {
		jr_EditorPlaceCaret (object, object.jr_editor_edit_el, new_x, new_y);

		if (object.jr_editor_caret_y != old_y) {
			needs_new_box	= true;
		}
	}


	if (needs_new_box) {
		var		curr_caret_x		= object.jr_editor_caret_x;
		var		curr_caret_y		= object.jr_editor_caret_y;

		var		x_delta;


		/*
		** 3/18/08: Note: in most cases, line height == character height.
		** In the case of extra blank lines in between,
		*/

		object.jr_editor_update_y_top		= object.jr_editor_caret_y;
		object.jr_editor_update_y_bottom	= object.jr_editor_caret_y
											+ object.jr_editor_curr_char_height;

		if (object.jr_editor_move_start_y  !=  object.jr_editor_caret_y) {
			do_recalc_left	= true;
			do_recalc_right	= true;
		}
		else if (curr_caret_x < object.jr_editor_update_x_left) {
			do_recalc_left	= true;
		}
		else if (curr_caret_x > object.jr_editor_update_x_right) {
			do_recalc_right	= true;
		}


		if (do_recalc_left) {
			status	= jr_EditorMoveCaretLeftRight (object, -1);

			if (status == 0) {
				object.jr_editor_update_x_right	= object.jr_editor_update_x_left;

				if (object.jr_editor_caret_y < curr_caret_y) {
					/*
					** 3/16/08: going left goes to previous line => we're at the left edge
					*/
					object.jr_editor_update_x_left	= 0;
				}
				else if (object.jr_editor_caret_x < curr_caret_x) {
					x_delta	= Math.floor((curr_caret_x - object.jr_editor_caret_x)/2);

					object.jr_editor_update_x_left	= curr_caret_x - x_delta;
				}
				jr_EditorMoveCaretLeftRight (object, 1);
			}
			else {
				/*
				** 9/26/09: Can't move left, at the beginning of the text.
				*/
				object.jr_editor_update_x_left	= 0;
			}
		}


		if (do_recalc_right) {

			if (!do_recalc_left) {
				object.jr_editor_update_x_left	= object.jr_editor_update_x_right;
			}

			status	= jr_EditorMoveCaretLeftRight (object, 1);

			if (status == 0) {
				if (object.jr_editor_caret_y > curr_caret_y) {
					/*
					** 3/16/08: going right goes to next line => we're at the right edge
					** 6/23/09: ToDo: not necessarily, if the line is short (i.e. end of a paragraph),
					** going right could also drop us down.
					*/
					object.jr_editor_update_x_right	= Number.MAX_VALUE;
				}
				else if (object.jr_editor_caret_x > curr_caret_x) {
					x_delta	= Math.floor((object.jr_editor_caret_x - curr_caret_x)/2);
					object.jr_editor_update_x_right	= curr_caret_x + x_delta;
				}
				jr_EditorMoveCaretLeftRight (object, -1);
			}
			else {
				/*
				** 9/26/09: Can't move right, at the end of the text.
				*/
				object.jr_editor_update_x_right	= Number.MAX_VALUE;
			}
		}


		if (jr_DoDiag.jr_EditorUpdateSelection) {
			var		diag_string;
			
			diag_string	= "Initial caret: [" + curr_caret_x + ", " + curr_caret_y + "]";
			diag_string	+= ", New caret: [" + object.jr_editor_caret_x + ", " + object.jr_editor_caret_y + "]";
			jr_DiagPrintLine( diag_string);
			diag_string	= "New update box: [" + object.jr_editor_update_x_left;
			diag_string += " - " + object.jr_editor_update_x_right;
			diag_string += ", "  + object.jr_editor_update_y_top;
			diag_string	+= " - " + object.jr_editor_update_y_bottom + "]";

			jr_DiagPrintLine( diag_string);

			// diag_string += ", editor_caret_x: " + object.jr_editor_caret_x;
			// diag_string += ", curr_caret_x: " + curr_caret_x;
			// diag_string += ", editor_caret_y: " + object.jr_editor_caret_y;
			// diag_string += ", curr_caret_y: " + curr_caret_y;
			// diag_string += ", char. height: " + object.jr_editor_curr_char_height;

			// jr_DiagPrintLine( "");
			MoveDiagCount = 0;
		}

		jr_EditorHighlightSelection (object);

		object.jr_editor_click_x		= new_x;
		object.jr_editor_click_y		= new_y;
	}

	jr_DoDiag.jr_EditorMoveCaretLeftRight	= save_diag_left;
	jr_DoDiag.jr_EditorMoveCaretUpDown		= save_diag_up;
}

function jr_EditorHideSelectionBox( object)
{
	object.jr_editor_move_box_left_el.style.display		= "none";
	object.jr_editor_move_box_right_el.style.display	= "none";
	object.jr_editor_move_box_middle_el.style.display	= "none";

	object.jr_editor_has_selection	= false;
}

function jr_EditorScrollSelectionBox( object, scroll_delta, view_top, view_height)
{
	if (jr_ElementIsInDom( object.jr_editor_caret_el)) {
		jr_EditorElementScrollAndClip(
			object, object.jr_editor_caret_el,				scroll_delta, view_top, view_height
		);
	}
	if (object.jr_editor_has_selection) {
		jr_EditorElementScrollAndClip(
			object, object.jr_editor_move_box_left_el,		scroll_delta, view_top, view_height
		);
		jr_EditorElementScrollAndClip(
			object, object.jr_editor_move_box_right_el,		scroll_delta, view_top, view_height
		);
		jr_EditorElementScrollAndClip(
			object, object.jr_editor_move_box_middle_el,	scroll_delta, view_top, view_height
		);
	}
}

function jr_EditorElementScrollAndClip( object, scroll_el, scroll_delta, view_top, view_height)
{
	var		view_bottom;
	var		curr_top;
	var		curr_height;
	var		new_height;

	if (! scroll_el.offsetParent) {
		/*
		** 7-17-2010: selection item not currently visible, i.e. a left, right selection box;
		*/
		return;
	}

	curr_top		= scroll_el.offsetTop;
	curr_height		= scroll_el.offsetHeight;

	view_bottom		= view_top + view_height;
	curr_bottom		= curr_top + curr_height;

	new_top			= curr_top - scroll_delta;
	new_bottom		= curr_bottom - scroll_delta;

	if (new_bottom  >=  view_bottom) {
		/*
		** 7-17-2010: bottom edge is hanging over, clip it
		** The top edge should move with the scroller.
		*/

		jr_ElementSetStyle( scroll_el,			"top",		new_top);

		if (curr_height > 0) {
			new_height	= curr_height - (new_bottom - view_bottom);

			if (new_height < 0) {
				new_height = 0;
			}
			jr_ElementSetStyle( scroll_el,		"height",	new_height);
		}
		else {
			new_height	= "Z";
		}
	}
	else if (new_top <= view_top) {
		/*
		** 7-17-2010: top edge is hanging over, clip it
		** The bottom edge should move with the scroller.
		*/
		if (curr_height > 0) {
			new_height	= curr_height - (view_top - new_top);

			if (new_height < 0) {
				new_height = 0;
			}
			jr_ElementSetStyle( scroll_el,		"top",		new_bottom - new_height);
			jr_ElementSetStyle( scroll_el,		"height",	new_height);

			scroll_el.jr_editor_scroll_moved_top	= true;
		}
		else {
			jr_ElementSetStyle( scroll_el,		"top",		new_bottom);
			new_height	= "Z";
		}
	}
	else if (curr_height < scroll_el.jr_editor_pre_scroll_height) {
		/*
		** 7-17-2010: was clipped, see if we need to add some back
		*/
		if (scroll_el.jr_editor_scroll_moved_top) {
			/*
			** 7-17-2010: inflating the top edge back to full height
			** The bottom edge should move with the scroller.
			*/
			if (new_bottom >= view_top) {

				new_height	= new_bottom - view_top;

				if (new_height >= scroll_el.jr_editor_pre_scroll_height) {
					new_height	= scroll_el.jr_editor_pre_scroll_height;
					scroll_el.jr_editor_scroll_moved_top	= false;
				}
			}

			jr_ElementSetStyle( scroll_el,		"top",		new_bottom - new_height);
			jr_ElementSetStyle( scroll_el,		"height",	new_height);
		}
		else if (new_top <= view_bottom) {
			/*
			** 7-18-2010: growing the bottom edge
			** The top edge should move with the scroller.
			*/
			new_height	= view_bottom - new_top;

			if (new_height > scroll_el.jr_editor_pre_scroll_height) {
				new_height	= scroll_el.jr_editor_pre_scroll_height;
			}
			jr_ElementSetStyle( scroll_el,		"top",		new_top);
			jr_ElementSetStyle( scroll_el,		"height",	new_height);
		}
		else {
			/*
			** 7-18-2010: scrolling 0 height items behind the view port
			*/
			jr_ElementSetStyle( scroll_el,		"top",		new_top);
			new_height	= "E";
		}
	}
	else {
		/*
		** 7-18-2010: scrolling fully visible items.
		*/
		jr_ElementSetStyle( scroll_el,			"top",		new_top);
		new_height	= "";
	}

	if (jr_DoDiag.jr_EditorHandleScrollClip) {
		var		diag_string;

		if (ScrollDiagCount == 0) {
			jr_DiagPrintLine( "");
			diag_string = scroll_delta + "[" + view_top + "-" + view_bottom + "]";
			diag_string += "(" + scroll_el.jr_editor_pre_scroll_height + ")";
			jr_DiagAppend( "Scroll Clip " + diag_string + ": ");
		}

		diag_string = " [" + curr_top + "-" + curr_bottom + "]" + new_height;

		jr_DiagAppend( diag_string);
		ScrollDiagCount ++;

		if (ScrollDiagCount >= 2) {
			ScrollDiagCount = 0;
		}
	}
}

function jr_EditorSetPreScrollInfo(object, scroll_el)
{
	scroll_el.jr_editor_pre_scroll_top		= scroll_el.offsetTop;
	scroll_el.jr_editor_pre_scroll_height	= scroll_el.offsetHeight;
	scroll_el.jr_editor_scroll_moved_top	= false;
}

function jr_EditorGetSelectedNodes(
	object, start_parent_node, start_index, end_parent_node, end_index, going_backwards,
	selected_nodes, partial_parents)
{
	var		curr_node;
	var		new_node;
	var		end_node;
	var		curr_index;
	var		found_end			= false;
	var		q;

	if (going_backwards) {
		curr_node			= start_parent_node;
		curr_index			= start_index;

		start_parent_node	= end_parent_node;
		start_index			= end_index;

		end_parent_node		= curr_node;
		end_index			= curr_index;
	}

	curr_index	= 0;
	end_node	= jr_NodeGetChildAtTextIndex( end_parent_node, end_index);

	for (q =0; q < start_parent_node.childNodes.length; q++) {
		curr_node = start_parent_node.childNodes[q];

		if (curr_node === end_node) {
			found_end	= true;
			break;
		}
		if (curr_node.nodeType == jr_Node.TEXT_NODE) {
			if (curr_index < start_index  &&  start_index < curr_index + curr_node.length) {
				/*
				** 6/27/09: this text node includes the starting index,
				** split it in two:  0  <  start_index - curr_index  <  curr_node.length
				*/
				new_node	= curr_node.splitText( start_index - curr_index);

				if (curr_node === object.jr_editor_text_node_left) {
					/*
					** 7/2/09: Preserve the cursor position.
					*/
					object.jr_editor_text_node_left	= new_node;
				}

				if (curr_node.nextSibling) {
					start_parent_node.insertBefore( new_node, curr_node.nextSibling);
				}
				else {
					start_parent_node.appendChild( new_node);
				}
			}
			else if (curr_index >= start_index) {
				selected_nodes.push( curr_node);
			}
			curr_index	+= curr_node.length;
		}
		else if (curr_index < start_index) {
			curr_index	+= 1;
		}
		else if (jr_NodeIsSubNode( end_node, curr_node, object.jr_editor_edit_el)) {
			found_end	= jr_EditorAddTopLevelNodes(
							object, curr_node.firstChild, end_node, selected_nodes, partial_parents
						);

			if (!found_end) {
				throw new Error( "returns false but should contain end node");
			}
			break;
		}
		else {
			selected_nodes.push( curr_node);
		}
	}
	if (end_node  &&  !found_end) {
		jr_EditorGetSiblingNodesToSelectionEnd(
			object, start_parent_node, end_node, selected_nodes, partial_parents
		);
	}
}

function jr_EditorGetSiblingNodesToSelectionEnd(
	object, start_node, end_node, selected_nodes, opt_partial_parents)
{
	var		curr_node	= start_node;
	var		found_end	= false;

	while (!found_end) {

		while (! curr_node.nextSibling) {
			curr_node	= curr_node.parentNode;

			if (curr_node == object.jr_editor_edit_el) {
				return false;
			}
		}

		curr_node	= curr_node.nextSibling;

		if (curr_node === end_node) {
			return true;
		}
		else if (jr_NodeIsSubNode( end_node, curr_node, object.jr_editor_edit_el)) {
			found_end	= jr_EditorAddTopLevelNodes(
							object, curr_node.firstChild, end_node,
							selected_nodes, opt_partial_parents
						);

			if (!found_end) {
				throw new Error( "returns false but should contain end node");
			}
			return true;
		}
		else {
			selected_nodes.push( curr_node);
		}
	}
	return found_end;
}


function jr_EditorGetSelectedBlocks(
	object, start_parent_el, start_text_index, end_parent_el, end_text_index,
	going_backwards, selected_nodes)
{
	var		start_node,		end_node;
	var		start_block,	end_block;
	var		found_end;

	start_node	= jr_NodeGetChildAtTextIndex( start_parent_el, start_text_index);
	end_node	= jr_NodeGetChildAtTextIndex( end_parent_el, end_text_index);

	if (going_backwards) {
		var		tmp_node;

		tmp_node		= start_node;
		start_node		= end_node;
		end_node		= tmp_node;
	}

	start_block			= jr_NodeGetParentBlock( start_node,	object.jr_editor_edit_el);
	end_block			= jr_NodeGetParentBlock( end_node,		object.jr_editor_edit_el);

	if (!start_block) {
		/*
		** 10/16/09: parent is the edit_el, use the text node instead.
		*/
		start_block		= start_node;
	}
	if (!end_block) {
		end_block		= end_node;
	}

	if (jr_NodeIsSubNode( start_block, end_block, object.jr_editor_edit_el)) {
		/*
		** 10/16/09: The end node is a non-block whose parent is an ancestor
		** of the first node. Don't extend the operation to the whole end block
		*/
		end_block	= end_node;
	}

	/*
	** 10/16/09: All nodes containing the end node are unraveled, i.e.
	** the prior siblings are added separately, otherwise the block is
	** added as is.
	*/
	selected_nodes.push( start_block);

	if (jr_NodeIsSubNode( end_block, start_block, object.jr_editor_edit_el)) {
		found_end	= true;
	}
	else {
		/*
		** 5/25/2010: How is this getting blocks, not nodes?
		** Assume that siblings of a block are blocks, but that's
		** not necessarily.
		*/
		found_end	= jr_EditorGetSiblingNodesToSelectionEnd(
						object, start_block, end_block, selected_nodes
					);
	}
	if (found_end  &&  end_block !== end_node) {
		/*
		** 11/25/09: Add the end block since it contains the end node.
		** Don't add the end node since that ends the selection and isn't part of it.
		*/

		selected_nodes.push( end_block);
	}
}

function jr_EditorAddTopLevelNodes( object, start_node, end_node, selected_nodes, opt_partial_parents)
{
	var		curr_node;
	var		found_end;

	for (curr_node = start_node;  curr_node;  curr_node = curr_node.nextSibling) {
	
		if (curr_node === end_node) {
			return true;
		}
		else if (jr_NodeIsSubNode( end_node, curr_node, object.jr_editor_edit_el)) {

			found_end	= jr_EditorAddTopLevelNodes(
							object, curr_node.firstChild, end_node, selected_nodes, opt_partial_parents
						);

			if (found_end) {
				if (opt_partial_parents) {
					opt_partial_parents.push( curr_node);
				}
				return true;
			}
			else {
				throw new Error( "returns false but should contain end node");
			}
		}
		else {
			selected_nodes.push( curr_node);
		}
	}
	return false;
}

function jr_EditorStopEditting( object)
{
	if (object.jr_editor_textarea_el) {
		object.jr_editor_textarea_el.blur();
	}
	jr_ElementSetStyle( object.jr_editor_caret_el, "display", "none");
	jr_EditorHideSelectionBox( object);
}



function jr_EditorSetCaretLocation( object, parent_el, text_index)
{
	var		found_node;
	var		text_node_left;
	var		text_node_right;

	found_node	= jr_NodeGetChildAtTextIndex( parent_el, text_index);

	if (found_node == null  ||  found_node.nodeType != jr_Node.TEXT_NODE) {
		text_node_right = document.createTextNode ("");

		if (found_node) {
			parent_el.insertBefore( text_node_right, found_node);
		}
		else {
			parent_el.appendChild( text_node_right);
		}
	}
	else {
		text_node_right	= found_node;
	}

	if (	text_node_right.previousSibling
		&&  text_node_right.previousSibling.nodeType == jr_Node.TEXT_NODE
	) {
		text_node_left	= text_node_right.previousSibling;
	}
	else if (	text_node_right.length == 0
			&&	text_node_right.nextSibling
			&&  text_node_right.nextSibling.nodeType == jr_Node.TEXT_NODE
	) {
		text_node_left	= text_node_right;
		text_node_right	= text_node_left.nextSibling;
	}
	else {
		text_node_left	= document.createTextNode ("");
		parent_el.insertBefore( text_node_left, text_node_right);
	}

	object.jr_editor_text_node_left		= text_node_left;
	object.jr_editor_text_node_right	= text_node_right;

	return text_node_left;
}

function jr_EditorSetCaretStartLocation( object, parent_el, text_index)
{
	jr_EditorSetCaretLocation( object, parent_el, text_index);

	object.jr_editor_start_parent_el	= parent_el;
	object.jr_editor_start_text_index	= text_index;
	/*
	** 3-8-2011: should it be the following for consistency?
	** Looks like all uses (except one) always pass the existing start_parent_el,
	** so changing it to the below should have no effect.
	** The exception (source_div) should probably be ok.
	*/
	if (false) {
		object.jr_editor_start_parent_el	= object.jr_editor_text_node_right.parentNode;
		object.jr_editor_start_text_index	= jr_NodeGetTextIndexInParent( object.jr_editor_text_node_right);
	}

}


function jr_ConvertTextToHtml( text_value, root_div, keep_newlines)
{
	var		line_array				= text_value.split( "\n");
	var		is_new_section			= true;
	var		curr_line;
	var		section_div;
	var		heading_div;
	var		body_div				= root_div;
	var		curr_block				= null;
	var		new_heading_line		= null;
	var		is_multi_block_section	= true;
	var		is_new_block			= true;

	for (var q=0;  q < line_array.length;  q++) {
		curr_line	= line_array[q];

		if (keep_newlines) {
			curr_line	+= "\n";
		}
		if (curr_line.length == 0  ||  curr_line.match( /^\s+$/)) {
			/*
			** 12/6/09: It's a blank line
			*/
			if (new_heading_line !== null) {
				/*
				** 12/6/09: was a line by itself, should be a paragraph.
				*/
				curr_block	= jr_ElementAppendChild( body_div, "p");

				jr_NodeAppendText( curr_block, new_heading_line);

				new_heading_line	= null;
				curr_block			= null;
			}

			is_new_block		= true;
			continue;
		}

		var		list_indent		= 0;
		var		is_underline	= false;

		if (curr_line.match( /^[-=]+\s*$/)) {
			/*
			** 12/6/09: current line is an underline
			*/
			is_underline	= true;
		}
		else {
			/*
			** 5/31/2010: calculate the number of leading '-' chars
			*/
			for (list_indent = 0;  curr_line.charAt(0) == "-";  list_indent++) {
				curr_line	= curr_line.substring( 1);
			}
		}

		if (is_new_block  &&  !is_underline  &&  list_indent == 0) {
			/*
			** 12/6/09: First line after a blank line
			*/
			new_heading_line	= null;
			is_new_block		= false;

			if (is_multi_block_section) {
				/*
				** 12/6/09: In a multi-block, a line followed by an underline
				** or leading '-' triggers a new section.
				*/
				if (q + 1  <  line_array.length) {
					next_line	= line_array[q+1];
					if (next_line.match( /^[-=]+/)) {
						/*
						** 12/6/09: next line is an underline or starts with a dash
						*/
						new_heading_line	= curr_line;
					}
				}
				if (new_heading_line === null) {
					curr_block	= jr_ElementAppendChild( body_div, "p");

					jr_NodeAppendText( curr_block, curr_line + "\n");
					continue;
				}
			}
			else {
				new_heading_line	= curr_line;
			}

			if (new_heading_line !== null) {
				/*
				** 12/6/09: found a new section heading
				*/
				continue;
			}
		}

		/*
		** 12/6/09: Inner line (2+) of a section
		*/
		if (new_heading_line !== null) {
			/*
			** 12/6/09: Second line of a new section, create the new section
			*/

			section_div		= jr_EditorSectionDivCreate();
			
			jr_ElementAppendChild( root_div, section_div);

			heading_div		= section_div.jr_section_heading_div;
			body_div		= section_div.jr_section_body_div;

			jr_NodeAppendText( heading_div, new_heading_line);

			new_heading_line	= null;
			curr_block			= null;
		}


		if (is_underline) {
			is_multi_block_section	= true;
		}
		else if (list_indent == 0) {
			if (curr_block === null) {
				curr_block	= jr_ElementAppendChild( body_div, "p");
			}

			jr_NodeAppendText( curr_block, curr_line + "\n");
		}
		else {
			/*
			** 12/6/09: Is a list element
			*/
			var		list_div;
			var		nested_list;

			if (curr_block !== null) {
				jr_NodeInitCategories( curr_block);
			}
			if (curr_block === null  ||  !curr_block.jr_is_LI) {
				list_div	= jr_ElementAppendChild( body_div, "ul");
				curr_block	= null;

				list_div.cw_list_indent	= 1;
			}
			else {
				list_div	= curr_block.parentNode;
			}

			while (list_div.cw_list_indent  <  list_indent) {
				if (curr_block === null) {
					curr_block	= jr_ElementAppendChild( list_div, "li");
				}
				nested_list		= jr_ElementAppendChild( curr_block, "ul");
				curr_block		= null;

				nested_list.cw_list_indent	= list_div.cw_list_indent + 1;

				list_div		= nested_list;
			}

			while (list_div.cw_list_indent  >  list_indent) {
				list_div	= list_div.parentNode.parentNode;
			}

			curr_block	= jr_ElementAppendChild( list_div, "li");
			jr_NodeAppendText( curr_block, curr_line);
		}
	}
	if (new_heading_line !== null) {
		curr_block	= jr_ElementAppendChild( body_div, "p");

		jr_NodeAppendText( curr_block, new_heading_line);
	}
}
/******** Edit Infrastructure: Key processing, Undo/Redo ********/

var		jr_EditorKeyMap		= new Object();

jr_EditorKeyMap[ jr_NEWLINE_KEY_CODE]	= new jr_EditorProcessKeyClass( jr_NEWLINE_KEY_CODE);
jr_EditorKeyMap[ jr_ESCAPE_KEY_CODE]	= new jr_EditorProcessKeyClass( jr_ESCAPE_KEY_CODE);
jr_EditorKeyMap[ jr_LEFT_KEY_CODE]		= new jr_EditorProcessKeyClass( jr_LEFT_KEY_CODE);
jr_EditorKeyMap[ jr_RIGHT_KEY_CODE]		= new jr_EditorProcessKeyClass( jr_RIGHT_KEY_CODE);
jr_EditorKeyMap[ jr_UP_KEY_CODE]		= new jr_EditorProcessKeyClass( jr_UP_KEY_CODE);
jr_EditorKeyMap[ jr_DOWN_KEY_CODE]		= new jr_EditorProcessKeyClass( jr_DOWN_KEY_CODE);
jr_EditorKeyMap[ jr_BACKSPACE_KEY_CODE]	= new jr_EditorProcessKeyClass( jr_BACKSPACE_KEY_CODE);
jr_EditorKeyMap[ jr_DELETE_KEY_CODE]	= new jr_EditorProcessKeyClass( jr_DELETE_KEY_CODE);
jr_EditorKeyMap[ jr_TAB_KEY_CODE]		= new jr_EditorProcessKeyClass( jr_TAB_KEY_CODE);

function jr_EditorProcessKeyClass( key_code)
{
	/*
	** 6/28/09: Combined with the global variable above,
	** this object implements a function table. Rather than
	** create separate constructors for each and therefore
	** a separate prototype for each, reset the ProcessKey()
	** method for each object.
	** Note, the constructor will only be called once for
	** each key code type in the function table.
	*/
	this.is_move	= false;

	if (key_code == jr_NEWLINE_KEY_CODE) {
		this.ProcessKey		= function( jr_editor, key_info) {
								return jr_EditorInsertNewlineOpCreate( jr_editor);
							}
	}
	else if (key_code == jr_ESCAPE_KEY_CODE) {
		this.ProcessKey		= function( jr_editor, key_info) {
								jr_EditorStopEditting( jr_editor);
							}
		this.is_move		= true;
	}
	else if (key_code == jr_LEFT_KEY_CODE) {
		this.ProcessKey		= function( jr_editor, key_info) {
								jr_EditorMoveCaretLeftRight (jr_editor, -1);
								jr_editor.jr_editor_going_backwards	= true;
							}
		this.is_move		= true;
	}
	else if (key_code == jr_RIGHT_KEY_CODE) {
		this.ProcessKey		= function( jr_editor, key_info) {
								jr_EditorMoveCaretLeftRight (jr_editor, 1);
							}
		this.is_move		= true;
	}
	else if (key_code == jr_UP_KEY_CODE) {
		this.ProcessKey		= function( jr_editor, key_info) {
								jr_EditorMoveCaretUpDown (jr_editor, -1, true);
								jr_editor.jr_editor_going_backwards	= true;
							}
		this.is_move		= true;
	}
	else if (key_code == jr_DOWN_KEY_CODE) {
		this.ProcessKey		= function( jr_editor, key_info) {
								jr_EditorMoveCaretUpDown (jr_editor, 1, true);
							}
		this.is_move		= true;
	}
	else if (key_code == jr_BACKSPACE_KEY_CODE) {
		this.ProcessKey		= function( jr_editor, key_info) {
								return jr_EditorDeleteOpCreate( jr_editor, key_code, false);
							}
	}
	else if (key_code == jr_DELETE_KEY_CODE) {
		this.ProcessKey		= function( jr_editor, key_info) {
								return jr_EditorDeleteOpCreate( jr_editor, key_code, false);
							}
	}
	else if (key_code == jr_TAB_KEY_CODE) {
		this.ProcessKey		= function( object, key_info) {
								var		edit_op;

								if (jr_KeyStrokeHasShift( key_info)) {
									edit_op	= jr_EditorUnindentOpCreate( object);
								}
								else {
									edit_op	= jr_EditorIndentOpCreate( object);
								}

								return edit_op;
							}
	}
	else {
		this.ProcessKey		= function( jr_editor, key_info) {
							}
	}
}

var		jr_EditorCtrlKeyMap		= new Object();

jr_EditorCtrlKeyMap[ jr_ASCII_B_KEY_CODE]	= new jr_EditorProcessCtrlKeyClass( jr_ASCII_B_KEY_CODE);
jr_EditorCtrlKeyMap[ jr_ASCII_C_KEY_CODE]	= new jr_EditorProcessCtrlKeyClass( jr_ASCII_C_KEY_CODE);
jr_EditorCtrlKeyMap[ jr_ASCII_I_KEY_CODE]	= new jr_EditorProcessCtrlKeyClass( jr_ASCII_I_KEY_CODE);
jr_EditorCtrlKeyMap[ jr_ASCII_T_KEY_CODE]	= new jr_EditorProcessCtrlKeyClass( jr_ASCII_T_KEY_CODE);
jr_EditorCtrlKeyMap[ jr_ASCII_V_KEY_CODE]	= new jr_EditorProcessCtrlKeyClass( jr_ASCII_V_KEY_CODE);
jr_EditorCtrlKeyMap[ jr_ASCII_X_KEY_CODE]	= new jr_EditorProcessCtrlKeyClass( jr_ASCII_X_KEY_CODE);
jr_EditorCtrlKeyMap[ jr_ASCII_Y_KEY_CODE]	= new jr_EditorProcessCtrlKeyClass( jr_ASCII_Y_KEY_CODE);
jr_EditorCtrlKeyMap[ jr_ASCII_Z_KEY_CODE]	= new jr_EditorProcessCtrlKeyClass( jr_ASCII_Z_KEY_CODE);

jr_EditorCtrlKeyMap[ jr_ASCII_b_KEY_CODE]	= jr_EditorCtrlKeyMap[ jr_ASCII_B_KEY_CODE];
jr_EditorCtrlKeyMap[ jr_ASCII_c_KEY_CODE]	= jr_EditorCtrlKeyMap[ jr_ASCII_C_KEY_CODE];
jr_EditorCtrlKeyMap[ jr_ASCII_i_KEY_CODE]	= jr_EditorCtrlKeyMap[ jr_ASCII_I_KEY_CODE];
jr_EditorCtrlKeyMap[ jr_ASCII_t_KEY_CODE]	= jr_EditorCtrlKeyMap[ jr_ASCII_T_KEY_CODE];
jr_EditorCtrlKeyMap[ jr_ASCII_v_KEY_CODE]	= jr_EditorCtrlKeyMap[ jr_ASCII_V_KEY_CODE];
jr_EditorCtrlKeyMap[ jr_ASCII_x_KEY_CODE]	= jr_EditorCtrlKeyMap[ jr_ASCII_X_KEY_CODE];
jr_EditorCtrlKeyMap[ jr_ASCII_y_KEY_CODE]	= jr_EditorCtrlKeyMap[ jr_ASCII_Y_KEY_CODE];
jr_EditorCtrlKeyMap[ jr_ASCII_z_KEY_CODE]	= jr_EditorCtrlKeyMap[ jr_ASCII_Z_KEY_CODE];

function jr_EditorProcessCtrlKeyClass( key_code)
{
	this.is_move	= false;

	if (key_code == jr_ASCII_B_KEY_CODE) {
		this.ProcessKey		= function( jr_editor, key_info) {
								return jr_EditorBoldOpCreate( jr_editor);
							}
	}
	else if (key_code == jr_ASCII_C_KEY_CODE) {
		this.ProcessKey		= function( jr_editor, key_info) {
								jr_editor.jr_editor_copied_nodes = jr_EditorCopySelection( jr_editor);
							}
		this.is_copy		= true;
	}
	else if (key_code == jr_ASCII_I_KEY_CODE) {
		this.ProcessKey		= function( jr_editor, key_info) {
								return jr_EditorItalicOpCreate( jr_editor);
							}
	}
	else if (key_code == jr_ASCII_T_KEY_CODE) {
		this.ProcessKey		= function( jr_editor, key_info) {
								return jr_EditorConstantOpCreate( jr_editor);
							}
	}
	else if (key_code == jr_ASCII_V_KEY_CODE) {
		this.ProcessKey		= function( jr_editor, key_info) {
								return jr_EditorPasteOpCreate(
									jr_editor, jr_editor.jr_editor_copied_nodes
								);
							}
		this.is_paste		= true;
	}
	else if (key_code == jr_ASCII_X_KEY_CODE) {
		this.ProcessKey		= function( jr_editor, key_info) {
								return jr_EditorDeleteOpCreate( jr_editor, key_code, true);
							}
	}
	else if (key_code == jr_ASCII_Y_KEY_CODE) {
		this.ProcessKey		= function( jr_editor, key_info) {
								jr_EditorRedoLastUndo( jr_editor);
							}
	}
	else if (key_code == jr_ASCII_Z_KEY_CODE) {
		this.ProcessKey		= function( jr_editor, key_info) {
								jr_EditorUndoLastEdit( jr_editor);
							}
	}
	else if (key_code == jr_LEFT_KEY_CODE) {
		this.ProcessKey		= function( jr_editor, key_info) {
							}
	}
	else if (key_code == jr_RIGHT_KEY_CODE) {
		this.ProcessKey		= function( jr_editor, key_info) {
							}
	}
	else if (key_code == jr_UP_KEY_CODE) {
		this.ProcessKey		= function( jr_editor, key_info) {
							}
	}
	else if (key_code == jr_DOWN_KEY_CODE) {
		this.ProcessKey		= function( jr_editor, key_info) {
							}
	}
	else {
		this.ProcessKey		= function( jr_editor, key_info) {
							}
	}
}


var		jr_EDITOR_UNDO_OP_NAME					= "jr-undo";
var		jr_EDITOR_REDO_OP_NAME					= "jr-redo";
var		jr_EDITOR_CUT_OP_NAME					= "jr-cut";
var		jr_EDITOR_COPY_OP_NAME					= "jr-copy";
var		jr_EDITOR_PASTE_OP_NAME					= "jr-paste";
var		jr_EDITOR_BOLD_OP_NAME					= "jr-bold";
var		jr_EDITOR_ITALIC_OP_NAME				= "jr-italic";
var		jr_EDITOR_UNDERLINE_OP_NAME				= "jr-underline";
var		jr_EDITOR_CONSTANT_OP_NAME				= "jr-constant";
var		jr_EDITOR_BULLET_OP_NAME				= "jr-bullet";
var		jr_EDITOR_NUMBERED_OP_NAME				= "jr-numbered";
var		jr_EDITOR_INDENT_OP_NAME				= "jr-indent";
var		jr_EDITOR_UNINDENT_OP_NAME				= "jr-unindent";
var		jr_EDITOR_CENTER_OP_NAME				= "jr-center";
var		jr_EDITOR_LEFT_ALIGN_OP_NAME			= "jr-left-align";
var		jr_EDITOR_RIGHT_ALIGN_OP_NAME			= "jr-right-align";
var		jr_EDITOR_NEW_SECTION_OP_NAME			= "jr-new-section";
var		jr_EDITOR_SOURCE_BLOCK_OP_NAME			= "jr-source-block";

function jr_EditorRegisterStandardOps( object)
{
	jr_EditorRegisterEditCmd( object, jr_EDITOR_UNDO_OP_NAME,			jr_EditorUndoLastEdit);
	jr_EditorRegisterEditCmd( object, jr_EDITOR_REDO_OP_NAME,			jr_EditorRedoLastUndo);
	jr_EditorRegisterEditCmd( object, jr_EDITOR_CUT_OP_NAME,			jr_EditorCutOpCreate);
	jr_EditorRegisterEditCmd( object, jr_EDITOR_COPY_OP_NAME,			jr_EditorCopyOpCreate);
	jr_EditorRegisterEditCmd( object, jr_EDITOR_PASTE_OP_NAME,			jr_EditorPasteOpCreate);
	jr_EditorRegisterEditCmd( object, jr_EDITOR_BOLD_OP_NAME,			jr_EditorBoldOpCreate);
	jr_EditorRegisterEditCmd( object, jr_EDITOR_ITALIC_OP_NAME,			jr_EditorItalicOpCreate);
	jr_EditorRegisterEditCmd( object, jr_EDITOR_CONSTANT_OP_NAME,		jr_EditorConstantOpCreate);
	jr_EditorRegisterEditCmd( object, jr_EDITOR_UNDERLINE_OP_NAME,		jr_EditorUnderlineOpCreate);
	jr_EditorRegisterEditCmd( object, jr_EDITOR_BULLET_OP_NAME,			jr_EditorBulletOpCreate);
	jr_EditorRegisterEditCmd( object, jr_EDITOR_NUMBERED_OP_NAME,		jr_EditorNumberedOpCreate);
	jr_EditorRegisterEditCmd( object, jr_EDITOR_INDENT_OP_NAME,			jr_EditorIndentOpCreate);
	jr_EditorRegisterEditCmd( object, jr_EDITOR_UNINDENT_OP_NAME,		jr_EditorUnindentOpCreate);
	jr_EditorRegisterEditCmd( object, jr_EDITOR_CENTER_OP_NAME,			jr_EditorCenterOpCreate);
	jr_EditorRegisterEditCmd( object, jr_EDITOR_LEFT_ALIGN_OP_NAME,		jr_EditorLeftAlignOpCreate);
	jr_EditorRegisterEditCmd( object, jr_EDITOR_RIGHT_ALIGN_OP_NAME,	jr_EditorRightAlignOpCreate);
	jr_EditorRegisterEditCmd( object, jr_EDITOR_NEW_SECTION_OP_NAME,	jr_EditorNewSectionOpCreate);
	jr_EditorRegisterEditCmd( object, jr_EDITOR_SOURCE_BLOCK_OP_NAME,	jr_EditorSourceBlockOpCreate);


	jr_EditorDisableEditCmd( object, jr_EDITOR_UNDO_OP_NAME);
	jr_EditorDisableEditCmd( object, jr_EDITOR_REDO_OP_NAME);

	jr_EditorAddEditHandler( object, "DIV",	jr_EditHandlerDIVCreate());
	jr_EditorAddEditHandler( object, "LI",	jr_EditHandlerLICreate());
	jr_EditorAddEditHandler( object, "DD",	jr_EditHandlerDDCreate());
	jr_EditorAddEditHandler( object, "DT",	jr_EditHandlerDTCreate());

	jr_EditorAddEditHandler(
		object, jr_EDIT_SECTION_HEADING_TAG_NAME, new jr_EditHandlerSectionHeading()
	);
	jr_EditorAddEditHandler(
		object, jr_EDIT_SECTION_BODY_TAG_NAME, new jr_EditHandlerSectionBody()
	);
	jr_EditorAddEditHandler(
		object, jr_EDIT_SOURCE_BLOCK_TAG_NAME, new jr_EditHandlerSourceBlock()
	);
}

function jr_EditorCmdClass( cmd_name, cmd_fn)
{
	/*
	** 5/25/2010: Used to help control the editor buttons.
	** "is_disabled" and "no_position_required" not used yet.
	** To disable, should disable hover effects and tell the
	** button element to deactivate itself via a callback
	** that sets the image to BW, for example.
	*/
	this.cmd_name				= cmd_name;
	this.cmd_fn					= cmd_fn;
	this.is_disabled			= false;
	this.no_position_required	= false;
}

function jr_EditorRegisterEditCmd( object, cmd_name, cmd_fn)
{
	object.jr_editor_cmd_table[ cmd_name]		= new jr_EditorCmdClass( cmd_name, cmd_fn);
}

function jr_EditorDisableEditCmd( object, cmd_name)
{
	var		edit_cmd		= object.jr_editor_cmd_table[cmd_name];

	edit_cmd.is_disabled	= true;
}

function jr_EditorAddButton( object, cmd_name, button_el)
{
	var		edit_cmd		= object.jr_editor_cmd_table[cmd_name];

	if (!edit_cmd) {
		throw new Error( "can't add button: '" + cmd_name + "' is not registered");
	}
	button_el.jr_editor						= object;
	button_el.jr_editor_edit_cmd			= edit_cmd;

	jr_ElementRegisterHandler(
		button_el,			jr_CLICK_EVENT, jr_EditorHandleCmdButtonClick, object
	);
}

function jr_EditorSetSaveActivationHandler( object, handler_fn, handler_arg)
{
	object.jr_editor_activate_save_fn		= handler_fn;
	object.jr_editor_activate_save_arg		= handler_arg;
}

function jr_EditorActivateSave( object)
{
	if (object.jr_editor_activate_save_fn) {
		object.jr_editor_activate_save_fn( object.jr_editor_activate_save_arg, true);
	}
}

function jr_EditorDeactivateSave( object)
{
	if (object.jr_editor_activate_save_fn) {
		object.jr_editor_activate_save_fn( object.jr_editor_activate_save_arg, false);
	}
}

function jr_EditorHandleCmdButtonClick( object, cmd_button_el)
{
	if (cmd_button_el.jr_editor_edit_cmd) {
		jr_EditorDoEditCmd( object, cmd_button_el.jr_editor_edit_cmd);
	}

	jr_EditorReFocusAfterAction( object);
}

function jr_EditorDoEditCmd( object, edit_cmd)
{
	var		edit_op;

	if (	object.jr_editor_text_node_left && object.jr_editor_text_node_right
		||	edit_cmd.no_position_required) {

		edit_op		= edit_cmd.cmd_fn( object);

		if (edit_op) {
			jr_EditorAddNewEditOp( object, edit_op);
		}
	}
}

function jr_EditorCutOpCreate( object)
{
	return jr_EditorDeleteOpCreate( object, undefined, true);
}

function jr_EditorCopyOpCreate( object)
{
	object.jr_editor_copied_nodes = jr_EditorCopySelection( object);
}

function jr_EditorPasteOpCreate( object, new_content)
{
	return new jr_EditOpPasteClass( object, new_content);
}

function jr_EditorInsertNewlineOpCreate( object)
{
	return new jr_EditOpInsertNewlineClass( object);
}

function jr_EditorDeleteOpCreate( object, key_code, save_selection)
{
	return new jr_EditOpDeleteClass( object, key_code, save_selection);
}

function jr_EditorBoldOpCreate( object)
{
	return new jr_EditOpApplyInlineStyleClass( object, "fontWeight", "bold", "normal");
}

function jr_EditorItalicOpCreate( object)
{
	return new jr_EditOpApplyInlineStyleClass( object, "fontStyle", "italic", "normal");
}

function jr_EditorConstantOpCreate( object)
{
	var		edit_op;
	
	edit_op	= new jr_EditOpApplyInlineStyleClass( object, "fontFamily", "monospace", "serif");

	edit_op.addStyle( "color", "brown", "black");

	return edit_op;
}

function jr_EditorUnderlineOpCreate( object)
{
	return new jr_EditOpApplyInlineStyleClass( object, "textDecoration", "underline", "none");
}

function jr_EditorBulletOpCreate( object)
{
	return new jr_EditOpChangeBlockStructureClass( object, "UL");
}

function jr_EditorNumberedOpCreate( object)
{
	return new jr_EditOpChangeBlockStructureClass( object, "OL");
}

function jr_EditorCenterOpCreate( object)
{
	return new jr_EditOpApplyBlockStyleClass( object, "textAlign", "center");
}

function jr_EditorLeftAlignOpCreate( object)
{
	return new jr_EditOpApplyBlockStyleClass( object, "textAlign", "left");
}

function jr_EditorRightAlignOpCreate( object)
{
	return new jr_EditOpApplyBlockStyleClass( object, "textAlign", "right");
}

function jr_EditorIndentOpCreate( object)
{
	return new jr_EditOpApplyBlockStyleClass( object, "marginLeft", "+");
}

function jr_EditorUnindentOpCreate( object)
{
	return new jr_EditOpApplyBlockStyleClass( object, "marginLeft", "-");
}

function jr_EditorNewSectionOpCreate( object)
{
	return new jr_EditOpNewSectionClass( object);
}

function jr_EditorSourceBlockOpCreate( object)
{
	return new jr_EditOpSourceBlockClass( object);
}

function jr_EditorUndoRedoInit( object)
{
	object.jr_editor_edit_array			= new Array();
	object.jr_editor_num_edits			= 0;
}

function jr_EditorAddNewEditOp( object, edit_op)
{
	var		do_add				= true;
	var		prev_edit_op;
	var		retval;

	retval	= edit_op.doEdit();

	if (retval) {

		while (object.jr_editor_edit_array.length  >  object.jr_editor_num_edits) {
			object.jr_editor_edit_array.pop();
		}

		if (object.jr_editor_edit_array.length > 0) {
			prev_edit_op	= object.jr_editor_edit_array[ object.jr_editor_edit_array.length - 1];

			retval = edit_op.tryMerge( prev_edit_op);

			if (retval) {
				do_add	= false;
			}
		}

		if (do_add) {
			object.jr_editor_edit_array.push( edit_op);
			object.jr_editor_num_edits++;
		}
	}
	if (object.jr_editor_num_edits > 0) {
		jr_EditorActivateSave( object);
	}
}

function jr_EditorUndoLastEdit( object)
{
	var		edit_op;

	if (	object.jr_editor_num_edits > 0
		&&	object.jr_editor_num_edits <= object.jr_editor_edit_array.length) {

		edit_op	= object.jr_editor_edit_array[ object.jr_editor_num_edits - 1];

		edit_op.undoEdit();
		
		object.jr_editor_num_edits --;
	}
	if (object.jr_editor_num_edits <= 0) {
		jr_EditorDeactivateSave( object);
	}
}

function jr_EditorRedoLastUndo( object)
{
	var		edit_op;

	if (object.jr_editor_num_edits < object.jr_editor_edit_array.length) {

		edit_op	= object.jr_editor_edit_array[ object.jr_editor_num_edits];

		edit_op.redoEdit();
		
		object.jr_editor_num_edits ++;
	}
}

function jr_EditorCopySelection( object, opt_selected_nodes)
{
	var		selected_nodes		= new Array();

	if (opt_selected_nodes) {
		selected_nodes		= opt_selected_nodes;
	}
	else if (object.jr_editor_has_selection) {

		var		start_parent_el		= object.jr_editor_start_parent_el;
		var		start_text_index	= object.jr_editor_start_text_index;

		var		end_parent_el		= object.jr_editor_text_node_right.parentNode;
		var		end_text_index		= jr_NodeGetTextIndexInParent( object.jr_editor_text_node_right);

		jr_EditorGetSelectedNodes(
			object, start_parent_el, start_text_index, end_parent_el, end_text_index,
			object.jr_editor_going_backwards, selected_nodes
		);
	}

	var		copied_nodes		= new Array();
	var		last_parent_block	= null;
	var		copied_node;
	var		curr_node;
	var		last_parent_block;
	var		curr_parent_block;
	var		q;

	for (q=0;  q < selected_nodes.length; q++) {

		curr_node			= selected_nodes[q];
		curr_parent_block	= jr_NodeGetParentBlock( curr_node, object.jr_editor_edit_el);

		copied_node			= curr_node.cloneNode( true);

		if (q > 0  &&  curr_parent_block !== last_parent_block) {
			copied_node.jr_copied_from_different_block	= true;
		}
		copied_nodes.push( copied_node);

		last_parent_block	= curr_parent_block;
	}

	return copied_nodes;
}

function jr_EditorProcessPastedText( object)
{
	var		root_div		= jr_ElementCreate( "div");
	var		new_content		= new Array();
	var		curr_node;
	var		edit_op;

	/*
	** 12-5-2010: If the first node isn't text, 
	** it into a text node.
	*/
	jr_ConvertTextToHtml( object.jr_editor_textarea_el.value, root_div);

	curr_node	= root_div.firstChild;

	if (curr_node) {
		jr_NodeInitCategories( curr_node);
		
		if (curr_node.jr_is_block) {
			jr_NodeMoveChildrenBefore( curr_node, curr_node);
			jr_NodeRemoveFromDom( curr_node);
		}
	}

	curr_node	= root_div.firstChild;

	while (curr_node) {

		new_content.push( curr_node);

		curr_node	= curr_node.nextSibling;
	}

	if (new_content.length > 0) {
		edit_op		= jr_EditorPasteOpCreate( object, new_content);

		edit_op.setCopiedNodes( new_content);

		jr_EditorAddNewEditOp( object, edit_op);
	}
}

/******** Edit Actions ********/

function jr_EditOpPasteClass( object, new_content) 
{
	this.jr_editor			= object;
	this.has_selection		= object.jr_editor_has_selection;

	if (typeof new_content == "string") {
		this.new_chars		= new_content;
		this.num_chars		= new_content.length;
	}
	else {
		this.setCopiedNodes( new_content);
	}

	if (this.has_selection) {
		/*
		** 11/09/09: Instead create a DeleteSection object, apply that first.
		*/
		this.delete_op		= jr_EditorDeleteOpCreate( object, jr_DELETE_KEY_CODE, false);
	}
	else {
		this.start_parent_el		= object.jr_editor_start_parent_el;
		this.start_append_index		= object.jr_editor_start_text_index;
	}
}

jr_EditOpPasteClass.prototype.setCopiedNodes = function( copied_nodes)
{
	this.copied_nodes	= copied_nodes;
	this.num_chars		= 0;

	if (this.copied_nodes  &&  this.copied_nodes.length > 0) {
		this.has_paste_nodes	= true;
	}
	else {
		this.no_paste_nodes		= true;
	}
}

jr_EditOpPasteClass.prototype.doEdit = function()
{
	var		object					= this.jr_editor;
	var		delete_artificial_space	= false;
	var		length;
	var		prev_char;
	var		next_char;

	if (this.delete_op) {
		this.delete_op.doEdit();

		this.start_parent_el		= object.jr_editor_text_node_right.parentNode;
		this.start_append_index		= jr_NodeGetTextIndexInParent( object.jr_editor_text_node_right);
	}
	else {
		jr_EditorSetCaretLocation(
			object, this.start_parent_el, this.start_append_index
		);
	}

	delete_artificial_space	= false;

	if (this.num_chars > 0) {
		if (this.new_chars == " ") {
			/*
			** 6/27/09: add a &nbsp; (&#160; == 0xA0) for multiple spaces in a row
			*/
			length		= object.jr_editor_text_node_left.length;

			if (length > 0) {
				prev_char	= object.jr_editor_text_node_left.data.charAt( length - 1);

				if (prev_char == ' '  ||  prev_char == '\u00A0') {
					/*
					** 12-14-2010: 2nd space in a sequence
					*/
					this.new_chars	= '\u00A0';
					this.num_chars	= 1;
				}
				else {
					/*
					** 12-14-2010: there are non-space characters to the left, a space
					** should move the cursor.
					*/
				}
			}
			else if (object.jr_editor_text_node_right.length > 0) {
				
				next_char	= object.jr_editor_text_node_right.data.charAt( 0);

				if (next_char == ' '  ||  next_char == '\u00A0') {

					/*
					** 12-14-2010: no characters to the left and a space to the right
					** Add an &nbsp, otherwise the cursor doesn't move
					*/
					this.new_chars	= '\u00A0';
					this.num_chars	= 1;
				}
			}
			else {
			}
		}
		else if (object.jr_editor_has_artificial_space) {
			/*
			** 12-14-2010: typed non-whitespace so we can delete the artifical space
			*/
			delete_artificial_space	= true;
		}

		object.jr_editor_text_node_left.appendData (this.new_chars);
	}
	else if (this.copied_nodes) {
		var		last_block_break	= -1;
		var		break_parent_block;
		var		highest_inline_node;
		var		new_block_el;
		var		new_text_parent_el;
		var		curr_node;
		var		z;

		for (z=0;  z < this.copied_nodes.length;  z++) {
			curr_node	= this.copied_nodes[z];

			jr_NodeInitCategories( curr_node);

			if (curr_node.jr_copied_from_different_block) {
				last_block_break	= z;
			}
		}

		/*
		** 5/28/2010: see if the copied nodes contain a block level element.
		** If so, the current block element is getting split in two.
		*/

		if (last_block_break >= 0) {
			/*
			** 5/28/2010: Need to split the parent block at the insertion point,
			** duplicating the split nodes and copying the others.
			*/
			var		child_el		= object.jr_editor_text_node_right;
			var		parent_el		= this.start_parent_el;
			var		new_child_el	= null;

			break_parent_block	= jr_NodeGetParentBlock(
									parent_el, object.jr_editor_edit_el
								);

			new_text_parent_el	= null;

			/*
			** 5/29/2010 Note: break_parent_block could be null
			*/
			while (parent_el !== object.jr_editor_edit_el) {

				/*
				** 5/30/2010: clone the next level of style (or block)
				*/
				new_block_el		= parent_el.cloneNode( false);

				/*
				** 5/30/2010: add the previous style as the first child
				*/
				if (new_child_el) {
					new_block_el.appendChild( new_child_el);
				}

				/*
				** 5/30/2010: move the following nodes, not the child el since
				** that was cloned (except for the first time)
				*/
				while (child_el.nextSibling) {
					jr_NodeAppendChild( new_block_el, child_el.nextSibling);
				}

				if (new_text_parent_el == null) {
					/*
					** 5/30/2010: first time through, keep track of the paste context
					** and prepend the right text node.
					*/
					new_text_parent_el	= new_block_el;

					jr_NodePrependChild( new_block_el, child_el);
				}

				if (parent_el === break_parent_block) {
					break;
				}
				else if (!break_parent_block  &&  parent_el.parentNode == object.jr_editor_edit_el) {
					/*
					** 3-8-2011: means the current position isn't in a block in the edit_el
					** Assume the edit_el can have sub-blocks, so use the highest node
					** just below the edit_el, i.e. parent_el
					*/
					break_parent_block	= parent_el;
					break;
				}

				new_child_el	= new_block_el;

				child_el		= parent_el;
				parent_el		= parent_el.parentNode;
			}
			/*
			** 5/30/2010: Note new_block_el may not be a block, it's a copy of the top-level
			** node that's getting split. Only in a degenerate case is it not a block,
			** i.e. when the text being editted is not in a block.
			*/
		}
		else {
			/*
			** 3-8-2011: if the copied nodes contain whole blocks, we need to set start_parent_block
			** 
			*/
			highest_inline_node	= object.jr_editor_text_node_left;

			while (highest_inline_node) {
				parent_el	= highest_inline_node.parentNode;
				if (! jr_NodeHasCategories( parent_el)) {
					jr_NodeInitCategories( parent_el);
				}
				if (parent_el.jr_has_sub_flow  ||  parent_el === object.jr_editor_edit_el) {
					break;
				}
				highest_inline_node	= parent_el;
			}
		}

		var		saw_block		= false;
		var		paste_prev_node	= object.jr_editor_text_node_left;


		for (z=0;  z < this.copied_nodes.length;  z++) {
			curr_node	= this.copied_nodes[z];

			if (curr_node.jr_is_block) {
				if (!saw_block) {
					if (last_block_break >= 0) {
						paste_prev_node	= break_parent_block;
					}
					else {
						paste_prev_node = highest_inline_node;
					}
				}
				saw_block	= true;
			}

			if (z == last_block_break) {
				/*
				** 5/29/2010: add the split-off trailing part of the start parent
				** 5/30/2010: The paste node into the cloned parent is the
				** first child so needs to be prepended.
				*/
				jr_NodeAppendAfter( paste_prev_node, new_block_el);
				paste_prev_node	= jr_NodePrependChild( new_text_parent_el, curr_node);
			}
			else {
				paste_prev_node	= jr_NodeAppendAfter( paste_prev_node, curr_node);
			}
		}
		/*
		** 5/30/2010: If everything has gone right,
		** the right text node is still the insertion point
		*/
		this.end_parent_el		= object.jr_editor_text_node_right.parentNode;
		this.end_append_index	= jr_NodeGetTextIndexInParent( object.jr_editor_text_node_right);

		if (object.jr_editor_has_artificial_space) {
			/*
			** 12-14-2010: assuming we pasted non-whitespace so we can delete the artifical space
			*/
			delete_artificial_space	= true;
		}
		jr_EditorSetCaretLocation( object, this.end_parent_el, this.end_append_index);
	}

	this.deleted_artificial_space	= false;

	if (delete_artificial_space  &&  object.jr_editor_text_node_right.length > 0) {
		var	space_char;
			
		space_char	= object.jr_editor_text_node_right.data.charAt( 0);

		if (space_char == '\u00A0') {
			object.jr_editor_text_node_right.deleteData( 0, 1);
			object.jr_editor_has_artificial_space	= false;
			this.deleted_artificial_space			= true;
		}
	}

	jr_EditorUpdateCaret( object);
	jr_EditorSelectionInit( object);

	jr_EditorUpdateBackgroundHeight( object);

	return true;
}


jr_EditOpPasteClass.prototype.undoEdit = function()
{
	var		object				= this.jr_editor;
	var		text_node_left;

	if (this.num_chars > 0) {
		text_node_left	= jr_EditorSetCaretLocation(
							object, this.start_parent_el, this.start_append_index + this.num_chars
						);

		if (text_node_left.length > this.num_chars) {
			text_node_left.deleteData( text_node_left.length - this.num_chars, this.num_chars);
		}
		else {
			/*
			** 7/03/09: This case shouldn't be possible since the data was added to a single text node.
			*/
			text_node_left.deleteData( 0, text_node_left.length);
		}
	}
	else if (this.copied_nodes) {
		var		delete_op;

		jr_EditorSetCaretStartLocation( object, this.start_parent_el, this.start_append_index);
		jr_EditorSetCaretLocation( object, this.end_parent_el, this.end_append_index);
		object.jr_editor_has_selection	= true;

		delete_op		= jr_EditorDeleteOpCreate( object, jr_DELETE_KEY_CODE, false);

		delete_op.doEdit();
	}

	if (this.deleted_artificial_space) {
		/*
		** 12-14-2010: assumes that the undo left the positioning as
		** it was before, and needs an artificial space
		*/
		
		object.jr_editor_text_node_right.insertData(0, "\u00A0");
		object.jr_editor_has_artificial_space	= true;
	}

	jr_EditorUpdateCaret( object);
	jr_EditorUpdateBackgroundHeight( object);

	if (this.delete_op) {
		this.delete_op.undoEdit();
	}
}

jr_EditOpPasteClass.prototype.redoEdit = function()
{
	this.doEdit();
}

jr_EditOpPasteClass.prototype.tryMerge = function( prev_edit_op)
{
	return false;
}

jr_EditOpPasteClass.prototype.saveEdit = function()
{
	if (this.delete_op) {
		this.delete_op.saveEdit();
	}
}

/******** Insert a newline ********/

function jr_EditOpInsertNewlineClass( object) 
{
	this.jr_editor			= object;
	this.end_parent_el		= object.jr_editor_text_node_right.parentNode;
	this.end_text_index		= jr_NodeGetTextIndexInParent( object.jr_editor_text_node_right);
}

jr_EditOpInsertNewlineClass.prototype.doEdit = function()
{
	var		object				= this.jr_editor;
	var		parent_block;
	var		insert_node;
	var		split_nodes			= new Array();
	var		split_info;
	var		null_text_node;
	var		new_el;
	var		child_node;
	var		edit_handler;
	var		q;

	insert_node			= jr_NodeGetChildAtTextIndex( this.end_parent_el, this.end_text_index);
	parent_block		= jr_NodeGetParentBlock( insert_node, object.jr_editor_edit_el);

	this.parent_block	= parent_block;

	edit_handler		= jr_EditorInitHandlers( object, parent_block);

	if (!edit_handler) {
		edit_handler		= jr_EditHandlerCreate();
	}

	if (edit_handler.hasPreWhitespace()) {
		object.jr_editor_text_node_left.appendData( "\n");
	}
	else if (jr_NodePreviousSiblingsAreWhitespace( insert_node, parent_block)) {
		/*
		** 11-21-2010: Always allow adding newlines before something
		** Could also add a space and set style "white-space : pre"
		*/
		new_el	= edit_handler.insertNewlineNodeCreate();

		jr_NodeAppendText( new_el, "\u00A0");

		edit_handler.insertNewlineNodeBefore( new_el, parent_block);

		/*
		** 11-22-2010: cursor position is unchanged.
		*/
	}
	else {

		if (!edit_handler.insertNewlineIsAllowed()) {
			return false;
		}

		new_el	= edit_handler.insertNewlineNodeCreate();

		if (new_el) {
			/*
			** 6/22/09: Add all next siblings to the new element.
			** Avoid deleting from the parent node's children while looping through,
			** not sure if deleting while looping is defined.
			*/

			curr_node	= insert_node;

			while (curr_node) {
				split_info		= new Object();

				split_info.split_node	= curr_node;
				split_info.parent_node	= curr_node.parentNode;

				split_nodes.push( split_info);


				if (curr_node.nextSibling) {
					curr_node	= curr_node.nextSibling;
				}
				else if (curr_node.parentNode !== parent_block) {
					curr_node	= curr_node.parentNode.nextSibling;
				}
				else {
					curr_node	= null;
				}
			}

			/*
			** 6/23/09: Don't move text_node_right until after getting the siblings.
			*/
			var		text_length	= 0;

			null_text_node	= jr_NodeAppendText( new_el, "");

			for (q=0;  q < split_nodes.length;  q++) {
				split_info	= split_nodes[q];

				if (jr_NodeIsText( split_info.split_node)) {
					text_length	+= split_info.split_node.length;
				}

				jr_NodeAppendChild( new_el, split_info.split_node);
			}

			edit_handler.insertNewlineNodeAfter( new_el, parent_block);

			object.jr_editor_text_node_left		= null_text_node;
			object.jr_editor_text_node_right	= object.jr_editor_text_node_left.nextSibling; 

			if (text_length == 0) {
				object.jr_editor_text_node_right.insertData(0, "\u00A0");
				object.jr_editor_has_artificial_space	= true;
			}
		}
	}

	jr_EditorUpdateCaret( object);
	jr_EditorSelectionInit( object);
	jr_EditorUpdateBackgroundHeight( object);


	if (	object.jr_editor_caret_el.offsetTop + object.jr_editor_caret_el.offsetHeight
		>	object.jr_editor_edit_el.offsetTop + object.jr_editor_edit_el.offsetHeight) {

		var		top_diff;

		top_diff	= object.jr_editor_edit_el.scrollHeight - object.jr_editor_edit_el.offsetHeight;
		
		object.jr_editor_edit_el.scrollTop = top_diff;
	}

	this.new_el			= new_el;
	this.split_nodes	= split_nodes;

	return true;
}

jr_EditOpInsertNewlineClass.prototype.undoEdit = function()
{
	var		object				= this.jr_editor;
	var		parent_block		= this.parent_block;
	var		new_el				= this.new_el;
	var		split_nodes			= this.split_nodes;
	var		edit_handler;
	var		text_node_left;
	var		split_info;
	var		child_node;
	var		q;

	edit_handler		= jr_EditorInitHandlers( object, parent_block);

	if (!edit_handler) {
		edit_handler		= jr_EditHandlerCreate();
	}
	if (edit_handler.hasPreWhitespace()) {
		object.jr_editor_text_node_left.deleteData( object.jr_editor_text_node_left.length - 1, 1);
	}
	else if (new_el) {
		jr_NodeRemoveFromDom( new_el);

		for (q=0;  q < split_nodes.length;  q++) {
			split_info	= split_nodes[q];

			jr_ElementAppendChild( split_info.parent_node, split_info.split_node);

			if (q == 0) {
				text_node_left	= split_info.split_node.previousSibling;

				if (text_node_left == null  ||  text_node_left.nodeType != jr_Node.TEXT_NODE) {
					/*
					** 7/4/09: previous node isn't a text node, create a null one.
					*/
					text_node_left	= document.createTextNode ("");

					parent_block.insertBefore( text_node_left, child_node);
				}
			}
		}

		object.jr_editor_text_node_left		= text_node_left;
		object.jr_editor_text_node_right	= text_node_left.nextSibling;

		/*
		** 7/4/09: text_node_right should equal split_nodes[0] and should be a text node.
		*/

		jr_EditorUpdateCaret( object);
		jr_EditorUpdateBackgroundHeight( object);
	}
}

jr_EditOpInsertNewlineClass.prototype.redoEdit = function()
{
	jr_EditorSetCaretLocation( this.jr_editor, this.end_parent_el, this.end_text_index);
	this.doEdit();
}

jr_EditOpInsertNewlineClass.prototype.tryMerge = function( prev_edit_op)
{
	return false;
}

jr_EditOpInsertNewlineClass.prototype.saveEdit = function()
{
}

function jr_EditOpInsertNewlineNewElement(object)
{
	return object.new_el;
}

/******** Delete/Backspace selection or single char ********/

function jr_EditOpDeleteClass( object, key_code, save_selection) 
{
	this.jr_editor			= object;
	this.key_code			= key_code;
	this.going_backwards	= object.jr_editor_going_backwards;
	this.save_selection		= save_selection;

	if (object.jr_editor_has_selection) {
		this.start_parent_el		= object.jr_editor_start_parent_el;
		this.start_text_index		= object.jr_editor_start_text_index;
	}
	else {
		this.start_parent_el		= object.jr_editor_text_node_right.parentNode;
		this.start_text_index		= jr_NodeGetTextIndexInParent( object.jr_editor_text_node_right);

		if (key_code == jr_DELETE_KEY_CODE) {
			jr_EditorMoveCaretLeftRight (object, 1);
			this.going_backwards	= false;
		}
		else if (key_code == jr_BACKSPACE_KEY_CODE) {
			jr_EditorMoveCaretLeftRight (object, -1);
			this.going_backwards	= true;
		}
		else if (key_code === undefined) {
			this.no_op	= true;
		}
		else {
			throw new Error( "no selection, not backspace or delete");
		}
	}

	this.end_parent_el		= object.jr_editor_text_node_right.parentNode;
	this.end_text_index		= jr_NodeGetTextIndexInParent( object.jr_editor_text_node_right);
}

jr_EditOpDeleteClass.prototype.doEdit = function()
{
	var		object				= this.jr_editor;
	var		selected_nodes		= new Array();
	var		get_handler_obj_fn	= function( curr_node) {
									return jr_EditorInitHandlers( object, curr_node);
								}
	var		start_parent_block;
	var		end_parent_block;

	if (this.no_op) {
		return false;
	}

	jr_EditorGetSelectedNodes(
		object, this.start_parent_el, this.start_text_index, this.end_parent_el, this.end_text_index,
		this.going_backwards, selected_nodes
	);

	if (this.save_selection) {
		object.jr_editor_copied_nodes = jr_EditorCopySelection( object, selected_nodes);
	}

	this.selection_info		= new jr_SelectionClass(
								selected_nodes, this.going_backwards,
								object.jr_editor_edit_el, get_handler_obj_fn
							);

	start_parent_block	= jr_NodeGetParentBlock( this.start_parent_el,	object.jr_editor_edit_el);
	end_parent_block	= jr_NodeGetParentBlock( this.end_parent_el,		object.jr_editor_edit_el);

	jr_SelectionDelete( this.selection_info, start_parent_block, end_parent_block);

	if (this.going_backwards) {
		jr_EditorSetCaretLocation( object, this.end_parent_el, this.end_text_index);
	}
	else {
		jr_EditorSetCaretLocation( object, this.start_parent_el, this.start_text_index);
	}
	jr_EditorUpdateCaret( object);

	jr_EditorSelectionInit( object);

	return true;
}

jr_EditOpDeleteClass.prototype.undoEdit = function()
{
	var		object				= this.jr_editor;

	jr_SelectionUnDelete( this.selection_info);
	jr_EditorSetCaretStartLocation( object, this.start_parent_el, this.start_text_index);

	jr_EditorUpdateCaret( object);
	jr_EditorSelectionInit( object);

	/*
	** 6/30/09: Setting the selection box can change the cursor position if it's in
	** between two spaces, which will elide and the cursor will appear next to following character.
	*/

	jr_EditorSetCaretLocation( object, this.end_parent_el, this.end_text_index);
	jr_EditorUpdateCaret( object);

	jr_EditorHighlightSelection( object);
}

jr_EditOpDeleteClass.prototype.redoEdit = function()
{
	jr_EditorSetCaretLocation( this.jr_editor, this.end_parent_el, this.end_text_index);

	this.doEdit();
}

jr_EditOpDeleteClass.prototype.tryMerge = function( prev_edit_op)
{
	return false;
}

jr_EditOpDeleteClass.prototype.saveEdit = function()
{
}

function jr_SelectionClass( selected_nodes, going_backwards, root_node, get_handler_obj_fn)
{
	var		node_info;

	this.going_backwards		= going_backwards;

	this.selected_nodes_info	= new Array();
	this.root_node				= root_node;
	this.get_handler_obj_fn		= get_handler_obj_fn;

	if (selected_nodes.length === undefined) {
		/*
		** 5/4/2010: selected_nodes is really just a single Dom node
		*/
		node_info	= jr_SelectionCreateNodeInfo( this, selected_nodes);

		this.selected_nodes_info.push( node_info);
	}
	else {
		var		q;

		for (q=0;  q < selected_nodes.length; q++) {
			node_info	= jr_SelectionCreateNodeInfo( this, selected_nodes[q]);

			this.selected_nodes_info.push( node_info);
		}
	}
}

function jr_SelectionCreateNodeInfo( object, selected_node)
{
	var				handler_obj;

	if (object.get_handler_obj_fn) {
		handler_obj		= object.get_handler_obj_fn( selected_node);
	}

	return new jr_SelectionNodeClass( selected_node, handler_obj);
}

function jr_SelectionGetNodeInfo( object, node_index)
{
	return object.selected_nodes_info[node_index];
}

function jr_SelectionGetStartNodeInfo( object)
{
	return object.selected_nodes_info[0];
}

function jr_SelectionGetEndNodeInfo( object)
{
	return object.selected_nodes_info[ object.selected_nodes_info.length - 1];
}

function jr_SelectionDelete( object, start_parent_block, end_parent_block)
{
	var		merge_target_block;
	var		q;

	/*
	** 10/31/09: If the delete spans two block boundaries, delete the end block
	** and add the end block's children to the start block.
	*/

	if (start_parent_block !== end_parent_block) {

		if (	object.going_backwards
			||	jr_NodeIsSubNode( start_parent_block, end_parent_block, object.root_node)) {

			object.merge_src_info	= jr_SelectionCreateNodeInfo( object, start_parent_block);
			merge_target_block		= end_parent_block;
		}
		else {
			object.merge_src_info	= jr_SelectionCreateNodeInfo( object, end_parent_block);
			merge_target_block		= start_parent_block;
		}
	}

	for (q=0 ;  q < object.selected_nodes_info.length; q++) {
		jr_SelectionNodeRemove( object.selected_nodes_info[q]);
	}

	if (object.merge_src_info) {
		/*
		** 10/31/09: If the delete spans two block boundaries, tack
		** the contents of the ending block onto the end of the starting block ** and remove the ending block.
		*/

		jr_SelectionNodeMergeToTarget( object.merge_src_info, merge_target_block);
		jr_SelectionNodeRemove( object.merge_src_info);
	}

	for (q=0 ;  q < object.selected_nodes_info.length; q++) {
		jr_SelectionNodeFinishDelete( object.selected_nodes_info[q]);
	}

	if (object.merge_src_info) {
		jr_SelectionNodeFinishDelete( object.merge_src_info);
	}
}

function jr_SelectionUnDelete( object)
{
	var		q;


	for (q=0 ;  q < object.selected_nodes_info.length; q++) {
		jr_SelectionNodeRestorePrepare( object.selected_nodes_info[q]);
	}
	if (object.merge_src_info) {
		jr_SelectionNodeRestorePrepare( object.merge_src_info);
	}

	if (object.merge_src_info) {
		jr_SelectionNodeUndoMerge( object.merge_src_info);
	}
	/*
	** 5/9/2010: Nodes need to be restored from first to last,
	** otherwise the text indicies will be incorrect.
	*/
	for (q=0 ;  q < object.selected_nodes_info.length; q++) {
		jr_SelectionNodeRestore( object.selected_nodes_info[q]);
	}
	if (object.merge_src_info) {
		jr_SelectionNodeRestore( object.merge_src_info);
	}
}

function jr_SelectionSetIndentEms( object, indent_ems)
{
	object.indent_ems		= indent_ems;
}

function jr_SelectionApplyBlockStyle( object, style_name, style_value)
{
	var		change_indent		= false;
	var		incr_indent;
	var		prev_block_node		= null;
	var		z;

	if (style_name == "marginLeft") {
		change_indent	= true;
		if (style_value == "+") {
			incr_indent	= true;
		}
		else {
			incr_indent	= false;
		}
	}

	if (change_indent) {
		jr_SelectionAnalyzeSiblings( object);

		for (z=0;  z < object.selected_nodes_info.length; z++) {
			prev_block_node	= jr_SelectionNodeChangeIndent(
								object.selected_nodes_info[z], incr_indent, object.indent_ems,
								prev_block_node
							);
		}
	}
	else {

		for (z=0;  z < object.selected_nodes_info.length; z++) {
			prev_block_node	= jr_SelectionNodeApplyBlockStyle(
								object.selected_nodes_info[z], style_name, style_value,
								prev_block_node
							);
		}
	}
}

function jr_SelectionRevertBlockStyle( object, style_name, style_value)
{
	var		change_indent		= false;
	var		incr_indent;
	var		z;

	if (style_name == "marginLeft") {
		change_indent	= true;
		if (style_value == "+") {
			incr_indent	= true;
		}
		else {
			incr_indent	= false;
		}
	}

	for (z=0 ;  z < object.selected_nodes_info.length; z++) {
		if (change_indent) {
			jr_SelectionNodeRevertIndent( object.selected_nodes_info[z], incr_indent);
		}
		else {
			jr_SelectionNodeRevertBlockStyle( object.selected_nodes_info[z]);
		}
	}
}

function jr_SelectionAnalyzeSiblings( object)
{
	var		curr_info;
	var		curr_node;
	var		prev_info				= null;
	var		prev_node				= null;
	var		first_sibling_index		= -1;
	var		z;

	for (z=0;  z < object.selected_nodes_info.length; z++) {
		curr_info		= object.selected_nodes_info[z];
		curr_node		= jr_SelectionNodeValue( curr_info);

		if (curr_node.previousSibling == null) {
			first_sibling_index	= z;
		}
		else if (z > 0  &&  curr_node.previousSibling === prev_node) {
			jr_SelectedNodeSetPreviousSibling( curr_info, prev_info);
		}
		else {
			first_sibling_index	= -1;
		}

		if (false && curr_node.nextSibling == null  &&  first_sibling_index >= 0) {
			var		first_info	= object.selected_nodes_info[first_sibling_index];
			var		last_info	= object.selected_nodes_info[z];
			var		tmp_info;
			var		q;

			for (q=first_sibling_index;  q <= z;  q++) {
				tmp_info		= object.selected_nodes_info[q];

				jr_SelectedNodeSetHasAllSiblings( tmp_info, first_info, last_info);
			}
		}

		prev_info		= curr_info;
		prev_node		= curr_node;
	}
}

function jr_SelectionAddTextNodes( object, source_div)
{
	var		z;
	var		curr_info;
	var		curr_node;

	for (z=0;  z < object.selected_nodes_info.length; z++) {
		curr_info		= object.selected_nodes_info[z];
		curr_node		= jr_SelectionNodeValue( curr_info);

		if (jr_NodeIsText( curr_node)) {
			jr_NodeAppendText( source_div, curr_node.data);
		}
		else {
			jr_NodeAppendText( source_div, curr_node.innerText);
		}
	}
}

function jr_SelectionNodeClass( selected_node, handler_obj)
{
	this.selected_node		= selected_node;
	this.handler_obj		= handler_obj;
	this.parent_node		= jr_NodeGetParent( selected_node);
	this.text_index			= jr_NodeGetTextIndexInParent( selected_node);

	if (handler_obj) {
		if (handler_obj.removeFromDom) {
			this.removeFromDom	= handler_obj.removeFromDom;
		}
		if (handler_obj.restoreToDom) {
			this.restoreToDom	= handler_obj.restoreToDom;
		}
		if (handler_obj.finishDelete) {
			this.finishDelete	= handler_obj.finishDelete;
		}
		if (handler_obj.prepareRestore) {
			this.prepareRestore	= handler_obj.prepareRestore;
		}
		if (handler_obj.incrementNesting) {
			this.incrementNesting	= handler_obj.incrementNesting;
		}
		if (handler_obj.decrementNesting) {
			this.decrementNesting	= handler_obj.decrementNesting;
		}
		if (handler_obj.revertNesting) {
			this.revertNesting	= handler_obj.revertNesting;
		}
	}
	if (! jr_NodeHasCategories( selected_node)) {
		jr_NodeInitCategories( selected_node);
	}
}

function jr_SelectionNodeValue( object)
{
	return object.selected_node;
}

function jr_SelectionNodeGetParentBlock( object, root_node)
{
	return jr_NodeGetParentBlock( object.parent_node, root_node);
}

function jr_SelectedNodeSetPreviousSibling( object, previous_sibling_info)
{
	object.previous_sibling_info			= previous_sibling_info;
	previous_sibling_info.next_sibling_info	= object;
}

function jr_SelectedNodeSetHasAllSiblings( object, first_sibling_info, last_sibling_info)
{
	/*
	** 6-9-2010: unused
	*/
	object.has_all_siblings		= true;
	object.first_sibling_info	= first_sibling_info;
	object.last_sibling_info	= last_sibling_info;
	
	if (object === first_sibling_info) {
		object.is_first_sibling	= true;
	}
	if (object === last_sibling_info) {
		object.is_last_sibling	= true;
	}
}

function jr_SelectionNodeRemove( object)
{
	object.removeFromDom( object.selected_node);
}

function jr_SelectionNodeRestore( object)
{
	object.restoreToDom( object.selected_node, object.parent_node, object.text_index);
}

function jr_SelectionNodeMergeToTarget( object, merge_target_node)
{
	object.merge_target_node		= merge_target_node;
	object.merge_start_index		= jr_NodeGetEndTextIndex( merge_target_node);

	object.mergeToTarget( object.selected_node, merge_target_node);

	object.merge_end_index			= jr_NodeGetEndTextIndex( merge_target_node);
}

function jr_SelectionNodeUndoMerge( object)
{
	object.undoMerge(
		object.selected_node, object.merge_target_node,
		object.merge_start_index, object.merge_end_index
	);
}

function jr_SelectionNodeFinishDelete( object)
{
	if (object.finishDelete) {
		object.finishDelete( object.selected_node);
	}
}

function jr_SelectionNodeRestorePrepare( object)
{
	if (object.prepareRestore) {
		object.prepareRestore( object.selected_node);
	}
}

function jr_SelectionNodeApplyBlockStyle( object, style_name, style_value, prev_block_node)
{
	if (jr_NodeIsBlock( object.selected_node)) {
		object.old_style_name					= style_name;
		object.old_style_value					= jr_ElementGetAssignedStyle( object.selected_node);

		jr_ElementSetStyle( object.selected_node, style_name, style_value);

		prev_block_node = null;
	}
	else {
		if (!prev_block_node) {
			prev_block_node			= jr_NodeInsertBefore( object.selected_node, "div");
			object.new_block_node	= prev_block_node;

			jr_ElementSetStyle( prev_block_node, style_name, style_value);
		}
		jr_NodeAppendChild( prev_block_node, object.selected_node);
	}

	return prev_block_node;
}

function jr_SelectionNodeRevertBlockStyle( object)
{
	if (jr_NodeIsBlock( object.selected_node)) {
		jr_ElementSetStyle( object.selected_node, object.old_style_name, object.old_style_value);
	}
	else if (object.new_block_node) {
		while (object.new_block_node.firstChild) {
			jr_NodeInsertBefore( object.new_block_node, object.new_block_node.firstChild);
		}
		jr_NodeRemoveFromDom( object.new_block_node);

		delete object.new_block_node;
	}
}

function jr_SelectionNodeChangeIndent( object, incr_indent, indent_ems, prev_block_node)
{
	var		changed_nesting		= false;
	var		curr_style_value	= object.selected_node.style["marginLeft"];
	var		curr_indent			= 0;

	if (curr_style_value) {
		if (curr_style_value.indexOf( "em") >= 0) {
			/*
			** 9-22-2010: cancel the indent before changing the nesting.
			** otherwise we'll nest an ex-dented list element or un-nest
			** an indented list element.
			*/
			curr_indent	= Number( jr_GetLeadingNumber( curr_style_value));
		}
		else {
			/*
			** 9-22-2010: indent is not in ems, means element is indented
			** but not by a jr_Editor indent operation.  Need to convert
			** the indent_ems to pixels??
			*/
			alert( "item not idented by ems??");
		}
	}

	if (incr_indent) {
		if (curr_indent < 0  &&  -curr_indent >= indent_ems) {
			/*
			** 9-22-2010: can undo the current margin to get the indent.
			*/
		}
		else if (object.incrementNesting) {
			changed_nesting	= object.incrementNesting( object.selected_node);
		}
	}
	else {
		if (curr_indent > 0  &&  curr_indent >= indent_ems) {
			/*
			** 9-22-2010: can undo the current margin to get the indent.
			*/
		}
		else if (object.decrementNesting) {
			changed_nesting	= object.decrementNesting( object.selected_node);
		}
	}

	if (changed_nesting) {
		prev_block_node = null;
	}
	else {
		if (jr_NodeIsBlock( object.selected_node)) {


			object.old_style_value	= curr_style_value;
			/*
			** 6/1/2010: Don't want the computed style, want the style in ems.
			*/

			if (incr_indent) {
				curr_indent	+= indent_ems;
			}
			else {
				curr_indent	-= indent_ems;
			}

			jr_ElementSetStyle( object.selected_node, "marginLeft", String( curr_indent) + "em");

			prev_block_node = null;
		}
		else {
			if (!prev_block_node) {
				prev_block_node			= jr_NodeInsertBefore( object.selected_node, "div");
				object.new_block_node	= prev_block_node;

				jr_ElementSetStyle( prev_block_node, "marginLeft", String( indent_ems) + "em");
			}
			jr_NodeAppendChild( prev_block_node, object.selected_node);
		}
	}

	return prev_block_node;
}

function jr_SelectionNodeRevertIndent( object, incr_indent)
{
	var		changed_nesting		= false;

	if (jr_NodeIsBlock( object.selected_node)) {
		if (object.revertNesting) {
			changed_nesting	= object.revertNesting( object.selected_node, incr_indent);
		}
		if (! changed_nesting) {
			jr_ElementSetStyle( object.selected_node, "marginLeft", object.old_style_value);
		}
	}
	else if (object.new_block_node) {
		while (object.new_block_node.firstChild) {
			jr_NodeInsertBefore( object.new_block_node, object.new_block_node.firstChild);
		}
		jr_NodeRemoveFromDom( object.new_block_node);

		delete object.new_block_node;
	}
}

jr_SelectionNodeClass.prototype.removeFromDom = function( selected_node)
{
	jr_NodeRemoveFromDom( selected_node);
}

jr_SelectionNodeClass.prototype.restoreToDom = function( selected_node, parent_node, text_index)
{
	jr_NodeRestoreToDom( selected_node, parent_node, text_index);
}

jr_SelectionNodeClass.prototype.mergeToTarget = function( merge_src_node, merge_target_node)
{
	jr_NodeMoveChildren( merge_src_node, merge_target_node);
}

jr_SelectionNodeClass.prototype.undoMerge = function(
		merge_src_node, merge_target_node, merge_start_index, merge_end_index
	)
{
	var		merged_nodes			= new Array();
	var		curr_node;
	var		q;

	jr_NodeGetChildNodesInRange(
		merge_target_node, merge_start_index, merge_end_index, merged_nodes
	);

	for (q=0 ;  q < merged_nodes.length; q++) {
		curr_node		= merged_nodes[q];

		merge_src_node.appendChild( curr_node);
	}
}

/******** Bold selection ********/

function jr_EditOpApplyInlineStyleClass( object, style_name, style_value, default_value) 
{
	this.jr_editor			= object;
	this.has_selection		= object.jr_editor_has_selection;
	this.start_text_index	= object.jr_editor_start_text_index;
	this.start_parent_el	= object.jr_editor_start_parent_el;
	this.end_parent_el		= object.jr_editor_text_node_right.parentNode;
	this.end_text_index		= jr_NodeGetTextIndexInParent( object.jr_editor_text_node_right);
	this.going_backwards	= object.jr_editor_going_backwards;

	this.new_styles			= new Array();

	this.addStyle( style_name, style_value, default_value);
}

jr_EditOpApplyInlineStyleClass.prototype.addStyle = function( style_name, style_value, default_value)
{
	var		style_info		= new Object();

	style_info.style_name		= style_name;
	style_info.style_value		= style_value;
	style_info.default_value	= default_value;

	this.new_styles.push( style_info);
}

jr_EditOpApplyInlineStyleClass.prototype.hasStyles = function( node)
{
	var		style_info;
	var		q;

	for (q=0; q < this.new_styles.length; q++) {
		style_info	= this.new_styles[q];

		if (node.style[style_info.style_name] != style_info.style_value) {
			/*&
			** 11-14-10: don't use jr_ElementGetActiveStyle(), it gets the computed style
			** and color names are turned into rgb() values, and don't match.
			*/
			return false;
		}
	}
	return true;
}

jr_EditOpApplyInlineStyleClass.prototype.setStyles = function( node)
{
	var		style_info;
	var		q;

	for (q=0; q < this.new_styles.length; q++) {
		style_info	= this.new_styles[q];

		jr_ElementSetStyle( node, style_info.style_name, style_info.style_value);
	}
}

jr_EditOpApplyInlineStyleClass.prototype.setDefaultStyles = function( node)
{
	var		style_info;
	var		q;

	for (q=0; q < this.new_styles.length; q++) {
		style_info	= this.new_styles[q];

		jr_ElementSetStyle( node, style_info.style_name, style_info.default_value);
	}
}

jr_EditOpApplyInlineStyleClass.prototype.saveStyles = function( node)
{
	var		old_values	= new Array();
	var		style_info;
	var		old_value;
	var		q;

	for (q=0; q < this.new_styles.length; q++) {
		style_info	= this.new_styles[q];

		old_value	= jr_ElementGetAssignedStyle( node, style_info.style_name);

		old_values.push( old_value);
	}
	return old_values;
}

jr_EditOpApplyInlineStyleClass.prototype.resetStyles = function( node, old_values)
{
	var		style_info;
	var		old_value;
	var		q;

	for (q=0; q < this.new_styles.length; q++) {
		style_info	= this.new_styles[q];
		old_value	= old_values[q];

		if (old_value === undefined) {
			jr_ElementSetStyle( node, style_info.style_name, null);
		}
		else {
			jr_ElementSetStyle( node, style_info.style_name, old_value);
		}
	}
}

jr_EditOpApplyInlineStyleClass.prototype.doEdit = function()
{
	var		object				= this.jr_editor;
	var		selected_nodes;
	var		node;
	var		new_span;
	var		node_info;
	var		new_end_text_index;
	var		already_has_style	= true;
	var		q;

	this.new_spans			= new Array();
	this.existing_nodes		= new Array();
	this.copy_spans			= new Array();

	if (this.has_selection) {

		selected_nodes			= new Array();

		jr_EditorGetSelectedNodes(
			object, this.start_parent_el, this.start_text_index, this.end_parent_el, this.end_text_index,
			this.going_backwards,
			selected_nodes
		);

		for (q=0;  q < selected_nodes.length; q++) {
			node		= selected_nodes[q];

			if (node.nodeType == jr_Node.TEXT_NODE) {
				if (!node.parentNode  ||  !this.hasStyles( node.parentNode)) {
					/*
					** 11/26/09: Need to check before putting in a different span.
					*/
					already_has_style = false;
				}
				if (new_span  &&  new_span === node.previousSibling) {
					/*
					** 11/25/09: Last node was previous sibling of
					** of this one, add consecutive sibling text nodes to the
					** same new span.
					*/
					jr_ElementAppendChild( new_span, node);
				}
				else {
					new_span		= jr_ElementCreate( "span");

					jr_ElementSetClass( new_span, jr_INLINE_STYLE_CLASS);

					jr_NodeReplace( node, new_span);
					jr_NodeAppendChild( new_span, node);
						
					this.new_spans.push( new_span);
				}

				node	= new_span;
			}
			else {
				new_span	= null;

				node_info	= new Object();

				node_info.node			= node;
				node_info.old_values	= this.saveStyles( node);

				if (! this.hasStyles( node)) {
					already_has_style = false;
				}

				this.existing_nodes.push( node_info);
			}

			this.setStyles( node);
		}

		if (already_has_style) {

			for (q=0 ;  q < this.new_spans.length; q++) {
				new_span			= this.new_spans[q];

				this.setDefaultStyles( new_span);
			}
			for (q=0 ;  q < this.existing_nodes.length; q++) {
				node_info			= this.existing_nodes[q];

				this.setDefaultStyles( node_info.node);
			}
			/*
			** 11/27/09: Don't need special undo since it'll reset back
			** to whatever it was before, we're just using a different value.
			*/
		}
	}
	else {
		/*
		** 12-19-2010: no selection, start a new span
		*/
		var		parent_node			= object.jr_editor_text_node_left.parentNode;
		var		has_null_copy_span	= false;
		var		copy_span;
		var		curr_node;
		var		next_node;
		var		q;

		if (parent_node.className == jr_INLINE_STYLE_CLASS) {
			/*
			** 12-19-2010: split the parent span, moving next siblings
			** into an identically styled span. Plop the newly styled
			** span inbetween to avoid nesting spans.
			*/

			copy_span		= parent_node.cloneNode( false);
			jr_NodeAppendAfter( parent_node, copy_span);

			has_null_copy_span	= true;
			curr_node	= object.jr_editor_text_node_right;

			while (curr_node) {
				if (	curr_node.nodeType != jr_Node.TEXT_NODE
					||	curr_node.length > 0) {

					has_null_copy_span	= false;
				}

				next_node	= curr_node.nextSibling;
				jr_ElementAppendChild( copy_span, curr_node);
				curr_node	= next_node;
			}
		}

		if (copy_span) {
			new_span		= jr_ElementInsertBefore( copy_span, "span");
			jr_ElementSetClass( new_span, jr_INLINE_STYLE_CLASS);
		}
		else {
			new_span		= jr_ElementInsertBefore( object.jr_editor_text_node_right, "span");
			jr_ElementSetClass( new_span, jr_INLINE_STYLE_CLASS);
		}

		object.jr_editor_text_node_right	= document.createTextNode("");

		if (this.hasStyles( parent_node)) {
			if (copy_span  &&   parent_node.parentNode.className != jr_INLINE_STYLE_CLASS) {
				/*
				** 12-19-2010: split the parent and it's not a nested span,
				** new text goes in between spans, should be unstyled by default.
				** 12-19-2010 ToDo: what if the parent has more styles, i.e
				** bold italic and we're just undoing the italic?
				*/
				jr_NodeAppendAfter( parent_node, object.jr_editor_text_node_right);
				jr_NodeRemoveFromDom( new_span);
			}
			else {
				this.setDefaultStyles( new_span);
				jr_NodeAppendChild( new_span, object.jr_editor_text_node_right);
			}
		}
		else {
			this.setStyles( new_span);
			this.new_spans.push( new_span);
			jr_NodeAppendChild( new_span, object.jr_editor_text_node_right);
		}
		if (copy_span) {
			if (has_null_copy_span) {
				jr_NodeRemoveFromDom( copy_span);
			}
			else {
				this.copy_spans.push( copy_span);
			}
		}
	}


	jr_EditorHideSelectionBox( object);

	/*
	** 7/8/09: Adding spans changes all subsequent indexing.
	** 11-23-2010 ToDo: cursor will be just past the new span,
	** so new characters won't have the new style.
	*/
	new_end_text_index		= jr_NodeGetTextIndexInParent( object.jr_editor_text_node_right);

	jr_EditorSetCaretStartLocation(
		object, object.jr_editor_text_node_right.parentNode, new_end_text_index
	);
	jr_EditorUpdateCaret( object);

	return true;
}

jr_EditOpApplyInlineStyleClass.prototype.undoEdit = function()
{
	var		object				= this.jr_editor;
	var		new_span;
	var		sub_node;
	var		text_node;
	var		node_info;
	var		q;
	var		z;

	if (this.has_selection) {
		for (q=0 ;  q < this.new_spans.length; q++) {
			new_span			= this.new_spans[q];

			/*
			** 7/8/09: The span's text could have been split by clicking
			** Concatenate it all back together as it was before.
			*/
			text_node			= null;

			for( z=0; z < new_span.childNodes.length; z++) {

				sub_node	= new_span.childNodes[z];

				if (sub_node.nodeType != jr_Node.TEXT_NODE) {
					throw new Error( "sub node of newly added span not a text node??");
				}
				if (sub_node.length > 0) {
					if (! text_node) {
						text_node	= document.createTextNode("");

						jr_NodeInsertBefore( new_span, text_node);
					}
					text_node.appendData( sub_node.data);
				}
			}
			jr_NodeRemoveFromDom( new_span);
		}

		for (q=0 ;  q < this.existing_nodes.length; q++) {
			node_info			= this.existing_nodes[q];

			this.resetStyles( node_info.node, node_info.old_values);
		}
	}
	else {
		var		copy_src_node;

		for (q=0 ;  q < this.new_spans.length; q++) {
			new_span			= this.new_spans[q];
			jr_NodeRemoveFromDom( new_span);
		}
		for (q=0 ;  q < this.copy_spans.length; q++) {
			copy_span			= this.copy_spans[q];

			copy_src_node		= copy_span.previousSibling;

			while (copy_src_node  &&  copy_src_node.className != jr_INLINE_STYLE_CLASS) {
				copy_src_node	= copy_src_node.previousSibling;
			}
			if (copy_src_node) {
				jr_NodeMoveChildren( copy_span, copy_src_node);
			}
			jr_NodeRemoveFromDom( copy_span);
		}
	}


	jr_EditorSetCaretStartLocation( object, this.start_parent_el, this.start_text_index);
	jr_EditorUpdateCaret( object);
	jr_EditorSelectionInit( object);

	jr_EditorSetCaretLocation( object, this.end_parent_el, this.end_text_index);
	jr_EditorUpdateCaret( object);
	jr_EditorHighlightSelection( object);
}

jr_EditOpApplyInlineStyleClass.prototype.redoEdit = function()
{
	jr_EditorSetCaretLocation( this.jr_editor, this.end_parent_el, this.end_text_index);

	this.doEdit();
}

jr_EditOpApplyInlineStyleClass.prototype.tryMerge = function( prev_edit_op)
{
	return false;
}

jr_EditOpApplyInlineStyleClass.prototype.saveEdit = function()
{
}

/******** Block Styles Selection ********/

function jr_EditOpApplyBlockStyleClass( object, style_name, style_value)
{
	this.jr_editor			= object;
	this.has_selection		= object.jr_editor_has_selection;
	this.going_backwards	= object.jr_editor_going_backwards;
	this.start_text_index	= object.jr_editor_start_text_index;
	this.start_parent_el	= object.jr_editor_start_parent_el;

	this.end_parent_el		= object.jr_editor_text_node_right.parentNode;
	this.end_text_index		= jr_NodeGetTextIndexInParent( object.jr_editor_text_node_right);

	this.style_name			= style_name;
	this.style_value		= style_value;
}

jr_EditOpApplyBlockStyleClass.prototype.doEdit = function()
{
	var		object				= this.jr_editor;
	var		get_handler_obj_fn	= function( curr_node) {
									return jr_EditorInitHandlers( object, curr_node);
								}
	var		change_indent		= false;
	var		incr_indent			= false;
	var		curr_indent;
	var		selected_nodes;
	var		curr_node;
	var		new_block_node;
	var		style_info;
	var		new_nested_list;
	var		change_sub_list;
	var		q;

	selected_nodes			= new Array();

	if (this.has_selection) {
		jr_EditorGetSelectedBlocks(
			object,
			this.start_parent_el, this.start_text_index,
			this.end_parent_el, this.end_text_index,
			this.going_backwards, selected_nodes
		);
	}
	else {
		var		end_node;

		end_node	= jr_NodeGetChildAtTextIndex( this.end_parent_el, this.end_text_index);
		curr_node	= jr_NodeGetParentBlock( end_node,		object.jr_editor_edit_el);

		if (!curr_node) {
			curr_node		= end_node;
		}
		selected_nodes.push( curr_node);
	}

	this.selection_info		= new jr_SelectionClass(
								selected_nodes, this.going_backwards,
								object.jr_editor_edit_el, get_handler_obj_fn
							);

	jr_SelectionSetIndentEms( this.selection_info, object.jr_editor_indent_ems);

	jr_SelectionApplyBlockStyle( this.selection_info, this.style_name, this.style_value);

	/*
	** 10/8/09 ToDo: resetting the highlight is broken
	*/
	if (this.has_selection) {

		jr_EditorSetCaretStartLocation( object, this.start_parent_el, this.start_text_index);
		jr_EditorUpdateCaret( object);
		jr_EditorSelectionInit( object);

		jr_EditorSetCaretLocation( object, this.end_parent_el, this.end_text_index);
		jr_EditorUpdateCaret( object);
		jr_EditorHighlightSelection( object);
	}
	else {
		jr_EditorSetCaretLocation( object, this.end_parent_el, this.end_text_index);
		jr_EditorUpdateCaret( object);
		jr_EditorSelectionInit( object);
	}

	return true;
}

jr_EditOpApplyBlockStyleClass.prototype.undoEdit = function()
{
	var		object				= this.jr_editor;
	var		style_info;
	var		new_block_node;
	var		curr_node;
	var		q;

	jr_SelectionRevertBlockStyle( this.selection_info, this.style_name, this.style_value);

	jr_EditorSetCaretStartLocation( object, this.start_parent_el, this.start_text_index);
	jr_EditorUpdateCaret( object);
	jr_EditorSelectionInit( object);

	if (this.has_selection) {
		/*
		** 10/8/09 ToDo: resetting the highlight is broken
		*/

		jr_EditorSetCaretLocation( object, this.end_parent_el, this.end_text_index);
		jr_EditorUpdateCaret( object);
		jr_EditorHighlightSelection( object);
	}
}

jr_EditOpApplyBlockStyleClass.prototype.redoEdit = function()
{
	this.doEdit();
}

jr_EditOpApplyBlockStyleClass.prototype.tryMerge = function( prev_edit_op)
{
	return false;
}

jr_EditOpApplyBlockStyleClass.prototype.saveEdit = function()
{
}


/******** Block Changes ********/

function jr_EditOpChangeBlockStructureClass( object, block_name)
{
	this.jr_editor			= object;
	this.has_selection		= object.jr_editor_has_selection;
	this.going_backwards	= object.jr_editor_going_backwards;

	this.start_parent_el	= object.jr_editor_start_parent_el;
	this.start_text_index	= object.jr_editor_start_text_index;

	this.end_parent_el		= object.jr_editor_text_node_right.parentNode;
	this.end_text_index		= jr_NodeGetTextIndexInParent( object.jr_editor_text_node_right);

	this.block_name			= block_name;
	this.undo_structure		= false;

	if (jr_IsListTag( block_name)) {
		this.do_list		= true;
		this.tag_name		= "LI";
	}
}

jr_EditOpChangeBlockStructureClass.prototype.doEdit = function()
{
	var		object					= this.jr_editor;
	var		new_tag_name			= this.tag_name;
	var		selected_nodes;
	var		curr_node;
	var		num_already_correct		= 0;
	var		new_node;
	var		new_parent_el;
	var		new_next_sibling;
	var		old_parent_node;
	var		element_info;
	var		q;

	selected_nodes			= new Array();

	if (this.has_selection) {
		jr_EditorGetSelectedBlocks(
			object,
			this.start_parent_el, this.start_text_index,
			this.end_parent_el, this.end_text_index,
			this.going_backwards, selected_nodes
		);
	}
	else {
		var		end_node;

		end_node	= jr_NodeGetChildAtTextIndex( this.end_parent_el, this.end_text_index);
		curr_node	= jr_NodeGetParentBlock( end_node,		object.jr_editor_edit_el);

		if (!curr_node) {
			curr_node		= end_node;
		}
		selected_nodes.push( curr_node);
	}


	this.existing_elements	= new Array();

	for (q=0;  q < selected_nodes.length; q++) {
		curr_node		= selected_nodes[q];

		jr_NodeInitCategories( curr_node);

		if (curr_node.jr_is_block) {
			if (curr_node.tagName == this.tag_name) {
				num_already_correct++;
			}
		}
	}

	if (num_already_correct  ==  selected_nodes.length) {
		this.undo_structure	= true;

		if (!this.do_list) {
			alert( "undoing formating for '" + this.tag_name + "' not implemented");
			return false;
		}
	}

	if (selected_nodes.length > 0) {
		curr_node			= selected_nodes[0];

		if (this.undo_structure) {
			if (this.do_list) {
				/*
				** 9-22-2010: The new parent is actually the grand-parent,
				** i.e. the parent of the OL/UL etc. containing curr_node
				*/
				if (curr_node.previousSibling) {
					new_parent_el		= curr_node.parentNode.parentNode;
					new_next_sibling	= curr_node.parentNode.nextSibling;
				}
				else {
					/*
					** 9-22-2010: Is first LI, prepend to current OL/UL (parent)
					*/
					new_parent_el		= curr_node.parentNode.parentNode;
					new_next_sibling	= curr_node.parentNode;
				}

				/*
				** 9-22-2010: if we're undoing an LI but the new parent is a list
				** the tag should still be an LI. Has the effect of undoing indent.
				*/
				if (jr_NodeIsListEntry( new_parent_el)) {
					new_tag_name	= "LI";
				}
				else {
					new_tag_name	= "P";
				}
			}
			else {
				/*
				** 9-22-2010: undoing other structures not implemented yet
				*/
			}
		}
		else {
			new_parent_el		= jr_NodeInsertBefore( curr_node, this.block_name);
		}
		this.new_parent_el	= new_parent_el;
	}

	for (q=0;  q < selected_nodes.length; q++) {
		curr_node			= selected_nodes[q];
		old_parent_node		= curr_node.parentNode;


		if (	!curr_node.jr_is_block
			&&  element_info  &&  element_info.old_parent_node === old_parent_node) {
			/*
			** 10/16/09: Add to the previously created new element.
			** Update the old_node, next_sibling, parent should be the same.
			*/
			element_info.old_node			= curr_node;
			element_info.old_next_sibling	= curr_node.nextSibling;

			jr_NodeAppendChild( element_info.new_node, curr_node);
		}
		else {
			new_node						= jr_ElementCreate( new_tag_name);

			element_info					= new Object();
			element_info.new_node			= new_node;
			element_info.old_node			= curr_node;
			element_info.old_parent_node	= curr_node.parentNode;
			element_info.old_next_sibling	= curr_node.nextSibling;

			this.existing_elements.push( element_info);


			if (this.undo_structure) {
				if (this.do_list) {
					if (new_next_sibling) {
						jr_NodeInsertBefore( new_next_sibling, new_node);
					}
					else {
						jr_NodeAppendChild( new_parent_el, new_node);
					}
				}
				else {
					/*
					** 9-22-2010: undoing other structures not implemented yet
					*/
				}
			}
			else {
				jr_NodeAppendChild( new_parent_el, new_node);
			}

			if (curr_node.jr_is_block) {
				jr_NodeMoveChildren( curr_node, new_node);
				jr_NodeRemoveFromDom( curr_node);

				element_info		= null;
			}
			else {
				jr_NodeAppendChild( new_node, curr_node);
			}
		}

		if (!old_parent_node.hasChildNodes()) {
			element_info					= new Object();
			element_info.old_node			= old_parent_node;
			element_info.old_parent_node	= old_parent_node.parentNode;
			element_info.old_next_sibling	= old_parent_node.nextSibling;

			this.existing_elements.push( element_info);
			element_info		= null;

			jr_NodeRemoveFromDom( old_parent_node);
		}
	}

	/*
	** 10/8/09 ToDo: Need to update the cursor since the layout changed.
	*/

	new_end_text_index		= jr_NodeGetTextIndexInParent( object.jr_editor_text_node_right);

	jr_EditorSetCaretStartLocation( object, object.jr_editor_text_node_right.parentNode, new_end_text_index);
	jr_EditorUpdateCaret( object);
	jr_EditorSelectionInit( object);

	jr_EditorSelectionInit( object);

	return true;
}

jr_EditOpChangeBlockStructureClass.prototype.undoEdit = function()
{
	var		object				= this.jr_editor;
	var		element_info;
	var		q;

	for (q = this.existing_elements.length-1;  q >= 0;  q--) {
		element_info			= this.existing_elements[q];

		if (!element_info.old_node.parentNode) {
			/*
			** 10/16/09: This case covers the deleted parents and deleted block nodes
			*/
			if (element_info.old_next_sibling) {
				jr_NodeInsertBefore( element_info.old_next_sibling, element_info.old_node);
			}
			else {
				jr_NodeAppendChild( element_info.old_parent_node, element_info.old_node);
			}
		}

		if (element_info.new_node) {
			if (element_info.old_node.jr_is_block) {
				jr_NodeMoveChildren( element_info.new_node, element_info.old_node);
			}
			else if (element_info.old_next_sibling) {
				jr_NodeMoveChildrenBefore( element_info.new_node, element_info.old_next_sibling);
			}
			else {
				jr_NodeMoveChildren( element_info.new_node, element_info.old_parent_node);
			}
			jr_NodeRemoveFromDom( element_info.new_node);
		}
	}


	if (this.new_parent_el) {
		if (!this.undo_structure) {
			jr_NodeRemoveFromDom( this.new_parent_el);
		}
	}
	/*
	** 10/8/09 ToDo: resetting the highlight is broken
	*/

	jr_EditorSetCaretStartLocation( object, this.start_parent_el, this.start_text_index);
	jr_EditorUpdateCaret( object);
	jr_EditorSelectionInit( object);

	if (this.has_selection) {

		jr_EditorSetCaretLocation( object, this.end_parent_el, this.end_text_index);
		jr_EditorUpdateCaret( object);
		jr_EditorHighlightSelection( object);
	}
	jr_EditorUpdateBackgroundHeight( object);
}

jr_EditOpChangeBlockStructureClass.prototype.redoEdit = function()
{
	jr_EditorSetCaretLocation( this.jr_editor, this.end_parent_el, this.end_text_index);

	this.doEdit();
}

jr_EditOpChangeBlockStructureClass.prototype.tryMerge = function( prev_edit_op)
{
	return false;
}

jr_EditOpChangeBlockStructureClass.prototype.saveEdit = function()
{
}

/******** New Section ********/

function jr_EditOpNewSectionClass( object)
{
	this.jr_editor			= object;
}

jr_EditOpNewSectionClass.prototype.doEdit = function ()
{
	var		object				= this.jr_editor;
	var		section_div			= jr_EditorSectionDivCreate();
	var		is_appended			= false;

	var		parent_block;
	var		parent_structure;
	var		heading_div;


	if (object.jr_editor_text_node_right) {
		/*
		** 11/24/09: remove the parent block later, contents becoming heading.
		*/
		parent_block		= jr_NodeGetParentBlock(
								object.jr_editor_text_node_right, object.jr_editor_edit_el
							);

		parent_structure	= jr_NodeGetParentStructure(
								object.jr_editor_text_node_right, object.jr_editor_edit_el
							);

		if (!parent_block) {
			/*
			** 11/24/09: unnested text node underneath the jr_editor_edit_el?
			*/
			jr_ElementInsertBefore( object.jr_editor_text_node_right, section_div);
		}
		else if (!parent_structure) {
			jr_ElementInsertBefore( parent_block, section_div);
		}
		else {
			if (parent_structure.jr_is_JR_SECTION_HEADING) {
				/*
				** 11/24/09 ToDo: undo the section, i.e. make plain contents again
				*/
				return false;
			}
			else if (parent_structure.jr_is_JR_SECTION_BODY) {
				jr_EditorSectionNodeInit( parent_structure);
				if (parent_structure.jr_section_div.parentNode === object.jr_editor_edit_el) {
					/*
					** 11/24/09: Nest a new section inside the current one.
					*/
					jr_ElementInsertBefore( parent_block, section_div);
				}
				else {
					/*
					** 11/24/09: append a new section after the current one.
					*/
					jr_ElementAppendAfter( parent_structure.parentNode, section_div);
					is_appended		= true;
				}
			}
			else {
				/*
				** 11/24/09: Nest a new section inside the structural element.
				** essentially replace the parent block.
				*/
				jr_ElementInsertBefore( parent_block, section_div);
			}
		}
	}
	else {
		/*
		** 11/11/09: No element selected yet.
		*/
		jr_ElementAppendChild( object.jr_editor_edit_el, section_div);
	}

	heading_div		= section_div.jr_section_heading_div;

	if (parent_block) {

		while (parent_block.firstChild) {
			jr_ElementAppendChild( heading_div, parent_block.firstChild);
		}

		jr_EditorInitHandlers( object, parent_block);

		this.old_parent_block	= parent_block;
	}
	else if (object.jr_editor_text_node_right) {
		/*
		** 11/24/09: unnested text node underneath the jr_editor_edit_el?
		*/
		var		edit_el			= object.jr_editor_edit_el;

		while (edit_el.firstChild) {
			jr_ElementAppendChild( heading_div, edit_el.firstChild);
		}
		jr_ElementAppendChild( edit_el, section_div);
	}
	else {
		jr_EditorDivSetDefaultText( heading_div,		"Click to add title");
	}

	this.section_div			= section_div;
	this.heading_div			= section_div.jr_section_heading_div;
	this.body_div				= section_div.jr_section_body_div;
	this.is_appended			= is_appended;

	jr_EditorUpdateCaret( object);

	return true;
}


jr_EditOpNewSectionClass.prototype.undoEdit = function ()
{
	var		q;

	if (this.old_parent_block) {
		var		heading_div		= this.heading_div;

		jr_NodeAppendAfter( this.section_div, this.old_parent_block);

		while (heading_div.firstChild) {
			jr_ElementAppendChild( this.old_parent_block, heading_div.firstChild);
		}
	}
	jr_ElementRemoveFromDom( this.section_div);
}

jr_EditOpNewSectionClass.prototype.redoEdit = function ()
{
	this.doEdit();
}

jr_EditOpNewSectionClass.prototype.tryMerge = function ()
{
	return false;
}


/******** Source Block ********/

function jr_EditOpSourceBlockClass( object)
{
	this.jr_editor			= object;
	this.has_selection		= object.jr_editor_has_selection;

	if (this.has_selection) {
		this.delete_op		= jr_EditorDeleteOpCreate( object, jr_NULL_KEY_CODE, false);
	}
	else {
		this.start_parent_el		= object.jr_editor_text_node_right.parentNode;
		this.start_text_index		= jr_NodeGetTextIndexInParent( object.jr_editor_text_node_right);
	}
}

jr_EditOpSourceBlockClass.prototype.doEdit = function ()
{
	/*
	** 11-23-10: get selected nodes, delete them, copy the text into
	** the source block?
	** If the cursor is at the of a block, open empty source block below,
	** it it's at the beginning open an empty one above?
	*/
	var		object				= this.jr_editor;
	var		source_div			= jr_EditorSourceBlockCreate();
	var		next_element;
	var		retval;

	if (this.has_selection) {
		retval	= this.delete_op.doEdit();

		if (!retval) {
			return false;
		}
		jr_SelectionAddTextNodes( this.delete_op.selection_info, source_div);
	}
	else {
		/*
		** 11-24-2010: add a source block inline
		*/
		jr_EditorSetCaretLocation( object, this.start_parent_el, this.start_text_index);
	}

	jr_ElementAppendAfter( object.jr_editor_text_node_left, source_div);

	this.source_div				= source_div;

	jr_EditorSetCaretStartLocation( object, source_div, 0);
	jr_EditorUpdateCaret( object);
	jr_EditorUpdateBackgroundHeight( object);

	return true;
}


jr_EditOpSourceBlockClass.prototype.undoEdit = function ()
{
	var		object				= this.jr_editor;

	if (this.has_selection) {
		this.delete_op.undoEdit();
	}

	jr_ElementRemoveFromDom( this.source_div);
}

jr_EditOpSourceBlockClass.prototype.redoEdit = function ()
{
	this.doEdit();
}

jr_EditOpSourceBlockClass.prototype.tryMerge = function ()
{
	return false;
}


/******** Edit Handlers: generic API for inserting newlines, deleting selections, etc. ********/

function jr_EditHandlerCreate(opt_tag_name)
{
	return new jr_EditHandler(opt_tag_name);
}

function jr_EditHandler(opt_tag_name)
{
	if (opt_tag_name) {
		this.tag_name	= opt_tag_name;
	}
}

jr_EditHandler.prototype.initNode				= function( node)
{
	/*
	** 7-24-2010: initialize any dynamic parts of the node, i.e. JS object fields
	*/
}

jr_EditHandler.prototype.hasPreWhitespace	= function()
{
	return false;
}

jr_EditHandler.prototype.insertNewlineIsAllowed	= function()
{
	return true;
}

jr_EditHandler.prototype.insertNewlineNodeCreate	= function()
{
	return document.createElement( "P");
}

jr_EditHandler.prototype.insertNewlineNodeAfter	= function( new_el, parent_block)
{
	jr_NodeAppendAfter( parent_block, new_el);
}

jr_EditHandler.prototype.insertNewlineNodeBefore	= function( new_el, parent_block)
{
	jr_NodeInsertBefore( parent_block, new_el);
}

function jr_EditHandlerDIVCreate()
{
	return new jr_EditHandlerDIV();
}

function jr_EditHandlerDIV()
{
}

jr_EditHandlerDIV.prototype	= jr_EditHandlerCreate( "DIV");

jr_EditHandlerDIV.prototype.insertNewlineNodeAfter	= function( new_el, parent_block)
{
	jr_NodeAppendChild( parent_block, new_el);
}

jr_EditHandlerDIV.prototype.insertNewlineNodeBefore	= function( new_el, parent_block)
{
	jr_NodePrependChild( parent_block, new_el);
}


function jr_EditHandlerLICreate()
{
	return new jr_EditHandlerLI();
}

function jr_EditHandlerLI()
{
}

jr_EditHandlerLI.prototype	= jr_EditHandlerCreate( "LI");

jr_EditHandlerLI.prototype.insertNewlineNodeCreate	= function()
{
	return document.createElement( "LI");
}

jr_EditHandlerLI.prototype.removeFromDom	= function( selected_node)
{
	var		parent_node;

	if (this.parent_node.childNodes.length == 1) {
		/*
		** 12-17-2010: the outer UL contains only this entry, delete it too.
		*/
		this.list_node			= jr_NodeGetParent( this.parent_node);
		this.parent_text_index	= jr_NodeGetTextIndexInParent( this.parent_node);
		jr_NodeRemoveFromDom( this.parent_node);
		this.removed_parent_node	= true;

		if (this.merge_start_index !== undefined) {
			/*
			** 12-18-2010: The list node increments the position of the merge text.
			** If we delete it, the merged text will occur one position earlier.
			** To test, delete the newline of a nested list and then undo.
			*/
			this.merge_start_index--;
		}
	}
	else {
		jr_NodeRemoveFromDom( selected_node);
	}
}

jr_EditHandlerLI.prototype.restoreToDom	= function( selected_node, parent_node, text_index)
{
	if (this.removed_parent_node) {
		jr_NodeRestoreToDom( this.parent_node, this.list_node, this.parent_text_index);
	}
	else {
		jr_NodeRestoreToDom( selected_node, parent_node, text_index);
	}
}

jr_EditHandlerLI.prototype.incrementNesting	= function( selected_node)
{
	/*
	** 6-3-2010 increment cases:
	** - has prev LI:		add sub-list
	** - no prev LI:		plain indent
	**
	** Corner cases: non-LI nodes in-between the LIs
	** - should be taken care of by this logic.
	*/
	if (this.previous_sibling_info) {
		/*
		** 6-3-2010: non-first part of sequence of siblings.
		*/
		if (this.previous_sibling_info.has_nesting_change) {
			/*
			** 6-5-2010: Previous element was nested, add this node after the previous
			*/
			jr_NodeAppendAfter( this.previous_sibling_info.selected_node, selected_node);
			this.has_nesting_change	= true;
		}
		else {
			/*
			** 6-6-2010: prev element was first LI, so plain indent.
			*/
			this.has_nesting_change	= false;
		}
	}
	else {
		/*
		** 6-2-2010: First indented sibling in a sequence.
		** If the previous sibling is an LI, add a new sub list.
		*/
		if (jr_NodeIsListEntry( selected_node.previousSibling)) {
			this.new_nested_parent_node	= jr_NodeAppendChild(
											selected_node.previousSibling,
											selected_node.parentNode.tagName
										);
			jr_NodeAppendChild( this.new_nested_parent_node, selected_node);
			this.has_nesting_change	= true;
		}
		else {
			/*
			** 6-3-2010: all prior nodes were non-LI. Use a plain indent.
			*/
			this.has_nesting_change	= false;
		}
	}

	return this.has_nesting_change;
}

jr_EditHandlerLI.prototype.decrementNesting	= function( selected_node)
{
	/*
	** 6-6-2010 decrement cases:
	**
	** Corner cases: non-LI nodes in-between the LIs
	** - should be taken care of by this logic.
	*/
	var		curr_list	= selected_node.parentNode;

	if (jr_NodeIsListEntry( curr_list.parentNode)) {
		/*
		** 6-6-2010: The current list is in an LI.
		** If the selected node is the first or last node in the current list,
		** move it to the parent list.
		*/
		this.old_nested_list	= curr_list;

		if (jr_NodeIsFirstNonEmpty( selected_node)) {
			this.was_first_child	= true;
			this.has_nesting_change	= true;
		}
		else if (jr_NodeIsLastNonEmpty( selected_node)) {
			this.was_first_child	= false;
			this.has_nesting_change	= true;
		}
		else {
			this.has_nesting_change	= false;
		}

		if (this.has_nesting_change) {
			/*
			** 6-8-2010: move the current node after the LI in the parent list
			*/
			jr_NodeAppendAfter( curr_list.parentNode, selected_node);

			if (this.was_first_child) {
				/*
				** 6-8-2010: all the parent LI's (curr_list.parentNode) children starting
				** with curr_list should be children of the selected node.
				*/
				var		curr_node		= curr_list;

				this.first_added_child	= curr_list;

				while (curr_node) {
					next_node	= curr_node.nextSibling;

					jr_NodeAppendChild( selected_node, curr_node);

					curr_node	= next_node;
				}
			}

			if (!this.old_nested_list.firstChild) {
				this.first_added_child	= this.old_nested_list.nextSibling;
				jr_NodeRemoveFromDom( this.old_nested_list);
			}
		}
		else {
			delete this.old_nested_list;
		}
	}
	else {
		/*
		** 6-8-2010: The list parent isn't an LI
		*/
		this.has_nesting_change	= false;
	}

	return this.has_nesting_change;
}

jr_EditHandlerLI.prototype.revertNesting	= function( selected_node, incr_indent)
{
	if (incr_indent) {
		if (this.new_nested_parent_node) {
			/*
			** 6/3/2010: move all the children after the parent of the new nested node.
			** If a new LI was created as well, move the children after that instead.
			*/
			var		new_sub_list		= this.new_nested_parent_node;
			var		after_node			= this.new_nested_parent_node.parentNode;

			if (this.new_prev_LI_el) {
				after_node	= this.new_prev_LI_el;
			}
			while (new_sub_list.firstChild) {
				after_node = jr_NodeAppendAfter( after_node, new_sub_list.firstChild);
			}
			jr_NodeRemoveFromDom( this.new_nested_parent_node);

			if (this.new_prev_LI_el) {
				jr_NodeRemoveFromDom( this.new_prev_LI_el);
			}
		}
	}
	else {
		if (this.old_nested_list) {
			if (! this.old_nested_list.parentNode) {
				jr_NodeAppendChild( selected_node.previousSibling, this.old_nested_list);
			}

			if (this.was_first_child) {
				var		curr_node	= this.first_added_child;
				var		next_node;

				while (curr_node) {
					next_node	= curr_node.nextSibling;

					jr_NodeAppendChild( selected_node.previousSibling, curr_node);

					curr_node	= next_node;
				}

				jr_NodePrependChild( this.old_nested_list, selected_node);
			}
			else {
				jr_NodeAppendChild( this.old_nested_list, selected_node);
			}
		}
	}

	return this.has_nesting_change;
}

function jr_EditHandlerDDCreate()
{
	return new jr_EditHandlerDD();
}

function jr_EditHandlerDD()
{
}

jr_EditHandlerDD.prototype	= jr_EditHandlerCreate( "DD");

jr_EditHandlerDD.prototype.insertNewlineNodeCreate	= function()
{
	return document.createElement( "DD");
}


function jr_EditHandlerDTCreate()
{
	return new jr_EditHandlerDT();
}

function jr_EditHandlerDT()
{
}

jr_EditHandlerDT.prototype	= jr_EditHandlerCreate( "DT");

jr_EditHandlerDT.prototype.insertNewlineNodeCreate	= function()
{
	return document.createElement( "DT");
}


/******** Custom Edit Operation: New Section ********/

var		jr_EDIT_SECTION_TAG_NAME			= "JR_SECTION";
var		jr_EDIT_SECTION_HEADING_TAG_NAME	= "JR_SECTION_HEADING";
var		jr_EDIT_SECTION_BODY_TAG_NAME		= "JR_SECTION_BODY";

jr_AddStructuralTag( jr_EDIT_SECTION_HEADING_TAG_NAME);
jr_AddStructuralTag( jr_EDIT_SECTION_BODY_TAG_NAME);
jr_AddBlockTag( jr_EDIT_SECTION_TAG_NAME);
jr_AddBlockTag( jr_EDIT_SECTION_HEADING_TAG_NAME);
jr_AddBlockTag( jr_EDIT_SECTION_BODY_TAG_NAME);


function jr_EditorSectionDivCreate()
{
	var		section_div		= jr_ElementCreate( "div");
	var		heading_div		= jr_ElementAppendChild( section_div,	"div");
	var		body_div		= jr_ElementAppendChild( section_div,	"div");

	jr_ElementSetClass( section_div,	jr_EDIT_SECTION_TAG_NAME);
	jr_ElementSetClass( heading_div,	jr_EDIT_SECTION_HEADING_TAG_NAME);
	jr_ElementSetClass( body_div,		jr_EDIT_SECTION_BODY_TAG_NAME);

	jr_ElementSetAttr( section_div,	jr_TAG_ATTR_NAME,	jr_EDIT_SECTION_TAG_NAME);
	jr_ElementSetAttr( heading_div,	jr_TAG_ATTR_NAME,	jr_EDIT_SECTION_HEADING_TAG_NAME);
	jr_ElementSetAttr( body_div,		jr_TAG_ATTR_NAME,	jr_EDIT_SECTION_BODY_TAG_NAME);

	/*
	** 11/24/09: to enable getElementByName() of all sections
	*/

	jr_ElementSetStyle( heading_div,	"position", 		"relative");
	jr_ElementSetStyle( heading_div,	"width", 			"100%");
	jr_ElementSetStyle( heading_div,	"fontWeight", 		"bold");

	jr_ElementSetStyle( body_div,		"position", 		"relative");
	jr_ElementSetStyle( body_div,		"width",	 		"100%");

	jr_EditorSectionDivInit( section_div, heading_div, body_div);

	return section_div;
}

function jr_EditorSectionDivInit( section_div, opt_heading_div, opt_body_div)
{
	var		heading_div;
	var		body_div;

	if (opt_heading_div === undefined  ||  opt_body_div === undefined) {
		var		child_node;
		var		attr_name;

		for (	child_node = section_div.firstChild;
				child_node != null;
				child_node = child_node.nextSibling
		) {

			attr_name	= jr_ElementGetAttr( child_node, jr_TAG_ATTR_NAME);

			if (attr_name == jr_EDIT_SECTION_HEADING_TAG_NAME) {
				heading_div	= child_node;
			}
			if (attr_name == jr_EDIT_SECTION_BODY_TAG_NAME) {
				body_div	= child_node;
			}
		}
		if (heading_div === undefined) {
			throw new Error( "element is not a section");
		}
	}
	else {
		heading_div	= opt_heading_div;
		body_div	= opt_body_div;
	}

	section_div.jr_section_heading_div		= heading_div;
	section_div.jr_section_body_div			= body_div;

	heading_div.jr_section_div				= section_div;
	heading_div.jr_section_is_heading		= true;

	body_div.jr_section_div					= section_div;
	body_div.jr_section_is_body				= true;
}

function jr_EditorSectionSetHeadingStyle( section_div, style_name, style_value)
{
	if (section_div.jr_section_heading_div === undefined) {
		jr_EditorSectionDivInit( section_div);
	}

	jr_ElementSetStyle( section_div.jr_section_heading_div, style_name, style_value);
}

function jr_IsEditorSectionDiv( some_node)
{
	if (some_node.className == jr_EDIT_SECTION_TAG_NAME) {
		return true;
	}
	return false;
}

function jr_EditorSectionHeadingDiv( section_div)
{
	if (section_div.jr_section_heading_div === undefined) {
		jr_EditorSectionDivInit( section_div);
	}
	return section_div.jr_section_heading_div;
}

function jr_EditorSectionBodyDiv( section_div)
{
	if (section_div.jr_section_heading_div === undefined) {
		jr_EditorSectionDivInit( section_div);
	}
	return section_div.jr_section_body_div;
}

var jr_EditorSectionNodeInit = function( section_node)
{
	var		attr_name	= jr_ElementGetAttr( section_node, jr_TAG_ATTR_NAME);

	/*
	** 7-24-2010: Can be used for the section parent, header, and body nodes
	*/
	if (attr_name == jr_EDIT_SECTION_TAG_NAME) {
		jr_EditorSectionDivInit( section_node);
	}
	if (attr_name == jr_EDIT_SECTION_BODY_TAG_NAME) {
		jr_EditorSectionDivInit( section_node.parentNode);
	}
}

var jr_EditorSectionNodeRemoveFromDom = function( deleted_node)
{
	if (!deleted_node.jr_section_is_heading) {
		/*
		** 5/24/2010: Not possible to get the body element in the selected nodes
		** since it's two levels away from text nodes.
		*/
		throw new Error( "called on body");
	}

	/*
	** 5/24/2010: we'll remove the section nodes in the cleanup function
	** after any merge.
	*/
}

var jr_EditorSectionNodeFinishDelete = function( deleted_node)
{
	var		section_div	= deleted_node.jr_section_div;
	var		body_div	= section_div.jr_section_body_div;

	/*
	** 5/24/2010: only called if the heading has been deleted.
	** Either the delete ended in the heading or in the body.
	** If it ended in the heading, the heading should be empty,
	** and we should move the body blocks to before/after the section
	** element, then remove the section element
	** If the delete ended in the body, we should take the remaining
	** body blocks and move them before/after the section element,
	** then remove the section element.
	*/
	section_div.jr_section_parent			= section_div.parentNode;
	section_div.jr_section_start_index		= jr_NodeGetTextIndexInParent( section_div);

	while (body_div.firstChild) {
		jr_NodeInsertBefore( section_div, body_div.firstChild);
	}
	section_div.jr_section_end_index		= jr_NodeGetTextIndexInParent( section_div);

	jr_NodeRemoveFromDom( section_div);
}

var jr_EditorSectionNodeRestorePrepare = function( deleted_node)
{
	var		section_div	= deleted_node.jr_section_div;

	if (!section_div.parentNode) {
		/*
		** 5/24/2010: First move the merged nodes back under the section body.
		** Then put the whole section back.
		*/
		this.undoMerge( 
			section_div.jr_section_body_div,
			section_div.jr_section_parent,
			section_div.jr_section_start_index,
			section_div.jr_section_end_index
		);
		jr_NodeRestoreToDom(
			section_div, section_div.jr_section_parent, section_div.jr_section_start_index
		);
	}
}

var jr_EditorSectionNodeRestoreToDom = function( deleted_node, parent_node, text_index)
{
	/*
	** 5/24/2010: All the section divs were restored by prepare restore.
	*/
}


function jr_EditHandlerSectionHeading()
{
}

jr_EditHandlerSectionHeading.prototype	= jr_EditHandlerCreate( jr_EDIT_SECTION_HEADING_TAG_NAME);

jr_EditHandlerSectionHeading.prototype.insertNewlineNodeAfter = function( new_el, heading_div)
{
	var		section_div	= heading_div.parentNode;

	if (section_div.jr_section_heading_div === undefined) {
		jr_EditorSectionDivInit( section_div);
	}

	jr_ElementPrependChild( section_div.jr_section_body_div, new_el);
}

jr_EditHandlerSectionHeading.prototype.insertNewlineNodeBefore = function( new_el, heading_div)
{
	var		section_div	= heading_div.parentNode;

	if (section_div.jr_section_heading_div === undefined) {
		jr_EditorSectionDivInit( section_div);
	}

	/*
	** 11-22-2010: insert the new element before the section.
	*/
	jr_ElementInsertBefore( section_div, new_el);
}

jr_EditHandlerSectionHeading.prototype.initNode			= jr_EditorSectionNodeInit;
jr_EditHandlerSectionHeading.prototype.removeFromDom	= jr_EditorSectionNodeRemoveFromDom;
jr_EditHandlerSectionHeading.prototype.restoreToDom		= jr_EditorSectionNodeRestoreToDom;
jr_EditHandlerSectionHeading.prototype.finishDelete		= jr_EditorSectionNodeFinishDelete;
jr_EditHandlerSectionHeading.prototype.prepareRestore	= jr_EditorSectionNodeRestorePrepare;


function jr_EditHandlerSectionBody()
{
}

jr_EditHandlerSectionBody.prototype	= jr_EditHandlerCreate( jr_EDIT_SECTION_BODY_TAG_NAME);

jr_EditHandlerSectionBody.prototype.insertNewlineNodeAfter = function( new_el, parent_block)
{
	jr_NodeAppendChild( parent_block, new_el);
	/*
	** 11/24/09: shouldn't be called since there shouldn't be "naked" text nodes in the body.
	*/
}

jr_EditHandlerSectionBody.prototype.insertNewlineNodeBefore = function( new_el, parent_block)
{
	jr_NodePrependChild( parent_block, new_el);
	/*
	** 11/24/09: shouldn't be called since there shouldn't be "naked" text nodes in the body.
	*/
}

jr_EditHandlerSectionBody.prototype.initNode			= jr_EditorSectionNodeInit;
jr_EditHandlerSectionBody.prototype.removeFromDom		= jr_EditorSectionNodeRemoveFromDom;
jr_EditHandlerSectionBody.prototype.restoreToDom		= jr_EditorSectionNodeRestoreToDom;
														/*
														** 5/24/2010: no delete cleanup for body,
														** section only deleted if heading is.
														*/



/******** Custom Edit Operation: Source Block ********/

var		jr_EDIT_SOURCE_BLOCK_TAG_NAME				= "JR_SOURCE_BLOCK";

jr_AddBlockTag( jr_EDIT_SOURCE_BLOCK_TAG_NAME);


function jr_EditorSourceBlockCreate()
{
	var		source_div		= jr_ElementCreate( "div");

	jr_ElementSetClass( source_div,		jr_EDIT_SOURCE_BLOCK_TAG_NAME);

	jr_ElementSetAttr( source_div,	jr_TAG_ATTR_NAME,	jr_EDIT_SOURCE_BLOCK_TAG_NAME);

	jr_ElementSetStyle( source_div,		"whiteSpace",	"pre");
	jr_ElementSetStyle( source_div,		"width",		"95%");
	jr_ElementSetStyle( source_div,		"overflow",		"auto");
	jr_ElementSetStyle( source_div,		"minHeight",	"1em");
	jr_ElementSetStyle( source_div,		"border",		"1px solid lightgrey");
	jr_ElementSetStyle( source_div,		"fontFamily",	"monospace");
	jr_ElementSetStyle( source_div,		"color",		"brown");

	return source_div;
}


function jr_EditHandlerSourceBlock()
{
}

jr_EditHandlerSourceBlock.prototype	= jr_EditHandlerCreate( jr_EDIT_SOURCE_BLOCK_TAG_NAME);

jr_EditHandlerSourceBlock.prototype.hasPreWhitespace	= function()
{
	return true;
}

