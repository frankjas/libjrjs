function jr_Button()
{
}

function jr_ButtonInit( object, img_obj, img_url, title_str)
{
	object.img_obj			= img_obj;
	object.img_url			= img_url;
	object.title_str		= title_str;
}

function jr_ButtonCreate( img_obj, img_url, title_str)
{
	var		object			= new jr_Button();

	jr_ButtonInit( object, img_obj, img_url, title_str);

	return object;
}

function jr_ButtonAppend( parent_el, img_url, title_str, opt_size, opt_units)
{
	var		img_obj			= jr_ImageCreate( parent_el, img_url);
	var		object			= jr_ButtonCreate( img_obj, img_url, title_str);
	var		size;
	var		units;

	if (opt_size === undefined) {
		size	= 1;
		units	= "em";
	}
	else {
		size	= opt_size;
		units	= opt_units;
	}

	jr_ImageSetHeight(	img_obj, size, units);
	jr_ImageSetWidth(	img_obj, size, units);

	jr_ElementSetStyle( jr_ImageDiv( img_obj),		"cursor",		"pointer");
	jr_ElementSetStyle( jr_ImageDiv( img_obj),		"border",		"1px solid transparent");

	jr_ElementRegisterHandler( jr_ImageDiv( img_obj),	jr_MOUSE_OVER_EVENT,	jr_ButtonActiveOverHandler, object);
	jr_ElementRegisterHandler( jr_ImageDiv( img_obj),	jr_MOUSE_OUT_EVENT,		jr_ButtonOutHandler, object);

	if (title_str) {
		jr_ElementSetAttr( jr_ImageDiv( img_obj), "title", title_str);
	}

	return object;
}

function jr_ButtonDiv( object)
{
	return jr_ImageDiv( object.img_obj);
}

function jr_ButtonElement( object)
{
	return jr_ImageDiv( object.img_obj);
}

function jr_ButtonSetImageSrc( object, img_src)
{
	jr_ImageSetSrc( object.img_obj, img_src);
}

function jr_ButtonSetTitle( object, title_str)
{
	jr_ElementSetAttr( jr_ImageDiv( object.img_obj), "title", title_str);
	object.title_str	= title_str;
}

function jr_ButtonSetClickHandler( object, handler_fn, handler_arg)
{
	object.handler_fn		= handler_fn;
	object.handler_arg		= handler_arg;

	jr_ElementRegisterHandler( jr_ImageDiv( object.img_obj), jr_CLICK_EVENT, object.handler_fn, object.handler_arg);
}

function jr_ButtonSetDisabledImgUrl( object, disabled_img_url)
{
	object.disabled_img_url		= disabled_img_url;
}

function jr_ButtonSetIsActive( object, value)
{
	if (value) {
		jr_ButtonActivate( object);
	}
	else {
		jr_ButtonDeactivate( object);
	}
}

function jr_ButtonDeactivate( object)
{
	var		button_el		= jr_ImageDiv( object.img_obj);

	jr_ElementUnRegisterHandler( button_el, jr_MOUSE_OVER_EVENT);
	jr_ElementUnRegisterHandler( button_el, jr_CLICK_EVENT);

	if (object.disabled_img_url) {
		jr_ImageSetSrc( object.img_obj, object.disabled_img_url);
	}
	else {
		/*
		** 1-15-2011: grey out by making partially opaque.
		*/
		jr_ElementSetOpacityPercent( button_el, 50);
	}

	jr_ElementSetStyle( button_el,		"cursor",		"default");

	if (object.title_str) {
		jr_ElementSetAttr( button_el, "title", null);
	}
}

function jr_ButtonActivate( object)
{
	var		button_el		= jr_ImageDiv( object.img_obj);

	jr_ElementRegisterHandler( button_el,	jr_MOUSE_OVER_EVENT, jr_ButtonActiveOverHandler, object);
	jr_ElementRegisterHandler( button_el, 	jr_CLICK_EVENT, object.handler_fn, object.handler_arg);

	if (object.disabled_img_url) {
		jr_ImageSetSrc( object.img_obj, object.img_url);
	}
	else {
		jr_ElementSetOpacityPercent( button_el, 100);
	}

	jr_ElementSetStyle( button_el,		"cursor",	"pointer");

	if (object.title_str) {
		jr_ElementSetAttr( button_el, "title", object.title_str);
	}
}

function jr_ButtonActiveOverHandler(object, button_el)
{
	jr_ElementSetStyle( button_el,		"border",		"1px solid gray");
}

function jr_ButtonOutHandler(object, button_el)
{
	jr_ElementSetStyle( button_el,		"border",		"1px solid transparent");
}

