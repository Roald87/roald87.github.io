---
layout: post
title: "How to use MC_TorqueControl?"
category: twincat
toc: true
---

[`MC_TorqueControl`](https://infosys.beckhoff.com/content/1033/tcplclib_tc2_mc2/7617393803.html?id=6677792901421113137) is a method to force or torque control an axis. In this article I show how to set up a simple project and use this function.

## What is `MC_TorqueControl`

Other than the name suggests, this method can be used for both linear axis as a force controller or for rotational axis as a torque controller. Thus, you can set a force or a torque and the drive ensures that your motor keeps that force or torque. To avoid saying torque _and_ force each time, I refer to both modes when I mention torque control.

Torque control is actually always used when you move an axis, but you don't notice it. Depending on the selected mode, between one and three different cascaded PID controllers are used.

Below is the diagram from the **Tune drive** tab of the Drive Manager 2. When you use torque control, `Tset` is directly fed into the current controller. But once you select the velocity mode, the velocity controller block connects to the current controller one. Then `Tset` is no longer fed into the current controller, but instead the output of the velocity controller is directly fed into it. A similar story occurs when you select position control. Then the output of the position controller connects to the velocity controller, ignoring the `Vset`.

![[pid_torque_control.png]]

## How to use torque control?

First, make sure you have the [Drive Manager 2](https://www.beckhoff.com/en-en/products/automation/twincat/texxxx-twincat-3-engineering/te5950.html) installed. Then, follow these steps to use torque control:

1. In the **Advanced > Slot settings** tab, select **VelocityControl2** for the **VelocityControlSlot** of the respective axis. This enables the velocity limit.
	![[velocity_limit.png]]
2. In the **Parameter list**, select **TorqueMightBeReducedToZero (1)**. This is another setting to enable the velocity limit.
    ![[speed_limit.png]]
4. In the **Process data** tab, expand the **Ch A operation** and select **Cyclic_synchronous_torque_mode_CST (10)** for virtual operation mode 0. This adds the necessary process data objects, such as the target torque and the actual measured torque. It  also enables you to switch between position and torque control.
    ![[torque_mode.png]]
1. In the **MOTION > NC- TASK1 SAF > Axis > {your axis} > Encoder** and **Drive** tabs, turn on Time compensation. These settings enable a smooth switching between position and torque mode.
    ![[time_compensation_encoder.png]]
    ![[time_compensation_drive.png]]

After applying the settings, you can add the necessary code to control the axis. The code below shows the necessary code for force control. First, I define the axis that I want to control as `someAxis`. In `forceOptions`, I set the starting value of the torque when the `force` function block is activated. I also set a `targetForce`, limit the `TORQUE_RAMP`, and give it a `VELOCITY_LIMIT`. Finally, I activate force control by setting `forceMode` to `TRUE`. I also set `ContinuousUpdate` to `TRUE` so that changes to `targetForce` are immediately applied by the torque control, rather than needing to toggle `force.Execute`.[^1]

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

After calling another motion function block, the operation mode is automatically switched back from torque mode into position mode. For example `MC_MoveVelocity`,  `MC_MoveAbsolute`, `MC_Halt` etc. Note that when `MC_TorqueControl` is used with the AX5xxx, lag monitoring switches off automatically

[^1]: For continuous force mode to work, the TwinCAT runtime needs to be at version >=4024.35.