wysihtml5.commands.insertList = (function() {

  var isNode = function(node, name) {
    return node && node.nodeName && node.nodeName === name;
  };

  var findListEl = function(node, nodeName, composer) {
    var ret = {
          el: null,
          other: false
        };

    if (node) {
      var parentLi = wysihtml5.dom.getParentElement(node, { nodeName: "LI" });
          otherNodeName = (nodeName === "UL") ? "OL" : "UL";

      if (isNode(node, nodeName)) {
        ret.el = node;
      } else if (isNode(node, otherNodeName)) {
        ret = {
          el: node,
          other: true
        };
      } else {
        if (isNode(parentLi.parentNode, nodeName)) {
          ret.el = parentLi.parentNode;
        } else if (isNode(parentLi.parentNode, otherNodeName)) {
          ret = {
            el : parentLi.parentNode,
            other: true
          };
        }
      }
    }

    // do not count list elements outside of composer
    if (ret.el && !composer.element.contains(ret.el)) {
      ret.el = null;
    }

    return ret;
  };

  var handleSameTypeList = function(el, nodeName, composer) {
    // Unwrap list
    // <ul><li>foo</li><li>bar</li></ul>
    // becomes:
    // foo<br>bar<br>
    composer.selection.executeAndRestore(function() {
      wysihtml5.dom.resolveList(el, composer.config.useLineBreaks);
    });
  };

  var handleOtherTypeList =  function(el, nodeName, composer) {
    var otherNodeName = (nodeName === "UL") ? "OL" : "UL";
    // Turn an ordered list into an unordered list
    // <ol><li>foo</li><li>bar</li></ol>
    // becomes:
    // <ul><li>foo</li><li>bar</li></ul>
    composer.selection.executeAndRestore(function() {
      var renameLists = [el],
          ranges = composer.selection.getOwnRanges();

      // All selection inner lists get renamed too
      for (var r = ranges.length; r--;) {
        renameLists = renameLists.concat(ranges[r].getNodes([1], function(node) {
          return isNode(node, otherNodeName);
        }));
      }
      for (var l = renameLists.length; l--;) {
        wysihtml5.dom.renameElement(renameLists[l], nodeName.toLowerCase());
      }
    });
  };

  var createListFallback = function(nodeName, composer) {
    // Fallback for Create list
    composer.selection.executeAndRestoreRangy(function() {
      var tempClassName =  "_wysihtml5-temp-" + new Date().getTime(),
          tempElement = composer.selection.deblockAndSurround({
            "nodeName": "div",
            "className": tempClassName
          }),
          isEmpty, list;

      // This space causes new lists to never break on enter 
      var INVISIBLE_SPACE_REG_EXP = /\uFEFF/g;
      tempElement.innerHTML = tempElement.innerHTML.replace(INVISIBLE_SPACE_REG_EXP, "");
      
      if (tempElement) {
        isEmpty = wysihtml5.lang.array(["", "<br>", wysihtml5.INVISIBLE_SPACE]).contains(tempElement.innerHTML);
        list = wysihtml5.dom.convertToList(tempElement, nodeName.toLowerCase(), composer.parent.config.uneditableContainerClassname);
        if (isEmpty) {
          composer.selection.selectNode(list.querySelector("li"), true);
        }
      }
    });
  };

  return {
    exec: function(composer, command, nodeName) {
      var doc           = composer.doc,
          cmd           = (nodeName === "OL") ? "insertOrderedList" : "insertUnorderedList",
          selectedNode  = composer.selection.getSelectedNode(),
          list          = findListEl(selectedNode, nodeName, composer);

      if (!list.el) {
        if (composer.commands.support(command)) {
          doc.execCommand(cmd, false, null);
        } else {
          createListFallback(cmd, composer);
        }
      } else if (list.other) {
        handleOtherTypeList(list.el, nodeName, composer);
      } else {
        handleSameTypeList(list.el, nodeName, composer);
      }
    },

    state: function(composer, command, nodeName) {
      var selectedNode = composer.selection.getSelectedNode(),
          list         = findListEl(selectedNode, nodeName, composer);

      return (list.el && !list.other) ? list.el : false;
    }
  };

})();