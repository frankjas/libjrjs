var		jr_TileId			= 1;
var		jr_TileDefaultKey	= "_jr_tile_default__";

function jr_Tile()
{
	this.tile_id		= jr_TileId++;
	/*
	** 10-7-2011: for debugging, to break on a particular tile.
	*/
}

function jr_TileCreate( parent_obj, tile_key, tile_div, attachment_side)
{
	var		object		= new jr_Tile();


	if (parent_obj instanceof jr_Tile) {
		object.parent_tile	= parent_obj;
		object.parent_div	= parent_obj.tile_div;

		if (!parent_obj.first_child[tile_key]) {
			parent_obj.first_child[tile_key]	= object;
		}
		parent_obj.last_child[tile_key]	= object;
	}
	else {
		object.parent_div		= parent_obj;
	}
	object.tile_div			= tile_div;
	object.attachment_side	= attachment_side;
	object.first_child		= new Object();
	object.last_child		= new Object();
	object.tile_key			= tile_key;
	object.is_displayed		= true;

	object.slave_tiles		= new Array();

	return object;
}

function jr_TileDestroy( object)
{
	if (object.master_tile) {
		jr_TileDeleteResizeSlave( object.master_tile, object);
	}
}

function jr_TileDiv( object)
{
	return object.tile_div;
}

function jr_TileParent( object)
{
	return object.parent_tile;
}


function jr_TileWidthPx( object)
{
	return object.tile_div.offsetWidth;
}

function jr_TileHeightPx( object)
{
	return object.tile_div.offsetHeight;
}

/*
** 7-17-2012: the minimum heights, etc must be pixels to be able
** to easily compare them with offsetHeight, etc.
*/
function jr_TileSetMinWidth( object, min_width, opt_size_units)
{
	if (object.parent_tile && object.has_size) {
		throw new Error( "jr_TileSetMinWidth() usage error: tile has fixed size");
	}

	if (opt_size_units === undefined  ||  opt_size_units == "px") {
		min_width_px	= min_width;
	}
	else {
		min_width_px	= jr_ConvertSizeToPx( min_width, opt_size_units, "width", object.parent_div);
	}

	object.min_width_px	= min_width_px;

	jr_ElementSetStyle( object.tile_div,	"minWidth",		object.min_width_px, "px");
}

function jr_TileSetMinHeight( object, min_height, opt_size_units)
{
	if (object.parent_tile && object.has_size) {
		throw new Error( "jr_TileSetMinHeight() usage error: tile has fixed size");
	}

	if (opt_size_units === undefined  ||  opt_size_units == "px") {
		min_height_px	= min_height;
	}
	else {
		min_height_px	= jr_ConvertSizeToPx( min_height, opt_size_units, "height", object.parent_div);
	}

	object.min_height_px	= min_height_px;

	jr_ElementSetStyle( object.tile_div,	"minHeight",		object.min_height_px, "px");
}

function jr_TileSetMaxWidth( object, max_width, opt_size_units)
{
	if (object.parent_tile && object.has_size) {
		throw new Error( "jr_TileSetMaxWidth() usage error: tile has fixed size");
	}

	if (opt_size_units === undefined  ||  opt_size_units == "px") {
		max_width_px	= max_width;
	}
	else {
		max_width_px	= jr_ConvertSizeToPx( max_width, opt_size_units, "width", object.parent_div);
	}

	object.max_width_px	= max_width_px;

	jr_ElementSetStyle( object.tile_div,	"maxWidth",		object.max_width_px, "px");
}

function jr_TileSetMaxHeight( object, max_height, opt_size_units)
{
	if (object.parent_tile && object.has_size) {
		throw new Error( "jr_TileSetMaxHeight() usage error: tile has fixed size");
	}

	if (opt_size_units === undefined  ||  opt_size_units == "px") {
		max_height_px	= max_height;
	}
	else {
		max_height_px	= jr_ConvertSizeToPx( max_height, opt_size_units, "height", object.parent_div);
	}

	object.max_height_px	= max_height_px;

	jr_ElementSetStyle( object.tile_div,	"maxHeight",		object.max_height_px, "px");
}

function jr_TileSetOverflow( object, value)
{
	jr_ElementSetStyle( object.tile_div,	"overflow",	value);
}

function jr_TileSetBackgroundColor( object, value)
{
	jr_ElementSetStyle( object.tile_div,	"backgroundColor",	value);
}

function jr_TileSetFlow( object, value)
{
	if (value) {
		object.has_flow = true;
	}
	else {
		object.has_flow =false;
	}
}
function jr_TileSetInitFn( object, init_fn, init_fn_arg)
{
	object.init_fn		= init_fn;
	object.init_fn_arg	= init_fn_arg;

	object.is_displayed	= false;
	jr_ElementSetStyle( object.tile_div,	"display",	"none");
	/*
	** 4-15-2013: assume the tile is currently not initialized, so remove the tile div from the DOM
	*/
}

function jr_TileSetDisplayFn( object, display_fn, display_fn_arg)
{
	object.display_fn		= display_fn;
	object.display_fn_arg	= display_fn_arg;

	object.is_displayed	= false;
	jr_ElementSetStyle( object.tile_div,	"display",	"none");
	/*
	** 4-15-2013: assume the tile is currently not displayed, so remove the tile div from the DOM
	*/
}

function jr_TileAppendRoot( parent_div, opt_master_tile, opt_has_flow)
{
	var		tile_div;
	var		master_tile;
	var		has_flow		= false;
	var		object;

	tile_div		= jr_ElementAppendChild( parent_div, "div");

	object			= jr_TileCreate( parent_div, jr_TileDefaultKey, tile_div, "top");

	if (opt_master_tile) {
		if (typeof opt_master_tile == "object") {
			master_tile	= opt_master_tile;

			if (master_tile.has_flow) {
				has_flow = true;
			}
		}
		else if (opt_master_tile == "flow") {
			has_flow = true;
		}
	}
	if (opt_has_flow) {
		if (typeof opt_has_flow == "object"  &&  !master_tile) {
			master_tile	= opt_has_flow;
		}
		else if (opt_has_flow == "flow") {
			has_flow = true;
		}
	}
	
	if (has_flow) {
		/*
		** 4-6-2017: means position is where it would be in the current flow
		** and size possibly determined by the children. As a result,
		** could have multiple unsized children.
		*/
		object.has_flow = true;

		jr_ElementSetStyle( tile_div,	"position",		"relative");
	}
	else {
		object.has_size	= true;

		jr_ElementSetStyle( tile_div,	"position",		"absolute");
		jr_ElementSetStyle( tile_div,	"top",			0);
		jr_ElementSetStyle( tile_div,	"bottom",		0);
		jr_ElementSetStyle( tile_div,	"left",			0);
		jr_ElementSetStyle( tile_div,	"right",		0);
	}

	if (master_tile) {
		object.is_displayed	= master_tile.is_displayed;

		jr_TileAddResizeSlave( master_tile, object);
	}

	return object;
}

function jr_TileAppendChild( parent_tile, opt_tile_size, opt_size_units, opt_attachment_side)
{
	var		new_tile;

	new_tile	= jr_TileAppendAltChild(
					parent_tile, jr_TileDefaultKey, opt_tile_size, opt_size_units, opt_attachment_side
				);

	return new_tile;
}

function jr_TileAppendAltChild(
	parent_tile, child_key, opt_tile_size, opt_size_units, opt_attachment_side)
{
	var		prev_tile		= parent_tile.last_child[child_key];
	var		tile_div;
	var		attachment_side;
	var		object;

	/*
	** 4-6-2017: a "flow" child has their size defined by the content.
	** One "flow" child implies that all tiles must be attached at the top
	** and must position relative with top 0, since otherwise the browser won't adjust
	** the div when child content changes.
	*/
	if (opt_tile_size == "flow"  &&  opt_size_units !== undefined) {
		opt_attachment_side = opt_size_units;
	}
	if (prev_tile) {

		if (prev_tile.has_size || prev_tile.has_flow) {
			attachment_side		= prev_tile.attachment_side;

			if (opt_attachment_side  &&  opt_attachment_side != attachment_side) {

				throw new Error( "jr_TileAppendChild(): attachment following sized tile should match"
				+ "i.e. should be '" + attachment_side + "'");
			}
		}
		else {
			/*
			** 9-8-2011: prev_tile is unsized, attach this tile to the opposite side,
			** the unsized tile floats in the middle
			*/
			if (prev_tile.attachment_side == "top") {
				attachment_side	= "bottom";
			}
			else if (prev_tile.attachment_side == "bottom") {
				attachment_side	= "top";
			}
			else if (prev_tile.attachment_side == "left") {
				attachment_side	= "right";
			}
			else if (prev_tile.attachment_side == "right") {
				attachment_side	= "left";
			}
			if (opt_attachment_side  &&  opt_attachment_side != attachment_side) {

				throw new Error("jr_TileAppendChild(): attachment following unsized tile should switch"
				+ " i.e. should be '" + attachment_side + "'");
			}
		}

		if (	parent_tile.first_child[child_key].attachment_side == "top"
			||  parent_tile.first_child[child_key].attachment_side == "left") {

			tile_div		= jr_ElementAppendAfter( prev_tile.tile_div, "div");
		}
		else {
			/*
			** 8-19-2011: don't really need to insert before since everything is absolutely positioned,
			** but this way the DOM matches the layout.
			*/
			tile_div		= jr_ElementInsertBefore( prev_tile.tile_div, "div");
		}
	}
	else {
		/*
		** 9-16-2011: first attached tile
		*/
		if (! opt_attachment_side) {
			if (opt_tile_size === undefined  ||  opt_tile_size == "flow") {
				/*
				** 9-16-2011: assume this will be the only child, it takes up all space.
				*/
				attachment_side	= "top";
			}
			else {
				throw new Error( "jr_TileAppendChild(): attachment side required for first sized child");
			}
		}
		else {
			attachment_side	= opt_attachment_side;
		}

		tile_div			= jr_ElementAppendChild( parent_tile.tile_div, "div");
	}

	object			= jr_TileCreate( parent_tile, child_key, tile_div, attachment_side);

	if (opt_tile_size) {
		if (opt_tile_size == "flow") {
			object.has_flow		= true;
		}
		else {
			object.has_size		= true;
		}

		if (opt_size_units == "%") {
			object.has_pct		= true;	
			object.size_pct		= opt_tile_size;
		}
	}
	else if (parent_tile.has_flow) {
		/*
		** 4-6-2017: unsized children in flow parents have their size determined by
		** their content, just like "flow" children.
		*/
		object.has_flow			= true;
	}

	if (object.has_flow || parent_tile.has_flow_child) {
		jr_ElementSetStyle( tile_div,		"position",			"relative");
	}
	else {
		jr_ElementSetStyle( tile_div,		"position",			"absolute");
	}

	if (object.has_flow) {
		if (parent_tile.has_size) {
			jr_TileSetOverflow( parent_tile, "auto");
		}

		if (!parent_tile.has_flow_child) {

			parent_tile.has_flow_child = true;

			if (prev_tile) {
				/*
				** 4-6-2017: the prev children need to be relative positioned, since otherwise
				** they'll overlap the following tiles, since they won't be in the html flow.
				*/
				var curr_tile	= prev_tile;

				while (curr_tile) {
					jr_ElementSetStyle( jr_TileDiv( curr_tile),		"position",			"relative");

					curr_tile	= curr_tile.prev_tile;
				}
			}
		}
	}

	if (prev_tile) {
		if (prev_tile.next_tile) {
			object.next_tile	= prev_tile.next_tile;
		}
		prev_tile.next_tile	= object;

		object.prev_tile		= prev_tile;

		if (object.has_pct  &&  prev_tile.has_size  &&  !prev_tile.has_pct) {
			throw new Error("jr_TileAppendChild(): all sibling tiles must have percentage sizes");
		}

		if (prev_tile.has_pct) {
			if (object.has_size) {
				if (!object.has_pct){
					throw new Error("jr_TileAppendChild(): all sibling tiles must have percentage sizes");
				}
			}
			else {
				object.has_pct	= true;	
			}
		}
	}

	jr_TileSetSize( object, opt_tile_size, opt_size_units);

	return object;
}


function jr_TileSetSize( object, opt_tile_size, opt_size_units)
{
	var		prev_tile		= object.prev_tile;
	var		prev_height		= 0;
	var		prev_width		= 0;

	var		next_tile		= object.next_tile;
	var		next_height		= 0;
	var		next_width		= 0;

	var		use_next		= false;
	var		do_set_size		= true;
	var		is_only_child	= true;

	var		tile_height;
	var		tile_width;
	var		prev_units;
	var		size_units;
	var		unsized_tile;

	if (	opt_tile_size !== undefined
		&&	object.has_size
		&&  object.curr_tile_size	== opt_tile_size
		&&	object.curr_size_units	== opt_size_units) {

		/*
		** 9-29-2011: trying to set to the current size
		** should be no change.  Do this so there's no cost
		** to reset a tile to it's current size.
		*/
		return;
	}

	/*
	** 8-18-2011: unsized tiles use both the prev and next cumulative sizes
	** to calculate their size.  Sized tiles use either the prev/next sizes
	** to calculate the offset from the attachment size. Note that the
	** attachment side flips after the unsized tile, but each tile has
	** the proper attachment side set.
	*/
	while (prev_tile) {

		is_only_child	= false;

		if (!prev_tile.has_size) {
			if (!object.has_size && !object.has_flow || unsized_tile) {
				throw new Error( "jr_TileSetSize(): multiple unsized tiles");
			}
			/*
			** 8-19-2011: this tile should be attached to the other side and
			** the next tiles should give the position.
			*/
			unsized_tile	= prev_tile;

			use_next	= true;
			prev_height	= 0;
			prev_width	= 0;

			break;
		}

		if (prev_tile.size_pct) {
			prev_height		+= prev_tile.size_pct;
			prev_width		+= prev_tile.size_pct;
		}
		else {
			prev_height		+= prev_tile.tile_div.offsetHeight;
			prev_width		+= prev_tile.tile_div.offsetWidth;
		}

		prev_tile		= prev_tile.prev_tile;
	}

	while (next_tile) {

		is_only_child	= false;

		if (!next_tile.has_size) {
			if (!object.has_size && !object.has_flow || unsized_tile) {
				throw new Error( "jr_TileSetSize(): multiple unsized tiles");
			}
			/*
			** 8-19-2011: this tile should use the prev tiles as position.
			*/
			unsized_tile	= next_tile;

			next_height	= 0;
			next_width	= 0;

			break;
		}
		
		if (next_tile.size_pct) {
			next_height		+= next_tile.size_pct;
			next_width		+= next_tile.size_pct;
		}
		else {
			next_height		+= next_tile.tile_div.offsetHeight;
			next_width		+= next_tile.tile_div.offsetWidth;
		}

		next_tile		= next_tile.next_tile;
	}

	if (object.has_pct) {
		prev_units		= "%";
	}
	else {
		prev_units		= "px";
	}

	if (object.has_size || object.has_flow) {
		if (opt_tile_size === undefined) {
			/*
			** 9-29-2011: only update the position.
			*/
			do_set_size		= false;
		}
		else {
			tile_height		= opt_tile_size;
			tile_width		= opt_tile_size;
			size_units		= opt_size_units;

			if (opt_tile_size == 0) {
				throw new Error( "jr_TileSetSize(): can't set 0 size");
				/*
				** 11-22-2011: can't set 0 size since we use that to check
				** whether the object is currently being displayed or not,
				** since IE always has an offsetParent.
				*/
			}
			if (opt_tile_size < 0) {
				throw new Error( "jr_TileSetSize(): can't set negative size");
			}
		}
	}
	else {
		/*
		** 8-18-2011: tile takes all remaining space.
		*/

		if (object.has_pct) {
			tile_height		= 100 - prev_height - next_height;
			tile_width		= 100 - prev_width - next_width;
			size_units		= "%";

			if (tile_height < 0  ||  tile_width < 0) {
				throw new Error( "jr_TileSetSize(): percentages of siblings exceed 100%");
			}
		}
		else {
			tile_height		= object.parent_div.offsetHeight	- prev_height - next_height;
			tile_width		= object.parent_div.offsetWidth		- prev_width - next_width;
			size_units		= "px";
		}
	}

	if (use_next) {
		prev_height		= next_height;
		prev_width		= next_width;
	}

	if (is_only_child  &&  !object.has_size && !object.has_flow) {
		jr_ElementSetStyle( object.tile_div,	"top",			0);
		jr_ElementSetStyle( object.tile_div,	"bottom",		0);
		jr_ElementSetStyle( object.tile_div,	"left",			0);
		jr_ElementSetStyle( object.tile_div,	"right",		0);
	}
	else if (object.attachment_side == "top") {

		if (object.has_flow) {
			jr_ElementSetStyle( object.tile_div,	"top",			0);
		}
		else {
			jr_ElementSetStyle( object.tile_div,	"top",			prev_height, prev_units);
		}

		jr_ElementSetStyle( object.tile_div,	"left",			0);
		jr_ElementSetStyle( object.tile_div,	"right",		0);

		if (do_set_size) {

			if (tile_height < 0) {
				throw new Error( "jr_TileSetSize(): children sizes greater than parent"
					+ "[" + object.parent_div.offsetHeight + ", " + object.parent_div.offsetWidth + "]"
				);
			}
			if (object.has_size) {
				jr_ElementSetStyle( object.tile_div,	"height",	tile_height, size_units);
			}
			else {
				jr_ElementSetStyle( object.tile_div,	"bottom",	next_height);
			}
		}
	}
	else if (object.attachment_side == "bottom") {

		jr_ElementSetStyle( object.tile_div,		"bottom",	prev_height, prev_units);
		jr_ElementSetStyle( object.tile_div,		"left",		0);
		jr_ElementSetStyle( object.tile_div,		"right",	0);

		if (do_set_size) {
			if (tile_height < 0) {
				throw new Error( "jr_TileSetSize(): children sizes greater than parent"
					+ "[" + object.parent_div.offsetHeight + ", " + object.parent_div.offsetWidth + "]"
				);
			}
			if (object.has_size) {
				jr_ElementSetStyle( object.tile_div,	"height",	tile_height, size_units);
			}
			else {
				jr_ElementSetStyle( object.tile_div,	"top",	next_height);
			}
		}
	}
	else if (object.attachment_side == "left") {

		jr_ElementSetStyle( object.tile_div,		"left",		prev_width, prev_units);
		jr_ElementSetStyle( object.tile_div,		"top",		0);
		jr_ElementSetStyle( object.tile_div,		"bottom",	0);

		if (do_set_size) {
			if (tile_width < 0) {
				throw new Error( "jr_TileSetSize(): children sizes greater than parent");
					+ "[" + object.parent_div.offsetHeight + ", " + object.parent_div.offsetWidth + "]";
			}
			if (object.has_size) {
				jr_ElementSetStyle( object.tile_div,	"width",	tile_width, size_units);
			}
			else {
				jr_ElementSetStyle( object.tile_div,	"right",	next_width);
			}
		}
	}
	else if (object.attachment_side == "right") {

		jr_ElementSetStyle( object.tile_div,		"right",	prev_width, prev_units);
		jr_ElementSetStyle( object.tile_div,		"top",		0);
		jr_ElementSetStyle( object.tile_div,		"bottom",	0);

		if (do_set_size) {
			if (tile_width < 0) {
				throw new Error( "jr_TileSetSize(): children sizes greater than parent");
					+ "[" + object.parent_div.offsetHeight + ", " + object.parent_div.offsetWidth + "]";
			}
			if (object.has_size) {
				jr_ElementSetStyle( object.tile_div,	"width",	tile_width, size_units);
			}
			else {
				jr_ElementSetStyle( object.tile_div,	"left",		next_width);
			}
		}
	}

	if (false) {
		/*
		** 12-19-2012: this check fails in Chrome(Win7) with percentage sized parents.
		** The parent with 50% width can be one pixel smaller than a child
		** with left, right of 0
		*/
		if (	object.tile_div.offsetWidth  >  object.parent_div.offsetWidth
			||	object.tile_div.offsetHeight  >  object.parent_div.offsetHeight
		) {
			throw new Error( "jr_TileSetSize(): children sizes greater than parent");
				+ "[" + object.parent_div.offsetHeight + ", " + object.parent_div.offsetWidth + "]";
		}
	}

	/*
	** 9-10-2011: Need to adjust the position of all tiles between this tile upto and
	** including the unsized tile (use the previous tile if this tile comes
	** after the unsized tile).  The recursion stops after doing the unsized tile
	** object.has_size will be false.
	*/
	if (object.has_size) {
		if (opt_tile_size !== undefined) {
			object.curr_tile_size	= opt_tile_size;
			object.curr_size_units	= opt_size_units;
		}

		if (use_next) {
			next_tile	= object.prev_tile;
		}
		else {
			next_tile	= object.next_tile;
		}

		if (next_tile) {
			if (next_tile.has_size) {
				jr_TileSetSize( next_tile);
				/*
				** 9-29-2011: with no args resets the position on sized tiles.
				** For unsized tiles, adjusts the size.
				*/
			}
			else {
				jr_TileOnResize( next_tile);
				/*
				** 9-29-2011: this will propagate the size change to sub-tiles.
				*/
			}
		}
	}
}

function jr_TileOnResize( object)
{
	var		sub_tile;
	var		child_key;
	var		width_too_small		= false;
	var		height_too_small	= false;
	var		width_too_large		= false;
	var		height_too_large	= false;

	if (!object.parent_tile) {
		/*
		** 10-23-2011: only root tiles can have max/min height/widths set.
		*/
		if (object.min_width_px  &&  object.tile_div.offsetWidth <= object.min_width_px) {
			width_too_small		= true;
		}
		if (object.min_height  &&  object.tile_div.offsetHeight <= object.min_height) {
			height_too_small	= true;
		}
		if (width_too_small  &&  height_too_small) {
			return;
		}

		if (object.max_width  &&  object.tile_div.offsetWidth >= object.max_width) {
			width_too_large		= true;
		}
		if (object.max_height  &&  object.tile_div.offsetHeight >= object.max_height) {
			height_too_large	= true;
		}
		if (width_too_large  &&  height_too_large) {
			return;
		}
	}


	if (!object.tile_div.offsetParent  ||  object.tile_div.offsetHeight == 0) {
		/*
		** 9-29-2011: means the tile isn't displayed and size calculations
		** aren't possible. Delay resize until the tile is displayed again.
		** 11-22-2011: for IE, display="none" leave the offsetParent set, but the
		** offsetHeight is set to 0.
		*/
		object.needs_resize	= true;
		return;
	}

	if (!object.has_size  &&  !object.has_pct) {
		jr_TileSetSize( object);
	}

	if (object.resize_handler_fn) {
		if (object.resize_handler_arg) {
			object.resize_handler_fn( object.resize_handler_arg, object);
		}
		else {
			object.resize_handler_fn( object);
		}
	}

	for (child_key in object.first_child) {
		sub_tile	= object.first_child[child_key];

		while (sub_tile) {
			jr_TileOnResize( sub_tile);
			sub_tile	= sub_tile.next_tile;
		}
	}
	for (var z in object.slave_tiles) {
		jr_TileOnResize( object.slave_tiles[z]);
	}

	object.needs_resize = false;
}

function jr_TileAddResizeSlave( object, slave_tile)
{
	if ( object.slave_tiles[ slave_tile.tile_id]) {
		return;
	}
	object.slave_tiles[ slave_tile.tile_id]		= slave_tile;
	slave_tile.master_tile	= object;
}

function jr_TileDeleteResizeSlave( object, slave_tile)
{
	if ( object.slave_tiles[ slave_tile.tile_id]) {
		delete object.slave_tiles[ slave_tile.tile_id];
		delete slave_tile.master_tile;
	}
}

function jr_TileSetResizeHandler( object, handler_fn, handler_arg)
{
	object.resize_handler_fn	= handler_fn;
	object.resize_handler_arg	= handler_arg;
}

function jr_TileDisplay( object, opt_child_key)
{
	var		do_display;
	var		displayed_tile;

	/*
	** 9-22-2011: either display the tile passed, or the indicated child
	*/

	if (opt_child_key) {
		var		parent_tile;
		var		display_key;
		var		child_key;
		var		sub_tile;

		parent_tile	= object;
		display_key	= opt_child_key;

		for (child_key in parent_tile.first_child) {
			sub_tile	= parent_tile.first_child[child_key];

			/*
			** 9-22-2011: show the selected tile, hide the rest.
			*/
			if (sub_tile.tile_key == display_key) {
				do_display		= true;
				displayed_tile	= sub_tile;
			}
			else {
				do_display		= false;
			}

			while (sub_tile) {
				jr_TileChangeDisplay( sub_tile, do_display);

				sub_tile	= sub_tile.next_tile;
			}
		}
	}
	else {
		jr_TileChangeDisplay( object, true);

		displayed_tile	= object;
	}
	return displayed_tile;
}

function jr_TileHide( object, opt_child_key)
{
	if (opt_child_key) {
		var		sub_tile;

		sub_tile		= object.first_child[opt_child_key];

		while (sub_tile) {
			jr_TileChangeDisplay( sub_tile, false);

			sub_tile	= sub_tile.next_tile;
		}
	}
	else {
		jr_TileChangeDisplay( object, false);
	}
}

function jr_TileChangeDisplay( object, do_display)
{
	var		display_value;

	if (object.is_displayed == do_display) {
		return;
	}
	if (do_display) {
		display_value	= "block";
	}
	else {
		display_value	= "none";
	}

	jr_ElementSetStyle( object.tile_div,	"display",	display_value);

	if (do_display  &&  !object.is_initialized  &&  object.init_fn) {
		if (object.init_fn_arg === undefined) {
			object.init_fn( object);
		}
		else {
			object.init_fn( object.init_fn_arg, object);
		}
		object.is_initialized	= true;
	}

	if (do_display && object.display_fn) {
		if (object.display_fn_arg === undefined) {
			object.display_fn( object, do_display);
		}
		else {
			object.display_fn( object.display_fn_arg, object, do_display);
		}
	}

	object.is_displayed	= do_display;

	if (do_display && object.needs_resize) {
		jr_TileOnResize( object);
	}
}

