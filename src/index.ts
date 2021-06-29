// 事件类型 string | symbol
export type EventType = string | symbol;

// An event handler can take an optional event argument
// and should not return a value
// 函数的回调函数接受一个可选的event参数，并且没有返回值
export type Handler<T = unknown> = (event: T) => void;
// 全量调用函数
export type WildcardHandler<T = Record<string, unknown>> = (
	type: keyof T,
	event: T[keyof T]
) => void;

// An array of all currently registered event handlers for a type
// 包含当前已经注册的回调函数的数组
export type EventHandlerList<T = unknown> = Array<Handler<T>>;
// 全量调用函数列表
export type WildCardEventHandlerList<T = Record<string, unknown>> = Array<WildcardHandler<T>>;

// A map of event types and their corresponding event handlers.
// 一个包含event事件和对应event回调函数的Map对象
export type EventHandlerMap<Events extends Record<EventType, unknown>> = Map<
	keyof Events | '*',
	EventHandlerList<Events[keyof Events]> | WildCardEventHandlerList<Events>
>;

// Emitter interface all 回调函数映射Map on注册方法 off注销方法 emit事件触发方法
export interface Emitter<Events extends Record<EventType, unknown>> {
	all: EventHandlerMap<Events>;

	on<Key extends keyof Events>(type: Key, handler: Handler<Events[Key]>): void;
	on(type: '*', handler: WildcardHandler<Events>): void;

	off<Key extends keyof Events>(type: Key, handler?: Handler<Events[Key]>): void;
	off(type: '*', handler: WildcardHandler<Events>): void;

	emit<Key extends keyof Events>(type: Key, event: Events[Key]): void;
	emit<Key extends keyof Events>(type: undefined extends Events[Key] ? Key : never): void;
}

/**
 * Mitt: Tiny (~200b) functional event emitter / pubsub.
 * @name mitt
 * @returns {Mitt}
 */
export default function mitt<Events extends Record<EventType, unknown>>(
	all?: EventHandlerMap<Events>
): Emitter<Events> {
	// 定义通用回调函数类型
	type GenericEventHandler =
		| Handler<Events[keyof Events]>
		| WildcardHandler<Events>;
	all = all || new Map();

	return {

		/**
		 * A Map of event names to registered handler functions.
		 */
		// 一个事件名对应回调函数的Map
		all,

		/**
		 * Register an event handler for the given type.
		 * @param {string|symbol} type Type of event to listen for, or `'*'` for all events
		 * @param {Function} handler Function to call in response to given event
		 * @memberOf mitt
		 */
		on<Key extends keyof Events>(type: Key, handler: GenericEventHandler) {
			// 获取当前event key对应的回调函数list
			const handlers: Array<GenericEventHandler> | undefined = all!.get(type);
			// list 存在，调用push方法
			if (handlers) {
				handlers.push(handler);
			}
			// 不存在，注册
			else {
				all!.set(type, [handler] as EventHandlerList<Events[keyof Events]>);
			}
		},

		/**
		 * Remove an event handler for the given type.
		 * If `handler` is omitted, all handlers of the given type are removed.
		 * @param {string|symbol} type Type of event to unregister `handler` from, or `'*'`
		 * @param {Function} [handler] Handler function to remove
		 * @memberOf mitt
		 */
		off<Key extends keyof Events>(type: Key, handler?: GenericEventHandler) {
			// 获取当前event key对应的回调函数list
			const handlers: Array<GenericEventHandler> | undefined = all!.get(type);
			// handlers 存在
			if (handlers) {
				// 注销对应的handler方法
				if (handler) {
					// 无符号右移，正数取整，-1返回4294967295 Math.pow(2, 32) - 1
					// splice start 参数 正数 大于数组长度，默认为数组长度。此时如果提供了deleteCount以外的参数，函数行为同push一致
					// 负数 start + length < 0 默认 start 为0
					handlers.splice(handlers.indexOf(handler) >>> 0, 1);
				}
				else {
					all!.set(type, []);
				}
			}
		},

		/**
		 * Invoke all handlers for the given type.
		 * If present, `'*'` handlers are invoked after type-matched handlers.
		 * * 全量函数将在对应的type函数执行完成之后才执行
		 *
		 * Note: Manually firing '*' handlers is not supported.
		 * 注意：无法手动控制*对应的wildCard事件执行
		 *
		 * @param {string|symbol} type The event type to invoke
		 * @param {Any} [evt] Any value (object is recommended and powerful), passed to each handler
		 * @memberOf mitt
		 */
		emit<Key extends keyof Events>(type: Key, evt?: Events[Key]) {
			// 获取对应event key 的回调函数数组
			let handlers = all!.get(type);
			// 数组存在则依次调用
			if (handlers) {
				(handlers as EventHandlerList<Events[keyof Events]>)
					.slice()
					.map((handler) => {
						handler(evt!);
					});
			}

			handlers = all!.get('*');
			if (handlers) {
				(handlers as WildCardEventHandlerList<Events>)
					.slice()
					.map((handler) => {
						handler(type, evt!);
					});
			}
		}
	};
}


