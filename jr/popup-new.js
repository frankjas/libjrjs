function jr_Popup()
{
}

function jr_PopupInit( object, popup_div, close_div, grab_div)
{
	object.popup_div	= popup_div;
	object.close_div	= close_div;
	object.grab_div		= grab_div;
	object.shadow_width	= 0;

	if (object.close_div) {
		jr_ElementRegisterHandler( object.close_div, jr_CLICK_EVENT, jr_PopupClose, object);
		jr_ElementSetStyle( object.close_div, "cursor", "pointer");
	}
	if (object.grab_div) {
		object.drag_obj	= jr_DragCreate( popup_div.offsetParent);
	}
}

function jr_PopupCreate( popup_div, close_div, grab_div)
{
	var		object	= new jr_Popup();

	jr_PopupInit( object, popup_div, close_div, grab_div);

	return object;
}

function jr_PopupSetShadowWidth( object, value)
{
	object.shadow_width	= value;
}

var		jr_PopupMap	= new Array();

function jr_FindPopup( popup_key)
{
	var		object	= jr_PopupMap[ popup_key];

	if (object) {
		return object;
	}
	return undefined;
}

function jr_PopupSetIsUnique( object, popup_key, opt_duplicate_handler)
{
	object.popup_key			= popup_key;
	object.duplicate_handler	= opt_duplicate_handler;
}

function jr_PopupShow( object)
{
	if (object.popup_key) {
		if (jr_PopupMap[object.popup_key]) {
			/*
			** 11-6-2011: already popped up.
			*/
			if (object.duplicate_handler) {
				object.duplicate_handler( object);
			}
			return;
		}
		jr_PopupMap[object.popup_key]	= object;
	}

	jr_ElementSetStyle( object.popup_div,		"display",		"block");

	if (object.drag_obj) {
		jr_DragActivate( object.drag_obj, object.grab_div, object.popup_div);
	}

	if (object.shadow_width > 0  &&  !object.shadow_div) {
		object.shadow_div	= jr_ElementAppendChild( object.popup_div,	"div");

		jr_ElementSetStyle( object.shadow_div,		"position",			"absolute");
		jr_ElementSetStyle( object.shadow_div,		"backgroundColor",	"black");
		jr_ElementSetStyle( object.shadow_div,		"border",			"2px solid lightgrey");

		jr_ElementSetStyle( object.shadow_div,		"zIndex",			-1);

		jr_ElementSetOpacityPercent( object.shadow_div, 15);

		jr_ElementSetStyle( object.shadow_div,		"left",		-object.shadow_width);
		jr_ElementSetStyle( object.shadow_div,		"top",		-object.shadow_width);
		jr_ElementSetStyle( object.shadow_div,		"bottom",	-object.shadow_width);
		jr_ElementSetStyle( object.shadow_div,		"right",	-object.shadow_width);
	}

	jr_ElementCenter( object.popup_div);
}

function jr_PopupClose( object)
{
	jr_ElementRemoveFromDom( object.popup_div);

	if (object.popup_key) {
		delete jr_PopupMap[ object.popup_key];
	}
}
