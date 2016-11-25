
try {
	module.exports = Promise
} catch (e) {}

var toString = Object.prototype.toString
var isFunction = function isFunction (obj) {
    return toString.call(obj) == "[object Function]"
}

var isObj = function isObj (obj) {
    return toString.call(obj) == "[object Object]"
}

function Promise (fn) {
	this.status = 'pending'
	this.value = null
	this.onResolvedCallback = []
	this.onRejectedCallback = []
	var resolve = _resolve.bind(this)
	var reject = _reject.bind(this)
	try {
		fn(resolve, reject)
	} catch (reason) {
		reject(reason)
	}
}

Promise.prototype.then = function (onResolved, onRejected) {
	var _this = this,
		promise2

	onResolved = isFunction(onResolved) ? onResolved : function (value) { return value }
	onRejected = isFunction(onRejected) ? onRejected : function (reason) { throw reason }

	return promise2 = new Promise(function (resolve, reject) {
		if (_this.status === 'pending') {
			_this.onResolvedCallback.push(function (value) {
				try {
					var x = onResolved(value)
					resolvePromise(promise2, x, resolve, reject)
				} catch (reason) {
					reject(reason)
				}
			})

			_this.onRejectedCallback.push(function (reason) {
				try {
					var x = onRejected(reason)
					resolvePromise(promise2, x, resolve, reject)
				} catch (reason) {
					reject(reason)
				}
			})
		} else {
			setTimeout(function () {
				var x
				try {
					if (_this.status === 'resolved') {
						x = onResolved(_this.value)
					} else if (_this.status === 'rejected') {
						x = onRejected(_this.value)
					}
					resolvePromise(promise2, x, resolve, reject)
				} catch (reason) {
					reject(reason)
				}
			}, 0)
		}
	})
}

Promise.prototype.catch = function (onRejected) {
	return this.then(null, onRejected)
}

Promise.resolve = function (value) {
	return new Promise(function (resolve, reject) {
		resolve(value)
	})
}

Promise.reject = function (reason) {
	return new Promise(function (resolve, reject) {
		reject(reason)
	})
}

function _resolve (value) {
	if (value instanceof Promise) {
      return value.then(_resolve.bind(this), _reject.bind(this))
    }
	var _this = this
	setTimeout(function () {
		if (_this.status === 'pending') {
			_this.status = 'resolved'
			_this.value = value
			_this.onResolvedCallback.forEach(function (fn) {
				fn(value)
			})
		}
	}, 0)
}

function _reject (reason) {
	var _this = this
	setTimeout(function () {
		if (_this.status === 'pending') {
			_this.status = 'rejected'
			_this.value = reason
			_this.onRejectedCallback.forEach(function (fn) {
				fn(reason)
			})
		}
	}, 0)
}

function resolvePromise (promise2, x, resolve, reject) {
	var then,
		thenIsCall = false

    if (promise2 === x) {
        return reject(new TypeError('Chaining cycle detected for promise'))
    }

	if (x instanceof Promise) {
		if (x.status === 'pending') {
            x.then(function (value) {
                resolvePromise(promise2, value, resolve, reject)
            }, reject)
        } else {
            x.then(resolve, reject)
        }
        return
	}

	if (isObj(x) || isFunction(x)) {
		try {
            then = x.then
            if (isFunction(then)) {
                then.call(x, function (y) {
					if (thenIsCall) return
					thenIsCall = true
					return resolvePromise(promise2, y, resolve, reject)
                }, function (reason) {
					if (thenIsCall) return
					thenIsCall = true
					return reject(reason)
                })
            } else {
                resolve(x)
            }
        } catch (reason) {
            if (thenIsCall) return
			thenIsCall = true
			return reject(reason)
        }
	} else {
		resolve(x)
	}
}

Promise.deferred = Promise.defer = function() {
  var dfd = {}
  dfd.promise = new Promise(function(resolve, reject) {
    dfd.resolve = resolve
    dfd.reject = reject
  })
  return dfd
}