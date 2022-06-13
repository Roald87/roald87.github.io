---
layout: post
title: "TwinCAT/BSD installation and tutorial"
category: twincat
---

TwinCAT/BSD is a new operating system which encapsulated the TwinCAT runtime. It is an operating system with a small footprint and it's free. Additionally, TwinCAT/BSD allows you to run TwinCAT code locally when you have Hyper-V enabled if you install it in a virtual machine. In this tutorial I go over the installation of TwinCAT/BSD on VMware and Virtual Box and show some basic usages of Tc/BSD.

## What is TwinCAT/BSD?

TwinCAT/BSD is an alternative operating system for TwinCAT. It is based on the open source operating system FreeBSD. Beckhoff took FreeBSD and integrated the TwinCAT runtime into it. Currently, TwinCAT/BSD is offered as an alternative operating system to Windows CE/7/10. 

Note that TwinCAT/BSD is just for the TwinCAT runtime. So, the place where your code gets executed. Nothing changes on the code development side: you still write your code on Windows in either Visual Studio or the TwinCAT XAE Shell.  

TwinCAT/BSD is a little different than Window and it might take you some time to get used to it. For example, TwinCAT/BSD doesn't come with a desktop environment. So, there is no desktop with icons, a wallpaper and a start menu. If you start TwinCAT/BSD, you are greeted by a black screen with white text on it: a terminal. 

Make no mistake, working from a terminal can be quite powerful, but it can take some time to get familiar with. At the end of the tutorial, I show some examples of what you can do with it. You can also find some commands in [the official manual](https://ftp.beckhoff.com/download/document/ipc/embedded-pc/embedded-pc-cx/TwinCAT_BSD_en.pdf).

Some other advantages of using TwinCAT/BSD is that it is free and requires less space. Finally, because Beckhoff has access the the code of the operating system, they do not rely on Microsoft for support. The reliance is causing issues for Windows CE, because its end of life is planned for late 2023.

If you would like to get more details on TwinCAT/BSD, check out the [official Beckhoff video](https://www.youtube.com/watch?v=az9vSr1GxE4) or read [the manual](https://ftp.beckhoff.com/download/document/ipc/embedded-pc/embedded-pc-cx/TwinCAT_BSD_en.pdf) for in-depth information.

## Virtual machines ❤️ Hyper-V
I started to look into TwinCAT/BSD, because I wanted to run some TwinCAT code locally. Earlier this was possible, but at a certain point I installed [Docker](https://www.docker.com/) which requires Hyper-V. Unfortunately, once you enable this and you try to run your TwinCAT code locally, you get an error:

{% picture 2022-tcbsd/hyperv_error.png %}

While researching how to circumvent this restriction, I came across a [Reddit post](https://www.reddit.com/r/PLC/comments/gqzyem/psa_twincat_3_hyperv_wsl_2_working_using_vmware/) which mentioned VMware works with TwinCAT 3 and Hyper-V. 
This provided me with a nice opportunity to test TwinCAT/BSD, because I didn't wanted to create a big Windows VM. Also it allowed me to answer a [StackOverflow question](https://stackoverflow.com/questions/71321786/how-can-i-use-a-local-twincat-3-runtime-with-hyper-v-enabled/71333438#71333438) 🥳. Furthermore, I found out that it also works with Virtual Box. 


## Installing Tc/BSD on Virtual Box
Installing Tc/BSD on Virtual Box is quite straight forward, thanks to [an install script](https://github.com/PTKu/TwinCAT-BSD-VM-creator) from the community. To install Tc/BSD:

1. [Download](https://www.virtualbox.org/wiki/Downloads) and install Virtual Box.
2. [Download or clone]((https://github.com/PTKu/TwinCAT-BSD-VM-creator) the install script.
1. Go to the [Beckhoff website](https://www.beckhoff.com/en-us/search-results/?q=bsd) and download the TwinCAT/BSD ISO.

    {% picture 2022-tcbsd/download_tcbsd_iso.png %}
	
2. Extract the contents of the installer script and the Tc/BSD ISO and copy the contents of both to a single folder.
3. Copy the exact filename of the Tc/BSD ISO image and open `Create-TcBsdVM.ps1` or `TwinCAT BSD VM creator.bat`, depending on which you want to use.
4. Open the installer script you want to use with a text editor. Change the ISO filename in one of the installer scripts to the one which match your downloaded ISO file. Here `"TCBSD-x64-13-55702.iso"` is the name of the ISO file I downloaded.
	-  `Create-TcBsdVM.ps1` : line 7 `$tcbsdimagefile="TCBSD-x64-13-55702.iso",`
	-  `TwinCAT BSD VM creator.bat`: line 2 `SET sourcefilename="TTCBSD-x64-13-55702.iso"`
5. Save and close the installer script. 
6. Then either double click `TwinCAT BSD VM creator.bat` to execute, or from powershell run  `Create-TcBsdVM.ps1 TcBSD-VM`. Here the first argument, `TcBSD-VM`,  is the name of the virtual machine.
7. You should see a Virtual Box window open and wait for the installer to start. This can take a minute. After that you should see the following screen. Select **TC/BSD Install** and hit enter.

	{% picture 2022-tcbsd/bsd_install.png %}	

1. Then select the 4G hard drive which was automatically created by the script and hit enter.

	{% picture 2022-tcbsd/select_harddrive.png %}	

1. Hit enter again to acknowledge the warning.

	{% picture 2022-tcbsd/warning.png %}	

1. Then it asks for you to generate a password. Type in a password and repeat it to make sure it's correct.	
1. After a few minutes the installation should be complete and you should see the following screen. Select **OK**.

	{% picture 2022-tcbsd/complete.png %}	
	
1. In the new menu select **Shutdown**.
   
   {%picture 2022-tcbsd/reboot.png %}

10. Open the **Settings > Network** of the virtual machine you just created. Now there are different options for different use cases:
	- If you plan to only use the runtime locally, enable a Network adapter 1 and set is as a **Host only adapter**
	- If you want to set up a physical connection to an outside network select **Bridged adapter**
	- If you want the TcBSD package manager to work, I found that I needed to enable both. So for adapter 1, select **Host only adapter** and enable a second adapter where you select **Bridged adapter**. 

{PIC}
12. Verify that the network connections work by starting the virtual machine, logging in and:
	- Run `ifconfig` . You should see a inet starting with `192.168.`. 
	{PIC}
	- You can also try to `ping www.beckhoff.com` and see if you get a reply. For me it took a minute before the network connection started to work. 
	{PIC}
	- In case it is not working, check your network adapter settings. Make sure they are set to automatic.
	{PIC}


## Installing Tc/BSD on VMware

Installing TwinCAT/BSD on VMware is a bit more complicated. The steps below are largely based on a [YouTube tutorial from Jakob Sagatowski](https://www.youtube.com/watch?v=H-qfWfz37Fg). Before you head over there, I did notice that I had to do a few things differently for it to work.

### Create a bootable USB

1. Install Rufus to create a bootable USB drive.
	- Install via the terminal `winget install -e --id Rufus.Rufus`.
	- Or [download manually](https://rufus.ie/) and install. You can also use the portable version, which doesn't require any installation.

1. Go to the [Beckhoff website](https://www.beckhoff.com/en-us/search-results/?q=bsd) and download the TwinCAT/BSD ISO.

    {% picture 2022-tcbsd/download_tcbsd_iso.png %}

1. Unzip the file you just downloaded. You'll probably find three files in there. The ISO one is the one you need.

1. Get yourself an USB drive which doesn't contain important information, since it is formatted in the process. I used a very old 1 GB USB drive that I bought for €30 a long time ago 😱. 

1. Open Rufus, click **SELECT** and select the ISO file you just unpacked. 

	{% picture 2022-tcbsd/rufus_select_iso.png %}

1. Then select **START**. It then reformats the USB drive and makes it a bootable USB drive with TwinCAT/BSD on it.

### Installing TwinCAT/BSD

1. Download and install VMware Workstation Player. It is free for non-commercial use.  
	- Install from the terminal with `winget install -e --id VMware.WorkstationPlayer`
	- Or [manually download](https://www.vmware.com/products/workstation-player/workstation-player-evaluation.html) and install.

2. Select the free license or enter a license number

4. Start VMware Workstation Player with Administrator rights and select create a New Virtual Machine. The admin rights are needed to access the USB drive later.

    {% picture 2022-tcbsd/create_new_vm.png %}

1. Select **I will install the operating system later**.

	{% picture 2022-tcbsd/install_os_later.png %}

5. Select "Linux" and "FreeBSD 12 64-bit"

	{% picture 2022-tcbsd/select_guest_os.png %}

6. Give your virtual machine a descriptive name and change the save location if you would like to.

	{% picture 2022-tcbsd/name_vm.png %}

1. Specify the disk capacity. I left it at the default 20 GB. Note: [Jakob](https://www.youtube.com/watch?v=H-qfWfz37Fg) removes this hard drive and adds the USB drive first and then adds a new hard drive. But, I found that if I do this, I get an error[^1] once I remove the USB drive.

	{% picture 2022-tcbsd/disk_vm.png %}

1. You see a screen summarizing the results. Click **Finish**.

1. Select the virtual machine you just created and select **Edit virtual Machine Settings**.

    {% picture 2022-tcbsd/edit_vm_settings.png %}

1. Increase the memory of the virtual machine. I set it to 1 GB. At 256 MB the virtual machine sometimes get killed unexpectedly when it runs out of memory. So, if you notice it suddenly crashing, you know what to do.

    {% picture 2022-tcbsd/vm_memory.png %}

1. Add the USB drive as a hard disk by clicking on **Add**.

	{% picture 2022-tcbsd/replace_harddisk.png %}

1. Then in the new window, select **Hard Disk** and click **Next**.
1. Select **SATA** and click **Next**.
1. Select **Use a physical disk (for advanced users)**. Yes that's you :D. Click on **Next**.
1. Now you get prompted to choose a disk. Here you want to select your USB drive, which should still be in your computer.  

	{% picture 2022-tcbsd/select_disk.png %}

1. To find out if you need to select Disk 0 or Disk 1. Type in `diskmgmt` in the start menu to open **Create and format hard disk partitions**.

	{% picture 2022-tcbsd/diskmgmt.png %}

1. 	You see a number of partitions. In my case there are two. Here Disk 1 is clearly marked as removable. So, I select disk 1 as the one I want to use as the hard drive.

	{% picture 2022-tcbsd/disk0_disk1.png %}

1. Now go back to the virtual machine settings and select "PhysicalDrive1" and click  "Next" and finally click "Finish".

	{% picture 2022-tcbsd/select_disk1.png %}
	
1. There is one final setting you need to change. If you happen to have a Pro version of VMware, you can set the firmware type under the virtual machine settings under **Options > Advanced > Firmware type**. Make sure to set it to **UEFI**. If you have [the Player version](https://stackoverflow.com/a/71333438/6329629), you:
	1.  Locate the directory of the virtual machine. You can find its location under **Edit virtual machine settings > Hard Disk (SCSI)**
		
	     {% picture 2022-tcbsd/vm_location.png %}
		 
	1. Open the .vmx file in the VM directory with a text editor.
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
As I mentioned earlier, Tc/BSD doesn't have a desktop environment. Most things are done from the terminal. However, the device manager has a GUI. To access it, you first need to find out the IP of the the virtual machine. The IP can be found by typing in `ifconfig` and the IP is then right after `inet`.

{% picture 2022-tcbsd/ifconfig.png %}

Then open your browser and type in the IP address you found. So for me it is 	`https://192.168.126.128`. Maybe a warning shows up, you need to accept the risk and continue.

{% picture  2022-tcbsd/firefox_accept_risk.png %}

From here you can log into the device manager with the username `Administrator` and the password you set earlier. The device manager shows all kinds of information about the state of the hardware and the software.

{% picture 2022-tcbsd/device_manager.png %}

## Web console
Next to a device manager, the `https://192.168.126.128` page also has a link to a web console. The console shows the same as if you logged into the virtual machine directly, but the web version has a better interface. Mainly because it enables scrolling[^2] and copy pasting commands is easier.

##  Installing packages
As I mentioned earlier, there is not pretty GUI waiting for you. Most things are done from the terminal. One of the things you can do is install packages. Package managers are a very useful feature in UNIX like operating systems. Although Windows is now finally also joining with `winget`.

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

With your PLC code running it is now time to look at how to publish the HMI. 

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

[^1]: The error message:
	```
	No suitable dump device was found. 
	Setting hostuuid: 60e34d56-aa3b-ddb2-f508-cbe7cce89d64. 
	Setting hostid: 0x0789008c. 
	swapon: /dev/ada1p2: No such file or directory Starting file system checks: Can't open `/dev/ada1p1' 
	/dev/ada1p1: UNEXPECTED INCONSISTENCY; RUN fsck_msdosfs MANUALLY. 
	THE FOLLOWING FILE SYSTEM HAD AN UNEXPECTED INCONSISTENCY: 
		msdosfs: /dev/ada1p1 (/boot/efi) 
	Automatic file system check failed; help! 
	ERROR: ABORTING BOOT (sending SIGTERM to parent)! 
	2022-06-04T08:26:05.670175+00:00 - init 1 - - /bin/sh on /etc/rc terminated abnormally, going to single user mode 
	Enter full pathname of shell or RETURN for /bin/sh: 
	root@:/ 
	```

[^2]: While playing with TcBSD in the virtual machine I ran into an annoying issue: I couldn't scroll up. For example, when I do `TcHmiSrv --help`, the help text is to long for the console screen. At first I couldn't figure out how to scroll back up, because there is no scroll bar, <kbd>↑</kbd> bring up the previous command and <kbd>Page Up</kbd> just shows a `~`.  After consulting Google, I found out that is where the <kbd>Scroll Lock</kbd> key is for! I always wondered what this button did. Note: If you're on a laptop without a Scroll Lock key, you can [remap one of the existing key combo's](https://serverfault.com/a/420341). 
		![scroll lock enables scrolling in the TcBSD terminal window](/assets/2022-tcbsd/scroll_lock_magic.gif)
