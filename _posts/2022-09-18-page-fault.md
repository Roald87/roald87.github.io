---
layout: post
title: "Why am I getting a page fault in TwinCAT?"
category: twincat
toc: true
---

[Earlier](https://cookncode.com/twincat/2021/02/07/preventing-page-faults-from-references.html) I talked about how you can prevent page faults from references. In this post, I try to show a complete overview of page fault origins and how to prevent them.

- Example code: [GitHub](https://github.com/Roald87/TwincatTutorials/tree/main/PageFaults)/[Direct download](https://downgit.github.io/#/home?url=https://github.com/Roald87/TwincatTutorials/tree/main/PageFaults) with TwinCAT 4024.25

## Page faults in TwinCAT
You probably came across the following error message when you activated a configuration. The error says there is a *Page Fault*. This message was always quite puzzling to me when I started programming PLCs. 

{% picture 2021-02-07-preventing-page-faults-from-references/page_fault.png %}

The reason for the page fault is easy to see once you log into your project because it highlights the point of failure.

{% picture 2022-page-fault/pointer.png %}

## What are page faults?

[Wikipedia lists different types of page faults](https://en.wikipedia.org/wiki/Page_fault). I think the ones you get in TwinCAT are of the invalid type. This type of page fault is caused by a reference to an invalid memory address. Let me show through three different examples what that means.

## Pointers

[Pointers](https://infosys.beckhoff.com/content/1033/tc3_plc_intro/2529453451.html?id=5839194631499501145) store the address of a variable. When you instantiate a pointer to a variable, the default address is 0. Therefore, in the example below `pointerToNumber` is 0. Then in the implementation part, I try to save the value to which the pointer points into `number` by dereferencing the pointer using the `^` symbol.

```
PROGRAM PointerExample
VAR
    pointerToNumber : POINTER TO INT; // 0
    number : INT;
END_VAR

number := pointerToNumber^;
```

 When you activate this code you get a page fault. If you log in, you see that the pointer has address 0. Because this is not a valid memory address an exception is raised and your code halts here. 
 
 {% picture 2022-page-fault/pointer.png %}
 
### Solution
The solution to prevent this is quite simple: check if the address is 0 before you try to dereference the pointer. The complete example becomes:

```
PROGRAM PointerExample
VAR
    pointerToNumber : POINTER TO INT;
    number : INT;
END_VAR

IF pointerToNumber <> 0 THEN
    number := pointerToNumber^;
END_IF
```

Although this solves your issue, there is a good chance that you forget to implement the check at least once. But, you can automatically check for valid pointers with the POU [`CheckPointer`](https://infosys.beckhoff.com/content/1033/tc3_plc_intro/2530405259.html?id=7869750361486034578). 

The `CheckPointer` function is automatically called _each time_ before you use a pointer. The advantage is that you can trigger an error message which makes diagnostics easier. A disadvantage is that you add an extra function call when you use a pointer. If you use a lot of pointers, the extra overhead might cause cycle overruns. Also, it can't prevent the pointer call, so you get the page fault regardless.

To add the `CheckPointer` to your project, right click your PLC project and select **Add > POU for implicit checks**. 

{% picture 2022-page-fault/implicit_checks.png %}

 Select **Pointer Check** and confirm with **Open**.
 
 {% picture 2022-page-fault/add_checkpointer.png %}
 
 This adds the `CheckPointer` function to your project and it already has a suggested implementation. If I run the failing example code, an error message is printed in the error console before it crashes.
 
 {% picture 2022-page-fault/pointer_check_error_message.png %}
 
Another solution would be to pass the pointer via `VAR_IN_OUT` or use constructor injection via `FB_init` as I showed in the [earlier article](https://cookncode.com/twincat/2021/02/07/preventing-page-faults-from-references.html). 

## References

Another way you can get page faults is through references, as I also showed in an [earlier article](https://cookncode.com/twincat/2021/02/07/preventing-page-faults-from-references.html). [References](https://infosys.beckhoff.com/content/1033/tc3_plc_intro/2529458827.html?id=2716630061017907414) are pointers with an improved interface. Thus it shouldn't come as a surprise that these can cause page faults as well.  

The short example below causes a page fault: I instantiate a reference to an integer called `number`. Then I try to assign a number to this reference. 

```
PROGRAM ReferenceExample
VAR
    refNumber : REFERENCE TO INT;
END_VAR

refNumber := 1;
```

When you try to assign a number to this reference, you get a page fault, because `refNumber` doesn't refer to anything.

{% picture 2022-page-fault/reference_page_fault.png %}

### Solution

In the [earlier article](https://cookncode.com/twincat/2021/02/07/preventing-page-faults-from-references.html) I showed several ways you can prevent page faults from references. They were using:
- [`__ISVALIDREF`](https://infosys.beckhoff.com/english.php?content=../content/1033/tc3_plc_intro/2529165707.html&id=)
- Adding references to `VAR_IN_OUT`
- Or using constructor injection via `FB_init`

Here I only show the first solution with `__ISVALIDREF`. You use this function in a similar was as you would with the pointer check (`somePointer <> 0`): The full example becomes.

```
PROGRAM ReferenceExample
VAR
    refNumber : REFERENCE TO INT;
END_VAR

IF __ISVALIDREF(refNumber) THEN
    refNumber := 1;
END_IF
```

The advantage of this is that you prevent page faults. But the reference never gets assigned, thus you might wonder why your code doesn't do what you expect it to. In this case, it's probably a good idea to add an `ELSE` clause with an appropriate error message. Even better would be to pass the reference via `VAR_IN_OUT` or `FB_init` if possible.

## Interfaces

[Interfaces](https://infosys.beckhoff.com/content/1033/tc3_plc_intro/4256428299.html?id=507172925224818176) can also cause page faults as shown by this example. I defined an interface `I_Interface` with a single property called `SomeProperty` which returns an integer.

```
INTERFACE I_Interface

PROPERTY SomeProperty : INT

```

I create an instance `someInterface` of `I_Interface`.  Then I try to save the integer returned by this into the variable `number`.

```
PROGRAM InterfaceExample
VAR
    number : INT;
    someInterface : I_Interface;
END_VAR

number := someInterface.SomeProperty;
```

Executing the code again results in a page fault. That is because a function block needs to be assigned to the interface first. Then `someInterface` contains the address to this function block. Without an assigned function block, the interface is 0. Since this is not a valid address you get a page fault. 

{% picture 2022-page-fault/interface_page_fault.png %}

### Solutions

The solution to preventing page faults from invalid interfaces is the same as for pointers: before you use the interface, check if it's not 0.

```
PROGRAM InterfaceExample
VAR
    number : INT;
    someInterface : I_Interface;
END_VAR

IF someInterface <> 0 THEN
    number := someInterface.SomeProperty;
END_IF
```

Again this solution silently fail, thus it might be wise to add an `ELSE` clause with an error message. Or if you use the interface in a function or function block you can use the `VAR_IN_OUT` or `FB_init` solutions mentioned in the [earlier article](https://cookncode.com/twincat/2021/02/07/preventing-page-faults-from-references.html).

## Conclusions
I showed page faults can be caused by invalid pointers, references, and interfaces. For each case,  I showed some solutions how to prevent the page faults, mainly by checking if the pointer or interface is not 0 or by using `__iSVALIDREF` for references. 

Did I miss any cases which can cause page faults and what are your solutions to prevent PLC crashes from page faults? Let me know in the comments below.
