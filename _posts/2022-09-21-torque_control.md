---
layout: post
title: "How to use MC_TorqueControl?"
category: twincat
toc: true
---

`MC_TorqueControl` can switch servo operation mode from position control to torque control on the fly. Furthermore within torque mode, a speed limitation is available, which is very important for winding axis.

VelocityControl2 must be loaded for speed limitation in TorqueMode

Choosing Virtual operation mode 0 = CST will add and link all needed process data automatically

Speed limitation within torque mode : 0x60CA = 1

For a smooth switching from position mode into torque mode Time Compensation has to be enabled

Torque Command is starting for first cycle with actual torque smooth transition

```
VAR
    excitationAxis : TcoDrivesBeckhoff.TcoAxisRef; 
    forceOptions : Tc2_MC2.ST_TorqueControlOptions; 
END_VAR

forceOptions.EnableManualTorqueStartValue := TRUE;
forceOptions.ManualTorqueStartValue := excitationAxis.NcToPlc.ActTorque;

forceExcitation(
    Torque:=targetForce,
    Axis:=excitationAxis,
    Options:=forceOptions,
    TorqueRamp:=TORQUE_RAMP,
    VelocityLimitHigh:=VELOCITY_LIMIT,
    VelocityLimitLow:=VELOCITY_LIMIT * -1,
);
```

By calling other motion function blocks , operation mode is automatically switched back from torque mode into position mode
- `MC_MoveVelocity`
- `MC_MoveAbsolute`
- `MC_Stop`
- `MC_Halt`
- etc.

During AX5 is running in torque mode and `MC_TorqueControl` is executed, lag monitoring is switched off automatically