---
layout: post
title: "Source control tips for TwinCAT"
category: twincat
---

Source control is essential when you're developing software. However, there is little information online on how to do it properly for TwinCAT projects. In this post I'll share some tips and tricks I picked up along the way. The main focus will be git, but many points apply to other source control systems as well.

*Last updated 12 August 2021*

## What is source control?

If you're not yet familiar with source control then it is something which you should absolutely learn as a software developer. [Source control](https://en.wikipedia.org/wiki/Version_control) (or version control) allows you to incrementally save your code in a kind of database. All your changes are saved and it is very easy to go back to a previous state of your code. This reverting can be very convenient if you discover that a single feature you implemented, is not quite panning out as you planned. In this case it is usually very easy to either reset your code to the state before the change, or even just undo the single feature. Finally it can also be used to [prevent versioning in filenames](https://phdcomics.com/comics/archive.php?comicid=1531).

![PhD comics "final.doc"](https://phdcomics.com/comics/archive/phd101212s.gif)

## Git

The most popular versioning control system is called [git](https://git-scm.com/). Git is a free and open source distributed version control system. Distributed means that every developer has a copy of the full history of the code on their own machine. Each developer can make changes locally first and save each incremental step. Once they are done, they can merge their changes into the main code base. This process contrasts to [centralized source control](https://faun.pub/centralized-vs-distributed-version-control-systems-a135091299f0), where you will always need an active connection to add your changes to the history.

It is however not necessary to have your code history on some central server or on several developer's computers. You can also use git locally to version control any document on your computer.

Although git, and the ideas behind it are very powerful, it is also notoriously difficult to master. So much so, that there are multiple billion dollar companies like GitLab and GitHub, which provide a more user friendly interface to git. [Relevant XKCD](https://xkcd.com/1597/):

![XKCD on gits complexity](https://imgs.xkcd.com/comics/git.png)

There are also other tools which make working with git easier on your local system. If you're just getting started with git, I recommend installing some git GUI like SourceTree, GitKraken or [ungit](https://github.com/FredrikNoren/ungit). You'll learn to use the git command line with time. But even after gaining experience, I still like to use one of the GUI's for most git commands.

## 0. Choosing the right implementation language

The first step for easy TwinCAT source control already starts with the selection of the implementation language. There are various implementation languages for PLC code such as: ladder logic, function block diagrams and structed text. Some of these implementation languages work better with source control systems than others. I mainly have experience with function block diagrams and structed text and I've noticed a big difference between how well they work under source control.

Let me start with a disclaimer. I'm a bit biased on the structed text front. I think structed text is the future of plc programming, because it is much more versatile than the others. For example making a for loop, or an if else statement, in function block diagrams is impossible or a lot more verbose than in structed text.

With that out of the way, I'll now go into why structed text works much better than function block diagrams for source control. When you're using anything other than structed text, the raw text files are basically unreadable. Furthermore minor changes in function block diagrams, like swapping the order of two function blocks, can lead to a code difference of dozens or hundreds of lines. 

That is why you need a special tool, in TwinCAT's case the [TcCompare tool](https://infosys.beckhoff.com/english.php?content=../content/1033/tc3_sourcecontrol/1242471435.html&id=), to merge changes or view differences between versions. This severely limits your options. For example if you just have access to the git command line, the GitLab web interface or your source control GUI, then making sense of the changes between versions is practically impossible. Only structed text works with any system.

## 1. .gitignore

The `.gitignore` file is very important file when you're using git. Git uses this file to determine of which files  or folders the changes can be ignored. Files and folders which can be ignored usually fall into two categories. In the first category are files which can be created from the other files. For example the `.tmc` file is compiled from your plc code. Or if you have some documentation in a mark down file from which you generate a html page. In these cases you only want to have the plc code or the mark down file under source control. A second category are user specific files. For example the `.sou` file from Visual Studio, which is a user's options file for the Visual Studio project. 

Beckhoff already [provides a list](https://infosys.beckhoff.com/content/1033/tc3_sourcecontrol/406303499.html?id=4324324478820586350) which explains where most file extensions are used for. They also list whether files should be under source control or not. Jakob Sagatowski added some more files to this list and [made a general TwinCAT3 .gitignore file](https://github.com/github/gitignore/blob/master/TwinCAT3.gitignore). This file gives you a good starting point with any git source controlled TwinCAT project.

## 2. Creating independent files

Once you determined which files should be source controlled, it is important to make sure those files only change when needed. Basically you want to make sure TwinCAT saves closely related settings and code in separate files. Several separate files which can be created are:

1. NC axes or IO devices can be saved in a separate file as explained on [this page on InfoSys](https://infosys.beckhoff.com/content/1033/tc3_sourcecontrol/767894795.html?id=9000520481371853523). 

2. [On the same page](https://infosys.beckhoff.com/content/1033/tc3_sourcecontrol/767894795.html?id=9000520481371853523) it mentions that you can save the plc project as a separate file. Alternatively a stand-alone plc project can be created [as I wrote about earlier](https://roald87.github.io/twincat/2020/01/29/standalone-plc-projects.html).

3. Events from the [TwinCAT EventLogger](https://roald87.github.io/twincat/2020/11/03/twincat-eventlogger-plc-part.html) are normally stored in the `.tsproj` file. But they can also be stored in an independent file. If you created a new project, you can immediately save them in a separate file. In case you want to transfer existing events to a tmc file, the steps are nearly the same. For both you first right click on **Type System** and select **Add New Item...**. Choose a name and location to save your new event class. 

   ![image-20210605125836430](/assets/2021-07-06-tc-source-control/create_tmc_event.png)

   Then if you want to save _existing events_ into the new file, simply select the event classes you want to save in this new file.

   ![existing-events](/assets/2021-07-06-tc-source-control/existing_events.png)

   If you want to save _new events_ into the file, right click on the empty area and select **New**. 

   ![new-events](/assets/2021-07-06-tc-source-control/new_events.png)

   Then simply add events to this newly created event class.

   ![new-event-class](/assets/2021-07-06-tc-source-control/new_event_class.png)

   When you select type system the newly added event classes will also show up among all other available event classes.

   ![all-event-classes](/assets/2021-07-06-tc-source-control/all_event_classes.png)

   Once the events are in separate tmc files, make sure:

   -  You add the event tmc to source control. Most `.gitignore` files exclude all tmc files, for example the [GitHub TwinCAT3](https://github.com/github/gitignore/blob/master/TwinCAT3.gitignore) `.gitignore`.

   - Uncheck "Persistent (even if unused)"

     ![image-20210806223400979](/assets/2021-07-06-tc-source-control/uncheck-persistent.png)

     Otherwise the events will be [added to the project file again](https://stackoverflow.com/q/68677733/6329629):

     ![remove-persistent](/assets/2021-07-06-tc-source-control/remove_persistent.png)

   - If you're using 4022.x the event tmc files are [not formatted properly](https://stackoverflow.com/q/68678539/6329629). All the events will be on a single line. Proper formatting was introduced in 4024. If you're stuck with 4022.x, you have to format the tmc files yourself. For example with the Sublime plugin [Indent XML](https://github.com/alek-sys/sublimetext_indentxml).

4. Per default so called LineIDs are saved in the `.TcPOU` files. The [LineIDs are used for](https://infosys.beckhoff.com/content/1033/tc3_userinterface/4692665483.html?id=1009989685087473824) 

   > breakpoint handling, for example, and ensure that the code lines can be assigned to machine code instructions

   There are no adverse effect from saving them in a separate file, so I'm not sure why this is not the default. Especially since these LineIDs often change, even if no code changes were made. Once this option is enabled (under **Tools > Options >TwinCAT > PLC Environment > Write options**) the LineIDs are saved in the `LineIDs.dbg` file. So if you enable this option, make sure this file is then added to the `.gitignore` file, or else all will be for nothing.

   If you have an existing project where LineIDs were saved in the `.TcPOU` file, you can easily remove them with the bash command: `find . -type f -wholename "*.TcPOU" -exec sed -i "/LineId/d" {} \;`. Run this command in the top folder of your project. It will then recursivly search trough all folders, match files with a `.TcPOU` extension and remove all lines containing `LineId`. This command should work, unless you used `LineId` somewhere in your code.

## 3. Formatting rules

With the above measures implemented source control of your TwinCAT3 project has already improved significantly. There are some additional measures we can take. One of them is making sure you format your code in such a way that is makes comparing code differences easier when viewed in plain text.

One example which can make a difference is a new white line at the end of a declaration or implementation part. Take the following very short example:

```
Counter := Counter + 1;
a := Counter * 2;
```

When we look into the `.TcPOU` file itself this part looks as follows:

```
<Implementation>
	<ST><![CDATA[Counter := Counter + 1;
	a := Counter * 2;]]></ST>
</Implementation>
```

If we now make a very minor change to the code. For example add `b := a/4;` on the last line. The plain text difference of this change then looks as follows:

```diff
<Implementation>
	<ST><![CDATA[Counter := Counter + 1;
-	a := Counter * 2;]]></ST>
+	a := Counter * 2;
+	b := a/4;]]></ST>
</Implementation>
```

If instead, this change was done on a file with a new line at the end, then the diff would look like

```diff
<Implementation>
	<ST><![CDATA[Counter := Counter + 1;
    a := Counter * 2;
+   b := a/4;
	]]></ST>
</Implementation>
```

By adding just a single white line we went from a difference of -1/+2 to -0/+1! There are a few more of these tricks. Have a [look at the style guide](https://github.com/Roald87/TcBlack/blob/master/docs/style.md)  of the structured text formatter (_TcBlack_) I'm building for more ideas. Unfortunately _TcBlack_ is quite limited in functionality currently. There is however a fully functional paid alternative called [STweep](https://www.stweep.com/). You could use this, with the options outlined in the _TcBlack_ style guide, to achieve minimal differences.

## 4. git filters

Git filters can be used to create a sort of [`.gitignore` for specific lines of code](https://stackoverflow.com/a/22171275/6329629). Whenever you checkout or commit a piece of code it can go through the git filter. If the file matches a filter setting, you can run a script to change some code before it is actually committed or checked out. 

Let me show you how it could be used. Suppose you are working on a project with a few people. Everyone has their own development PLC with a different target net ID. When you select your development PLC's net ID, this change will be saved in the `.tsproj` file:

```xml
<Project 
	ProjectGUID="{DEF6D51E-ADA4-4CFE-B6F1-CB3CC59478BE}" 		
	TargetNetId="1.23.456.78.1.1" 
	ShowHideConfigurations="#x106"
>
```

Since your colleagues NetId's will be different, you want to prevent this change from being included into the code's version history. [As also explained in this StackOverflow post](https://stackoverflow.com/a/22171275/6329629) you can achieve this with the following steps: 

1. In the `.git/config` file inside the project you add the following:

    ```bash
    [filter "ignoreNetId"]
        clean = sh ".git/ignoreTargetNetId.sh"
    ```

    Here you define a filter called `ignoreNetId` which defines a `clean` step. The `clean` gets triggered when you add a file to a commit (`git add`). When the `clean` gets triggered it will call a bash script `ignoreTargetNetId.sh`, which we will define below.

1. Add the following line to the `.gitattributes` file:

    ```bash
    *.tsproj filter=ignoreNetId
    ```
    
    This command means that if a file with extension `.tsproj` is committed or checked-out, git will call the `ignoreNetId` filter we defined previously. 
    
2. Finally you make a new file called `ignoreNetId.sh` in the `.git` folder and add the following content to this file:

    ```bash
    sed --regexp-extended "s/}\" TargetNetId=\"[0-9.]+\"/}\" /g" "$@"
    ```

    The [`sed`](https://www.gnu.org/software/sed/manual/sed.html) command is a text replacement command line tool. The `--regexp-extended` option means we can use most regular expressions to find the TargetNetId. The regular expression which does the search and replace is `"s/}\" TargetNetId=\"[0-9.]+\"/}\" /g"`.  The search part (`"s/}\" TargetNetId=\"[0-9.]+\"/`) searches for a target net id with an arbitrary net id. Once this pattern is matched it will replace is with `}\" `, thus effectively removing the whole net id part. With the net id removed, the project then selects the `<Local>` TwinCAT run time when opened. The last part `"$@"` is where the file name argument will be filled in, once this script is called from the first step.

Summarizing; the above steps ensure that whenever you select your development plc, this change will never show up as a change in git. You can also do the the reverse: that on a checkout it automatically adds your developments plc net id into the target net id. Then you do not have to select it each time you check out the code. See [this StackoverFlow post](https://stackoverflow.com/a/22171275/6329629) for more info.

I've also used the filters to remove random changes to the HMI port in the `.hmiproj` file and an automatic add/removal of development specific [compiler definitions](https://infosys.beckhoff.com/content/1033/tc3_plc_intro/2533017227.html?id=8439395065138194985). 

I hope I shared some useful tips. What kind of tricks do you use?​

Discuss: [r/TwinCAT](https://www.reddit.com/r/TwinCat/comments/nu5b3c/source_control_tips_for_twincat/), [r/plc](https://www.reddit.com/r/PLC/comments/nu5ca0/source_control_tips_for_twincat/).
