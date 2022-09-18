---
layout: post
title: "Unit testing code from a separate project"
category: twincat
---

The other day [I answered a question on StackOverflow](https://stackoverflow.com/a/60542846/6329629) on how to unit test code from a separate project. To increase its exposure I also added it here.

- [Code](https://gist.github.com/Roald87/c68ea920607ec8f32d977d32f3f82712)

Say you have a TwinCAT project called _MyProject_ which you want to test with the [TcUnit](https://tcunit.org/) library. For this you create another project _MyProject\_Tests_. So you have the following folder structure:

```
repos
  ├── MyProject
  |  ├── MyProject
  |  |  ├── Plc
  |  |  |  ├── POUs
  |  |  |  └── Plc.plcproj
  |  |  └── MyProject.tsproj
  |  └── MyProject.sln
  |
  ├── MyProject_Tests
  |  ├── MyProject_Tests
  |  |  ├── Plc
  |  |  |  ├── POUs
  |  |  |  └── Plc.plcproj
  |  |  └── MyProject_Tests.tsproj
  |  └── MyProject_Tests.sln
  |
  └── hardlinkPousToTestProject.bat
```

You then:
1. Add a folder _Tests_ under _Plc_ in the _MyProject\_Tests_ project.
2. Add a method you want to test to _MyProject/MyProject/Plc/POUs_.
3. Edit the path names in [`hardlinkPousToTestProject.bat`](https://gist.github.com/Roald87/c68ea920607ec8f32d977d32f3f82712#file-hardlinkpoustotestproject-bat) such that they point to the correct folders. So for the current example:
	- `for %%i in (.\path\to\project\POUs\*.TcPOU) do (` becomes `for %%i in (.\MyProject\MyProject\Plc\POUs\*.TcPOU) do (`
	- and `mklink /H .\path\to\testproject\POUs\%%~nxi %%i` becomes `mklink /H .\MyProject_Tests\MyProject_Tests\Plc\POUs\%%~nxi %%i`
4. Run the batch script.
5. Manually add the `.TcPOU` files to the `_MyProject\_Tests_ project`
6. Add the _MyProject\_Tests\MyProject\_Tests\Plc\POUs_ folder to the `.gitignore` file since these files are already in _MyProject_.

Your file structure should now look like this:

```
repos
  ├── MyProject
  |  ├── MyProject
  |  |  ├── Plc
  |  |  |  ├── POUs
  |  |  |  |  └── Function.TcPOU  # Original file
  |  |  |  └── Plc.plcproj
  |  |  └── MyProject.tsproj
  |  └── MyProject.sln
  |
  ├── MyProject_Tests
  |  ├── MyProject_Tests
  |  |  ├── Plc
  |  |  |  ├── POUs
  |  |  |  |  └── Function.TcPOU   # Hard linked file
  |  |  |  ├── Tests
  |  |  |  |  └── Function_Tests.TcPOU
  |  |  |  └── Plc.plcproj
  |  |  └── MyProject_Tests.tsproj
  |  └── MyProject_Tests.sln
  |
  └── hardlinkPousToTestProject.bat
```

Now you can change `Function.TcPOU` from either _MyProject_ or _MyProject\_Tests_!

## What is hard linking?

With hard linking, identical copies of a file are created. All the copies still point to the original file. So, whenever a change is made to a hard linked file, or the original, the changes show up in all the files. Hard linking basically creates multiple access points to the same file from different locations.

Discuss: [Github snippet](https://gist.github.com/Roald87/c68ea920607ec8f32d977d32f3f82712).
