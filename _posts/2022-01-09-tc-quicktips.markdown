---
layout: post
title: "Quick tips for TwinCAT"
category: twincat
---

Over the years I've come across some features of TwinCAT or programming in general which can improve your code or your coding experience. Read on to level up your TwinCAT game in 2022!

- Don't repeat yourself, often abbreviated as [DRY](https://en.wikipedia.org/wiki/Don%27t_repeat_yourself), is a saying in software development to denote unnecessary repeating code. One tell-tale sign if you write non-DRY code, is that you copy and paste a lot of code.
- You can activate multi line editing by pressing the <kbd>Alt</kbd> key and dragging your mouse across several lines. If you use this function a lot, then it is a sign that your code is probably not [DRY](https://en.wikipedia.org/wiki/Don%27t_repeat_yourself). So it is time to think about how to refactor your code.
    ![multi line editing with Alt key](/assets/2022-01-09-tc-quicktips/multiline_editing.gif)
- A `_` can be used as a thousand separator. For example: `number : INT := 1_000_000;`. Or you can use scientific notation if most decimals are zeros: `number : INT := 1E6;`. 
- (TwinCAT 4024+) Use <kbd>Ctrl</kbd> + <kbd>K</kbd>, <kbd>Ctrl</kbd> + <kbd>C</kbd> to comment one or more lines and <kbd>Ctrl</kbd> + <kbd>K</kbd>, <kbd>Ctrl</kbd> + <kbd>U</kbd> to uncomment them again. 
    ![comment one or more lines](/assets/2022-01-09-tc-quicktips/commenting.gif)
- In a `CASE` statement you can use multiple cases `1, 3, 61` or a whole range `1..10` for a single case. For example:

```
	// Instead of this
	CASE aCase OF
	    1: Method1();
	    2: AnotherMethod();
	    3: AnotherMethod();
	    4: AnotherMethod();  
	    6: Method1();  
	END_CASE

	// You can do this
	CASE aCase OF
	    1, 6: Method1();
	    2..4: AnotherMethod(); 
	END_CASE
```
- Using numbers to denote a case is usually not the best way to denote a case. You can make cases self documenting by creating an [ENUM](https://infosys.beckhoff.com/english.php?content=../content/1033/tcplccontrol/html/tcplcctrl_enum.htm&id=) for each case. 
- There are implicit enums or local enums in TwinCAT. They can be used if you only need an enum in a single function block. You can define them as follows: `colors : (Red, Blue, Green);`. See for more info [this AllTwinCAT post](https://alltwincat.com/2021/11/16/local-enumerations/).  
- If you have a method or a function which returns a boolean, try to avoid the usage of an `IF` statement. Since you're returning a boolean, you can often do this in a single line:

```
	// Do not do this
	METHOD LargerThenTwelve : BOOL
	VAR_INPUT
		number : INT;
	END_VAR

	IF number > 12 THEN
		LargerThenTwelve := TRUE;
	ELSE
		LargerThenTwelve := FALSE;
	END_IF

	// Do this
	METHOD LargerThenTwelve : BOOL
	VAR_INPUT
		number : INT;
	END_VAR

	LargerThenTwelve := number > 12;
```
- Use [`{attribute 'call_after_init'}`](https://infosys.beckhoff.com/english.php?content=../content/1033/tc3_plc_intro/2529600907.html&id=) to call a method once _after_ a function block was initialized. You can use this, instead of a `bInitialized` flag in your code, which inevitability you forget to set to `TRUE` at least once 😉.
- Prevent the usage of [`POINTER`](https://infosys.beckhoff.com/content/1033/tc3_plc_intro/2529453451.html?id=5839194631499501145)s. They can lead to some pretty unpredictable behavior, since you're accessing a piece of memory directly. A better alternative is to use [`REFERENCE`](https://infosys.beckhoff.com/content/1033/tc3_plc_intro/2529458827.html?id=2716630061017907414), because it has a cleaner syntax and type safety. Although also references need to be checked for validity as [I wrote about earlier](https://cookncode.com/twincat/2021/02/07/preventing-page-faults-from-references.html). For the health and safety of you and your code, I would recommend to only use them if you're memory constrained for example.
- Try to prevent method calls from multiple tasks, since it makes debugging difficult. If really have to do it, use [this](https://infosys.beckhoff.com/content/1033/tc3_plc_intro/45844579955484184843.html?id=2972649925198044529). 