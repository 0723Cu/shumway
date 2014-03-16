/*
 * Copyright 2013 Mozilla Foundation
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
///<reference path='references.ts' />

interface Object {
  __proto__: Object;
}

module Shumway.AVM2.AS {
  
  import Trait = Shumway.AVM2.ABC.Trait;
  import ClassInfo = Shumway.AVM2.ABC.ClassInfo;
  import Multiname = Shumway.AVM2.ABC.Multiname;
  import Namespace = Shumway.AVM2.ABC.Namespace;
  import ApplicationDomain = Shumway.AVM2.Runtime.ApplicationDomain;
  import Scope = Shumway.AVM2.Runtime.Scope;
  import hasOwnProperty = Shumway.ObjectUtilities.hasOwnProperty;
  import createObject = Shumway.ObjectUtilities.createObject;
  import isPrototypeWriteable = Shumway.ObjectUtilities.isPrototypeWriteable;
  import getOwnPropertyDescriptor = Shumway.ObjectUtilities.getOwnPropertyDescriptor;
  import notImplemented = Shumway.Debug.notImplemented;
  import createFunction = Shumway.AVM2.Runtime.createFunction;
  import Runtime = Shumway.AVM2.Runtime;
  import IndentingWriter = Shumway.IndentingWriter;

  var writer = new IndentingWriter();
  // writer = null;

  import ClassBindings = Shumway.AVM2.Runtime.ClassBindings;
  import InstanceBindings = Shumway.AVM2.Runtime.InstanceBindings;

  import Int32Vector = Shumway.AVM2.AS.Int32Vector;
  import Uint32Vector = Shumway.AVM2.AS.Uint32Vector;
  import Float64Vector = Shumway.AVM2.AS.Float64Vector;

  declare var arraySort;

  /**
   * This is all very magical, things are not what they seem, beware!!!
   *
   * The AS3 Class Hierarchy can be expressed as TypeScript, which is nice because
   * we get all sorts of compile time error checking and default arguments support.
   *
   * TODO: TS default argument support is not semantically equivalent to AS3 which
   * uses the arguments.length, TS uses typeof argument === "undefined", so beware.
   *
   * For the most part, you can cut and paste AS3 code into TypeScript and it will
   * parse correctly.
   *
   * The prototype chain configured by TypeScript is not actually used, We only use
   * Class definitions as a templates from which we construct real AS3 classes.
   *
   * Linking:
   *
   * AS -> TS
   *
   * Native AS3 members are linked against TS members. A verification step makes
   * sure all native members are implemented.
   *
   * TS -> AS
   *
   * For this you need to provide TS type definitions and then specify which
   * properties should be made available.
   *
   */

  export enum InitializationFlags {
    NONE             = 0x0,
    OWN_INITIALIZE   = 0x1,
    SUPER_INITIALIZE = 0x2
  }

  export enum CallableStyle {
    /**
     * Calls class instance constructor.
     */
    PASSTHROUGH      = 0x0,

    /**
     * Coerces value to the class type.
     */
    COERCE           = 0x1
  }

  /**
   * In order to avoid shadowing of JS top level Objects we prefix the AS top level
   * classes with the "AS" prefix.
   */

  export class ASObject {
    public static baseClass: typeof ASClass = null;
    public static classInfo: ClassInfo;
    public static instanceConstructor: any = Object;
    public static instanceConstructorNoInitialize: any = null;
    public static classBindings: ClassBindings;
    public static instanceBindings: InstanceBindings;
    public static staticNatives: any [];
    public static instanceNatives: any [];
    public static traitsPrototype: Object;
    public static dynamicPrototype: Object;
    public static defaultValue: any = null;
    public static initializationFlags: InitializationFlags = InitializationFlags.NONE;
    public static callableStyle: CallableStyle = CallableStyle.PASSTHROUGH;
    public static asPrototype: Object;

    public static call(): any {
      log("ASObject::call - Ignoring");
    }

    public static apply(): any {
      log("ASObject::apply - Ignoring");
    }

//    static get asPrototype(): Object {
//      assert (this.dynamicPrototype);
//      return this.dynamicPrototype;
//    }

    /**
     * Makes native class definitions look like ASClass instances.
     */
    static morphIntoASClass(classInfo: ClassInfo): void {
      this.classInfo = classInfo;
      this.__proto__ = ASClass.prototype;
    }

    static create(self: ASClass, baseClass: ASClass, instanceConstructor: any) {
      // ! The AS3 instanceConstructor is ignored.
      log("HERE");
      ASClass.create(self, baseClass, this.instanceConstructor);
    }

    public static coerce(value: any): any {
      return Runtime.asCoerceObject(value);
    }

    public static isInstanceOf(value: any): boolean {
      if (value === null) {
        return false;
      }
      // In AS3, |true instanceof Object| is true. It seems that is the case for all primitive values
      // except for |undefined| which should throw an exception (TODO).
      return true;
    }

    public static isInstance(value: any): boolean {
      if (Shumway.isNullOrUndefined(value)) {
        return false;
      }
      return true;
    }

    public static asCall(self: any, ...argArray: any[]): any {
      assert (this.callableStyle === CallableStyle.PASSTHROUGH);
      log("HERE CALL");
      return this.instanceConstructor.apply(self, argArray);
    }

    public static asApply(self: any, argArray?: any): any {
      assert (this.callableStyle === CallableStyle.PASSTHROUGH);
      log("HERE APPLY");
      return this.instanceConstructor.apply(self, argArray);
    }

    public static verify() {
      ASClassPrototype.verify.call(this);
    }

    public static trace(writer: IndentingWriter) {
      ASClassPrototype.trace.call(this, writer);
    }

    static _setPropertyIsEnumerable(o, V: string, enumerable: boolean): void {
      var name = Multiname.getPublicQualifiedName(V);
      var descriptor = getOwnPropertyDescriptor(o, name);
      descriptor.enumerable = false;
      Object.defineProperty(o, name, descriptor);
    }

    static _hasOwnProperty(o, V: string): boolean {
      notImplemented("_hasOwnProperty");
      return false;
    }

    static _propertyIsEnumerable(o, V: string): boolean {
      notImplemented("_propertyIsEnumerable");
      return false;
    }

    static _isPrototypeOf(o, V): boolean {
      notImplemented("_isPrototypeOf");
      return false;
    }

    static _toString(o): string {
      notImplemented("_toString");
      return "";
    }

    // Hack to make the TypeScript compiler find the original Object.defineProperty.
    static defineProperty = Object.defineProperty;

    isPrototypeOf(V: Object): boolean {
      notImplemented("isPrototypeOf");
      return false;
    }

    hasOwnProperty(V: string): boolean {
      notImplemented("hasOwnProperty");
      return false;
    }

    propertyIsEnumerable(V: string): boolean {
      notImplemented("propertyIsEnumerable");
      return false;
    }
  }

  /**
   * Inherit from this if you don't want to inherit the junk from ASObject
   */
  export class ASNative extends ASObject {
    public static baseClass: typeof ASClass = null;
    public static classInfo: ClassInfo = null;
    public static instanceConstructor: any = null;
    public static classBindings: ClassBindings = null;
    public static instanceBindings: InstanceBindings = null;
    public static staticNatives: any [] = null;
    public static instanceNatives: any [] = null;
    public static traitsPrototype: Object = null;
    public static dynamicPrototype: Object = null;
    public static defaultValue: any = null;
    public static initializationFlags: InitializationFlags = InitializationFlags.NONE;
    public static callableStyle: CallableStyle = CallableStyle.COERCE;
  }

  /**
   * In AS3 all objects inherit from the Object class. Class objects themselves are instances
   * of the Class class. In Shumway, Class instances can be constructed in two ways: dynamically,
   * through the |new ASClass()| constructor function, or "statically" by inheriting the static
   * properties from the ASObject class. Statically constructed functions get morphed into
   * proper ASClass instances when they get constructed at runtime.
   *
   * We need to be really careful not to step on TS's inheritance scheme.
   */
  export class ASClass extends ASObject {
    public static instanceConstructor: any = ASClass;
    public static staticNatives: any [] = null;
    public static instanceNatives: any [] = null;

    /**
     * We can't do our traits / dynamic prototype chaining trick when dealing with builtin
     * functions: Object, Array, etc. Here, we take over the builtin function prototype.
     */
    static configureBuiltinPrototype(self: ASClass, baseClass: ASClass) {
      assert (self.instanceConstructor);
      self.baseClass = baseClass;
      self.dynamicPrototype = self.traitsPrototype = self.instanceConstructor.prototype;
    }

    static configurePrototype(self: ASClass, baseClass: ASClass) {
      self.baseClass = baseClass;
      self.dynamicPrototype = createObject(baseClass.dynamicPrototype);
      if (self.instanceConstructor) {
        self.traitsPrototype = self.instanceConstructor.prototype;
        self.traitsPrototype.__proto__ = self.dynamicPrototype;
      } else {
        self.traitsPrototype = createObject(self.dynamicPrototype);
      }
    }

    /**
     * Called when the class is actually constructed during bytecode execution.
     */
    static create(self: ASClass, baseClass: ASClass, instanceConstructor: any) {
      assert (!self.instanceConstructorNoInitialize, "This should not be set yet.");
      assert (!self.dynamicPrototype && !self.traitsPrototype, "These should not be set yet.");
      if (self.instanceConstructor && !isPrototypeWriteable(self.instanceConstructor)) {
        ASClass.configureBuiltinPrototype(self, baseClass);
      } else {
        ASClass.configurePrototype(self, baseClass);
      }

      if (!self.instanceConstructor) {
        self.instanceConstructor = instanceConstructor;
      } else {
        writer && writer.warnLn("Ignoring AS3 instanceConstructor.");
      }

      self.instanceConstructorNoInitialize = self.instanceConstructor;
      self.instanceConstructor.class = self;
      self.instanceConstructor.prototype = self.traitsPrototype;
    }

    /**
     * Class info.
     */
    classInfo: ClassInfo;

    /**
     * Base class.
     */
    baseClass: ASClass;

    /**
     * Constructs an instance of this class.
     */
    instanceConstructor: new (...args) => any;

    /**
     * Constructs an instance of this class without calling the "native" initializer.
     */
    instanceConstructorNoInitialize: new (...args) => any;

    /**
     * A list of objects to search for methods or accessors when linking static native traits.
     */
    staticNatives: Object [];

    /**
     * A list of objects to search for methods or accessors when linking instance native traits.
     */
    instanceNatives: Object [];

    /**
     * Class bindings associated with this class.
     */
    classBindings: ClassBindings;

    /**
     * Instance bindings associated with this class.
     */
    instanceBindings: InstanceBindings;

    /**
     * Prototype object that holds all class instance traits. This is not usually accessible from AS3 code directly. However,
     * for some classes (native classes) the |traitsPrototype| === |dynamicPrototype|.
     */
    traitsPrototype: Object;

    /**
     * Prototype object accessible from AS3 script code. This is the AS3 Class prototype object |class A { ... }, A.prototype|
     */
    dynamicPrototype: Object;

    coerce: (any) => any;
    defaultValue: any = null;

    /**
     * Initialization flags that determine how native initializers get called.
     */
    initializationFlags: InitializationFlags = InitializationFlags.NONE;
    prototype: Object;

    /**
     * Non-native classes always have coercing callables.
     */
    callableStyle: CallableStyle = CallableStyle.COERCE;

    constructor(classInfo: ClassInfo) {
      super();
      this.classInfo = classInfo;
      this.staticNatives = null;
      this.instanceNatives = null;
    }

    morphIntoASClass(classInfo: ClassInfo): void {
      assert (this.classInfo === classInfo);
      assert (this instanceof ASClass);
    }

    get asPrototype(): Object {
      assert (this.dynamicPrototype);
      return this.dynamicPrototype;
    }

    public asCall(self: any, ...argArray: any[]): any {
      assert (this.callableStyle === CallableStyle.COERCE);
      return Runtime.asCoerce(this, argArray[0])
    }

    public asApply(self: any, argArray?: any): any {
      assert (this.callableStyle === CallableStyle.COERCE);
      return Runtime.asCoerce(this, argArray[0])
    }

    public isInstanceOf(value: any): boolean {
      return true; // TODO: Fix me.
    }

    public isInstance(value: any): boolean {
      return value instanceof this.instanceConstructor;
    }

    /**
     * Checks the structural integrity of the class instance.
     */
    public verify() {
      var self: ASClass = this;
      // Verify that we have bindings for all native traits.
      writer && writer.enter("Verifying Class: " + self.classInfo + " {");
      var traits = [self.classInfo.traits, self.classInfo.instanceInfo.traits];

      var staticNatives: Object [] = [self];
      if (self.staticNatives) {
        Shumway.ArrayUtilities.pushMany(staticNatives, self.staticNatives);
      }

      var instanceNatives: Object [] = [self.prototype];
      if (self.instanceNatives) {
        Shumway.ArrayUtilities.pushMany(instanceNatives, self.instanceNatives);
      }

      if (self === ASObject) {
        assert (!self.baseClass, "ASObject should have no base class.");
      } else {
        assert (self.baseClass, self.classInfo.instanceInfo.name + " has no base class.");
        assert (self.baseClass !== self);
      }

      assert (self.traitsPrototype === self.instanceConstructor.prototype, "The traitsPrototype is not set correctly.");

      if (self !== ASObject) {
        if (ASObject.staticNatives === self.staticNatives) {
          writer && writer.warnLn("Template does not override its staticNatives.");
        }
        if (ASObject.instanceNatives === self.instanceNatives) {
          writer && writer.warnLn("Template does not override its instanceNatives.");
        }
      }

      function has(objects: Object [], predicate: (object: Object, name: string) => boolean, name) {
        for (var i = 0; i < objects.length; i++) {
          if (predicate(objects[i], name)) {
            return true;
          }
        }
        return false;
      }

      for (var j = 0; j < traits.length; j++) {
        var isClassTrait = j === 0;
        for (var i = 0; i < traits[j].length; i++) {
          var trait = traits[j][i];
          var name = escapeNativeName(trait.name.name);
          if (!(trait.isMethodOrAccessor() && trait.methodInfo.isNative())) {
            continue;
          }
          var holders = isClassTrait ? staticNatives : instanceNatives;
          var hasDefinition = false;
          if (trait.isMethod()) {
            hasDefinition = has(holders, Shumway.ObjectUtilities.hasOwnProperty, name);
          } else if (trait.isGetter()) {
            hasDefinition = has(holders, Shumway.ObjectUtilities.hasOwnGetter, name);
          } else if (trait.isSetter()) {
            hasDefinition = has(holders, Shumway.ObjectUtilities.hasOwnSetter, name);
          }
          if (!hasDefinition) {
            writer && writer.warnLn("Template is missing an implementation of the native " + (isClassTrait ? "static" : "instance") + " trait: " + trait + " in class: " + self.classInfo);
          }
        }
      }

      writer && writer.leave("}");
      writer && this.trace(writer);

      Debug.assert(self.instanceConstructor, "Must have a constructor function.");
    }

    private static labelCounter = 0;

    static labelObject(o) {
      if (!o) {
        return o;
      }
      if (!hasOwnProperty(o, "labelId")) {
        o.labelId = ASClass.labelCounter ++;
      }
      if (o instanceof Function) {
        return "Function [#" + o.labelId + "]";
      }
      return "Object [#" + o.labelId + "]";
    }

    trace(writer: IndentingWriter) {
      writer.enter("Class: " + this.classInfo);
      // dumpObject(this);
      writer.writeLn("baseClass: " + this);
      writer.writeLn("baseClass: " + (this.baseClass ? this.baseClass.classInfo.instanceInfo.name: null));
      writer.writeLn("instanceConstructor: " + this.instanceConstructor + " " + ASClass.labelObject(this.instanceConstructor));
      writer.writeLn("instanceConstructorNoInitialize: " + this.instanceConstructorNoInitialize + " " + ASClass.labelObject(this.instanceConstructorNoInitialize));

      writer.writeLn("traitsPrototype: " + ASClass.labelObject(this.traitsPrototype));
      writer.writeLn("traitsPrototype.__proto__: " + ASClass.labelObject(this.traitsPrototype.__proto__));
      writer.writeLn("dynamicPrototype: " + ASClass.labelObject(this.dynamicPrototype));
      writer.writeLn("dynamicPrototype.__proto__: " + ASClass.labelObject(this.dynamicPrototype.__proto__));
      writer.writeLn("instanceConstructor.prototype: " + ASClass.labelObject(this.instanceConstructor.prototype));

//      for (var k in this) {
//        var v = this[k];
//        if (v && ((typeof v === "function") || (typeof v === "object"))) {
//          if (v.traceId === undefined) {
//            v.traceId = ASClass.traceId ++;
//          }
//          if (typeof v === "function") {
//            writer.writeLns(k + ": " + v + " Function " + v.traceId);
//          } else {
//            writer.writeLns(k + ": " + v + " Object " + v.traceId);
//          }
//        } else {
//          writer.writeLns(k + ": " + v);
//        }
//      }
      writer.leave("}");
    }
  }

  var ASClassPrototype = ASClass.prototype;

  export class ASFunction extends ASObject {
    public static baseClass: typeof ASClass = null;
    public static classInfo: ClassInfo;
    public static instanceConstructor: any = Function;
    public static classBindings: ClassBindings;
    public static instanceBindings: InstanceBindings;
    public static staticNatives: any [] = [Function];
    public static instanceNatives: any [] = [Function.prototype];

    constructor() {
      super();
    }

    get asPrototype(): Object {
      var self: Function = <any>this;
      return self.prototype;
    }

    set asPrototype(p) {
      var self: Function = <any>this;
      self.prototype = p;
    }

    get length(): number {
      // Check if we're getting the length of a trampoline.
      if (this.hasOwnProperty(Runtime.VM_LENGTH)) {
        return this.asLength;
      }
      return this.length;
    }

    asCall: (self = undefined, ...args: any []) => any;
    asApply: (self = undefined, args: any [] = undefined) => any;
  }

  export class ASBoolean extends ASObject {
    public static instanceConstructor: any = Boolean;
    public static classBindings: ClassBindings;
    public static instanceBindings: InstanceBindings;
    public static classInfo: ClassInfo;
    public static staticNatives: any [] = null;
    public static instanceNatives: any [] = null;

    constructor(value: any = undefined) {
      super();
    }
  }

  ASBoolean.prototype.toString = Boolean.prototype.toString;
  ASBoolean.prototype.valueOf = Boolean.prototype.valueOf;

  export class ASMethodClosure extends ASFunction {
    public static staticNatives: any [] = null;
    public static instanceNatives: any [] = null;
    public static instanceConstructor: any = ASMethodClosure;

    constructor(self, fn) {
      super();
      var bound = Shumway.FunctionUtilities.bindSafely(fn, self);
      Shumway.ObjectUtilities.defineNonEnumerableProperty(this, "call", bound.call.bind(bound));
      Shumway.ObjectUtilities.defineNonEnumerableProperty(this, "apply", bound.apply.bind(bound));
    }

    toString() {
      return "function Function() {}";
    }
  }

  export class ASNamespace extends ASObject {
    public static staticNatives: any [] = null;
    public static instanceNatives: any [] = null

    public static instanceConstructor: any = function(prefix: string = undefined, uri: string = undefined) {

    }

    get prefix(): any { notImplemented("get prefix"); return; }
    get uri(): String { notImplemented("get uri"); return; }
  }

  export class ASNumber extends ASObject {
    public static instanceConstructor: any = Number;
    public static classBindings: ClassBindings;
    public static instanceBindings: InstanceBindings;
    public static classInfo: ClassInfo;
    public static staticNatives: any [] = [Math];
    public static instanceNatives: any [] = [Number.prototype];
    public static defaultValue: any = Number(0);

    static _numberToString(n: number, radix: number): string { notImplemented("_numberToString"); return; }
    static _convert(n: number, precision: number, mode: number): string { notImplemented("_convert"); return; }
    static _minValue(): number { notImplemented("_minValue"); return; }
  }

  export class ASInt extends ASObject {
    public static instanceConstructor: any = ASInt;
    public static classBindings: ClassBindings;
    public static instanceBindings: InstanceBindings;
    public static classInfo: ClassInfo;
    public static staticNatives: any [] = [Math];
    public static instanceNatives: any [] = [Number.prototype];
    public static defaultValue: any = 0;
    constructor(value: any) {
      super();
      return Object(value | 0);
    }

    public static asCall(self: any, ...argArray: any[]): any {
      return argArray[0] | 0;
    }

    public static asApply(self: any, argArray?: any): any {
      return argArray[0] | 0;
    }
  }

  export class ASUint extends ASObject {
    public static instanceConstructor: any = ASUint;
    public static classBindings: ClassBindings;
    public static instanceBindings: InstanceBindings;
    public static classInfo: ClassInfo;
    public static staticNatives: any [] = [Math];
    public static instanceNatives: any [] = [Number.prototype];
    public static defaultValue: any = 0;

    constructor(value: any) {
      super();
      return Object(value >>> 0);
    }

    public static asCall(self: any, ...argArray: any[]): any {
      return argArray[0] >>> 0;
    }

    public static asApply(self: any, argArray?: any): any {
      return argArray[0] >>> 0;
    }
  }

  export class ASString extends ASObject {
    public static instanceConstructor: any = String;
    public static classBindings: ClassBindings;
    public static instanceBindings: InstanceBindings;
    public static classInfo: ClassInfo;
    public static staticNatives: any [] = [String];
    public static instanceNatives: any [] = [String.prototype];

    get length(): number {
      notImplemented("get length");
      return 0;
    }
  }

  export class ASArray extends ASObject {
    public static instanceConstructor: any = Array;
    public static staticNatives: any [] = [Array];
    public static instanceNatives: any [] = [Array.prototype];

    private static _pop(o: any): any {
      notImplemented("public.Array::private static _pop"); return;
    }
    private static _reverse(o: any): any {
      notImplemented("public.Array::private static _reverse"); return;
    }
    private static _concat(o: any, args: any []): any [] {
      args = args;
      notImplemented("public.Array::private static _concat"); return;
    }
    private static _shift(o: any): any {
      notImplemented("public.Array::private static _shift"); return;
    }
    private static _slice(o: any, A: number, B: number): any [] {
      A = +A; B = +B;
      notImplemented("public.Array::private static _slice"); return;
    }
    private static _unshift(o: any, args: any []): number /*uint*/ {
      args = args;
      notImplemented("public.Array::private static _unshift"); return;
    }
    private static _splice(o: any, args: any []): any [] {
      args = args;
      notImplemented("public.Array::private static _splice"); return;
    }
    private static _sort(o: any, args: any []): any {
      args = args;
      notImplemented("public.Array::private static _sort"); return;
    }
    private static _sortOn(o: any, names: any, options: any): any {
      notImplemented("public.Array::private static _sortOn"); return;
    }
    private static _indexOf(o: any, searchElement: any, fromIndex: number /*int*/): number /*int*/ {
      fromIndex = fromIndex | 0;
      notImplemented("public.Array::private static _indexOf"); return;
    }
    private static _lastIndexOf(o: any, searchElement: any, fromIndex: number /*int*/ = 0): number /*int*/ {
      fromIndex = fromIndex | 0;
      notImplemented("public.Array::private static _lastIndexOf"); return;
    }
    private static _every(o: any, callback: Function, thisObject: any): boolean {
      callback = callback;
      notImplemented("public.Array::private static _every"); return;
    }
    private static _filter(o: any, callback: Function, thisObject: any): any [] {
      callback = callback;
      notImplemented("public.Array::private static _filter"); return;
    }
    private static _forEach(o: any, callback: Function, thisObject: any): void {
      callback = callback;
      notImplemented("public.Array::private static _forEach"); return;
    }
    private static _map(o: any, callback: Function, thisObject: any): any [] {
      callback = callback;
      notImplemented("public.Array::private static _map"); return;
    }
    private static _some(o: any, callback: Function, thisObject: any): boolean {
      callback = callback;
      notImplemented("public.Array::private static _some"); return;
    }
    get length(): number /*uint*/ {
      return this.length;
    }
    set length(newLength: number /*uint*/) {
      newLength = newLength >>> 0;
      this.length = newLength;
    }
    pop(): any {
      notImplemented("public.Array::pop"); return;
    }
    push(): number /*uint*/ {
      notImplemented("public.Array::push"); return;
    }
    unshift(): number /*uint*/ {
      notImplemented("public.Array::unshift"); return;
    }
  }

  export class ASVector<T> extends ASObject {
    public static staticNatives: any [] = null;
    public static instanceNatives: any [] = null;
    public static instanceConstructor: any = ASVector;
  }

  export class ASIntVector extends ASObject {
    public static instanceConstructor: any = Int32Vector;
    public static staticNatives: any [] = [Int32Vector];
    public static instanceNatives: any [] = [Int32Vector.prototype];
    private static _every(o: any, callback: Function, thisObject: any): boolean {
      return o.every(callback, thisObject);
    }
    private static _forEach(o: any, callback: Function, thisObject: any): void {
      return o.forEach(callback, thisObject);
    }
    private static _some(o: any, callback: Function, thisObject: any): boolean {
      return o.some(callback, thisObject);
    }
    private static _sort: (o: any, args: any []) => any = arraySort;
  }

  export class ASUIntVector extends ASObject {
    public static instanceConstructor: any = Uint32Vector;
    public static staticNatives: any [] = [Uint32Vector];
    public static instanceNatives: any [] = [Uint32Vector.prototype];
    private static _every(o: any, callback: Function, thisObject: any): boolean {
      return o.every(callback, thisObject);
    }
    private static _forEach(o: any, callback: Function, thisObject: any): void {
      return o.forEach(callback, thisObject);
    }
    private static _some(o: any, callback: Function, thisObject: any): boolean {
      return o.some(callback, thisObject);
    }
    private static _sort: (o: any, args: any []) => any = arraySort;
  }

  export class ASDoubleVector extends ASObject {
    public static instanceConstructor: any = Float64Vector;
    public static staticNatives: any [] = [Float64Vector];
    public static instanceNatives: any [] = [Float64Vector.prototype];
    private static _every(o: any, callback: Function, thisObject: any): boolean {
      return o.every(callback, thisObject);
    }
    private static _forEach(o: any, callback: Function, thisObject: any): void {
      return o.forEach(callback, thisObject);
    }
    private static _some(o: any, callback: Function, thisObject: any): boolean {
      return o.some(callback, thisObject);
    }
    private static _sort: (o: any, args: any []) => any = arraySort;
  }

  export class ASJSON extends ASObject {
    public static instanceConstructor: any = ASJSON;
    public static staticNatives: any [] = null;
    public static instanceNatives: any [] = null;

    /**
     * Transforms a JS value into an AS value.
     */
    private static transformJSValueToAS(value) {
      if (typeof value !== "object") {
        return value;
      }
      var keys = Object.keys(value);
      var result = value instanceof Array ? [] : {};
      for (var i = 0; i < keys.length; i++) {
        result.asSetPublicProperty(keys[i], ASJSON.transformJSValueToAS(value[keys[i]]));
      }
      return result;
    }

    /**
     * Transforms an AS value into a JS value.
     */
    private static transformASValueToJS(value) {
      if (typeof value !== "object") {
        return value;
      }
      var keys = Object.keys(value);
      var result = value instanceof Array ? [] : {};
      for (var i = 0; i < keys.length; i++) {
        var key = keys[i];
        var jsKey = key;
        if (!isNumeric(key)) {
          jsKey = Multiname.getNameFromPublicQualifiedName(key);
        }
        result[jsKey] = ASJSON.transformASValueToJS(value[key]);
      }
      return result;
    }

    private static parseCore(text: string): Object {
      text = "" + text;
      return ASJSON.transformJSValueToAS(JSON.parse(text))
    }

    private static stringifySpecializedToString(value: Object, replacerArray: any [], replacerFunction: (key: string, value: any) => any, gap: string): string {
      return JSON.stringify(ASJSON.transformASValueToJS(value), replacerFunction, gap);
    }
  }

  export class ASXML extends ASObject {
    public static instanceConstructor: any = ASXML;
  }

  export class ASXMLList extends ASObject {
    public static instanceConstructor: any = ASXMLList;
  }

  export class ASQName extends ASObject {
    public static instanceConstructor: any = ASQName;
  }

  export class ASError extends ASObject {
    public static instanceConstructor: any = Array;
    constructor(message = "", id = 0) {
      super();
    }
  }

  module XYZ {
    export class D extends ASNative {
      d () {
        log("instance d()");
      }

      static d () {
        log("static d()");
      }
    }

    export class E extends D {
      e () {
        log("instance e()");
      }

      static e () {
        log("static e()");
      }
    }
  }

  var builtinNativeClasses: Shumway.Map<ASClass> = Shumway.ObjectUtilities.createMap<ASClass>();

  var isInitialized: boolean = false;

  export function initialize(domain: ApplicationDomain) {
    if (isInitialized) {
      return;
    }
    builtinNativeClasses["ObjectClass"]           = ASObject;
    builtinNativeClasses["Class"]                 = ASClass;
    builtinNativeClasses["FunctionClass"]         = ASFunction;
    builtinNativeClasses["BooleanClass"]          = ASBoolean;
    builtinNativeClasses["MethodClosureClass"]    = ASMethodClosure;
    builtinNativeClasses["NamespaceClass"]        = ASNamespace;
    builtinNativeClasses["NumberClass"]           = ASNumber;
    builtinNativeClasses["intClass"]              = ASInt;
    builtinNativeClasses["uintClass"]             = ASUint;
    builtinNativeClasses["StringClass"]           = ASString;
    builtinNativeClasses["ArrayClass"]            = ASArray;
    builtinNativeClasses["VectorClass"]           = ASVector;
    builtinNativeClasses["ObjectVectorClass"]     = GenericVector;
    builtinNativeClasses["IntVectorClass"]        = ASIntVector;
    builtinNativeClasses["UIntVectorClass"]       = ASUIntVector;
    builtinNativeClasses["DoubleVectorClass"]     = ASDoubleVector;
    builtinNativeClasses["JSONClass"]             = ASJSON;
    builtinNativeClasses["XMLClass"]              = ASXML;
    builtinNativeClasses["XMLListClass"]          = ASXMLList;
    builtinNativeClasses["QNameClass"]            = ASQName;
    isInitialized = true;
  }

  var nativeClasses: Shumway.Map<ASClass> = Shumway.ObjectUtilities.createMap<ASClass>();

  nativeClasses["D"] = XYZ.D;
  nativeClasses["E"] = XYZ.E;

  export function createClass(classInfo: ClassInfo, baseClass: ASClass, scope: Scope) {
    var ci = classInfo;
    var ii = ci.instanceInfo;
    var domain = ci.abc.applicationDomain;
    var isNativeClass = ci.native;
    var cls: ASClass;
    if (isNativeClass) {
      cls = builtinNativeClasses[ci.native.cls];
      if (!cls) {
        cls = nativeClasses[ci.native.cls];
      }
      if (!cls) {
        Shumway.Debug.unexpected("No native class for " + ci.native.cls);
      }
      cls.morphIntoASClass(classInfo);
    } else {
      cls = new ASClass(classInfo);
    }

    var classScope = new Scope(scope, null);
    classScope.object = cls;
    var instanceConstructor = createFunction(ii.init, classScope, false);

    /**
     * Only collect natives for native classes.
     */

    var staticNatives: Object [] = null;
    var instanceNatives: Object [] = null;

    if (isNativeClass) {
      staticNatives = [cls];
      if (cls.staticNatives) {
        Shumway.ArrayUtilities.pushMany(staticNatives, cls.staticNatives);
      }
      instanceNatives = [cls.prototype];
      if (cls.instanceNatives) {
        Shumway.ArrayUtilities.pushMany(instanceNatives, cls.instanceNatives);
      }
    }

    ASClass.create(cls, baseClass, instanceConstructor);
    cls.verify();

    cls.classBindings = new ClassBindings(classInfo, classScope, staticNatives);
    cls.classBindings.applyTo(domain, cls);

    cls.instanceBindings = new InstanceBindings(baseClass ? baseClass.instanceBindings : null, ii, classScope, instanceNatives);
    if (cls.instanceConstructor) {
      cls.instanceBindings.applyTo(domain, cls.traitsPrototype);
    }

    if (cls === ASClass) {
      cls.instanceBindings.applyTo(domain, ASObject, true);
    } else if (ASClass.instanceBindings) {
      ASClass.instanceBindings.applyTo(domain, cls, true);
    }

    return cls;
  }

  /**
   * Searches for a native property in a list of native holders.
   */
  export function getMethodOrAccessorNative(trait: Trait, natives: Object []): any {
    var name = escapeNativeName(Multiname.getName(trait.name));
    for (var i = 0; i < natives.length; i++) {
      var native = natives[i];
      if (hasOwnProperty(native, name)) {
        var value;
        if (trait.isAccessor()) {
          var pd = getOwnPropertyDescriptor(native, name);
          if (trait.isGetter()) {
            value = pd.get;
          } else {
            value = pd.set;
          }
        } else {
          assert (trait.isMethod());
          value = native[name];
        }
        assert (value, "Method or Accessor property exists but it's undefined.");
        return value;
      }
    }
    log("Cannot find " + trait + " in " + natives);
    return null;
  }

  /**
   * This is to avoid conflicts with JS properties.
   */
  export function escapeNativeName(name: string) {
    switch (name) {
      case "prototype":
        return "asPrototype";
      default:
        return name;
    }
  }
}