/******** Globals ********/

var jr_UserAgent			= navigator.userAgent.toLowerCase();
var jr_IsIE					= false;
var jr_IsIE7				= false;
var jr_IsIE8				= false;
var jr_IsIE9				= false;
var jr_IsFirefox			= false;
var jr_IsKonqueror			= false;
var jr_IsOpera				= false;
var jr_IsSafari				= false;
var jr_IsChrome				= false;

if (jr_UserAgent.indexOf("msie") > -1){
    jr_IsIE			= true;

	if (jr_UserAgent.indexOf("msie 7") > -1){
		jr_IsIE7	= true;
	}
	if (jr_UserAgent.indexOf("msie 8") > -1){
		jr_IsIE8	= true;
	}
	if (jr_UserAgent.indexOf("msie 9") > -1){
		jr_IsIE9	= true;
	}
}
else if (jr_UserAgent.indexOf("firefox") > -1){
    jr_IsFirefox	= true;
}
else if (jr_UserAgent.indexOf("iceweasel") > -1){
    jr_IsFirefox	= true;
}
else if (jr_UserAgent.indexOf("konqueror") > -1){
    jr_IsKonqueror	= true;
}
else if (jr_UserAgent.indexOf("opera") > -1){
    jr_IsOpera		= true;
}
else if (jr_UserAgent.indexOf("applewebkit") > -1){
	/*
	** 8-8-2014: Chrome also uses applewebkit
	*/
	if (jr_UserAgent.indexOf("chrome") > -1){
		jr_IsChrome		= true;
	}
	else {
		jr_IsSafari		= true;
	}
}


var jr_KeyPressIgnoresTab		= false;
var jr_KeyPressIgnoresBackspace	= false;
var jr_KeyPressIgnoresDelete	= false;
var jr_KeyPressIgnoresArrow		= false;
var jr_KeyPressIgnoresPgUpDown	= false;
var jr_KeyPressIgnoresEscape	= false;

if (jr_IsFirefox) {
	/*
	** 12-9-2010 : as of 3.0.6, not true
	*/
	jr_KeyPressIgnoresTab		= false;
	jr_KeyPressIgnoresArrow		= true;
	jr_KeyPressIgnoresEscape	= true;
}

if (jr_IsIE || jr_IsSafari || jr_IsChrome) {
	jr_KeyPressIgnoresTab		= true;
	jr_KeyPressIgnoresBackspace	= true;
	jr_KeyPressIgnoresDelete	= true;
	jr_KeyPressIgnoresArrow		= true;
	jr_KeyPressIgnoresPgUpDown	= true;
	jr_KeyPressIgnoresEscape	= true;
}

/*
** 11/26/06: IE doesn't have the Node object
*/

var jr_Node    = new Object();

jr_Node.ELEMENT_NODE	= 1;
jr_Node.ATTRIBUTE_NODE	= 2;
jr_Node.TEXT_NODE		= 3;
jr_Node.COMMENT_NODE	= 8;
jr_Node.DOCUMENT_NODE	= 9;

var jr_TAG_ATTR_NAME		= "jr_tagName";

/******** Functions ********/

function jr_require( file_name)
{
}

function jr_onerror (text, file, line)
{
	/*
	** 9-18-2011: no file in some cases although line is 0
	** 9-30-2011: a "throw" with an Error object provides file, line numbers,
	** and should be used for internal/programmer errors. A "throw" with a string
	** doesn't include that info, and is treated like a end-user targetted string.
	*/

	if (file) { 
		alert( "Programming error: " + file + ":" + line + ": " + text);
	}
	else {
		alert( text);
	}

	if (false) {
		var	diag_win;
		var diag_doc;

		diag_win	= window.open ('', '_blank', 'width=600,height=4,toolbar=no,scrollbars=yes');
		diag_doc	= diag_win.document;
		
		diag_doc.write ('<html><head></head><body><div align="left">');
		diag_doc.write ('<div align="left">');
		diag_doc.write ('<p>' + file + ':' + line + '</p>');
		diag_doc.write ('<p> Javascript error: <strong>' + text + '</strong></p>');
		diag_doc.write ('</div></body></html>');
		diag_doc.close ();
	}
}

function jr_ExceptionString( exception)
{
	/*
	** 9-15-2011: should have a toString() member, use that?
	*/
	if (typeof exception == "string") {
		return exception;
	}
	if (exception.message) {
		return exception.message;
	}
	if (exception.description) {
		return exception.description;
	}
	return "[no exception message]";
}

function jr_GetQueryStringVars()
{
	var query_vars		= {};
	var	queryString		= location.search.substring(1)
	var	re				= new RegExp( "([^&=]+)=([^&]*)", "gm");
	var	match;

	while (match = re.exec(queryString)) {
		query_vars[decodeURIComponent(match[1])] = decodeURIComponent(match[2]);
	}

	return query_vars;
}

var		jr_NextId		= 1;

function jr_NewId( opt_prefix_str)
{
	if (opt_prefix_str === undefined) {
		opt_prefix_str = "jr_";
	}
	return opt_prefix_str + jr_NextId++;
}

function jr_HasType( object, type_fn)
{
	if (object.constructor === type_fn  &&  typeof type_fn == "function") {
		return true;
	}
	return false;
}

function jr_GetLeadingNumber( value_string)
{
	var		q;
	var		curr_char;
	var		digits		= "";

	for (q=0; q < value_string.length; q++) {
		curr_char	= value_string.charAt(q);

		if (q == 0  &&  curr_char == '-') {
			digits	+= curr_char;
		}
		else if ('0' <= curr_char  &&  curr_char <= '9') {
			digits	+= curr_char;
		}
		else {
			break;
		}
	}
	if (digits.length > 0) {
		return digits;
	}
	return null;
}

function jr_ElementGetRelOrigin (el, ancestor_el)
{
	var		origin_obj	= new Object();
	var		originX		= 0;
	var		originY		= 0;

	var		origin_el	= el.offsetParent;

	if (!ancestor_el.firstChild) {
		throw new Error( "ancestor has no children");
	}

	if (ancestor_el.firstChild.offsetParent !== ancestor_el) {
		/*
		** 10-23-2010: the ancestor isn't an offsetParent.
		*/
		ancestor_el	= ancestor_el.offsetParent;
	}

	while (origin_el) {
		if (origin_el === ancestor_el) {
			break;
		}
		if (origin_el.nodeType == jr_Node.ELEMENT_NODE) {
			originX		+= origin_el.offsetLeft;
			originY		+= origin_el.offsetTop;
		}

		origin_el	= origin_el.offsetParent;
	}
	origin_obj.x	= originX;
	origin_obj.y	= originY;

	return origin_obj;
}

function jr_ElementGetAbsOrigin (el)
{
	var		origin_obj	= new Object();
	var		originX		= 0;
	var		originY		= 0;

	var		origin_el	= el.offsetParent;

	while (origin_el) {
		if (origin_el.nodeType == jr_Node.ELEMENT_NODE) {
			originX		+= origin_el.offsetLeft;
			originY		+= origin_el.offsetTop;
		}

		origin_el	= origin_el.offsetParent;
	}
	origin_obj.x	= originX;
	origin_obj.y	= originY;

	return origin_obj;
}

function jr_NodeAppendChild( object, el_arg, opt_class)
{
	if (typeof el_arg == "string") {
		el_arg	= document.createElement( el_arg);

		if (opt_class) {
			jr_ElementSetClass( el_arg, opt_class);
		}
	}
	return object.appendChild( el_arg);
}

function jr_NodePrependChild( object, el_arg, opt_class)
{
	if (typeof el_arg == "string") {
		el_arg	= document.createElement( el_arg);

		if (opt_class) {
			jr_ElementSetClass( el_arg, opt_class);
		}
	}
	if (object.firstChild) {
		return object.insertBefore( el_arg, object.firstChild);
	}
	else {
		return object.appendChild( el_arg);
	}
}

function jr_NodeInsertBefore( object, el_arg, opt_class)
{
	if (typeof el_arg == "string") {
		el_arg	= document.createElement( el_arg);

		if (opt_class) {
			jr_ElementSetClass( el_arg, opt_class);
		}
	}
	return object.parentNode.insertBefore( el_arg, object);
}

function jr_NodeAppendAfter( object, el_arg, opt_class)
{
	if (typeof el_arg == "string") {
		el_arg	= document.createElement( el_arg);

		if (opt_class) {
			jr_ElementSetClass( el_arg, opt_class);
		}
	}

	if (object.nextSibling) {
		return object.parentNode.insertBefore( el_arg, object.nextSibling);
	}
	return object.parentNode.appendChild( el_arg);
}

function jr_NodeRemoveFromDom( object)
{
	if (object && object.parentNode) {
		object.parentNode.removeChild( object);
	}
}

function jr_NodeRestoreToDom( deleted_node, parent_node, text_index)
{
	var		sibling_node	= jr_NodeGetChildAtTextIndex( parent_node, text_index);

	if (sibling_node) {
		parent_node.insertBefore( deleted_node, sibling_node);
	}
	else {
		parent_node.appendChild( deleted_node);
	}
}

function jr_NodeDeleteChildren (parent_node)
{
	var		q;
	var		child_node;

	for (q = parent_node.childNodes.length - 1 ; q >= 0; q--) {
		child_node = parent_node.childNodes[q];

		parent_node.removeChild (child_node);
	}
	return null;
}

function jr_NodeMoveChildren( old_node, target_node)
{
	while (old_node.firstChild) {
		target_node.appendChild( old_node.firstChild);
	}
}

function jr_NodeMoveChildrenBefore( old_node, next_node)
{
	while (old_node.lastChild) {
		next_node.parentNode.insertBefore( old_node.lastChild, next_node);
	}
}

function jr_NodeReplace( object, new_object)
{
	if (object.parentNode) {
		object.parentNode.replaceChild( new_object, object);
	}
}

function jr_NodeHasText (parent_node)
{
	var q;
	var child_node;

	for (q =0; q < parent_node.childNodes.length; q++) {
		child_node = parent_node.childNodes[q];

		if (child_node.nodeType == jr_Node.TEXT_NODE) {
			return child_node;
		}
	}
	return null;
}

function jr_NodeGetText (parent_node)
{
	var child_node;

	child_node	= jr_NodeHasText (parent_node);

	if (child_node) {
		return child_node.data;
	}
	return null;
}

function jr_NodeAppendText (parent_node, text)
{
	var q;
	var child_node;

	if (parent_node.nodeType == jr_Node.TEXT_NODE) {
		parent_node.appendData( text);
		return parent_node;
	}
	if (parent_node.lastChild  &&  parent_node.lastChild.nodeType == jr_Node.TEXT_NODE) {
		parent_node.lastChild.appendData( text);
		return parent_node.lastChild;
	}

	if (false) {
		/*
		** 11-23-10: this adds the text to the first text node,
		** which could be in the middle of the node??
		*/
		for (q = 0; q < parent_node.childNodes.length; q++) {
			child_node = parent_node.childNodes[q];

			if (child_node.nodeType == jr_Node.TEXT_NODE) {
				child_node.appendData (text);
				return;
			}
		}
	}

	child_node	= document.createTextNode (text);
	parent_node.appendChild (child_node);

	return child_node;
}

function jr_NodeRemoveText (parent_node)
{
	var q;
	var child_node;

	for (q =0; q < parent_node.childNodes.length; q++) {
		child_node = parent_node.childNodes[q];

		if (child_node.nodeType == jr_Node.TEXT_NODE) {
			parent_node.removeChild (child_node);
		}
	}
}

function jr_NodeReplaceText (parent_node, text)
{
	jr_NodeRemoveText (parent_node);

	child_node	= document.createTextNode (text);
	parent_node.appendChild (child_node);

	return child_node;
}

function jr_NodeClearDiag (diag_el)
{
	jr_NodeReplaceText (diag_el, "");
}

function jr_NodeAppendDiag (diag_el, diag_string)
{
	/*
	** 9/28/07: Use for diags, assumes a <pre> element
	*/
	jr_NodeAppendText (diag_el, diag_string);
}

function jr_NodePrintDiagLine (diag_el, diag_string)
{
	/*
	** 9/28/07: Use for diags, assumes a <pre> element
	*/
	if (jr_IsIE) {
		diag_string += "\r";
	}
	jr_NodeAppendText (diag_el, diag_string + "\n");
}

function jr_TextShift (text_node_left, text_node_right, num_chars)
{
	var			text_string		= "";

	if (num_chars < 0) {
		if (num_chars  < -text_node_left.length) {
			num_chars  = -text_node_left.length;
		}
		if (num_chars) {
			text_string	= text_node_left.substringData (text_node_left.length + num_chars, -num_chars);

			text_node_left.deleteData (text_node_left.length + num_chars, -num_chars);
			text_node_right.insertData (0, text_string);
		}
	}
	else if (num_chars > 0) {
		if (num_chars  >  text_node_right.length) {
			num_chars	= text_node_right.length;
		}
		if (num_chars) {
			text_string	= text_node_right.substringData (0, num_chars);

			text_node_right.deleteData (0, num_chars);
			text_node_left.appendData (text_string);
		}
	}
	return text_string;
}

function jr_NodeGetPreviousTextNode(
	orig_node, opt_root_node, delete_null_text, opt_empty_elements, opt_parent_nodes)
{
	var		curr_node	= orig_node;
	var		prev_node	= curr_node.previousSibling;
	var		text_node;

	if (!opt_root_node) {
		opt_root_node	= document;
	}
	if (orig_node === opt_root_node) {
		return null;
	}

	while (prev_node) {
		curr_node	= prev_node;
		prev_node	= curr_node.previousSibling;

		if (curr_node.nodeType == jr_Node.TEXT_NODE) {
			if (delete_null_text && curr_node.length == 0) {
				jr_NodeRemoveFromDom( curr_node);
			}
			else {
				return curr_node;
			}
		}
		else {
			text_node	= jr_NodeGetLastSubTextNode(
							curr_node, delete_null_text, opt_empty_elements, opt_parent_nodes
						);

			if (text_node) {
				return text_node;
			}
			else if (opt_empty_elements) {
				opt_empty_elements.push( curr_node);
			}
		}
	}


	if (orig_node.parentNode === opt_root_node) {
		return null;
	}
	if (opt_parent_nodes) {
		opt_parent_nodes.push( orig_node.parentNode);
	}

	curr_node	= jr_NodeGetPreviousTextNode(
					orig_node.parentNode, opt_root_node, delete_null_text,
					opt_empty_elements, opt_parent_nodes
				);

	return curr_node;
}

function jr_NodeGetNextTextNode(
	orig_node, opt_root_node, delete_null_text, opt_empty_elements, opt_parent_nodes)
{
	var		curr_node	= orig_node;
	var		next_node	= curr_node.nextSibling;
	var		text_node;

	if (!opt_root_node) {
		opt_root_node	= document;
	}
	if (curr_node === opt_root_node) {
		return null;
	}

	while (next_node) {
		curr_node	= next_node;
		next_node	= curr_node.nextSibling;

		if (curr_node.nodeType == jr_Node.TEXT_NODE) {
			if (delete_null_text && curr_node.length == 0) {
				jr_NodeRemoveFromDom( curr_node);
			}
			else {
				return curr_node;
			}
		}
		else {
			text_node	= jr_NodeGetFirstSubTextNode(
							curr_node, delete_null_text, opt_empty_elements, opt_parent_nodes
						);

			if (text_node) {
				return text_node;
			}
			else if (opt_empty_elements) {
				opt_empty_elements.push( curr_node);
			}
		}
	}

	if (orig_node.parentNode === opt_root_node) {
		return null;
	}
	if (opt_parent_nodes) {
		opt_parent_nodes.push( orig_node.parentNode);
	}
	curr_node	= jr_NodeGetNextTextNode (
					orig_node.parentNode, opt_root_node, delete_null_text,
					opt_empty_elements, opt_parent_nodes
				);

	return curr_node;
}

function jr_NodeGetFirstSubTextNode (curr_node, delete_null_text, opt_empty_elements, opt_parent_nodes)
{
	var		orig_node		= curr_node;
	var		empty_text_node;

	while (curr_node.firstChild) {
		if (opt_parent_nodes) {
			opt_parent_nodes.push( curr_node);
		}
		curr_node	= curr_node.firstChild;
	}
	if (curr_node.nodeType == jr_Node.TEXT_NODE) {
		if (delete_null_text  &&  curr_node.length == 0) {
			empty_text_node	= curr_node;
		}
		else {
			return curr_node;
		}
	}

	curr_node	= jr_NodeGetNextTextNode(
					curr_node, orig_node, delete_null_text, opt_empty_elements, opt_parent_nodes
				);

	if (empty_text_node) {
		jr_NodeRemoveFromDom( empty_text_node);
	}
	return curr_node;
}

function jr_NodeGetLastSubTextNode(
	orig_node, delete_null_text, opt_empty_elements, opt_parent_nodes)
{
	var		curr_node		= orig_node;
	var		empty_text_node;

	while (curr_node.lastChild) {
		if (opt_parent_nodes) {
			opt_parent_nodes.push( curr_node);
		}
		curr_node	= curr_node.lastChild;
	}
	if (curr_node.nodeType == jr_Node.TEXT_NODE) {
		if (delete_null_text  &&  curr_node.length == 0) {
			empty_text_node	= curr_node;
		}
		else {
			return curr_node;
		}
	}
	curr_node	= jr_NodeGetPreviousTextNode(
					curr_node, orig_node, delete_null_text, opt_empty_elements, opt_parent_nodes
				);

	if (empty_text_node) {
		jr_NodeRemoveFromDom( empty_text_node);
	}
	return curr_node;
}

function jr_NodeGetTextIndexInParent( text_node)
{
	var		prev_node		= text_node.previousSibling;
	var		text_index		= 0;

	while (prev_node) {
		if (prev_node.nodeType == jr_Node.TEXT_NODE) {
			text_index	+= prev_node.length;
		}
		else {
			/*
			** 7/04/09: Count each sub-node so we can tell the difference between before
			** or after a span, for example.
			*/
			text_index	+= 1;
		}

		prev_node		= prev_node.previousSibling;
	}
	return text_index;
}

function jr_NodeGetEndTextIndex( parent_node)
{
	var		curr_node		= parent_node.firstChild;
	var		text_index		= 0;

	while (curr_node) {
		if (curr_node.nodeType == jr_Node.TEXT_NODE) {
			text_index	+= curr_node.length;
		}
		else {
			/*
			** 7/04/09: Count each sub-node so we can tell the difference between before
			** or after a span, for example.
			*/
			text_index	+= 1;
		}

		curr_node		= curr_node.nextSibling;
	}
	return text_index;
}

function jr_NodeGetChildAtTextIndex( parent_el, text_index)
{
	var		curr_index			= 0;
	var		curr_length;
	var		child_node;
	var		child_index;
	var		q;

	/*
	** 11-21-2010: looks like each sub-node counts as 1
	** So that each DOM node has a unique "text" index.
	*/

	for (q=0; q < parent_el.childNodes.length; q++) {
		child_node = parent_el.childNodes[q];

		if (child_node.nodeType == jr_Node.TEXT_NODE) {
			curr_length	= child_node.length;
		}
		else {
			curr_length = 1;
		}
		
		if (curr_index + curr_length  <  text_index) {
			curr_index	+= curr_length;
			continue;
		}

		/*
		** 6/30/09: this text node includes text_index, 0 <= child_index <= curr_length;
		*/
		child_index	= text_index - curr_index;

		if (child_index == 0) {
			return child_node;
		}
		else if (child_index  <  curr_length) {
			/*
			** 7/4/09: child_index > 0 and < curr_length, => curr_length > 1, => child_node is text
			*/
			if (	child_node.nextSibling
				&&  child_node.nextSibling.nodeType == jr_Node.TEXT_NODE
			) {

				child_node.nextSibling.insertData(
					0, child_node.substringData( child_index, curr_length - child_index)
				);
				child_node.deleteData( child_index, curr_length - child_index);

				return child_node.nextSibling;
			}
			else {
				return child_node.splitText( child_index);
			}
		}
		else {
			return child_node.nextSibling;
		}
	}
	return null;
}

function jr_NodeGetChildNodesInRange( parent_node, start_index, end_index, child_array)
{
	var		curr_node;
	var		end_node;

	curr_node		= jr_NodeGetChildAtTextIndex( parent_node, start_index);
	end_node		= jr_NodeGetChildAtTextIndex( parent_node, end_index);

	while (curr_node) {
		if (curr_node === end_node) {
			break;
		}
		child_array.push( curr_node);

		curr_node	= curr_node.nextSibling;
	}
}


function jr_NodeIsSubNode( curr_node, ancestor_node, opt_stop_node)
{
	if (!ancestor_node.hasChildNodes()) {
		return false;
	}
	while (curr_node) {
		if (curr_node === opt_stop_node) {
			return false;
		}

		curr_node	= curr_node.parentNode;

		if (curr_node === ancestor_node) {
			return true;
		}
	}
	return false;
}

function jr_NodeAddSubNodesPostOrder( curr_node, end_node, node_array, opt_partial_parent_array)
{
	var		found_end_node		= false;
	var		child_node;
	var		q;

	for (q =0; q < curr_node.childNodes.length; q++) {
		child_node = curr_node.childNodes[q];

		if (child_node === end_node) {
			if (opt_partial_parent_array) {
				/*
				** 7/5/09: Add the node that had only some descendants added.
				*/
				opt_partial_parent_array.push( curr_node);
			}
			return true;
		}
		if (child_node.hasChildNodes()) {
			found_end_node	= jr_NodeAddSubNodesPostOrder(
								child_node, end_node, node_array, opt_partial_parent_array
							);

			if (found_end_node) {
				if (opt_partial_parent_array) {
					/*
					** 7/5/09: Add the node that had only some descendants added.
					*/
					opt_partial_parent_array.push( curr_node);
				}
				return found_end_node;
			}
		}
		node_array.push( child_node);
	}

	return false;
}

function jr_NodeAddChildren( curr_node, last_node, node_array, opt_partial_parent_array)
{
	var		found_last_node		= false;
	var		child_node;
	var		q;

	for (q =0; q < curr_node.childNodes.length; q++) {
		child_node = curr_node.childNodes[q];

		node_array.push( child_node);

		if (jr_NodeIsSubNode( last_node, child_node)) {
			if (q == curr_node.childNodes.length - 1) {
				node_array.push( curr_node);
			}
			else if (opt_partial_parent_array) {
				opt_partial_parent_array.push( curr_node);
			}
			return true;
		}
	}
	return false;
}

function jr_NodeGetParent( curr_node)
{
	return curr_node.parentNode;
}

function jr_NodeGetParentBlock( curr_node, ancestor_el)
{
	var		tag_name;

	while (curr_node) {
		if (curr_node.nodeType == jr_Node.ELEMENT_NODE) {

			if (! curr_node.jr_has_categories) {
				jr_NodeInitCategories( curr_node);
			}

			if (curr_node.jr_is_block) {
				return curr_node;
			}
		}

		if (curr_node === ancestor_el) {
			return null;
		}
		curr_node = curr_node.parentNode;
	}
	return null;
}

function jr_NodeGetParentStructure( curr_node, ancestor_el)
{
	var		tag_name;

	while (curr_node) {
		if (curr_node.nodeType == jr_Node.ELEMENT_NODE) {

			if (! curr_node.jr_has_categories) {
				jr_NodeInitCategories( curr_node);
			}

			if (curr_node.jr_is_structural) {
				return curr_node;
			}
		}

		if (curr_node === ancestor_el) {
			return null;
		}
		curr_node = curr_node.parentNode;
	}
	return null;
}

function jr_NodePreviousSiblingsAreWhitespace( curr_node, ancestor_el)
{
	var		inner_text;

	while (curr_node) {
		if (curr_node === ancestor_el) {
			return true;
		}
		if (! curr_node.previousSibling) {
			curr_node	= curr_node.parentNode;
			continue;
		}

		curr_node	= curr_node.previousSibling;

		if (curr_node.nodeType == jr_Node.TEXT_NODE) {
			inner_text	= curr_node.data;
		}
		else {
			inner_text	= curr_node.innerText;
		}
		if ( inner_text && inner_text.match( /\S/)) {
			/*
			** 11-20-10: matches non-whitespace.
			*/
			return false;
		}
	}
	return true;
}

function jr_ElementGetById( id_string)
{
	return document.getElementById( id_string);
}

function jr_ElementCreate( el_name, opt_class)
{
	var		new_el =  document.createElement( el_name);

	if (opt_class) {
		jr_ElementSetClass( new_el, opt_class);
	}

	return new_el;
}

function jr_ElementAppendChild( object, el_arg, opt_class)
{
	return jr_NodeAppendChild( object, el_arg, opt_class);
}

function jr_ElementPrependChild( object, el_arg, opt_class)
{
	return jr_NodePrependChild( object, el_arg, opt_class);
}

function jr_ElementInsertBefore( object, el_arg, opt_class)
{
	return jr_NodeInsertBefore( object, el_arg, opt_class);
}

function jr_ElementAppendAfter( object, el_arg, opt_class)
{
	return jr_NodeAppendAfter( object, el_arg, opt_class);
}

function jr_ElementReplace( object, new_object)
{
	jr_NodeReplace( object, new_object);
}

function jr_ElementAppendText( object, text)
{
	return jr_NodeAppendText( object, text);
}

function jr_ElementReplaceText( object, text)
{
	return jr_NodeReplaceText( object, text);
}

function jr_ElementRemoveText( object)
{
	jr_NodeRemoveText( object);
}

var jr_IsPixelStyle = {
	"width"				: true,
	"height"			: true,
	"top"				: true,
	"bottom"			: true,
	"left"				: true,
	"right"				: true,

	"minWidth"			: true,
	"minHeight"			: true,
	"maxWidth"			: true,
	"maxHeight"			: true,

	"padding"			: true,
	"paddingLeft"		: true,
	"paddingRight"		: true,
	"paddingTop"		: true,
	"paddingBottom"		: true,

	"margin"			: true,
	"marginLeft"		: true,
	"marginRight"		: true,
	"marginTop"			: true,
	"marginBottom"		: true,

	"borderLeftWidth"	: true,
	"borderRightWidth"	: true,
	"borderTopWidth"	: true,
	"borderBottomWidth"	: true,

	""				: false				/* 9/12/09: dummy entry with no comma */
};

/*
** 9/12/09: The following convenience functions for improved legibility, i.e:
**         jr_ElementSetStyle( my_el, "width", "100%");
** is easier to read than:
**         my_el.style.width	= "100%";
*/

function jr_ElementSetStyle( object, style_name, style_value, opt_units)
{
	/*
	** 10/14/09: Note "style_value" could be integer 0 or false
	*/
	if (style_value === undefined  ||  style_value === null) {
		if (jr_IsIE) {
			object.style[style_name]	= "";
		}
		else {
			object.style[style_name]	= null;
		}
		/*
		** 3/21/2010 Note: delete of attribute or setting to 'undefined'
		** doesn't have any effect.
		*/
	}
	else {
		if (opt_units !== undefined) {
			style_value		= String( style_value) + opt_units;
		}
		else if (jr_IsPixelStyle[ style_name]  &&  typeof style_value == "number") {
			style_value		= String( style_value) + "px";
		}
		else if (jr_IsIE) {
			if (style_value == "lightgray") {
				throw new Error( "'lightgray' is not a valid color in IE. Use 'lightgrey'");
			}
			else if (style_value == "grey") {
				throw new Error( "'grey' is not a valid color in IE. Use 'gray'");
			}
		}
		object.style[style_name]	= style_value;
	}
}

function jr_ElementSetClass( object, value)
{
	object.className		= value;
}

function jr_ElementHasClass( object, value)
{
	var		class_names		= object.className.split( " ");
	var		z;

	for ( z=0; z < class_names.length;  z++) {
		if ( class_names[z]  ==  value) {
			return true;
		}
	}
	return false;
}

function jr_ElementAddClass( object, value)
{
	var		class_names		= object.className.split( " ");
	var		z;

	if (!value || value.length == 0) {
		return;
	}

	for ( z=0; z < class_names.length;  z++) {
		if ( class_names[z]  ==  value) {
			return;
		}
	}
	jr_ElementSetClass( object, object.className + " " + value);
}

function jr_ElementRemoveClass( object, value)
{
	var		class_names		= object.className.split( " ");
	var		new_classes		= "";
	var		z;

	if (!value || value.length == 0) {
		return;
	}

	for ( z=0; z < class_names.length;  z++) {
		if ( class_names[z]  !=  value) {
			
			new_classes		+= " " + class_names[z];
		}
	}
	jr_ElementSetClass( object, new_classes);
}

if (false) { /***** comment out, use jr_ElementSetAttr() *****/
function jr_ElementSet( object, member_name, value)
{
	/*
	** 12/4/09: can't portably use this for some attribute values,
	** esp. for setting to null
	*/
	if (value === undefined || value === null) {
		if (jr_IsIE) {
			object[member_name]	= value;
		}
		else {
			delete object[member_name];
		}
	}
	else {
		object[member_name]	= value;
	}
}

function jr_ElementGet( object, member_name)
{
	return object[member_name];
}
} /***** comment out *****/

function jr_ElementSetAttr( object, attr_name, attr_value, opt_unit)
{
	if (attr_value === undefined || attr_value === null) {
		/*
		** 2-12-2013: according to quirks mode, use
		** the object field.  For example, Chrome v23 doesn't
		** change a "select" "option" "selected" attribute using setAttribute()
		** but the object field works.
		** http://www.quirksmode.org/dom/w3c_core.html#attributes
		*/
		if (object[attr_name] !== undefined) {
			object[attr_name] = undefined;
		}
		object.removeAttribute( attr_name);
	}
	else {
		if (opt_unit !== undefined) {
			/*
			** 1-9-2011: assume unit is string
			*/
			attr_value		= attr_value + opt_unit;
		}
		else if (jr_IsPixelStyle[ attr_name]  &&  typeof attr_value == "number") {
			attr_value		= String( attr_value) + "px";
		}
		if (jr_IsIE) {
			if (	attr_name == "type"
				&&  object.tagName.toUpperCase() == "INPUT"
				&&  object.parentNode) {

				throw new Error("IE can't set INPUT type after it has a parent");
			}
		}
		if (object[attr_name] !== undefined) {
			object[attr_name] = attr_value;
		}
		else {
			object.setAttribute( attr_name, attr_value);
		}
	}
}

function jr_ElementGetAttr( object, attr_name)
{
	if (object[attr_name] !== undefined) {
		return object[attr_name];
	}
	return object.getAttribute( attr_name);
}

function jr_ElementGetHeightPercent( object)
{
	if (!object.offsetParent ||  object.offsetParent.offsetHeight == 0) {
		throw new Error( "jr_ElementGetHeightPercent(): object not in DOM or parent has 0 height");
	}
	return Math.ceil( 100 * object.offsetHeight / object.offsetParent.offsetHeight);
}

function jr_ElementGetWidthPercent( object)
{
	if (!object.offsetParent ||  object.offsetParent.offsetWidth == 0) {
		throw new Error( "jr_ElementGetWidthPercent(): object not in DOM or parent has 0 width");
	}
	return Math.ceil( 100 * object.offsetWidth / object.offsetParent.offsetWidth);
}

function jr_ElementInnerText( object)
{
	if (object.innerText) {
		return object.innerText;
	}
	if (object.textContent) {
		/*
		** 7-13-11: Firefox/W3C textContent doesn't add whitespace
		** between elements. Do it for them.
		*/
		var		child_node	= object.firstChild;
		var		inner_text	= "";

		while (child_node) {
			if (child_node.nodeType == jr_Node.TEXT_NODE) {
				inner_text	+= child_node.data;
			}
			else {
				inner_text	+= " " + jr_ElementInnerText( child_node);
				
			}
			child_node	= child_node.nextSibling;
		}

		return inner_text;
	}
	return "";
}

function jr_ElementRemoveFromDom( object)
{
	jr_NodeRemoveFromDom( object);
}

function jr_ElementDeleteChildren( object)
{
	jr_NodeDeleteChildren( object);
}

function jr_ElementIsInDom( object)
{
	if (object.offsetParent) {
		/*
		** 7-27-2010: because the parentNode could be set but
		** the parent might not be in the Dom
		*/
		return true;
	}
	return false;
}


function jr_TableNumRows( object)
{
	return object.rows.length;
}

function jr_SelectGetSelected( select_el)
{
	return select_el.value;
}

function jr_SelectSetSelected( select_el, value_string)
{
	var option_el;

	/*
	** 1-23-2013: first unselect any items.
	*/
	if (select_el.selectedIndex !== undefined) {
		option_el	= select_el.options[select_el.selectedIndex];

		jr_ElementSetAttr( option_el,	"selected", null);
	}
	jr_SelectAddSelected( select_el, value_string);
}

function jr_SelectAddSelected( select_el, value_string)
{
	var num_options		= 0;
	var option_el;
	var z;

	if (select_el.options && select_el.options.length !== undefined) {
		num_options	= select_el.options.length;
	}
	for (z=0; z < num_options; z++) {
		option_el	= select_el.options[z];

		if (option_el.value == value_string) {
			jr_ElementSetAttr( option_el,	"selected", "selected");
			break;
		}
	}
}

function jr_SelectAddOption( select_el, label_string, selected_value, opt_default_value)
{
	/*
	** 9-16-2017: untested
	*/
	var option_el		= jr_ElementAppendChild( select_el, "option");

	option_el.innerHTML = label_string;
	jr_ElementSetAttr( option_el,	"value", selected_value);

	if (selected_value == opt_default_value) {
		jr_ElementSetAttr( option_el,	"selected", "selected");
	}
}



function jr_ElementGetAssignedStyle( el, styleName)
{
	var		style_value = el.style[styleName];


	/*
	** 12-30-2010: style_value === null should be ok in test below
	** since typeof will be false
	*/

	if (	style_value !== undefined
		&&  typeof style_value == "string"
		&&	jr_IsPixelStyle[ styleName]
		&&	style_value.indexOf("px") >= 0) {

		style_value	= Number( jr_GetLeadingNumber( style_value));
	}

	return style_value;
}

function jr_ElementGetActiveStyle( el, styleName)
{
	var		style_value;

	if (document.defaultView && document.defaultView.getComputedStyle) {
		/*
		** 1/9/07: Konqueror, Firefox, Opera
		** Prefer this approach, Opera supports both, but this one provides
		** the inherited/computed value for the element.
		**
		** 9/28/09: requires the CSS version of the name.
		*/
		var		style_name	= "";	
		var		curr_char;
		var		q;

		for (q=0; q < styleName.length; q++) {
			curr_char	= styleName.charAt(q);

			if ('A' <= curr_char  &&  curr_char <= 'Z') {
				style_name	+= '-' + curr_char.toLowerCase(); 
			}
			else {
				style_name += curr_char;
			}
		}

		style_value = document.defaultView.getComputedStyle(el,null).getPropertyValue(style_name);
	}
	else if (false && el.currentStyle) {
		/*
		** 3/30/07 IE: reflects the style that was set, not the active style.
		*/

		style_value = el.currentStyle [styleName];
	}
	else if (el.style[styleName]) {
		style_value = el.style[styleName];
	}
	else {
		style_value = null;
	}
	if (	jr_IsPixelStyle[ styleName]
		&&  typeof style_value == "string"
		&&	style_value.indexOf("px") >= 0) {

		style_value	= Number( jr_GetLeadingNumber( style_value));
	}
	return style_value;
}

var		jr_ConvertSizeDiv;

function jr_ConvertSizeToPx( orig_size, orig_units, dimension, context_div)
{
	var		size_px;
	var		saved_onresize;

	if (jr_IsIE) {
		saved_onresize	= window.onresize;

		window.onresize = null;
	}

	if (jr_ConvertSizeDiv === undefined) {
		jr_ConvertSizeDiv	= jr_ElementAppendChild( document.body, "div");

		jr_ElementSetStyle( jr_ConvertSizeDiv, "position",			"absolute");
		jr_ElementSetStyle( jr_ConvertSizeDiv, "backgroundColor",	"transparent");
		jr_ElementSetStyle( jr_ConvertSizeDiv, "color",				"transparent");
	}

	jr_ElementAppendChild( context_div, jr_ConvertSizeDiv);

	if (dimension == "height") {
		jr_ElementSetStyle( jr_ConvertSizeDiv, "height", orig_size, orig_units);
		size_px	= jr_ConvertSizeDiv.offsetHeight;
	}
	else {
		jr_ElementSetStyle( jr_ConvertSizeDiv, "width", orig_size, orig_units);
		size_px	= jr_ConvertSizeDiv.offsetWidth;
	}
	jr_ElementRemoveFromDom( jr_ConvertSizeDiv);

	if (jr_IsIE) {
		window.onresize	= saved_onresize;
	}

	return size_px;
}

var		jr_TextWidthDiv;

function jr_GetTextWidthPx( text_string, context_div)
{
	var		context_clone;
	var		test_span;
	var		test_div;
	var		width_em;
	var		width_px;
	var		saved_onresize;

	if (jr_IsIE) {
		saved_onresize	= window.onresize;

		window.onresize = null;
	}

	if (jr_TextWidthDiv === undefined) {
		jr_TextWidthDiv	= jr_ElementAppendChild( document.body, "div");

		jr_ElementSetStyle( jr_TextWidthDiv, "position",		"absolute");
		jr_ElementSetStyle( jr_TextWidthDiv, "left",			-10000);
		jr_ElementSetStyle( jr_TextWidthDiv, "width",			10000);
		jr_ElementSetStyle( jr_TextWidthDiv, "backgroundColor",	"transparent");
		jr_ElementSetStyle( jr_TextWidthDiv, "color",			"transparent");
	}
	/*
	** 10-13-2011: need to clone the context to get the font styles in effect.
	*/

	context_clone	= context_div.cloneNode( false);
	jr_ElementAppendChild( jr_TextWidthDiv, context_clone);

	if (typeof text_string == "string") {
		test_span	= jr_ElementAppendChild( context_clone, "span");

		jr_ElementAppendText( test_span, text_string);

		width_px	= test_span.offsetWidth;
	}
	else if (typeof text_string == "number") {

		width_em	= text_string;

		test_div	= jr_ElementAppendChild( context_clone, "div");

		jr_ElementSetStyle( test_div, "width", width_em, "em");

		width_px	= test_div.offsetWidth;
	}
	jr_ElementRemoveFromDom( context_clone);

	if (jr_IsIE) {
		window.onresize	= saved_onresize;
	}

	return width_px;
}

function jr_ElementGetFontInfo( parent_el, opt_avg_text_sample)
{
	/*
	** 1/8/07: Compute the default font width for this element.
	** Need to append to the parent first since otherwise no size info
	*/
	var tmp_text			= document.createTextNode ("M");
	var avg_string			= "atchiakerS";
	var font_info			= new Object();
	var test_div;
	var test_span;

	if (opt_avg_text_sample) {
		avg_string = opt_avg_text_sample;
	}

	/*
	** 1-17-2013: For proper heights use div since spans always add some pixels.
	** For widths, use a span inside the div.
	*/

	test_div	= jr_ElementAppendChild( parent_el,  "div");
	test_span	= jr_ElementAppendChild( test_div,  "span");

	jr_ElementSetStyle( test_div, "color",				"transparent");
	jr_ElementSetStyle( test_div, "backgroundColor",	"transparent");
	jr_ElementSetStyle( test_div, "lineHeight",			1, "em");

	jr_ElementAppendChild( test_span, tmp_text);

	font_info.em_width_px		= test_span.offsetWidth;
	font_info.em_height_px		= test_div.offsetHeight;

	jr_ElementSetStyle( test_div, "fontSize", 2, "px");

	font_info.min_em_width_px		= test_span.offsetWidth;
	font_info.min_em_height_px		= test_div.offsetHeight;

	tmp_text.appendData (avg_string);

	font_info.min_avg_width_px	= Math.round( test_span.offsetWidth / tmp_text.length);
	
	jr_ElementSetStyle( test_div, "fontSize", null);

	font_info.avg_width_px		= Math.round( test_span.offsetWidth / tmp_text.length);

	jr_ElementRemoveFromDom( test_div);

	return font_info;
}

function jr_ElementGetFontWidthPx( element)
{
	var		font_info			= jr_ElementGetFontInfo( element);

	return jr_FontWidthPx( font_info);
}

function jr_ElementGetFontHeightPx( element)
{
	var		font_info			= jr_ElementGetFontInfo( element);

	return jr_FontHeightPx( font_info);
}

function jr_ElementGetAvgFontWidthPx( element)
{
	var		font_info			= jr_ElementGetFontInfo( element);

	return jr_FontAvgWidthPx( font_info);
}

function jr_FontWidthPx( font_info)
{
	return font_info.em_width_px;
}

function jr_FontMinWidthPx( font_info)
{
	return font_info.min_em_width_px;
}

function jr_FontHeightPx( font_info)
{
	return font_info.em_height_px;
}

function jr_FontMinHeightPx( font_info)
{
	return font_info.min_em_height_px;
}

function jr_FontAvgWidthPx( font_info)
{
	return font_info.avg_width_px;
}

function jr_FontMinAvgWidthPx( font_info)
{
	return font_info.min_avg_width_px;
}

function jr_ElementSetOpacityPercent( element, percentage)
{
	if (jr_IsIE) {
		element.style.filter		= "alpha(opacity=" + percentage + ")";
	}
	else {
		/*
		** 12-29-2010: not tested
		*/
		element.style.opacity		= percentage/100;
	}
}

function jr_ElementSetIsDraggable( element, value)
{
	if (value) {
		element.jr_is_draggable = true;
	}
	else {
		element.jr_is_draggable = false;
	}
}

function jr_ElementIsDraggable( element )
{
	return element.jr_is_draggable;
}

function jr_ElementCenter( element, opt_el_height, opt_height_units, opt_el_width, opt_width_units)
{
	jr_ElementCenterVertical( element, opt_el_height, opt_height_units);
	jr_ElementCenterHorizontal( element, opt_el_width, opt_width_units);
}

function jr_ElementCenterVertical( element, opt_el_height, opt_height_units)
{
	var		pos_style		= jr_ElementGetActiveStyle( element, "position");
	var		parentHeight;

	if (pos_style == "static"  ||  pos_style == "fixed") {
		throw new Error( "jr_ElementCenter() : not supported with 'static' or 'fixed' positioned elements");
	}
	if (! element.offsetParent) {
		throw new Error( "jr_ElementCenter(): element not in DOM");
	}
	if (element.offsetParent.offsetHeight == 0) {
		throw new Error( "jr_ElementCenter(): parent has 0 height");
	}
	if (element.offsetHeight == 0) {
		throw new Error( "jr_ElementCenter(): element has 0 height");
	}

	if (opt_el_height) {
		jr_ElementSetStyle( element,	"height",		opt_el_height, opt_height_units);
	}

	if (element.offsetParent.offsetHeight  >  element.offsetHeight) {
		/*
		** 10-10-2011: set margin first, since setting top/left can change size
		*/
		if (jr_ElementIsDraggable( element) || pos_style == "relative") {
			/*
			** 10-29-2011: can't use negative margins, causes the drag algorithm to jump.
			** Don't need that approach anyway, since draggable objects don't need to 
			** keep their centering on resize.
			*/
			var		top_offset;

			top_offset = Math.round( (element.offsetParent.offsetHeight - element.offsetHeight) / 2);

			jr_ElementSetStyle( element,	"top",			top_offset);
		}
		else {
			jr_ElementSetStyle( element,	"marginTop",	-Math.round( element.offsetHeight/2));
			jr_ElementSetStyle( element,	"top",			"50%");
		}
	}
}


function jr_ElementCenterHorizontal( element, opt_el_width, opt_width_units)
{
	var		pos_style		= jr_ElementGetActiveStyle( element, "position");

	if (pos_style == "static"  ||  pos_style == "fixed") {
		throw new Error( "jr_ElementCenter() : not supported with 'static' or 'fixed' positioned elements");
	}
	if (! element.offsetParent) {
		throw new Error( "jr_ElementCenter(): element not in DOM");
	}
	if (element.offsetParent.offsetWidth == 0) {
		throw new Error( "jr_ElementCenter(): parent has 0 width");
	}
	if (element.offsetWidth == 0) {
		throw new Error( "jr_ElementCenter(): element has 0 width");
	}

	if (opt_el_width) {
		jr_ElementSetStyle( element,	"width",		opt_el_width, opt_width_units);
	}

	if (element.offsetParent.offsetWidth  >  element.offsetWidth) {
		/*
		** 10-10-2011: set margin first, since setting top/left can change size
		*/
		if (jr_ElementIsDraggable( element) || pos_style == "relative") {
			/*
			** 10-29-2011: can't use negative margins, causes the drag algorithm to jump.
			** Don't need that approach anyway, since draggable objects don't need to 
			** keep their centering on resize.
			*/
			var		left_offset;

			left_offset = Math.round( (element.offsetParent.offsetWidth - element.offsetWidth) / 2);

			jr_ElementSetStyle( element,	"left",			left_offset);
		}
		else {
			jr_ElementSetStyle( element,	"marginLeft",	-Math.round( element.offsetWidth/2));
			jr_ElementSetStyle( element,	"left",			"50%");
		}
	}
}



var jr_StructuralTags	= {
	/*
	** 11/13/09: Elements that can't be deleted/replaced
	** w/o understanding the grammar rules for each.
	** For example, LI can only appear in OL, UL, etc,
	** and that's all that can technically go there.
	*/
	"LI"			: true,
	"DT"			: true,
	"DD"			: true
};

var jr_BlockTags	= {
	"DIV"			: true,
	"P"				: true,
	"PRE"			: true,
	"FORM"			: true
	/*
	** 10/2/09: missing BLOCKQUOTE, which can have a nested block
	*/
};

var jr_ListTags		= {
	/*
	** 10/2/09: These are also block tags
	*/
	"OL"			: true,
	"UL"			: true,
	"DL"			: true
};

var jr_ListEntryTags		= {
	/*
	** 10/2/09: These are also block tags
	*/
	"LI"			: true,
	"DT"			: true,
	"DD"			: true
};

var jr_HeadingTags	= {
	/*
	** 10/2/09: These are also block tags
	*/
	"H1"			: true,
	"H2"			: true,
	"H3"			: true,
	"H4"			: true,
	"H5"			: true,
	"H6"			: true
};

var jr_HasSubFlow	= {
	"DIV"			: true,
	"LI"			: true,
	"DD"			: true
	/*
	** 11/16/09: TH, TD
	** 3-8-2011: i.e. can have nested blocks or inline.
	*/
};

function jr_InitCategoryGlobals()
{
	/*
	** http://www.w3.org/TR/html40/sgml/dtd.html
	** http://webdesignfromscratch.com/html-css/css-block-and-inline.php
	**
	** 10/1/09: HTML has inline (text-level) vs. block level tags.
	** Block: takes up whole line, implies 
	**
	** 6/22/09: Block tags (according to HTML grammer) include the following:
	** (also all headings are blocks)
	**
	** Block:
	** P | %heading; | %list; | %preformatted; | DL | DIV | NOSCRIPT |
	** BLOCKQUOTE | FORM | HR | TABLE | FIELDSET | ADDRESS
	*/
	for (tag_name in jr_ListTags) {
		jr_BlockTags[tag_name]	= true;
	}
	for (tag_name in jr_ListEntryTags) {
		jr_BlockTags[tag_name]	= true;
	}
	for (tag_name in jr_HeadingTags) {
		jr_BlockTags[tag_name]	= true;
	}
}

jr_InitCategoryGlobals();

function jr_AddStructuralTag( tag_name)
{
	jr_StructuralTags[ tag_name.toUpperCase()] = true;
}

function jr_AddBlockTag( tag_name)
{
	jr_BlockTags[ tag_name.toUpperCase()] = true;
}

function jr_AddHeadingTag( tag_name)
{
	jr_HeadingTags[ tag_name.toUpperCase()] = true;
}

function jr_NodeInitCategories( object)
{
	var		tag_name;
	var		tag_type;


	if (object.jr_has_categories) {
		return object.jr_tag_name;
	}
	else {
		object.jr_has_categories	= true;
	}

	if (object.nodeType == jr_Node.TEXT_NODE) {
		object.jr_is_text	= true;
		return undefined;
	}
	else if (object.tagName) {
		tag_name	= object.tagName.toUpperCase();

		if (tag_name == "DIV") {
			/*
			** 11/23/09: the "artificial" jr_tagName gets precedence in categorization
			*/
			var		custom_tag	= object.getAttribute( jr_TAG_ATTR_NAME);

			if (custom_tag) {
				tag_name	= custom_tag.toUpperCase();
			}
		}
	}
	else {
		return undefined;
	}

	tag_type				= "jr_is_" + tag_name;
	object[tag_type]		= true;

	object.jr_tag_name		= tag_name;

	if (jr_BlockTags[ tag_name]) {
		object.jr_is_block		= true;

		/*
		** 11/23/09: The following are all block tags
		*/
		if (jr_ListTags[ tag_name]) {
			object.jr_is_list		= true;
		}
		if (jr_ListEntryTags[ tag_name]) {
			object.jr_is_list_entry	= true;
		}
		if (jr_HeadingTags[ tag_name]) {
			object.jr_is_heading	= true;
		}
		if (jr_HasSubFlow[ tag_name]) {
			object.jr_has_sub_flow	= true;
		}
		if (jr_StructuralTags[ tag_name]) {
			object.jr_is_structural	= true;
		}
	}
	return object.jr_tag_name;
}

function jr_NodeHasCategories( object)
{
	return object.jr_has_categories;
}

function jr_NodeIsText( object)
{
	return object.nodeType == jr_Node.TEXT_NODE;
}

function jr_NodeIsBlock( object)
{
	if (object) {
		if (!object.jr_has_categories) {
			jr_NodeInitCategories( object);
		}
		if (object.jr_is_block) {
			return true;
		}
	}
	return false;
}

function jr_NodeIsList( object)
{
	if (object) {
		if (!object.jr_has_categories) {
			jr_NodeInitCategories( object);
		}
		if (object.jr_is_list) {
			return true;
		}
	}
	return false;
}

function jr_NodeIsListEntry( object)
{
	if (object) {
		if (!object.jr_has_categories) {
			jr_NodeInitCategories( object);
		}
		if (object.jr_is_list_entry) {
			return true;
		}
	}
	return false;
}

function jr_IsListTag( tag_name)
{
	if (jr_ListTags[ tag_name]) {
		return true;
	}
	return false;
}

function jr_NodeIsFirstNonEmpty( curr_node)
{
	while (curr_node.previousSibling) {

		curr_node	= curr_node.previousSibling;

		/*
		** 10/20/09: Don't count empty text nodes
		*/
		if (curr_node.nodeType == jr_Node.TEXT_NODE  &&  curr_node.data.length == 0) {
			continue;
		}
		else {
			return false;
		}
	}
	return true;
}

function jr_NodeIsLastNonEmpty( curr_node)
{
	while (curr_node.nextSibling) {

		curr_node	= curr_node.nextSibling;

		/*
		** 10/20/09: Don't count empty text nodes
		*/
		if (curr_node.nodeType == jr_Node.TEXT_NODE  &&  curr_node.data.length == 0) {
			continue;
		}
		else {
			return false;
		}
	}
	return true;
}

var		jr_DynamicStyleSheet	= null;

function jr_DocumentGetDynamicStyleSheet()
{
	if (jr_DynamicStyleSheet === null) {
		if (document.styleSheets.length == 0) {
			/*
			** 12/3/09: If there are not style sheets, the following
			** will create a new style and implicitly a new style sheet.
			*/
			var	dummy_style	= document.createElement( "style");
			document.body.appendChild( dummy_style);
		}
		if (document.styleSheets.length == 0) {
			/*
			** 12/3/09: Use the last style sheet, since it's values will override all others?
			*/
			throw new Error( "no style sheets and can't create one");
		}
		else {
			jr_DynamicStyleSheet	= document.styleSheets[document.styleSheets.length - 1];
		}
	}
	return jr_DynamicStyleSheet;
}

function jr_DocumentGetRules()
{
	var		style_sheet		= jr_DocumentGetDynamicStyleSheet();
	var		css_rules;

	if (style_sheet.cssRules) {
		css_rules	= style_sheet.cssRules;
	}
	else if (style_sheet.rules) {
		css_rules	= style_sheet.rules;
	}
	else {
		throw new Error( "no rules in style sheet?");
	}
	return css_rules;
}

function jr_DocumentAddStyleRule( selector, declaration, opt_index)
{
	var		style_sheet		= jr_DocumentGetDynamicStyleSheet();
	var		css_rules		= jr_DocumentGetRules();
	var		rule_index;

	if (opt_index == undefined  ||  opt_index < 0  ||  opt_index > css_rules.length) {
		rule_index	= css_rules.length;
	}
	else {
		rule_index	= opt_index;
	}

	if (style_sheet.addRule) {
		style_sheet.addRule( selector, declaration, rule_index);
	}
	else if (style_sheet.insertRule) {
		/*
		** 12/3/09: Firefox method.
		*/
		var	rule_string		= selector + "{" + declaration + ";}";

		style_sheet.insertRule( rule_string, rule_index);
	}
	else {
		throw new Error( "adding style sheet rules not supported on: " + jr_UserAgent);
	}

	/*
	** 12/3/09: A cssRule object has fiels: selectorText and style field
	*/
	return css_rules[rule_index];
}

function jr_StringBuf()
{
}

function jr_StringBufCreate()
{
	var		object	= new jr_StringBuf();

	object.buffer	= new Array();

	return object;
}

function jr_StringBufEmpty( object)
{
	object.buffer	= new Array();
}

function jr_StringBufAdd( object, string)
{
	object.buffer.push( string);
}

function jr_StringBufContents( object, separator)
{
	if (!separator) {
		separator	= "";
	}

	return object.buffer.join( separator);
}

function jr_StringBufSetAsHtml( object, element)
{
	element.innerHTML = jr_StringBufContents( object);
}

function jr_StringBufAddSelectPulldown(
	str_buf, opt_select_element_id, element_class, option_array, opt_default_value, allow_multiple)
{
	var	attr_str;

	if (opt_select_element_id) {
		jr_StringBufAdd( str_buf, '<select id="' + opt_select_element_id + '"');
		if (allow_multiple) {
			jr_StringBufAdd( str_buf, ' multiple');
		}
		jr_StringBufAdd( str_buf, ' class="' + element_class + '">');
	}

	for (var z in option_array) {
		var option_info		= option_array[z];

		attr_str			= 'value="' + option_info.selected_value + '"';

		if (option_info.selected_value == opt_default_value) {
			attr_str		+= ' selected="selected"';
		}
		if (option_info.attrs){
			for (var i in option_info.attrs) {
				attr_str		+= ' ' + i + '="' + option_info.attrs[i] + '"';
			}
		}
		jr_StringBufAdd( str_buf, '<option ' + attr_str + '> ' + option_info.label + ' </option>');
	}

	if (opt_select_element_id) {
		jr_StringBufAdd( str_buf, '</select> ');
	}
}


function jr_Trim( str_arg)
{
	/*
	** 2-22-2011: copied from this post:
	** http://stackoverflow.com/questions/1418050/string-strip-for-javascript
	*/
	if (String.prototype.trim === undefined) {
		return String(str_arg).replace(/^\s+|\s+$/g, '');
	}
	else {
		return str_arg.trim();
	}
}

function jr_sf( format_str )
{
	/*
	** 2-25-2011: hook for sprintf()-like functionality (%s only, %10s, %-10s, etc.)
	** and internationalization (lookup each format_str, get new format_str and
	** possible argument transformation).
	**
	** Use jr_sf.arguments for argument array.
	*/
	return format_str;
}

function jr_ObjectImportFields( dest_obj, src_obj, keep_existing)
{
	/*
	** 7/17/09 ToDo: if one of the fields is the dependent ids array, 
	** the has_changed will always be true, since array equality
	** is true only if they are the same array.
	*/
	var		has_changed		= false;
	var		field_name;
	var		sub_changed;

	for (field_name in src_obj) {
		if (keep_existing  &&  dest_obj[field_name] !== undefined) {
			continue;
		}
		if (typeof src_obj[field_name] == "object") {
			if (typeof dest_obj[field_name] != "object") {

				has_changed				= true;
			}
			if (src_obj[field_name].constructor === Array) {
				if (!dest_obj[field_name]  ||  dest_obj[field_name].constructor !== Array) {
					has_changed			= true;
				}
				dest_obj[field_name]	= new Array();
			}
			else {
				dest_obj[field_name]	= new Object();
			}

			sub_changed	= jr_ObjectImportFields(
							dest_obj[field_name], src_obj[field_name], keep_existing
						);

			if (sub_changed) {
				has_changed				= true;
			}
		}
		else if (typeof src_obj[field_name] == "function") {
		}
		else {
			if (dest_obj[field_name] != src_obj[field_name]) {
				dest_obj[field_name]	= src_obj[field_name];
				has_changed				= true;
			}
		}
	}
	return has_changed;
}

function jr_ElementFadeIn( element, fade_time_ms)
{
}

function jr_ElementFadeOut( element, fade_time_ms)
{
}

var		jr_UniqueId	= 1;

function jr_GetUniqueDomId( id_base_string)
{
	return id_base_string + "_" + jr_UniqueId++;
}

function jr_CreateDateUtc( utc_timestamp_msec)
{
	var		new_date;

	/*
	** 4-17-2012: the standard Date() constructor takes a timestamp in local time (msec)
	** This assumes the timestamp is in UTC.
	** Note Date.getTimezoneOffset() returns minutes.
	*/
	new_date	= new Date( utc_timestamp_msec);
	new_date	= new Date( utc_timestamp_msec + 1000 * new_date.getTimezoneOffset() * 60);

	return new_date;
}

function jr_IsArray( object)
{
	if (Array.isArray) {
		return Array.isArray( object);
	}
	if (object instanceof Array) {
		return true;
	}
	if (object.constructor === Array) {
		return true;
	}
	return false;
}

function jr_IsObject( object)
{
	/*
	** 4-20-2017: returns false for the "prototype" field of any object
	** and also for an object with a "null" prototype field, 
	** for example created with:  Object.create(null)
	** See: http://stackoverflow.com/questions/8511281/check-if-a-value-is-an-object-in-javascript
	*/
	if (object instanceof Object) {
		return true;
	}
	return false;
}
