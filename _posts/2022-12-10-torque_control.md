---
layout: post
title: "How to use MC_TorqueControl?"
category: twincat
toc: true
---

[`MC_TorqueControl`](https://infosys.beckhoff.com/content/1033/tcplclib_tc2_mc2/7617393803.html?id=6677792901421113137) is a method to force or torque control an axis. In this article, I show how to set up a simple project and use this function.

*There is also a [YouTube video](https://www.youtube.com/watch?v=Lw-yW4OdtZA) by Electrical Automation Hands-On who explains these steps.*

## What is `MC_TorqueControl`?

Other than the name suggests, this method can be used for both linear axes as a force controller or rotational axis as a torque controller. Thus, you can set a force or torque and the drive ensures that your motor keeps that force or torque. To avoid saying torque _and_ force each time, I refer to both modes when I mention torque control.

Torque control is always used when you move an axis, but you don't notice it. Depending on the selected mode, between one and three different cascaded PID controllers are used.

Below is the diagram from the **Tune drive** tab of Drive Manager 2. When you use torque control, `Tset` is directly fed into the current controller. But once you select the velocity mode, the velocity controller block connects to the current controller one. Then `Tset` is no longer fed into the current controller, but instead, the output of the velocity controller is directly fed into it. A similar story occurs when you select position control. Then the output of the position controller connects to the velocity controller, ignoring the `Vset`.

{% picture 2022-torque-control/pid_torque_control.png %}

## How to use torque control?

Make sure you have:
 - [Drive Manager 2](https://www.beckhoff.com/en-en/products/automation/twincat/texxxx-twincat-3-engineering/te5950.html) installed
 - TwinCAT 3.1.4024.15 for both XAE (engineering) and XAR (runtime) or later
 - For AX5000: firmware 2.14 or later
 - For AX8000: firmware 1.03 Build 002 or later.

Then, follow these steps to use torque control:

1. In the **Advanced > Slot settings** tab, select **VelocityControl2** for the **VelocityControlSlot** of the respective axis. This enables the velocity limit.[^1]
	{% picture 2022-torque-control/velocity_limit.png %}
2. In the **Parameter list**, select **TorqueMightBeReducedToZero (1)**. This is another setting to enable the velocity limit.
    {% picture 2022-torque-control/speed_limit.png %}
4. In the **Process data** tab, expand the **Ch A operation** and select **Cyclic_synchronous_torque_mode_CST (10)** for virtual operation mode 0. This adds the necessary process data objects, such as the target torque and the actual measured torque. It also enables you to switch between position and torque control.
    {% picture 2022-torque-control/torque_mode.png %}
1. In the **MOTION > NC- TASK1 SAF > Axis > {your axis} > Encoder** and **Drive** tabs, turn on Time compensation. This setting enables smooth switching between position and torque mode. That is because, in torque mode, the NC axis writes permanent actual positions into the set position variable. Due to a dead time, the actual is delayed by four cycles. This dead time can then be compensated by enabling time compensation. This is relevant when you switch back into position mode.
    {% picture 2022-torque-control/time_compensation_encoder.png %}
    {% picture 2022-torque-control/time_compensation_drive.png %}

After applying the settings, you can add the following code to force control an axis. Here
 - `someAxis`: is the axis you want to control.
 - `forceOptions`: defines a starting value of the torque when the `force` function block is activated. This ensures a smooth transition from the previous mode.
 - `targetForce`: the torque you want to apply.
 - `TORQUE_RAMP`: defines a maximum ramp for the torque.
 - `VELOCITY_LIMIT`: Limit the velocity.
 - `ContinuousUpdate`: If `TRUE`, then changes to `targetForce` are immediately applied by torque control, rather than needing to toggle `force.Execute`.[^2]
Then you activate force control by setting `forceMode` to `TRUE`.

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

After calling another motion function block, the operation mode is automatically switched back from torque mode into position mode. For example `MC_MoveVelocity`,  `MC_MoveAbsolute`, `MC_Halt` etc.

Some final notes:
- Lag monitoring switches off automatically if you use `MC_TorqueControl` with the AX5000.
-  `MC_TorqueControl` works with all SoE or CoE drives, but maybe the velocity limit function doesn't work.

[^1]: Velocity limits work with the AX5000 and the AX8000.  But, because this limit is a feature inside the AX firmware it doesn't work for the EL, ELM, or AMI.
[^2]: [For continuous force mode to work, the TwinCAT runtime needs to be at version >=4024.35](https://cookncode.com/TwinCatChangelog/tc3/#features)
