var jr_HttpRequestArray	= new Array ();

function jr_HttpRequest ()
{
	this.is_async			= true;
	this.header_array		= new Array();

    if (window.XMLHttpRequest) {
		/*
		** 4/19/06: has native support for XMLHttpRequest
		*/

        try {
			this.xml_http_req	= new XMLHttpRequest();
        } catch(e) {
			this.error_buf		= "exception getting new XMLHttpRequest: " + jr_ExceptionString( e);
        }
    }
	else if (window.ActiveXObject) {
		/*
		** 4/19/06: Has IE/Windows ActiveX version
		*/
        try {
			this.xml_http_req	= new ActiveXObject("Msxml2.XMLHTTP");
        } catch(e) {
			try {
				this.xml_http_req	= new ActiveXObject("Microsoft.XMLHTTP");
			} catch(e) {
				this.error_buf		= "exception getting new ActiveXObject: " + jr_ExceptionString( e);
			}
		}
    }
	else {
		throw new Error( "XMLHttpRequest not supported");
	}
}

function jr_HttpRequestStatus (http_request)
{
	return http_request.xml_http_req.status;
}

function jr_HttpRequestIsAsync (http_request)
{
	return http_request.is_async;
}

function jr_HttpRequestResponseText (http_request)
{
	return http_request.xml_http_req.responseText;
}

function jr_HttpRequestResponseTextLength (http_request)
{
	return http_request.xml_http_req.responseText.length;
}

function jr_HttpRequestResponseXML (http_request)
{
	return http_request.xml_http_req.responseXML;
}

function jr_HttpRequestResponseContentType( http_request)
{
	return jr_HttpRequestGetHeader( http_request, "Content-Type");
}

function jr_HttpRequestSetIsAsync (http_request, is_async)
{
	if (is_async) {
		http_request.is_async		= true;
	}
	else {
		http_request.is_async		= false;
	}
}

function jr_HttpRequestSetHeader (http_request, header_name, header_value)
{
	http_request.header_array[header_name]	= header_value;
}

function jr_HttpRequestGetHeader (http_request, header_name)
{
	return http_request.xml_http_req.getResponseHeader (header_name);
}

function jr_HttpRequestSetHeaders (http_request, header_array)
{
	http_request.header_array	= new Array();

	for (header_name in header_array) {
		http_request.header_array[header_name]	= header_array[header_name];
	}
}

function jr_HttpRequestSetUploadProgressHandler (http_request, upload_progress_fn)
{
	http_request.xml_http_req.upload.addEventListener( "progress", upload_progress_fn);
}

function jr_GenericHttpHandler( http_request)
{
	if (http_request.xml_http_req.readyState == 4) {
		
		try {
			http_request.handler_fn (http_request.handler_param, http_request);
		}
		catch (exception_msg) {
			var		error_msg		= "";

			if (exception_msg.fileName) {
				error_msg	+= exception_msg.fileName;

				if (exception_msg.lineNumber) {
					error_msg += ":" + exception_msg.lineNumber
				}
				error_msg += ": ";
			}
			else {
				error_msg	+=  "jr_GenericHttpHandler(): ";
			}
			alert( error_msg + jr_ExceptionString( exception_msg));
		}
		finally {

			http_request.in_progress		= false;

			if (jr_IsIE) {
				http_request.xml_http_req.abort();
			}
		}
	}
}

function jr_HttpRequestGet (http_request, url_string, handler_fn, handler_param)
{
	var status;

	status = jr_HttpRequestSend (http_request, url_string, "GET", null, handler_fn, handler_param);

	return status;
}

function jr_HttpRequestPost (http_request, url_string, request_content, handler_fn, handler_param)
{
	var status;
	
	status	= jr_HttpRequestSend (
				http_request, url_string, "POST", request_content, handler_fn, handler_param
			);

	return status;
}

function jr_HttpRequestSend (
	http_request, url_string, request_type, request_content, handler_fn, handler_param)
{
	if (! http_request.xml_http_req) {
		http_request.error_buf		= "request not initialized";
		return -1;
	}
	if (http_request.in_progress) {
		http_request.error_buf		= "second jr_HttpRequest() while one is still in progress";
		return -1;
	}

	if (http_request.is_async) {
		if (!handler_fn) {
			http_request.error_buf		= "no handler function for async. request";
			return -1;
		}
		var		anon_handler_wrapper	= function() {
			jr_GenericHttpHandler( http_request);
		}

		http_request.handler_fn			= handler_fn;
		http_request.handler_param		= handler_param;

		http_request.xml_http_req.onreadystatechange = anon_handler_wrapper;
		http_request.in_progress		= true;
	}

	try {
		http_request.xml_http_req.open (request_type, url_string, http_request.is_async);
	} catch(e) {
		http_request.error_buf		= "couldn't open HTTP request: " + jr_ExceptionString( e);

		return -1;
	}

		/*
		** 9-5-2011: firefox request headers set after the call to open();
		*/
	try {
		var		header_name;

		for (header_name in http_request.header_array) {
			http_request.xml_http_req.setRequestHeader(
				header_name, http_request.header_array[header_name]
			);
		}
	} catch(e) {
		http_request.error_buf		= "couldn't set HTTP headers: " + jr_ExceptionString( e);

		return -1;
	}

	try {
		http_request.xml_http_req.send (request_content);
	} catch(e) {
		http_request.error_buf		= "couldn't send HTTP request: " + jr_ExceptionString( e);

		return -2;
	}

	return 0;
}

