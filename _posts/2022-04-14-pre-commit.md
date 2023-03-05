---
layout: post
title: "No more formatting fights with pre-commits for TwinCAT"
category: twincat
toc: true
---

[Earlier](https://cookncode.com/twincat/2021/06/07/tc-source-control-tips.html) I talked about how you can do version control of your TwinCAT code with git. In this post, I want to show a neat feature of git which I didn't mention last time: pre-commits. Pre-commits can format, lint, or do static code analyses on your code before committing. One pre-commit is available for structured text files. But, pre-commits are also available for markdown, HTML, or JavaScript files.

*Use the [GitHub TwinCAT template repo](https://github.com/rruiter87/TcTemplate) to set up a TwinCAT repo, including the pre-commits.*

*Use the [GitHub TwinCAT template repo](https://github.com/rruiter87/TcTemplate) to set up a TwinCAT repo, including the pre-commits.*

## What are pre-commits?

Pre-commits are part of a class of so-called [git hooks](https://git-scm.com/book/en/v2/Customizing-Git-Git-Hooks). Hooks enable you to run a script during a git command. Most of these hooks are pre-commit, meaning they do something before a commit, merge, or rebase. Pre-commit hooks can be beneficial; for instance, they can guarantee a uniform code formatting style or verify a file's JSON or XML format.

You can see some examples of git hooks if you have a project which uses git. Navigate to the `.git/hooks` folder and you should see a list of example hooks there. If you can't see the `.git` folder, make sure you have enabled "Hidden items" under the View tab in your Windows Explorer.

{% picture 2022-pre-commit/hook-examples.png --alt git hook examples as found in the ./git/hooks folder %}

If you open one of the files, you see some bash scripts. It's not necessary to use bash. You can use any programming or scripting language which is available on your system.

You can write your own hooks from scratch, but for most files, there is already [a large variety available](https://pre-commit.com/hooks.html). Let me show you how you can use these and a structured text hook for your TwinCAT projects.

## Setup pre-commit

A popular framework to manage pre-commits is [pre-commit](https://pre-commit.com/). It's a Python based framework and thus you need a working Python installation on your system before you can use it.

1. (In case you do not have Python) Download and install conda via one of the methods below. You can either install Miniconda which is a minimal installation. It comes with the bare necessities to get started. Miniconda should be enough for this tutorial. Or, if you would like to have a bit more tools/modules installed (mainly for data analyses), choose Anaconda.
    - Manually download and install [Miniconda](https://docs.conda.io/en/latest/miniconda.html) or [Anaconda](https://www.anaconda.com/products/individual#Downloads).
    - Or run `winget install -e --id Anaconda.Miniconda3` or `winget install -e --id Anaconda.Anaconda3` from the terminal.

1. Install pre-commit with either:
    - `pip install pre-commit`
    - or `conda install -c conda-forge pre-commit`

1. Check if the installation went OK by running the command below in the terminal. If you see a version number then pre-commit works.

  ```
      $ pre-commit --version
      pre-commit 2.17.0
  ```

{:start="4"}
1. Next, create a new file called `.pre-commit-config.yaml` in the git project folder (same folder as where your `.git` folder resides) where you want to start using pre-commits. Now you're all set up to start using pre-commits.

## TwinCAT relevant pre-commits

The kind people of the Photon Controls and Data Systems at SLAC have open-sourced their TwinCAT pre-commits. To use the SLAC pre-commits, add the following lines to your `.pre-commit-config.yaml` file:

```yaml
-   repo: https://github.com/pcdshub/pre-commit-hooks
    rev: v1.2.0
    hooks:
    # Replaces all leading tabs with spaces
    -   id: twincat-leading-tabs-remover
    # Removes line ids. See point 4 of the link for why you don't need them
    # https://cookncode.com/twincat/2021/06/07/tc-source-control-tips#2-creating-independent-files
    -   id: twincat-lineids-remover
    # Formats .tmc and .tpy files
    -   id: twincat-xml-format
    # Check if there are any libraries whose versions are not fixed
    -   id: check-fixed-library-versions
```

For completeness, I'll also add the following standard pre-commits. You can first run these pre-commits. Later [I go into details about what they do and why they are useful](#hooks-what-and-why).

```yaml
repos:
-   repo: https://github.com/pre-commit/pre-commit-hooks
    rev: v3.2.0
    hooks:
    # Removes trailing white spaces
    -   id: trailing-whitespace
    # Checks yaml files for parseable syntax
    -   id: check-yaml
    # Prevents git from committing large files
    -   id: check-added-large-files
```

Now install the pre-commit hooks with `pre-commit install`. **You only need to do this step once per git repo.** After that you can run `pre-commit run --all-files` and let the pre-commits do their magic. Note: you only run this command if you added new pre-commits. Normally all the pre-commits are automatically executed if you do `git commit ...`. In this case, the automatic execution only checks files that were changed.

Depending on the project you see no, some, or a lot of changed files. For example, when I ran it on my [TwinCAT Tutorial repo](https://github.com/Roald87/TwincatTutorials) I saw the following:

{% picture 2022-pre-commit/changes-twincat-tutorial.png --alt pre-commit changes to the twincat tutorial repo %}

For each git hook, you see if it had files to check. If that was the case, you see if any files were changed.

Below I show an example where two hooks were triggered. Here both the leading tabs remover failed (as shown in the screenshot), but also the trailing white space one failed (not shown). Below are the differences I saw afterward in SourceTree:

{% picture 2022-pre-commit/after-running-sample-pre-commit.png --alt git diff after running the sample pre-commit. Here trailing white spaces have been removed and tabs are replaced by spaces. %}

You see that it removed a trailing space after the `CASE _state OF`. Additionally, the file had a mix of tabs and spaces. The tabs were replaced by spaces. These changes were made by the `trailing-whitespace` and `twincat-leading-tabs-remover` respectively. For a full list of all the changes, you can see the differences of [this commit](https://github.com/Roald87/TwincatTutorials/pull/2/commits/91041e5f94d44095ce070381645609bf82ce52d8).

### Hooks what and why

Here I go a little deeper into what the hooks do and why you would want to use them.

`twincat-leading-tabs-remover`

What: replaces all leading tabs with four spaces.

Why: consistency. Also in some editors, the length of a tab can differ from the length of four spaces.

`twincat-lineids-remover`

What: removes LineIDs from a POU file.

Why: they are only useful locally. When uploaded to source control they only cause visual clutter. For more information [see point 4](https://cookncode.com/twincat/2021/06/07/tc-source-control-tips#2-creating-independent-files)

`twincat-xml-format`

What: formats the `.tmc` and `.tcp` files with newlines and indentation.

Why: makes these files readable for humans. Normally TwinCAT doesn't put any newlines or indentations in these files. Useful if you would like to have these files in source control and see clear differences.

`check-fixed-library-versions`

What: checks if there are TwinCAT libraries whose versions are not fixed or explicitly set to the latest version.

Why: ensures that your software behaves the same, even if you install newer library version on your system.

`trailing-whitespace`

What: removes spaces and tabs at the end of lines.

Why: whitespace at the end of a line does not influence code execution; you can add or remove as many as you'd like. But, they show up as (useless) changes if someone adds some or removes them.

`check-yaml`

What: checks that programs can read your YAML file. For example, the `.pre-commit-config.yaml` one.

Why: ensures that your YAML files do not break.

`check-added-large-files`:

What: prevents git from adding large files to its history.

Why: to prevent your git tree from becoming huge. Saves time for new users when they download the repo for the first time. Large, non-text files, such as images or binary files usually contain no useful diffs. You want to commit these files using [Git LFS](https://git-lfs.github.com/).

## Developing your own hooks

If you would like to develop your own hooks there are two options: local and remote repo-based hooks. Local hooks are quite easy to set up, but they can only be used in the repo where they are saved. On the other hand, remote-based hooks can be shared across many projects. [The TwinCAT hooks](https://github.com/pcdshub/pre-commit-hooks) you saw earlier, is an example of a remote hook.

You can [use many languages](https://pre-commit.com/#supported-languages) to develop your hooks. Most languages need a working installation of that specific language on the system where the hooks are executed. The exceptions are node, python, and ruby. For these languages, no existing installation is needed. Hooks developed in these three languages set up their own (node, python, ruby) environment when first executed. On subsequent runs, the environment is reused.

Remote hooks also need to be a valid git repo. That is because pre-commit tries to do a `git clone ...` of the repo URL you supplied in the `.pre-commit.yaml` file. To make a remote hook, see the [TwinCAT hooks repo](https://github.com/pcdshub/pre-commit-hooks) as an example.

### Local hook example

Developing a local hook is quite straightforward. I'll explain how to do it by making a hook that checks if all links on this blog start with `https`. If they don't, it replaces `http` with `https`.

First I added a file called [`.pre-commit-config.yaml`](https://github.com/Roald87/roald87.github.io/blob/main/.pre-commit-config.yaml) with the following content. See the comments for their meaning.

```yaml
repos:
    - repo: local
      hooks:
        # Name of the hook
        - id: check-https
          # Hook name shown during hook execution
          name: check if all links are https
          # Where pre-commit can find the script it should call and how it should call it
          entry: python _hooks/check_https.py
          # The language to use, in this case we're using a language present on the system.
          # Using python as an argument would work as well
          language: system
          # A valid regular expression pattern to define which files should be passed to `check_https.py`
          files: '.*\.(md|markdown)'
```

When pre-commit runs this local hook, it first searches for files that conform to the regular expression pattern mentioned in `files:`. Then it calls the command mentioned under `entry` with each filename. For example, it finds the files `README.md` and `about.md`. Then it calls `check_https.py` with `python _hooks/check_https.py README.md about.md`.

Next, I created a new file called [`_hooks/check_https.py`](https://github.com/Roald87/roald87.github.io/blob/main/_hooks/check_https.py) with the following content. See comments for the meaning.

```python
#!/usr/bin/env python

import argparse

def fix_file(filename):
    # Open the file
    with open(filename, 'r') as fd:
        original_lines = fd.readlines()
    new_lines = []
    changed = False
    # For each line in the file check if a https:// is found.
    # If so, replace it with https://
    for line in original_lines:
        if "https://" in line:
            line = line.replace("https://", "https://")
            changed = True
        new_lines.append(line)

    # If a line was changed, print a message in the console and overwrite the
    # original file with the fixed one.
    if changed:
        print(f'Fixing {filename}')
        with open(filename, 'w') as fd:
            fd.write(''.join(new_lines))


def main(args=None):
    # Parse the filename arguments:
    # e.g. Namespace(filenames=['README.md', 'about.md'])
    if args is None:
        parser = argparse.ArgumentParser()
        parser.add_argument('filenames', nargs='*')
        args = parser.parse_args()
    # For each filename execute the file fixer on it
    try:
        for filename in args.filenames:
            fix_file(filename)
        # Return 0, which means the hook executed successfully and pre-commit is happy
        return 0
    except Exception as exc:
        print(exc)
        # If something went wrong return an error code other than 0 and pre-commit
        # then knows something went wrong
        return 1


if __name__ == "__main__":
    exit(main())
```

If you now run `pre-commit run --all-files` you should see [all the files](https://github.com/Roald87/roald87.github.io/commit/85cf128b4a82f1807d8fbbcb74fa57825408c9aa) it changed.

```
> pre-commit run --all-files
check if all links are https.................................................Failed
- hook id: check-https
- files were modified by this hook

Fixing _posts/2021-09-13-units.markdown
Fixing _posts/2021-06-07-tc-source-control-tips.markdown
Fixing _posts/2021-08-17-tc-simulation.markdown
Fixing tclinks.md
```

## Further ideas

Other ideas could be to use [Prettier](https://prettier.io/) to format JavaScript, HTML, or CSS files from HMI projects. Unfortunately, TwinCAT saves the HMI pages as `.content` and `.view` files. These files are not recognized as HTML files by prettier, but you could probably make it work by temporarily renaming these files to `.html` and then running prettier.

Pre-commits are automatically executed locally whenever you commit something. But you can also add pre-commit to your CI workflow. For example, use [prettier.ci](https://pre-commit.ci/) to [automatically format markdown files of a pull request](https://github.com/Roald87/TwinCatChangelog/pull/23).

{% picture 2022-pre-commit/precommit_ci.png --alt pre-commit integration in github actions %}
{% picture 2022-pre-commit/precommit_ci_changes.png --alt changes made by pre-commit.ci %}

Have you already used pre-commits for your (TwinCAT) projects? Or do you have other ideas? Let me know in the comments below.
