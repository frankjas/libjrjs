
function jr_Image()
{
	/*
	** 1-9-2011: Create an abstraction for an image that
	** allows resizing according to arbitrary units, pixels, ems, etc.
	**
	** According to w3.org an IMG element can be pixels
	** or "en" (half point size), but anything but pixels doesn't work.
	** Setting the width/height to percentages does. So wrap the
	** IMG in a DIV, the latter which gets sized, the former is at 100%.
	** http://www.w3.org/MarkUp/html3/img.html
	**
	** 10-4-2011: IE, Chrome, and Safari scale the image to fit the parent div,
	** ruining the aspect ratio, so first calculate that ratio in an
	** offscreen div.  On IE actually requires the offscreen div, the others
	** can use the img_div before the "display" style is set.
	*/
}

function jr_ImageInit( object, parent_el, img_url, onload_handler, options, style_class)
{
	object.img_div				= jr_ElementAppendChild( parent_el,			"div");
	object.is_loaded			= false;
	object.vary_aspect_ratio	= false;

	if (typeof onload_handler == "function") {
		object.onload_handler		= onload_handler;
	}
	else {
		/*
		** 10-7-2011: didn't pass a handler but did pass options.
		*/
		options	= onload_handler;
	}

	if (typeof options == "string") {
		style_class	= options;
		options	= undefined;
	}

	if (options) {
		if (options.vary_aspect_ratio) {
			object.vary_aspect_ratio	= true;
		}
	}
	if (style_class) {
		jr_ElementSetClass( object.img_div, style_class);
	}

	if (jr_IsIE7) {
		jr_ElementSetStyle( object.img_div, "zoom", 1);
		jr_ElementSetStyle( object.img_div, "display", "inline");
	}
	else {
		jr_ElementSetStyle( object.img_div, "display", "inline-block");
	}
	jr_ElementSetStyle( object.img_div, "lineHeight", "normal");

	jr_ImageSetSrc( object, img_url);
}


function jr_ImageCreate( parent_el, img_url, onload_handler, options)
{
	var		object			= new jr_Image();

	jr_ImageInit( object, parent_el, img_url, onload_handler, options);

	return object;
}

function jr_ImageDiv( object)
{
	return object.img_div;
}

function jr_ImageSrcUrl( object)
{
	return object.src_url;
}

function jr_ImageNaturalHeight( object)
{
	return object.natural_height;
}

function jr_ImageNaturalWidth( object)
{
	return object.natural_width;
}

function jr_ImageNaturalAspectRatio( object)
{
	return object.aspect_ratio;
}


function jr_ImageSetSrc( object, src_url)
{
	if (object.tmp_div) {
		/*
		** 10-6-2011: still waiting for the previous url to load.
		*/
		object.next_src_url	= object.src_url;
		return;
	}
	/*
	** 10-6-2011: load object into an offscreen div
	*/
	object.tmp_div		= jr_ElementAppendChild( document.body, "div");
	object.img_el		= jr_ElementAppendChild( object.tmp_div, "img");
	object.is_loaded	= false;
	object.has_error	= false;
	object.load_error	= false;
	object.load_abort	= false;
	object.src_url		= src_url;

	jr_ElementSetStyle( object.tmp_div, "position",	"absolute");
	jr_ElementSetStyle( object.tmp_div, "left",		10000);

	object.img_el.onload		= function()		{ jr_ImageOnLoad( object); };
	object.img_el.onerror		= function( text)	{ jr_ImageOnError( object, text); };
	object.img_el.onabort		= function()		{ jr_ImageOnAbort( object); };

	jr_ElementSetAttr( object.img_el, "src", src_url);

	if (object.img_el.complete && !object.is_loaded) {
		/*
		** 12-20-2012: in at least IE9, the onload is when the src is set.
		** The second call to jr_ImageOnLoad() fails with the offsetHeight,Width begin 0
		** although the first call due to the "src" change it's good.
		*/
		object.img_el.onload	= null;

		jr_ImageOnLoad( object);
	}
}


function jr_ImageOnLoad( object)
{
	if (object.img_el.naturalHeight !== undefined) {
		object.natural_height	= object.img_el.naturalHeight;
		object.natural_width	= object.img_el.naturalWidth;
	}
	else {
		object.natural_height	= object.img_el.offsetHeight;
		object.natural_width	= object.img_el.offsetWidth;
	}

	if (object.natural_height == 0  ||  object.natural_width == 0) {
		throw new Error( 'image "' + object.src_url + '" has zero size: ['
			+ object.natural_height + ', ' + object.natural_height + ']'
		);
	}

	object.aspect_ratio		= object.natural_width / object.natural_height;

	jr_ElementDeleteChildren( object.img_div);
	/*
	** 10-6-2011: delete all current children first to reduce the resize calculations
	*/

	object.is_loaded		= true;
	/*
	** 10-6-2011: is_loaded needs to be set before calling jr_ImageSetHeight()
	*/
	if (object.size_was_set) {
		if (object.set_height) {
			jr_ImageSetHeight( object);
		}
		if (object.set_width) {
			jr_ImageSetWidth( object);
		}
	}
	else {
		jr_ElementSetStyle( object.img_div,	"height",	object.natural_height);
		jr_ElementSetStyle( object.img_div,	"width",	object.natural_width);
	}

	jr_ElementAppendChild( object.img_div, object.img_el);

	jr_ElementSetStyle( object.img_el,	"height",	"100%");
	jr_ElementSetStyle( object.img_el,	"width",	"100%");

	jr_ElementRemoveFromDom( object.tmp_div);

	/*
	** 10-6-2011: delete the next_src_url before tmp_div,
	** so that a jr_ImageSetSrc() coming between the delete
	** and the jr_ImageSetSrc() below
	*/
	var		next_src_url	= object.next_src_url;

	delete object.next_src_url;
	delete object.tmp_div;

	if (next_src_url) {
		jr_ImageSetSrc( object, next_src_url);
	}
	else {
		if (object.onload_handler) {
			object.onload_handler( object);
		}
	}
}

function jr_ImageOnError( object, error_msg)
{
	object.has_error	= true;
	object.load_error	= true;

	alert( "Couldn't load image '" + object.src_url + "': " + error_msg);
}

function jr_ImageOnAbort( object)
{
	object.has_error	= true;
	object.load_abort	= true;
}

function jr_ImageSetHeight( object, img_height, opt_units)
{
	if (img_height === undefined) {
		img_height				= object.set_height;
		opt_units				= object.set_height_units;
	}
	else {
		object.set_height		= img_height;
		object.set_height_units	= opt_units;
		object.size_was_set		= true;
	}

	if (object.is_loaded) {
		jr_ElementSetStyle( object.img_div, "height", img_height, opt_units);

		if (! object.vary_aspect_ratio) {
			jr_ElementSetStyle(
				object.img_div, "width",
				Math.round( object.img_div.offsetHeight * object.aspect_ratio)
			);
		}
	}
}

function jr_ImageSetWidth( object, img_width, opt_units)
{
	if (img_width === undefined) {
		img_width				= object.set_width;
		opt_units				= object.set_width_units;
	}
	else {
		object.set_width		= img_width;
		object.set_width_units	= opt_units;
		object.size_was_set		= true;
	}

	if (object.is_loaded) {
		jr_ElementSetStyle( object.img_div, "width", img_width, opt_units);

		if (! object.vary_aspect_ratio) {
			jr_ElementSetStyle(
				object.img_div, "height",
				Math.round( object.img_div.offsetWidth / object.aspect_ratio)
			);
		}
	}
}


