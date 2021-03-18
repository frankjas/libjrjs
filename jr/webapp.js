
var i18n_string_map	= {};
var i18n_id_map		= {};
var i18n_next_id	= 1;

function i18n_reg(base_lang_string)
{
	if (i18n_string_map[base_lang_string] === undefined) {
		i18n_string_map[base_lang_string] = i18n_next_id;
		i18n_next_id++;
	}
	i18n_id = i18n_string_map[base_lang_string];

	i18n_id_map[i18n_id] = base_lang_string;

	return i18n_id;
}

function i$(i18n_id)
{
	if (typeof i18n_id == "string") {
		i18n_id = i18n_reg( i18n_id);
	}
	else if (i18n_id_map[i18n_id] === undefined) {
		return "i$(UNKNOWN MSG ID)";
	}
	return i18n_id_map[i18n_id];
}


function jr_WebApp( app_name, server_api_url, screen_map)
{
	this.app_name			= app_name;
	this.server_api_url		= server_api_url;

	this.do_debug			= false;
	/*
	** 8-28-2017: these fields will be overwritten with the first request
	*/
	this.session_timeout_error	= -1;
	this.internal_error			= -1;
	this.network_error			= -1;

	this.login_title_msg_id				= i18n_reg("Login");
	this.new_password_label_msg_id		= i18n_reg("New Password:");
	this.old_password_label_msg_id		= i18n_reg("Old Password:");


	this.password_change_msg_id			= i18n_reg("Changed password");

	this.password_form_title_msg_id		= i18n_reg("Login Settings");
	this.empty_password_msg_id			= i18n_reg("no passwords specified");
	this.empty_old_password_msg_id		= i18n_reg("no old password specified");
	this.empty_new_password_msg_id		= i18n_reg("no new password specified");
	this.config_submit_msg_id			= i18n_reg("Submit");

	this.user_name_label_msg_id			= i18n_reg("User Name");
	this.password_label_msg_id			= i18n_reg("Password");


	this.session_timeout_msg_id			= i18n_reg("Session timeout");
	this.bad_login_msg_id				= i18n_reg("Couldn't login");
	this.bad_logout_msg_id				= i18n_reg("Logout issue");
	this.bad_password_change_msg_id		= i18n_reg("Couldn't change password");

	this.confirm_timeout_msg_id			= i18n_reg("Your login session is about to expire. Continue instead?");

	this.confirm_timeout_wait_sec		= 30;


	this.login_header_height_em			= 3;
	this.header_height_em				= 3;
	this.menu_height_em					= 2;
	this.footer_height_em				= 2;

	this.screen_map						= screen_map;

	for (screen_id in this.screen_map) {
		screen_obj = this.screen_map[screen_id];

		screen_obj.screen_id			= screen_id;
		screen_obj.menu_entry_msg_id	= i18n_reg( screen_obj.menu_entry_string);

		if (screen_obj.is_default_screen) {
			this.default_screen_id		= screen_obj.screen_id;
		}
	}
}

jr_WebApp.prototype.undo = function() 
{
}

jr_WebApp.prototype.resizeHandler = function()
{
	jr_TileOnResize( this.root_tile);
}

jr_WebApp.prototype.reload = function()
{
	window.location.reload( true);
}

jr_WebApp.prototype.close_window = function()
{
	window.close();
}

jr_WebApp.prototype.setDebug = function( value)
{
	this.do_debug = true;
}

jr_WebApp.prototype.errorAlert = function ( message, reason)
{
	var reason_msg;

	if (typeof reason == "object") {
		if (reason.status == this.session_timeout_error) {
			this.showMessage( i$(this.session_timeout_msg_id));
			this.reload();
		}
		reason_msg	= reason.error_msg;
	}
	else if (typeof reason == "string") {
		reason_msg	= reason;
	}

	if (reason_msg) {
		message	+= ": " + reason_msg;
	}
	this.showMessage( message + ".", true /* is_error */);
}

jr_WebApp.prototype.processQueryTraces = function ( http_request, query_traces)
{
	jr_WebAppProcessQueryTraces( this, http_request, query_traces);
}

jr_WebApp.prototype.processServerResponseData = function( http_request, retval)
{
	if (retval.constant_map  &&  this.constant_map === undefined) {
		this.constant_map	= retval.constant_map;
		this.role_map		= retval.role_map;

		this.session_timeout_error	= Number( this.constant_map["jr_SESSION_TIMEOUT_ERROR"]);
		this.internal_error			= Number( this.constant_map["jr_INTERNAL_ERROR"]);
		this.transient_error		= Number( this.constant_map["jr_TRANSIENT_ERROR"]);
	}

	if (retval.session_timeout_sec) {
		jr_WebAppSetSessionTimeout( this, retval.session_timeout_sec);
	}
	if (retval.query_traces) {
		this.processQueryTraces( http_request, retval.query_traces);
	}

}

jr_WebApp.prototype.showMessage = function ( message, is_error)
{
	alert( message);
}

jr_WebApp.prototype.showLoading = function ( message)
{
	var loading_div;
	var	content_div;
	var	img_obj;
	var	text_div;

	if (this.loading_div) {
		this.loading_count ++;
		return;
	}
	if (!message && this.loading_msg) {
		message		= this.loading_msg;
	}

	loading_div		= jr_ElementAppendChild( jr_TileDiv( this.root_tile),	"div");
	content_div		= jr_ElementAppendChild( loading_div, "div");

	jr_ElementSetStyle( loading_div, "position",		"absolute");
	jr_ElementSetStyle( loading_div, "height",			10, "em");
	jr_ElementSetStyle( loading_div, "width",			20, "em");
	jr_ElementSetStyle( loading_div, "padding",			1, "em");
	jr_ElementSetStyle( loading_div, "backgroundColor",	"white");
	jr_ElementSetStyle( loading_div, "zIndex",			10000);

	jr_ElementSetStyle( content_div, "textAlign",		"center");
	jr_ElementSetStyle( content_div, "position",		"relative");


	if (this.loading_img_url) {
		img_obj			= jr_ImageCreate( content_div, this.loading_img_url);
	}

	if (message) {
		text_div	= jr_ElementAppendChild( content_div,	"div");
		jr_ElementAppendText( text_div, message);
	}
	jr_ElementCenterVertical( content_div);

	jr_ElementCenter( loading_div);

	$(loading_div).jqm({modal:true, toTop:true});
	$(loading_div).jqmShow();

	this.loading_div	= loading_div;
	this.loading_msg	= message;
	this.loading_count	= 1;
}

jr_WebApp.prototype.hideLoading = function ( force_close)
{
	if (this.loading_div) {
		this.loading_count--;

		if (!force_close && this.loading_count > 0) {
			return true;
		}
		$(this.loading_div).jqmHide();
		jr_ElementRemoveFromDom( this.loading_div);

		delete this.loading_div;

		return true;
	}
	return false;
}


jr_WebApp.prototype.displayStartup = function ( query_string)
{
	var		retval;

	retval	= jr_WebAppCheckSession( this);

	if (retval.status == 0) {
		this.activatePage( "main");
	}
	else {
		this.activatePage( "login");
	}
}

jr_WebApp.prototype.activatePage = function (page_name)
{
	jr_TileDisplay( this.root_tile, page_name);
}

jr_WebApp.prototype.initDom = function( root_div) 
{
	var root_tile			= jr_TileAppendRoot( root_div);
	var login_page_tile		= jr_TileAppendAltChild( root_tile, "login");
	var main_page_tile		= jr_TileAppendAltChild( root_tile, "main");
	

	jr_ElementSetStyle( root_div, "fontFamily", "Arial, sans-serif");

	jr_TileSetInitFn( login_page_tile,		jr_WebAppLoginPageInit, this);
	jr_TileSetInitFn( main_page_tile,		jr_WebAppMainPageInit, this);

	jr_TileSetDisplayFn( login_page_tile,	jr_WebAppActivateLogin, this);
	jr_TileSetDisplayFn( main_page_tile,	jr_WebAppActivateDefaultScreen, this);

	this.root_tile			= root_tile;
	this.login_page_tile	= login_page_tile
	this.main_page_tile		= main_page_tile;
}

function jr_WebAppLoginPageInit( webapp, login_page_tile)
{
	webapp.loginPageInit( login_page_tile);
}

function jr_WebAppMainPageInit( webapp, login_page_tile)
{
	webapp.mainPageInit( login_page_tile);
}

jr_WebApp.prototype.loginPageInit = function( login_page_tile)
{
	var		login_widget_div;
	var		login_tile;
	var		header_tile;
	var		body_tile;
	var		header_div;
	var		body_div;
	var		title_span;

	login_widget_div= jr_ElementAppendChild( jr_TileDiv( login_page_tile), "div", "wa_login_widget");
	login_tile		= jr_TileAppendRoot( login_widget_div, login_page_tile);

	header_tile		= jr_TileAppendChild( login_tile, this.login_header_height_em,	"em",	"top");
	body_tile		= jr_TileAppendChild( login_tile);

	header_div		= jr_ElementAppendChild( jr_TileDiv( header_tile),	"div",	"wa_login_header");
	title_span		= jr_ElementAppendChild( header_div,				"span",	"wa_login_title");
	body_div		= jr_ElementAppendChild( jr_TileDiv( body_tile),	"div",	"wa_login_body");

	jr_ElementAppendText( title_span, i$(this.login_title_msg_id));

	jr_WebAppLoginFormInit( this, body_div);

	jr_ElementCenter( login_widget_div);

	if (jr_IsIE) {
		/*
		** 10-1-2011: IE bug, heights not propagated yet.
		**
		** login_page_tile.parent_div.offsetParent.offsetHeight == 987
		** login_page_tile.tile_div.offsetParent == login_page_tile.parent_div
		** but login_page_tile.tile_div.offsetHeight is 0
		*/
		this.login_widget_div	= login_widget_div;
	}
}

jr_WebApp.prototype.mainPageInit = function( app_tile)
{
	var		header_tile;
	var		menu_tile;
	var		main_tile;
	var		footer_tile;

	if (this.header_height_em > 0) {
		header_tile		= jr_TileAppendChild( app_tile,		this.header_height_em,	"em", "top");
	}
	if (this.menu_height_em > 0) {
		menu_tile		= jr_TileAppendChild( app_tile,		this.menu_height_em,	"em", "top");
	}

	main_tile		= jr_TileAppendChild( app_tile);

	if (this.footer_height_em > 0) {
		footer_tile		= jr_TileAppendChild( app_tile,		this.footer_height_em,	"em");
	}

	if (header_tile) {
		this.headerTileInit(	header_tile);
	}
	
	if (menu_tile) {
		this.menuTileInit(		menu_tile);
	}
	this.mainTileInit(		main_tile);

	if (footer_tile) {
		this.footerTileInit(	footer_tile);
	}
}

function jr_WebAppActivateDefaultScreen( webapp)
{
	if (webapp.default_screen_id) {
		jr_WebAppActivateScreen( webapp, webapp.default_screen_id);
	}
}

function jr_WebAppActivateLogin( webapp)
{
	webapp.login_form_el.wa_user_name_el.focus();

	if (jr_IsIE) {
		/*
		** 10-1-2011: IE bug, heights not propagated until
		** now
		*/
		jr_ElementCenter( webapp.login_widget_div);
	}
}

function jr_WebAppActivateScreen( webapp, screen_name)
{
	var		fade_in_ms		= 250;
	var		fade_out_ms		= 250;

	if (screen_name == webapp.curr_screen_name) {
		return;
	}

	if (!webapp.curr_screen_name) {
		/*
		** 9-21-2011: i.e. ui just loaded, 
		** fade out the inactive stuff immediately, otherwise
		** on first load all menu entries are briefly visible.
		*/
		fade_out_ms	= 0;
	}

	jr_TileDisplay( webapp.screen_tile, screen_name);

	webapp.curr_screen_name = screen_name;

	if (screen_name == webapp.dummy_screen_name) {
		jr_WebAppActivateDummyMenu( webapp, fade_out_ms, fade_in_ms);
	}
	else {
		jr_WebAppActivateDefaultMenu( webapp, fade_out_ms, fade_in_ms);
	}
}

function jr_WebAppActivateDefaultMenu( webapp, fade_out_ms, fade_in_ms)
{
	$(webapp.menu_left_div).fadeIn( fade_in_ms);
	$(webapp.menu_logout_div).fadeIn( fade_in_ms);
	$(webapp.menu_status_div).fadeIn( fade_in_ms);
}

jr_WebApp.prototype.headerTileInit = function( parent_tile) 
{
	jr_ElementSetStyle( jr_TileDiv( parent_tile),		"backgroundColor",		"lightgreen");
}

jr_WebApp.prototype.footerTileInit = function( parent_tile) 
{
	jr_ElementSetStyle( jr_TileDiv( parent_tile),		"backgroundColor",		"lightblue");
}

/******** Menu Bar ********/

var		wa_RIGHT_MENU_WIDTH_EM			= 20;
var		wa_LOGOUT_MENU_WIDTH_EM			= 6;

var		wa_CONFIG_MENU_STRING			= i18n_reg("Config");
var		wa_LOGOUT_MENU_STRING			= i18n_reg("Logout");

jr_WebApp.prototype.menuTileInit = function( parent_tile) 
{
	var		right_tile		= jr_TileAppendChild( parent_tile, wa_RIGHT_MENU_WIDTH_EM, "em", "right");
	var		left_tile		= jr_TileAppendChild( parent_tile);

	var		logout_tile		= jr_TileAppendChild( right_tile, wa_LOGOUT_MENU_WIDTH_EM, "em", "right");
	var		status_tile		= jr_TileAppendChild( right_tile);

	var		left_div;
	var		status_div;
	var		logout_div;

	var		str_buf;

	jr_ElementSetClass( jr_TileDiv( parent_tile), "wa_menu_tile");

	left_div		= jr_ElementAppendChild( jr_TileDiv( left_tile),	"div", "wa_right_menu_entry");
	status_div		= jr_ElementAppendChild( jr_TileDiv( status_tile),	"div", "wa_menu_entry");
	logout_div		= jr_ElementAppendChild( jr_TileDiv( logout_tile),	"div", "wa_logout_menu_entry");

	str_buf					= jr_StringBufCreate();

	for (screen_id in this.screen_map) {
		screen_obj = this.screen_map[screen_id];

		jr_StringBufAdd( str_buf, '<span class="wa_menu_choice" id="' + screen_id + '">');
		jr_StringBufAdd( str_buf, i$(screen_obj.menu_entry_msg_id) + '</span>');
	}

	jr_StringBufAdd( str_buf, ' | <span class="wa_menu_choice" id="wa_config_choice">');
	jr_StringBufAdd( str_buf, i$(wa_CONFIG_MENU_STRING) + '</span>');

	jr_StringBufSetAsHtml( str_buf, left_div);
	{
		str_buf					= jr_StringBufCreate();

		jr_StringBufAdd( str_buf, '<span class="wa_menu_choice" id="wa_status_element">');
		jr_StringBufAdd( str_buf, '</span>');

		jr_StringBufSetAsHtml( str_buf, status_div);
	}
	{
		str_buf					= jr_StringBufCreate();

		jr_StringBufAdd( str_buf, '<span class="wa_menu_choice" id="wa_logout_choice">');
		jr_StringBufAdd( str_buf, i$(wa_LOGOUT_MENU_STRING) + '</span>');

		jr_StringBufSetAsHtml( str_buf, logout_div);
	}

	jr_ElementCenterVertical( left_div);
	jr_ElementCenterVertical( logout_div);
	jr_ElementCenterVertical( status_div);

	this.menu_left_div			= left_div;
	this.menu_status_div			= status_div;
	this.menu_logout_div			= logout_div;

	var		choice_el;

	for (screen_id in this.screen_map) {
		screen_obj = this.screen_map[screen_id];

		choice_el	= jr_ElementGetById( screen_id);
		jr_ElementRegisterHandler( choice_el, jr_CLICK_EVENT, jr_WebAppMenuChoiceHandler, this);
	}


	choice_el	= jr_ElementGetById( "wa_config_choice");
	jr_ElementRegisterHandler( choice_el, jr_CLICK_EVENT, jr_WebAppMenuChoiceHandler, this);
	this.config_menu_el	= choice_el;

	choice_el	= jr_ElementGetById( "wa_logout_choice");
	jr_ElementRegisterHandler( choice_el, jr_CLICK_EVENT, jr_WebAppMenuChoiceHandler, this);
	this.logout_menu_el	= choice_el;
}

function jr_WebAppMenuChoiceHandler( webapp, choice_el)
{
	var el_id		= jr_ElementGetAttr( choice_el, "id");
	var choice_el	= jr_ElementGetById( el_id);

	if (choice_el) {
		jr_WebAppHighlightMenuElement( webapp, choice_el);
	}
	if (el_id == "wa_logout_choice") {
		jr_WebAppLogout( webapp);
	}
	else {
		jr_WebAppActivateScreen( webapp, el_id);
	}
}

function jr_WebAppHighlightMenuElement( webapp, menu_choice_el)
{
	if (webapp.curr_menu_choice_el) {
		jr_ElementSetStyle( webapp.curr_menu_choice_el, "textDecoration", null);
	}
	jr_ElementSetStyle( menu_choice_el, "textDecoration", "underline");
	webapp.curr_menu_choice_el	= menu_choice_el;
}

/******** Main Content Area ********/

jr_WebApp.prototype.mainTileInit = function( parent_tile) 
{
	var		curr_tile;

	this.screen_tile	= parent_tile;

	for (screen_id in this.screen_map) {
		screen_obj = this.screen_map[screen_id];

		curr_tile		= jr_TileAppendAltChild( parent_tile, screen_id);

		screen_obj.screen_tile_init( this, curr_tile, screen_obj);
	}

	curr_tile		= jr_TileAppendAltChild( parent_tile, "wa_config_choice");
	jr_WebAppConfigTileInit( this, curr_tile);
}

/******** Configuration ********/

var		wa_PASSWORD_FORM_HEIGHT_EM		= 14;

function jr_WebAppConfigTileInit( webapp, parent_tile)
{
	var		left_tile		= jr_TileAppendChild( parent_tile,		50,	"%", "left");
	var		right_tile		= jr_TileAppendChild( parent_tile);

	var		password_tile;
	var		password_form;

	password_tile	= jr_TileAppendChild( left_tile,	wa_PASSWORD_FORM_HEIGHT_EM,	"em", "top");

	password_form	= jr_WebAppConfigFormCreate(
						webapp, password_tile, i$(webapp.password_form_title_msg_id)
					);

	jr_WebAppPasswordFormInit( webapp,	password_form);
}


function jr_WebAppConfigFormCreate( webapp, form_tile, title_string)
{
	var		form_div;
	var		form_obj;
	var		submit_el;

	form_div	= jr_ElementAppendChild( jr_TileDiv( form_tile), "div", "wa_config_form");
	form_obj	= wa_FormCreate( form_div, title_string);
	submit_el	= jr_WebAppAddConfigSubmit( webapp, form_obj);

	wa_FormSetSubmitElement( form_obj, submit_el);

	return form_obj;
}

/******** Forms ********/

function wa_Form()
{
}

function wa_FormOptions( object)
{
	return object.options;
}

function wa_FormElement( object)
{
	return object.form_el;
}

function wa_FormBodyDiv( object)
{
	return object.body_div;
}

function wa_FormFooterDiv( object)
{
	return object.footer_div;
}

function wa_FormButtonDiv( object)
{
	return object.button_div;
}

function wa_FormSetButtonDiv( object, button_div)
{
	object.button_div = button_div;
}

function wa_FormSubmitElement( object)
{
	return object.submit_el;
}

function wa_FormSetSubmitElement( object, submit_el)
{
	return object.submit_el	= submit_el;
}

function wa_FormSetPopupDiv( object, popup_div)
{
	object.popup_div	= popup_div;
}

function wa_FormClosePopup( object)
{
	$(object.popup_div).jqmHide();

	jr_ElementRemoveFromDom( object.popup_div);
}

function wa_FormCreate( parent_div, title_string, options)
{
	var		object			= new wa_Form();
	var		form_el			= jr_ElementAppendChild( parent_div, "form");
	var		form_tile;
	var		header_tile;
	var		body_tile;
	var		footer_tile;
	var		header_div;
	var		footer_div;
	var		body_div;
	var		title_span;

	if (options === undefined) {
		options = new Object();
	}
	object.options	= options;

	if (options.use_tile_display !== undefined) {
		options.use_inline_display	= !options.use_tile_display;
	}
	else if (options.use_inline_display !== undefined) {
		options.use_tile_display	= !options.use_inline_display;
	}
	else {
		options.use_tile_display	= true;
	}

	if (options.use_tile_display) {
		if (options.form_header_height_em === undefined) {
			options.form_header_height_em = 3;

		}
		if (options.form_footer_height_em === undefined) {
			options.form_footer_height_em = 0.75 * options.form_header_height_em;
		}

		form_tile		= jr_TileAppendRoot( form_el);
		header_tile		= jr_TileAppendChild( form_tile,	options.form_header_height_em,	"em",	"top");
		body_tile		= jr_TileAppendChild( form_tile);
		footer_tile		= jr_TileAppendChild( form_tile,	options.form_footer_height_em,	"em");

		header_div		= jr_ElementAppendChild( jr_TileDiv( header_tile), "div");
		title_span		= jr_ElementAppendChild( header_div, "span");
		body_div		= jr_ElementAppendChild( jr_TileDiv( body_tile), "div");
		footer_div		= jr_ElementAppendChild( jr_TileDiv( footer_tile), "div");

		jr_ElementSetClass( header_div,	"wa_form_header");
		jr_ElementSetClass( title_span,	"wa_form_title");
		jr_ElementSetClass( body_div,	"wa_form_body");
		jr_ElementSetClass( footer_div,	"wa_form_footer");

		jr_ElementAppendText( title_span, title_string);
	}
	else {
		body_div		 = jr_ElementAppendChild( form_el, "div");
	}

	object.form_el		= form_el;
	object.body_div		= body_div;
	object.footer_div	= footer_div;
	object.button_div	= footer_div;

	if (options.submit_string) {
		if (options.submit_side === undefined) {
			options.submit_side = wa_FORM_BUTTON_RIGHT;
		}
		wa_FormAddSubmit( object, options.submit_string, options.submit_side);
	}
	if (options.cancel_string) {
		if (options.cancel_side === undefined) {
			options.submit_side = wa_FORM_BUTTON_LEFT;
		}
		wa_FormAddCancel( object, options.cancel_string, options.cancel_side);
	}

	return object;
}

var		wa_FORM_BUTTON_LEFT			= 1;
var		wa_FORM_BUTTON_RIGHT		= 2;
var		wa_FORM_BUTTON_MIDDLE		= 3;

function wa_FormAddButton( object, button_string, position_code)
{
	var		button_el	= jr_ElementCreate( "input");

	/*
	** 9-7-2011: set the "type" before adding to DOM, IE can't handle
	** it otherwise.
	*/

	jr_ElementSetAttr( button_el, "type", "submit");
	jr_ElementSetAttr( button_el, "value", button_string);


	jr_ElementAppendChild( wa_FormButtonDiv( object), button_el);

	if (position_code == wa_FORM_BUTTON_LEFT) {
		jr_ElementSetStyle( button_el, "position", "absolute");
		jr_ElementSetStyle( button_el, "left", 1, "em");
	}
	else if (position_code == wa_FORM_BUTTON_RIGHT) {
		jr_ElementSetStyle( button_el, "position", "absolute");
		jr_ElementSetStyle( button_el, "right", 1, "em");
	}
	else if (position_code == wa_FORM_BUTTON_MIDDLE) {
		jr_ElementSetStyle( button_el, "position", "relative");
		jr_ElementCenterHorizontal( button_el)
	}

	return button_el;
}

function wa_FormAddLeftButton( object, button_string)
{
	var		middle_el;

	middle_el	= wa_FormAddButton( object, button_string, wa_FORM_BUTTON_LEFT);

	return middle_el;
}

function wa_FormAddRightButton( object, button_string)
{
	var		middle_el;

	middle_el	= wa_FormAddButton( object, button_string, wa_FORM_BUTTON_RIGHT);

	return middle_el;
}

function wa_FormAddMiddleButton( object, button_string)
{
	var		middle_el;

	middle_el	= wa_FormAddButton( object, button_string, wa_FORM_BUTTON_MIDDLE);

	return middle_el;
}


function wa_FormAddSubmit( object, submit_string, button_side)
{
	if (submit_string === undefined) {
		submit_string = i$( wa_CONFIG_SUBMIT_STRING);
	}

	if (button_side == wa_FORM_BUTTON_LEFT) {
		object.submit_el	= wa_FormAddLeftButton( object, submit_string);
	}
	else if (button_side == wa_FORM_BUTTON_MIDDLE) {
		object.submit_el	= wa_FormAddMiddleButton( object, submit_string);
	}
	else if (button_side == wa_FORM_BUTTON_RIGHT) {
		object.submit_el	= wa_FormAddRightButton( object, submit_string);
	}
	else {
		object.submit_el	= wa_FormAddButton( object, submit_string);
	}

	return object.submit_el;
}

function wa_FormAddCancel( object, cancel_string, button_side)
{
	if (cancel_string === undefined) {
		cancel_string = i$( wa_CONFIG_CANCEL_STRING);
	}

	if (button_side == wa_FORM_BUTTON_LEFT) {
		object.cancel_el	= wa_FormAddRightButton( object, cancel_string);
	}
	else if (button_side == wa_FORM_BUTTON_MIDDLE) {
		object.cancel_el	= wa_FormAddMiddleButton( object, cancel_string);
	}
	else if (button_side == wa_FORM_BUTTON_RIGHT) {
		object.cancel_el	= wa_FormAddLeftButton( object, cancel_string);
	}
	else {
		object.cancel_el	= wa_FormAddButton( object, cancel_string);
	}

	var cancel_fn	= function(form_obj, input_el) {
		wa_FormClosePopup( form_obj);
	}
	jr_ElementRegisterHandler( object.cancel_el, jr_CLICK_EVENT, cancel_fn, object);

	return object.cancel_el;
}

/******** Specific Forms ********/

function jr_WebAppAddConfigSubmit( webapp, form_obj)
{
	var		submit_el	= jr_ElementCreate( "input");

	/*
	** 9-7-2011: set the "type" before adding to DOM, IE can't handle
	** it otherwise.
	*/

	jr_ElementSetAttr( submit_el, "type", "submit");
	jr_ElementSetAttr( submit_el, "value", i$(webapp.config_submit_msg_id));

	jr_ElementAppendChild( wa_FormButtonDiv( form_obj), submit_el);

	jr_ElementSetClass( submit_el, "wa_config_submit");

	return submit_el;
}

function jr_WebAppLoginFormInit( webapp, body_div)
{
	/*
	** 9-1-11: need to use a form element so that "return" clicks the submit button
	*/
	var		str_buf		= jr_StringBufCreate();

	jr_StringBufAdd( str_buf, '<form id="wa_login_form"><table class="wa_dialog_table"><tbody><tr>');
	jr_StringBufAdd( str_buf, '<td>' + i$(webapp.user_name_label_msg_id) + ': </td>');
	jr_StringBufAdd( str_buf, '<td><input id="wa_login_user_name" type="text" size=25 maxlength=256>');
	jr_StringBufAdd( str_buf, '	  <span style="color: red" title="Required">*</span></td>');
	jr_StringBufAdd( str_buf, '</tr><tr>');
	jr_StringBufAdd( str_buf, '<td>' + i$(webapp.password_label_msg_id) + '</td>');
	jr_StringBufAdd( str_buf, '<td><input id="wa_login_password" type="password" size=25 maxlength=256>');
	jr_StringBufAdd( str_buf, '	  <span style="color: red" title="Required">*</span></td>');
	jr_StringBufAdd( str_buf, '</tr><tr>');
	jr_StringBufAdd( str_buf, '<td></td><td><input type="submit" value="Login"></td>');
	jr_StringBufAdd( str_buf, '</tr></tbody></table></form>');

	body_div.innerHTML		= jr_StringBufContents( str_buf);

	var		form_el		= jr_ElementGetById( "wa_login_form");

	form_el.wa_user_name_el	= jr_ElementGetById( "wa_login_user_name");
	form_el.wa_password_el	= jr_ElementGetById( "wa_login_password");

	jr_ElementRegisterHandler( form_el, jr_SUBMIT_EVENT, jr_WebAppLoginRequest, webapp);

	webapp.login_form_el		= form_el;
}

function jr_WebAppPasswordFormInit( webapp, form_obj)
{
	var		body_div	= wa_FormBodyDiv( form_obj);
	var		str_buf		= jr_StringBufCreate();
	var		form_el		= wa_FormElement( form_obj);
	var		orig_submit_color;
	var		highlight_fn;

	jr_StringBufAdd( str_buf, '<table class="wa_dialog_table"><tbody><tr>');
	jr_StringBufAdd( str_buf, '<td>' + i$(webapp.old_password_label_msg_id) + '</td>');
	jr_StringBufAdd( str_buf, '<td><input id="wa_old_password" type="password" size=15 maxlength=256>');
	jr_StringBufAdd( str_buf, '	  <span style="color: red" title="Required">*</span></td>');
	jr_StringBufAdd( str_buf, '</tr><tr>');
	jr_StringBufAdd( str_buf, '<td>' + i$(webapp.new_password_label_msg_id) + '</td>');
	jr_StringBufAdd( str_buf, '<td><input id="wa_new_password" type="password" size=15 maxlength=256>');
	jr_StringBufAdd( str_buf, '	  <span style="color: red" title="Required">*</span></td>');
	jr_StringBufAdd( str_buf, '</tr></tbody></table>');

	body_div.innerHTML		= jr_StringBufContents( str_buf);

	form_el.wa_old_password_el	= jr_ElementGetById( "wa_old_password");
	form_el.wa_new_password_el	= jr_ElementGetById( "wa_new_password");
	form_el.wa_submit_el		= wa_FormSubmitElement( form_obj);

	orig_submit_color			= jr_ElementGetActiveStyle( form_el.wa_submit_el, "backgroundColor");

	highlight_fn	= function( form_obj, input_el) {

		if (	form_el.wa_old_password_el.value.length > 0
			&&	form_el.wa_new_password_el.value.length > 0
		) {
			jr_ElementSetStyle( form_el.wa_submit_el,	"color",			"black");
			jr_ElementSetStyle( form_el.wa_submit_el,	"backgroundColor",	"#f9bd7c");
		}
		else {
			jr_ElementSetStyle( form_el.wa_submit_el,	"color",			"lightgrey");
			jr_ElementSetStyle( form_el.wa_submit_el,	"backgroundColor",	orig_submit_color);
		}
	}

	jr_ElementRegisterHandler( form_el, jr_SUBMIT_EVENT, jr_WebAppPasswordChangeRequest, webapp);
	jr_ElementRegisterHandler(
		form_el.wa_old_password_el, jr_KEY_UP_EVENT, highlight_fn, form_obj,
		{ stop_propagation: false , prevent_default: false}
	);
	jr_ElementRegisterHandler(
		form_el.wa_new_password_el, jr_KEY_UP_EVENT, highlight_fn, form_obj,
		{ stop_propagation: false , prevent_default: false}
	);
}

/******** Server Request ********/

function jr_WebAppServerRequest( webapp, req_name, post_vars, options)
{
	var		http_request	= new jr_HttpRequest ();

	var		post_url		= webapp.server_api_url + "?op=" + req_name;
	var		data_buf		= jr_StringBufCreate();
	var		post_data;
	var		var_name;
	var		var_value;
	var		form_var;
	var		retval;
	var		need_sep		= false;
	var		curr_time		= new Date();
	var		status;

	if (!options) {
		options	= new Object();
	}

	if (webapp.constant_map === undefined) {
		post_url	+= "&init=1";
	}
	if (webapp.do_debug) {
		post_url	+= "&debug=1";
	}

	if (post_vars) {
		for( var_name in post_vars) {
			var_value	= post_vars[var_name];

			form_var	= var_name + "=" + encodeURIComponent( var_value);

			if (need_sep) {
				form_var	= "&" + form_var;
			}
			jr_StringBufAdd( data_buf, form_var);
			need_sep = true;
		}
	}

	post_data	= jr_StringBufContents( data_buf);

	if (options.is_download) {
		post_url	+= "&" + post_data;

		window.open( post_url);

		retval				= new Object();
		retval.status		= 0;

		return retval;
	}

	if (options.response_fn) {
		jr_HttpRequestSetIsAsync( http_request, true);
	}
	else {
		jr_HttpRequestSetIsAsync( http_request, false);
	}

	jr_HttpRequestSetHeader( http_request, "Content-Type", "application/x-www-form-urlencoded");

	/*
	** 9-11-2017: for debugging
	*/
	http_request.webapp_start_seconds	= curr_time.getTime();
	http_request.webapp_req_name		= req_name;
	http_request.webapp_post_data		= post_data;

	http_request.webapp_response_fn		= options.response_fn

	status	= jr_HttpRequestPost( http_request, post_url, post_data, jr_WebAppProcessResponse, webapp);

	if (status != 0) {
		retval				= new Object();

		if (status == -2) {
			retval.error_msg	= "Network unavailable: " + http_request.error_buf;
			retval.status		= webapp.transient_error;
		}
		else {
			retval.error_msg	= "Couldn't send request: " + http_request.error_buf;
			retval.status		= webapp.internal_error;
		}

		return retval;
	}

	if (jr_HttpRequestIsAsync (http_request)) {
		retval				= new Object();
		retval.status		= 0;
		return retval;
	}

	retval = jr_WebAppProcessResponse( webapp, http_request);

	return retval;
}


function jr_WebAppProcessResponse( webapp, http_request)
{
	var retval		= new Object();

	if (jr_HttpRequestStatus( http_request) == 0) {
		retval.error_msg	= "network error";
		retval.status		= webapp.transient_error;

		return retval;
	}
	if (jr_HttpRequestStatus( http_request) == 500) {
		retval.error_msg	= "server error";
		retval.status		= webapp.internal_error;

		return retval;
	}
	if (jr_HttpRequestStatus( http_request) != 200) {
		retval.error_msg	= "server request failed with HTTP status "
							+ jr_HttpRequestStatus( http_request);
		retval.status		= webapp.internal_error;

		return retval;
	}
	if (jr_HttpRequestResponseTextLength( http_request) == 0) {
		retval.error_msg	=  "server request failed: empty response";
		retval.status		= webapp.internal_error;

		return retval;
	}

	

	try {
		var		json_func;
		
		json_func	= new Function("return " + jr_HttpRequestResponseText( http_request));

		retval		= json_func();

	}
	catch (exception) {
		var contentType = jr_HttpRequestGetHeader(http_request, "Content-Type");

		if (contentType && contentType.indexOf("application/json") != -1) {
			retval.error_msg	= "bad server JSON: " + jr_ExceptionString( exception);
			retval.status		= webapp.internal_error;
			return retval;
		}

		return jr_HttpRequestResponseText( http_request);
	}

	webapp.processServerResponseData( http_request, retval);

	if (http_request.webapp_response_fn) {
		http_request.webapp_response_fn( webapp, retval);
	}

	return retval;
}


function jr_WebAppSetSessionTimeout( webapp, session_timeout_sec)
{
	/*
	** 10-26-2011: set an internal timer that reloads after the session times out.
	** First popup a confirmation, wait ~1 minute more if no answer, then reload.
	*/
	var		session_timeout_sec;
	var		confirm_timeout_sec;
	var		reload_fn;
	var		confirm_fn;
	var		cancel_timeout_fn;

	webapp.session_timeout_sec	= session_timeout_sec;

	cancel_timeout_fn = function( confirm_div) {

		if (webapp.session_timeout_id) {
			window.clearTimeout( webapp.session_timeout_id);
		}
		jr_WebAppCheckSession( webapp);
		/*
		** 10-26-2011: this should reset the session activity timer by hitting the server.
		*/
		//jr_ModalHide( confirm_div);

		jr_ElementRemoveFromDom( confirm_div);
	}

	confirm_fn	= function() {
		var	do_cancel_timeout;
		var confirm_div			= jr_ElementAppendChild( document.body,	"div", "wa_confirm_popup");
		var	text_div			= jr_ElementAppendChild( confirm_div,	"div", "wa_abs_div");
		var	ok_form;

		jr_ElementAppendText( text_div, i$(webapp.confirm_timeout_msg_id));

		ok_form	= jr_ElementAppendChild( text_div, "form");

		ok_form.innerHTML	= '<input type="submit" value="Ok">';

		jr_ElementSetAttr( text_div, "align", "center");

		jr_ElementRegisterHandler( ok_form, jr_SUBMIT_EVENT, cancel_timeout_fn, confirm_div);

		jr_ElementCenter( confirm_div);
		jr_ElementCenter( text_div);

		//jr_ModalShow( confirm_div);
	}

	reload_fn	= function() { jr_WebAppLogout( webapp); }

	/*
	** 10-26-2011: set a timer which reloads when the session times out.
	*/

	if (webapp.session_timeout_id) {
		window.clearTimeout( webapp.session_timeout_id);
	}
	webapp.session_timeout_id	= window.setTimeout( reload_fn, 1000 * session_timeout_sec);

	/*
	** 10-26-2011: popup a confirmation 30 seconds before the actual timeout which
	** gives the users that much time to cancel the reload scheduled above.
	*/

	confirm_timeout_sec			= session_timeout_sec - webapp.confirm_timeout_wait_sec;

	if (confirm_timeout_sec < 0) {
		confirm_timeout_sec		= 1;
	}

	if (webapp.confirm_timeout_id) {
		window.clearTimeout( webapp.confirm_timeout_id);
	}
	webapp.confirm_timeout_id	= window.setTimeout( confirm_fn, 1000 * confirm_timeout_sec);
}

function jr_WebAppProcessQueryTraces( webapp, http_request, query_traces)
{
	if (!webapp.debug_doc) {
		webapp.debug_window	= window.open(
								'', webapp.app_name,
								'left=270,top=100,width=900,height=800,toolbar=no,scrollbars=yes'
							);
		if (webapp.debug_window) {
			webapp.debug_doc		= webapp.debug_window.document;
		}
		else if (!webapp.did_popup_alert) {
			webapp.showMessage( "Can't open debug window. Please enable popups for this site.");
			webapp.did_popup_alert	= true;
		}
	}
	if (webapp.debug_doc) {
		var     seconds_end;
		var     seconds_duration;

		var curr_time = new Date();

		seconds_end			= curr_time.getTime();
		seconds_duration	= seconds_end - http_request.webapp_start_seconds;

		webapp.debug_doc.title	= webapp.app_name + " Debug";
		webapp.debug_doc.writeln( '<hr><div><span style="font-size: 1.5em">' + http_request.webapp_req_name + '</span>');

		if (http_request.webapp_post_data.length > 0) {
			webapp.debug_doc.writeln( ' : ' + http_request.webapp_post_data + '</div>');
		}

		webapp.debug_doc.writeln("<ul>");

		for (var z in query_traces) {
			var query_info	= query_traces[z];

			webapp.debug_doc.write("<li>");
			webapp.debug_doc.write("<strong>" + query_info.desc + "</strong>");
			webapp.debug_doc.write(" : " + query_info.sql);
			if (query_info.sql_args) {
				webapp.debug_doc.write(" <br> Args: [" + query_info.sql_args.arg_array + "]");
			}

			webapp.debug_doc.write(" <br> Num. rows:" + query_info.num_rows);

			if (query_info.num_rows > 0) {

				for (var k in query_info.rows) {
					var row = query_info.rows[k];

					for (var q in row) {
						/*
						** 12-6-2011: data is indexed by both position and column name.
						** Perhaps add some javascript to open the results with a click?
						*/
						var data_item	= row[q];
					}
				}
			}
			if (query_info.error_msg !== undefined) {
				webapp.debug_doc.write(
					"<br><font color=red>Error: " + query_info.error_msg + " </font>"
				);
			}

			webapp.debug_doc.write("</li>");
		}
		webapp.debug_doc.writeln("</ul>");
		webapp.debug_doc.write("<font color=red>Time Taken (msec) " + seconds_duration + " </font>");
	}
}

/******** HTTP Requests ********/

function jr_WebAppCheckSession( webapp)
{

	retval	= jr_WebAppServerRequest( webapp, "verify");

	if (retval.status == 0) {
		webapp.user_info	= retval.user_info;
	}

	return retval;
}

function jr_WebAppLoginRequest( webapp, click_el)
{
	var		post_vars;
	var		retval;

	post_vars	= {
		user_name	: click_el.wa_user_name_el.value,
		password	: click_el.wa_password_el.value
	};

	retval	= jr_WebAppServerRequest( webapp, "login", post_vars);

	if (retval.status != 0) {
		webapp.errorAlert( i$(webapp.bad_login_msg_id), retval);
	}
	else {
		webapp.user_info	= retval.user_info;

		webapp.activatePage( "main");
	}
}

function jr_WebAppLogout( webapp, content_div)
{
	var		retval;

	retval	= jr_WebAppServerRequest( webapp, "logout");

	if (retval.status != 0) {
		webapp.errorAlert( i$(webapp.bad_logout_msg_id), retval.error_msg);
	}

	webapp.reload();
}


function jr_WebAppPasswordChangeRequest( webapp, form_el)
{
	var		old_is_empty;
	var		new_is_empty;
	var		post_vars;
	var		retval;

	if (form_el.wa_old_password_el.value.length == 0) {
		old_is_empty	= true;
	}
	else {
		old_is_empty	= false;
	}

	if (form_el.wa_new_password_el.value.length == 0) {
		new_is_empty	= true;
	}
	else {
		new_is_empty	= false;
	}

	if (old_is_empty) {
		if (new_is_empty) {
			webapp.errorAlert( i$(webapp.bad_password_change_msg_id), i$(webapp.empty_password_msg_id));
		}
		else {
			webapp.errorAlert( i$(webapp.bad_password_change_msg_id), i$(webapp.empty_old_password_msg_id));
		}
		return;
	}
	else if (new_is_empty) {
		webapp.errorAlert( i$(webapp.bad_password_change_msg_id), i$(webapp.empty_new_password_msg_id));
		return;
	}

	post_vars	= {
		old_password	: form_el.wa_old_password_el.value,
		new_password	: form_el.wa_new_password_el.value
	};

	retval	= jr_WebAppServerRequest( webapp, "change_password", post_vars);

	if (retval.status != 0) {
		webapp.errorAlert( i$(webapp.bad_password_change_msg_id), retval.error_msg);
	}
	else {
		webapp.showMessage( i$(webapp.password_change_msg_id));
	}
}

