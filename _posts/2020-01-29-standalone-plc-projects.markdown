---
layout: post
title:  "Stand-alone PLC projects"
date:   2020-01-29
category: twincat
---

In this article I want to highlight a useful and relatively new TwinCAT feature: Stand-alone PLC projects. As usual, Beckhoff’s InfoSys provides a good explanation on how to set-up and run such a project from scratch. However, there is relatively little information on why the separation might be a good idea, how to separate an existing project and some of the pitfalls you might encounter.

*This article was first [published](https://alltwincat.com/2020/01/29/standalone-plc-projects/) on the AllTwinCAT blog.*

A stand-alone PLC project “[makes it possible to separate system, motion and I/O configuration from PLC development at project level](https://infosys.beckhoff.com/content/1033/tc3_plc_intro/4702071179.html?id=135948604315208321)”. In other words, the separation can prevent the configuration of one machine to influence the other. For example, one issue we were facing was that on our production machine we divided tasks over multiple cores, whereas in our development environments we would often run all tasks on a single core. It happened a few times that the development environment’s configuration was (partially) uploaded on the production machine, where it caused a bunch of issues as you can imagine.

The problems of the example above were probably caused by a wrongful merge of the combined project. Because the .tsproj file of the combined project contains so much information, which also changes when you for example change your target system, it is very difficult not to make a mistake once in a while when merging the .tsproj files from different systems.

That’s why it is a good idea to separate the projects. Creating a separate PLC project from scratch is relatively straight forward, but only possible from version 4022.0. First you create a [stand-alone PLC project](https://infosys.beckhoff.com/content/1033/tc3_plc_intro/4278074763.html). Then you create a separate TwinCAT project, where you [import the TMC file](https://infosys.beckhoff.com/content/1033/tc3_plc_intro/9007203968704139.html) from the stand-alone project. After that you can [assign the tasks](https://infosys.beckhoff.com/content/1033/tc3_plc_intro/4713966219.html?id=2085931447876199423) you created in the stand-alone PLC project to the system tasks in the TwinCAT project. Finally you [activate your configuration](https://infosys.beckhoff.com/content/1033/tc3_plc_intro/4702258059.html?id=4785525580931834985) in the TwinCAT project and then you can log into the PLC from the stand-alone project.

It is also possible to separate an existing TwinCAT 3 project which includes the PLC project. In order to do that you first create a stand-alone project, much like above. You go to File > New Project > TwinCAT PLC Project and select an appropriate name for your project and save location and click OK.

![](/assets/2020-01-29-standalone-plc-projects/Create_new_project.PNG)

Then select “Empty PLC project” in the following screen. The name doesn’t really matter, because this project will be replaced by an existing one in the next step. Click OK.

![](/assets/2020-01-29-standalone-plc-projects/empty_plc_project.png)

Then right click on the PLC project and select “Change Project...”. Select the .plcproj file of the PLC project which you want to import.

![](/assets/2020-01-29-standalone-plc-projects/change_project.PNG)

Then select the appropriate option what to do with the PLC project files. After clicking on OK, all the files of the selected PLC project should show up in your stand-alone project.

![](/assets/2020-01-29-standalone-plc-projects/move_plc_files.PNG)

There is one thing which is not copied and those are custom events. Custom events in a combined project are stored in the .tsproj file and can be found under SYSTEM > Type System > tab Event Classes. I’m not sure what the appropriate way is to get them in the new stand-alone project, but it can be done by copying the events from the combined project’s .tsproj file into the .tsproj file of the stand-alone PLC project.

At this point I wanted to go into some problems you might encounter with the creation of a stand-alone project. However, I couldn’t recreate issues I was having with a previously combined project which was later on split up into a stand-alone PLC and a TwinCAT 3 project. For those who are also experiencing issues I’ll briefly go into them here. 
The issues we were facing had to do with custom events. Somehow whenever we added a custom event to our stand-alone PLC project, they were not added to the .tsproj file, but only in the .tmc file (after building of course). So whereas normally .tmc files can be [added to the .gitingore file](https://alltwincat.com/2019/12/02/gitignore-for-twincat/), this was not the case for this project.

Related to this issue is that whenever this buggy stand-alone PLC solution file was opened, the custom event classes were not loaded automatically. Only after manually reloading the project file, the event classes would show up. 

Perhaps these issues were caused by the fact that the original combined project was created with an older TwinCAT version? Anyway, maybe you’ve experienced similar issues, or have some experience with setting up stand-alone projects.

Discuss [AllTwinCAT](https://alltwincat.com/2020/01/29/standalone-plc-projects#comments) 