---
layout: post
title: "Why am I getting a page fault in TwinCAT?"
category: twincat
toc: true
---

[Earlier](https://cookncode.com/twincat/2021/02/07/preventing-page-faults-from-references.html) I talked about how you can prevent page faults from references. In this post I show some other possible causes of page faults and how to prevent them.

## Page faults in TwinCAT
You probably came across the following error message when you activated you configuration. The error says there is a Page Fault. This message was always quite puzzling to me when I started to program PLCs. 

{% picture 2021-02-07-preventing-page-faults-from-references/page_fault.png %}

![[_site/assets/2021-02-07-preventing-page-faults-from-references/page_fault.png]]

The reason of the page fault is usually quickly found, once you log into your project and you see the point of failure highlighted in yellow.

{% picture 2022-page-fault/pointer.png %}

![[pointer.png]]

## What are page faults?
Different [types of page faults are identified on Wikipedia](https://en.wikipedia.org/wiki/Page_fault). But I think the ones you get in TwinCAT are of the invalid type. These types of page fault are caused by a reference to an invalid memory address. Let me show you with examples what that means.

## Possible causes
I can trigger page faults with three different examples. Note: I ran the examples with TwinCAT 4024.25.

### Pointers
[Pointers](https://infosys.beckhoff.com/content/1033/tc3_plc_intro/2529453451.html?id=5839194631499501145) store the address of a variable. When a pointer to a variable is instantiated, the default address is 0. Therefore, in the example below `pointerToNumber` is 0. Then in the implementation part, I try to save the value to which the pointer points into `number`. This is done by dereferencing the pointer using the `^` symbol.

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
 
 ![[pointer.png]]

### References
Another way you can get page faults is through references, as I also showed in an [earlier article](https://cookncode.com/twincat/2021/02/07/preventing-page-faults-from-references.html). [References](https://infosys.beckhoff.com/content/1033/tc3_plc_intro/2529458827.html?id=2716630061017907414) are pointers with an improved interface. Thus it shouldn't come as a surprise that these can cause page faults as well.  

The very simple example below will cause a page fault. I instantiate a reference to an integer called `number`. Then I try to assign a number to this reference. 

```
PROGRAM ReferenceExample
VAR
    refNumber : REFERENCE TO INT;
END_VAR

refNumber := 1;
```

When you then try to assign a number to this reference, you get a page fault, because `refNumber` doesn't actually refer to anything.

{% picture 2022-page-fault/reference_page_fault.png %}

![[assets/2022-page-fault/reference_page_fault.png]]

### Interfaces
[Interfaces](https://infosys.beckhoff.com/content/1033/tc3_plc_intro/4256428299.html?id=507172925224818176) can also cause page faults as shown by this example. I defined an interface `I_Interface` with a single property called `SomeProperty` which should return an integer.

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

Executing the code again results in a page fault. Normally before you use the interface, you assign a function block to it. Then `someInterface` contains the address to this function block 

This time no function block was assigned to the interface, thus the interface is 0. Again this is not a valid address, so you get a page fault. 

{% picture 2022-page-fault/interface_page_fault.png %}

![[interface_page_fault.png]]

## Possible solutions

### Pointers
The solution how to prevent this is quite simple. Just check if the address is 0 before you try to dereference the pointer. The complete example becomes:

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

Although this will solve your issue, there is a good chance that you forget to implement the check at least once. But, there is a way to automatically check for valid pointers: the POU [`CheckPointer`](https://infosys.beckhoff.com/content/1033/tc3_plc_intro/2530405259.html?id=7869750361486034578). 

After adding `CheckPointer` to your project, this function is automatically called _each time_ before you use a pointer. The advantage is that you can trigger an error message which makes diagnostics easier. A disadvantage is that you add an extra function call to each time you use a pointer. If you use a lot of pointers, the extra overhead might cause cycle overruns. Also it can't prevent the pointer from being called, so you will get the page fault regardless.

To add the `CheckPointer` to your project, right click on your PLC project and select **Add > POU for implicit checks**. 

{% picture 2022-page-fault/implicit_checks.png %}

![[assets/2022-page-fault/implicit_checks.png]]
 
 Select **Pointer Check** and confirm with **Open**.
 
 {% picture 2022-page-fault/add_checkpointer.png %}
 
 ![[assets/2022-page-fault/add_checkpointer.png]]
 
 This adds the `CheckPointer` function to your project and it already has a suggested implementation. If I the run the failing example code, an error message will be printed in the error console before it crashes.
 
 {% picture 2022-page-fault/pointer_check_error_message.png %}
 
 ![[assets/2022-page-fault/pointer_check_error_message.png]]

### References
In the [earlier article](https://cookncode.com/twincat/2021/02/07/preventing-page-faults-from-references.html) I showed several ways you can prevent page faults. 

### Interfaces