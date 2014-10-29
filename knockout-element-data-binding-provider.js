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
        var extend = function (from, to) {
            for (var prop in from) {
                if (from.hasOwnProperty(prop)) {
                    to[prop] = from[prop];
                }
            }
        };

        var extendBindingFromBindingAccessor = function (binding, bindingAccessor, bindingContext) {
            var fromBinding = typeof bindingAccessor === 'function' ? bindingAccessor.call(bindingContext.$data) : bindingAccessor;
            extend(fromBinding, binding);
        };

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

        this.setBinding = function (elem, binding) {
            /// <summary>Attaches a binding to the data for an element
            /// If called with a DOM element, applies the binding object to the element
            /// Can also be called with an object whose keys are class or id selectors prefixed with '.' or '#' 
            /// and whose values are the binding objects. 
            /// In this case the second argument is optionally the container in which to restrict the search (only for bindings by class)
            /// </summary>
            // if called with the second argument then this is the actual binding to element method
            if (typeof elem.nodeType === 'number' && typeof elem.nodeName === 'string') {
                extend(ko.utils.domData.get(elem, 'knockout-binding') || {}, binding);
                ko.utils.domData.set(elem, 'knockout-binding', binding);
            } else {
                // if not then we were passed a binding object whose properties are keys containing ids or classnames and values
                // containing the binding for those ids/classes
                var container = binding;
                binding = elem;
                for (var prop in elem) {
                    if (binding.hasOwnProperty(prop)) {
                        switch (prop[0]) {
                            // class binding
                            case '.':
                                this.setBindingByClassName(prop.slice(1), binding[prop], container);
                                break;
                                // id binding
                            case '#':
                                this.setBindingById(prop.slice(1), binding[prop]);
                                break;
                        }
                    }
                }
            }
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
            return !!ko.utils.arrayFirst(this.bindingProviders, function(provider) {
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