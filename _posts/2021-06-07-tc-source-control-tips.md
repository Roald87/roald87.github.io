---
layout: post
title: "Source control tips for TwinCAT"
category: twincat
toc: true
---

Source control is an essential tool when you're developing software. Yet, there is little information online on how to do it for TwinCAT projects. In this post, I share some tips and tricks I picked up along the way. The main focus is git, but many points apply to other source control systems as well.

*You might also like my [new post on pre-commits](https://cookncode.com/twincat/2022/04/14/pre-commit.html).*

## What is source control?

If you're not yet familiar with source control then it is something that you should absolutely learn as a software developer. [Source control](https://en.wikipedia.org/wiki/Version_control), also known as version control, allows you to save your code incrementally in a database. Since it saves all your changes, it is easy to return to a previous state of your code. So, if you discover that a  feature you implemented doesn't work out as you planned, it is easy to revert the changes. You no longer have to use the [filename for versioning](https://phdcomics.com/comics/archive.php?comicid=1531).

![PhD comics "final.doc"](https://phdcomics.com/comics/archive/phd101212s.gif)

## Git

The most popular versioning control system is [git](https://git-scm.com/). Git is a free and open source distributed version control system. Distributed means that every developer has a copy of the full history of the code on their machine. Each developer can make local changes first and save each incremental step. Once they are done, they can merge their changes into the main codebase. This process contrasts with [centralized source control](https://faun.pub/centralized-vs-distributed-version-control-systems-a135091299f0). Here you always need a connection to the central source control system to add your changes to the history.

You can even use git only for yourself. So you can do version control on any document on your computer.

Although git and the ideas behind it are very powerful, it is also very difficult to master. So much so, that there are billion-dollar companies like GitLab and GitHub, which provide a more user-friendly interface to git. [Relevant XKCD](https://xkcd.com/1597/):

![XKCD on gits complexity](https://imgs.xkcd.com/comics/git.png)

If you're getting started with git, I recommend installing a git GUI like SourceTree, GitKraken, or [ungit](https://github.com/FredrikNoren/ungit). You'll learn to use the git command line with time. Or you can play [this game](https://ohmygit.org/) which teaches you some git commands.

But even after gaining some experience, I still like to use one of the GUI's for most git commands.

## 0. Choosing the right implementation language

The first step for seamless TwinCAT source control starts with the selection of the implementation language. There are various implementation languages for PLC code. Think of ladder logic, function block diagrams, and structured text. Some of these implementation languages work better with source control systems than others. From my personal experience with function block diagrams and structured text, I've noticed a big difference in how well they work under source control.

Let me start with a disclaimer. I'm a bit biased on the structured text front. I think that structured text is the future of plc programming. It is so much more versatile than the others. Take for example a simple for loop or an if-else statement. These are impossible to implement with a function block diagram, or a lot more verbose than in structured text.

With that said, I'll now explain why structured text works much better than function block diagrams for source control. In the end, it all boils down to the readability of the raw text files. 

When you're using anything other than structured text, the raw text files are unreadable. Furthermore, minor changes in function block diagrams can lead to a code difference of dozens or hundreds of lines. For example, if you switch the order of two statements in a function block diagram.

That is why Beckhoff made the [TcCompare tool](https://infosys.beckhoff.com/english.php?content=../content/1033/tc3_sourcecontrol/1242471435.html&id=). It helps you to merge changes or view differences between versions. But, if you're working on a system that doesn't have the TcCompare tool, you have a problem. Then it is very difficult to make sense of the changes between versions. Only structured text works on any system.

## 1. .gitignore

The `.gitignore` file is very important when you're using git. Git uses this file to determine for which files or folders it can ignore the changes. Files and folders which git can ignore usually fall into two categories. In the first category are files that are created from the other files. For example, the `.tmc` file that is compiled from your plc code. Or if you have some documentation in a markdown file from which you generate an html page. In these cases, you only want to have the plc code or the markdown file under source control. A second category is user-specific files. For example, the `.sou` file from Visual Studio. This file contains the users' options for the Visual Studio project. 

Beckhoff already [provides a list](https://infosys.beckhoff.com/content/1033/tc3_sourcecontrol/406303499.html?id=4324324478820586350) which explains where most file extensions are used for. They also list whether files should be under source control or not. Jakob Sagatowski added some more files to this list and [made a general TwinCAT3 .gitignore file](https://github.com/github/gitignore/blob/master/TwinCAT3.gitignore). This file gives you a good starting point with any git source-controlled TwinCAT project.

## 2. creating independent files

Once you determined which files should be source controlled, it is important to make sure those files only change when needed. You want to make sure TwinCAT saves settings for independent parts in separate files. Several separate files which it can create are:

1. NC axes or IO devices can be saved in a separate file as explained on [this page on InfoSys](https://infosys.beckhoff.com/content/1033/tc3_sourcecontrol/767894795.html?id=9000520481371853523). 

2. [On the same page](https://infosys.beckhoff.com/content/1033/tc3_sourcecontrol/767894795.html?id=9000520481371853523) it mentions that you can save the plc project as a separate file. Or you can create a  stand-alone plc project [as I wrote about earlier](https://roald87.github.io/twincat/2020/01/29/standalone-plc-projects.html).

3. Events from the [TwinCAT EventLogger](https://roald87.github.io/twincat/2020/11/03/twincat-eventlogger-plc-part.html). These are normally stored in the `.tsproj` file. But you can also store them in an independent file. If you created a new project, you can immediately save them in a separate file. In case you want to transfer existing events to a tmc file, the steps are almost the same. For both, you first right-click **Type System** and select **Add New Item...**. Choose a name and location to save your new event class. 

    {% picture 2021-07-06-tc-source-control/create_tmc_event.png --alt image-20210605125836430 %}

    Then if you want to save _existing events_ into the new file, select the event classes you want to save in this new file.

    {% picture 2021-07-06-tc-source-control/existing_events.png --alt existing-events %}

    If you want to save _new events_ into the file, right-click the empty area and select **New**. 

    {% picture 2021-07-06-tc-source-control/new_events.png --alt new-events %}

    Then add events to this new event class.

    {% picture 2021-07-06-tc-source-control/new_event_class.png --alt new-event-class %}

    When you select the type system, the new event classes also show up among all other available event classes.

    {% picture 2021-07-06-tc-source-control/all_event_classes.png --alt all-event-classes %}

    Once the events are in separate tmc files, make sure:

    - You add the event tmc to source control. Most `.gitignore` files exclude all tmc files, for example the [GitHub TwinCAT3](https://github.com/github/gitignore/blob/master/TwinCAT3.gitignore) `.gitignore`.

    - Clear "Persistent (even if unused)"

      {% picture 2021-07-06-tc-source-control/uncheck-persistent.png --alt image-20210806223400979 %}

      Otherwise, the events are [added to the project file again](https://stackoverflow.com/q/68677733/6329629):

      {% picture 2021-07-06-tc-source-control/remove_persistent.png --alt remove-persistent %}

   - If you're using 4022.x the event tmc files are [not formatted](https://stackoverflow.com/q/68678539/6329629). Beckhoff introduced proper formatting in 4024. If you're stuck with 4022.x, you have to format the tmc files yourself. For example with the Sublime plugin [Indent XML](https://github.com/alek-sys/sublimetext_indentxml) or use [pre-commits](hhttps://cookncode.com/twincat/2022/04/14/pre-commit.html#twincat-relevant-pre-commits).

4. Per default TwinCAT saves so-called LineIDs in the `.TcPOU` files. It [uses the LineIDs for](https://infosys.beckhoff.com/content/1033/tc3_userinterface/4692665483.html?id=1009989685087473824) 

   > breakpoint handling, for example, and ensure that the code lines can be assigned to machine code instructions

   There are no adverse effects from saving them in a separate file, so I'm not sure why this is not the default. Especially since these LineIDs often change, even without any changes to the code. Once you enabled this option (under **Tools > Options >TwinCAT > PLC Environment > Write options**), TwinCAT saves the LineIDs in the `LineIDs.dbg` file. So if you enable this option, make sure this file is then added to the `.gitignore` file.

   If you have an existing project with LineIDs in the `.TcPOU` file, you can easily remove them with the bash command: `find . -type f -wholename "*.TcPOU" -exec sed -i "/LineId/d" {} \;`. Run this command in the top folder of your project. It performs a recursive search through all folders, match files with a `.TcPOU` extension, and remove all lines containing `LineId`. This command should work unless you used `LineId` somewhere in your code.

   To prevent LineIDs from re-entering your code, you can add a [pre-commit](https://cookncode.com/twincat/2022/04/14/pre-commit.html#twincat-relevant-pre-commits).

## 3. formatting rules

With the preceding measures implemented, source control of your TwinCAT3 project has already improved significantly. But, there are some more measures you can take. One of them is making sure you format your code in such a way that it makes comparing code differences easier when viewed in plain text.

One example which can make a difference is a new white line at the end of a declaration or implementation part. Take the following very short example:

```
Counter := Counter + 1;
a := Counter * 2;
```

When you look into the `.TcPOU` file itself this part looks as follows:

```
<Implementation>
  <ST><![CDATA[Counter := Counter + 1;
  a := Counter * 2;]]></ST>
</Implementation>
```

If you now make a very minor change to the code. For example, add `b := a/4;` on the last line. The plain text difference of this change looks as follows:

```diff
<Implementation>
  <ST><![CDATA[Counter := Counter + 1;
- a := Counter * 2;]]></ST>
+ a := Counter * 2;
+ b := a/4;]]></ST>
</Implementation>
```

If instead, you changed a file with a new line at the end, then the diff would look like

```diff
<Implementation>
  <ST><![CDATA[Counter := Counter + 1;
    a := Counter * 2;
+   b := a/4;
  ]]></ST>
</Implementation>
```

By adding a single white line, the difference went from -1/+2 to -0/+1. There are a few more of these tricks. Have a [look at the style guide](https://github.com/Roald87/TcBlack/blob/master/docs/style.md) of the structured text formatter (_TcBlack_) I'm building for more ideas. Unfortunately _TcBlack_ has a limited capability currently. There is however a fully functional, paid alternative, called [STweep](https://www.stweep.com/). You could use this, with the options outlined in the _TcBlack_ style guide, to achieve minimal differences.

## 4. git filters

You can use git filters to create a sort of [`.gitignore` for specific lines of code](https://stackoverflow.com/a/22171275/6329629). Whenever you checkout or commit a piece of code it can go through the git filter. If the file matches a filter setting, it can run a script to change some code before git commits or checks out the code. 

Let me show you how you can use it. Suppose you are working on a project with a few people. Everyone has their own development PLC with a different target net ID. When you select your development PLC's net ID, TwinCAT saves this change in the `.tsproj` file:

```xml
<Project 
  ProjectGUID="{DEF6D51E-ADA4-4CFE-B6F1-CB3CC59478BE}"    
  TargetNetId="1.23.456.78.1.1" 
  ShowHideConfigurations="#x106"
>
```
Since your colleagues' NetId is different, you want to prevent git from including this change in the code's version history. You can achieve this with the following steps, [as also explained in this StackOverflow post](https://stackoverflow.com/a/22171275/6329629) 

1. In the `.git/config` file inside the project you add the following:

    ```bash
    [filter "ignoreNetId"]
        clean = sh ".git/ignoreTargetNetId.sh"
    ```

    Here you define a filter called `ignoreNetId` which defines a `clean` step. The `clean` gets triggered when you add a file to a commit (`git add`). When the `clean` gets triggered, it calls a bash script `ignoreTargetNetId.sh`, which is defined below.

1. Add the following line to the `.gitattributes` file:

    ```bash
    *.tsproj filter=ignoreNetId
    ```
    
    This command means that if you commit or checkout a file with the extension `.tsproj`, git calls the `ignoreNetId` filter of the previous step. 
    
2. Finally you make a new file called `ignoreNetId.sh` in the `.git` folder and add the following content to this file:

    ```bash
    sed --regexp-extended "s/}\" TargetNetId=\"[0-9.]+\"/}\" /g" "$@"
    ```

    The [`sed`](https://www.gnu.org/software/sed/manual/sed.html) command is a text replacement command-line tool. The `--regexp-extended` option means you can use most regular expressions to find the TargetNetId. The regular expression which does the search and replace is `"s/}\" TargetNetId=\"[0-9.]+\"/}\" /g"`.  The search part (`"s/}\" TargetNetId=\"[0-9.]+\"/`) searches for a target net id with an arbitrary net id. If this pattern matches, it replaces it with `}\" `, thus removing the whole net id part. With the net id removed, TwinCAT then selects the `<Local>` TwinCAT runtime when you open the project. The last part `"$@"` is where the filename argument is filled in if git calls this script based on the first step.

In summary. The preceding steps ensure that whenever you select your development plc, this change never shows up as a change in git. You can also do the reverse: that on checkout, it automatically adds your developments plc net id into the target net id. Then you do not have to select it each time you checkout the code. See [this StackOverflow post](https://stackoverflow.com/a/22171275/6329629) for more info.

I've also used the filters to remove random changes to the HMI port in the `.hmiproj` file and an automatic add/removal of development specific [compiler definitions](https://infosys.beckhoff.com/content/1033/tc3_plc_intro/2533017227.html?id=8439395065138194985). 

I hope I shared some useful tips. What kind of tricks do you use?​

Posted: [r/TwinCAT](https://www.reddit.com/r/TwinCat/comments/nu5b3c/source_control_tips_for_twincat/), [r/plc](https://www.reddit.com/r/PLC/comments/nu5ca0/source_control_tips_for_twincat/).
