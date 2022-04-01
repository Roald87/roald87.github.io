---
layout: post
title: "Up your git game with pre-commits for TwinCAT"
date: 2022-01-31
category: twincat
---

[Previously](https://cookncode.com/twincat/2021/06/07/tc-source-control-tips.html) I talked about how you can do version control of your TwinCAT code with git. In this post I want to go into a very neat feature of git which I didn't mention last time: pre-commits. Pre-commits can for example be used to ensure consistent  formatting before the code is committed. Unfortunately there aren't many tools for structured text files, but we can also use it for markdown, html or javascript files. Let's dive in!

## What are pre-commits?

Pre-commits are part of a class of so called [git hooks](https://git-scm.com/book/en/v2/Customizing-Git-Git-Hooks). These hooks allow you to run a script at some point during a git command. Most hooks are of the pre- kind, which means it does something before a commit, merge or rebase. They can be very useful to ensure a consistent code formatting style or that the code complies with a static code analyzer. 

You can see some examples of git hooks if you have a project which uses git. Navigate to the `.git/hooks` folder and you should see a list of example hooks there. If you can't see the `.git` folder, make sure you have enabled "Hidden items" under the View tab in your Windows Explorer. 

![git hook examples](/assets/2022-pre-commit/hook-examples.png)

If you open one of the files you will see some bash scripts. It is not necessary to use bash, you can use any programming or scripting language which is available on your system. 

You can write your own hooks from scratch, but for pre-commits there is already [a large variety available](https://pre-commit.com/hooks.html). Let's see how we can use these for our TwinCAT projects.

## Setup pre-commit

A popular framework to manage pre-commits is called [pre-commit](https://pre-commit.com/). It is written in Python. Therefore you first need to install Python if you do not already have Python installed.

1. (In case you do not have Python) Download and install conda via one of the methods below. Miniconda is a very minimal installation which comes only with the strictly necessary to get started. Miniconda should be enough for this tutorial. If you would like to have a bit more tools/modules installed (mainly for data analyses), choose Anaconda.
    - Manually download and install [Miniconda](https://docs.conda.io/en/latest/miniconda.html) or [Anaconda](https://www.anaconda.com/products/individual#Downloads).
    - Or run `winget install -e --id Anaconda.Miniconda3` or `winget install -e --id Anaconda.Anaconda3` from the terminal. 

1. Install pre-commit with either:
    - `pip install pre-commit`
    - or `conda install -c conda-forge pre-commit`

1. Check if installation went OK by running the following command in the terminal. If you see a version number, pre-commit was installed successfully.
 
  ```
      $ pre-commit --version
      pre-commit 2.17.0
  ```

{:start="4"}
1. Now make a new file called `.pre-commit-config.yaml` in the git project folder (same folder as where your `.git` folder resides) where you want to start using pre-commits. Now you're all set up to start using pre-commits! I'll show some useful ones in the next section.


## Adding TwinCAT relevant pre-commits

As you might have noticed, there is not a lot of open source software for TwinCAT. Luckily there are actually some pre-commits specifically for TwinCAT! The kind people of the Photon Controls and Data Systems at SLAC have open sourced their TwinCAT pre-commit files!

In order to use the SLAC pre-commits, add the following lines to your `.pre-commit-config.yaml` file:

```yaml
-   repo: https://github.com/pcdshub/pre-commit-hooks
    rev: v1.1.0
    hooks:
    -   id: twincat-leading-tabs-remover # Replaces all leading tabs with spaces
    -   id: twincat-lineids-remover # Removes line ids. See point 4 of the link for why you don't need them https://cookncode.com/twincat/2021/06/07/tc-source-control-tips#2-creating-independent-files
    -   id: twincat-xml-format # Formats .tmc and .tpy files
```

For completeness, I'll also add the following standard pre-commits. Let's first run the pre-commits, later [I will go into detail what they do and why they are useful](#hooks-what-and-why).

```yaml 
repos:
-   repo: https://github.com/pre-commit/pre-commit-hooks
    rev: v3.2.0
    hooks:
    -   id: trailing-whitespace # Removes trailing white spaces
    -   id: check-yaml # checks yaml files for parseable syntax.  
    -   id: check-added-large-files # prevents giant files from being committed.     
````

Now install the pre-commit hooks with `pre-commit install`. **You only need to do this once per git repo.** After that you can run `pre-commit run --all-files`, to let the pre-commits do their magic. Note: you only run this command if you added new pre-commits. Normally all the pre-commits are automatically executed. The automatic execution will then only check files which you've changed. 

Depending on the project you will see no, some or a lot of files being changed. For example, when I ran it on my [TwinCAT Tutorial repo](https://github.com/Roald87/TwincatTutorials) I saw the following:

![pre-commit changes to the twincat tutorial repo](/assets/2022-pre-commit/changes-twincat-tutorial.png)
    
For each git hook you will see if it had files to check. If that was the case, you see if it changed any files and what files were changed.

Below I show an example where two hooks were triggered. Here both the leading tabs remover failed (as shown in the screen shot), but also the trailing white space one failed (not shown). Below are the differences I saw afterwards in SourceTree:

![git hook examples](/assets/2022-pre-commit/after-running-sample-pre-commit.png)

You see that it removed a trailing whitespace after the `CASE _state OF`. Additionally the file had a mix of tabs and spaces. The tabs were replaced by spaces. These changes were made by the `trailing-whitespace` and `twincat-leading-tabs-remover` respectively. For a full list of all the changes you can see the differences of **THIS COMMIT**.

### Hooks what and why

Let's now dive a little deeper into what these hooks do and why you would want them. 

`twincat-leading-tabs-remover`

What: Replaces all leading tabs with four spaces. 

Why: Consistency. Also in some editors the length of a tab can differ from the length of four spaces.

`twincat-lineids-remover`

What: Removes LineID's from a POU file. 

Why: They are are only useful locally. When uploaded to source control they only cause visual clutter. For more information [see point 4](https://cookncode.com/twincat/2021/06/07/tc-source-control-tips#2-creating-independent-files)

`twincat-xml-format`

What: Formats the `.tmc` and `.tcp` files with newlines and indentation. 

Why: Makes these files readable for humans. Normally TwinCAT doesn't put any newlines or indentation in these files. Useful if you would like to have these files in source control.

`trailing-whitespace`

What: Removes spaces and tabs at the end of lines. 

Why: Whitespace at the end of a line have no influence on code execution. You can add or remove as many as you'd like. But they can show up as useless changes if someone  adds some or removes them. 

`check-yaml`

What: Checks that your yaml file (e.g. the `.pre-commit-config.yaml`) can actually be read by the programs that use it. 

Why: Ensures that your yaml files do not break.

` check-added-large-files`: 

What: prevents large files from being added to your git tree. 

Why: To prevent your git tree from becoming huge. Saves time for new users when they download the repo for the first time. Large, non-text files, such as images or binary files usually contain no useful diffs. You want to commit these files using [Git LFS](https://git-lfs.github.com/).

------
Add prettier


Might need to add node executable to terminal 

`C:\Program Files (x86)\Microsoft Visual Studio\2017\Community\MSBuild\Microsoft\VisualStudio\`

### Error

```
An unexpected error has occurred: CalledProcessError: command: ('C:\\Users\\roald\\.cache\\pre-commit\\repo4ljaca3f\\node_env-default\\Scripts\\npm.CMD', 'install', '--dev', '--prod', '--ignore-prepublish', '--no-progress', '--no-save')
return code: 1
expected return code: 0
stdout:

    up to date, audited 74 packages in 2s

    4 packages are looking for funding
      run `npm fund` for details

    7 moderate severity vulnerabilities

    To address all issues (including breaking changes), run:
      npm audit fix --force

    Run `npm audit` for details.

stderr:
    npm WARN install Usage of the `--dev` option is deprecated. Use `--include=dev` instead.
```

x `git config --system core.longpaths true`
x `pip install virtualenv==20.0.33`
- upgrade npm from ? to latest 
- upgrade node from 10.6.0 to latest?


### Warning
```
[WARNING] The 'rev' field of repo 'https://github.com/prettier/pre-commit' appears to be a mutable reference (moving tag / branch).  Mutable references are never updated after first install and are not supported.  See https://pre-commit.com/#using-the-latest-version-for-a-repository for more details.  Hint: `pre-commit autoupdate` often fixes this.
```
 --> solved with  `pre-commit autoupdate`

