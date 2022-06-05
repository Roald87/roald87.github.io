---
layout: post
title: "TwinCAT/BSD installation and tutorial"
category: twincat
---

Jakob Sagatowksi made a video on how to [install TwinCAT BSD on a virtual machine](https://www.youtube.com/watch?v=H-qfWfz37Fg). In this post, I first go over of the same steps as he did, but then in text form. After the installation, I also show a few useful tricks. One very useful thing is that by running TwinCAT in a virtual machine, it allows you to run TwinCAT 'locally', even if you have Hyper-V enabled.


## What is TwinCAT/BSD?

TwinCAT/BSD is an alternative operating system for TwinCAT. It is based on the open source operating system FreeBSD. Beckhoff took FreeBSD and integrated the TwinCAT runtime into it. Currently, TwinCAT/BSD is offered as an alternative operating system to Windows CE/7/10. 

Note that TwinCAT/BSD is just for the TwinCAT runtime. So, the place where your code gets executed or ran. Nothing changes on the code development side: you still write your code on Windows in either Visual Studio or the TwinCAT XAE Shell.  

TwinCAT/BSD is a little different than Windows. So it might take you some time to get used to it. For example, TwinCAT/BSD doesn't come with a desktop environment. So, unlike Windows, there is no desktop with icons, a wallpaper and a start menu. If you start TwinCAT/BSD, you are greeted with a black screen with white text on it: a terminal. 

Make no mistake, working from a terminal can be quite powerful, but it can take some time to get familiar with. At the end of the tutorial, I show some examples of what you can do with it. You can also find some commands in [the official manual](http://ftp.beckhoff.com/download/document/ipc/embedded-pc/embedded-pc-cx/TwinCAT_BSD_en.pdf).

Some other advantages of using TwinCAT/BSD is that it is free and requires less space. Finally, because Beckhoff has access the the code of the operating system, they do not rely on Microsoft for support. The reliance is causing issues for Windows CE, because its end of life is planned for late 2023.

If you would like to get more details on TwinCAT/BSD, checkout the [official Beckhoff video](https://www.youtube.com/watch?v=az9vSr1GxE4) or read [the manual](http://ftp.beckhoff.com/download/document/ipc/embedded-pc/embedded-pc-cx/TwinCAT_BSD_en.pdf) for in-depth information.


## VMware ❤️ Hyper-V

The reason why I started to look into TwinCAT/BSD was that I wanted to run some TwinCAT code locally. Earlier this was possible, but at a certain point I installed [Docker](https://www.docker.com/). Docker only works if you enable Hyper-V. Unfortunately, once you enable this and you try to run your TwinCAT code locally, you get an error:

{% picture 2022-tcbsd/hyperv_error.png %}

After some Googling, I came across this [Reddit post](https://www.reddit.com/r/PLC/comments/gqzyem/psa_twincat_3_hyperv_wsl_2_working_using_vmware/) which mentioned VMware works with TwinCAT 3 and Hyper-V! 
This provided me with a nice opportunity to test TwinCAT/BSD, because I didn't wanted to create a huge Windows VM. Also it allowed me to answer a [StackOverflow question](https://stackoverflow.com/questions/71321786/how-can-i-use-a-local-twincat-3-runtime-with-hyper-v-enabled/71333438#71333438) 🥳.


## Installing TwinCAT/BSD 

Here I show you how you can install TwinCAT/BSD on a VMware virtual machine. You can also install it on Virtual Box, but I'm not sure if that allows to run TwinCAT code on a system with Hyper-V enabled. If you want to install TwinCAT/BSD on Virtual Box there is a [convenient script](https://github.com/r9guy/TwinCAT-BSD-VM-creator) to do much of the work for you.

### Create a bootable USB

1. Install Rufus to create a bootable USB drive.
	- Install via the terminal `winget install -e --id Rufus.Rufus`.
	- Or [download manually](https://rufus.ie/) and install. You can also use the portable version, which doesn't require any installation.

1. Go to the [Beckhoff website](https://www.beckhoff.com/en-us/search-results/?q=bsd) and download the TwinCAT/BSD ISO. I will do that. 

    {% picture 2022-tcbsd/download_tcbsd_iso.png %}

1. Unzip the file you just downloaded. You'll probably find three files in there. The ISO one is the one you need.

1. Get yourself an USB drive which doesn't contain important information, since it is formatted in the process. I used a very old 1 GB USB drive that I bought for €30 a long time ago 😱. 

1. Open Rufus, click **SELECT** and select the ISO file you just unpacked. 

	{% picture 2022-tcbsd/rufus_select_iso.png %}

1. Then select **START**. It then reformats the USB drive and make it a bootable USB drive with TwinCAT/BSD on it.

### Installing TwinCAT/BSD on a virtual machine

1. Download and install VMware Workstation Player. It is free for non-commercial use.  
	- Install from the terminal with `winget install -e --id VMware.WorkstationPlayer`
	- Or [manually download](https://www.vmware.com/products/workstation-player/workstation-player-evaluation.html) and install.

2. Select the free license or enter a license number

4. Start VMware Workstation Player with Administrator rights and select create a New Virtual Machine. The admin rights are needed to access the USB drive.

    {% picture 2022-tcbsd/create_new_vm.png %}

1. Select **I will install the operating system later**.

	{% picture 2022-tcbsd/install_os_later.png %}

5. Select "Linux" and "FreeBSD 12 64-bit"

	{% picture 2022-tcbsd/select_guest_os.png %}

6. Give your virtual machine a descriptive name and change the save location if you would like to.

	{% picture 2022-tcbsd/name_vm.png %}

1. Specify the disk capacity. I left it at the default 20 GB, but we're going to remove it later on again, so it doesn't matter what you do here.

	{% picture 2022-tcbsd/disk_vm.png %}

1. You see a screen summarizing the results. Click **Finish**.

1. Select the virtual machine you just created and select **Edit virtual Machine Settings**.

    {% picture 2022-tcbsd/edit_vm_settings.png %}

1. Increase the memory of the virtual machine. I set it to 1 GB. At 256 MB the virtual machine sometimes get killed unexpectedly when it runs out of memory.

    {% picture 2022-tcbsd/vm_memory.png %}

1. Then replace the current hard disk. Select the current hard disk and click **Remove** to remove it and click **Add** to add a new one.

	{% picture 2022-tcbsd/replace_harddisk.png %}

1. Then in the new window, select **Hard Disk** and click **Next**.
1. Select **SATA** and click **Next**.
1. Select **Use a physical disk (for advanced users)**. Yes that's you :D. Click on **Next**.
1. Now you get prompted to choose a disk. Here you want to select your USB drive, which should still be in your computer.  

	{% picture 2022-tcbsd/select_disk.png %}

1. To find out if you need to select Disk 0 or Disk 1. Type in `diskmgmt` in the start menu to open "Create and format hard disk partitions".

	{% picture 2022-tcbsd/diskmgmt.png %}

1. 	Now you should see a number of partitions. In my case there were two. Here Disk 1 is clearly marked as removable. So I select disk 1 as the one I want to use as the  hard drive.

	{% picture 2022-tcbsd/disk0_disk1.png %}

1. Now go back to the virtual machine settings and select "PhysicalDrive1" and click  "Next" and finally click "Finish".

	{% picture 2022-tcbsd/select_disk1.png %}
	
1. Now you are back in the main settings menu. Next you create an additional hard drive to install TwinCAT/BSD on. Click on "Add" > "Hard disk" > Select "SATA" > Select "Create a new virtual disk" > Enter the amount of GB you need, 20 GB should be more than enough. Leave the other options as is and click "Next" and "Finish".

1. There is one final setting you need to change. If you happen to have a Pro version of VMware, you can set the firmware type under the virtual machine settings under **Options > Advanced > Firmware type**. Make sure to set it to **UEFI**. If you have [the Player version](https://stackoverflow.com/a/71333438/6329629), you:
	1.  Locate the directory of the virtual machine. You can find its location under **Edit virtual machine settings > Hard Disk (SATA)**
		
	     {% picture 2022-tcbsd/vm_location.png %}
		 
	1. Open the .vmx file in the VM directory with notepad.
	1. Find the line `firmware = "bios"` and replace with  `firmware = "efi"` and save. If this line doesn't exist, just add it somewhere.
	
	{% picture 2022-tcbsd/player_vs_pro.png %}

1. Now start the virtual machine with **Play virtual machine**.

1. Wait for the installer to start up. This can take a minute. After that you should see the following screen. Select **TC/BSD Install** and hit enter.

	{% picture 2022-tcbsd/bsd_install.png %}	

1. Then select the 20G virtual hard drive you made and hit enter.

	{% picture 2022-tcbsd/select_harddrive.png %}	

1. Hit enter again to acknowledge the warning.

	{% picture 2022-tcbsd/warning.png %}	

1. Then it asks for you to generate a password. Type in a password and repeat it to make sure it's correct.	
1. After a few minutes the installation should be complete and you should see the following screen. Select **OK**.

	{% picture 2022-tcbsd/complete.png %}	
	
1. In the new menu select **Shutdown** so that you can remove the USB drive.
   
   {%picture 2022-tcbsd/reboot.png %}

3. Remove USB drive under **Edit virtual machine settings**. Make sure you don't select the 20 GB hard drive where you just installed TwinCAT/BSD on.
4. Go back to the main menu and start the virtual machine. 
5. After some time you see a the login screen. Login with your user name and password you made during the installation.

    {% picture 2022-tcbsd/bsd_login.png %}
	
1. Congrats. You now have a running version of TwinCAT/BSD. 

## Device manager
As I mentioned earlier, there is no pretty GUI waiting for you. Most things are done from the terminal. But the device manager has a GUI. To access it, you first need to find out he IP of the the virtual machine. The IP can be found by typing in `ifconfig` and the IP is then right after `inet`.

{% picture 2022-tcbsd/ifconfig.png %}

Then open your browser and type in the IP address you found. So for me it is 	`192.168.126.128`. From here you can log into the device manager with the username `Administrator` and the password you set earlier. The device manager shows all kinds of information about the state of the hardware and the software. You can also access the web console. The console shows you the same as what you would see if you log into the virtual machine directly. I found the web based console easier to use, because scrolling and copy pasting commands is easier.

{% picture 2022-tcbsd/device_manager.png %}

##  Installing packages
As I mentioned earlier, there is not pretty GUI waiting for you. Most things are done from the terminal. One of the things you can do is install packages. Package managers are a very useful feature in UNIX like operating systems. Although Windows is now finally also joining with `winget`.

### Installing `vm-tools`

Let me show you how to install your first package on TcBSD. You might have noticed the notification at the bottom of the VMware window. It asks you to install some tools for some performance with the host system. But if you click **Install tools**, you get an error. 

{% picture 2022-tcbsd/error_install_vm_tools.png %}

To install the `vm-tools`, you:
1. Update the repository catalogue. You do this with the command `sudo pkg update`. Here `sudo` means the commands which follow are executed with admin privileges. `pkg` is the package manager of FreeBSD and `update` is the command to update the catalogue. To see and overview of all available commands type `pkg help` .

```
	$ sudo pkg update
	Password:
	Updating TCBSD repository catalogue...
	Fetching meta.conf: 100%	164 B	0.2 kB/s	00:01
	Fetching packagesite.pkg: 100% 418 KiB 427.6kB/s	00:01
	Processing entries: 100%
	TCBSD repository update completed. 1248 packages processed.
	All repositories are up to date.
```
	
2. Install the `vm-tools` package with the command `sudo pkg install open-vm-tools-no-x11`. Type `y` to start the installation. After a minute it should be done and you installed your first package. It is as easy as that.

```
 $ sudo pkg install open-vm-tools-nox11
Password:
Updating TCBSD repository catalogue...
TCBSD repository is up to date.
All repositories are up to date.
Checking integrity... done (0 conflicting)
The following 12 package(s) will be affected (of 0 checked):

New packages to be INSTALLED:
		fusefs-libs: 2.9.9_2
		gettext-runtime: 0.21
        open-vm-tools-nox11: 11.3.5_3,2

Number of packages to be installed: 1

The process will require 6 MiB more space.

Proceed with this action? [y/N]: y
```


{% picture 2022-tcbsd/install_vm_tools.png %}

### Install TwinCAT HMI server

A package which you likely need is the HMI server. I don't exactly know what it is called, but I know that there is a search functionality. If you type in `pkg search hmi`, you see two results.

```
$ pkg search hmi
TF1810-PLC-HMI-Web-3.1.4024.11_1 TF1810 | TC3 PLC HMI Web
TF2000-HMI-Server-1.12.754.4   TF2000-HMI-Server
```

The first one is the old HMI and the second one is the one I want. To install it, type `sudo pkg install TF2000-HMI-Server` and hit enter. Confirm the start of the installation with  `y`.  Then a warning showed up. So I did `coas service TcHmiSrv start` to start it.

```
=====
Message from TF2000-HMI-Server-1.12.754.4:

--
============================== !!!! WARNING !!!! ==========================
FreeBSD package manager doesn't allow us to automatically start services
during package installation. To use the Beckhoff TwinCAT HMI Server either
restart your system or start 'TcHmiSrv' manually with:

doas service TcHmiSrv start

============================== !!!! WARNING !!!! ==========================
```

If you then type `top` and hit enter, you see the TcHmiSrv  is running. `top` is the task manager analogue of FreeBSD. It can be convenient to have it open to see if processes are running, or maybe if your virtual machine has crashed. To exit `top,` press `q` or <kbd>Ctrl</kbd> + <kbd>C</kbd>. 

{% picture 2022-tcbsd/top_tchmi.png %}

## Running PLC code

### Connecting to the virtual machine

Now you are ready to run some PLC and HMI code on TwinCAT/BSD. You find the target machine like you would always do. You go to **Choose Target System > Search (Ethernet) > Broadcast search**. Note that next to your regular WiFI/Ethernet ports, also two ports from VMware show up. Make sure the VMware ports are selected and click **OK** to start the search. 

{% picture 2022-tcbsd/select_ports.png %}

Click **Add Route** select **Secure ADS** and click **OK**. In case it can't connect, click **Advanced** to show the options. Then select **IP address** instead of **Host name**. Then try to connect again. 

{% picture 2022-tcbsd/connected.png %}

After successfully connecting to the PLC, you should be able to activate your configuration. So now you can develop TwinCAT code again with Hyper-V while [sitting in a beer garden like some developers do](https://alltwincat.com/2020/06/15/the-five-best-and-worst-things-with-twincat/#the-very-concept-of-twincat). Freedom!

### Publishing the HMI

With your PLC code running it is now time to look at how to publish the HMI. While I was investigating how to do this, I ran into an annoying issue. When I do `TcHmiSrv --help`, the help text is to long for the console screen. At first I couldn't figure out how to scroll back up, because there is no scroll bar, <kbd>↑</kbd> bring up the previous command and <kbd>Page Up</kbd> just shows a `~`.  After consulting Google, I found out that is where the <kbd>Scroll Lock</kbd> key is for! I always wondered what this button did. If you're on a laptop without a Scroll Lock key, you can [remap one of the existing key combo's](https://serverfault.com/a/420341). 

![scroll lock enables scrolling in the TcBSD terminal window](/assets/2022-tcbsd/scroll_lock_magic.gif)

After that little detour it is time to publish the HMI. 

- [ ] find HMI server address
- [x] TcBSD scroll lock
- [ ] html device manager -> open web browser and type in the ip e.g. https://192.168.126.132/. There is also a console https://192.168.126.132/console/, much better than the one in VMware.	
- [x] Admin rights are to access the USB drive
- [ ] Remove nvram file
- [ ] First need to add the hdd, then the USB stick


Error after installing it on SATA
![[Pasted image 20220604082642.png]]

Error when opening VM workstation
![[Pasted image 20220604093107.png]]
- Selected no for TcBsd2
- now created first 20 Gb HD and then the usb drive
- really need more than 256 MB,
