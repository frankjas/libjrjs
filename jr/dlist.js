
function jr_DList()
{
	jr_DListInit( this);
}

function jr_DListInit( object)
{
	object.head_el		= null;
	object.tail_el		= null;
}

function jr_DListCreate()
{
	return new jr_DList();
}

function jr_DListIsEmpty( object)
{
	return object.head_el === null;
}

function jr_DListHeadElement( object)
{
	return object.head_el;
}

function jr_DListTailElement( object)
{
	return object.tail_el;
}

function jr_DListNextElement( object, curr_el)
{
	/*
	** 2-23-2011: allow calling with just one argument.
	*/
	if (curr_el === undefined) {
		curr_el	= object;
	}
	return curr_el.jr_dlist_next_el;
}

function jr_DListPrevElement( object, curr_el)
{
	/*
	** 2-23-2011: allow calling with just one argument.
	*/
	if (curr_el === undefined) {
		curr_el	= object;
	}
	return curr_el.jr_dlist_prev_el;
}

function jr_DListAddToTail( object, new_el)
{
	jr_DListAppendElement( object, object.tail_el, new_el);
}

function jr_DListAddToHead( object, new_el)
{
	jr_DListInsertElement( object, object.head_el, new_el);
}

function jr_DListInsertElement( object, next_el, new_el)
{
	var		prev_el;

	new_el.jr_dlist_next_el	= next_el;
	
	if (next_el) {
		prev_el						= next_el.jr_dlist_prev_el;
		next_el.jr_dlist_prev_el	= new_el;
	}
	else {
		prev_el						= object.tail_el;
		object.tail_el				= new_el;
	}

	new_el.jr_dlist_prev_el	= prev_el;

	if (prev_el) {
		prev_el.jr_dlist_next_el	= new_el;
	}
	else {
		object.head_el				= new_el;
	}

	return new_el;
}

function jr_DListAppendElement( object, prev_el, new_el)
{
	var		next_el;

	new_el.jr_dlist_prev_el	= prev_el;
	
	if (prev_el) {
		next_el						= prev_el.jr_dlist_next_el;
		prev_el.jr_dlist_next_el	= new_el;
	}
	else {
		next_el						= object.head_el;
		object.head_el				= new_el;
	}

	new_el.jr_dlist_next_el	= next_el;

	if (next_el) {
		next_el.jr_dlist_prev_el	= new_el;
	}
	else {
		object.tail_el				= new_el;
	}

	return new_el;
}

function jr_DListDeleteElement( object, del_el)
{
	var		prev_el		= del_el.jr_dlist_prev_el;
	var		next_el		= del_el.jr_dlist_next_el;

	if (prev_el) {
		prev_el.jr_dlist_next_el	= next_el;
	}
	else if (object.head_el === del_el) {
		object.head_el	= next_el;
	}
	else if (next_el) {
		throw new Error( "jr_DListDeleteElement(): element not in iist");
	}
	else {
		/*
		** 3-6-2011: it's not on any list.
		*/
	}

	if (next_el) {
		next_el.jr_dlist_prev_el	= prev_el;
	}
	else if (object.tail_el === del_el) {
		object.tail_el	= prev_el;
	}
	else if (prev_el) {
		throw new Error( "jr_DListDeleteElement(): element not on list");
	}
	else {
		/*
		** 3-6-2011: it's not on any list.
		*/
	}

	delete del_el.jr_dlist_prev_el;
	delete del_el.jr_dlist_next_el;
}

