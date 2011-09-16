/// <loc filename="metadata\res_loc_oam.xml" format="messagebundle" />
/// <reference path='base.js' />
 
/*
  © Microsoft. All rights reserved.

  This library is supported for use in Windows Tailored Apps only.

  Build: 6.2.8100.0 
  Version: 0.5 
*/
 


(function (WinJS, undefined) {    

    var readyComplete = false;
    var resourceMap;
    var resourceLoader;

    function processAllImpl(rootElement) {
        WinJS.Resources._processAllImpl(rootElement);
        return WinJS.Promise.wrap();
    }
        
    WinJS.Namespace.defineWithParent(WinJS, "Resources", {
        _parseResourceSyntax: function (str){
            var objs = [];
            var chunks = str.split(";");

            for(var i = 0, l = chunks.length; i < l; i++){
                var chunk = chunks[i];

                if(chunk.trim() !== ""){
                    var index = chunk.indexOf(":");

                    if (index !== -1){
                        var prop = chunk.substring(0, index);
                        var ref = chunk.substring(index + 1);

                        objs.push({destination: prop.trim(), source: ref.trim() });
                        
                    }else {
                        if (WinJS.validation){                                
                            this._throwError("InvalidMarkup");
                        }
                    }
                }
            }
            return objs;
        },

        _throwError : function(errorId) {
            var hardCodedErrors = {
                "InvalidMarkup":"Invalid markup",
                "FailToFindItem":"Fail to find item:{0}",
                "UndefinedProperty":"Undefined property name:{0}",
                "InvalidValueForProperty":"Invalid value:[{0}] for given property:[{1}]",
                "TooDeepLoop":"Nested loop more than {0} is not supported",
                "NoItem":"no resource for given source: {0}",
                "NoActionAllowed":"action is not allowed in the data-win-res syntax"
            };

            var message = hardCodedErrors[errorId];

            if (message) {
                for (var i = 1, l = arguments.length; i < l; i++){
                    message = message.replace("{" + (i-1) + "}", arguments[i]);
                }
            }else {
                message = "unknown error";
            }
            
            throw message;
        },
            
        _setMember: function (props, root, data) {    
            var parts = props.split(".");
            
            var ob = root;
            var prop = parts[0];
            for (var i = 1, len = parts.length; i < len; i++) {
                if (ob[parts[ i-1]] === undefined) {
                    ob[parts[i-1] ] = {} ;
                }
                ob = ob[parts[i-1]] ;
                prop = parts[i];
            }
            
            ob[prop] = data.value;
            if ((data.lang !== undefined) && 
                (ob.lang !== undefined) &&
                (ob.lang !== data.lang) ) {
                
                ob.lang = data.lang;
            }
        },

        _getString : function (key) {
            /// <summary locid="1">
            /// Search resources through MRT resources
            /// </summary>
            /// <param name="key" locid="2">
            /// Requested resource id for searching
            /// </param>

            if (!resourceLoader){
                if (window.Windows && Windows.ApplicationModel && Windows.ApplicationModel.Resources) {
                    resourceLoader = new Windows.ApplicationModel.Resources.ResourceLoader();
                }
            }


            return resourceLoader && resourceLoader.getString(key);

        },

        _getValue : function (key) {
            /// <summary>
            /// Search resources through MRT resources
            /// </summary>
            /// <param name='key'>
            /// Requested resource id for searching
            /// </param>
            if (!resourceMap){
                if (window.Windows && Windows.ApplicationModel && Windows.ApplicationModel.Resources) {
                    var mainResourceMap = Windows.ApplicationModel.Resources.Core.ResourceManager.current.mainResourceMap;
                    resourceMap = mainResourceMap.getSubtree('Resources');
                }
            }

            if (resourceMap){
                var resCandidate = resourceMap.getValue(key);

                var langValue = "";
                var qualifiers = resCandidate.qualifiers;
                
                for (var i = 0, len = resCandidate.qualifiers.size; i < len; i++){
                    if (qualifiers[i].qualifierName === "Language"){
                        langValue = qualifiers[i].qualifierValue;
                        break;
                    }
                }
                    
                return {value:resCandidate.toString(), lang:langValue};
            }

        },

        _processAllImpl: function(rootElement, count){
            rootElement = rootElement || document.body;

            var count = count || 0;
            
            if (count < 4) {

                var elements = rootElement.querySelectorAll('[data-win-res]');

                if (count == 0) {
                    if (rootElement.getAttribute) {
                        var elem = rootElement.getAttribute('data-win-res');
                        if (elem) {
                            elements.push(elem);
                        }
                    }
                }
                
                if (elements.length === 0) { 
                    return;
                }
                
                for (var i = 0, len = elements.length; i < len; i++) {
                    var e = elements[i];

                    var decls = this._parseResourceSyntax(e.getAttribute('data-win-res'));
                
                    for (var k = 0, l = decls.length ; k < l; k++){
                        var decl = decls[k];

                        var data = false;
                        try {
                            data = this._getValue(decl.source);
                        } catch(err) {
                            if (WinJS.validation) {
                                throw err;
                            }
                        }
                        
                        if (data) {
                            this._setMember(decl.destination, e, data);
                            if (decl.destination === "innerHTML") {
                                this._processAllImpl(e, count + 1);
                            }
                        }else {
                            if (WinJS.validation) {
                                this._throwError("NoItem", decl.source);
                            }
                        }
                    }                
                }
            }
            else if (WinJS.validation){
                this._throwError("TooDeepLoop", 3);
            }
        },
        
        processAll: function (rootElement) {
            /// <summary locid="3">
            /// Process resources tag that reads its syntax and replace strings
            /// with localized strings
            /// </summary>
            /// <param name="rootElement" locid="4">
            /// Element to start searching at, if not specified, the entire document is searched.
            /// </param>

            if (!readyComplete) {
                return WinJS.Utilities.ready().then(function () { 
                    readyComplete = true;
                    return processAllImpl(rootElement); 
                });
            }
            else {
                return processAllImpl(rootElement); 
            }
        }
    });
})(WinJS);

