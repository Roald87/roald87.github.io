---
layout: post
title: "How to use MC_TorqueControl?"
category: twincat
toc: true
---

[`MC_TorqueControl`](https://infosys.beckhoff.com/content/1033/tcplclib_tc2_mc2/7617393803.html?id=6677792901421113137) is a slightly hidden and badly documented method to force or torque control an axis. In this article I demonstrate how to set up a simple project and use this function.

## What is `MC_TorqueControl`

Differently than the name suggests, this method can be used for both linear axis as a force controller or for rotational axis as a torque controller. Thus, you can set a force or a torque and the drive makes sure your motor keeps that force or torque. To prevent myself from saying torque _and_ force each time, I refer to both modes when I mention torque control. 

Torque control is actually always used when you move an axis, but normally you don't really notice it. Depending on the selected mode, between one and three different cascaded PID controllers are used. 

Below is the diagram from the "Tune drive" tab of the Drive Manager 2. When you use torque control, Tset is directly fed into the current controller. But once you select the velocity mode, a connection is made between the velocity controller block and the current controller one. Then the Tset is no longer fed into the current controller, but instead the output of the velocity controller is directly fed into it. A similar story if you select position control. Then the output of the position controller is connected to the velocity controller, ignoring the Vset.

![[pid_torque_control.png]]

## How to use torque control?

To use torque control, you need to apply a few settings. For this you need to have the [Drive Manager 2](https://www.beckhoff.com/en-en/products/automation/twincat/texxxx-twincat-3-engineering/te5950.html) installed. Install it if you do not already have it. Make sure you download version 2 and not the first one.

1. Select VelocityControl2 for the VelocityControlSlot in the tab **Advanced > Slot settings** of the respective axis. This setting enables the velocity limit that you use later on when calling the function block.
	![[velocity_limit.png]]
2. Switch to the **Parameter list** and select TorqueMightBeReducedToZero (1). This is another setting that needs to be set for the velocity limit to work.
    ![[speed_limit.png]]
4. Switch to the **Process data** tab, expand the Ch A operation and select Cyclic_synchronous_torque_mode_CST (10) for virtual operation mode 0. Once selected this option adds the necessary process data objects (PDO's) such as the target torque and the actual measured torque. Furthermore, because position control is still selected as the mode of operation, it means that the axis is always in position control unless the torque control function block is called. Hence it enables you to switch between both modes.
    ![[torque_mode.png]]
1. Now go to **MOTION > NC- TASK1 SAF > Axis > {your axis} > Encoder** and the tab **Time Compensation**. Turn on the Time compensation. Do the same for the **Drive**. These settings enable a smooth switching between position and torque mode.
    ![[time_compensation_encoder.png]]
    ![[time_compensation_drive.png]]

With the options set, it is time to add the necessary code. Below I show only the code needed for the force control. First we need an axis to control, in this case `someAxis`. Then in `forceOptions` we can set the start value of the torque when the `force` function block is activated. This is the `ActTorque` of the axis, to facilitate a smooth transition from the previous mode. The you can set a `targetForce` and limit the `TORQUE_RAMP` and give it a `VELOCITY_LIMIT`. Finally you activate the force control by setting `forceMode` to `TRUE`. I also set `ContinousUpdate` to `TRUE`, such that changes in `targetForce` are immediately taken over by the torque control, instead of needing to toggle `force.Execute`.[^1]

```
PROGRAM MAIN
VAR
    someAxis : Tc2_MC2.AXIS_REF; 
    forceOptions : Tc2_MC2.ST_TorqueControlOptions := (EnableManualTorqueStartValue := TRUE); 
    force : Tc2_MC2.MC_TorqueControl;
    forceMode : BOOL;
    targetForce : LREAL := 10;
END_VAR
VAR CONSTANT
	TORQUE_RAMP : LREAL := 50_000;
	VELOCITY_LIMIT : LREAL := 10_000;
END_VAR

forceOptions.ManualTorqueStartValue := someAxis.NcToPlc.ActTorque;

force(
	Execute:=forceMode,
    ContinuousUpdate:=forceMode,
    Relative:=FALSE,
    Torque:=targetForce,
    Axis:=someAxis,
    Options:=forceOptions,
    TorqueRamp:=TORQUE_RAMP,
    VelocityLimitHigh:=VELOCITY_LIMIT,
    VelocityLimitLow:=VELOCITY_LIMIT * -1,
);
```

After calling another motion function block, the operation mode is automatically switched back from torque mode into position mode. For example `MC_MoveVelocity`,  `MC_MoveAbsolute`, `MC_Halt` etc. Note that when `MC_TorqueControl` is used with AX5xxx, lag monitoring is switched off automatically


[^1]: For continuous force mode to work, the TwinCAT runtime needs to be at version >=4024.35.