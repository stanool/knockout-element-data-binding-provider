(function() {
	var DomDataBindingProvider = function () {
        /// <summary>Uses binding objects stored as data on DOM elements. Use setBinding on a DOM element or use the 
        /// setBindingByxxx helpers. 
		/// An example binding object is, { 
        ///     firstName : function() { 
        ///         return { 
        ///             text : this.firstName; 
        ///         }; 
        ///     }, 
		///		lastName : function() { 
        ///         return { 
        ///             text: this.lastName 
        ///         }; 
        ///     } 
        /// }
		/// </summary>
        this.nodeHasBindings = function (node) {
            return !!ko.utils.domData.get(node, 'knockout-binding');
        };

        this.getBindings = function(node, bindingContext) {
            var result = null;
            var bindingAccessor = ko.utils.domData.get(node, 'knockout-binding');
            if (bindingAccessor) {
                result = {};
                extendBindingFromBindingAccessor(result, bindingAccessor, bindingContext);
            }
            return result;
        };

        this.setBinding = function(elem, binding) {
            extend(ko.utils.domData.get(elem, 'knockout-binding') || {}, binding);
            ko.utils.domData.set(elem, 'knockout-binding', binding);
            if (elem.addEventListener)
                elem.addEventListener('DOMNodeRemoved', function() {
                    ko.utils.domData.clear(elem);
                });
        };
        
        this.setBindingByClassName = function (className, binding, container) {
            container = container || document;
            var elems = container.getElementsByClassName(className);
            for (var i = 0, count = elems.length; i < count; i++) {
                this.setBinding(elems[i], binding);
            };
        }

        this.setBindingById = function(id, binding) {
            this.setBinding(document.getElementById(id), binding);
        }
    };

    function CompositeBindingProvider() {
        /// <summary>Allows knockout to use a list of binding providers rather than just the default</summary>
        this.bindingProviders = Array.prototype.slice.call(arguments);

        this.nodeHasBindings = function(node) {
            return this.bindingProviders.any(function(provider) {
                return provider.nodeHasBindings(node);
            });
        };

        this.getBindings = function(node, bindingContext) {
            for (var i = 0, count = this.bindingProviders.length; i < count; i++) {
                var provider = this.bindingProviders[i];
                if (provider.nodeHasBindings(node))
                    return provider.getBindings(node, bindingContext);
            }
            return null;
        };
    }

    // stick a DomDataBindingProvider somewhere that can be globally accessed so that it's setBindingsByxxx methods 
    // can be used
    ko.stanool = { domDataBindingProvider : new DomDataBindingProvider() };

    // replace the default binding provider with our composite binding provider that wraps the default one plus
    // our DomDataBindingProvider
    ko.bindingProvider.instance = new CompositeBindingProvider(ko.bindingProvider.instance,
        ko.stanool.domDataBindingProvider);
})();