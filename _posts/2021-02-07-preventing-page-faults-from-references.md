---
layout: post
title: "Preventing page faults from references"
category: twincat
toc: true
---

Recently I was coding up a new function block and passed another function block by reference to it. Somewhere I forgot to check if the reference was valid before using it and 💥 Page Fault! After some thinking I came up with a few solutions how this can be prevented and even how you could catch mistakes like this at compile time instead of during run time. Let me show you what I did.

- [Code](https://github.com/Roald87/TwincatTutorials/tree/main/PreventingPageFaults)

## What is a reference?

Before diving into the subject it is good to briefly explain what a reference is and why you would want to use it. A [reference](https://infosys.beckhoff.com/english.php?content=../content/1033/tc3_plc_intro/2529458827.html&id=) is a link to an object, where an object can either be a data type (e.g. `LREAL`), a function block (e.g. `R_TRIG`) or a user defined data type (e.g. a `STRUCT`). A reference just passes on a link to the original object, instead of making a copy of it. References are very much like [pointers](https://infosys.beckhoff.com/english.php?content=../content/1033/tcplccontrol/html/tcplcctrl_pointer.htm&id=) in that sense, but references are easier to use.

The advantages of pointers and references are that this is more memory efficient, since no copy of the object has to be created each time it is used somewhere. Furthermore changes are directly made to the original object, so there is no need to return anything.

That all sounds very good, but as you might have guessed from the introduction is that it is not all fun and games. There are some drawbacks as well. In this article I will treat one of them: how to make sure you referenced something before it is used.

## Page fault code

First let's set up the problem. We have an simple function block `Foo`, which increments a counter each time it is called.

```
FUNCTION_BLOCK Foo
VAR
    Counter : UINT := 0;
END_VAR

Counter := Counter + 1;
```

And another function block, `UsesFoo1`, to which `Foo` gets passed by reference. The implementation part of `UsesFoo1` calls `foo()`.

```
FUNCTION_BLOCK UsesFoo1
VAR_INPUT
    foo : REFERENCE TO Foo;
END_VAR

foo();
```

Finally we make a program `Runner1` which calls `UsesFoo1`.

```
PROGRAM Runner1
VAR
    usesFoo : UsesFoo1;
END_VAR

usesFoo();
```

If we run this code, we'll get a Page fault.

{% picture 2021-02-07-preventing-page-faults-from-references/page_fault.png %}

And if we log into the PLC, we see that, surprise surprise, it all went tits up when it tried to call `foo()`:

{% picture 2021-02-07-preventing-page-faults-from-references/page_fault_location.png %}

## Option 1: Using `__ISVALIDREF`

In order to prevent the Page Fault, we can use [`__ISVALIDREF`](https://infosys.beckhoff.com/english.php?content=../content/1033/tc3_plc_intro/2529165707.html&id=) to check if the reference is valid before calling it. So the body of `UsesFoo1` will change into:

```
IF __ISVALIDREF(foo) THEN
    foo();
END_IF	
```

If we now run the new code, we will see that it no longer crashes. However, when we login we see that the `foo.Counter` doesn't increment. It just shows that there is no valid pointer. This makes sense of course, because `foo` is not assigned.

{% picture 2021-02-07-preventing-page-faults-from-references/is_valid_ref.png %}

### Concluding

This solution prevents the PLC from crashing, but the code still doesn't do what we want. In order for this solution to work requires you to remember that you need to first check the reference _each time_ before calling it. Furthermore it is now possible the reference is not valid and thus `foo()` is not called at all, as we saw above. It might take you a minute (or hour 😛) to figure out why `foo()` is not doing anything.

## Option 2: Using `VAR_IN_OUT`

A better solution would be to use [`VAR_IN_OUT`](https://infosys.beckhoff.com/english.php?content=../content/1033/tc3_plc_intro/2528771211.html&id=). By using `VAR_IN_OUT`, we're also passing the variable by reference to the function block. So any changes you make to `foo` inside `UsesFoo2` will affect the state of the original `foo` instance. 

```
FUNCTION_BLOCK UsesFoo2
VAR_IN_OUT
    foo : Foo;
END_VAR

foo();
```

Now when we build the code with `foo` unassigned, the compiler will start to complain.

{% picture 2021-02-07-preventing-page-faults-from-references/var_int_out_error.png %}

In order for the program to compile, we have to initialize an instance of `Foo` in our `Runner2` program and pass the `foo` instance to `usesFoo`:

```
PROGRAM Runner2
VAR
    foo : Foo;
    usesFoo : UsesFoo2;
END_VAR

usesFoo(foo:=foo);
```

When we activate the successfully compiling code and login, we see that the `foo.Counter` is now increasing with every call. 

![](/assets/2021-02-07-preventing-page-faults-from-references/var_in_out_counter.gif)

### Concluding

This is a much better solution than using `__ISVALIDREF` everywhere. The `VAR_IN_OUT` solution is a form of [defensive programming](https://en.wikipedia.org/wiki/Defensive_programming) the code is designed in such a way that making a mistake is impossible, or at least very difficult. Some minor drawbacks of this solution are that bit variables can't be transferred directly to a `VAR_IN_OUT` variable (see [InfoSys](https://infosys.beckhoff.com/english.php?content=../content/1033/tc3_plc_intro/2528771211.html&id=) for a workaround) and the fact that each time `usesFoo` is called it needs `foo` passed to to it. The latter might get annoying if `usesFoo` is called multiple times.

## Option 3: Using `FB_init`

A third option would be to use [`FB_init`](https://infosys.beckhoff.com/english.php?content=../content/1033/tc3_plc_intro/5094414603.html&id=). `FB_init` is a function block initializer which gets implicitly called when the code is started. Implicit means that this method gets called automatically when the code is executed. So there is no need to call it explicitly by saying `usesFoo.FB_init()`. For more information there is also an [article](https://stefanhenneken.net/2019/07/26/iec-61131-3-parameter-transfer-via-fb_init/) by Stefan Henneken on `FB_init` usage. 

Let me show you how to use `FB_init` with our current example. First we add a new function block called `UsesFoo3`. To this function block we add an internal variable `_foo` which is a reference to `Foo`. Finally `_foo` gets called in the implementation part.

```
FUNCTION_BLOCK UsesFoo3
VAR
    _foo : REFERENCE TO Foo;
END_VAR

_foo();
```

At this point the code will also generate a Page Fault when we run it, since `_foo` doesn't reference to anything yet. In order to assign something to `_foo` , we add a `FB_init` method to our function block. To do so, first add a new method.

{% picture 2021-02-07-preventing-page-faults-from-references/add_method.png %}

Then from the drop-down menu select `FB_init`. The other methods in the list are outside the scope of this article, but you can always have a look at InfoSys for more info on [`FB_reinit`](https://infosys.beckhoff.com/english.php?content=../content/1033/tc3_plc_intro/5094414603.html&id=) and [`FB_exit`](https://infosys.beckhoff.com/english.php?content=../content/1033/tc3_plc_intro/5094414603.html&id=).

{% picture 2021-02-07-preventing-page-faults-from-references/add_fb_init.png %}

The `FB_init` already comes with some standard code. This code affects the behavior of `FB_init` depending on the operating case: warm or cold starts and an online change. There is no need to explicitly assign these variables; they are implicitly assigned depending on the operating case, as explained [here](https://infosys.beckhoff.com/english.php?content=../content/1033/tc3_plc_intro/6415331211.html&id=).

To the  `VAR_INPUT` of `FB_init` add a new variable: `foo`. This will temporarily hold a reference to the `Foo` function block. In the implementation part you assign the `foo` reference to the `_foo` internal variable of the function block.

```
METHOD FB_init : BOOL
VAR_INPUT
	bInitRetains : BOOL; // if TRUE, the retain variables are initialized (warm start / cold start)
	bInCopyCode : BOOL;  // if TRUE, the instance afterwards gets moved into the copy code (online change)
    foo : REFERENCE TO Foo;
END_VAR

_foo REF= foo;
```

To execute the code we add another program and create two instances: `foo` and `usesFoo`. The function block initializer of `UsesFoo3` gets passed the `foo` instance.  Finally we call `usesFoo()` in our implementation part. 

```
PROGRAM Runner3
VAR
    foo : Foo;
    usesFoo : UsesFoo3(foo);
END_VAR

usesFoo();
```

Now when we activate the code and log in, we'll see that the counter is increasing.

{% picture 2021-02-07-preventing-page-faults-from-references/fb_init_online.png %}

The advantage of the `FB_init` solution is that in case you forget to pass `foo` to `UsesFoo3`, the compiler will raise an error, so any mistakes are caught early on.

{% picture 2021-02-07-preventing-page-faults-from-references/fb_init_error.png %}

### Concluding

Although there are some drawbacks to the `FB_init` method, such as the fact that finding errors in it can be more difficult and the fact that you can still get a Page Fault if you forget to assign the `FB_init` input to a local function block variable as we saw above. I still think it provides some advantage, because you only need to pass a variable once to a function block and not each time you call the function block as with the `VAR_IN_OUT` solution.

Discuss: [Reddit/Plc](https://www.reddit.com/r/PLC/comments/leqbnz/twincat_preventing_page_faults_from_references/), [Reddit/TwinCAT](https://www.reddit.com/r/TwinCat/comments/leqby8/preventing_page_faults_from_references/).

