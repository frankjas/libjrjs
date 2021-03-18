/*
** 7/25/09: Design goals:
** - be able to add a link to popup a resizable, draggable diag box
** -- fixed position image?
** - reopen brings back the same one
** - has internal controls
** -- clear
** -- trace controls: be able show current traces, dynamically be able to activate/deactivate, set level
*/

var jr_DiagDiv;
var jr_DiagResizeControl;
var	jr_DoDiag		= new Object();
var jr_DiagGroups;
/*
** 7/27/09: Get an error if jr_DiagGroups is initialized here as opposed
** to in the function.  However, jr_DoDiag can get initialized here??
*/


function jr_DiagPopupInit(
	diag_open_el, diag_zindex, diag_label, diag_height, diag_width, diag_grab_color, diag_parent_el)
{
	diag_open_el.jr_diag_is_open_el		= true;
	diag_open_el.jr_diag_zindex			= diag_zindex;
	diag_open_el.jr_diag_label			= diag_label;
	diag_open_el.jr_diag_height			= diag_height;
	diag_open_el.jr_diag_width			= diag_width;
	diag_open_el.jr_diag_grab_color		= diag_grab_color;
	diag_open_el.jr_diag_parent_el		= diag_parent_el;

	if (! diag_open_el.jr_diag_zindex) {
		diag_open_el.jr_diag_zindex		= 5;
	}

	jr_ElementRegisterHandler( diag_open_el, jr_CLICK_EVENT, jr_DiagOpenHandler);
}

function jr_DiagDivInit( diag_el, opt_resize_control)
{
	/*
	** 9/28/09: Use this if you want use an existing div for msgs.
	*/
	jr_DiagDiv	= diag_el;
	jr_DiagClear();

	if (opt_resize_control  && typeof opt_resize_control == jr_Resize) {
		jr_DiagResizeControl	= opt_resize_control;
	}
}

function jr_DiagRegister( diag_group_name, diag_name, diag_desc)
{
	var		diag_group;
	var		diag_entry;

	if (!jr_DiagGroups) {
		jr_DiagGroups	= new Object();
	}
	diag_group	= jr_DiagGroups[ diag_group_name];

	if (!diag_group) {
		diag_group	= new Object();

		jr_DiagGroups[ diag_group_name]	= diag_group;
	}
	diag_entry	= diag_group[ diag_name];

	if (!diag_entry) {
		diag_entry	= new Object();
		diag_group[ diag_name]	= diag_entry;
	}

	diag_entry.jr_diag_group_name	= diag_group_name;
	diag_entry.jr_diag_name			= diag_name;
	diag_entry.jr_diag_desc			= diag_desc;
}

function jr_DiagOpenHandler(click_el)
{
	var		diag_open_el;
	var		diag_div;

	while (click_el) {
		if (click_el.jr_diag_is_open_el) {
			diag_open_el	= click_el;
			break;
		}
		click_el	= click_el.parentNode;
	}
	if (!diag_open_el) {
		return;
	}
	if (jr_DiagDiv) {
		return;
	}

	diag_div	= jr_DiagAppendPopup(
					diag_open_el.jr_diag_zindex,
					diag_open_el.jr_diag_label,
					diag_open_el.jr_diag_height,
					diag_open_el.jr_diag_width,
					diag_open_el.jr_diag_grab_color,
					diag_open_el.jr_diag_parent_el
				);

	jr_DiagDiv	= diag_div;

	jr_DiagClear();
}

function jr_DiagAppendPopup( diag_zindex, diag_label, diag_height, diag_width, grab_color, parent_el)
{
	var		diag_div;
	var		grab_div;
	var		close_div;
	var		close_size;

	diag_div			= document.createElement ("div");
	grab_div			= document.createElement ("div");
	close_div			= document.createElement ("div");


	if (!parent_el) {
		parent_el		= document.body;
	}
	if (!diag_label) {
		diag_label		= "Diagnostics";
	}
	if (!grab_color) {
		grab_color		= "pink";
	}
	if (!diag_height) {
		diag_height		= "30%";
	}
	if (!diag_width) {
		diag_width		= "50%";
	}
	jr_NodeAppendText( grab_div, diag_label);

	parent_el.appendChild( diag_div);

	diag_div.appendChild( grab_div);
	grab_div.appendChild( close_div);

	diag_div.jr_diag_grab_div		= grab_div;
	
	diag_div.style.position			= "absolute";
	diag_div.style.border			= "1px solid black";
	diag_div.style.height			= diag_height;
	diag_div.style.width			= diag_width;
	diag_div.style.backgroundColor	= "white";
	diag_div.style.zIndex			= diag_zindex;

	diag_div.style.left				= String( (parent_el.offsetWidth - diag_div.offsetWidth) / 2) + "px";
	diag_div.style.bottom			= String( 0) + "px";

	grab_div.style.width			= "100%";
	grab_div.style.borderBottom		= "1px solid black";
	grab_div.style.backgroundColor	= grab_color;
	grab_div.style.zIndex			= diag_zindex + 1;
	/*
	** 7/25/09: Otherwise the sub-elements of the diag_div will cover it up.
	*/

	close_div.style.position		= "absolute";
	close_div.style.cursor			= "default";
	close_div.style.backgroundColor	= "black";

	close_size						= grab_div.offsetHeight/2;
	close_div.style.height			= String( close_size ) + "px";
	close_div.style.width			= String( close_size ) + "px";
	close_div.style.top				= String( close_size/2 ) + "px";
	close_div.style.right			= String( close_size/2 ) + "px";

	close_div.jr_diag_div			= diag_div;

	if (jr_IsIE) {
		close_div.style.fontSize	= String( 1 ) + "px";
	}

	var		drag_control	= jr_DragCreate();
	var		resize_control	= jr_ResizeCreate( 10);


	jr_ResizeSetMinWidth( resize_control, diag_width);
	jr_ResizeSetMinHeight( resize_control, diag_height);

	jr_DragActivate( drag_control, grab_div, diag_div);
	jr_ResizeActivate( resize_control, diag_div);
	jr_ResizeSetDragControl( resize_control, drag_control);

	jr_ElementRegisterHandler( close_div, jr_CLICK_EVENT, jr_DiagCloseHandler);

	return diag_div;
}

function jr_DiagCloseHandler (click_div)
{
	var		element		= click_div;
	var		diag_div;

	while (element) {
		if (element.jr_diag_div) {
			diag_div	= element.jr_diag_div;
		}
		element	= element.parentNode;
	}
	if (!diag_div) {
		throw new Error( "Couldn't find diag div");
	}
	diag_div.parentNode.removeChild( diag_div);

	if (diag_div === jr_DiagDiv) {
		jr_DiagDiv	= undefined;
	}
	delete diag_div;
}

function jr_DiagAppend( diag_string)
{
	var		diag_msg_div;
	var		last_child;
	var		pre_el;

	if (!jr_DiagDiv) {
		return;
	}
	diag_msg_div	= jr_DiagDiv.jr_diag_msg_div;
	last_child		= jr_DiagDiv.jr_diag_msg_div.lastChild;

	if (	last_child
		&&	last_child.nodeType == jr_Node.ELEMENT_NODE
		&&	last_child.tagName == "PRE") {

		pre_el	= last_child;
	}
	if (!pre_el) {
		pre_el	= document.createElement( "pre");

		diag_msg_div.appendChild( pre_el);
	}
	jr_NodeAppendText( pre_el, diag_string);

	diag_msg_div.scrollTop	= diag_msg_div.scrollHeight - diag_msg_div.offsetHeight;
	/*
	** 9/14/09: Keep the scroll at the bottom
	*/
}

function jr_DiagPrintLine( diag_string)
{
	if (diag_string === undefined) {
		diag_string = "";
	}
	if (jr_IsIE) {
		diag_string += "\r";
	}
	diag_string	+= "\n";

	jr_DiagAppend( diag_string);
}

function jr_DiagClear()
{
	var		q;
	var		diag_msg_div;
	var		grab_percent;

	if (!jr_DiagDiv) {
		return;
	}

	if (jr_DiagDiv.jr_diag_msg_div) {
		jr_DiagDiv.removeChild( jr_DiagDiv.jr_diag_msg_div);
	}

	diag_msg_div	= document.createElement( "div");

	if (jr_DiagDiv.jr_diag_grab_div) {
		grab_percent	= jr_ElementGetHeightPercent( jr_DiagDiv.jr_diag_grab_div);
	}
	else {
		grab_percent	= 0;
	}

	diag_msg_div.style.overflow			= "auto";
	diag_msg_div.style.height			= String( 100 - grab_percent) + "%";

	jr_DiagDiv.jr_diag_msg_div	= diag_msg_div;
	jr_DiagDiv.appendChild( diag_msg_div);

	if (jr_DiagResizeControl) {
		jr_ResizeAddHandler( jr_DiagResizeControl, jr_DiagResizeMsgDiv, jr_DiagDiv.jr_diag_msg_div );
	}
	jr_DiagResizeMsgDiv( jr_DiagDiv, jr_DiagDiv.jr_diag_msg_div);
}

function jr_DiagResizeMsgDiv( diag_div, diag_msg_div)
{
}


function jr_diag (arg, opt_window_name)
{
	var	diag_win;
	var diag_doc;

	if (!opt_window_name) {
		opt_window_name = "jr_diag";
	}
	diag_win	= window.open (
					'', opt_window_name,
					'left=970,top=0,width=600,height=1100,toolbar=no,scrollbars=yes'
				);
	diag_doc	= diag_win.document;
	
	
	if (!arg) {
		arg	= "Null arg to jr_diag()";
	}

	diag_doc.write (arg);

	return diag_win;
}

function jr_diag_append (diag_win, arg)
{
	diag_doc	= diag_win.document;
	diag_doc.write (arg);
}

function jr_diag_var_flat (text, debug_var, opt_window_name)
{
	jr_diag_var_with_options (text, debug_var, 1, opt_window_name);
}

function jr_diag_var (text, debug_var, opt_window_name)
{
	jr_diag_var_with_options (text, debug_var, 0, opt_window_name);
}

function jr_diag_var_with_options (text, debug_var, do_flat, opt_window_name)
{
	var	diag_win;
	var diag_doc;

	if (!debug_var) {
		debug_var	= "null";
	}

	diag_win	= jr_diag ('<strong>' + text + ': </strong>', opt_window_name);
	diag_doc	= diag_win.document;

	jr_diag_print_var (diag_win, debug_var, do_flat);

	diag_doc.write ('<hr>\n');
}

function jr_diag_print_var (diag_win, debug_var, do_flat)
{
	var		diag_doc		= diag_win.document;
	var		is_dom_element	= 0;

	if (typeof debug_var == "object") {
		diag_doc.write ('<ul>\n');

		if (debug_var.nodeType  &&  debug_var.nodeType == jr_Node.ELEMENT_NODE) {
			do_flat	= 1;
		}
		for (field in debug_var) {
			diag_doc.write ("<li>" + field + ": ");

			if (typeof debug_var[field] == "object") {
				if (debug_var[field].nodeType  &&  debug_var[field].nodeType == jr_Node.ELEMENT_NODE) {
					diag_doc.write ("DOM element");
				}
				else if (do_flat) {
					diag_doc.write ("object");
				}
				else {
					jr_diag_print_var (diag_win, debug_var[field]);
				}
			}
			else {
				diag_doc.write (debug_var[field]);
			}

			diag_doc.writeln ('</li>');
		}
		diag_doc.write ('</ul>\n');
	}
	else {
		diag_doc.write (debug_var);
	}
}

