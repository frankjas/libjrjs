/*
** 5-15-2017: derived from JSTreeGraph
**
** JSTreeGraph: Copyright (c) 2012, Cristhian Fernández Villalba
** License: New BSD license, see: https://jstreegraph.codeplex.com/license
** Downloaded May 5, 2017 from: https://jstreegraph.codeplex.com/releases/view/80751
**
*/

var		jr_TreeNodeId			= 1;

function jr_Tree( options)
{
	this.options	= options

	this.offset_left		= 0;
	this.offset_top			= 0;
	this.offset_width		= 0;
	this.offset_height		= 0;
}

function jr_TreeCreate( options)
{
	var object		= new jr_Tree( options);

	return object;
}

function jr_TreeNode()
{
	this.options	= options;
}

function jr_TreeNodeCreate(options)
{
	var object		= new jr_TreeNode( options);

	return object;
}

function jr_TreeHeightPx( object)
{
	return object.offset_height;
}

function jr_TreeAdjustBoundingBox( object, node_div)
{
	if (node_div.offsetLeft < object.offset_left) {
		object.offset_left = node_div.offsetLeft;
	}
	if (node_div.offsetTop < object.offset_top) {
		object.offset_top = node_div.offsetTop;
	}
	if (node_div.offsetLeft + node_div.offsetWidth > object.offset_left + object.offset_width) {
		object.offset_width = node_div.offsetLeft + node_div.offsetWidth - object.offset_left;
	}
	if (node_div.offsetTop + node_div.offsetHeight > object.offset_top + object.offset_height) {
		object.offset_height = node_div.offsetTop + node_div.offsetHeight - object.offset_top;
	}
}

function jr_TreeDraw( object)
{
    jr_TreePrepareNode(object.options.RootNode);

    if (object.options.Layout == "Vertical") {
        jr_TreePerformLayoutV(object.options.RootNode);
    }
	else {
        jr_TreePerformLayoutH(object.options.RootNode);
    }

    object.options.Container.innerHTML = "";

    jr_TreeDrawNode(object, object.options.RootNode, object.options.Container);

    jr_TreeDrawLines(object.options.RootNode, object.options.Container);
}

function jr_TreeDrawLines(node, container)
{
    if ((!node.Collapsed) && node.Nodes && node.Nodes.length > 0) { // Has children and Is Expanded
        for (var j = 0; j < node.Nodes.length; j++) {
            if(node.ChildrenConnectorPoint.Layout=="Vertical") {
                jr_TreeDrawLineV(container, node.ChildrenConnectorPoint, node.Nodes[j].ParentConnectorPoint);
			}
            else {
                jr_TreeDrawLineH(container, node.ChildrenConnectorPoint, node.Nodes[j].ParentConnectorPoint);
			}
            jr_TreeDrawLines(node.Nodes[j], container);
        }
    }
}

function jr_TreeDrawLineH(container, startPoint, endPoint)
{
	var midY = (startPoint.Y + ((endPoint.Y - startPoint.Y) / 2)); // Half path between start en end Y point

	// Start segment
	jr_TreeDrawLineSegment(container, startPoint.X, startPoint.Y, startPoint.X, midY, 1);

	// Intermidiate segment
	var imsStartX = startPoint.X < endPoint.X ? startPoint.X : endPoint.X; // The lower value will be the starting point
	var imsEndX = startPoint.X > endPoint.X ? startPoint.X : endPoint.X; // The higher value will be the ending point
	jr_TreeDrawLineSegment(container, imsStartX, midY, imsEndX, midY, 1);

    // End segment
	jr_TreeDrawLineSegment(container, endPoint.X, midY, endPoint.X, endPoint.Y, 1);
}

function jr_TreeDrawLineV(container, startPoint, endPoint)
{
    var midX = (startPoint.X + ((endPoint.X - startPoint.X) / 2)); // Half path between start en end X point

    // Start segment
    jr_TreeDrawLineSegment(container, startPoint.X, startPoint.Y, midX, startPoint.Y, 1);

	// Intermidiate segment
    var imsStartY = startPoint.Y < endPoint.Y ? startPoint.Y : endPoint.Y; // The lower value will be the starting point
    var imsEndY = startPoint.Y > endPoint.Y ? startPoint.Y : endPoint.Y; // The higher value will be the ending point
    jr_TreeDrawLineSegment(container, midX, imsStartY, midX, imsEndY, 1);

    // End segment
    jr_TreeDrawLineSegment(container, midX, endPoint.Y, endPoint.X, endPoint.Y, 1);
}

function jr_TreeDrawLineSegment(container, startX, startY, endX, endY, lineWidth)
{

    var lineDiv = document.createElement("div");
    lineDiv.style.top = startY + "px";
    lineDiv.style.left = startX + "px";

    if (startX == endX) { // Vertical Line
        lineDiv.style.width = lineWidth + "px";
        lineDiv.style.height = (endY - startY) + "px";
    }
    else { // Horizontal Line
        lineDiv.style.width = (endX - startX) + "px";
        lineDiv.style.height = lineWidth + "px";
    }

    lineDiv.className = "NodeLine";
    container.appendChild(lineDiv);
}

function jr_TreeDrawNode(object, node, container, options)
{
    var nodeDiv				= document.createElement("div");

    nodeDiv.style.top		= node.Top + "px";
    nodeDiv.style.left		= node.Left + "px";
    nodeDiv.style.width		= node.Width + "px";
    nodeDiv.style.height	= node.Height + "px";

    if (node.Collapsed) {
        nodeDiv.className = "NodeCollapsed";
    }
	else {
        nodeDiv.className = "Node";
    }
        
    if (node.Class) {
        nodeDiv.className = node.Class;
	}

    if (node.Content) {
        nodeDiv.innerHTML = "<div class='NodeContent'>" + node.Content + "</div>";
	}
        
    if (node.ToolTip) {
        nodeDiv.setAttribute("title", node.ToolTip);
	}
        
    nodeDiv.Node = node;

    if (object.options.OnNodeClick) {
        nodeDiv.onclick = object.options.OnNodeClick;
	}
    if (object.options.OnNodeDoubleClick) {
        nodeDiv.ondblclick = object.options.OnNodeDoubleClick;
	}

    nodeDiv.onmouseover = function () {
        this.PrevClassName = this.className;
        this.className = "NodeHover";
    };

    nodeDiv.onmouseout = function () {
        if (this.PrevClassName) {
            this.className = this.PrevClassName;
            this.PrevClassName = null;
        }
    };

    container.appendChild(nodeDiv);

	jr_TreeAdjustBoundingBox( object, nodeDiv);

    if (!node.Collapsed && node.Nodes && node.Nodes.length > 0) {
		// Has Children and is Expanded

        for (var i = 0; i < node.Nodes.length; i++) {
            jr_TreeDrawNode(object, node.Nodes[i], container);
        }
    }
}

function jr_TreePerformLayoutV(node)
{

    var nodeHeight = 30;
    var nodeWidth = 100;
    var nodeMarginLeft = 50;
    var nodeMarginTop = 30;

    var nodeTop = 0; // defaultValue 

    // Before Layout this Node, Layout its children
    if ((!node.Collapsed) && node.Nodes && node.Nodes.length > 0) {
        for (var i = 0; i < node.Nodes.length; i++) {
            jr_TreePerformLayoutV(node.Nodes[i]);
        }
    }

    if ((!node.Collapsed) && node.Nodes && node.Nodes.length > 0) { // If Has Children and Is Expanded

        // My Top is in the center of my children
        var childrenHeight = (node.Nodes[node.Nodes.length - 1].Top + node.Nodes[node.Nodes.length - 1].Height) - node.Nodes[0].Top;
        nodeTop = (node.Nodes[0].Top + (childrenHeight / 2)) - (nodeHeight / 2);

        // Is my top over my previous sibling?
        // jr_TreeMove it to the bottom
        if (node.LeftNode && ((node.LeftNode.Top + node.LeftNode.Height + nodeMarginTop) > nodeTop)) {
            var newTop = node.LeftNode.Top + node.LeftNode.Height + nodeMarginTop;
            var diff = newTop - nodeTop;
            /// jr_TreeMove also my children
            jr_TreeMoveBottom(node.Nodes, diff);
            nodeTop = newTop;
        }

    }
	else {
        // My top is next to my top sibling
        if (node.LeftNode)
            nodeTop = node.LeftNode.Top + node.LeftNode.Height + nodeMarginTop;
    }

    node.Top = nodeTop;

    // The Left depends only on the level
    node.Left = (nodeMarginLeft * (node.Level + 1)) + (nodeWidth * (node.Level + 1));
    // Size is constant
    node.Height = nodeHeight;
    node.Width = nodeWidth;

    // Calculate Connector Points
    // Child: Where the lines get out from to connect this node with its children
    var pointX = node.Left + nodeWidth;
    var pointY = nodeTop + (nodeHeight/2);
    node.ChildrenConnectorPoint = { X: pointX, Y: pointY, Layout: "Vertical" };
    // Parent: Where the line that connect this node with its parent end
    pointX = node.Left;
    pointY = nodeTop + (nodeHeight/2);
    node.ParentConnectorPoint = { X: pointX, Y: pointY, Layout: "Vertical" };
}

function jr_TreePerformLayoutH(node)
{
    var nodeHeight			= 30;
    var nodeWidth			= 100;
    var nodeMarginLeft		= 30;
    var nodeMarginTop		= 50;

    var nodeLeft			= 0;

    // Before Layout this Node, Layout its children
    if (!node.Collapsed && node.Nodes && node.Nodes.length>0) {
        for (var i = 0; i < node.Nodes.length; i++) {
            jr_TreePerformLayoutH(node.Nodes[i]);
        }
    }

    if (!node.Collapsed && node.Nodes && node.Nodes.length > 0) { // If Has Children and Is Expanded

        // My left is in the center of my children
        var childrenWidth	=	node.Nodes[node.Nodes.length-1].Left
								+ node.Nodes[node.Nodes.length-1].Width
								- node.Nodes[0].Left;

        nodeLeft = node.Nodes[0].Left + childrenWidth/2 - nodeWidth/2;

        // Is my left over my left node?
        // jr_TreeMove it to the right
        if (node.LeftNode  &&  node.LeftNode.Left + node.LeftNode.Width + nodeMarginLeft > nodeLeft) {
            var newLeft	= node.LeftNode.Left + node.LeftNode.Width + nodeMarginLeft;
            var diff	= newLeft - nodeLeft;

            /// jr_TreeMove also my children
            jr_TreeMoveRight(node.Nodes, diff);

            nodeLeft = newLeft;
        }
    }
	else {
        // My left is next to my left sibling
        if (node.LeftNode) {
            nodeLeft = node.LeftNode.Left + node.LeftNode.Width + nodeMarginLeft;
		}
    }

    node.Left	= nodeLeft;

    // The top depends only on the level
    node.Top	= (nodeMarginTop * (node.Level + 1)) + (nodeHeight * (node.Level + 1));
    // Size is constant
    node.Height	= nodeHeight;
    node.Width	= nodeWidth;

    // Calculate Connector Points
    // Child: Where the lines get out from to connect this node with its children
    var pointX	= nodeLeft + (nodeWidth / 2);
    var pointY	= node.Top + nodeHeight;

    node.ChildrenConnectorPoint = { X: pointX, Y: pointY, Layout:"Horizontal" };

    // Parent: Where the line that connect this node with its parent end
    pointX	= nodeLeft + (nodeWidth / 2);
    pointY	= node.Top;

    node.ParentConnectorPoint = { X: pointX, Y: pointY, Layout: "Horizontal" };
}

function jr_TreeMoveRight(nodes, distance)
{
    for (var i = 0; i < nodes.length; i++) {
        nodes[i].Left += distance;
        if (nodes[i].ParentConnectorPoint) {
			nodes[i].ParentConnectorPoint.X += distance;
		}
        if (nodes[i].ChildrenConnectorPoint) {
			nodes[i].ChildrenConnectorPoint.X += distance;
		}
        if (nodes[i].Nodes) {
            jr_TreeMoveRight(nodes[i].Nodes, distance);
        }
    }
}

function jr_TreeMoveBottom(nodes, distance)
{
    for (var i = 0; i < nodes.length; i++) {
        nodes[i].Top += distance;
        if (nodes[i].ParentConnectorPoint) nodes[i].ParentConnectorPoint.Y += distance;
        if (nodes[i].ChildrenConnectorPoint) nodes[i].ChildrenConnectorPoint.Y += distance;
        if (nodes[i].Nodes) {
            jr_TreeMoveBottom(nodes[i].Nodes, distance);
        }   
    }
}

function jr_TreePrepareNode(node, level, parentNode, leftNode, rightLimits)
{
    if (level === undefined) {
		level = 0;
	}
    if (parentNode === undefined) {
		parentNode = null;
	}
    if (leftNode === undefined) {
		leftNode = null;
	}
    if (rightLimits === undefined) {
		rightLimits = new Array();
	}

    node.Level = level;
    node.ParentNode = parentNode;
    node.LeftNode = leftNode;

    if ((!node.Collapsed) && node.Nodes && node.Nodes.length > 0) { // Has children and is expanded
        for (var i = 0; i < node.Nodes.length; i++) {
            var left = null;

            if (i == 0 && rightLimits[level]!== undefined) {
				left = rightLimits[level];
			}
            if (i > 0) {
				left = node.Nodes[i - 1];
			}

            if (i == (node.Nodes.length-1)) {
				rightLimits[level] = node.Nodes[i];
			}

            jr_TreePrepareNode(node.Nodes[i], level + 1, node, left, rightLimits);
        }
    }
}
